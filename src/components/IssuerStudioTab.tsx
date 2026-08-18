import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Upload,
  Cpu,
  Coins
} from 'lucide-react';
import { RWAAsset, InvestorProfile, AssetCategory, AssetStatus } from '../types';

interface IssuerStudioTabProps {
  assets: RWAAsset[];
  currentProfile: InvestorProfile;
  onDeployAsset: (newAsset: RWAAsset) => { success: boolean; message: string };
  onUpdateAssetStatus: (assetId: string, newStatus: AssetStatus) => void;
}

export const IssuerStudioTab: React.FC<IssuerStudioTabProps> = ({
  assets,
  currentProfile,
  onDeployAsset,
  onUpdateAssetStatus
}) => {
  const [showDeployWizard, setShowDeployWizard] = useState(false);

  // Deploy form
  const [name, setName] = useState('Marina Bay Financial Tower III');
  const [symbol, setSymbol] = useState('MBFT3');
  const [category, setCategory] = useState<AssetCategory>('COMMERCIAL_REAL_ESTATE');
  const [location, setLocation] = useState('Marina Boulevard, Downtown Core, Singapore');
  const [jurisdiction, setJurisdiction] = useState('SG (MAS Compliant SPV)');
  const [totalValuationUSD, setTotalValuationUSD] = useState<number>(50_000_000);
  const [totalSupplyCap, setTotalSupplyCap] = useState<number>(500_000);
  const [initialPriceUSD, setInitialPriceUSD] = useState<number>(100);
  const [targetAPY, setTargetAPY] = useState<number>(8.9);
  const [spvName, setSpvName] = useState('Marina Bay Nexa Trust SPV #12 Pte. Ltd.');
  const [legalEntity, setLegalEntity] = useState('Keppel-Nexa Real Estate Asset Management');
  const [frequency, setFrequency] = useState<'Monthly' | 'Quarterly'>('Quarterly');
  const [description, setDescription] = useState('Ultra-prime commercial skyscraper situated in Singapore financial district with multinational bank headquarters as anchor tenants.');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb18f156b?auto=format&fit=crop&w=1200&q=80');
  const [metadataURI, setMetadataURI] = useState('ipfs://bafybeimarinabaytower3prospectus2026');

  const [txFeedback, setTxFeedback] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const handleDeploySubmit = () => {
    setTxFeedback({ status: 'loading', message: 'Triggering AssetNexaFactory.deployRWAContract() on-chain...' });

    setTimeout(() => {
      const newAsset: RWAAsset = {
        id: `rwa-${Date.now().toString().slice(-4)}`,
        assetIdBytes32: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        contractAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        name,
        symbol: symbol.toUpperCase(),
        category,
        location,
        jurisdiction,
        totalValuationUSD,
        totalSupplyCap,
        remainingUnits: totalSupplyCap,
        initialPriceUSD,
        currentPriceUSD: initialPriceUSD,
        targetAPY,
        status: 'FUNDING',
        issuerName: currentProfile.name,
        issuerAddress: currentProfile.address,
        paymentToken: 'USDC (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)',
        metadataURI,
        image,
        description,
        legalEntity,
        valuationDate: new Date().toISOString().split('T')[0],
        distributionFrequency: frequency,
        fundedPercentage: 0,
        investorCount: 0,
        rating: 'AA+ (Institutional Quality)',
        spvName,
        lockupPeriodMonths: 6
      };

      const res = onDeployAsset(newAsset);
      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => {
          setShowDeployWizard(false);
          setTxFeedback({ status: 'idle', message: '' });
        }, 1800);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-black p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Institutional Asset Tokenization Studio</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Deploy regulatory-compliant ERC-3643 asset contracts with immutable supply caps, SPV trust structures, and automated payment gateway bindings.
            </p>
          </div>

          <button
            onClick={() => {
              setShowDeployWizard(true);
              setTxFeedback({ status: 'idle', message: '' });
            }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Deploy New Tokenized Asset</span>
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

      {/* Deployed Assets Lifecycle Management */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-200">Registered RWA Contracts & Lifecycle State Manager</h3>

        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4 hover:border-zinc-700 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-400/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-400 border border-amber-400/20">
                      {asset.symbol}
                    </span>
                    <h4 className="font-bold text-white text-sm">{asset.name}</h4>
                    <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                      {asset.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                    <span>Contract: <strong className="text-zinc-300">{asset.contractAddress}</strong></span>
                    <span>•</span>
                    <span>SPV: <strong>{asset.spvName}</strong></span>
                  </div>
                </div>

                {/* Right: State controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-xs font-mono text-right">
                    <div className="text-zinc-500">Current Status</div>
                    <div className="font-bold text-amber-400">{asset.status}</div>
                  </div>

                  <select
                    value={asset.status}
                    onChange={(e) => onUpdateAssetStatus(asset.id, e.target.value as AssetStatus)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-amber-400"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="FUNDING">FUNDING (Active Primary)</option>
                    <option value="FUNDED">FUNDED (Cap Reached)</option>
                    <option value="PAUSED">PAUSED (Emergency Stop)</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs">
                <div>
                  <span className="text-zinc-500 text-[10px]">Supply Cap</span>
                  <div className="text-zinc-200 font-bold">{asset.totalSupplyCap.toLocaleString()} units</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">Remaining Primary</span>
                  <div className="text-emerald-400 font-bold">{asset.remainingUnits.toLocaleString()} units</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">Total Valuation</span>
                  <div className="text-zinc-200 font-bold">${(asset.totalValuationUSD / 1_000_000).toFixed(1)}M USD</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">Target APY</span>
                  <div className="text-amber-400 font-bold">{asset.targetAPY}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deploy Wizard Modal */}
      {showDeployWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  Asset Tokenizer & Factory Deployer
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Deploy New Institutional RWA Contract</h3>
              </div>
              <button onClick={() => setShowDeployWizard(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="text-zinc-400">Asset Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-200 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-zinc-400">Token Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 font-mono text-zinc-200 uppercase"
                />
              </div>

              <div>
                <label className="text-zinc-400">Asset Category</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-200"
                >
                  <option value="COMMERCIAL_REAL_ESTATE">Commercial Real Estate</option>
                  <option value="INFRASTRUCTURE">Green Energy Infrastructure</option>
                  <option value="PRIVATE_CREDIT">Private Credit & Fixed Income</option>
                  <option value="RESIDENTIAL_REAL_ESTATE">Prime Residential</option>
                  <option value="COMMODITIES">Commodities & Carbon Credits</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400">Legal Jurisdiction</label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400">Total Asset Valuation (USD)</label>
                <input
                  type="number"
                  value={totalValuationUSD}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setTotalValuationUSD(val);
                    setTotalSupplyCap(Math.floor(val / initialPriceUSD));
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 font-mono text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400">Initial Unit Price (USDC)</label>
                <input
                  type="number"
                  value={initialPriceUSD}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 100;
                    setInitialPriceUSD(price);
                    setTotalSupplyCap(Math.floor(totalValuationUSD / price));
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 font-mono text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400">Calculated Supply Cap (Immutable)</label>
                <input
                  type="number"
                  disabled
                  value={totalSupplyCap}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-zinc-400"
                />
              </div>

              <div>
                <label className="text-zinc-400">Target APY (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetAPY}
                  onChange={(e) => setTargetAPY(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 font-mono text-zinc-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-400">Special Purpose Vehicle (SPV) Entity</label>
                <input
                  type="text"
                  value={spvName}
                  onChange={(e) => setSpvName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-400">IPFS Legal Prospectus URI</label>
                <input
                  type="text"
                  value={metadataURI}
                  onChange={(e) => setMetadataURI(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 font-mono text-zinc-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-400">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-200"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowDeployWizard(false)}
                className="flex-1 rounded-xl border border-zinc-800 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploySubmit}
                disabled={!name || !symbol}
                className="flex-1 rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50 shadow-lg shadow-amber-500/20"
              >
                Deploy ERC-3643 RWA Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
