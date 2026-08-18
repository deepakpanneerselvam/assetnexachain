// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/AssetTypes.sol";

/**
 * @title IAssetNexaPayment
 * @notice Interface for primary sale settlement and atomic investment purchases
 */
interface IAssetNexaPayment {
    // Events
    event UnitsPurchased(
        address indexed assetToken,
        address indexed investor,
        uint256 quantity,
        uint256 unitPrice,
        uint256 totalCost,
        uint256 platformFee,
        address indexed issuer
    );
    event UnitsReserved(
        address indexed assetToken,
        address indexed investor,
        uint256 reservationId,
        uint256 quantity,
        uint256 expiryTimestamp
    );
    event ReservationReleased(
        address indexed assetToken,
        uint256 indexed reservationId,
        address indexed releaser
    );
    event PlatformFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // Write functions
    function buyUnits(address assetAddress, uint256 quantity) external returns (bool);
    function reserveUnits(address assetAddress, uint256 quantity, uint256 durationSeconds) external returns (uint256 reservationId);
    function buyReservedUnits(address assetAddress, uint256 reservationId) external returns (bool);
    function releaseExpiredReservation(address assetAddress, uint256 reservationId) external;
    function setPlatformFee(uint256 newFeeBps) external;
    function setFeeRecipient(address newRecipient) external;

    // View functions
    function platformFeeBps() external view returns (uint256);
    function feeRecipient() external view returns (address);
    function complianceRegistry() external view returns (address);
    function getReservation(address assetAddress, uint256 reservationId) external view returns (AssetTypes.UnitReservation memory);
    function getReservedUnits(address assetAddress) external view returns (uint256);
    function calculateTotalCost(address assetAddress, uint256 quantity) external view returns (uint256 totalCost, uint256 feeAmount);
}
