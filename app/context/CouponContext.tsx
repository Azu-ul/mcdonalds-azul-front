import React, { createContext, useContext, useState, ReactNode } from 'react';

type Coupon = {
  id: number;
  title: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  product_id?: number;
};

type CouponContextType = {
  selectedCoupon: Coupon | null;
  setSelectedCoupon: (coupon: Coupon | null) => void;
  calculateDiscount: (total: number) => number;
};

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export function CouponProvider({ children }: { children: ReactNode }) {
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const calculateDiscount = (total: number): number => {
    if (!selectedCoupon) return 0;
    
    // Verificar compra mínima
    if (total < selectedCoupon.min_purchase) return 0;

    let discount = 0;
    if (selectedCoupon.discount_type === 'percentage') {
      discount = total * (selectedCoupon.discount_value / 100);
      if (selectedCoupon.max_discount) {
        discount = Math.min(discount, selectedCoupon.max_discount);
      }
    } else {
      discount = selectedCoupon.discount_value;
    }

    return Math.round(discount * 100) / 100;
  };

  return (
    <CouponContext.Provider value={{ selectedCoupon, setSelectedCoupon, calculateDiscount }}>
      {children}
    </CouponContext.Provider>
  );
}

export function useCoupon() {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error('useCoupon must be used within CouponProvider');
  }
  return context;
}