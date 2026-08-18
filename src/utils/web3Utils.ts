/**
 * Web3 and Blockchain utility functions
 */

export const CHAIN_CONFIG = {
  bnbTestnet: {
    chainId: 97,
    hexChainId: '0x61',
    name: 'BNB Smart Chain Testnet',
    currency: 'tBNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorer: 'https://testnet.bscscan.com',
  },
  bnbMainnet: {
    chainId: 56,
    hexChainId: '0x38',
    name: 'BNB Smart Chain Mainnet',
    currency: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorer: 'https://bscscan.com',
  },
  sepolia: {
    chainId: 11155111,
    hexChainId: '0xaa36a7',
    name: 'Sepolia Testnet',
    currency: 'ETH',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
};

/**
 * Generate simulated transaction hash for verifiable audit trails
 */
export function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Convert string to bytes32 format for smart contract identity keys
 */
export function stringToBytes32(text: string): string {
  let hex = '0x';
  for (let i = 0; i < text.length && i < 32; i++) {
    hex += text.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex.padEnd(66, '0');
}
