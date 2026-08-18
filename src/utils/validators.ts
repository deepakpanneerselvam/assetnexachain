import { InvestorProfile, RWAAsset } from '../types';

/**
 * Validate Ethereum / EVM address checksum or standard format
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate pre-flight ERC-3643 compliance eligibility
 */
export function validateComplianceEligibility(
  profile: InvestorProfile,
  asset?: RWAAsset,
  requiredInvestmentUSD: number = 0
): {
  isEligible: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!profile.isActive) {
    reasons.push('Investor account is currently inactive or frozen by compliance.');
  }

  if (!profile.isKYCApproved) {
    reasons.push('KYC identity verification is missing or unverified.');
  }

  const allowedJurisdictions = ['SG', 'US', 'DE', 'IN', 'UK', 'JP'];
  if (!allowedJurisdictions.includes(profile.jurisdictionCode.toUpperCase())) {
    reasons.push(`Jurisdiction '${profile.jurisdictionCode}' is not currently on the approved regulatory whitelist.`);
  }

  if (requiredInvestmentUSD > 0) {
    const remainingQuota = profile.investmentLimitUSD - profile.totalInvestedUSD;
    if (requiredInvestmentUSD > remainingQuota) {
      reasons.push(`Investment amount ($${requiredInvestmentUSD.toLocaleString()}) exceeds remaining quota ($${Math.max(0, remainingQuota).toLocaleString()}).`);
    }

    if (profile.usdcBalance < requiredInvestmentUSD) {
      reasons.push(`Insufficient USDC balance ($${profile.usdcBalance.toLocaleString()} available).`);
    }
  }

  if (asset && profile.role === 'Retail' && asset.totalValuationUSD > 100_000_000 && !profile.isAccredited) {
    reasons.push('Asset requires Accredited Investor or Qualified Institutional Buyer status.');
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Check if IPFS URI is valid
 */
export function isValidIPFSURI(uri: string): boolean {
  if (!uri) return false;
  return uri.startsWith('ipfs://') || uri.startsWith('https://ipfs.io/ipfs/') || uri.startsWith('https://gateway.pinata.cloud/ipfs/');
}
