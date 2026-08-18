import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  TrendingUp, 
  Calendar, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Percent, 
  Coins,
  DollarSign,
  AlertCircle,
  Landmark,
  Lock
} from 'lucide-react';
import { RWAAsset, InvestorProfile } from '../types';

interface AssetDetailModalProps {
  asset: RWAAsset;
  currentProfile: InvestorProfile;
  onClose: () => void;
  onInvest: (asset: RWAAsset, units: number) => { success: boolean; message: string };
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  currentProfile,
  onClose,
  onInvest
}) => {
  const [unitsToBuy, setUnitsToBuy] = useState<number>(20);
  const [txFeedback, setTxFeedback] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const handleInvestSubmit = () => {
    setTxFeedback({ status: 'loading', message: 'Verifying KYC credentials & submitting primary subscription on-chain...' });

    setTimeout(() => {
      const res = onInvest(asset, unitsToBuy);
      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => {
          setTxFeedback({ status: 'idle', message: '' });
          onClose();
        }, 1800);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 700);
  };

  const userHolding = currentProfile.rwaHoldings[asset.symbol] || 0;
  const totalCost = unitsToBuy * asset.currentPriceUSD;
  const annualEstimatedYield = totalCost * (asset.targetAPY / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-3xl rounded-2xl border border-zinc-800 bg-[#0d0d10] p-6 shadow-2xl space-y-6 flex flex-col animate-in fade-in">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-400/10 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-400 border border-amber-400/20">
                {asset.symbol}
              </span>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                {asset.category}
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {asset.rating}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{asset.name}</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <MapPin className="h-3.5 w-3.5 text-zinc-500" />
              <span>{asset.location}</span>
              <span>•</span>
              <span className="font-mono text-zinc-300">{asset.jurisdiction}</span>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">✕</button>
        </div>

        {/* Hero Image & Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 h-48 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 relative">
            <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
            <div className="absolute bottom-2 left-2 right-2 rounded bg-black/80 backdrop-blur p-2 text-[11px] font-mono text-zinc-300 border border-zinc-800 text-center">
              Contract: {asset.contractAddress.slice(0, 8)}...{asset.contractAddress.slice(-6)}
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <span className="text-[10px] text-zinc-500 font-medium">Target APY</span>
              <div className="text-xl font-mono font-bold text-amber-400 mt-0.5">{asset.targetAPY}%</div>
              <span className="text-[10px] text-emerald-400">{asset.distributionFrequency}</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <span className="text-[10px] text-zinc-500 font-medium">Unit Price</span>
              <div className="text-xl font-mono font-bold text-zinc-100 mt-0.5">${asset.currentPriceUSD.toFixed(2)}</div>
              <span className="text-[10px] text-zinc-400">USDC Settlement</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <span className="text-[10px] text-zinc-500 font-medium">Total Asset Value</span>
              <div className="text-xl font-mono font-bold text-zinc-100 mt-0.5">${(asset.totalValuationUSD / 1_000_000).toFixed(1)}M</div>
              <span className="text-[10px] text-zinc-400">Cap: {asset.totalSupplyCap.toLocaleString()}</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <span className="text-[10px] text-zinc-500 font-medium">Remaining Primary</span>
              <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">{asset.remainingUnits.toLocaleString()}</div>
              <span className="text-[10px] text-zinc-400">{asset.fundedPercentage}% Funded</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <span className="text-[10px] text-zinc-500 font-medium">Occupancy / Utilization</span>
              <div className="text-base font-mono font-bold text-zinc-200 mt-0.5">{asset.occupancyRate ? `${asset.occupancyRate}%` : '100%'}</div>
              <span className="text-[10px] text-zinc-400">Verified Tenants</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <span className="text-[10px] text-zinc-500 font-medium">Lockup Duration</span>
              <div className="text-base font-mono font-bold text-zinc-200 mt-0.5">{asset.lockupPeriodMonths} Months</div>
              <span className="text-[10px] text-zinc-400">Secondary Trade After</span>
            </div>
          </div>
        </div>

        {/* Legal SPV & Trust Prospectus */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Institutional SPV Custody & Legal Architecture</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">ERC-3643 Title Linked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500">Legal SPV Holding Entity:</span>
              <div className="font-semibold text-zinc-200 mt-0.5">{asset.spvName}</div>
            </div>
            <div>
              <span className="text-zinc-500">Asset Management Sponsor:</span>
              <div className="font-semibold text-zinc-200 mt-0.5">{asset.legalEntity}</div>
            </div>
            <div>
              <span className="text-zinc-500">Latest Independent Valuation Date:</span>
              <div className="font-mono text-zinc-300 mt-0.5">{asset.valuationDate} (Knight Frank / CBRE)</div>
            </div>
            <div>
              <span className="text-zinc-500">IPFS Immutable Prospectus CID:</span>
              <div className="font-mono text-amber-400 mt-0.5 truncate">{asset.metadataURI}</div>
            </div>
          </div>
        </div>

        {/* Investment & Subscription Calculator */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Primary Investment Calculator & Subscription</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400">Units to Subscribe:</label>
              <input
                type="number"
                min="1"
                max={asset.remainingUnits}
                value={unitsToBuy}
                onChange={(e) => setUnitsToBuy(Math.max(1, parseInt(e.target.value) || 0))}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-base font-bold text-white"
              />
            </div>

            <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs space-y-1">
              <span className="text-zinc-500">Total Purchase Cost:</span>
              <div className="text-lg font-bold text-amber-400">${totalCost.toLocaleString()} USDC</div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs space-y-1">
              <span className="text-zinc-500">Projected Annual Cashflow:</span>
              <div className="text-lg font-bold text-emerald-400">+${annualEstimatedYield.toFixed(2)} USDC</div>
            </div>
          </div>

          {/* Status Message */}
          {txFeedback.status !== 'idle' && (
            <div className={`rounded-lg p-3 text-xs flex items-center gap-2 ${
              txFeedback.status === 'loading'
                ? 'bg-zinc-800 text-zinc-300'
                : txFeedback.status === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/80 border border-red-500/40 text-red-300'
            }`}>
              {txFeedback.status === 'loading' && <div className="h-4 w-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>}
              {txFeedback.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
              {txFeedback.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
              <span>{txFeedback.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-800 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900"
            >
              Back to Catalog
            </button>

            <button
              onClick={handleInvestSubmit}
              disabled={txFeedback.status === 'loading' || asset.status !== 'FUNDING' || asset.remainingUnits === 0}
              className="flex-1 rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {txFeedback.status === 'loading' ? 'Broadcasting...' : `Confirm $${totalCost.toLocaleString()} USDC Subscription`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
