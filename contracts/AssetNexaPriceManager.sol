// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IAssetNexaPriceManager.sol";
import "../interfaces/IAssetNexaRWA.sol";
import "../libraries/AssetTypes.sol";
import "../libraries/AssetErrors.sol";

/**
 * @title AssetNexaPriceManager
 * @notice Timelocked multi-role governance engine for adjusting primary sale prices of unsold RWA units
 * @dev Protects already-sold units and prevents unilateral price adjustments without compliance approval and timelock.
 */
contract AssetNexaPriceManager is IAssetNexaPriceManager, AccessControl, Pausable {
    bytes32 public constant PRICE_PROPOSER_ROLE = keccak256("PRICE_PROPOSER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant PRICE_EXECUTOR_ROLE = keccak256("PRICE_EXECUTOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MIN_TIMELOCK = 1 hours;
    uint256 public constant MAX_TIMELOCK = 30 days;

    uint256 public timelockDuration; // Default: 48 hours (172800 seconds)

    uint256 private _proposalCounter;
    mapping(uint256 => AssetTypes.PriceProposal) private _proposals;
    mapping(address => uint256[]) private _assetProposals;

    /**
     * @notice Constructor initializing Price Manager roles and timelock
     * @param admin Initial administrator
     * @param initialTimelock Timelock delay in seconds (e.g. 48 hours = 172800)
     */
    constructor(address admin, uint256 initialTimelock) {
        if (admin == address(0)) revert AssetErrors.ZeroAddress();
        if (initialTimelock < MIN_TIMELOCK || initialTimelock > MAX_TIMELOCK) {
            revert AssetErrors.InvalidAssetParameters();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PRICE_PROPOSER_ROLE, admin);
        _grantRole(COMPLIANCE_ROLE, admin);
        _grantRole(PRICE_EXECUTOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        timelockDuration = initialTimelock;
    }

    // =========================================================================
    // PRICE GOVERNANCE WORKFLOW
    // =========================================================================

    /**
     * @notice Step 1: Propose a new primary unit price for unsold units of an RWA asset
     * @param assetToken Target RWA contract
     * @param newPrice Proposed price in payment token units
     */
    function proposePriceChange(
        address assetToken,
        uint256 newPrice
    ) external onlyRole(PRICE_PROPOSER_ROLE) whenNotPaused returns (uint256 proposalId) {
        if (assetToken == address(0)) revert AssetErrors.ZeroAddress();
        if (newPrice == 0) revert AssetErrors.ZeroPrice();

        IAssetNexaRWA rwa = IAssetNexaRWA(assetToken);
        uint256 currentPrice = rwa.primaryPrice();
        if (newPrice == currentPrice) revert AssetErrors.PriceUnchanged();

        _proposalCounter += 1;
        proposalId = _proposalCounter;

        _proposals[proposalId] = AssetTypes.PriceProposal({
            proposalId: proposalId,
            assetToken: assetToken,
            oldPrice: currentPrice,
            newPrice: newPrice,
            proposer: msg.sender,
            approver: address(0),
            proposedAt: block.timestamp,
            approvedAt: 0,
            timelockExpiry: 0,
            executedAt: 0,
            status: AssetTypes.ProposalStatus.PENDING
        });

        _assetProposals[assetToken].push(proposalId);

        emit PriceChangeProposed(
            proposalId,
            assetToken,
            currentPrice,
            newPrice,
            msg.sender,
            block.timestamp
        );

        return proposalId;
    }

    /**
     * @notice Step 2: Compliance verification & approval of the proposed price change
     * @dev Enforces segregation of duties: Proposer cannot approve their own proposal!
     * @param proposalId Target proposal ID
     */
    function approvePriceChange(
        uint256 proposalId
    ) external onlyRole(COMPLIANCE_ROLE) whenNotPaused {
        AssetTypes.PriceProposal storage prop = _proposals[proposalId];
        if (prop.proposalId == 0) revert AssetErrors.ProposalNotFound(proposalId);
        if (prop.status != AssetTypes.ProposalStatus.PENDING) {
            revert AssetErrors.ProposalNotPending(proposalId);
        }
        if (prop.proposer == msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert AssetErrors.ProposerCannotApprove(msg.sender);
        }

        prop.approver = msg.sender;
        prop.approvedAt = block.timestamp;
        prop.timelockExpiry = block.timestamp + timelockDuration;
        prop.status = AssetTypes.ProposalStatus.APPROVED;

        emit PriceChangeApproved(proposalId, prop.assetToken, msg.sender, prop.timelockExpiry);
    }

    /**
     * @notice Step 3: Execute approved price change after timelock maturity
     * @param proposalId Target proposal ID
     */
    function executePriceChange(
        uint256 proposalId
    ) external onlyRole(PRICE_EXECUTOR_ROLE) whenNotPaused {
        AssetTypes.PriceProposal storage prop = _proposals[proposalId];
        if (prop.proposalId == 0) revert AssetErrors.ProposalNotFound(proposalId);
        if (prop.status != AssetTypes.ProposalStatus.APPROVED) {
            revert AssetErrors.ProposalNotApproved(proposalId);
        }
        if (block.timestamp < prop.timelockExpiry) {
            revert AssetErrors.TimelockNotExpired(block.timestamp, prop.timelockExpiry);
        }

        prop.status = AssetTypes.ProposalStatus.EXECUTED;
        prop.executedAt = block.timestamp;

        // Apply new price to RWA contract
        IAssetNexaRWA(prop.assetToken).updatePrimaryPrice(prop.newPrice);

        emit PriceChangeExecuted(
            proposalId,
            prop.assetToken,
            prop.oldPrice,
            prop.newPrice,
            msg.sender
        );
    }

    /**
     * @notice Cancel a pending or approved proposal before execution
     * @param proposalId Target proposal ID
     * @param reason Explanation for cancellation
     */
    function cancelPriceChange(
        uint256 proposalId,
        string calldata reason
    ) external whenNotPaused {
        AssetTypes.PriceProposal storage prop = _proposals[proposalId];
        if (prop.proposalId == 0) revert AssetErrors.ProposalNotFound(proposalId);
        if (prop.status == AssetTypes.ProposalStatus.EXECUTED || prop.status == AssetTypes.ProposalStatus.CANCELLED) {
            revert AssetErrors.ProposalAlreadyExecuted(proposalId);
        }

        if (prop.proposer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && !hasRole(COMPLIANCE_ROLE, msg.sender)) {
            revert AssetErrors.Unauthorized(msg.sender, DEFAULT_ADMIN_ROLE);
        }

        prop.status = AssetTypes.ProposalStatus.CANCELLED;

        emit PriceChangeCancelled(proposalId, prop.assetToken, msg.sender, reason);
    }

    /**
     * @notice Configure timelock duration
     */
    function setTimelockDuration(uint256 newDurationSeconds) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newDurationSeconds < MIN_TIMELOCK || newDurationSeconds > MAX_TIMELOCK) {
            revert AssetErrors.InvalidAssetParameters();
        }
        uint256 old = timelockDuration;
        timelockDuration = newDurationSeconds;
        emit TimelockDurationUpdated(old, newDurationSeconds);
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function getProposal(uint256 proposalId) external view returns (AssetTypes.PriceProposal memory) {
        return _proposals[proposalId];
    }

    function totalProposalsCount() external view returns (uint256) {
        return _proposalCounter;
    }

    function getAssetProposals(address assetToken) external view returns (uint256[] memory) {
        return _assetProposals[assetToken];
    }

    // =========================================================================
    // EMERGENCY PAUSE
    // =========================================================================

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
