import { MarketplaceOrder, InvestorProfile } from '../types';
import { generateTxHash } from '../utils/web3Utils';

export class MarketplaceService {
  static calculateFees(totalValueUSD: number) {
    const feeRate = 0.01; // 1%
    const protocolFeeUSD = totalValueUSD * feeRate;
    const sellerProceedsUSD = totalValueUSD - protocolFeeUSD;
    return {
      feeRate,
      protocolFeeUSD,
      sellerProceedsUSD,
    };
  }

  static validateOrderCreation(
    profile: InvestorProfile,
    symbol: string,
    quantity: number,
    pricePerUnitUSD: number
  ): { valid: boolean; error?: string } {
    if (!profile.isActive) {
      return { valid: false, error: 'Account is frozen.' };
    }
    if (!profile.isKYCApproved) {
      return { valid: false, error: 'KYC approval required to sell tokens on secondary market.' };
    }
    const currentHolding = profile.rwaHoldings[symbol] || 0;
    if (currentHolding < quantity) {
      return { valid: false, error: `Insufficient balance. You own ${currentHolding} units of ${symbol}.` };
    }
    if (quantity <= 0) {
      return { valid: false, error: 'Quantity must be greater than zero.' };
    }
    if (pricePerUnitUSD <= 0) {
      return { valid: false, error: 'Price per unit must be greater than zero.' };
    }
    return { valid: true };
  }
}
