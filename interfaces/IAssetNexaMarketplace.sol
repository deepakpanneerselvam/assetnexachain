// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/AssetTypes.sol";

/**
 * @title IAssetNexaMarketplace
 * @notice Interface for the secondary P2P trading marketplace with compliance gating
 */
interface IAssetNexaMarketplace {
    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed assetToken,
        uint256 quantity,
        uint256 pricePerUnit
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event MarketplaceTradeExecuted(
        uint256 indexed listingId,
        address indexed seller,
        address indexed buyer,
        address assetToken,
        uint256 quantity,
        uint256 pricePerUnit,
        uint256 grossAmount,
        uint256 marketplaceFee,
        uint256 netSellerAmount
    );
    event MarketplaceFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // Write functions
    function createListing(
        address assetToken,
        uint256 quantity,
        uint256 pricePerUnit
    ) external returns (uint256 listingId);

    function cancelListing(uint256 listingId) external;

    function buyListing(
        uint256 listingId,
        uint256 quantityToBuy
    ) external returns (bool);

    function setMarketplaceFee(uint256 newFeeBps) external;
    function setFeeRecipient(address newRecipient) external;

    // View functions
    function getListing(uint256 listingId) external view returns (AssetTypes.MarketplaceListing memory);
    function marketplaceFeeBps() external view returns (uint256);
    function feeRecipient() external view returns (address);
    function complianceRegistry() external view returns (address);
    function totalListingsCount() external view returns (uint256);
    function getActiveListings() external view returns (uint256[] memory);
}
