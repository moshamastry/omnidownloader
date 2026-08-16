import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  ShieldAlert, 
  Sparkles,
  ClipboardCheck,
  Crown,
  Zap,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenDisclaimer: () => void;
  onOpenAdmin?: () => void;
  onPasteDetectedUrl?: (url: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenSettings, 
  onOpenDisclaimer,
  onOpenAdmin,
  onPasteDetectedUrl 
}) => {
  const { setTheme, isDark } = useTheme();
  const { user, isPro, isAdmin, isModerator, isStaff, quota, openAuthModal, logout } = useAuth();
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [engineVersion, setEngineVersion] = useState<string>('');
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // Health check
    api.checkHealth()
      .then((data) => {
        setServerOnline(true);
        if (data.version) setEngineVersion(data.version);
      })
      .catch(() => setServerOnline(false));

    // Auto clipboard detection
    const checkClipboard = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text && text.trim().startsWith('http') && text !== clipboardUrl) {
            const lower = text.toLowerCase();
            if (
              lower.includes('youtube.com') ||
              lower.includes('youtu.be') ||
              lower.includes('instagram.com') ||
              lower.includes('tiktok.com') ||
              lower.includes('facebook.com') ||
              lower.includes('twitter.com') ||
              lower.includes('x.com') ||
              lower.includes('pinterest.com') ||
              lower.includes('vimeo.com') ||
              lower.includes('soundcloud.com')
            ) {
              setClipboardUrl(text.trim());
            }
          }
        }
      } catch {
        // Clipboard read permission might be denied or window not focused
      }
    };

    window.addEventListener('focus', checkClipboard);
    const timer = setInterval(checkClipboard, 5000);
    return () => {
      window.removeEventListener('focus', checkClipboard);
      clearInterval(timer);
    };
  }, [clipboardUrl]);

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#0a0d16]/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-2.5 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/25 shrink-0">
            <Download className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Omni<span className="text-brand-600 dark:text-brand-400">Downloader</span>
              </h1>
              {isPro ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black text-amber-500 border border-amber-500/30">
                  <Crown className="w-2.5 h-2.5" /> PRO
                </span>
              ) : (
                <span className="hidden sm:inline-block rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  Free
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${serverOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {serverOnline ? `yt-dlp ${engineVersion || 'ready'}` : 'Connecting...'}
            </p>
          </div>
        </div>

        {/* Center: Quota Indicator & Clipboard Alert */}
        <div className="flex items-center gap-3">
          {/* Guest Quota Badge */}
          {!isPro && quota && (
            <button
              onClick={() => openAuthModal('register')}
              className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 transition-all shadow-sm"
              title="Click to unlock unlimited downloads"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {quota.remainingToday} / {quota.dailyLimit} Free Downloads Left Today
              </span>
              <span className="bg-amber-500 text-slate-900 px-1.5 py-0.2 rounded text-[10px] font-black uppercase">
                Unlock Pro
              </span>
            </button>
          )}

          {/* Logged in Pro Badge */}
          {isPro && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Crown className="w-3.5 h-3.5 text-emerald-500" />
              <span>Unlimited Pro Active</span>
            </div>
          )}

          {/* Clipboard Detected Link Alert */}
          {clipboardUrl && onPasteDetectedUrl && (
            <div className="hidden xl:flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-xs animate-pulse-glow">
              <Sparkles className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 max-w-[160px] truncate font-mono">
                {clipboardUrl}
              </span>
              <button
                onClick={() => {
                  onPasteDetectedUrl(clipboardUrl);
                  setClipboardUrl(null);
                }}
                className="ml-1 flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 font-medium text-white hover:bg-brand-500 transition-colors text-[11px]"
              >
                <ClipboardCheck className="h-3 w-3" />
                Paste
              </button>
              <button
                onClick={() => setClipboardUrl(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Right Action Icons & Auth User Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Auth Button or User Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 py-1 px-2.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-xl text-xs font-bold text-slate-800 dark:text-white transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-[11px] font-black uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline-block max-w-[90px] truncate">{user.name}</span>
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-slate-100 dark:border-white/5 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                      <Crown className="w-3 h-3" /> Pro Member (Unlimited)
                    </div>
                  </div>

                  {onOpenAdmin && isStaff && (
                    <button
                      onClick={() => {
                        onOpenAdmin();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> {isAdmin ? 'Admin Console' : 'Mod Console'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('register')}
              className="flex items-center gap-1 py-1.5 px-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In / Up</span>
            </button>
          )}

          {/* Admin / Moderator Panel Direct Button - ONLY VISIBLE TO AUTHENTICATED STAFF */}
          {onOpenAdmin && isStaff && (
            <button
              onClick={onOpenAdmin}
              title={isAdmin ? "Open Master Admin Console" : "Open Moderator Panel"}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                isAdmin 
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20' 
                  : 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{isAdmin ? 'Admin Console' : 'Mod Console'}</span>
            </button>
          )}

          {/* Official Social Links & Creator Credit */}
          <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-white/10 pr-2 mr-1">
            {/* Creator Instagram Handle Badge */}
            <a
              href="https://www.instagram.com/mo.shamas"
              target="_blank"
              rel="noopener noreferrer"
              title="Created by Mohammad Shamas (@mo.shamas) - Click to Follow on Instagram"
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl border border-pink-500/30 bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15 text-pink-600 dark:text-pink-400 hover:from-purple-500/25 hover:via-pink-500/25 hover:to-amber-500/25 transition-all text-xs font-bold shadow-sm shadow-pink-500/10 group"
            >
              <div className="relative flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500 group-hover:scale-110 transition-transform">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.449-1.44z"/>
                </svg>
              </div>
              <span className="hidden sm:inline">@mo.shamas</span>
            </a>

            {/* X (Twitter) Handle */}
            <a
              href="https://x.com/OmniDownloaderme"
              target="_blank"
              rel="noopener noreferrer"
              title="Follow @OmniDownloaderme on X"
              className="hidden md:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-sky-500/40 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-all group"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:scale-110">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* Facebook Handle */}
            <a
              href="https://www.facebook.com/profile.php?id=61593168399104"
              target="_blank"
              rel="noopener noreferrer"
              title="Official Facebook Page"
              className="hidden lg:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:scale-110">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>

          {/* Disclaimer Button */}
          <button
            onClick={onOpenDisclaimer}
            title="Terms of Service & Disclaimer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span>Legal</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title="Toggle theme"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

