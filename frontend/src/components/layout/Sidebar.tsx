import React from 'react';
import { 
  Film, 
  Layers, 
  History, 
  Settings, 
  Zap,
  Globe2,
  FolderOpen
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { api } from '../../services/api';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  queueCount?: number;
  historyCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  queueCount = 0,
  historyCount = 0,
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | string }> = [
    { id: 'single', label: 'Single Video', icon: Film },
    { id: 'bulk', label: 'Bulk Download', icon: Layers, badge: queueCount > 0 ? queueCount : undefined },
    { id: 'history', label: 'Download History', icon: History, badge: historyCount > 0 ? historyCount : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleOpenFolder = async () => {
    try {
      await api.openFolder();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0d16]/50 backdrop-blur-xl p-4 flex flex-col justify-between transition-colors">
      <div className="space-y-6">
        {/* Navigation label */}
        <div className="px-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Download Modes
          </p>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Quick Actions
          </p>
          <button
            onClick={handleOpenFolder}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left"
          >
            <FolderOpen className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span>Open Downloads Folder</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Official Channels & Creator Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-transparent p-3.5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Developer & Community
          </p>

          {/* Instagram Follow Button */}
          <a
            href="https://www.instagram.com/omnidownloader/"
            target="_blank"
            rel="noopener noreferrer"
            title="Follow OmniDownloader (@omnidownloader) on Instagram"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-pink-500/20 hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all group"
          >
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:rotate-6">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.449-1.44z"/>
              </svg>
              <span className="truncate">@omnidownloader</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold uppercase">Follow</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            {/* X / Twitter */}
            <a
              href="https://x.com/OmniDownloaderme"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 hover:border-sky-500/40 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all text-xs font-semibold group shadow-sm"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:scale-110 flex-shrink-0">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="truncate text-[11px]">X (Twitter)</span>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/profile.php?id=61593168399104"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-xs font-semibold group shadow-sm"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:scale-110 flex-shrink-0">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="truncate text-[11px]">Facebook</span>
            </a>
          </div>
        </div>

        {/* Footer Info Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-transparent p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              Full Speed Engine
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Powered by yt-dlp & FFmpeg. Supports 1080p, 4K, 60fps & Lossless MP3.
          </p>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
            <Globe2 className="h-3 w-3" />
            <span>Desktop & Web Unified</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
