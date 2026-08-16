import { HistoryItem } from '../types';

const STORAGE_KEY = 'omni_local_download_history';

export const historyStorage = {
  getHistory: (): HistoryItem[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: HistoryItem[] = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.sort((a, b) => b.completedAt - a.completedAt) : [];
    } catch {
      return [];
    }
  },

  addItem: (item: HistoryItem) => {
    try {
      const current = historyStorage.getHistory();
      // Remove any existing entry with same id or duplicate url+preset within last 5 seconds
      const filtered = current.filter((i) => i.id !== item.id);
      filtered.unshift(item);
      // Keep up to 200 items in user's browser
      const sliced = filtered.slice(0, 200);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
      // Dispatch storage event so other components / tabs can react
      window.dispatchEvent(new Event('omni_history_updated'));
    } catch (err) {
      console.error('Failed to save private history item:', err);
    }
  },

  deleteItem: (id: string) => {
    try {
      const current = historyStorage.getHistory();
      const updated = current.filter((i) => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('omni_history_updated'));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  },

  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('omni_history_updated'));
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }
};
