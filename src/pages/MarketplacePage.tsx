import React from 'react';
import { MarketplaceTab } from '../components/MarketplaceTab';
import { RWAAsset, MarketplaceOrder, InvestorProfile } from '../types';

interface MarketplacePageProps {
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

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  assets,
  orders,
  currentProfile,
  onCreateOrder,
  onFulfillOrder,
  onCancelOrder,
}) => {
  return (
    <div className="w-full">
      <MarketplaceTab
        assets={assets}
        orders={orders}
        currentProfile={currentProfile}
        onCreateOrder={onCreateOrder}
        onFulfillOrder={onFulfillOrder}
        onCancelOrder={onCancelOrder}
      />
    </div>
  );
};
