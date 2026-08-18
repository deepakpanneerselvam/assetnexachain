import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  MapPin, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  ArrowUpRight,
  Filter,
  Search,
  Sparkles,
  PieChart,
  Calendar,
  FileText,
  Percent
} from 'lucide-react';
import { RWAAsset, InvestorProfile, AssetCategory } from '../types';

interface ExplorerTabProps {
  assets: RWAAsset[];
  currentProfile: InvestorProfile;
  onSelectAsset: (asset: RWAAsset) => void;
  onQuickInvest: (asset: RWAAsset, units: number) => { success: boolean; message: string };
}

export const ExplorerTab: React.FC<ExplorerTabProps> = ({
  assets,
  currentProfile,
  onSelectAsset,
  onQuickInvest,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [investModalAsset, setInvestModalAsset] = useState<RWAAsset | null>(null);
  const [investUnits, setInvestUnits] = useState<number>(10);
  const [txFeedback, setTxFeedback] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Asset Classes' },
    { id: 'COMMERCIAL_REAL_ESTATE', label: 'Commercial Real Estate' },
    { id: 'INFRASTRUCTURE', label: 'Green Infrastructure' },
    { id: 'PRIVATE_CREDIT', label: 'Private Credit' },
    { id: 'RESIDENTIAL_REAL_ESTATE', label: 'Prime Residential' },
  ];

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory = selectedCategory === 'ALL' || asset.category === selectedCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleInvestSubmit = () => {
    if (!investModalAsset) return;
    setTxFeedback({ status: 'loading', message: 'Simulating on-chain compliance check & payment authorization...' });
    
    setTimeout(() => {
      const res = onQuickInvest(investModalAsset, investUnits);
      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => {
          setInvestModalAsset(null);
          setTxFeedback({ status: 'idle', message: '' });
        }, 1800);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with Institutional Metrics */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-black p-6 sm:p-8">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Institutional On-Chain Asset Tokenization</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Compliant Real-World Assets with Programmable Cash Flows
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Tokenized debt, real estate, and infrastructure registered under institutional Special Purpose Vehicles (SPVs). Fully enforced by automated ERC-3643 smart contracts with dual-signature price timelocks.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="rounded-xl border border-zinc-800 bg-black/50 p-3.5">
              <div className="text-[11px] text-zinc-400 font-medium">Average Target APY</div>
              <div className="text-xl font-mono font-bold text-amber-400 mt-1">10.88%</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Quarterly/Monthly Cashflow</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-black/50 p-3.5">
              <div className="text-[11px] text-zinc-400 font-medium">Compliance Guard</div>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-1">100%</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Automated Whitelist</div>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-zinc-800 bg-black/50 p-3.5">
              <div className="text-[11px] text-zinc-400 font-medium">Secondary Liquidity</div>
              <div className="text-xl font-mono font-bold text-zinc-100 mt-1">Instant</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">P2P Escrow Order Book</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === c.id
                  ? 'bg-amber-400 text-black font-bold shadow-sm'
                  : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by asset name, symbol, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-1.5 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssets.map((asset) => {
          const userHolding = currentProfile.rwaHoldings[asset.symbol] || 0;
          return (
            <div
              key={asset.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70 transition-all hover:border-zinc-700 hover:shadow-xl hover:shadow-black/60"
            >
              {/* Image & Header Status */}
              <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                <img
                  src={asset.image}
                  alt={asset.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent"></div>

                {/* Top Badges */}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 backdrop-blur border border-amber-400/30">
                    {asset.symbol}
                  </span>
                  <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 backdrop-blur border border-emerald-500/30">
                    {asset.rating}
                  </span>
                </div>

                <div className="absolute right-3 top-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur ${
                    asset.status === 'FUNDING'
                      ? 'bg-amber-500/80 text-black font-extrabold'
                      : asset.status === 'FUNDED'
                      ? 'bg-emerald-500/80 text-black font-extrabold'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {asset.status}
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{asset.jurisdiction}</span>
                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-amber-400 transition">
                      {asset.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block">Target APY</span>
                    <span className="text-base font-mono font-extrabold text-amber-400">{asset.targetAPY}%</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{asset.location}</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {asset.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Funded: <strong className="text-zinc-200">{asset.fundedPercentage}%</strong></span>
                    <span className="text-zinc-400">${(asset.totalValuationUSD / 1_000_000).toFixed(1)}M Valuation</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, asset.fundedPercentage)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-800/70 bg-zinc-950/60 p-2.5 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-zinc-500">Unit Price</div>
                    <div className="text-xs font-bold text-zinc-200">${asset.currentPriceUSD.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Remaining</div>
                    <div className="text-xs font-bold text-zinc-200">{asset.remainingUnits.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Frequency</div>
                    <div className="text-xs font-bold text-amber-400">{asset.distributionFrequency}</div>
                  </div>
                </div>

                {/* My Position if any */}
                {userHolding > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-950/30 border border-emerald-500/20 px-3 py-1.5 text-xs font-mono">
                    <span className="text-emerald-400">Your Holding:</span>
                    <span className="text-zinc-200 font-bold">{userHolding} units (${(userHolding * asset.currentPriceUSD).toLocaleString()})</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onSelectAsset(asset)}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700 transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Prospectus & Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setInvestModalAsset(asset);
                      setInvestUnits(10);
                      setTxFeedback({ status: 'idle', message: '' });
                    }}
                    disabled={asset.status !== 'FUNDING' || asset.remainingUnits === 0}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      asset.status === 'FUNDING' && asset.remainingUnits > 0
                        ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-sm shadow-amber-500/20'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Invest</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Investment Modal */}
      {investModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  Primary Offering Subscription
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">{investModalAsset.name}</h2>
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1">
                  <span>Token: <strong>{investModalAsset.symbol}</strong></span>
                  <span>•</span>
                  <span>Unit Price: <strong>${investModalAsset.currentPriceUSD.toFixed(2)} USDC</strong></span>
                </div>
              </div>
              <button
                onClick={() => setInvestModalAsset(null)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {/* Investor Compliance Status Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Current Investor Profile:</span>
                <span className="font-semibold text-white">{currentProfile.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">KYC Status:</span>
                  {currentProfile.isKYCApproved ? (
                    <span className="text-emerald-400 flex items-center gap-1">✓ Approved</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">⚠ Unverified</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">Jurisdiction:</span>
                  <span className="text-zinc-300 font-bold">{currentProfile.jurisdictionCode}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">USDC Liquid:</span>
                  <span className="text-zinc-300 font-bold">${currentProfile.usdcBalance.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">Limit Left:</span>
                  <span className="text-emerald-400 font-bold">${(currentProfile.investmentLimitUSD - currentProfile.totalInvestedUSD).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Unit Input and Calculations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Units to Purchase:</label>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => setInvestUnits(5)}
                    className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300 hover:bg-zinc-700"
                  >
                    5
                  </button>
                  <button
                    onClick={() => setInvestUnits(25)}
                    className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300 hover:bg-zinc-700"
                  >
                    25
                  </button>
                  <button
                    onClick={() => setInvestUnits(100)}
                    className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300 hover:bg-zinc-700"
                  >
                    100
                  </button>
                  <button
                    onClick={() => {
                      const maxAfford = Math.floor(currentProfile.usdcBalance / investModalAsset.currentPriceUSD);
                      setInvestUnits(Math.min(maxAfford, investModalAsset.remainingUnits));
                    }}
                    className="rounded bg-amber-400/20 text-amber-300 px-2 py-0.5 hover:bg-amber-400/30"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={investModalAsset.remainingUnits}
                  value={investUnits}
                  onChange={(e) => setInvestUnits(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-lg font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
                />
                <div className="absolute right-4 top-3 text-xs font-mono text-zinc-500">
                  Units
                </div>
              </div>

              {/* Settlement Breakdown */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Gross Principal Cost:</span>
                  <span>${(investUnits * investModalAsset.currentPriceUSD).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Platform Primary Fee (0.5%):</span>
                  <span>${((investUnits * investModalAsset.currentPriceUSD) * 0.005).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Net to Issuer SPV:</span>
                  <span>${((investUnits * investModalAsset.currentPriceUSD) * 0.995).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold border-t border-zinc-800 pt-1.5">
                  <span>Total Payable:</span>
                  <span>${(investUnits * investModalAsset.currentPriceUSD).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-emerald-400 pt-0.5">
                  <span>Est. Annual Yield @ {investModalAsset.targetAPY}%:</span>
                  <span>${((investUnits * investModalAsset.currentPriceUSD) * (investModalAsset.targetAPY / 100)).toFixed(2)} / yr</span>
                </div>
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
                {txFeedback.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />}
                <span>{txFeedback.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setInvestModalAsset(null)}
                className="flex-1 rounded-xl border border-zinc-800 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInvestSubmit}
                disabled={txFeedback.status === 'loading' || investUnits <= 0}
                className="flex-1 rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {txFeedback.status === 'loading' ? 'Confirming On-Chain...' : 'Confirm Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
