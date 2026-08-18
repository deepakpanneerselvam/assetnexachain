// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/AssetTypes.sol";

/**
 * @title IAssetNexaCompliance
 * @notice Interface for on-chain investor compliance and transfer restriction registry
 */
interface IAssetNexaCompliance {
    // Events
    event KYCStatusChanged(address indexed investor, bool isKYCApproved, address indexed operator);
    event InvestorEligibilityChanged(address indexed investor, bool isEligible, address indexed operator);
    event InvestorAccreditationChanged(address indexed investor, bool isAccredited, address indexed operator);
    event InvestmentLimitChanged(address indexed investor, uint256 newLimit, address indexed operator);
    event JurisdictionChanged(address indexed investor, bytes4 jurisdictionCode, address indexed operator);
    event InvestorStatusChanged(address indexed investor, bool isActive, address indexed operator);
    event InvestmentRecorded(address indexed investor, uint256 amountInvested, uint256 cumulativeTotal);

    // Write functions
    function setKYCStatus(address investor, bool isApproved) external;
    function setInvestorEligibility(address investor, bool isEligible) external;
    function setAccreditationStatus(address investor, bool isAccredited) external;
    function setInvestmentLimit(address investor, uint256 limit) external;
    function setJurisdiction(address investor, bytes4 jurisdictionCode) external;
    function setInvestorActive(address investor, bool isActive) external;
    function recordInvestment(address investor, uint256 amount) external;

    // View functions
    function getInvestorProfile(address investor) external view returns (AssetTypes.InvestorProfile memory);
    function isKYCApproved(address investor) external view returns (bool);
    function isEligible(address investor) external view returns (bool);
    function isAccredited(address investor) external view returns (bool);
    function canInvest(address investor, uint256 amount) external view returns (bool, string memory);
    function canTransfer(address from, address to, uint256 amount) external view returns (bool, string memory);
}
