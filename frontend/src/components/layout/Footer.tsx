import React from 'react';
import { 
  Heart, 
  Download, 
  ShieldAlert, 
  Settings, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface FooterProps {
  onOpenDisclaimer: () => void;
  onOpenSettings?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDisclaimer, onOpenSettings }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-12 border-t border-slate-200/80 dark:border-white/5 bg-white/60 dark:bg-[#070a12]/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-200/60 dark:border-white/5">
          
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/25">
                <Download className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Omni<span className="text-brand-600 dark:text-brand-400">Downloader</span> Pro
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              Universal high-speed video & audio extractor supporting YouTube, Instagram Reels, TikTok, Facebook, Twitter/X, and 1000+ platforms with 1080p, 4K & MP3 presets.
            </p>
          </div>

          {/* Social Connect & Creator Credits (Prominent) */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Official Community & Support</span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Created with passion by <strong className="text-slate-900 dark:text-white font-bold">Mo Shamas</strong>. Follow our official pages for releases, server updates & feedback:
            </p>
            
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Official Instagram Button */}
              <a
                href="https://www.instagram.com/omnidownloader/"
                target="_blank"
                rel="noopener noreferrer"
                title="Follow @omnidownloader on Instagram"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25 hover:opacity-95 hover:scale-[1.03] active:scale-95 transition-all group"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:rotate-6">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.449-1.44z"/>
                </svg>
                <span>Follow @omnidownloader</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              {/* X / Twitter */}
              <a
                href="https://x.com/OmniDownloaderme"
                target="_blank"
                rel="noopener noreferrer"
                title="Follow on X"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-sky-500/40 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-bold transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>X / Twitter</span>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/profile.php?id=61593168399104"
                target="_blank"
                rel="noopener noreferrer"
                title="Follow on Facebook"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>
            </div>
          </div>

          {/* Quick Links & Legal Policy */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal & Information
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenDisclaimer}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 font-medium transition-colors text-left"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Terms of Service & Copyright Disclaimer</span>
              </button>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 font-medium transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Download Directory & Performance Settings</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              For personal and non-commercial media backup only. All copyright belongs to respective content creators.
            </p>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="flex items-center gap-1">
            <span>© {currentYear} OmniDownloader Pro • Created with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500 animate-pulse" />
            <span>by</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Mo Shamas
            </span>
          </p>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Fast • Secure • No Watermark</span>
            <span>•</span>
            <a
              href="https://www.instagram.com/omnidownloader/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-pink-600 dark:text-pink-400 hover:underline"
            >
              Official Instagram (@omnidownloader)
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
