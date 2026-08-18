// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/AssetTypes.sol";

/**
 * @title IAssetNexaPriceManager
 * @notice Interface for governed primary price adjustment with timelock and multi-role compliance approval
 */
interface IAssetNexaPriceManager {
    // Events
    event PriceChangeProposed(
        uint256 indexed proposalId,
        address indexed assetToken,
        uint256 oldPrice,
        uint256 newPrice,
        address indexed proposer,
        uint256 timestamp
    );
    event PriceChangeApproved(
        uint256 indexed proposalId,
        address indexed assetToken,
        address indexed approver,
        uint256 timelockExpiry
    );
    event PriceChangeCancelled(
        uint256 indexed proposalId,
        address indexed assetToken,
        address indexed canceller,
        string reason
    );
    event PriceChangeExecuted(
        uint256 indexed proposalId,
        address indexed assetToken,
        uint256 oldPrice,
        uint256 newPrice,
        address indexed executor
    );
    event TimelockDurationUpdated(uint256 oldDuration, uint256 newDuration);

    // Write functions
    function proposePriceChange(address assetToken, uint256 newPrice) external returns (uint256 proposalId);
    function approvePriceChange(uint256 proposalId) external;
    function executePriceChange(uint256 proposalId) external;
    function cancelPriceChange(uint256 proposalId, string calldata reason) external;
    function setTimelockDuration(uint256 newDurationSeconds) external;

    // View functions
    function getProposal(uint256 proposalId) external view returns (AssetTypes.PriceProposal memory);
    function timelockDuration() external view returns (uint256);
    function totalProposalsCount() external view returns (uint256);
    function getAssetProposals(address assetToken) external view returns (uint256[] memory);
}
