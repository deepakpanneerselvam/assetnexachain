// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IAssetNexaRWA.sol";
import "../interfaces/IAssetNexaCompliance.sol";
import "../libraries/AssetTypes.sol";
import "../libraries/AssetErrors.sol";

/**
 * @title AssetNexaRWA
 * @notice Core fractional Real-World Asset (RWA) token contract with compliance gating and snapshotting
 * @dev Enforces immutable supply cap, compliance registry hooks on every transfer, and governed lifecycle states.
 */
contract AssetNexaRWA is IAssetNexaRWA, ERC20, AccessControl, Pausable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PRICE_MANAGER_ROLE = keccak256("PRICE_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");

    // Asset state parameters
    AssetTypes.AssetParameters private _params;
    AssetTypes.AssetStatus private _status;

    // Compliance Registry contract
    address private _complianceRegistry;

    // Snapshot tracking
    uint256 private _currentSnapshotId;
    mapping(uint256 => mapping(address => uint256)) private _accountBalancesAtSnapshot;
    mapping(uint256 => uint256) private _totalSupplyAtSnapshot;
    mapping(uint256 => bool) private _snapshotExists;

    /**
     * @notice Constructor initializing tokenized RWA asset with immutable supply cap
     */
    constructor(
        AssetTypes.AssetParameters memory params,
        address complianceRegistryAddress,
        address admin
    ) ERC20(params.name, params.symbol) {
        if (admin == address(0) || complianceRegistryAddress == address(0)) {
            revert AssetErrors.ZeroAddress();
        }
        if (params.totalSupplyCap == 0) revert AssetErrors.ZeroSupply();
        if (params.initialPrice == 0) revert AssetErrors.ZeroPrice();

        _params = params;
        _complianceRegistry = complianceRegistryAddress;
        _status = AssetTypes.AssetStatus.DRAFT;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, params.issuer != address(0) ? params.issuer : admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(SNAPSHOT_ROLE, admin);
    }

    /**
     * @notice Returns 0 decimals so that 1 token unit represents exactly 1 indivisible ownership unit
     */
    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    // =========================================================================
    // LIFECYCLE & GOVERNANCE
    // =========================================================================

    /**
     * @notice Update asset lifecycle status with strict transition validation
     * @param newStatus Target status
     */
    function setStatus(AssetTypes.AssetStatus newStatus) external onlyRole(DEFAULT_ADMIN_ROLE) {
        AssetTypes.AssetStatus oldStatus = _status;
        if (oldStatus == newStatus) revert AssetErrors.InvalidStateTransition(uint8(oldStatus), uint8(newStatus));

        // State machine rules
        if (oldStatus == AssetTypes.AssetStatus.CLOSED) {
            revert AssetErrors.InvalidStateTransition(uint8(oldStatus), uint8(newStatus));
        }

        if (oldStatus == AssetTypes.AssetStatus.DRAFT && newStatus != AssetTypes.AssetStatus.PENDING_APPROVAL && newStatus != AssetTypes.AssetStatus.PAUSED) {
            revert AssetErrors.InvalidStateTransition(uint8(oldStatus), uint8(newStatus));
        }

        _status = newStatus;
        emit AssetStatusChanged(oldStatus, newStatus, msg.sender);
    }

    /**
     * @notice Update primary sale price per unsold unit (called exclusively by AssetNexaPriceManager)
     * @param newPrice New price per unit in payment token base units
     */
    function updatePrimaryPrice(uint256 newPrice) external onlyRole(PRICE_MANAGER_ROLE) {
        if (newPrice == 0) revert AssetErrors.ZeroPrice();
        uint256 oldPrice = _params.initialPrice;
        _params.initialPrice = newPrice;
        emit AssetPriceUpdated(oldPrice, newPrice, msg.sender);
    }

    /**
     * @notice Update legal and property metadata URI (IPFS / Arweave prospectus)
     */
    function updateMetadataURI(string calldata newURI) external onlyRole(ISSUER_ROLE) {
        _params.metadataURI = newURI;
        emit AssetMetadataUpdated(newURI, msg.sender);
    }

    /**
     * @notice Update the compliance registry contract reference
     */
    function setComplianceRegistry(address newCompliance) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newCompliance == address(0)) revert AssetErrors.ZeroAddress();
        address oldCompliance = _complianceRegistry;
        _complianceRegistry = newCompliance;
        emit ComplianceRegistryUpdated(oldCompliance, newCompliance);
    }

    // =========================================================================
    // MINTING & BURNING
    // =========================================================================

    /**
     * @notice Mint units to investor upon primary payment settlement
     * @param to Investor address
     * @param amount Units to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (_status != AssetTypes.AssetStatus.FUNDING) {
            revert AssetErrors.AssetNotActive(uint8(_status));
        }
        if (totalSupply() + amount > _params.totalSupplyCap) {
            revert AssetErrors.SupplyCapExceeded(amount, _params.totalSupplyCap - totalSupply());
        }

        _mint(to, amount);
        emit UnitsMinted(to, amount, amount * _params.initialPrice);

        // Auto-transition to FUNDED if supply cap is reached
        if (totalSupply() == _params.totalSupplyCap) {
            _status = AssetTypes.AssetStatus.FUNDED;
            emit AssetStatusChanged(AssetTypes.AssetStatus.FUNDING, AssetTypes.AssetStatus.FUNDED, msg.sender);
        }
    }

    /**
     * @notice Burn units for token redemption or liquidation
     */
    function burn(address from, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(from, amount);
        emit UnitsBurned(from, amount);
    }

    // =========================================================================
    // SNAPSHOT FUNCTIONALITY
    // =========================================================================

    /**
     * @notice Create an ownership record snapshot for yield distributions
     * @return snapshotId Sequential ID of the created snapshot
     */
    function snapshot() external returns (uint256) {
        if (!hasRole(SNAPSHOT_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert AssetErrors.Unauthorized(msg.sender, SNAPSHOT_ROLE);
        }
        _currentSnapshotId += 1;
        uint256 currentId = _currentSnapshotId;
        _snapshotExists[currentId] = true;
        _totalSupplyAtSnapshot[currentId] = totalSupply();

        emit SnapshotCreated(currentId);
        return currentId;
    }

    // =========================================================================
    // COMPLIANCE-GATED TRANSFER HOOKS
    // =========================================================================

    /**
     * @dev OpenZeppelin v5 ERC20 internal transfer hook override
     * Enforces compliance verification before balance changes and updates snapshots
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override whenNotPaused {
        // Enforce compliance on all transfers (mint, burn, and peer-to-peer)
        if (_complianceRegistry != address(0)) {
            (bool allowed, string memory reason) = IAssetNexaCompliance(_complianceRegistry).canTransfer(from, to, value);
            if (!allowed) {
                revert AssetErrors.ComplianceTransferBlocked(from, to, value);
            }
        }

        // Capture snapshot balances before modification if a snapshot has been taken
        if (_currentSnapshotId > 0) {
            uint256 currentSnap = _currentSnapshotId;
            if (from != address(0) && _accountBalancesAtSnapshot[currentSnap][from] == 0 && balanceOf(from) > 0) {
                _accountBalancesAtSnapshot[currentSnap][from] = balanceOf(from);
            }
            if (to != address(0) && _accountBalancesAtSnapshot[currentSnap][to] == 0 && balanceOf(to) > 0) {
                _accountBalancesAtSnapshot[currentSnap][to] = balanceOf(to);
            }
        }

        super._update(from, to, value);
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function assetId() external view returns (bytes32) {
        return _params.assetId;
    }

    function assetParameters() external view returns (AssetTypes.AssetParameters memory) {
        return _params;
    }

    function status() external view returns (AssetTypes.AssetStatus) {
        return _status;
    }

    function primaryPrice() external view returns (uint256) {
        return _params.initialPrice;
    }

    function totalSupplyCap() external view returns (uint256) {
        return _params.totalSupplyCap;
    }

    function remainingUnits() external view returns (uint256) {
        if (totalSupply() >= _params.totalSupplyCap) return 0;
        return _params.totalSupplyCap - totalSupply();
    }

    function complianceRegistry() external view returns (address) {
        return _complianceRegistry;
    }

    function currentSnapshotId() external view returns (uint256) {
        return _currentSnapshotId;
    }

    function balanceOfAt(address account, uint256 snapshotId) external view returns (uint256) {
        require(snapshotId > 0 && snapshotId <= _currentSnapshotId, "Invalid snapshot ID");
        uint256 snapBal = _accountBalancesAtSnapshot[snapshotId][account];
        if (snapBal > 0) {
            return snapBal;
        }
        // If not modified after snapshot, current balance reflects the snapshot balance
        return balanceOf(account);
    }

    function totalSupplyAt(uint256 snapshotId) external view returns (uint256) {
        require(snapshotId > 0 && snapshotId <= _currentSnapshotId, "Invalid snapshot ID");
        return _totalSupplyAtSnapshot[snapshotId];
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
