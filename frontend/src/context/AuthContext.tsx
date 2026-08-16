import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, QuotaStatus } from '../types';
import { api, setAuthToken, getAuthToken } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  quota: QuotaStatus | null;
  isLoading: boolean;
  isPro: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isStaff: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register';
  login: (email: string, pass: string) => Promise<void>;
  loginAdminPin: (pin: string) => Promise<void>;
  register: (email: string, name: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshQuota: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  const refreshQuota = async () => {
    try {
      const q = await api.getQuota();
      setQuota(q);
      if (q.user) {
        setUser({
          id: q.user.id,
          email: q.user.email,
          name: q.user.name,
          isPro: q.user.isPro,
          role: q.user.role || (q.user.email.toLowerCase().includes('admin') ? 'admin' : 'user'),
          createdAt: Date.now(),
          totalDownloads: typeof q.usedToday === 'number' ? q.usedToday : 0,
        });
      }
    } catch (err) {
      console.error('Failed to load quota:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          setAuthToken(null);
          setTokenState(null);
          setUser(null);
        }
      }
      await refreshQuota();
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const openAuthModal = (mode: 'login' | 'register' = 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.login(email, pass);
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      await refreshQuota();
      setIsAuthModalOpen(false);
      toast.success(`Welcome back, ${res.user.name}! 👑 Unlimited Access Activated.`);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      throw err;
    }
  };

  const loginAdminPin = async (pin: string) => {
    try {
      const res = await api.adminLoginPin(pin);
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      await refreshQuota();
      toast.success(`Master Admin Console Unlocked! 🛡️ Welcome, ${res.user.name}`);
    } catch (err: any) {
      toast.error(err.message || 'Invalid Master Admin Key');
      throw err;
    }
  };

  const register = async (email: string, name: string, pass: string) => {
    try {
      const res = await api.register(email, name, pass);
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      await refreshQuota();
      setIsAuthModalOpen(false);
      toast.success(`Account created! 🚀 Unlimited Pro Access is now active.`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    refreshQuota();
    toast.success('Logged out successfully');
  };

  const isPro = Boolean(user?.isPro || quota?.isPro);
  const isAdmin = Boolean(user?.role === 'admin' || user?.email.toLowerCase().includes('admin'));
  const isModerator = Boolean(user?.role === 'moderator');
  const isStaff = Boolean(isAdmin || isModerator);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        quota,
        isLoading,
        isPro,
        isAdmin,
        isModerator,
        isStaff,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
        login,
        loginAdminPin,
        register,
        logout,
        refreshQuota,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
