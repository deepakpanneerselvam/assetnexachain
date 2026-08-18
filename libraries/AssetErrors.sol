// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AssetErrors
 * @notice Centralized custom error declarations for AssetNexaChain
 * @dev Gas-optimized error definitions used across all platform contracts
 */
library AssetErrors {
    // Identity & Access Errors
    error Unauthorized(address caller, bytes32 requiredRole);
    error ZeroAddress();
    error InvalidCaller();
    error ContractPaused();

    // Asset & Lifecycle Errors
    error AssetAlreadyExists(bytes32 assetId);
    error AssetNotFound(address assetAddress);
    error AssetNotActive(uint8 currentStatus);
    error InvalidStateTransition(uint8 fromState, uint8 toState);
    error InvalidAssetParameters();
    error SupplyCapExceeded(uint256 requested, uint256 available);
    error MaxSupplyReached();
    error ZeroSupply();
    error ZeroPrice();

    // Compliance & Investor Errors
    error NotKYCApproved(address investor);
    error NotEligible(address account);
    error InvestorInactive(address account);
    error InvestmentLimitExceeded(address investor, uint256 requested, uint256 allowed);
    error ComplianceTransferBlocked(address from, address to, uint256 amount);
    error InvalidJurisdiction();

    // Payment & Investment Errors
    error InsufficientUnits(uint256 requested, uint256 available);
    error InvalidQuantity();
    error InsufficientPaymentBalance(address payer, uint256 balance, uint256 required);
    error InsufficientPaymentAllowance(address payer, uint256 allowance, uint256 required);
    error PaymentTransferFailed();
    error UnitMintFailed();

    // Reservation Errors
    error ReservationNotFound();
    error ReservationExpired();
    error ReservationStillActive();
    error ReservationMismatch();

    // Yield & Distribution Errors
    error InvalidDistributionAmount();
    error DistributionNotFound(uint256 distributionId);
    error DistributionAlreadyClaimed(uint256 distributionId, address investor);
    error NoQualifyingBalance(uint256 snapshotBalance);
    error DistributionInactive();
    error ZeroClaimable();

    // Marketplace Errors
    error InvalidListing(uint256 listingId);
    error ListingInactive(uint256 listingId);
    error InsufficientListingQuantity(uint256 requested, uint256 available);
    error SellerCannotBeBuyer();
    error MarketplaceFeeExceedsMax(uint256 feeBps, uint256 maxBps);
    error SelfTradeForbidden();

    // Price Governance Errors
    error ProposalNotFound(uint256 proposalId);
    error ProposalNotPending(uint256 proposalId);
    error ProposalNotApproved(uint256 proposalId);
    error ProposalAlreadyApproved(uint256 proposalId);
    error ProposalAlreadyExecuted(uint256 proposalId);
    error ProposalCancelled(uint256 proposalId);
    error TimelockNotExpired(uint256 currentTime, uint256 executableTime);
    error ProposerCannotApprove(address proposer);
    error PriceUnchanged();
}
