import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ShieldCheck, 
  Clock, 
  ShoppingBag,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { RWAAsset, InvestorProfile, MarketplaceOrder } from '../types';

interface MarketplaceTabProps {
  assets: RWAAsset[];
  orders: MarketplaceOrder[];
  currentProfile: InvestorProfile;
  onCreateOrder: (order: {
    assetSymbol: string;
    quantity: number;
    pricePerUnitUSD: number;
  }) => { success: boolean; message: string };
  onFulfillOrder: (orderId: number) => { success: boolean; message: string };
  onCancelOrder: (orderId: number) => { success: boolean; message: string };
}

export const MarketplaceTab: React.FC<MarketplaceTabProps> = ({
  assets,
  orders,
  currentProfile,
  onCreateOrder,
  onFulfillOrder,
  onCancelOrder
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState(assets[0]?.symbol || '');
  const [orderQuantity, setOrderQuantity] = useState<number>(10);
  const [orderPrice, setOrderPrice] = useState<number>(100);
  const [filterAsset, setFilterAsset] = useState<string>('ALL');
  
  const [txFeedback, setTxFeedback] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const activeOrders = orders.filter(o => o.status === 'ACTIVE' && (filterAsset === 'ALL' || o.assetSymbol === filterAsset));
  const myOrders = orders.filter(o => o.sellerAddress.toLowerCase() === currentProfile.address.toLowerCase());

  const handleCreateOrderSubmit = () => {
    setTxFeedback({ status: 'loading', message: 'Escrowing RWA tokens into AssetNexaMarketplace smart contract...' });
    
    setTimeout(() => {
      const res = onCreateOrder({
        assetSymbol: selectedAssetSymbol,
        quantity: orderQuantity,
        pricePerUnitUSD: orderPrice
      });

      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => {
          setShowCreateModal(false);
          setTxFeedback({ status: 'idle', message: '' });
        }, 1500);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 600);
  };

  const handleFulfillOrderClick = (orderId: number) => {
    setTxFeedback({ status: 'loading', message: 'Executing atomic atomic settlement with 1% protocol fee split...' });
    
    setTimeout(() => {
      const res = onFulfillOrder(orderId);
      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => {
          setTxFeedback({ status: 'idle', message: '' });
        }, 2000);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 600);
  };

  const handleCancelOrderClick = (orderId: number) => {
    setTxFeedback({ status: 'loading', message: 'Reclaiming escrowed tokens from smart contract...' });
    
    setTimeout(() => {
      const res = onCancelOrder(orderId);
      if (res.success) {
        setTxFeedback({ status: 'success', message: res.message });
        setTimeout(() => {
          setTxFeedback({ status: 'idle', message: '' });
        }, 1500);
      } else {
        setTxFeedback({ status: 'error', message: res.message });
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-black p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Secondary P2P Liquidity Order Book</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Institutional secondary market for fractional real estate, solar infrastructure, and credit tokens. Non-custodial escrow with automatic 1% fee allocation and instant compliance settlement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setTxFeedback({ status: 'idle', message: '' });
              }}
              className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Create Sell Order</span>
            </button>
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
          {txFeedback.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />}
          <span className="font-sans">{txFeedback.message}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterAsset('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              filterAsset === 'ALL'
                ? 'bg-amber-400 text-black font-bold'
                : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Listings
          </button>
          {assets.map(a => (
            <button
              key={a.symbol}
              onClick={() => setFilterAsset(a.symbol)}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold ${
                filterAsset === a.symbol
                  ? 'bg-amber-400 text-black font-bold'
                  : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {a.symbol}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-zinc-500">{activeOrders.length} Active Listings</span>
      </div>

      {/* Order Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeOrders.map((order) => {
          const isMyOrder = order.sellerAddress.toLowerCase() === currentProfile.address.toLowerCase();
          const targetAsset = assets.find(a => a.symbol === order.assetSymbol);

          return (
            <div
              key={order.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 hover:border-zinc-700 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-400/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-400 border border-amber-400/20">
                      {order.assetSymbol}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">Order #{order.id}</span>
                  </div>
                  <span className="rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    ESCROWED
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm line-clamp-1">{order.assetName}</h4>
                  <div className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                    Seller: {order.sellerAddress}
                  </div>
                </div>
              </div>

              {/* Pricing & Units Box */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Quantity Listed:</span>
                  <span className="font-bold text-zinc-200">{order.quantity.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Price / Unit:</span>
                  <span className="font-bold text-emerald-400">${order.pricePerUnitUSD.toFixed(2)} USDC</span>
                </div>
                {targetAsset && (
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>Primary Benchmark:</span>
                    <span>${targetAsset.currentPriceUSD.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-400 font-bold border-t border-zinc-800/80 pt-1.5">
                  <span>Total Value:</span>
                  <span>${order.totalValueUSD.toLocaleString()} USDC</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                {isMyOrder ? (
                  <button
                    onClick={() => handleCancelOrderClick(order.id)}
                    className="w-full rounded-lg border border-red-500/30 bg-red-950/20 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/50 transition"
                  >
                    Cancel Listing & Reclaim Units
                  </button>
                ) : (
                  <button
                    onClick={() => handleFulfillOrderClick(order.id)}
                    className="w-full rounded-lg bg-amber-400 py-2 text-xs font-bold text-black hover:bg-amber-300 transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Instant Buy & Settle</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeOrders.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-8 text-center space-y-2">
          <ArrowLeftRight className="mx-auto h-8 w-8 text-zinc-600" />
          <h3 className="text-sm font-bold text-zinc-300">No Active Sell Orders</h3>
          <p className="text-xs text-zinc-500">Be the first to list fractional units for peer-to-peer settlement.</p>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Secondary Sell Listing</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400">Select RWA Asset</label>
                <select
                  value={selectedAssetSymbol}
                  onChange={(e) => {
                    setSelectedAssetSymbol(e.target.value);
                    const ast = assets.find(a => a.symbol === e.target.value);
                    if (ast) setOrderPrice(ast.currentPriceUSD);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200 focus:border-amber-400"
                >
                  {assets.map(a => {
                    const held = currentProfile.rwaHoldings[a.symbol] || 0;
                    return (
                      <option key={a.symbol} value={a.symbol}>
                        {a.symbol} - {a.name} (You hold: {held})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400">
                  <span>Units to Sell:</span>
                  <span className="font-mono text-zinc-300">
                    Available: {currentProfile.rwaHoldings[selectedAssetSymbol] || 0}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={currentProfile.rwaHoldings[selectedAssetSymbol] || 0}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200"
                />
              </div>

              <div>
                <label className="text-zinc-400">Price per Unit (USDC)</label>
                <input
                  type="number"
                  step="0.1"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200"
                />
              </div>

              {/* Settlement Preview */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>Gross Proceeds:</span>
                  <span>${(orderQuantity * orderPrice).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Protocol Fee (1% on fill):</span>
                  <span>${((orderQuantity * orderPrice) * 0.01).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold border-t border-zinc-800 pt-1">
                  <span>Net Estimated Payout:</span>
                  <span>${((orderQuantity * orderPrice) * 0.99).toFixed(2)} USDC</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-xl border border-zinc-800 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrderSubmit}
                disabled={orderQuantity <= 0 || (currentProfile.rwaHoldings[selectedAssetSymbol] || 0) < orderQuantity}
                className="flex-1 rounded-xl bg-amber-400 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50"
              >
                Deposit & Escrow Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
