// /context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

type User = {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  profile_image_url?: string;
  auth_provider?: string;
  roles?: string[];
  address?: string;
  latitude: number | null;
  longitude: number | null;
  locationType?: 'pickup' | 'delivery';
  selectedRestaurant?: {
    id: number;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isRepartidor: boolean; // 👈 Cambié isJugador/isSeguidor por isRepartidor
  isCliente: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setAsGuest: () => Promise<void>;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const fetchUserRoles = async (): Promise<string[]> => {
    try {
      const rolesRes = await api.get('/profile/roles');
      return rolesRes.data.roles || [];
    } catch (error) {
      console.warn('No se pudieron cargar los roles del usuario');
      return [];
    }
  };

  const refreshUserData = async () => {
    try {
      const res = await api.get('/auth/me');
      let updatedUser = { ...res.data.user };

      const roles = await fetchUserRoles();
      updatedUser.roles = roles;

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  const login = async (newToken: string, userData: User) => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      const roles = await fetchUserRoles();
      const completeUser: User = { ...userData, roles };

      setToken(newToken);
      setUser(completeUser);
      setIsGuest(false);

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(completeUser));
      await AsyncStorage.removeItem('guest_mode');
    } catch (error) {
      console.error('Error saving auth:', error);
      delete api.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsGuest(false);

        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        refreshUserData().catch(console.warn);
      } else {
        const guestMode = await AsyncStorage.getItem('guest_mode');
        if (guestMode === 'true') {
          setIsGuest(true);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'guest_mode']);
      setToken(null);
      setUser(null);
      setIsGuest(false);
      delete api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...data };
        AsyncStorage.setItem('user', JSON.stringify(updated)).catch(console.error);
        return updated;
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const setAsGuest = async () => {
    try {
      await AsyncStorage.setItem('guest_mode', 'true');
      setIsGuest(true);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error setting guest mode:', error);
    }
  };

  const isAuthenticated = !!token && !!user && !isGuest;
  const isAdmin = user?.roles?.includes('admin') || false;
  const isRepartidor = user?.roles?.includes('repartidor') || false; // 👈 Nuevo
  const isCliente = user?.roles?.includes('cliente') || false; // 👈 Nuevo

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isGuest,
        isAdmin,
        isRepartidor,
        isCliente,
        login,
        logout,
        updateUser,
        setAsGuest,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};