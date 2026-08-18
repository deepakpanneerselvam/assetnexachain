// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MockUSDC
 * @notice Testnet and local development ERC20 token simulating USDC stablecoin
 * @dev THIS IS STRICTLY A TEST TOKEN FOR EDUCATIONAL / REFERENCE PURPOSES.
 *      NOT REAL USDC. HAS NO FINANCIAL VALUE.
 */
contract MockUSDC is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint8 private immutable _decimals;
    uint256 public constant FAUCET_MAX_AMOUNT = 100_000 * 10 ** 6; // 100,000 USDC per faucet request

    event FaucetMinted(address indexed recipient, uint256 amount);

    /**
     * @notice Constructor initializing MockUSDC with 6 decimals like real USDC
     */
    constructor() ERC20("Mock USDC [TEST TOKEN ONLY]", "mUSDC") {
        _decimals = 6;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // Pre-mint initial liquidity for testing (100,000,000 mUSDC)
        _mint(msg.sender, 100_000_000 * 10 ** 6);
    }

    /**
     * @notice Returns 6 decimals to match standard USDC precision
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Privileged mint function for authorized minters / automated test fixtures
     * @param to Recipient address
     * @param amount Amount to mint in 6-decimal units
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice Public testing faucet for local and testnet investor wallets
     * @param to Recipient wallet
     * @param amount Amount requested (capped at FAUCET_MAX_AMOUNT)
     */
    function faucet(address to, uint256 amount) external {
        require(to != address(0), "Invalid recipient");
        require(amount > 0 && amount <= FAUCET_MAX_AMOUNT, "Amount exceeds faucet limit");
        _mint(to, amount);
        emit FaucetMinted(to, amount);
    }
}
