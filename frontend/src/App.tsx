import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Film, 
  Layers, 
  History, 
  Settings, 
  Sparkles, 
  Bell, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  AlertCircle 
} from 'lucide-react';
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
import { ActiveTab, Announcement } from './types';
import { wsService } from './services/websocket';
import { api } from './services/api';

export const AppContent: React.FC = () => {
  const { user, isStaff, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('single');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [pastedUrl, setPastedUrl] = useState<string>('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const { isDark } = useTheme();

  useEffect(() => {
    wsService.connect();

    // Fetch initial active announcements
    api.getAnnouncements()
      .then((items) => {
        if (Array.isArray(items)) {
          setAnnouncements(items);
        }
      })
      .catch(() => {});

    // Listen to real-time live announcement broadcasts via WebSocket
    const unsubAnnouncements = wsService.onAnnouncement((newAnn) => {
      setAnnouncements((prev) => [newAnn, ...prev.filter((a) => a.id !== newAnn.id)]);
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-white/20 p-4`}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl text-purple-300">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    📢 Admin Broadcast Notification
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {newAnn.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    {newAnn.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkey: Ctrl + Shift + A or Alt + A
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || (e.altKey && (e.key === 'A' || e.key === 'a'))) {
        // Strict security: If user is logged in but NOT admin/staff, completely ignore
        if (user && !isStaff) {
          return;
        }
        e.preventDefault();
        setIsAdminModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubAnnouncements();
    };
  }, [user, isStaff]);

  const handlePasteDetected = (url: string) => {
    setPastedUrl(url);
    setActiveTab('single');
  };

  const visibleAnnouncements = announcements.filter(
    (a) => a.active && !dismissedAnnouncements.includes(a.id)
  );

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

      {/* Top Live Broadcast Announcement Banner */}
      {visibleAnnouncements.length > 0 && (
        <div className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-3 sm:px-6 py-2 shadow-md flex items-center justify-between gap-3 text-xs z-50">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="p-1 rounded-lg bg-white/20 text-white shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </span>
            <span className="font-black uppercase tracking-wider text-[10px] bg-black/20 px-1.5 py-0.5 rounded shrink-0">
              Announcement
            </span>
            <span className="font-bold truncate">
              {visibleAnnouncements[0].title}:
            </span>
            <span className="truncate opacity-90 hidden sm:inline">
              {visibleAnnouncements[0].message}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDismissedAnnouncements((prev) => [...prev, visibleAnnouncements[0].id])}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors"
              title="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
        onOpenAdmin={() => setIsAdminModalOpen(true)}
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
