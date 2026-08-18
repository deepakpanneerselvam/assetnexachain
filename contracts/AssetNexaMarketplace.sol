// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IAssetNexaMarketplace.sol";
import "../interfaces/IAssetNexaRWA.sol";
import "../interfaces/IAssetNexaCompliance.sol";
import "../libraries/AssetTypes.sol";
import "../libraries/AssetErrors.sol";

/**
 * @title AssetNexaMarketplace
 * @notice Compliance-gated secondary trading marketplace for fractional RWA token units
 * @dev Escrows listed RWA units, settles payment atomically in stablecoin (e.g., MockUSDC), and routes marketplace fees.
 */
contract AssetNexaMarketplace is IAssetNexaMarketplace, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE_BPS = 1_000; // 10% maximum fee cap

    address public complianceRegistry;
    address public feeRecipient;
    uint256 public marketplaceFeeBps; // e.g., 50 = 0.50%

    // Listing storage
    uint256 private _listingCounter;
    mapping(uint256 => AssetTypes.MarketplaceListing) private _listings;
    uint256[] private _allListingIds;

    /**
     * @notice Constructor initializing marketplace parameters and roles
     */
    constructor(
        address admin,
        address complianceAddress,
        address initialFeeRecipient,
        uint256 initialFeeBps
    ) {
        if (admin == address(0) || complianceAddress == address(0) || initialFeeRecipient == address(0)) {
            revert AssetErrors.ZeroAddress();
        }
        if (initialFeeBps > MAX_FEE_BPS) {
            revert AssetErrors.MarketplaceFeeExceedsMax(initialFeeBps, MAX_FEE_BPS);
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        complianceRegistry = complianceAddress;
        feeRecipient = initialFeeRecipient;
        marketplaceFeeBps = initialFeeBps;
    }

    // =========================================================================
    // LISTING CREATION & CANCELLATION
    // =========================================================================

    /**
     * @notice Escrow RWA units into marketplace and create a secondary listing
     * @param assetToken RWA contract address
     * @param quantity Number of units to list
     * @param pricePerUnit Asking price per unit in payment tokens
     */
    function createListing(
        address assetToken,
        uint256 quantity,
        uint256 pricePerUnit
    ) external nonReentrant whenNotPaused returns (uint256 listingId) {
        if (assetToken == address(0)) revert AssetErrors.ZeroAddress();
        if (quantity == 0) revert AssetErrors.InvalidQuantity();
        if (pricePerUnit == 0) revert AssetErrors.ZeroPrice();

        // Verify seller compliance
        if (complianceRegistry != address(0)) {
            if (!IAssetNexaCompliance(complianceRegistry).isEligible(msg.sender)) {
                revert AssetErrors.NotEligible(msg.sender);
            }
        }

        // Escrow units from seller into marketplace contract
        IERC20(assetToken).safeTransferFrom(msg.sender, address(this), quantity);

        _listingCounter += 1;
        listingId = _listingCounter;

        _listings[listingId] = AssetTypes.MarketplaceListing({
            listingId: listingId,
            seller: msg.sender,
            assetToken: assetToken,
            quantity: quantity,
            pricePerUnit: pricePerUnit,
            status: AssetTypes.ListingStatus.ACTIVE,
            createdAt: block.timestamp
        });

        _allListingIds.push(listingId);

        emit ListingCreated(listingId, msg.sender, assetToken, quantity, pricePerUnit);
        return listingId;
    }

    /**
     * @notice Cancel an active listing and retrieve unsold escrowed units
     * @param listingId Target listing ID
     */
    function cancelListing(uint256 listingId) external nonReentrant whenNotPaused {
        AssetTypes.MarketplaceListing storage listing = _listings[listingId];
        if (listing.status != AssetTypes.ListingStatus.ACTIVE) {
            revert AssetErrors.ListingInactive(listingId);
        }
        if (listing.seller != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert AssetErrors.Unauthorized(msg.sender, DEFAULT_ADMIN_ROLE);
        }

        uint256 remainingQuantity = listing.quantity;
        listing.status = AssetTypes.ListingStatus.CANCELLED;
        listing.quantity = 0;

        // Return escrowed units to seller
        IERC20(listing.assetToken).safeTransfer(listing.seller, remainingQuantity);

        emit ListingCancelled(listingId, listing.seller);
    }

    // =========================================================================
    // SECONDARY PURCHASE SETTLEMENT
    // =========================================================================

    /**
     * @notice Purchase units from an active secondary market listing
     * @param listingId Target listing ID
     * @param quantityToBuy Quantity of units to purchase
     */
    function buyListing(
        uint256 listingId,
        uint256 quantityToBuy
    ) external nonReentrant whenNotPaused returns (bool) {
        AssetTypes.MarketplaceListing storage listing = _listings[listingId];
        if (listing.status != AssetTypes.ListingStatus.ACTIVE) {
            revert AssetErrors.ListingInactive(listingId);
        }
        if (msg.sender == listing.seller) {
            revert AssetErrors.SelfTradeForbidden();
        }
        if (quantityToBuy == 0 || quantityToBuy > listing.quantity) {
            revert AssetErrors.InsufficientListingQuantity(quantityToBuy, listing.quantity);
        }

        // Verify buyer compliance
        if (complianceRegistry != address(0)) {
            if (!IAssetNexaCompliance(complianceRegistry).isEligible(msg.sender)) {
                revert AssetErrors.NotEligible(msg.sender);
            }
        }

        uint256 grossAmount = quantityToBuy * listing.pricePerUnit;
        uint256 feeAmount = (grossAmount * marketplaceFeeBps) / BPS_DENOMINATOR;
        uint256 netSellerAmount = grossAmount - feeAmount;

        IAssetNexaRWA rwa = IAssetNexaRWA(listing.assetToken);
        AssetTypes.AssetParameters memory params = rwa.assetParameters();
        IERC20 paymentToken = IERC20(params.paymentToken);

        // Update listing state before external transfers (Checks-Effects-Interactions)
        listing.quantity -= quantityToBuy;
        if (listing.quantity == 0) {
            listing.status = AssetTypes.ListingStatus.FILLED;
        }

        // 1. Transfer payment token from buyer
        if (feeAmount > 0 && feeRecipient != address(0)) {
            paymentToken.safeTransferFrom(msg.sender, feeRecipient, feeAmount);
        }
        paymentToken.safeTransferFrom(msg.sender, listing.seller, netSellerAmount);

        // 2. Deliver RWA units from escrow to buyer
        IERC20(listing.assetToken).safeTransfer(msg.sender, quantityToBuy);

        emit MarketplaceTradeExecuted(
            listingId,
            listing.seller,
            msg.sender,
            listing.assetToken,
            quantityToBuy,
            listing.pricePerUnit,
            grossAmount,
            feeAmount,
            netSellerAmount
        );

        return true;
    }

    // =========================================================================
    // CONFIGURATION & FEES
    // =========================================================================

    function setMarketplaceFee(uint256 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeeBps > MAX_FEE_BPS) revert AssetErrors.MarketplaceFeeExceedsMax(newFeeBps, MAX_FEE_BPS);
        uint256 old = marketplaceFeeBps;
        marketplaceFeeBps = newFeeBps;
        emit MarketplaceFeeUpdated(old, newFeeBps);
    }

    function setFeeRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newRecipient == address(0)) revert AssetErrors.ZeroAddress();
        address old = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(old, newRecipient);
    }

    function setComplianceRegistry(address newCompliance) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newCompliance == address(0)) revert AssetErrors.ZeroAddress();
        complianceRegistry = newCompliance;
    }

    // =========================================================================
    // VIEW FUNCTIONS
    // =========================================================================

    function getListing(uint256 listingId) external view returns (AssetTypes.MarketplaceListing memory) {
        return _listings[listingId];
    }

    function totalListingsCount() external view returns (uint256) {
        return _listingCounter;
    }

    function getActiveListings() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= _listingCounter; i++) {
            if (_listings[i].status == AssetTypes.ListingStatus.ACTIVE) {
                activeCount++;
            }
        }

        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 1; i <= _listingCounter; i++) {
            if (_listings[i].status == AssetTypes.ListingStatus.ACTIVE) {
                activeIds[idx] = i;
                idx++;
            }
        }
        return activeIds;
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
