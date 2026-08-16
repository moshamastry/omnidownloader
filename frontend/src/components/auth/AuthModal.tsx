import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode when modal opens
  React.useEffect(() => {
    setMode(authModalMode);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        await register(email, name, password);
      } else {
        await login(email, password);
      }
    } catch {
      // Error handled in context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    try {
      const demoEmail = `user_${Math.floor(1000 + Math.random() * 9000)}@omni.pro`;
      await register(demoEmail, 'Pro Creator', 'omni12345');
    } catch {
      // fallback to login if exists
      try {
        await login('demo@omni.pro', 'omni12345');
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-10 my-auto"
        >
          {/* Header Banner */}
          <div className="relative p-6 sm:p-7 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-amber-300">
                <Sparkles className="w-3.5 h-3.5" /> 100% Free Forever
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {mode === 'register' ? 'Unlock Unlimited Downloads' : 'Welcome Back'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 font-medium">
              {mode === 'register'
                ? 'Sign up in 5 seconds to get unlimited 4K video & audio downloads with zero daily limits!'
                : 'Sign in to access your unlimited Pro dashboard and cloud history.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0a0f1d] p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#1e293b] text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              ⭐ Create Free Account
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#1e293b] text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-7">
            {/* Feature Perks for Registration */}
            {mode === 'register' && (
              <div className="mb-5 grid grid-cols-2 gap-2 p-3 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/50 dark:border-brand-800/30 rounded-2xl">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Unlimited 4K & MP3
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Bulk Queue & ZIP
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 1000+ Platforms
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Instant Speed Server
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-100 dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <span>{mode === 'register' ? 'Create Free Account & Start' : 'Sign In to Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Button */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl border border-amber-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                ⚡ 1-Click Instant Pro Access (No Password Needed)
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Safe & Secure • No Credit Card Required</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
