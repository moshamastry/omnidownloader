import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Film, Layers, History, Settings, Sparkles } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { SingleDownloader } from './components/single/SingleDownloader';
import { BulkDownloader } from './components/bulk/BulkDownloader';
import { DownloadHistory } from './components/history/DownloadHistory';
import { SettingsModal } from './components/settings/SettingsModal';
import { DisclaimerModal } from './components/disclaimer/DisclaimerModal';
import { AuthModal } from './components/auth/AuthModal';
import { AdminModal } from './components/admin/AdminModal';
import { Footer } from './components/layout/Footer';
import { ActiveTab } from './types';
import { wsService } from './services/websocket';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('single');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [pastedUrl, setPastedUrl] = useState<string>('');
  const { isDark } = useTheme();

  useEffect(() => {
    wsService.connect();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkey: Ctrl + Shift + A or Alt + A opens Admin Console
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || (e.altKey && (e.key === 'A' || e.key === 'a'))) {
        e.preventDefault();
        setIsAdminModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePasteDetected = (url: string) => {
    setPastedUrl(url);
    setActiveTab('single');
  };

  const mobileNavItems: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'single', label: 'Single', icon: Film },
    { id: 'bulk', label: 'Bulk', icon: Layers },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-[#0a0d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: isDark
            ? '!bg-[#161e31] !text-white !border !border-white/10 !shadow-2xl !text-xs !rounded-xl !py-3'
            : '!bg-white !text-slate-900 !border !border-slate-200 !shadow-xl !text-xs !rounded-xl !py-3',
          duration: 4000,
        }}
      />

      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onPasteDetectedUrl={handlePasteDetected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden w-full max-w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab === 'settings') {
                setIsSettingsOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
          />
        </div>

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {activeTab === 'single' && (
            <SingleDownloader
              initialUrl={pastedUrl}
              onClearInitialUrl={() => setPastedUrl('')}
            />
          )}

          {activeTab === 'bulk' && <BulkDownloader />}

          {activeTab === 'history' && (
            <DownloadHistory
              onRedownload={(url) => {
                setPastedUrl(url);
                setActiveTab('single');
              }}
            />
          )}

          {/* Footer with Creator Credit and Socials */}
          <Footer
            onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation Dock (Fixed 4-Column Grid, Zero Scroll) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 w-full max-w-full border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0a0d16]/95 backdrop-blur-xl px-1 py-1.5 shadow-lg">
        <div className="grid grid-cols-4 w-full gap-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'settings') {
                    setIsSettingsOpen(true);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] mt-0.5 tracking-tight truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AuthModal />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

