// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IAssetNexaYield.sol";
import "../interfaces/IAssetNexaRWA.sol";
import "../libraries/AssetTypes.sol";
import "../libraries/AssetErrors.sol";

/**
 * @title AssetNexaYield
 * @notice Rental income and yield distribution vault based on verifiable on-chain record date snapshots
 * @dev Distributes payment tokens proportionally to RWA unit holders based on ownership at distribution record date.
 */
contract AssetNexaYield is IAssetNexaYield, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 private constant PRECISION = 1e18;

    // Distribution tracking
    uint256 private _distributionCounter;
    mapping(uint256 => AssetTypes.Distribution) private _distributions;
    mapping(uint256 => uint256) private _distributionSnapshotIds;
    mapping(uint256 => mapping(address => bool)) private _hasClaimed;
    mapping(address => uint256[]) private _assetDistributionMap;

    /**
     * @notice Constructor initializing yield distribution manager
     * @param admin Vault administrator
     */
    constructor(address admin) {
        if (admin == address(0)) revert AssetErrors.ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DISTRIBUTOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // =========================================================================
    // DISTRIBUTION CREATION
    // =========================================================================

    /**
     * @notice Fund and create a new income distribution for an RWA asset
     * @param assetToken Target RWA token contract
     * @param totalAmount Total payment tokens to distribute
     */
    function createDistribution(
        address assetToken,
        uint256 totalAmount
    ) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant whenNotPaused returns (uint256 distributionId) {
        if (assetToken == address(0)) revert AssetErrors.ZeroAddress();
        if (totalAmount == 0) revert AssetErrors.InvalidDistributionAmount();

        IAssetNexaRWA rwa = IAssetNexaRWA(assetToken);
        uint256 currentSupply = rwa.totalSupply();
        if (currentSupply == 0) revert AssetErrors.ZeroSupply();

        // 1. Take official record date snapshot on the RWA contract
        uint256 snapshotId = rwa.snapshot();

        // 2. Transfer distributable payment tokens from distributor into this contract
        AssetTypes.AssetParameters memory params = rwa.assetParameters();
        IERC20 paymentToken = IERC20(params.paymentToken);
        paymentToken.safeTransferFrom(msg.sender, address(this), totalAmount);

        // 3. Calculate per-unit yield with 18 decimals fixed point precision
        uint256 amountPerUnit = (totalAmount * PRECISION) / currentSupply;
        if (amountPerUnit == 0) revert AssetErrors.InvalidDistributionAmount();

        _distributionCounter += 1;
        distributionId = _distributionCounter;

        _distributions[distributionId] = AssetTypes.Distribution({
            distributionId: distributionId,
            assetId: params.assetId,
            assetToken: assetToken,
            totalAmount: totalAmount,
            snapshotSupply: currentSupply,
            amountPerUnit: amountPerUnit,
            recordTimestamp: block.timestamp,
            creationTimestamp: block.timestamp,
            active: true
        });

        _distributionSnapshotIds[distributionId] = snapshotId;
        _assetDistributionMap[assetToken].push(distributionId);

        emit DistributionCreated(
            distributionId,
            params.assetId,
            assetToken,
            totalAmount,
            currentSupply,
            amountPerUnit,
            snapshotId,
            block.timestamp
        );

        return distributionId;
    }

    // =========================================================================
    // YIELD CLAIMING
    // =========================================================================

    /**
     * @notice Claim rental income for a single distribution
     * @param distributionId Target distribution ID
     */
    function claimDistribution(
        uint256 distributionId
    ) external nonReentrant whenNotPaused returns (uint256 claimedAmount) {
        return _processClaim(distributionId, msg.sender);
    }

    /**
     * @notice Batch claim multiple distributions in a single transaction
     * @param distributionIds Array of distribution IDs to claim
     */
    function batchClaimDistributions(
        uint256[] calldata distributionIds
    ) external nonReentrant whenNotPaused returns (uint256 totalClaimed) {
        for (uint256 i = 0; i < distributionIds.length; i++) {
            uint256 claimed = _processClaim(distributionIds[i], msg.sender);
            totalClaimed += claimed;
        }
    }

    /**
     * @notice Internal distribution claim computation and payment execution
     */
    function _processClaim(uint256 distributionId, address investor) internal returns (uint256) {
        AssetTypes.Distribution memory dist = _distributions[distributionId];
        if (!dist.active) revert AssetErrors.DistributionNotFound(distributionId);
        if (_hasClaimed[distributionId][investor]) {
            revert AssetErrors.DistributionAlreadyClaimed(distributionId, investor);
        }

        uint256 snapshotId = _distributionSnapshotIds[distributionId];
        IAssetNexaRWA rwa = IAssetNexaRWA(dist.assetToken);

        uint256 qualifyingUnits = rwa.balanceOfAt(investor, snapshotId);
        if (qualifyingUnits == 0) {
            revert AssetErrors.NoQualifyingBalance(0);
        }

        uint256 claimAmount = (qualifyingUnits * dist.amountPerUnit) / PRECISION;
        if (claimAmount == 0) revert AssetErrors.ZeroClaimable();

        // Mark as claimed before external call (Checks-Effects-Interactions)
        _hasClaimed[distributionId][investor] = true;

        AssetTypes.AssetParameters memory params = rwa.assetParameters();
        IERC20(params.paymentToken).safeTransfer(investor, claimAmount);

        emit DistributionClaimed(
            distributionId,
            dist.assetToken,
            investor,
            claimAmount,
            qualifyingUnits
        );

        return claimAmount;
    }

    /**
     * @notice Deactivate a distribution in case of emergency
     */
    function deactivateDistribution(uint256 distributionId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!_distributions[distributionId].active) revert AssetErrors.DistributionNotFound(distributionId);
        _distributions[distributionId].active = false;
        emit DistributionDeactivated(distributionId, msg.sender);
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function getDistribution(uint256 distributionId) external view returns (AssetTypes.Distribution memory) {
        return _distributions[distributionId];
    }

    function getClaimableAmount(uint256 distributionId, address investor) external view returns (uint256) {
        AssetTypes.Distribution memory dist = _distributions[distributionId];
        if (!dist.active || _hasClaimed[distributionId][investor]) return 0;

        uint256 snapshotId = _distributionSnapshotIds[distributionId];
        IAssetNexaRWA rwa = IAssetNexaRWA(dist.assetToken);
        uint256 qualifyingUnits = rwa.balanceOfAt(investor, snapshotId);

        return (qualifyingUnits * dist.amountPerUnit) / PRECISION;
    }

    function hasClaimed(uint256 distributionId, address investor) external view returns (bool) {
        return _hasClaimed[distributionId][investor];
    }

    function getAssetDistributionCount(address assetToken) external view returns (uint256) {
        return _assetDistributionMap[assetToken].length;
    }

    function getAssetDistributionIds(address assetToken) external view returns (uint256[] memory) {
        return _assetDistributionMap[assetToken];
    }

    function totalDistributionsCount() external view returns (uint256) {
        return _distributionCounter;
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
