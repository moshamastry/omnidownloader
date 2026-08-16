import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Trash2, 
  FolderOpen, 
  Clock, 
  HardDrive, 
  Film, 
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HistoryItem } from '../../types';
import { api } from '../../services/api';
import { PlatformBadge } from '../ui/PlatformBadge';

interface DownloadHistoryProps {
  onRedownload?: (url: string) => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({ onRedownload }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const items = await api.getHistory();
      setHistory(items);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteHistoryItem(id);
      setHistory((prev) => prev.filter((i) => i.id !== id));
      toast.success('Removed from history');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all download history?')) return;
    try {
      await api.clearHistory();
      setHistory([]);
      toast.success('Download history cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  const handleOpenFolder = async (filepath?: string) => {
    try {
      await api.openFolder(filepath);
      toast.success('Opened folder in file manager');
    } catch {
      toast.error('Failed to open file path');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredHistory = history.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q) ||
      item.platform.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-0.5 text-xs font-bold text-brand-600 dark:text-brand-400 mb-2">
            <HistoryIcon className="h-3.5 w-3.5" />
            <span>Activity Log</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Download History
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            View, open, or re-download your saved media files.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search history by title, URL or platform..."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 shadow-sm"
        />
      </div>

      {/* History Items List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <HistoryIcon className="h-12 w-12 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No download history found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? 'No downloads match your search query.' : 'Downloaded videos and audio files will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Left Thumbnail & Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative h-12 w-20 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-600">
                      <Film className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={item.platform} size="sm" />
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(item.completedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(item.fileSize)}
                    </span>
                    <span className="uppercase">{item.preset || 'MP4'}</span>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleOpenFolder(item.filepath)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm"
                  title="Open in file manager"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                  <span>Folder</span>
                </button>

                {onRedownload && (
                  <button
                    onClick={() => onRedownload(item.url)}
                    className="p-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors shadow-sm"
                    title="Download again"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shadow-sm"
                  title="Remove from history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
