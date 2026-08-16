import React from 'react';
import { ShieldAlert, CheckCircle, X, Scale, FileText } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1320] p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Terms of Service & Disclaimer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please read our ethical usage and copyright policy
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

        {/* Content */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          
          <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3.5 space-y-1.5 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <Scale className="h-4 w-4" />
              <span>Personal & Non-Commercial Use Only</span>
            </div>
            <p className="text-[11px] leading-normal">
              This application is provided solely as a personal media archiver and educational tool. You are responsible for ensuring that you have the right to download and use the media according to applicable laws and the respective platform terms.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5 text-brand-500" />
              1. Non-DRM & Publicly Accessible Content
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              OmniDownloader only supports publicly accessible media. It does NOT bypass Digital Rights Management (DRM), paywalls, private accounts, or encrypted streams.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5 text-brand-500" />
              2. Copyright & Intellectual Property
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              All copyrights and trademarks belong to their respective content creators and owners. Do not redistribute, re-upload, monetize, or exploit downloaded materials without express written authorization from the copyright holder.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5 text-brand-500" />
              3. User Liability
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              The developers and distributors of this application bear no responsibility for misuse or any infringement of third-party terms of service by the end user.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
          <a
            href="https://www.instagram.com/omnidownloader/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-pink-600 dark:text-pink-400 hover:underline font-semibold"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.449-1.44z"/>
            </svg>
            <span>OmniDownloader (@omnidownloader)</span>
          </a>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition-all"
          >
            <CheckCircle className="h-4 w-4" />
            <span>I Understand & Agree</span>
          </button>
        </div>

      </div>
    </div>
  );
};
