import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  ArrowLeftRight, 
  Coins, 
  Scale, 
  PlusCircle, 
  Wallet, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Cpu,
  Layers,
  FileText,
  BookOpen,
  Download
} from 'lucide-react';
import { InvestorProfile, ProtocolStats } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentProfile: InvestorProfile;
  profiles: InvestorProfile[];
  onSelectProfile: (profile: InvestorProfile) => void;
  stats: ProtocolStats;
  onOpenTerminal: () => void;
  onOpenPortfolio: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentProfile,
  profiles,
  onSelectProfile,
  stats,
  onOpenTerminal,
  onOpenPortfolio
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const navItems = [
    { id: 'explorer', label: 'RWA Assets', icon: Building2, badge: 'Live' },
    { id: 'compliance', label: 'Compliance Engine', icon: ShieldCheck, badge: 'ERC-3643' },
    { id: 'marketplace', label: 'Secondary Trading', icon: ArrowLeftRight },
    { id: 'yield', label: 'Yield Distributions', icon: Coins },
    { id: 'governance', label: 'Price & Timelock', icon: Scale },
    { id: 'issuer', label: 'Issuer Studio', icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur supports-[backdrop-filter]:bg-[#09090b]/80">
      {/* Top Protocol Status Bar */}
      <div className="border-b border-zinc-900 bg-black/40 px-4 py-1.5 text-xs text-zinc-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-mono text-emerald-400 font-semibold">{stats.networkName}</span>
              <span className="text-zinc-600">|</span>
              <span className="font-mono text-zinc-400">Block #{stats.currentBlockNumber}</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-zinc-500 font-mono">
              <span>Gas: <strong className="text-zinc-300">{stats.gasGwei} Gwei</strong></span>
              <span>•</span>
              <span>TVL: <strong className="text-zinc-200">${(stats.totalValueLockedUSD / 1_000_000).toFixed(1)}M</strong></span>
              <span>•</span>
              <span>Yield Paid: <strong className="text-emerald-400">${(stats.totalYieldDistributedUSD / 1_000).toFixed(0)}k</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/whitepaper.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download="AssetNexaChain_Whitepaper.pdf"
              className="flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono text-amber-300 hover:border-amber-400 hover:bg-amber-500/20 transition"
              title="Download Institutional Whitepaper (PDF)"
            >
              <FileText className="h-3 w-3 text-amber-400" />
              <span>Whitepaper.pdf</span>
            </a>
            <a
              href="/readme.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 transition"
              title="View Build, Test & Run instructions"
            >
              <BookOpen className="h-3 w-3 text-zinc-400" />
              <span>Readme.txt</span>
            </a>
            <button
              onClick={onOpenTerminal}
              className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 transition"
              title="Inspect Smart Contracts on-chain"
            >
              <Cpu className="h-3 w-3 text-amber-400" />
              <span>ABI Terminal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-md shadow-amber-500/20 font-bold">
            <Layers className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white">AssetNexa<span className="text-amber-400">Chain</span></span>
              <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-400/20">
                INSTITUTIONAL
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">ERC-3643 & BNB Chain RWA Terminal</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Wallet & Profile Selector */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPortfolio}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs hover:border-zinc-700 hover:bg-zinc-800 transition"
          >
            <Wallet className="h-4 w-4 text-emerald-400" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-zinc-400">USDC Liquid</div>
              <div className="font-semibold text-zinc-100">${currentProfile.usdcBalance.toLocaleString()}</div>
            </div>
          </button>

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:border-amber-500/60 transition shadow-sm"
            >
              <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-amber-400 text-xs border border-zinc-700">
                {currentProfile.name.charAt(0)}
              </div>
              <div className="text-left max-w-[140px] truncate">
                <div className="truncate font-semibold text-white text-xs">{currentProfile.name.split(' ')[0]}</div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                  <span>{currentProfile.role}</span>
                  {currentProfile.isKYCApproved ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-400" />
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-[#121215] p-2 shadow-2xl z-50">
                <div className="px-2 py-1.5 border-b border-zinc-800/80 mb-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Switch Test Role / Wallet</span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Test on-chain permissions as investor, compliance officer, or asset issuer.</p>
                </div>
                <div className="space-y-1">
                  {profiles.map((p) => (
                    <button
                      key={p.address}
                      onClick={() => {
                        onSelectProfile(p);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition ${
                        p.address === currentProfile.address
                          ? 'bg-amber-400/10 border border-amber-400/30'
                          : 'hover:bg-zinc-800/70'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0 border border-zinc-700 mt-0.5">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-zinc-200 truncate">{p.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {p.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-zinc-400">
                          <span>${p.usdcBalance.toLocaleString()} USDC</span>
                          <span>•</span>
                          <span className={p.isKYCApproved ? 'text-emerald-400' : 'text-amber-400'}>
                            {p.isKYCApproved ? 'KYC ✓' : 'KYC Pending'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-600 truncate mt-0.5">
                          {p.address}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="flex lg:hidden overflow-x-auto border-t border-zinc-800/80 px-2 py-1.5 gap-1 bg-[#0d0d10]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                isActive ? 'bg-amber-400/20 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
