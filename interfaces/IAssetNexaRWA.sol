// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/AssetTypes.sol";

/**
 * @title IAssetNexaRWA
 * @notice Interface for tokenized Real-World Asset (RWA) contracts
 */
interface IAssetNexaRWA is IERC20 {
    // Events
    event AssetStatusChanged(AssetTypes.AssetStatus indexed oldStatus, AssetTypes.AssetStatus indexed newStatus, address indexed updater);
    event AssetPriceUpdated(uint256 oldPrice, uint256 newPrice, address indexed priceManager);
    event AssetMetadataUpdated(string newMetadataURI, address indexed updater);
    event UnitsMinted(address indexed recipient, uint256 quantity, uint256 totalCost);
    event UnitsBurned(address indexed account, uint256 quantity);
    event ComplianceRegistryUpdated(address indexed oldCompliance, address indexed newCompliance);
    event SnapshotCreated(uint256 indexed snapshotId);

    // Write functions
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function setStatus(AssetTypes.AssetStatus newStatus) external;
    function updatePrimaryPrice(uint256 newPrice) external;
    function updateMetadataURI(string calldata newURI) external;
    function setComplianceRegistry(address newCompliance) external;
    function snapshot() external returns (uint256);

    // View functions
    function assetId() external view returns (bytes32);
    function assetParameters() external view returns (AssetTypes.AssetParameters memory);
    function status() external view returns (AssetTypes.AssetStatus);
    function primaryPrice() external view returns (uint256);
    function totalSupplyCap() external view returns (uint256);
    function remainingUnits() external view returns (uint256);
    function complianceRegistry() external view returns (address);
    function balanceOfAt(address account, uint256 snapshotId) external view returns (uint256);
    function totalSupplyAt(uint256 snapshotId) external view returns (uint256);
    function currentSnapshotId() external view returns (uint256);
}
