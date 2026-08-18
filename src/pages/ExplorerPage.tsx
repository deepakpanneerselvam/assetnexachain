import React from 'react';
import { ExplorerTab } from '../components/ExplorerTab';
import { RWAAsset, InvestorProfile } from '../types';

interface ExplorerPageProps {
  assets: RWAAsset[];
  currentProfile: InvestorProfile;
  onSelectAsset: (asset: RWAAsset) => void;
  onQuickInvest: (asset: RWAAsset, units: number) => { success: boolean; message: string };
}

export const ExplorerPage: React.FC<ExplorerPageProps> = ({
  assets,
  currentProfile,
  onSelectAsset,
  onQuickInvest,
}) => {
  return (
    <div className="w-full">
      <ExplorerTab
        assets={assets}
        currentProfile={currentProfile}
        onSelectAsset={onSelectAsset}
        onQuickInvest={onQuickInvest}
      />
    </div>
  );
};
