// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/AssetTypes.sol";

/**
 * @title IAssetNexaFactory
 * @notice Interface for the RWA Asset Factory contract
 */
interface IAssetNexaFactory {
    // Events
    event AssetCreated(
        bytes32 indexed assetId,
        address indexed assetTokenAddress,
        string name,
        string symbol,
        AssetTypes.AssetCategory category,
        uint256 totalValuation,
        uint256 totalSupplyCap,
        uint256 initialPrice,
        address paymentToken,
        address indexed issuer
    );
    event DefaultComplianceUpdated(address indexed oldCompliance, address indexed newCompliance);

    // Write functions
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
    ) external returns (address assetAddress);

    function setDefaultCompliance(address complianceAddress) external;

    // View functions
    function getAssetAddress(bytes32 assetId) external view returns (address);
    function isRegisteredAsset(address assetAddress) external view returns (bool);
    function totalAssetsCount() external view returns (uint256);
    function getAssetByIndex(uint256 index) external view returns (address);
    function getAllAssets() external view returns (address[] memory);
}
