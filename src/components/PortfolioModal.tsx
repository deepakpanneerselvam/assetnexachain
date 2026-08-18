import React from 'react';
import { 
  Wallet, 
  Building2, 
  Coins, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Layers,
  ArrowDownLeft,
  ExternalLink
} from 'lucide-react';
import { InvestorProfile, RWAAsset } from '../types';

interface PortfolioModalProps {
  currentProfile: InvestorProfile;
  assets: RWAAsset[];
  onClose: () => void;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  currentProfile,
  assets,
  onClose
}) => {
  // Calculate total portfolio value
  let totalTokenizedValueUSD = 0;
  const holdingItems = Object.entries(currentProfile.rwaHoldings).map(([symbol, rawQty]) => {
    const qty = Number(rawQty) || 0;
    const asset = assets.find(a => a.symbol === symbol);
    const unitPrice = asset ? asset.currentPriceUSD : 100;
    const value = qty * unitPrice;
    totalTokenizedValueUSD += value;
    return {
      symbol,
      qty,
      unitPrice,
      value,
      asset
    };
  });

  const netWorthUSD = currentProfile.usdcBalance + totalTokenizedValueUSD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#0d0d10] p-6 shadow-2xl space-y-5 flex flex-col max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Investor Portfolio & Position Balance</h2>
              <p className="text-xs text-zinc-400 font-mono">{currentProfile.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1">
            <div className="text-[11px] text-zinc-500 font-medium">Total Net Asset Value</div>
            <div className="text-xl font-mono font-bold text-amber-400">${netWorthUSD.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-400 font-mono">Liquid USDC + RWAs</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1">
            <div className="text-[11px] text-zinc-500 font-medium">Liquid USDC Balance</div>
            <div className="text-xl font-mono font-bold text-emerald-400">${currentProfile.usdcBalance.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-400 font-mono">Available for Subscriptions</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1">
            <div className="text-[11px] text-zinc-500 font-medium">Tokenized Assets</div>
            <div className="text-xl font-mono font-bold text-zinc-100">${totalTokenizedValueUSD.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-400 font-mono">{holdingItems.length} Positions</div>
          </div>
        </div>

        {/* Compliance Status Overview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-zinc-200">
            <span>Identity & Compliance Credentials</span>
            <span className="text-[10px] font-mono text-zinc-500">ERC-3643 Verified</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
            <div>
              <span className="text-zinc-500 block">Status:</span>
              <span className={currentProfile.isKYCApproved ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {currentProfile.isKYCApproved ? 'KYC Approved ✓' : 'KYC Pending'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Classification:</span>
              <span className="text-zinc-200 font-bold">{currentProfile.role}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Country Code:</span>
              <span className="text-amber-400 font-bold">{currentProfile.jurisdictionCode}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Remaining Quota:</span>
              <span className="text-emerald-400 font-bold">
                ${(currentProfile.investmentLimitUSD - currentProfile.totalInvestedUSD).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Current RWA Asset Holdings</h3>

          {holdingItems.length > 0 ? (
            <div className="space-y-2">
              {holdingItems.map((item) => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 hover:border-zinc-700 transition font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 font-bold text-amber-400 border border-amber-400/20">
                      {item.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-sans font-bold text-zinc-100">{item.asset?.name || item.symbol}</div>
                      <div className="text-[10px] text-zinc-500">{item.qty.toLocaleString()} units @ ${item.unitPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-zinc-100">${item.value.toLocaleString()} USDC</div>
                    <div className="text-[10px] text-emerald-400 font-sans">Target APY: {item.asset?.targetAPY || 10}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-6 text-center text-xs text-zinc-500">
              No tokenized real-world assets in this wallet. Visit the Explorer to subscribe to primary offerings.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
          >
            Close Portfolio
          </button>
        </div>
      </div>
    </div>
  );
};
