// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IAssetNexaPayment.sol";
import "../interfaces/IAssetNexaRWA.sol";
import "../interfaces/IAssetNexaCompliance.sol";
import "../libraries/AssetTypes.sol";
import "../libraries/AssetErrors.sol";

/**
 * @title AssetNexaPayment
 * @notice Primary settlement engine for purchasing and reserving tokenized RWA units
 * @dev Performs atomic payment transfers, fee deduction, compliance tracking, and unit minting.
 */
contract AssetNexaPayment is IAssetNexaPayment, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE_BPS = 1_000; // 10% maximum fee cap
    uint256 public constant MAX_RESERVATION_DURATION = 24 hours;

    address public complianceRegistry;
    address public feeRecipient;
    uint256 public platformFeeBps; // e.g., 50 = 0.50%

    // Reservation tracking: assetAddress => reservationId => reservation
    mapping(address => mapping(uint256 => AssetTypes.UnitReservation)) private _reservations;
    mapping(address => uint256) private _assetReservationCounter;
    mapping(address => uint256) private _totalReservedUnits;

    /**
     * @notice Constructor setting up payment routing and compliance
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
        platformFeeBps = initialFeeBps;
    }

    // =========================================================================
    // PRIMARY UNIT PURCHASE
    // =========================================================================

    /**
     * @notice Direct atomic purchase of primary RWA token units
     * @param assetAddress Deployed AssetNexaRWA contract address
     * @param quantity Number of units to purchase
     */
    function buyUnits(
        address assetAddress,
        uint256 quantity
    ) external nonReentrant whenNotPaused returns (bool) {
        if (quantity == 0) revert AssetErrors.InvalidQuantity();
        if (assetAddress == address(0)) revert AssetErrors.ZeroAddress();

        IAssetNexaRWA asset = IAssetNexaRWA(assetAddress);
        
        // 1. Verify asset status
        if (asset.status() != AssetTypes.AssetStatus.FUNDING) {
            revert AssetErrors.AssetNotActive(uint8(asset.status()));
        }

        // 2. Verify remaining unreserved units
        uint256 remaining = asset.remainingUnits();
        uint256 activeReserved = _totalReservedUnits[assetAddress];
        uint256 availableToPublic = remaining > activeReserved ? remaining - activeReserved : 0;

        if (quantity > availableToPublic) {
            revert AssetErrors.InsufficientUnits(quantity, availableToPublic);
        }

        // 3. Execute atomic payment and mint
        _processPurchase(assetAddress, msg.sender, quantity);

        return true;
    }

    /**
     * @notice Internal settlement and minting logic
     */
    function _processPurchase(
        address assetAddress,
        address investor,
        uint256 quantity
    ) internal {
        IAssetNexaRWA asset = IAssetNexaRWA(assetAddress);
        AssetTypes.AssetParameters memory params = asset.assetParameters();
        uint256 unitPrice = asset.primaryPrice();
        uint256 grossCost = quantity * unitPrice;

        // Verify investor compliance and investment ceiling
        if (complianceRegistry != address(0)) {
            (bool eligible, string memory reason) = IAssetNexaCompliance(complianceRegistry).canInvest(investor, grossCost);
            if (!eligible) {
                revert AssetErrors.NotEligible(investor);
            }
        }

        // Calculate platform fees
        uint256 fee = (grossCost * platformFeeBps) / BPS_DENOMINATOR;
        uint256 issuerNet = grossCost - fee;

        IERC20 paymentToken = IERC20(params.paymentToken);

        // Safe transfer payment tokens
        if (fee > 0 && feeRecipient != address(0)) {
            paymentToken.safeTransferFrom(investor, feeRecipient, fee);
        }
        paymentToken.safeTransferFrom(investor, params.issuer, issuerNet);

        // Mint RWA units to investor
        asset.mint(investor, quantity);

        // Record investment in compliance registry
        if (complianceRegistry != address(0)) {
            IAssetNexaCompliance(complianceRegistry).recordInvestment(investor, grossCost);
        }

        emit UnitsPurchased(
            assetAddress,
            investor,
            quantity,
            unitPrice,
            grossCost,
            fee,
            params.issuer
        );
    }

    // =========================================================================
    // UNIT RESERVATION MECHANISM
    // =========================================================================

    /**
     * @notice Reserve units temporarily before completing payment
     * @param assetAddress Asset contract address
     * @param quantity Amount of units to reserve
     * @param durationSeconds Time window for reservation (max 24 hours)
     */
    function reserveUnits(
        address assetAddress,
        uint256 quantity,
        uint256 durationSeconds
    ) external nonReentrant whenNotPaused returns (uint256 reservationId) {
        if (quantity == 0) revert AssetErrors.InvalidQuantity();
        if (durationSeconds == 0 || durationSeconds > MAX_RESERVATION_DURATION) {
            revert AssetErrors.InvalidAssetParameters();
        }

        IAssetNexaRWA asset = IAssetNexaRWA(assetAddress);
        if (asset.status() != AssetTypes.AssetStatus.FUNDING) {
            revert AssetErrors.AssetNotActive(uint8(asset.status()));
        }

        // Verify eligibility to reserve
        if (complianceRegistry != address(0)) {
            (bool eligible, ) = IAssetNexaCompliance(complianceRegistry).canInvest(msg.sender, quantity * asset.primaryPrice());
            if (!eligible) revert AssetErrors.NotEligible(msg.sender);
        }

        uint256 remaining = asset.remainingUnits();
        uint256 activeReserved = _totalReservedUnits[assetAddress];
        uint256 available = remaining > activeReserved ? remaining - activeReserved : 0;

        if (quantity > available) {
            revert AssetErrors.InsufficientUnits(quantity, available);
        }

        _assetReservationCounter[assetAddress] += 1;
        reservationId = _assetReservationCounter[assetAddress];
        uint256 expiry = block.timestamp + durationSeconds;

        _reservations[assetAddress][reservationId] = AssetTypes.UnitReservation({
            investor: msg.sender,
            quantity: quantity,
            expiryTimestamp: expiry,
            active: true
        });

        _totalReservedUnits[assetAddress] += quantity;

        emit UnitsReserved(assetAddress, msg.sender, reservationId, quantity, expiry);
        return reservationId;
    }

    /**
     * @notice Purchase units previously reserved by the caller
     */
    function buyReservedUnits(
        address assetAddress,
        uint256 reservationId
    ) external nonReentrant whenNotPaused returns (bool) {
        AssetTypes.UnitReservation storage res = _reservations[assetAddress][reservationId];
        if (!res.active) revert AssetErrors.ReservationNotFound();
        if (res.investor != msg.sender) revert AssetErrors.ReservationMismatch();
        if (block.timestamp > res.expiryTimestamp) revert AssetErrors.ReservationExpired();

        uint256 quantity = res.quantity;
        
        // Deactivate reservation and release reserved pool count
        res.active = false;
        _totalReservedUnits[assetAddress] -= quantity;

        _processPurchase(assetAddress, msg.sender, quantity);
        return true;
    }

    /**
     * @notice Release units from an expired reservation back into the available pool
     */
    function releaseExpiredReservation(address assetAddress, uint256 reservationId) external {
        AssetTypes.UnitReservation storage res = _reservations[assetAddress][reservationId];
        if (!res.active) revert AssetErrors.ReservationNotFound();
        if (block.timestamp <= res.expiryTimestamp) revert AssetErrors.ReservationStillActive();

        uint256 quantity = res.quantity;
        res.active = false;
        _totalReservedUnits[assetAddress] -= quantity;

        emit ReservationReleased(assetAddress, reservationId, msg.sender);
    }

    // =========================================================================
    // CONFIGURATION & FEES
    // =========================================================================

    function setPlatformFee(uint256 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeeBps > MAX_FEE_BPS) revert AssetErrors.MarketplaceFeeExceedsMax(newFeeBps, MAX_FEE_BPS);
        uint256 old = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(old, newFeeBps);
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

    function getReservation(address assetAddress, uint256 reservationId) external view returns (AssetTypes.UnitReservation memory) {
        return _reservations[assetAddress][reservationId];
    }

    function getReservedUnits(address assetAddress) external view returns (uint256) {
        return _totalReservedUnits[assetAddress];
    }

    function calculateTotalCost(
        address assetAddress,
        uint256 quantity
    ) external view returns (uint256 totalCost, uint256 feeAmount) {
        IAssetNexaRWA asset = IAssetNexaRWA(assetAddress);
        totalCost = quantity * asset.primaryPrice();
        feeAmount = (totalCost * platformFeeBps) / BPS_DENOMINATOR;
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
