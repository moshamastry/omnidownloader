import { VideoMetadata, HistoryItem, AppSettings, BatchSummary, QueueItem, ChannelExtractResult, User, QuotaStatus, Announcement } from '../types';

const isFileOrElectron = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' || 
  !window.location.host || 
  window.location.origin === 'null' ||
  Boolean((window as any).electronAPI)
);

const API_BASE = isFileOrElectron ? 'http://localhost:4000/api' : '/api';

// Token helper
let currentToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('omni_auth_token') : null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
  if (token) {
    localStorage.setItem('omni_auth_token', token);
  } else {
    localStorage.removeItem('omni_auth_token');
  }
};

export const getAuthToken = () => currentToken;

const getHeaders = (customHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return headers;
};

export const api = {
  // Auth & Quota
  getQuota: async (): Promise<QuotaStatus> => {
    const res = await fetch(`${API_BASE}/auth/quota`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch quota');
    return res.json();
  },

  register: async (email: string, name: string, password: string): Promise<{ success: boolean; user: User; token: string }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, name, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  login: async (email: string, password: string): Promise<{ success: boolean; user: User; token: string }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication error');
    return data;
  },

  // Admin APIs
  adminLoginPin: async (pin: string): Promise<{ success: boolean; user: User; token: string }> => {
    const res = await fetch(`${API_BASE}/admin/login-pin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid Admin Key');
    return data;
  },

  getAdminStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin stats');
    return data as {
      totalUsers: number;
      totalProUsers: number;
      totalDownloads: number;
      activeGuestQuotas: number;
      guestDailyLimit: number;
    };
  },

  getAdminUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
    return data.users as User[];
  },

  toggleAdminPro: async (userId: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-pro`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle Pro');
    return data.user as User;
  },

  changeUserRole: async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user role');
    return data.user as User;
  },

  deleteAdminUser: async (userId: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return data.success;
  },

  // Announcements & Broadcasts
  getAnnouncements: async (): Promise<Announcement[]> => {
    const res = await fetch(`${API_BASE}/announcements`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.announcements || [];
  },

  getAdminAnnouncements: async (): Promise<Announcement[]> => {
    const res = await fetch(`${API_BASE}/admin/announcements`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch announcements');
    return data.announcements || [];
  },

  sendAnnouncement: async (announcement: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'alert' }): Promise<Announcement> => {
    const res = await fetch(`${API_BASE}/admin/announcements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(announcement),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send broadcast');
    return data.announcement;
  },

  deleteAnnouncement: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete announcement');
    return data.success;
  },

  toggleAnnouncement: async (id: string): Promise<Announcement> => {
    const res = await fetch(`${API_BASE}/admin/announcements/${id}/toggle`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle announcement');
    return data.announcement;
  },

  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend offline');
    return res.json();
  },

  // Single Info Extraction
  getVideoInfo: async (url: string): Promise<VideoMetadata> => {
    const res = await fetch(`${API_BASE}/info`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch video information');
    return data;
  },

  // Channel / Playlist / Shorts Extraction
  extractChannel: async (url: string, maxVideos: number = 50): Promise<ChannelExtractResult> => {
    const res = await fetch(`${API_BASE}/channel/extract`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url, maxVideos }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to extract channel videos');
    return data;
  },

  // Single Download
  startDownload: async (
    id: string,
    url: string,
    preset: string,
    customFormatId?: string,
    directDownloadUrl?: string,
    directAudioUrl?: string,
    title?: string
  ) => {
    const res = await fetch(`${API_BASE}/download`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id, url, preset, customFormatId, directDownloadUrl, directAudioUrl, title }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || 'Download failed');
      err.isLimitReached = data.isLimitReached;
      err.quota = data.quota;
      throw err;
    }
    return data;
  },

  // Bulk Info extraction
  getBulkInfo: async (urls: string[]) => {
    const res = await fetch(`${API_BASE}/bulk/info`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ urls }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to parse batch URLs');
    return data.items as Array<{ url: string; success: boolean; data?: VideoMetadata; error?: string }>;
  },

  // Bulk Queue Start
  startBulkDownload: async (batchId: string, items: Array<Partial<QueueItem>>) => {
    const res = await fetch(`${API_BASE}/bulk/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ batchId, items }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || 'Failed to start queue');
      err.isLimitReached = data.isLimitReached;
      err.quota = data.quota;
      throw err;
    }
    return data;
  },

  // Bulk Item Control
  cancelQueueItem: async (id: string) => {
    const res = await fetch(`${API_BASE}/bulk/cancel-item`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id }),
    });
    return res.json();
  },

  retryQueueItem: async (id: string) => {
    const res = await fetch(`${API_BASE}/bulk/retry-item`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id }),
    });
    return res.json();
  },

  cancelBatch: async (batchId: string) => {
    const res = await fetch(`${API_BASE}/bulk/cancel-batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ batchId }),
    });
    return res.json();
  },

  getBatchSummary: async (batchId: string): Promise<BatchSummary> => {
    const res = await fetch(`${API_BASE}/bulk/summary/${batchId}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  getZipUrl: (batchId: string) => `${API_BASE}/bulk/zip/${batchId}`,

  getFileDownloadUrl: (filename: string) => `${API_BASE}/files/${encodeURIComponent(filename)}`,

  // History
  getHistory: async (): Promise<HistoryItem[]> => {
    const res = await fetch(`${API_BASE}/history`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.items || [];
  },

  deleteHistoryItem: async (id: string) => {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  clearHistory: async () => {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Open in folder (Desktop/Electron)
  openFolder: async (filepath?: string) => {
    const res = await fetch(`${API_BASE}/open-folder`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ filepath }),
    });
    return res.json();
  },
};

