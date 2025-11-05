import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CouponProvider } from './context/CouponContext';

export default function Layout() {
  return (
    <AuthProvider>
      <CartProvider>
         <CouponProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      </CouponProvider>
      </CartProvider>
    </AuthProvider>
  );
}
