import React from 'react';
import { YieldTab } from '../components/YieldTab';
import { RWAAsset, YieldDistribution, InvestorProfile } from '../types';

interface YieldPageProps {
  assets: RWAAsset[];
  distributions: YieldDistribution[];
  currentProfile: InvestorProfile;
  onClaimYield: (distId: number) => { success: boolean; amount: number; message: string };
  onCreateDistribution: (dist: {
    assetSymbol: string;
    totalAmountUSD: number;
    title: string;
  }) => { success: boolean; message: string };
}

export const YieldPage: React.FC<YieldPageProps> = ({
  assets,
  distributions,
  currentProfile,
  onClaimYield,
  onCreateDistribution,
}) => {
  return (
    <div className="w-full">
      <YieldTab
        assets={assets}
        distributions={distributions}
        currentProfile={currentProfile}
        onClaimYield={onClaimYield}
        onCreateDistribution={onCreateDistribution}
      />
    </div>
  );
};
