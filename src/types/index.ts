export type AssetCategory = 
  | 'COMMERCIAL_REAL_ESTATE' 
  | 'RESIDENTIAL_REAL_ESTATE' 
  | 'PRIVATE_CREDIT' 
  | 'INFRASTRUCTURE' 
  | 'COMMODITIES' 
  | 'BONDS_AND_FIXED_INCOME';

export type AssetStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'PUBLISHED' 
  | 'FUNDING' 
  | 'FUNDED' 
  | 'CLOSED' 
  | 'PAUSED';

export interface RWAAsset {
  id: string;
  assetIdBytes32: string;
  contractAddress: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  location: string;
  jurisdiction: string;
  totalValuationUSD: number;
  totalSupplyCap: number;
  remainingUnits: number;
  initialPriceUSD: number;
  currentPriceUSD: number;
  targetAPY: number;
  status: AssetStatus;
  issuerName: string;
  issuerAddress: string;
  paymentToken: string;
  metadataURI: string;
  image: string;
  description: string;
  legalEntity: string;
  valuationDate: string;
  occupancyRate?: number;
  distributionFrequency: 'Monthly' | 'Quarterly' | 'Bi-Annual';
  fundedPercentage: number;
  investorCount: number;
  rating: string;
  spvName: string;
  lockupPeriodMonths: number;
}

export interface InvestorProfile {
  address: string;
  name: string;
  role: 'Retail' | 'Accredited' | 'Institutional' | 'ComplianceOfficer' | 'IssuerAdmin';
  isKYCApproved: boolean;
  isActive: boolean;
  isEligible: boolean;
  isAccredited: boolean;
  jurisdictionCode: string;
  investmentLimitUSD: number;
  totalInvestedUSD: number;
  usdcBalance: number;
  rwaHoldings: { [symbol: string]: number };
}

export interface MarketplaceOrder {
  id: number;
  assetSymbol: string;
  assetName: string;
  assetAddress: string;
  sellerAddress: string;
  quantity: number;
  pricePerUnitUSD: number;
  totalValueUSD: number;
  status: 'ACTIVE' | 'FILLED' | 'CANCELLED';
  createdAt: string;
  type: 'SELL' | 'BUY';
}

export interface YieldDistribution {
  id: number;
  assetSymbol: string;
  assetName: string;
  assetAddress: string;
  totalAmountUSD: number;
  snapshotSupply: number;
  amountPerUnitUSD: number;
  recordDate: string;
  paymentDate: string;
  title: string;
  isClaimedByUser: boolean;
}

export interface PriceProposal {
  id: number;
  assetSymbol: string;
  assetName: string;
  assetAddress: string;
  currentPriceUSD: number;
  proposedPriceUSD: number;
  proposer: string;
  approver?: string;
  proposedAt: string;
  timelockExpiry: string;
  status: 'PENDING' | 'APPROVED' | 'EXECUTED' | 'CANCELLED';
  justification: string;
  valuationReportURI: string;
}

export interface ProtocolStats {
  totalValueLockedUSD: number;
  totalFundedAssets: number;
  activeInvestorsCount: number;
  totalYieldDistributedUSD: number;
  secondaryVolume24hUSD: number;
  activeListingsCount: number;
  gasGwei: number;
  currentBlockNumber: number;
  chainId: number;
  networkName: string;
}
