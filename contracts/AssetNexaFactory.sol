// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./AssetNexaRWA.sol";
import "../interfaces/IAssetNexaFactory.sol";
import "../libraries/AssetTypes.sol";
import "../libraries/AssetErrors.sol";

/**
 * @title AssetNexaFactory
 * @notice Factory contract for launching and registry indexing of compliant RWA token contracts
 * @dev Uses standard factory deployment with deterministic registry indexing and duplicate prevention.
 */
contract AssetNexaFactory is IAssetNexaFactory, AccessControl, Pausable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public defaultCompliance;

    // Registry tracking
    mapping(bytes32 => address) private _assetRegistry;
    mapping(address => bool) private _isRegistered;
    address[] private _allAssets;

    /**
     * @notice Constructor configuring factory administrator and default compliance registry
     * @param admin Administrator wallet
     * @param complianceAddress Default compliance registry address
     */
    constructor(address admin, address complianceAddress) {
        if (admin == address(0) || complianceAddress == address(0)) revert AssetErrors.ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        defaultCompliance = complianceAddress;
    }

    /**
     * @notice Deploy a new tokenized Real-World Asset contract
     * @dev Deploys an AssetNexaRWA instance and registers it in the on-chain index
     */
    function createAsset(
        bytes32 assetId,
        string calldata name,
        string calldata symbol,
        string calldata metadataURI,
        AssetTypes.AssetCategory category,
        uint256 totalValuation,
        uint256 totalSupplyCap,
        uint256 initialPrice,
        address paymentToken,
        address issuer
    ) external onlyRole(ISSUER_ROLE) whenNotPaused returns (address assetAddress) {
        if (_assetRegistry[assetId] != address(0)) {
            revert AssetErrors.AssetAlreadyExists(assetId);
        }
        if (totalSupplyCap == 0 || initialPrice == 0 || paymentToken == address(0)) {
            revert AssetErrors.InvalidAssetParameters();
        }

        address effectiveIssuer = issuer != address(0) ? issuer : msg.sender;

        AssetTypes.AssetParameters memory params = AssetTypes.AssetParameters({
            assetId: assetId,
            name: name,
            symbol: symbol,
            metadataURI: metadataURI,
            category: category,
            totalValuation: totalValuation,
            totalSupplyCap: totalSupplyCap,
            initialPrice: initialPrice,
            paymentToken: paymentToken,
            issuer: effectiveIssuer
        });

        // Deploy new RWA token contract
        AssetNexaRWA newAsset = new AssetNexaRWA(
            params,
            defaultCompliance,
            msg.sender // Admin of new asset contract
        );

        assetAddress = address(newAsset);

        // Record in registry
        _assetRegistry[assetId] = assetAddress;
        _isRegistered[assetAddress] = true;
        _allAssets.push(assetAddress);

        emit AssetCreated(
            assetId,
            assetAddress,
            name,
            symbol,
            category,
            totalValuation,
            totalSupplyCap,
            initialPrice,
            paymentToken,
            effectiveIssuer
        );

        return assetAddress;
    }

    /**
     * @notice Set default compliance registry for newly created assets
     */
    function setDefaultCompliance(address complianceAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (complianceAddress == address(0)) revert AssetErrors.ZeroAddress();
        address old = defaultCompliance;
        defaultCompliance = complianceAddress;
        emit DefaultComplianceUpdated(old, complianceAddress);
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function getAssetAddress(bytes32 assetId) external view returns (address) {
        return _assetRegistry[assetId];
    }

    function isRegisteredAsset(address assetAddress) external view returns (bool) {
        return _isRegistered[assetAddress];
    }

    function totalAssetsCount() external view returns (uint256) {
        return _allAssets.length;
    }

    function getAssetByIndex(uint256 index) external view returns (address) {
        require(index < _allAssets.length, "Index out of bounds");
        return _allAssets[index];
    }

    function getAllAssets() external view returns (address[] memory) {
        return _allAssets;
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
