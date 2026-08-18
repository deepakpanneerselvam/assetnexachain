import { useMemo } from 'react';
import { InvestorProfile, RWAAsset } from '../types';
import { validateComplianceEligibility } from '../utils/validators';

export function useCompliance(profile: InvestorProfile, asset?: RWAAsset) {
  const complianceStatus = useMemo(() => {
    return validateComplianceEligibility(profile, asset);
  }, [profile, asset]);

  return {
    isEligible: complianceStatus.isEligible,
    reasons: complianceStatus.reasons,
    isKYC: profile.isKYCApproved,
    isActive: profile.isActive,
    isAccredited: profile.isAccredited,
    jurisdiction: profile.jurisdictionCode,
    remainingQuotaUSD: Math.max(0, profile.investmentLimitUSD - profile.totalInvestedUSD),
  };
}
