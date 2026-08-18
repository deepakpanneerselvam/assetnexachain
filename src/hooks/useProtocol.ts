import { useState, useCallback } from 'react';
import {
  RWAAsset,
  InvestorProfile,
  MarketplaceOrder,
  YieldDistribution,
  PriceProposal,
  ProtocolStats,
  AssetStatus,
} from '../types';
import {
  INITIAL_ASSETS,
  INITIAL_PROFILES,
  INITIAL_MARKETPLACE_ORDERS,
  INITIAL_YIELD_DISTRIBUTIONS,
  INITIAL_PRICE_PROPOSALS,
} from '../data/mockAssets';

export function useProtocol() {
  const [assets, setAssets] = useState<RWAAsset[]>(INITIAL_ASSETS);
  const [profiles, setProfiles] = useState<InvestorProfile[]>(INITIAL_PROFILES);
  const [currentProfile, setCurrentProfile] = useState<InvestorProfile>(INITIAL_PROFILES[0]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>(INITIAL_MARKETPLACE_ORDERS);
  const [distributions, setDistributions] = useState<YieldDistribution[]>(INITIAL_YIELD_DISTRIBUTIONS);
  const [proposals, setProposals] = useState<PriceProposal[]>(INITIAL_PRICE_PROPOSALS);

  const [stats, setStats] = useState<ProtocolStats>({
    totalValueLockedUSD: 140_500_000,
    totalFundedAssets: 5,
    activeInvestorsCount: 1346,
    totalYieldDistributedUSD: 964_550,
    secondaryVolume24hUSD: 180_820,
    activeListingsCount: 3,
    gasGwei: 3.2,
    currentBlockNumber: 38294102,
    chainId: 97,
    networkName: 'BNB Chain Testnet',
  });

  const selectProfile = useCallback((profile: InvestorProfile) => {
    setCurrentProfile(profile);
  }, []);

  const updateProfile = useCallback((updated: InvestorProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.address.toLowerCase() === updated.address.toLowerCase() ? updated : p))
    );
    setCurrentProfile((curr) =>
      curr.address.toLowerCase() === updated.address.toLowerCase() ? updated : curr
    );
  }, []);

  const addProfile = useCallback((newProfile: InvestorProfile) => {
    setProfiles((prev) => [newProfile, ...prev]);
  }, []);

  const quickInvest = useCallback(
    (asset: RWAAsset, units: number): { success: boolean; message: string } => {
      if (!currentProfile.isKYCApproved) {
        return {
          success: false,
          message: 'Investment Rejected: Identity is not KYC verified under ERC-3643 rules.',
        };
      }

      if (!currentProfile.isActive) {
        return {
          success: false,
          message: 'Investment Rejected: Account is frozen or inactive under compliance sanctions.',
        };
      }

      const totalCost = units * asset.currentPriceUSD;

      if (currentProfile.usdcBalance < totalCost) {
        return {
          success: false,
          message: `Insufficient Funds: You have $${currentProfile.usdcBalance.toLocaleString()} USDC but need $${totalCost.toLocaleString()} USDC.`,
        };
      }

      if (currentProfile.totalInvestedUSD + totalCost > currentProfile.investmentLimitUSD) {
        return {
          success: false,
          message: `Quota Exceeded: This investment would exceed your remaining limit of $${(
            currentProfile.investmentLimitUSD - currentProfile.totalInvestedUSD
          ).toLocaleString()} USDC.`,
        };
      }

      if (units > asset.remainingUnits) {
        return {
          success: false,
          message: `Cap Exceeded: Only ${asset.remainingUnits} units remaining in primary offering.`,
        };
      }

      const currentHolding = currentProfile.rwaHoldings[asset.symbol] || 0;
      const updatedProfile: InvestorProfile = {
        ...currentProfile,
        usdcBalance: currentProfile.usdcBalance - totalCost,
        totalInvestedUSD: currentProfile.totalInvestedUSD + totalCost,
        rwaHoldings: {
          ...currentProfile.rwaHoldings,
          [asset.symbol]: currentHolding + units,
        },
      };
      updateProfile(updatedProfile);

      const newRemaining = asset.remainingUnits - units;
      const newFundedPct = parseFloat(
        (((asset.totalSupplyCap - newRemaining) / asset.totalSupplyCap) * 100).toFixed(1)
      );
      const newStatus: AssetStatus = newRemaining === 0 ? 'FUNDED' : asset.status;

      setAssets((prev) =>
        prev.map((a) =>
          a.id === asset.id
            ? {
                ...a,
                remainingUnits: newRemaining,
                fundedPercentage: newFundedPct,
                investorCount: a.investorCount + 1,
                status: newStatus,
              }
            : a
        )
      );

      setStats((prev) => ({
        ...prev,
        totalValueLockedUSD: prev.totalValueLockedUSD + totalCost,
        currentBlockNumber: prev.currentBlockNumber + 1,
      }));

      return {
        success: true,
        message: `Transaction Successful! Minted ${units} ${asset.symbol} tokens to ${currentProfile.address.slice(
          0,
          8
        )}... (Tx: 0x${Math.random().toString(16).slice(2, 10)})`,
      };
    },
    [currentProfile, updateProfile]
  );

  const createOrder = useCallback(
    (order: {
      assetSymbol: string;
      quantity: number;
      pricePerUnitUSD: number;
    }): { success: boolean; message: string } => {
      const userHolding = currentProfile.rwaHoldings[order.assetSymbol] || 0;
      if (userHolding < order.quantity) {
        return {
          success: false,
          message: `Insufficient Token Balance: You own ${userHolding} units of ${order.assetSymbol}.`,
        };
      }

      const targetAsset = assets.find((a) => a.symbol === order.assetSymbol);
      if (!targetAsset) return { success: false, message: 'Asset not found.' };

      const updatedProfile: InvestorProfile = {
        ...currentProfile,
        rwaHoldings: {
          ...currentProfile.rwaHoldings,
          [order.assetSymbol]: userHolding - order.quantity,
        },
      };
      updateProfile(updatedProfile);

      const newOrder: MarketplaceOrder = {
        id: orders.length + 1,
        assetSymbol: order.assetSymbol,
        assetName: targetAsset.name,
        assetAddress: targetAsset.contractAddress,
        sellerAddress: currentProfile.address,
        quantity: order.quantity,
        pricePerUnitUSD: order.pricePerUnitUSD,
        totalValueUSD: order.quantity * order.pricePerUnitUSD,
        status: 'ACTIVE',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        type: 'SELL',
      };

      setOrders((prev) => [newOrder, ...prev]);
      return {
        success: true,
        message: `Order #${newOrder.id} active on-chain! ${order.quantity} ${order.assetSymbol} escrowed.`,
      };
    },
    [currentProfile, assets, orders.length, updateProfile]
  );

  const fulfillOrder = useCallback(
    (orderId: number): { success: boolean; message: string } => {
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status !== 'ACTIVE') {
        return { success: false, message: 'Order is no longer active.' };
      }

      if (!currentProfile.isKYCApproved) {
        return {
          success: false,
          message: 'Compliance Rejection: Buyer must have verified KYC to acquire secondary tokens.',
        };
      }

      if (currentProfile.usdcBalance < order.totalValueUSD) {
        return {
          success: false,
          message: `Insufficient USDC: You need $${order.totalValueUSD.toLocaleString()} USDC.`,
        };
      }

      const currentHolding = currentProfile.rwaHoldings[order.assetSymbol] || 0;
      const updatedBuyer: InvestorProfile = {
        ...currentProfile,
        usdcBalance: currentProfile.usdcBalance - order.totalValueUSD,
        rwaHoldings: {
          ...currentProfile.rwaHoldings,
          [order.assetSymbol]: currentHolding + order.quantity,
        },
      };
      updateProfile(updatedBuyer);

      const seller = profiles.find(
        (p) => p.address.toLowerCase() === order.sellerAddress.toLowerCase()
      );
      if (seller) {
        const netPayout = order.totalValueUSD * 0.99;
        const updatedSeller: InvestorProfile = {
          ...seller,
          usdcBalance: seller.usdcBalance + netPayout,
        };
        setProfiles((prev) =>
          prev.map((p) =>
            p.address.toLowerCase() === seller.address.toLowerCase() ? updatedSeller : p
          )
        );
      }

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'FILLED' } : o)));

      setStats((prev) => ({
        ...prev,
        secondaryVolume24hUSD: prev.secondaryVolume24hUSD + order.totalValueUSD,
        currentBlockNumber: prev.currentBlockNumber + 1,
      }));

      return {
        success: true,
        message: `Order #${orderId} settled! Received ${order.quantity} ${order.assetSymbol} units.`,
      };
    },
    [currentProfile, orders, profiles, updateProfile]
  );

  const cancelOrder = useCallback(
    (orderId: number): { success: boolean; message: string } => {
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status !== 'ACTIVE')
        return { success: false, message: 'Order is not active.' };

      const currentHolding = currentProfile.rwaHoldings[order.assetSymbol] || 0;
      const updatedProfile: InvestorProfile = {
        ...currentProfile,
        rwaHoldings: {
          ...currentProfile.rwaHoldings,
          [order.assetSymbol]: currentHolding + order.quantity,
        },
      };
      updateProfile(updatedProfile);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
      );
      return {
        success: true,
        message: `Order #${orderId} cancelled. ${order.quantity} ${order.assetSymbol} units restored to your wallet.`,
      };
    },
    [currentProfile, orders, updateProfile]
  );

  const claimYield = useCallback(
    (distId: number): { success: boolean; amount: number; message: string } => {
      const dist = distributions.find((d) => d.id === distId);
      if (!dist) return { success: false, amount: 0, message: 'Distribution not found.' };

      const userHolding = currentProfile.rwaHoldings[dist.assetSymbol] || 0;
      const claimAmount = userHolding * dist.amountPerUnitUSD;

      if (claimAmount <= 0) {
        return { success: false, amount: 0, message: 'You have 0 eligible tokens at snapshot date.' };
      }

      const updatedProfile: InvestorProfile = {
        ...currentProfile,
        usdcBalance: currentProfile.usdcBalance + claimAmount,
      };
      updateProfile(updatedProfile);

      setDistributions((prev) =>
        prev.map((d) => (d.id === distId ? { ...d, isClaimedByUser: true } : d))
      );

      setStats((prev) => ({
        ...prev,
        totalYieldDistributedUSD: prev.totalYieldDistributedUSD + claimAmount,
        currentBlockNumber: prev.currentBlockNumber + 1,
      }));

      return {
        success: true,
        amount: claimAmount,
        message: `Claimed $${claimAmount.toFixed(2)} USDC dividend payout to your balance!`,
      };
    },
    [currentProfile, distributions, updateProfile]
  );

  const createDistribution = useCallback(
    (dist: {
      assetSymbol: string;
      totalAmountUSD: number;
      title: string;
    }): { success: boolean; message: string } => {
      const targetAsset = assets.find((a) => a.symbol === dist.assetSymbol);
      if (!targetAsset) return { success: false, message: 'Asset not found.' };

      const circ = targetAsset.totalSupplyCap - targetAsset.remainingUnits;
      const amountPerUnit = circ > 0 ? dist.totalAmountUSD / circ : 1;

      const newDist: YieldDistribution = {
        id: distributions.length + 1,
        assetSymbol: dist.assetSymbol,
        assetName: targetAsset.name,
        assetAddress: targetAsset.contractAddress,
        totalAmountUSD: dist.totalAmountUSD,
        snapshotSupply: circ,
        amountPerUnitUSD: parseFloat(amountPerUnit.toFixed(4)),
        recordDate: new Date().toISOString().split('T')[0],
        paymentDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        title: dist.title,
        isClaimedByUser: false,
      };

      setDistributions((prev) => [newDist, ...prev]);
      return {
        success: true,
        message: `Yield distribution of $${dist.totalAmountUSD.toLocaleString()} USDC initialized with snapshot supply of ${circ.toLocaleString()} units.`,
      };
    },
    [assets, distributions.length]
  );

  const proposePrice = useCallback(
    (prop: {
      assetSymbol: string;
      newPriceUSD: number;
      justification: string;
      valuationReportURI: string;
    }): { success: boolean; message: string } => {
      const targetAsset = assets.find((a) => a.symbol === prop.assetSymbol);
      if (!targetAsset) return { success: false, message: 'Asset not found.' };

      const newProp: PriceProposal = {
        id: proposals.length + 1,
        assetSymbol: prop.assetSymbol,
        assetName: targetAsset.name,
        assetAddress: targetAsset.contractAddress,
        currentPriceUSD: targetAsset.currentPriceUSD,
        proposedPriceUSD: prop.newPriceUSD,
        proposer: `${currentProfile.address.slice(0, 8)}... (${currentProfile.name.split(' ')[0]})`,
        proposedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        timelockExpiry: '24h Timelock Queue',
        status: 'PENDING',
        justification: prop.justification,
        valuationReportURI: prop.valuationReportURI,
      };

      setProposals((prev) => [newProp, ...prev]);
      return {
        success: true,
        message: `Proposal #${newProp.id} submitted for Compliance Officer dual-signature review.`,
      };
    },
    [assets, currentProfile, proposals.length]
  );

  const approveProposal = useCallback(
    (id: number): { success: boolean; message: string } => {
      setProposals((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'APPROVED',
                approver: `${currentProfile.address.slice(0, 8)}... (Elena Rostova - Compliance)`,
              }
            : p
        )
      );
      return {
        success: true,
        message: `Proposal #${id} approved! 24-hour execution timelock is now active.`,
      };
    },
    [currentProfile]
  );

  const executeProposal = useCallback(
    (id: number): { success: boolean; message: string } => {
      const proposal = proposals.find((p) => p.id === id);
      if (!proposal) return { success: false, message: 'Proposal not found.' };

      setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'EXECUTED' } : p)));
      setAssets((prev) =>
        prev.map((a) =>
          a.symbol === proposal.assetSymbol
            ? {
                ...a,
                currentPriceUSD: proposal.proposedPriceUSD,
              }
            : a
        )
      );

      return {
        success: true,
        message: `Valuation update executed! ${proposal.assetSymbol} unit price set to $${proposal.proposedPriceUSD.toFixed(
          2
        )}.`,
      };
    },
    [proposals]
  );

  const deployAsset = useCallback((newAsset: RWAAsset): { success: boolean; message: string } => {
    setAssets((prev) => [newAsset, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalFundedAssets: prev.totalFundedAssets + 1,
      currentBlockNumber: prev.currentBlockNumber + 1,
    }));
    return {
      success: true,
      message: `Contract for ${newAsset.name} (${newAsset.symbol}) deployed to ${newAsset.contractAddress} via AssetNexaFactory!`,
    };
  }, []);

  const updateAssetStatus = useCallback((assetId: string, newStatus: AssetStatus) => {
    setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, status: newStatus } : a)));
  }, []);

  return {
    assets,
    profiles,
    currentProfile,
    orders,
    distributions,
    proposals,
    stats,
    selectProfile,
    updateProfile,
    addProfile,
    quickInvest,
    createOrder,
    fulfillOrder,
    cancelOrder,
    claimYield,
    createDistribution,
    proposePrice,
    approveProposal,
    executeProposal,
    deployAsset,
    updateAssetStatus,
  };
}
