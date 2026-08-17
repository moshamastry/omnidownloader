export interface VideoFormatOption {
  formatId: string;
  ext: string;
  resolution?: string;
  qualityLabel: string;
  filesizeApprox?: number;
  filesizeStr?: string;
  hasVideo: boolean;
  hasAudio: boolean;
  type: 'video' | 'audio';
}

export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  durationFormatted: string;
  thumbnail?: string;
  uploader?: string;
  platform: string;
  webpageUrl: string;
  viewCount?: number;
  formats: VideoFormatOption[];
  defaultPreset: string;
  directDownloadUrl?: string;
  directAudioUrl?: string;
}

export interface ChannelVideoEntry {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  durationFormatted?: string;
  duration?: number;
  viewCount?: number;
  uploadDate?: string;
}

export interface ChannelExtractResult {
  channelTitle: string;
  channelUrl: string;
  uploader?: string;
  avatarUrl?: string;
  description?: string;
  totalFound: number;
  platform: string;
  videos: ChannelVideoEntry[];
}

export interface DownloadProgress {
  id: string;
  status: 'starting' | 'downloading' | 'processing' | 'completed' | 'failed' | 'paused' | 'canceled';
  percent: number;
  speed: string;
  eta: string;
  downloadedBytes?: number;
  totalBytes?: number;
  filename?: string;
  filepath?: string;
  error?: string;
}

export interface QueueItem {
  id: string;
  batchId: string;
  url: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  uploader?: string;
  platform?: string;
  preset: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'canceled';
  percent: number;
  speed: string;
  eta: string;
  filename?: string;
  filepath?: string;
  fileSize?: number;
  error?: string;
  createdAt: number;
}

export interface BatchSummary {
  batchId: string;
  total: number;
  completed: number;
  failed: number;
  pending: number;
  downloading: number;
  progressPercent: number;
  isFinished: boolean;
  zipAvailable: boolean;
  items: QueueItem[];
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  platform: string;
  filename: string;
  filepath: string;
  fileSize: number;
  preset: string;
  completedAt: number;
}

export interface AppSettings {
  downloadDirectory: string;
  defaultPreset: string;
  maxConcurrentDownloads: number;
  autoDetectClipboard: boolean;
  theme: 'dark' | 'light' | 'system';
  proxyUrl?: string;
  cookiesContent?: string;
  extractorClients?: string;
  cookiesStatus?: {
    hasCookies: boolean;
    source: string;
    message: string;
    sizeBytes?: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  isPro: boolean;
  role: 'admin' | 'moderator' | 'user';
  createdAt: number;
  totalDownloads: number;
}

export interface QuotaStatus {
  isPro: boolean;
  dailyLimit: number | 'Unlimited';
  usedToday: number;
  remainingToday: number | 'Unlimited';
  canDownload: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role?: 'admin' | 'moderator' | 'user';
    isPro: boolean;
  };
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  createdAt: number;
  createdBy?: string;
  active: boolean;
}

export type ActiveTab = 'single' | 'bulk' | 'history' | 'settings' | 'platforms';
