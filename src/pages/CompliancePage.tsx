import React from 'react';
import { ComplianceTab } from '../components/ComplianceTab';
import { InvestorProfile } from '../types';

interface CompliancePageProps {
  profiles: InvestorProfile[];
  currentProfile: InvestorProfile;
  onUpdateProfile: (profile: InvestorProfile) => void;
  onAddProfile: (profile: InvestorProfile) => void;
}

export const CompliancePage: React.FC<CompliancePageProps> = ({
  profiles,
  currentProfile,
  onUpdateProfile,
  onAddProfile,
}) => {
  return (
    <div className="w-full">
      <ComplianceTab
        profiles={profiles}
        currentProfile={currentProfile}
        onUpdateProfile={onUpdateProfile}
        onAddProfile={onAddProfile}
      />
    </div>
  );
};
