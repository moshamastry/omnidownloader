import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  Crown, 
  Download, 
  ShieldCheck, 
  Search, 
  Trash2, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  Zap,
  Mail,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  ShieldAlert,
  UserCog,
  Bell,
  Send,
  Copy,
  Radio,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Announcement } from '../../types';
import toast from 'react-hot-toast';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'users' | 'broadcast' | 'mass_email';

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser, isAdmin, isModerator, isStaff, loginAdminPin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [adminPin, setAdminPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalProUsers: number;
    totalAdmins?: number;
    totalModerators?: number;
    totalDownloads: number;
    activeGuestQuotas: number;
    guestDailyLimit: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'pro' | 'free' | 'admin' | 'moderator'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Broadcast Notification state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Mass Email state
  const [emailFilter, setEmailFilter] = useState<'all' | 'pro' | 'free'>('all');
  const [emailSubject, setEmailSubject] = useState('Important Update from OmniDownloader Pro');
  const [emailBody, setEmailBody] = useState('Hello from OmniDownloader Pro,\n\nWe have just released an exciting new update! You can now download videos, reels, and music in ultra-high quality.\n\nEnjoy unlimited downloads!');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [u, s, ann] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
        api.getAdminAnnouncements().catch(() => []),
      ]);
      setUsers(u);
      setStats(s);
      setAnnouncements(ann);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isStaff) {
      fetchAdminData();
    }
  }, [isOpen, isStaff]);

  if (!isOpen) return null;

  const handleUnlockAdmin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminPin.trim()) {
      toast.error('Please enter the Master Admin Password or PIN');
      return;
    }

    setIsVerifying(true);
    try {
      await loginAdminPin(adminPin.trim());
      await fetchAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Invalid Master Admin Key');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickUnlock = async (pin: string) => {
    setIsVerifying(true);
    try {
      await loginAdminPin(pin);
      await fetchAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to unlock');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    if (!isAdmin) {
      toast.error('Only Master Admin can assign or change roles');
      return;
    }

    try {
      const updated = await api.changeUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role, isPro: updated.isPro } : u)));
      toast.success(`Updated role for ${updated.name} to ${newRole.toUpperCase()}!`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role');
    }
  };

  const handleTogglePro = async (userId: string) => {
    try {
      const updated = await api.toggleAdminPro(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isPro: updated.isPro } : u)));
      toast.success(`User status updated to ${updated.isPro ? 'PRO 👑' : 'FREE'}`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update Pro status');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!isAdmin) {
      toast.error('Only Master Admin can delete users');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) return;
    try {
      await api.deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(`User ${email} deleted`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.error('No users to export');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Role', 'Is Pro', 'Total Downloads', 'Created Date'];
    const rows = users.map((u) => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      u.email,
      u.role || 'user',
      u.isPro ? 'YES' : 'NO',
      u.totalDownloads || 0,
      new Date(u.createdAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OmniDownloader_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported users to CSV!');
  };

  // Direct single email helper
  const handleSendSingleEmail = (user: User) => {
    const subject = encodeURIComponent('OmniDownloader Pro - Notice from Administrator');
    const body = encodeURIComponent(`Hi ${user.name},\n\nThis is an official message regarding your OmniDownloader account (${user.email}).\n\nBest regards,\nOmniDownloader Administration Team`);
    window.open(`mailto:${user.email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Copy single user email
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success(`Copied ${email} to clipboard!`);
  };

  // Send Live Broadcast In-App Notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Please enter both announcement title and message');
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const created = await api.sendAnnouncement({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        type: broadcastType,
      });
      setAnnouncements((prev) => [created, ...prev]);
      setBroadcastTitle('');
      setBroadcastMessage('');
      toast.success('📢 Live broadcast sent to all active users in real-time!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send broadcast');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Toggle announcement active status
  const handleToggleAnnouncement = async (id: string) => {
    try {
      const updated = await api.toggleAnnouncement(id);
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success(updated.active ? 'Announcement activated' : 'Announcement muted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success('Announcement removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  // Mass Email helpers
  const getFilteredEmails = (): string[] => {
    return users
      .filter((u) => {
        if (emailFilter === 'pro') return u.isPro;
        if (emailFilter === 'free') return !u.isPro;
        return true;
      })
      .map((u) => u.email)
      .filter(Boolean);
  };

  const handleCopyAllEmails = () => {
    const list = getFilteredEmails();
    if (list.length === 0) {
      toast.error('No emails found for selected filter');
      return;
    }
    const joined = list.join(', ');
    navigator.clipboard.writeText(joined);
    toast.success(`Copied ${list.length} email addresses to clipboard (ready for BCC)!`);
  };

  const handleOpenMassEmailClient = () => {
    const list = getFilteredEmails();
    if (list.length === 0) {
      toast.error('No recipients found');
      return;
    }
    const bcc = encodeURIComponent(list.join(','));
    const subj = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody);
    window.open(`mailto:?bcc=${bcc}&subject=${subj}&body=${body}`, '_blank');
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterRole === 'pro') return u.isPro;
    if (filterRole === 'free') return !u.isPro;
    if (filterRole === 'admin') return u.role === 'admin';
    if (filterRole === 'moderator') return u.role === 'moderator';
    return true;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-6xl bg-white dark:bg-[#0b1120] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-purple-400">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2 flex-wrap">
                  <span>{isAdmin ? 'OmniDownloader Owner & Admin Master Console' : 'OmniDownloader Staff & Mod Portal'}</span>
                  <span className={`px-2 py-0.5 text-white font-black text-[10px] uppercase rounded-full tracking-wider ${
                    isAdmin ? 'bg-purple-500' : 'bg-blue-600'
                  }`}>
                    {isAdmin ? '👑 Master Admin' : '🛡️ Moderator'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {isAdmin 
                    ? 'Full Administrator Privileges: Manage users, send live in-app broadcasts, email all users, and toggle Pro access.'
                    : 'Staff View: Review users, inspect download stats, and toggle Pro memberships.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStaff && (
                <button
                  onClick={fetchAdminData}
                  disabled={isLoading}
                  title="Refresh data"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* If NOT Authenticated Staff, Show Secure Master Unlock Screen */}
          {!isStaff ? (
            currentUser ? (
              <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-auto">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                  Access Restricted
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Your account ({currentUser.email}) does not have administrator privileges.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="p-6 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-auto">
                <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 text-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/10">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                  Restricted Administrator Access
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Please enter the Master Administrator Password to unlock the management console.
                </p>

                <form onSubmit={handleUnlockAdmin} className="w-full space-y-4">
                  <div className="relative text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Master Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        required
                        placeholder="Enter master password..."
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full pl-10 pr-11 py-2.5 bg-slate-100 dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Authenticate & Unlock</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )
          ) : (
            <>
              {/* Navigation Tabs Bar */}
              <div className="px-4 sm:px-6 pt-3 bg-slate-100 dark:bg-[#0d1424] border-b border-slate-200 dark:border-white/10 flex items-center gap-2 shrink-0 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
                    activeTab === 'users'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-[#0b1120]'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Users & Accounts ({users.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('broadcast')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
                    activeTab === 'broadcast'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-[#0b1120]'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>📢 Broadcast In-App Notifications</span>
                  {announcements.filter((a) => a.active).length > 0 && (
                    <span className="px-1.5 py-0.2 bg-purple-500 text-white rounded-full text-[10px] font-black">
                      {announcements.filter((a) => a.active).length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('mass_email')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 ${
                    activeTab === 'mass_email'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-[#0b1120]'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>📧 Mass Email Sender</span>
                </button>
              </div>

              {/* TAB 1: USERS & ACCOUNTS */}
              {activeTab === 'users' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Stats Bar */}
                  {stats && (
                    <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#080d1a] border-b border-slate-200 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 shrink-0">
                      <div className="p-3 bg-white dark:bg-[#11192e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                          <span>Total Users</span>
                          <Users className="w-4 h-4 text-brand-500" />
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                          {stats.totalUsers}
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-[#11192e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                          <span>Pro Members</span>
                          <Crown className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                          {stats.totalProUsers}
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-[#11192e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                          <span>Admins & Mods</span>
                          <UserCog className="w-4 h-4 text-purple-500" />
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                          {(stats.totalAdmins || 0) + (stats.totalModerators || 0)}
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-[#11192e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                          <span>Total Downloads</span>
                          <Download className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                          {stats.totalDownloads}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Controls Bar */}
                  <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search user by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-[#131e33] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Role Filter & Export */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#131e33] rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold">
                        {(['all', 'pro', 'free', 'admin', 'moderator'] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setFilterRole(r)}
                            className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                              filterRole === r
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                        title="Export user database to CSV file"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* User List Table */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm font-bold">No registered users found matching query</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-slate-100 dark:bg-[#11192e] text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px] font-black border-b border-slate-200 dark:border-white/10">
                            <tr>
                              <th className="py-3 px-3 sm:px-4">User</th>
                              <th className="py-3 px-3 sm:px-4">Email & Contact</th>
                              <th className="py-3 px-3 sm:px-4">Role / Access</th>
                              <th className="py-3 px-3 sm:px-4">Plan Status</th>
                              <th className="py-3 px-3 sm:px-4">Downloads</th>
                              <th className="py-3 px-3 sm:px-4">Joined Date</th>
                              <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#0c1324]">
                            {filteredUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                {/* Name */}
                                <td className="py-3 px-3 sm:px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs uppercase shadow-sm shrink-0">
                                      {u.name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{u.name}</span>
                                  </div>
                                </td>

                                {/* Email with 1-click Copy and Email Send */}
                                <td className="py-3 px-3 sm:px-4 font-mono text-slate-600 dark:text-slate-300">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate max-w-[160px] sm:max-w-[200px]">{u.email}</span>
                                    <button
                                      onClick={() => handleCopyEmail(u.email)}
                                      title="Copy Email"
                                      className="p-1 rounded-lg text-slate-400 hover:text-purple-500 hover:bg-purple-500/10 transition-colors"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleSendSingleEmail(u)}
                                      title="Send Email to User"
                                      className="p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>

                                {/* Interactive Role Assignment */}
                                <td className="py-3 px-3 sm:px-4">
                                  {isAdmin ? (
                                    <select
                                      value={u.role || 'user'}
                                      onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                      className={`px-2 py-1 rounded-xl text-xs font-bold border focus:outline-none transition-colors ${
                                        u.role === 'admin'
                                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                          : u.role === 'moderator'
                                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                          : 'bg-slate-100 dark:bg-[#131d31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                                      }`}
                                      title="Change User Access Level"
                                    >
                                      <option value="user">👤 User (Standard)</option>
                                      <option value="moderator">🛡️ Moderator (Partial Admin)</option>
                                      <option value="admin">👑 Admin (Full Access)</option>
                                    </select>
                                  ) : (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                        u.role === 'admin'
                                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                          : u.role === 'moderator'
                                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                          : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      {u.role === 'admin' ? '👑 Admin' : u.role === 'moderator' ? '🛡️ Moderator' : 'User'}
                                    </span>
                                  )}
                                </td>

                                {/* Plan */}
                                <td className="py-3 px-3 sm:px-4">
                                  <button
                                    onClick={() => handleTogglePro(u.id)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                                      u.isPro
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-white/20'
                                    }`}
                                    title="Click to toggle Pro / Free"
                                  >
                                    {u.isPro ? (
                                      <>
                                        <Crown className="w-3 h-3 text-amber-500" />
                                        <span>PRO (Unlimited)</span>
                                      </>
                                    ) : (
                                      <span>FREE (5/day)</span>
                                    )}
                                  </button>
                                </td>

                                {/* Downloads */}
                                <td className="py-3 px-3 sm:px-4 font-bold text-slate-800 dark:text-slate-200">
                                  {u.totalDownloads || 0}
                                </td>

                                {/* Joined Date */}
                                <td className="py-3 px-3 sm:px-4 text-slate-500 text-xs">
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </td>

                                {/* Actions: Direct Email + Delete */}
                                <td className="py-3 px-3 sm:px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleSendSingleEmail(u)}
                                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                      title="Send direct email to user"
                                    >
                                      <Mail className="w-4 h-4" />
                                    </button>
                                    {isAdmin && u.id !== currentUser?.id && u.role !== 'admin' && (
                                      <button
                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                        title="Delete user"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: BROADCAST NOTIFICATIONS */}
              {activeTab === 'broadcast' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent p-4 sm:p-5 rounded-2xl border border-purple-500/20">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Radio className="w-5 h-5 text-purple-500 animate-pulse" />
                      <span>Live In-App Notification Broadcast</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Broadcast real-time announcements to all users active on OmniDownloader. The notification appears instantly at the top of their screen via WebSocket.
                    </p>

                    <form onSubmit={handleSendBroadcast} className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Announcement Headline / Title *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 🎉 New Engine Update: 8K YouTube & Instagram Batch Downloads Active!"
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Alert Style / Badge Type
                          </label>
                          <select
                            value={broadcastType}
                            onChange={(e) => setBroadcastType(e.target.value as any)}
                            className="w-full px-3.5 py-2 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                          >
                            <option value="info">🔵 Info (General Notice)</option>
                            <option value="success">🟢 Success (New Feature / Live)</option>
                            <option value="warning">🟡 Warning (Maintenance Notice)</option>
                            <option value="alert">🔴 Alert (Urgent Priority)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Notification Message Details *
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Provide announcement message, maintenance schedule, or instructions for users..."
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="submit"
                          disabled={isSendingBroadcast || !isAdmin}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
                        >
                          {isSendingBroadcast ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span>🚀 Broadcast Live to All Users</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Active Announcements List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                      Active & Past System Announcements ({announcements.length})
                    </h4>

                    {announcements.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No broadcast announcements currently recorded.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {announcements.map((ann) => (
                          <div
                            key={ann.id}
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                              ann.active
                                ? 'bg-white dark:bg-[#11192e] border-slate-200 dark:border-white/10 shadow-sm'
                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-xl text-white font-bold text-xs shrink-0 mt-0.5 ${
                                ann.type === 'success'
                                  ? 'bg-emerald-600'
                                  : ann.type === 'warning'
                                  ? 'bg-amber-600'
                                  : ann.type === 'alert'
                                  ? 'bg-rose-600'
                                  : 'bg-blue-600'
                              }`}>
                                {ann.type === 'success' ? <CheckCircle className="w-4 h-4" /> : ann.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    {ann.title}
                                  </h5>
                                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                                    ann.active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-200 dark:bg-white/10 text-slate-400'
                                  }`}>
                                    {ann.active ? 'Active on App' : 'Muted'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                  {ann.message}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  By {ann.createdBy || 'Admin'} • {new Date(ann.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <button
                                  onClick={() => handleToggleAnnouncement(ann.id)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
                                    ann.active
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  }`}
                                  title="Toggle active display on website"
                                >
                                  {ann.active ? 'Mute' : 'Show Banner'}
                                </button>
                                <button
                                  onClick={() => handleDeleteAnnouncement(ann.id)}
                                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  title="Delete announcement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MASS EMAIL SENDER */}
              {activeTab === 'mass_email' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  <div className="bg-slate-50 dark:bg-[#0d1527] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/10">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-purple-500" />
                      <span>Mass Email Dispatch to Registered Users</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Quickly copy recipient email lists or launch your email client (Gmail, Outlook, Apple Mail) with BCC to notify your community.
                    </p>

                    {/* Filter Recipients */}
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Recipient Audience:</span>
                      <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#131d31] rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold">
                        <button
                          onClick={() => setEmailFilter('all')}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            emailFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          All Users ({users.length})
                        </button>
                        <button
                          onClick={() => setEmailFilter('pro')}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            emailFilter === 'pro' ? 'bg-amber-600 text-white' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          Pro Members ({users.filter((u) => u.isPro).length})
                        </button>
                        <button
                          onClick={() => setEmailFilter('free')}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            emailFilter === 'free' ? 'bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          Free Users ({users.filter((u) => !u.isPro).length})
                        </button>
                      </div>

                      <span className="text-xs text-emerald-500 font-bold ml-auto">
                        🎯 {getFilteredEmails().length} Recipients Selected
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="mt-4 flex items-center gap-3 flex-wrap">
                      <button
                        onClick={handleCopyAllEmails}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>📋 Copy All Emails to Clipboard (BCC List)</span>
                      </button>

                      <button
                        onClick={handleOpenMassEmailClient}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>✉️ Open in Email App (BCC Auto-Filled)</span>
                      </button>
                    </div>

                    {/* Email Subject & Message Composer Preview */}
                    <div className="mt-5 space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Email Subject Line
                        </label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Email Body / Message
                        </label>
                        <textarea
                          rows={5}
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Note */}
              <div className="p-3 sm:p-4 bg-slate-100 dark:bg-[#080d1a] border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
                <span>
                  Logged in as <strong className="text-purple-500">{currentUser?.name || 'Staff'}</strong> ({currentUser?.email}) • {isAdmin ? 'Master Administrator' : 'Staff Moderator'}
                </span>
                <span className="font-bold text-emerald-500">
                  Localhost Admin Enabled • Realtime Sync Active
                </span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
