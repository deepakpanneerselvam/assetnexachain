import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Lock, 
  Unlock, 
  Search, 
  CheckCircle2, 
  AlertOctagon, 
  FileCheck2, 
  Sliders, 
  Globe, 
  ArrowRight,
  RefreshCw,
  Plus,
  Info
} from 'lucide-react';
import { InvestorProfile } from '../types';

interface ComplianceTabProps {
  profiles: InvestorProfile[];
  currentProfile: InvestorProfile;
  onUpdateProfile: (updatedProfile: InvestorProfile) => void;
  onAddProfile: (newProfile: InvestorProfile) => void;
}

export const ComplianceTab: React.FC<ComplianceTabProps> = ({
  profiles,
  currentProfile,
  onUpdateProfile,
  onAddProfile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<InvestorProfile | null>(profiles[0] || null);
  
  // Simulator state
  const [simFrom, setSimFrom] = useState(profiles[0]?.address || '');
  const [simTo, setSimTo] = useState(profiles[1]?.address || '');
  const [simAmount, setSimAmount] = useState<number>(100);
  const [simResult, setSimResult] = useState<{
    evaluated: boolean;
    allowed: boolean;
    reason: string;
    details: {
      fromKYC: boolean;
      toKYC: boolean;
      fromActive: boolean;
      toActive: boolean;
      toEligible: boolean;
      limitExceeded: boolean;
    };
  } | null>(null);

  // New Profile Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newJurisdiction, setNewJurisdiction] = useState('SG');
  const [newRole, setNewRole] = useState<'Retail' | 'Accredited' | 'Institutional'>('Accredited');
  const [newLimit, setNewLimit] = useState(500000);

  const isOfficer = currentProfile.role === 'ComplianceOfficer';

  const filteredProfiles = profiles.filter((p) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.jurisdictionCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleKYC = (profile: InvestorProfile) => {
    const updated: InvestorProfile = {
      ...profile,
      isKYCApproved: !profile.isKYCApproved,
      isEligible: !profile.isKYCApproved, // Auto-eligible when KYC approved
      isActive: true
    };
    onUpdateProfile(updated);
    if (selectedProfile?.address === profile.address) {
      setSelectedProfile(updated);
    }
  };

  const handleToggleAccreditation = (profile: InvestorProfile) => {
    const updated: InvestorProfile = {
      ...profile,
      isAccredited: !profile.isAccredited
    };
    onUpdateProfile(updated);
    if (selectedProfile?.address === profile.address) {
      setSelectedProfile(updated);
    }
  };

  const handleToggleActive = (profile: InvestorProfile) => {
    const updated: InvestorProfile = {
      ...profile,
      isActive: !profile.isActive
    };
    onUpdateProfile(updated);
    if (selectedProfile?.address === profile.address) {
      setSelectedProfile(updated);
    }
  };

  const handleUpdateLimit = (profile: InvestorProfile, limit: number) => {
    const updated: InvestorProfile = {
      ...profile,
      investmentLimitUSD: limit
    };
    onUpdateProfile(updated);
    if (selectedProfile?.address === profile.address) {
      setSelectedProfile(updated);
    }
  };

  const handleUpdateJurisdiction = (profile: InvestorProfile, jurisdiction: string) => {
    const updated: InvestorProfile = {
      ...profile,
      jurisdictionCode: jurisdiction
    };
    onUpdateProfile(updated);
    if (selectedProfile?.address === profile.address) {
      setSelectedProfile(updated);
    }
  };

  // Run On-Chain Transfer Pre-flight Simulation
  const handleRunSimulation = () => {
    const fromP = profiles.find(p => p.address.toLowerCase() === simFrom.toLowerCase());
    const toP = profiles.find(p => p.address.toLowerCase() === simTo.toLowerCase());

    if (!fromP) {
      setSimResult({
        evaluated: true,
        allowed: false,
        reason: 'Sender address not found in Identity Registry',
        details: { fromKYC: false, toKYC: false, fromActive: false, toActive: false, toEligible: false, limitExceeded: false }
      });
      return;
    }

    if (!toP) {
      setSimResult({
        evaluated: true,
        allowed: false,
        reason: 'Recipient address not registered in Identity Registry',
        details: { fromKYC: fromP.isKYCApproved, toKYC: false, fromActive: fromP.isActive, toActive: false, toEligible: false, limitExceeded: false }
      });
      return;
    }

    if (!fromP.isActive) {
      setSimResult({
        evaluated: true,
        allowed: false,
        reason: 'Sender account is frozen / inactive under compliance rules',
        details: { fromKYC: fromP.isKYCApproved, toKYC: toP.isKYCApproved, fromActive: false, toActive: toP.isActive, toEligible: toP.isEligible, limitExceeded: false }
      });
      return;
    }

    if (!toP.isActive) {
      setSimResult({
        evaluated: true,
        allowed: false,
        reason: 'Recipient account is frozen / inactive under compliance rules',
        details: { fromKYC: fromP.isKYCApproved, toKYC: toP.isKYCApproved, fromActive: fromP.isActive, toActive: false, toEligible: toP.isEligible, limitExceeded: false }
      });
      return;
    }

    if (!fromP.isKYCApproved) {
      setSimResult({
        evaluated: true,
        allowed: false,
        reason: 'Sender does not have valid verified KYC status',
        details: { fromKYC: false, toKYC: toP.isKYCApproved, fromActive: fromP.isActive, toActive: toP.isActive, toEligible: toP.isEligible, limitExceeded: false }
      });
      return;
    }

    if (!toP.isKYCApproved) {
      setSimResult({
        evaluated: true,
        allowed: false,
        reason: 'Recipient is not KYC approved. Non-KYC transfers are strictly blocked at smart contract layer.',
        details: { fromKYC: true, toKYC: false, fromActive: fromP.isActive, toActive: toP.isActive, toEligible: toP.isEligible, limitExceeded: false }
      });
      return;
    }

    if (!toP.isEligible) {
      setSimResult({
        evaluated: true,
        allowed: false,
        reason: 'Recipient jurisdiction or accreditation status fails asset eligibility criteria.',
        details: { fromKYC: true, toKYC: true, fromActive: fromP.isActive, toActive: toP.isActive, toEligible: false, limitExceeded: false }
      });
      return;
    }

    const estimatedValue = simAmount * 100;
    if (toP.totalInvestedUSD + estimatedValue > toP.investmentLimitUSD) {
      setSimResult({
        evaluated: true,
        allowed: false,
        reason: `Transfer value ($${estimatedValue.toLocaleString()}) would exceed recipient's annual investment limit of $${toP.investmentLimitUSD.toLocaleString()}`,
        details: { fromKYC: true, toKYC: true, fromActive: true, toActive: true, toEligible: true, limitExceeded: true }
      });
      return;
    }

    // Success
    setSimResult({
      evaluated: true,
      allowed: true,
      reason: 'Transaction fully compliant with ERC-3643 identity rules and jurisdiction thresholds. Smart contract will execute successfully.',
      details: { fromKYC: true, toKYC: true, fromActive: true, toActive: true, toEligible: true, limitExceeded: false }
    });
  };

  const handleCreateProfile = () => {
    if (!newName || !newAddress) return;
    const profile: InvestorProfile = {
      address: newAddress,
      name: newName,
      role: newRole,
      isKYCApproved: true,
      isActive: true,
      isEligible: true,
      isAccredited: newRole === 'Accredited' || newRole === 'Institutional',
      jurisdictionCode: newJurisdiction,
      investmentLimitUSD: newLimit,
      totalInvestedUSD: 0,
      usdcBalance: 100000,
      rwaHoldings: {}
    };
    onAddProfile(profile);
    setShowAddModal(false);
    setNewName('');
    setNewAddress('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">ERC-3643 On-Chain Identity & Compliance Hub</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Manage permissioned investor registries, KYC verification badges, cross-border jurisdiction whitelists, and individual investor limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-xs font-mono">
              <span className="text-zinc-500">Registry Admin: </span>
              <span className={isOfficer ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                {isOfficer ? 'Active (Elena Rostova)' : 'Read-Only Mode'}
              </span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-black hover:bg-amber-300 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Register Identity</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Investor Registry Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search registered investor by name, address, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-9 pr-3 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <span className="text-xs font-mono text-zinc-500">{filteredProfiles.length} Identities Found</span>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] text-zinc-400">
                  <tr>
                    <th className="p-3">Investor / Entity</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Jurisdiction</th>
                    <th className="p-3">KYC Status</th>
                    <th className="p-3">Accredited</th>
                    <th className="p-3">Quota Limit</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {filteredProfiles.map((p) => {
                    const isSelected = selectedProfile?.address === p.address;
                    return (
                      <tr
                        key={p.address}
                        onClick={() => setSelectedProfile(p)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-amber-400/5' : 'hover:bg-zinc-800/40'
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-sans font-bold text-zinc-200">{p.name}</div>
                          <div className="text-[10px] text-zinc-500 truncate max-w-[160px]">{p.address}</div>
                        </td>
                        <td className="p-3">
                          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                            {p.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="rounded border border-zinc-700 bg-black/40 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                            {p.jurisdictionCode}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.isKYCApproved ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-950/60 px-2 py-0.5 text-[10px] text-amber-400 border border-amber-500/30">
                              <AlertOctagon className="h-3 w-3" /> Unverified
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {p.isAccredited ? (
                            <span className="text-emerald-400 text-[11px]">Yes</span>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">No</span>
                          )}
                        </td>
                        <td className="p-3 text-zinc-300">
                          ${(p.investmentLimitUSD / 1000).toLocaleString()}k
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleKYC(p);
                            }}
                            className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
                              p.isKYCApproved
                                ? 'border border-red-500/30 text-red-400 hover:bg-red-950/40'
                                : 'bg-emerald-500 text-black hover:bg-emerald-400'
                            }`}
                          >
                            {p.isKYCApproved ? 'Revoke KYC' : 'Approve KYC'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transfer & Investment Pre-Flight Validator Simulator */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Smart Contract Compliance Pre-Flight Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">IAssetNexaCompliance.canTransfer()</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-zinc-400">Sender Address (From)</label>
                <select
                  value={simFrom}
                  onChange={(e) => setSimFrom(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs font-mono text-zinc-200 focus:border-amber-400"
                >
                  {profiles.map(p => (
                    <option key={p.address} value={p.address}>
                      {p.name.split(' ')[0]} ({p.jurisdictionCode}) - {p.isKYCApproved ? 'KYC ✓' : 'NO KYC'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400">Recipient Address (To)</label>
                <select
                  value={simTo}
                  onChange={(e) => setSimTo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs font-mono text-zinc-200 focus:border-amber-400"
                >
                  {profiles.map(p => (
                    <option key={p.address} value={p.address}>
                      {p.name.split(' ')[0]} ({p.jurisdictionCode}) - {p.isKYCApproved ? 'KYC ✓' : 'NO KYC'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400">Units to Transfer</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs font-mono text-zinc-200 focus:border-amber-400"
                  />
                  <button
                    onClick={handleRunSimulation}
                    className="shrink-0 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black hover:bg-amber-300"
                  >
                    Simulate
                  </button>
                </div>
              </div>
            </div>

            {simResult && (
              <div className={`mt-3 rounded-lg p-3 text-xs border font-mono ${
                simResult.allowed
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {simResult.allowed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>COMPLIANCE VERIFICATION PASSED (ALLOWED)</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="h-4 w-4 text-red-400" />
                      <span>TRANSFER BLOCKED BY SMART CONTRACT RULES</span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-300 font-sans">{simResult.reason}</p>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-zinc-800">
                  <div>Sender KYC: <strong className={simResult.details.fromKYC ? 'text-emerald-400' : 'text-red-400'}>{simResult.details.fromKYC ? 'VALID' : 'INVALID'}</strong></div>
                  <div>Recipient KYC: <strong className={simResult.details.toKYC ? 'text-emerald-400' : 'text-red-400'}>{simResult.details.toKYC ? 'VALID' : 'INVALID'}</strong></div>
                  <div>Accounts Active: <strong className={simResult.details.fromActive && simResult.details.toActive ? 'text-emerald-400' : 'text-red-400'}>{simResult.details.fromActive && simResult.details.toActive ? 'ACTIVE' : 'FROZEN'}</strong></div>
                  <div>Quota Cap: <strong className={!simResult.details.limitExceeded ? 'text-emerald-400' : 'text-red-400'}>{!simResult.details.limitExceeded ? 'WITHIN LIMIT' : 'EXCEEDED'}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Selected Identity Inspector & Actions */}
        {selectedProfile ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white">Identity Detail Inspector</h3>
              <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                selectedProfile.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
              }`}>
                {selectedProfile.isActive ? 'ACTIVE' : 'FROZEN'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500">Entity Name:</span>
                <div className="font-bold text-white text-sm mt-0.5">{selectedProfile.name}</div>
              </div>

              <div>
                <span className="text-zinc-500">Wallet Address:</span>
                <div className="font-mono text-[11px] text-amber-400 break-all mt-0.5 bg-black/40 p-1.5 rounded border border-zinc-800">
                  {selectedProfile.address}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-zinc-500">Jurisdiction:</span>
                  <select
                    value={selectedProfile.jurisdictionCode}
                    onChange={(e) => handleUpdateJurisdiction(selectedProfile, e.target.value)}
                    className="mt-1 w-full rounded border border-zinc-800 bg-zinc-950 p-1.5 font-mono text-zinc-200 text-xs"
                  >
                    <option value="SG">Singapore (SG)</option>
                    <option value="US">United States (US)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="IN">India (IN)</option>
                    <option value="UK">United Kingdom (UK)</option>
                    <option value="JP">Japan (JP)</option>
                    <option value="CH">Switzerland (CH)</option>
                    <option value="AE">UAE / DIFC (AE)</option>
                  </select>
                </div>

                <div>
                  <span className="text-zinc-500">Investment Cap:</span>
                  <input
                    type="number"
                    value={selectedProfile.investmentLimitUSD}
                    onChange={(e) => handleUpdateLimit(selectedProfile, parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded border border-zinc-800 bg-zinc-950 p-1.5 font-mono text-zinc-200 text-xs"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                  <div>
                    <div className="font-semibold text-zinc-200">KYC Verification</div>
                    <div className="text-[10px] text-zinc-500">ERC-3643 Claim ID #1</div>
                  </div>
                  <button
                    onClick={() => handleToggleKYC(selectedProfile)}
                    className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                      selectedProfile.isKYCApproved ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {selectedProfile.isKYCApproved ? 'Verified ✓' : 'Unverified'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                  <div>
                    <div className="font-semibold text-zinc-200">Accredited Investor</div>
                    <div className="text-[10px] text-zinc-500">High Net Worth / Institutional</div>
                  </div>
                  <button
                    onClick={() => handleToggleAccreditation(selectedProfile)}
                    className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                      selectedProfile.isAccredited ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {selectedProfile.isAccredited ? 'Accredited ✓' : 'Retail'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                  <div>
                    <div className="font-semibold text-zinc-200">Account Sanctions Freeze</div>
                    <div className="text-[10px] text-zinc-500">Immediate token freeze</div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(selectedProfile)}
                    className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                      selectedProfile.isActive ? 'bg-zinc-800 text-zinc-300' : 'bg-red-500 text-white'
                    }`}
                  >
                    {selectedProfile.isActive ? 'Account Active' : 'Frozen (Sanctioned)'}
                  </button>
                </div>
              </div>

              {/* RWA Holdings */}
              <div className="pt-2">
                <span className="text-zinc-500 font-medium">Current RWA Asset Holdings:</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(selectedProfile.rwaHoldings).length > 0 ? (
                    Object.entries(selectedProfile.rwaHoldings).map(([sym, qty]) => (
                      <div key={sym} className="flex justify-between items-center bg-black/40 p-2 rounded border border-zinc-800 font-mono text-[11px]">
                        <span className="text-amber-400 font-bold">{sym}</span>
                        <span className="text-zinc-200">{qty.toLocaleString()} units</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-zinc-500 italic p-2 bg-black/20 rounded">No tokenized assets held.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Add New Identity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Register On-Chain Identity (ERC-3643)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400">Full Name / Legal Entity</label>
                <input
                  type="text"
                  placeholder="e.g. Temasek Global Ventures Ltd."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-200 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-zinc-400">EVM Wallet Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200 focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400">Investor Classification</label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-200"
                  >
                    <option value="Institutional">Institutional LP</option>
                    <option value="Accredited">Accredited Investor</option>
                    <option value="Retail">Retail Investor</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400">Jurisdiction Country</label>
                  <select
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-200"
                  >
                    <option value="SG">Singapore (SG)</option>
                    <option value="US">United States (US)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="IN">India (IN)</option>
                    <option value="UK">United Kingdom (UK)</option>
                    <option value="JP">Japan (JP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400">Annual Investment Limit (USD)</label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-xl border border-zinc-800 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProfile}
                disabled={!newName || !newAddress}
                className="flex-1 rounded-xl bg-amber-400 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50"
              >
                Deploy Identity to Registry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
