import { YieldDistribution, InvestorProfile } from '../types';

export class YieldService {
  static calculateProRataClaim(
    distribution: YieldDistribution,
    userHoldingAtSnapshot: number
  ): { claimableUSD: number; eligible: boolean } {
    if (userHoldingAtSnapshot <= 0 || distribution.isClaimedByUser) {
      return { claimableUSD: 0, eligible: false };
    }
    const claimableUSD = userHoldingAtSnapshot * distribution.amountPerUnitUSD;
    return {
      claimableUSD,
      eligible: claimableUSD > 0,
    };
  }

  static calculateAnnualizedYield(
    amountPerUnitUSD: number,
    currentUnitPriceUSD: number,
    distributionsPerYear: number = 4
  ): number {
    if (currentUnitPriceUSD <= 0) return 0;
    const annualPayoutPerUnit = amountPerUnitUSD * distributionsPerYear;
    return (annualPayoutPerUnit / currentUnitPriceUSD) * 100;
  }
}
