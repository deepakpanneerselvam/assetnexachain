// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IAssetNexaCompliance.sol";
import "../libraries/AssetTypes.sol";
import "../libraries/AssetErrors.sol";

/**
 * @title AssetNexaCompliance
 * @notice On-chain reference compliance and transfer-restriction registry for AssetNexaChain
 * @dev Stores minimal regulatory eligibility flags without exposing PII.
 *      Governed by COMPLIANCE_ROLE and OPERATOR_ROLE.
 */
contract AssetNexaCompliance is IAssetNexaCompliance, AccessControl, Pausable {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Investor mapping: wallet address => profile
    mapping(address => AssetTypes.InvestorProfile) private _investorProfiles;

    // Authorized caller contracts (e.g., Payment contract) allowed to record investments
    mapping(address => bool) private _authorizedContracts;

    event AuthorizedContractUpdated(address indexed contractAddress, bool isAuthorized);

    /**
     * @notice Constructor granting default admin and compliance roles to initial admin
     * @param admin Initial administrator wallet / multisig
     */
    constructor(address admin) {
        if (admin == address(0)) revert AssetErrors.ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // =========================================================================
    // MODIFIERS & CHECKS
    // =========================================================================

    modifier onlyAuthorizedRecorder() {
        if (!hasRole(OPERATOR_ROLE, msg.sender) && !_authorizedContracts[msg.sender]) {
            revert AssetErrors.Unauthorized(msg.sender, OPERATOR_ROLE);
        }
        _;
    }

    // =========================================================================
    // ADMINISTRATIVE & COMPLIANCE CONFIGURATION
    // =========================================================================

    /**
     * @notice Set KYC approval status for an investor wallet
     * @param investor Target wallet address
     * @param isApproved True if identity & sanctions check passed
     */
    function setKYCStatus(address investor, bool isApproved) external onlyRole(COMPLIANCE_ROLE) {
        if (investor == address(0)) revert AssetErrors.ZeroAddress();
        
        _investorProfiles[investor].isKYCApproved = isApproved;
        if (isApproved && !_investorProfiles[investor].isActive) {
            _investorProfiles[investor].isActive = true;
            _investorProfiles[investor].isEligible = true;
        }
        
        emit KYCStatusChanged(investor, isApproved, msg.sender);
    }

    /**
     * @notice Set RWA trading eligibility for an investor
     * @param investor Target wallet address
     * @param isEligible True if authorized to hold and trade RWA tokens
     */
    function setInvestorEligibility(address investor, bool isEligible) external onlyRole(COMPLIANCE_ROLE) {
        if (investor == address(0)) revert AssetErrors.ZeroAddress();
        _investorProfiles[investor].isEligible = isEligible;
        emit InvestorEligibilityChanged(investor, isEligible, msg.sender);
    }

    /**
     * @notice Set investor accreditation status
     * @param investor Target wallet address
     * @param isAccredited True if investor is accredited / institutional
     */
    function setAccreditationStatus(address investor, bool isAccredited) external onlyRole(COMPLIANCE_ROLE) {
        if (investor == address(0)) revert AssetErrors.ZeroAddress();
        _investorProfiles[investor].isAccredited = isAccredited;
        emit InvestorAccreditationChanged(investor, isAccredited, msg.sender);
    }

    /**
     * @notice Set maximum cumulative investment limit for an investor
     * @param investor Target wallet address
     * @param limit Maximum amount in payment token units (0 for unlimited / unconfigured)
     */
    function setInvestmentLimit(address investor, uint256 limit) external onlyRole(COMPLIANCE_ROLE) {
        if (investor == address(0)) revert AssetErrors.ZeroAddress();
        _investorProfiles[investor].investmentLimit = limit;
        emit InvestmentLimitChanged(investor, limit, msg.sender);
    }

    /**
     * @notice Set jurisdiction ISO code for an investor
     * @param investor Target wallet address
     * @param jurisdictionCode 2-4 character jurisdiction identifier (e.g., 'US\0\0', 'IN\0\0')
     */
    function setJurisdiction(address investor, bytes4 jurisdictionCode) external onlyRole(COMPLIANCE_ROLE) {
        if (investor == address(0)) revert AssetErrors.ZeroAddress();
        _investorProfiles[investor].jurisdictionCode = jurisdictionCode;
        emit JurisdictionChanged(investor, jurisdictionCode, msg.sender);
    }

    /**
     * @notice Toggle investor active/frozen status
     * @param investor Target wallet address
     * @param isActive True for active, false for suspended/frozen
     */
    function setInvestorActive(address investor, bool isActive) external onlyRole(COMPLIANCE_ROLE) {
        if (investor == address(0)) revert AssetErrors.ZeroAddress();
        _investorProfiles[investor].isActive = isActive;
        emit InvestorStatusChanged(investor, isActive, msg.sender);
    }

    /**
     * @notice Batch set full investor profile
     * @param investor Wallet address
     * @param isApproved KYC approved flag
     * @param isEligible Eligibility flag
     * @param isAccredited Accreditation flag
     * @param limit Investment ceiling
     * @param jurisdictionCode Country code
     */
    function setFullInvestorProfile(
        address investor,
        bool isApproved,
        bool isEligible,
        bool isAccredited,
        uint256 limit,
        bytes4 jurisdictionCode
    ) external onlyRole(COMPLIANCE_ROLE) {
        if (investor == address(0)) revert AssetErrors.ZeroAddress();

        AssetTypes.InvestorProfile storage profile = _investorProfiles[investor];
        profile.isKYCApproved = isApproved;
        profile.isEligible = isEligible;
        profile.isAccredited = isAccredited;
        profile.isActive = isApproved;
        profile.investmentLimit = limit;
        profile.jurisdictionCode = jurisdictionCode;

        emit KYCStatusChanged(investor, isApproved, msg.sender);
        emit InvestorEligibilityChanged(investor, isEligible, msg.sender);
        emit InvestorAccreditationChanged(investor, isAccredited, msg.sender);
        emit InvestmentLimitChanged(investor, limit, msg.sender);
        emit JurisdictionChanged(investor, jurisdictionCode, msg.sender);
        emit InvestorStatusChanged(investor, isApproved, msg.sender);
    }

    /**
     * @notice Authorize or revoke contract addresses (e.g. Payment contract) to record investments
     */
    function setAuthorizedContract(address contractAddress, bool isAuthorized) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (contractAddress == address(0)) revert AssetErrors.ZeroAddress();
        _authorizedContracts[contractAddress] = isAuthorized;
        emit AuthorizedContractUpdated(contractAddress, isAuthorized);
    }

    /**
     * @notice Record an executed primary market investment against the investor's limit
     * @param investor Wallet address
     * @param amount Payment token amount invested
     */
    function recordInvestment(address investor, uint256 amount) external onlyAuthorizedRecorder whenNotPaused {
        if (investor == address(0)) revert AssetErrors.ZeroAddress();
        
        AssetTypes.InvestorProfile storage profile = _investorProfiles[investor];
        profile.totalInvested += amount;

        emit InvestmentRecorded(investor, amount, profile.totalInvested);
    }

    // =========================================================================
    // VIEW / VERIFICATION FUNCTIONS
    // =========================================================================

    /**
     * @notice Get the full compliance profile of an investor
     */
    function getInvestorProfile(address investor) external view returns (AssetTypes.InvestorProfile memory) {
        return _investorProfiles[investor];
    }

    /**
     * @notice Check if investor has valid KYC approval
     */
    function isKYCApproved(address investor) external view returns (bool) {
        return _investorProfiles[investor].isKYCApproved && _investorProfiles[investor].isActive;
    }

    /**
     * @notice Check if investor is eligible to hold/trade RWA units
     */
    function isEligible(address investor) external view returns (bool) {
        AssetTypes.InvestorProfile memory p = _investorProfiles[investor];
        return p.isKYCApproved && p.isEligible && p.isActive;
    }

    /**
     * @notice Check accreditation status
     */
    function isAccredited(address investor) external view returns (bool) {
        return _investorProfiles[investor].isAccredited;
    }

    /**
     * @notice Validate whether an investor can execute a primary investment of `amount`
     * @param investor Target investor address
     * @param amount Amount to be invested in payment tokens
     * @return canProceed True if compliant
     * @return reason Explanation if non-compliant
     */
    function canInvest(address investor, uint256 amount) external view returns (bool canProceed, string memory reason) {
        if (paused()) {
            return (false, "Compliance paused");
        }
        AssetTypes.InvestorProfile memory p = _investorProfiles[investor];
        if (!p.isActive) {
            return (false, "Investor account inactive or frozen");
        }
        if (!p.isKYCApproved) {
            return (false, "Investor KYC not approved");
        }
        if (!p.isEligible) {
            return (false, "Investor not eligible for RWA participation");
        }
        if (p.investmentLimit > 0 && (p.totalInvested + amount > p.investmentLimit)) {
            return (false, "Investment limit exceeded");
        }
        return (true, "");
    }

    /**
     * @notice Validate whether a secondary transfer between `from` and `to` is compliant
     * @param from Sender address (or address(0) for mint)
     * @param to Recipient address (or address(0) for burn)
     * @param amount Unit quantity transferred
     * @return canProceed True if transfer is allowed
     * @return reason Reason for blockage if not allowed
     */
    function canTransfer(
        address from,
        address to,
        uint256 amount
    ) external view returns (bool canProceed, string memory reason) {
        if (paused()) {
            return (false, "Compliance paused");
        }
        if (amount == 0) {
            return (false, "Zero transfer amount");
        }

        // Minting checks (from == address(0))
        if (from == address(0)) {
            if (to == address(0)) return (false, "Transfer to zero address");
            AssetTypes.InvestorProfile memory toProfile = _investorProfiles[to];
            if (!toProfile.isActive) return (false, "Recipient account inactive");
            if (!toProfile.isKYCApproved) return (false, "Recipient KYC not approved");
            if (!toProfile.isEligible) return (false, "Recipient not eligible");
            return (true, "");
        }

        // Burning checks (to == address(0))
        if (to == address(0)) {
            return (true, "");
        }

        // Platform-authorized contracts (Marketplace, Escrow, Vaults) bypass individual investor checks
        if (_authorizedContracts[from] || _authorizedContracts[to]) {
            return (true, "");
        }

        // Standard peer-to-peer or marketplace transfers
        AssetTypes.InvestorProfile memory fromProfile = _investorProfiles[from];
        if (!fromProfile.isActive) return (false, "Sender account inactive");
        if (!fromProfile.isKYCApproved) return (false, "Sender KYC not approved");

        AssetTypes.InvestorProfile memory recipientProfile = _investorProfiles[to];
        if (!recipientProfile.isActive) return (false, "Recipient account inactive");
        if (!recipientProfile.isKYCApproved) return (false, "Recipient KYC not approved");
        if (!recipientProfile.isEligible) return (false, "Recipient not eligible");

        return (true, "");
    }

    // =========================================================================
    // EMERGENCY CONTROLS
    // =========================================================================

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
