// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/AssetTypes.sol";

/**
 * @title IAssetNexaYield
 * @notice Interface for rental and income distribution accounting based on asset record date snapshots
 */
interface IAssetNexaYield {
    // Events
    event DistributionCreated(
        uint256 indexed distributionId,
        bytes32 indexed assetId,
        address indexed assetToken,
        uint256 totalAmount,
        uint256 snapshotSupply,
        uint256 amountPerUnit,
        uint256 snapshotId,
        uint256 recordTimestamp
    );
    event DistributionClaimed(
        uint256 indexed distributionId,
        address indexed assetToken,
        address indexed investor,
        uint256 claimAmount,
        uint256 qualifyingUnits
    );
    event DistributionDeactivated(uint256 indexed distributionId, address indexed operator);

    // Write functions
    function createDistribution(
        address assetToken,
        uint256 totalAmount
    ) external returns (uint256 distributionId);

    function claimDistribution(uint256 distributionId) external returns (uint256 claimedAmount);
    function batchClaimDistributions(uint256[] calldata distributionIds) external returns (uint256 totalClaimed);
    function deactivateDistribution(uint256 distributionId) external;

    // View functions
    function getDistribution(uint256 distributionId) external view returns (AssetTypes.Distribution memory);
    function getClaimableAmount(uint256 distributionId, address investor) external view returns (uint256);
    function hasClaimed(uint256 distributionId, address investor) external view returns (bool);
    function getAssetDistributionCount(address assetToken) external view returns (uint256);
    function getAssetDistributionIds(address assetToken) external view returns (uint256[] memory);
    function totalDistributionsCount() external view returns (uint256);
}
