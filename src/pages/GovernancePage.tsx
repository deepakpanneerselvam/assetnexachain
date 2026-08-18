import React from 'react';
import { GovernanceTab } from '../components/GovernanceTab';
import { RWAAsset, PriceProposal, InvestorProfile } from '../types';

interface GovernancePageProps {
  assets: RWAAsset[];
  proposals: PriceProposal[];
  currentProfile: InvestorProfile;
  onProposePrice: (prop: {
    assetSymbol: string;
    newPriceUSD: number;
    justification: string;
    valuationReportURI: string;
  }) => { success: boolean; message: string };
  onApproveProposal: (id: number) => { success: boolean; message: string };
  onExecuteProposal: (id: number) => { success: boolean; message: string };
}

export const GovernancePage: React.FC<GovernancePageProps> = ({
  assets,
  proposals,
  currentProfile,
  onProposePrice,
  onApproveProposal,
  onExecuteProposal,
}) => {
  return (
    <div className="w-full">
      <GovernanceTab
        assets={assets}
        proposals={proposals}
        currentProfile={currentProfile}
        onProposePrice={onProposePrice}
        onApproveProposal={onApproveProposal}
        onExecuteProposal={onExecuteProposal}
      />
    </div>
  );
};
