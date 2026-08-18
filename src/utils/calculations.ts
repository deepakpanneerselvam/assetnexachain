import { RWAAsset, InvestorProfile } from '../types';

/**
 * Calculate expected annual yield payout in USD for a given holding
 */
export function calculateAnnualYield(asset: RWAAsset, units: number): number {
  if (!asset || units <= 0) return 0;
  const totalValue = units * asset.currentPriceUSD;
  return (totalValue * asset.targetAPY) / 100;
}

/**
 * Calculate periodic dividend payout based on distribution frequency
 */
export function calculatePeriodicPayout(asset: RWAAsset, units: number): {
  amount: number;
  periodLabel: string;
} {
  const annual = calculateAnnualYield(asset, units);
  switch (asset.distributionFrequency) {
    case 'Monthly':
      return { amount: annual / 12, periodLabel: 'Monthly' };
    case 'Quarterly':
      return { amount: annual / 4, periodLabel: 'Quarterly' };
    case 'Bi-Annual':
      return { amount: annual / 2, periodLabel: 'Bi-Annually' };
    default:
      return { amount: annual / 12, periodLabel: 'Monthly' };
  }
}

/**
 * Calculate total portfolio Net Asset Value (NAV) for a profile
 */
export function calculatePortfolioNAV(
  profile: InvestorProfile,
  assets: RWAAsset[]
): {
  totalNAVUSD: number;
  tokensValueUSD: number;
  cashUSD: number;
  holdingsBreakdown: {
    symbol: string;
    assetName: string;
    units: number;
    unitPrice: number;
    totalValueUSD: number;
    targetAPY: number;
    annualIncomeUSD: number;
    sharePercentage: number;
  }[];
} {
  const cashUSD = profile.usdcBalance;
  let tokensValueUSD = 0;

  const holdingsBreakdown = Object.entries(profile.rwaHoldings)
    .filter(([_, units]) => units > 0)
    .map(([symbol, units]) => {
      const asset = assets.find((a) => a.symbol === symbol);
      const unitPrice = asset ? asset.currentPriceUSD : 100;
      const assetName = asset ? asset.name : symbol;
      const targetAPY = asset ? asset.targetAPY : 8.0;
      const totalValueUSD = units * unitPrice;
      const annualIncomeUSD = (totalValueUSD * targetAPY) / 100;

      tokensValueUSD += totalValueUSD;

      return {
        symbol,
        assetName,
        units,
        unitPrice,
        totalValueUSD,
        targetAPY,
        annualIncomeUSD,
        sharePercentage: 0,
      };
    });

  const totalNAVUSD = tokensValueUSD + cashUSD;

  // Calculate percentage shares
  holdingsBreakdown.forEach((h) => {
    h.sharePercentage = totalNAVUSD > 0 ? (h.totalValueUSD / totalNAVUSD) * 100 : 0;
  });

  return {
    totalNAVUSD,
    tokensValueUSD,
    cashUSD,
    holdingsBreakdown,
  };
}

/**
 * Calculate secondary marketplace 1% protocol fee
 */
export function calculateMarketplaceFee(grossValueUSD: number, feeBps: number = 100): {
  grossValueUSD: number;
  feeUSD: number;
  netPayoutUSD: number;
} {
  const feeUSD = (grossValueUSD * feeBps) / 10000;
  const netPayoutUSD = grossValueUSD - feeUSD;
  return {
    grossValueUSD,
    feeUSD,
    netPayoutUSD,
  };
}
