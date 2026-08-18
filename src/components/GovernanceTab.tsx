import React, { useState } from 'react';
import { 
  Scale, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  ArrowUpRight,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { RWAAsset, InvestorProfile, PriceProposal } from '../types';

interface GovernanceTabProps {
  assets: RWAAsset[];
  proposals: PriceProposal[];
  currentProfile: InvestorProfile;
  onProposePrice: (proposal: {
    assetSymbol: string;
    newPriceUSD: number;
    justification: string;
    valuationReportURI: string;
  }) => { success: boolean; message: string };
  onApproveProposal: (id: number) => { success: boolean; message: string };
  onExecuteProposal: (id: number) => { success: boolean; message: string };
}

export const GovernanceTab: React.FC<GovernanceTabProps> = ({
  assets,
  proposals,
  currentProfile,
  onProposePrice,
  onApproveProposal,
  onExecuteProposal
}) => {
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [targetAssetSymbol, setTargetAssetSymbol] = useState(assets[0]?.symbol || '');
  const [proposedPriceUSD, setProposedPriceUSD] = useState<number>(105);
  const [justification, setJustification] = useState('');
  const [ipfsReport, setIpfsReport] = useState('ipfs://bafybeiappraisal2026valaudit');

  const [txFeedback, setTxFeedback] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const isComplianceOfficer = currentProfile.role === 'ComplianceOfficer';

  const handleProposeSubmit = () => {
    setTxFeedback({ status: 'loading', message: 'Submitting price adjustment proposal to AssetNexaPriceManager contract...' });
    
    setTimeout(() => {
      const res = onProposePrice({
        assetSymbol: targetAssetSymbol,
        newPriceUSD: proposedPriceUSD,
        justification,
        valuationReportURI: ipfsReport
      });

      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => {
          setShowProposeModal(false);
          setTxFeedback({ status: 'idle', message: '' });
        }, 1500);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 600);
  };

  const handleApprove = (id: number) => {
    setTxFeedback({ status: 'loading', message: 'Submitting compliance officer dual-signature on-chain...' });
    
    setTimeout(() => {
      const res = onApproveProposal(id);
      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => setTxFeedback({ status: 'idle', message: '' }), 2000);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 600);
  };

  const handleExecute = (id: number) => {
    setTxFeedback({ status: 'loading', message: 'Executing timelocked price update on target RWA contract...' });
    
    setTimeout(() => {
      const res = onExecuteProposal(id);
      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => setTxFeedback({ status: 'idle', message: '' }), 2000);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-black p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Dual-Governance Valuation Oracle & Timelock</h2>
            </div>
            <p className="text-xs text-zinc-400">
              On-chain NAV updates require formal independent appraisal audit submissions, dual-role compliance officer signatures, and 24-hour timelock execution.
            </p>
          </div>

          <button
            onClick={() => {
              setShowProposeModal(true);
              setTxFeedback({ status: 'idle', message: '' });
            }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Propose Valuation Change</span>
          </button>
        </div>
      </div>

      {/* Global Status Toast */}
      {txFeedback.status !== 'idle' && (
        <div className={`rounded-xl p-3 text-xs flex items-center gap-2 border font-mono ${
          txFeedback.status === 'loading'
            ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
            : txFeedback.status === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/80 border-red-500/40 text-red-300'
        }`}>
          {txFeedback.status === 'loading' && <div className="h-4 w-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0"></div>}
          {txFeedback.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
          {txFeedback.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />}
          <span className="font-sans">{txFeedback.message}</span>
        </div>
      )}

      {/* Proposals Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-200">Active Valuation Change Proposals</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {proposals.map((p) => {
            const pctChange = (((p.proposedPriceUSD - p.currentPriceUSD) / p.currentPriceUSD) * 100).toFixed(2);
            return (
              <div
                key={p.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 hover:border-zinc-700 transition"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-400/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-400 border border-amber-400/20">
                      {p.assetSymbol}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">Proposal #{p.id}</span>
                  </div>

                  <span className={`rounded px-2.5 py-0.5 text-[10px] font-bold font-mono ${
                    p.status === 'EXECUTED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : p.status === 'APPROVED'
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {p.status}
                  </span>
                </div>

                {/* Body */}
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-white text-sm">{p.assetName}</h4>

                  {/* Price comparison */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono">
                    <div>
                      <div className="text-[10px] text-zinc-500">Current Unit NAV</div>
                      <div className="font-bold text-zinc-200">${p.currentPriceUSD.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">Proposed NAV</div>
                      <div className="font-bold text-emerald-400">${p.proposedPriceUSD.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">Revaluation Diff</div>
                      <div className="font-bold text-amber-400">+{pctChange}%</div>
                    </div>
                  </div>

                  {/* Justification & IPFS */}
                  <div className="space-y-1 bg-black/40 p-3 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase">Appraisal Justification:</span>
                    <p className="text-xs text-zinc-300">{p.justification}</p>
                    <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{p.valuationReportURI}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] font-mono text-zinc-500">
                    <div>Proposer: <span className="text-zinc-400 truncate">{p.proposer}</span></div>
                    {p.approver && <div>Approver: <span className="text-emerald-400">{p.approver}</span></div>}
                    <div>Timelock Window: <span className="text-zinc-300">{p.timelockExpiry}</span></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800 flex gap-2">
                  {p.status === 'PENDING' && (
                    <button
                      onClick={() => handleApprove(p.id)}
                      disabled={!isComplianceOfficer}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isComplianceOfficer
                          ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{isComplianceOfficer ? 'Approve as Compliance Officer' : 'Requires Compliance Role'}</span>
                    </button>
                  )}

                  {p.status === 'APPROVED' && (
                    <button
                      onClick={() => handleExecute(p.id)}
                      className="flex-1 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Execute Price Change on Target RWA</span>
                    </button>
                  )}

                  {p.status === 'EXECUTED' && (
                    <div className="w-full text-center text-xs font-mono text-emerald-400 py-1.5 bg-emerald-950/30 rounded border border-emerald-500/20">
                      ✓ Unit price updated on-chain to ${p.proposedPriceUSD.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Propose Modal */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Propose On-Chain Price Adjustment</h3>
              <button onClick={() => setShowProposeModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400">Select RWA Asset</label>
                <select
                  value={targetAssetSymbol}
                  onChange={(e) => {
                    setTargetAssetSymbol(e.target.value);
                    const ast = assets.find(a => a.symbol === e.target.value);
                    if (ast) setProposedPriceUSD(ast.currentPriceUSD * 1.03);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200 focus:border-amber-400"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} - {a.name} (Current: ${a.currentPriceUSD.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-400">Proposed New Unit Price (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  value={proposedPriceUSD}
                  onChange={(e) => setProposedPriceUSD(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400">Valuation Justification / Rationale</label>
                <textarea
                  rows={2}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="e.g. Q2 Certified Independent appraisal by CBRE indicating 3.5% rental yield escalation..."
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400">IPFS Audit / Appraisal Hash</label>
                <input
                  type="text"
                  value={ipfsReport}
                  onChange={(e) => setIpfsReport(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowProposeModal(false)}
                className="flex-1 rounded-xl border border-zinc-800 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleProposeSubmit}
                disabled={!justification || proposedPriceUSD <= 0}
                className="flex-1 rounded-xl bg-amber-400 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50"
              >
                Submit Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
