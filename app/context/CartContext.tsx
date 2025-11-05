// src/context/CartContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../../config/api';

type CartItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  total_price: number;
};

type Cart = {
  id: number;
  items: CartItem[];
  total: number;
};

type CartContextType = {
  cart: Cart | null;
  loading: boolean;
  refetchCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  cart: null,
  loading: true,
  refetchCart: async () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data.cart);
    } catch (error) {
      setCart({ id: -1, items: [], total: 0 }); // carrito vacío
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider value={{ cart, loading, refetchCart: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};