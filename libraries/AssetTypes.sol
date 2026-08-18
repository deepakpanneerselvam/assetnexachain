// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AssetTypes
 * @notice Core data types, enums, and structs for AssetNexaChain RWA platform
 * @dev Reusable across all AssetNexa smart contracts and interfaces
 */
library AssetTypes {
    /**
     * @notice Lifecycle states for an asset
     */
    enum AssetStatus {
        DRAFT,              // 0: Asset registered, awaiting compliance & documentation review
        PENDING_APPROVAL,   // 1: Submitted for compliance and multi-sig authorization
        PUBLISHED,          // 2: Approved and visible in catalog, not yet open for funding
        FUNDING,            // 3: Primary sale active, accepting investor capital
        FUNDED,             // 4: Unit supply sold out or funding goal reached, fully operational
        CLOSED,             // 5: Asset liquidated, term matured, or permanently retired
        PAUSED              // 6: Temporarily halted due to emergency or compliance review
    }

    /**
     * @notice Categories of real-world assets supported by AssetNexaChain
     */
    enum AssetCategory {
        COMMERCIAL_REAL_ESTATE, // 0: Commercial office, retail, industrial properties
        RESIDENTIAL_REAL_ESTATE,// 1: Multi-family, build-to-rent residential units
        PRIVATE_CREDIT,         // 2: Direct lending, receivables financing, invoice factoring
        INFRASTRUCTURE,         // 3: Energy, transportation, utility infrastructure
        COMMODITIES,            // 4: Physical trade assets, metals, agricultural goods
        BONDS_AND_FIXED_INCOME  // 5: Corporate or municipal debt instruments
    }

    /**
     * @notice Proposal status for governed primary price adjustments
     */
    enum ProposalStatus {
        PENDING,    // 0: Proposed, awaiting compliance review
        APPROVED,   // 1: Approved by compliance, timelock countdown running
        EXECUTED,   // 2: Executed after timelock maturity
        CANCELLED   // 3: Cancelled before execution
    }

    /**
     * @notice Status of a secondary market listing
     */
    enum ListingStatus {
        ACTIVE,     // 0: Open for purchase
        FILLED,     // 1: Entire quantity bought
        CANCELLED   // 2: Withdrawn by seller
    }

    /**
     * @notice Comprehensive asset metadata and financial parameters
     */
    struct AssetParameters {
        bytes32 assetId;            // Unique asset identifier (e.g. keccak256 hash of legal identifier)
        string name;                // Asset name (e.g., "Chennai Tech Campus")
        string symbol;              // Token symbol (e.g., "CTC")
        string metadataURI;         // IPFS or Arweave URI containing legal prospectus, audit, photos
        AssetCategory category;     // Asset category classification
        uint256 totalValuation;     // Total asset valuation in base payment units (e.g., 10,000,000 USDC)
        uint256 totalSupplyCap;     // Maximum immutable fractional token supply (e.g., 10,000,000)
        uint256 initialPrice;       // Initial primary sale price per token unit in payment tokens
        address paymentToken;       // ERC20 payment token address (e.g., MockUSDC)
        address issuer;             // Legal entity or designated wallet of the asset issuer
    }

    /**
     * @notice Investor compliance verification profile
     */
    struct InvestorProfile {
        bool isKYCApproved;         // True if identity and sanctions verification passed
        bool isEligible;            // True if authorized to trade/hold RWA tokens
        bool isAccredited;          // True if investor meets accredited/institutional criteria
        bool isActive;              // Account operational state (false if frozen or suspended)
        bytes4 jurisdictionCode;    // ISO 3166-1 alpha-2 / ISO 3166-2 jurisdiction code (e.g., 'IN', 'US', 'SG')
        uint256 investmentLimit;    // Maximum cumulative investment allowance in payment token units
        uint256 totalInvested;      // Cumulative primary purchases executed to date
    }

    /**
     * @notice Reservation structure for temporary unit hold during payment preparation
     */
    struct UnitReservation {
        address investor;           // Reserving investor wallet
        uint256 quantity;           // Amount of units reserved
        uint256 expiryTimestamp;    // Expiration timestamp of the reservation
        bool active;                // Whether the reservation is active
    }

    /**
     * @notice Rental/Yield distribution record
     */
    struct Distribution {
        uint256 distributionId;     // Unique sequential ID
        bytes32 assetId;            // Target asset identifier
        address assetToken;         // RWA contract address
        uint256 totalAmount;        // Total distributable payment tokens deposited
        uint256 snapshotSupply;     // Total qualifying supply at record date
        uint256 amountPerUnit;      // Scaled distribution per unit (1e18 precision)
        uint256 recordTimestamp;    // Timestamp of snapshot/record date
        uint256 creationTimestamp;  // Timestamp distribution was funded
        bool active;                // Distribution active state
    }

    /**
     * @notice Secondary market listing entry
     */
    struct MarketplaceListing {
        uint256 listingId;          // Unique listing identifier
        address seller;             // Listing creator
        address assetToken;         // RWA token contract
        uint256 quantity;           // Remaining available units
        uint256 pricePerUnit;       // Asking price per unit in payment token
        ListingStatus status;       // Listing status
        uint256 createdAt;          // Creation timestamp
    }

    /**
     * @notice Price adjustment governance proposal
     */
    struct PriceProposal {
        uint256 proposalId;         // Unique proposal ID
        address assetToken;         // Target RWA contract
        uint256 oldPrice;           // Current primary price per unit
        uint256 newPrice;           // Proposed primary price per unit
        address proposer;           // Proposing operator
        address approver;           // Compliance officer who approved
        uint256 proposedAt;         // Submission timestamp
        uint256 approvedAt;         // Compliance approval timestamp
        uint256 timelockExpiry;     // Earliest executable timestamp (approvedAt + delay)
        uint256 executedAt;         // Execution timestamp (0 if not executed)
        ProposalStatus status;      // Proposal state
    }
}
