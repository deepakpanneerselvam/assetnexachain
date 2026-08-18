import React, { useState } from 'react';
import { 
  Coins, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  Layers, 
  Clock, 
  DollarSign, 
  AlertCircle,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { RWAAsset, InvestorProfile, YieldDistribution } from '../types';

interface YieldTabProps {
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

export const YieldTab: React.FC<YieldTabProps> = ({
  assets,
  distributions,
  currentProfile,
  onClaimYield,
  onCreateDistribution
}) => {
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distAssetSymbol, setDistAssetSymbol] = useState(assets[0]?.symbol || '');
  const [distAmountUSD, setDistAmountUSD] = useState<number>(50000);
  const [distTitle, setDistTitle] = useState('Monthly Rental Distribution');

  const [txFeedback, setTxFeedback] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const isIssuerOrAdmin = currentProfile.role === 'IssuerAdmin' || currentProfile.role === 'ComplianceOfficer';

  const handleClaim = (dist: YieldDistribution) => {
    setTxFeedback({ status: 'loading', message: `Executing pro-rata claim on AssetNexaYield smart contract...` });
    
    setTimeout(() => {
      const res = onClaimYield(dist.id);
      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => setTxFeedback({ status: 'idle', message: '' }), 2500);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 600);
  };

  const handleCreateDistSubmit = () => {
    setTxFeedback({ status: 'loading', message: 'Triggering RWA snapshot and depositing USDC distribution vault on-chain...' });
    
    setTimeout(() => {
      const res = onCreateDistribution({
        assetSymbol: distAssetSymbol,
        totalAmountUSD: distAmountUSD,
        title: distTitle
      });

      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => {
          setShowDistributeModal(false);
          setTxFeedback({ status: 'idle', message: '' });
        }, 1800);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 600);
  };

  // Calculate total claimable for user across all distributions
  let totalClaimableUSD = 0;
  distributions.forEach(d => {
    if (!d.isClaimedByUser) {
      const userUnits = currentProfile.rwaHoldings[d.assetSymbol] || 0;
      totalClaimableUSD += userUnits * d.amountPerUnitUSD;
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-black p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Automated Pro-Rata Yield & Rental Distributions</h2>
            </div>
            <p className="text-xs text-zinc-400">
              On-chain ERC-20 snapshot engine calculating exact proportional payouts from lease income, solar generation tariffs, and loan interest.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-zinc-800 bg-black/60 px-3.5 py-2 text-xs font-mono">
              <span className="text-zinc-500">Unclaimed Yield: </span>
              <span className="text-emerald-400 font-bold font-mono text-sm">${totalClaimableUSD.toFixed(2)} USDC</span>
            </div>

            {isIssuerOrAdmin && (
              <button
                onClick={() => {
                  setShowDistributeModal(true);
                  setTxFeedback({ status: 'idle', message: '' });
                }}
                className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Distribute Income</span>
              </button>
            )}
          </div>
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
          {txFeedback.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
          <span className="font-sans">{txFeedback.message}</span>
        </div>
      )}

      {/* Distributions List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-200">Historical & Active Income Distributions</h3>

        <div className="space-y-3">
          {distributions.map((d) => {
            const userHoldings = currentProfile.rwaHoldings[d.assetSymbol] || 0;
            const userShare = userHoldings * d.amountPerUnitUSD;
            const canClaim = !d.isClaimedByUser && userShare > 0;

            return (
              <div
                key={d.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Metadata */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-400/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-400 border border-amber-400/20">
                        {d.assetSymbol}
                      </span>
                      <h4 className="font-bold text-white text-sm">{d.title}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400">
                      <span>Asset: <strong>{d.assetName}</strong></span>
                      <span>•</span>
                      <span>Record Date: <strong>{d.recordDate}</strong></span>
                      <span>•</span>
                      <span>Total Pool: <strong>${d.totalAmountUSD.toLocaleString()} USDC</strong></span>
                    </div>
                  </div>

                  {/* Middle: Math Calculation */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-zinc-500">Rate / Unit</div>
                      <div className="font-bold text-emerald-400">${d.amountPerUnitUSD.toFixed(3)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">Your Eligible Units</div>
                      <div className="font-bold text-zinc-200">{userHoldings.toLocaleString()}</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-zinc-500">Your Pro-Rata Yield</div>
                      <div className="font-bold text-amber-400">${userShare.toFixed(2)} USDC</div>
                    </div>
                  </div>

                  {/* Right: Claim Action */}
                  <div className="shrink-0 flex items-center justify-end">
                    {d.isClaimedByUser ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800/80 px-3 py-2 text-xs font-mono text-zinc-400 border border-zinc-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Claimed (${userShare.toFixed(2)})</span>
                      </span>
                    ) : userShare > 0 ? (
                      <button
                        onClick={() => handleClaim(d)}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>Claim ${userShare.toFixed(2)} USDC</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-zinc-500 p-2">
                        No Snapshot Balance
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution Creation Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Execute On-Chain Yield Distribution</h3>
              <button onClick={() => setShowDistributeModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400">Target Asset</label>
                <select
                  value={distAssetSymbol}
                  onChange={(e) => setDistAssetSymbol(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200 focus:border-amber-400"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} - {a.name} (Circulating: {(a.totalSupplyCap - a.remainingUnits).toLocaleString()} units)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-400">Distribution Title / Description</label>
                <input
                  type="text"
                  value={distTitle}
                  onChange={(e) => setDistTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400">Total USDC to Deposit & Disburse</label>
                <input
                  type="number"
                  value={distAmountUSD}
                  onChange={(e) => setDistAmountUSD(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200"
                />
              </div>

              {/* Math preview */}
              {(() => {
                const ast = assets.find(a => a.symbol === distAssetSymbol);
                const circ = ast ? (ast.totalSupplyCap - ast.remainingUnits) : 1;
                const perUnit = circ > 0 ? (distAmountUSD / circ) : 0;
                return (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-zinc-400">
                      <span>Snapshot Circulating Units:</span>
                      <span className="text-zinc-200">{circ.toLocaleString()} units</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-zinc-800 pt-1">
                      <span>Calculated Rate per Unit:</span>
                      <span>${perUnit.toFixed(4)} USDC</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDistributeModal(false)}
                className="flex-1 rounded-xl border border-zinc-800 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDistSubmit}
                disabled={distAmountUSD <= 0}
                className="flex-1 rounded-xl bg-amber-400 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50"
              >
                Snapshot & Disburse USDC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
