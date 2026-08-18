import React from 'react';
import { IssuerStudioTab } from '../components/IssuerStudioTab';
import { RWAAsset, InvestorProfile, AssetStatus } from '../types';

interface IssuerStudioPageProps {
  assets: RWAAsset[];
  currentProfile: InvestorProfile;
  onDeployAsset: (newAsset: RWAAsset) => { success: boolean; message: string };
  onUpdateAssetStatus: (assetId: string, newStatus: AssetStatus) => void;
}

export const IssuerStudioPage: React.FC<IssuerStudioPageProps> = ({
  assets,
  currentProfile,
  onDeployAsset,
  onUpdateAssetStatus,
}) => {
  return (
    <div className="w-full">
      <IssuerStudioTab
        assets={assets}
        currentProfile={currentProfile}
        onDeployAsset={onDeployAsset}
        onUpdateAssetStatus={onUpdateAssetStatus}
      />
    </div>
  );
};
