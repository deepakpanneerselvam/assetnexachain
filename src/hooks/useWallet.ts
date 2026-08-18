import { useState, useCallback } from 'react';
import { InvestorProfile } from '../types';
import { INITIAL_PROFILES } from '../data/mockAssets';

export function useWallet(initialProfile?: InvestorProfile) {
  const [profiles, setProfiles] = useState<InvestorProfile[]>(INITIAL_PROFILES);
  const [currentProfile, setCurrentProfile] = useState<InvestorProfile>(
    initialProfile || INITIAL_PROFILES[0]
  );

  const selectProfile = useCallback((profile: InvestorProfile) => {
    setCurrentProfile(profile);
  }, []);

  const updateProfile = useCallback((updated: InvestorProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.address.toLowerCase() === updated.address.toLowerCase() ? updated : p))
    );
    setCurrentProfile((curr) =>
      curr.address.toLowerCase() === updated.address.toLowerCase() ? updated : curr
    );
  }, []);

  const addProfile = useCallback((newProfile: InvestorProfile) => {
    setProfiles((prev) => [newProfile, ...prev]);
  }, []);

  return {
    profiles,
    currentProfile,
    selectProfile,
    updateProfile,
    addProfile,
  };
}
