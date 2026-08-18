import { InvestorProfile } from '../types';

export class ComplianceService {
  private static WHITELISTED_JURISDICTIONS = new Set(['SG', 'US', 'DE', 'IN', 'UK', 'JP']);

  static isJurisdictionWhitelisted(countryCode: string): boolean {
    return this.WHITELISTED_JURISDICTIONS.has(countryCode.toUpperCase());
  }

  static getWhitelistedJurisdictions(): string[] {
    return Array.from(this.WHITELISTED_JURISDICTIONS);
  }

  static verifyInvestor(profile: InvestorProfile): {
    canTransact: boolean;
    reason?: string;
  } {
    if (!profile.isActive) {
      return { canTransact: false, reason: 'Profile is marked frozen or inactive.' };
    }
    if (!profile.isKYCApproved) {
      return { canTransact: false, reason: 'Profile does not have completed KYC.' };
    }
    if (!this.isJurisdictionWhitelisted(profile.jurisdictionCode)) {
      return { canTransact: false, reason: `Country code ${profile.jurisdictionCode} is not in whitelisted jurisdictions.` };
    }
    return { canTransact: true };
  }
}
