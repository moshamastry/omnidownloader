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
  UserCog
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import toast from 'react-hot-toast';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser, isAdmin, isModerator, isStaff, loginAdminPin } = useAuth();
  const [adminPin, setAdminPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [u, s] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
      ]);
      setUsers(u);
      setStats(s);
    } catch (err: any) {
      console.error(err);
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

  const handleQuickMasterUnlock = async () => {
    setIsVerifying(true);
    try {
      await loginAdminPin('admin12345');
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
      setUsers((prev) => prev.map((u) => u).filter((u) => u.id !== userId));
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
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
          className="relative w-full max-w-5xl bg-white dark:bg-[#0b1120] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-10 my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>{isAdmin ? 'OmniDownloader Master Owner Console' : 'OmniDownloader Staff & Moderator Portal'}</span>
                  <span className={`px-2 py-0.5 text-white font-black text-[10px] uppercase rounded-full tracking-wider ${
                    isAdmin ? 'bg-purple-500' : 'bg-blue-600'
                  }`}>
                    {isAdmin ? '👑 Master Admin' : '🛡️ Moderator (Partial Access)'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {isAdmin 
                    ? 'Full Owner Control: Assign Moderator/Admin roles, manage users, toggle Pro, and export database.'
                    : 'Moderator View: Inspect users, review download traffic, and toggle Pro access.'}
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
            <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-auto">
              <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 text-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/10">
                <KeyRound className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                Restricted Owner Access
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Please enter your Master Admin Key or Password to unlock the management console.
              </p>

              <form onSubmit={handleUnlockAdmin} className="w-full space-y-4">
                <div className="relative text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Master Admin Key / Password
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
                      <span>Unlock Admin Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10 w-full">
                <button
                  type="button"
                  onClick={handleQuickMasterUnlock}
                  disabled={isVerifying}
                  className="w-full py-2.5 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs rounded-xl border border-purple-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-500" />
                  ⚡ 1-Click Master Owner Unlock (admin12345)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              {stats && (
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-[#080d1a] border-b border-slate-200 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                  <div className="p-3.5 bg-white dark:bg-[#11192e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                      <span>Total Users</span>
                      <Users className="w-4 h-4 text-brand-500" />
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {stats.totalUsers}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-[#11192e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                      <span>Pro Members</span>
                      <Crown className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {stats.totalProUsers}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-[#11192e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
                      <span>Admins & Mods</span>
                      <UserCog className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                      {(stats.totalAdmins || 0) + (stats.totalModerators || 0)}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-[#11192e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
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
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
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
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
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
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Role / Access</th>
                          <th className="py-3 px-4">Plan Status</th>
                          <th className="py-3 px-4">Downloads</th>
                          <th className="py-3 px-4">Joined Date</th>
                          {isAdmin && <th className="py-3 px-4 text-right">Delete</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#0c1324]">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            {/* Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs uppercase shadow-sm">
                                  {u.name.charAt(0)}
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                              {u.email}
                            </td>

                            {/* Interactive Role Assignment (Master Admin can change role anytime) */}
                            <td className="py-3 px-4">
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
                            <td className="py-3 px-4">
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
                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                              {u.totalDownloads || 0}
                            </td>

                            {/* Joined Date */}
                            <td className="py-3 px-4 text-slate-500 text-xs">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            {/* Actions (Delete: Admin only) */}
                            {isAdmin && (
                              <td className="py-3 px-4 text-right">
                                {u.id !== currentUser?.id && u.role !== 'admin' && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer Note */}
              <div className="p-4 bg-slate-100 dark:bg-[#080d1a] border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
                <span>
                  Logged in as <strong className="text-purple-500">{currentUser?.name || 'Staff'}</strong> ({isAdmin ? 'Full Master Admin' : 'Partial Moderator'})
                </span>
                <span className="font-bold text-emerald-500">All role updates & database changes sync instantly.</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
