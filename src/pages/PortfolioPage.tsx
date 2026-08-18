import React from 'react';
import { InvestorProfile, RWAAsset } from '../types';
import { calculatePortfolioNAV } from '../utils/calculations';
import { formatUSD, formatPercentage, shortenAddress } from '../utils/formatters';
import { Wallet, TrendingUp, ShieldCheck, PieChart, Layers } from 'lucide-react';

interface PortfolioPageProps {
  currentProfile: InvestorProfile;
  assets: RWAAsset[];
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ currentProfile, assets }) => {
  const nav = calculatePortfolioNAV(currentProfile, assets);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{currentProfile.name}</h1>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
                  {currentProfile.role}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-500">{currentProfile.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs text-zinc-400">Total Net Asset Value (NAV)</span>
              <p className="text-2xl font-bold font-mono text-amber-400">
                {formatUSD(nav.totalNAVUSD)}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80">
          <div className="rounded-lg bg-zinc-900/60 p-4 border border-zinc-800/50">
            <div className="text-xs text-zinc-400">RWA Token Positions</div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {formatUSD(nav.tokensValueUSD)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-900/60 p-4 border border-zinc-800/50">
            <div className="text-xs text-zinc-400">Liquid USDC Balance</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {formatUSD(nav.cashUSD)}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-900/60 p-4 border border-zinc-800/50">
            <div className="text-xs text-zinc-400">Compliance Quota Used</div>
            <div className="text-lg font-bold font-mono text-zinc-200 mt-1">
              {formatUSD(currentProfile.totalInvestedUSD)} / {formatUSD(currentProfile.investmentLimitUSD, true)}
            </div>
          </div>
        </div>
      </div>

      {/* Holdings List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Tokenized RWA Holdings</h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {nav.holdingsBreakdown.length} Positions Active
          </span>
        </div>

        {nav.holdingsBreakdown.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <p>No active tokenized RWA positions found in this wallet.</p>
            <p className="text-xs text-zinc-600 mt-1">Explore offerings on the Primary Explorer tab to subscribe.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 text-xs text-zinc-400">
                <tr>
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium text-right">Units</th>
                  <th className="pb-3 font-medium text-right">Unit Price</th>
                  <th className="pb-3 font-medium text-right">Position Value</th>
                  <th className="pb-3 font-medium text-right">Target APY</th>
                  <th className="pb-3 font-medium text-right">Est. Annual Income</th>
                  <th className="pb-3 font-medium text-right">Portfolio Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
                {nav.holdingsBreakdown.map((holding) => (
                  <tr key={holding.symbol} className="hover:bg-zinc-900/40">
                    <td className="py-3">
                      <div>
                        <span className="font-bold text-white">{holding.symbol}</span>
                        <div className="text-[11px] text-zinc-400 font-sans">{holding.assetName}</div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-zinc-200">{holding.units.toLocaleString()}</td>
                    <td className="py-3 text-right text-zinc-400">{formatUSD(holding.unitPrice)}</td>
                    <td className="py-3 text-right font-bold text-amber-400">{formatUSD(holding.totalValueUSD)}</td>
                    <td className="py-3 text-right text-emerald-400 font-bold">{formatPercentage(holding.targetAPY)}</td>
                    <td className="py-3 text-right text-emerald-400">{formatUSD(holding.annualIncomeUSD)}</td>
                    <td className="py-3 text-right text-zinc-400">{formatPercentage(holding.sharePercentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
