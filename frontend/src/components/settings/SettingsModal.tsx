import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Folder, 
  Layers, 
  Sliders, 
  Clipboard, 
  Sun, 
  Moon, 
  Laptop, 
  Check, 
  X, 
  Zap, 
  FolderOpen,
  Globe,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppSettings } from '../../types';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenAdmin }) => {
  const { theme, setTheme } = useTheme();
  const { isStaff, isAdmin } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    downloadDirectory: '',
    defaultPreset: 'best-video-mp4',
    maxConcurrentDownloads: 2,
    autoDetectClipboard: true,
    theme: 'dark',
  });
  const [engineHealth, setEngineHealth] = useState<{ ytDlp: boolean; ffmpeg: boolean; version?: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      api.getSettings().then((s) => setSettings(s)).catch(() => {});
      api.checkHealth().then((h) => setEngineHealth(h)).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings(settings);
      toast.success('Settings saved successfully');
      onClose();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await api.openFolder(settings.downloadDirectory);
      toast.success('Opened downloads folder');
    } catch {
      toast.error('Failed to open folder');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1320] p-6 shadow-2xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Application Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure download paths, performance and preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          
          {/* Download Directory */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5 text-brand-500" />
              <span>Download Directory</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.downloadDirectory}
                onChange={(e) => setSettings({ ...settings, downloadDirectory: e.target.value })}
                placeholder="C:/Downloads/OmniDownloader"
                className="flex-1 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/20 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
              <button
                type="button"
                onClick={handleOpenFolder}
                className="p-2 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shadow-sm"
                title="Open Folder"
              >
                <FolderOpen className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Default Preset Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-brand-500" />
              <span>Default Download Quality Preset</span>
            </label>
            <select
              value={settings.defaultPreset}
              onChange={(e) => setSettings({ ...settings, defaultPreset: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="best-video-mp4" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                Best Quality (Auto 1080p/4K MP4)
              </option>
              <option value="1080p-mp4" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                Full HD (1080p MP4)
              </option>
              <option value="720p-mp4" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                HD (720p MP4)
              </option>
              <option value="best-audio-mp3" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                Audio Only (Lossless MP3 320kbps)
              </option>
              <option value="audio-m4a" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                Audio Only (AAC/M4A)
              </option>
            </select>
          </div>

          {/* Network Proxy URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-brand-500" />
              <span>Network Proxy (Optional)</span>
            </label>
            <input
              type="text"
              value={settings.proxyUrl || ''}
              onChange={(e) => setSettings({ ...settings, proxyUrl: e.target.value })}
              placeholder="http://127.0.0.1:1080 or socks5://127.0.0.1:1080"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/20 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <p className="text-[10px] text-slate-500">
              Useful for bypassing ISP blocks (e.g. TikTok) with local VPN proxy.
            </p>
          </div>

          {/* Max Concurrency */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-brand-500" />
                <span>Max Concurrent Downloads: {settings.maxConcurrentDownloads}</span>
              </label>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              value={settings.maxConcurrentDownloads}
              onChange={(e) => setSettings({ ...settings, maxConcurrentDownloads: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Interface Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'system', label: 'System', icon: Laptop },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id as any);
                      setSettings({ ...settings, theme: t.id as any });
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Developer & Creator Credits */}
          <div className="p-3.5 rounded-xl border border-pink-500/20 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-amber-500/5 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>Mo Shamas</span>
                <span className="text-[10px] bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold px-1.5 py-0.2 rounded-full">Creator & Developer</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Created with dedication by Mo Shamas. Follow our official Instagram for updates.
              </p>
            </div>
            <a
              href="https://www.instagram.com/omnidownloader/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-pink-500/20 hover:opacity-90 shrink-0 transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.449-1.44z"/>
              </svg>
              <span>@omnidownloader</span>
            </a>
          </div>

          {/* Admin & Owner Panel Direct Access (Staff Only) */}
          {onOpenAdmin && isStaff && (
            <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin & Owner Management Console</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage registered users, broadcast live in-app notifications, and send mass emails.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 shrink-0 transition-all flex items-center gap-1.5"
              >
                <span>👑 Open Console</span>
              </button>
            </div>
          )}

          {/* Engine Status info */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Engine Backend:</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <span>yt-dlp {engineHealth?.version || 'Active'}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">FFmpeg Ready</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
};
