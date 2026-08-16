import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, 
  Upload, 
  Play, 
  Pause, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Archive, 
  Trash2, 
  FileText, 
  FolderOpen,
  ListVideo,
  Sparkles,
  CheckSquare,
  Square,
  Clock,
  User,
  Tv,
  Loader2,
  FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QueueItem, BatchSummary, ChannelVideoEntry, ChannelExtractResult } from '../../types';
import { api } from '../../services/api';
import { wsService } from '../../services/websocket';
import { PlatformBadge } from '../ui/PlatformBadge';
import { useAuth } from '../../context/AuthContext';
import { historyStorage } from '../../services/historyStorage';

export const BulkDownloader: React.FC = () => {
  const { isPro, quota, openAuthModal, refreshQuota } = useAuth();
  // Mode selection: 'manual' (multiple links / file) vs 'channel' (single channel/playlist URL extractor)
  const [activeTabMode, setActiveTabMode] = useState<'manual' | 'channel'>('manual');

  // Mode 1: Manual / File Import
  const [rawUrls, setRawUrls] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('best-video-mp4');
  const [fileImportName, setFileImportName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode 2: Channel / Playlist / Shorts Extractor
  const [channelUrl, setChannelUrl] = useState<string>('');
  const [maxVideosLimit, setMaxVideosLimit] = useState<number>(50);
  const [isExtractingChannel, setIsExtractingChannel] = useState<boolean>(false);
  const [extractedChannelData, setExtractedChannelData] = useState<ChannelExtractResult | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());

  // Batch Queue & Active Downloads State
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [batchSummary, setBatchSummary] = useState<BatchSummary | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Parse URLs from textarea
  const parsedUrls = rawUrls
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

  // Subscribe to WebSocket updates for queue items
  useEffect(() => {
    const unsubProgress = wsService.onProgress((p) => {
      if (p.status === 'completed' && p.filename) {
        historyStorage.addItem({
          id: p.id || String(Date.now()),
          url: p.id,
          title: p.filename,
          duration: '--',
          platform: 'Batch',
          filename: p.filename,
          filepath: p.filename,
          fileSize: p.totalBytes || 0,
          preset: 'batch-mp4',
          completedAt: Date.now(),
        });
      }

      setQueueItems((prev) =>
        prev.map((item) => {
          if (item.id === p.id) {
            return {
              ...item,
              status: (p.status as any) || item.status,
              percent: p.percent ?? item.percent,
              speed: p.speed ?? item.speed,
              eta: p.eta ?? item.eta,
              filename: p.filename ?? item.filename,
              error: p.error ?? item.error,
            };
          }
          return item;
        })
      );
    });

    const unsubQueue = wsService.onQueueUpdate((item: QueueItem) => {
      setQueueItems((prev) => {
        const idx = prev.findIndex((i) => i.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...item };
          return next;
        }
        return [...prev, item];
      });
    });

    return () => {
      unsubProgress();
      unsubQueue();
    };
  }, []);

  // Poll batch summary if active batch
  useEffect(() => {
    if (!currentBatchId) return;

    const fetchSummary = async () => {
      try {
        const summary = await api.getBatchSummary(currentBatchId);
        setBatchSummary(summary);
      } catch {
        // ignore
      }
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 2500);
    return () => clearInterval(interval);
  }, [currentBatchId]);

  // Handle File Import (.txt or .csv)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileImportName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawUrls(content);
        toast.success(`Imported links from ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  // Handle Fetch Channel / Playlist Media
  const handleFetchChannel = async () => {
    if (!channelUrl.trim()) {
      toast.error('Please enter a channel, shorts, or playlist URL');
      return;
    }

    setIsExtractingChannel(true);
    setExtractedChannelData(null);
    setSelectedVideoIds(new Set());

    try {
      const result = await api.extractChannel(channelUrl.trim(), maxVideosLimit);
      setExtractedChannelData(result);
      // Select all by default
      const allIds = new Set(result.videos.map((v) => v.id));
      setSelectedVideoIds(allIds);
      toast.success(`Found ${result.videos.length} videos from ${result.channelTitle}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to extract channel videos');
    } finally {
      setIsExtractingChannel(false);
    }
  };

  // Channel Video Selection Toggles
  const handleToggleVideo = (id: string) => {
    const next = new Set(selectedVideoIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedVideoIds(next);
  };

  const handleSelectAllVideos = () => {
    if (!extractedChannelData) return;
    if (selectedVideoIds.size === extractedChannelData.videos.length) {
      setSelectedVideoIds(new Set());
    } else {
      setSelectedVideoIds(new Set(extractedChannelData.videos.map((v) => v.id)));
    }
  };

  // Start Batch Download for Manual URLs or Selected Channel Videos
  const handleStartQueue = async (urlsToDownload: string[]) => {
    if (urlsToDownload.length === 0) {
      toast.error('No URLs selected to download');
      return;
    }

    if (!isPro && urlsToDownload.length > 3) {
      toast.error('Free guests can download up to 3 links per batch. Sign up free for unlimited bulk batch downloads!');
      openAuthModal('register');
      return;
    }

    if (!isPro && quota && !quota.canDownload) {
      toast.error('Daily free download limit reached. Sign up free for unlimited downloads!');
      openAuthModal('register');
      return;
    }

    const batchId = `batch_${Date.now()}`;
    setCurrentBatchId(batchId);

    try {
      const itemsToStart = urlsToDownload.map((url) => ({
        url,
        preset: selectedPreset,
      }));
      const res = await api.startBulkDownload(batchId, itemsToStart);
      setQueueItems(res.items || []);
      toast.success(`Started downloading ${urlsToDownload.length} items!`);
      refreshQuota();
    } catch (err: any) {
      if (err.isLimitReached) {
        toast.error(err.message || 'Daily free limit reached');
        openAuthModal('register');
      } else {
        toast.error(err.message || 'Failed to start batch download');
      }
    }
  };

  const handleStartManualBatch = async () => {
    if (parsedUrls.length === 0) {
      toast.error('Please paste at least one valid video link');
      return;
    }
    await handleStartQueue(parsedUrls);
  };

  const handleStartChannelBatch = async () => {
    if (!extractedChannelData) return;
    const selectedVideos = extractedChannelData.videos.filter((v) => selectedVideoIds.has(v.id));
    if (selectedVideos.length === 0) {
      toast.error('Please select at least one video to download');
      return;
    }

    const urls = selectedVideos.map((v) => v.url);
    await handleStartQueue(urls);
  };

  const handleCancelItem = async (id: string) => {
    try {
      await api.cancelQueueItem(id);
      toast.success('Download canceled');
    } catch {
      toast.error('Could not cancel download');
    }
  };

  const handleRetryItem = async (id: string) => {
    try {
      await api.retryQueueItem(id);
      toast.success('Item requeued');
    } catch {
      toast.error('Could not retry download');
    }
  };

  const handleCancelBatch = async () => {
    if (!currentBatchId) return;
    try {
      await api.cancelBatch(currentBatchId);
      toast.success('All remaining downloads canceled');
    } catch {
      toast.error('Failed to cancel batch');
    }
  };

  const handleDownloadZip = () => {
    if (!currentBatchId) return;
    setIsZipping(true);
    const zipUrl = api.getZipUrl(currentBatchId);
    window.location.href = zipUrl;
    setTimeout(() => setIsZipping(false), 2000);
  };

  const handleOpenFolder = async () => {
    try {
      await api.openFolder();
      toast.success('Opened downloads folder');
    } catch {
      toast.error('Failed to open folder');
    }
  };

  const completedCount = queueItems.filter((i) => i.status === 'completed').length;
  const downloadingCount = queueItems.filter((i) => i.status === 'downloading').length;
  const failedCount = queueItems.filter((i) => i.status === 'failed').length;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
          <Layers className="h-3.5 w-3.5" />
          <span>Batch & Channel Downloader</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Bulk Video & Audio <span className="bg-gradient-to-r from-purple-600 via-indigo-500 to-brand-600 bg-clip-text text-transparent">Downloader</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Download multiple links, entire YouTube channel Shorts/videos, playlists, or Instagram reels in parallel and export all into a single ZIP archive.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 shadow-sm">
          <button
            onClick={() => setActiveTabMode('manual')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTabMode === 'manual'
                ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Multiple Links / File Import</span>
          </button>

          <button
            onClick={() => setActiveTabMode('channel')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTabMode === 'channel'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Channel / Shorts / Playlist Extractor</span>
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
              New
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: MULTIPLE LINKS / FILE IMPORT MODE */}
      {activeTabMode === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main URL Textarea Card */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-500" />
                <span>Paste Multiple URLs (One per line or space-separated)</span>
              </label>
              <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                {parsedUrls.length} URLs detected
              </span>
            </div>

            <textarea
              rows={8}
              value={rawUrls}
              onChange={(e) => setRawUrls(e.target.value)}
              placeholder={`https://www.youtube.com/watch?v=...\nhttps://www.instagram.com/reel/...\nhttps://www.facebook.com/reel/...\nhttps://www.tiktok.com/@user/video/...`}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 p-3.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-y"
            />

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Preset:</span>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="best-video-mp4" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                    Best Quality (Auto 1080p/4K MP4)
                  </option>
                  <option value="1080p-mp4" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                    Full HD (1080p MP4)
                  </option>
                  <option value="720p-mp4" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                    HD (720p MP4)
                  </option>
                  <option value="best-audio-mp3" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                    Audio Only (Lossless MP3 320kbps)
                  </option>
                  <option value="audio-m4a" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1.5">
                    Audio Only (AAC/M4A)
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {rawUrls && (
                  <button
                    onClick={() => {
                      setRawUrls('');
                      setFileImportName(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleStartManualBatch}
                  disabled={parsedUrls.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/25 hover:opacity-95 disabled:opacity-50 transition-all"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Bulk Download</span>
                </button>
              </div>
            </div>
          </div>

          {/* Side: Import File Card */}
          <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Upload className="h-4 w-4 text-purple-500" />
                <span>Import URL File</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a .txt or .csv text file containing a list of video links.
              </p>
            </div>

            <label className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/[0.02] p-6 hover:border-brand-500/50 hover:bg-brand-500/5 cursor-pointer transition-all">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-8 w-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {fileImportName || 'Click or drag .txt / .csv file here'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                Plain text with 1 URL per row
              </span>
            </label>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Auto concurrency: 2 active</span>
              <span>ZIP Packaging: Supported</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHANNEL / PLAYLIST / SHORTS EXTRACTOR MODE */}
      {activeTabMode === 'channel' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Tv className="h-4 w-4 text-purple-500" />
                  <span>Channel / Profile / Shorts / Playlist URL</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Supported: <code>youtube.com/@Channel/shorts</code>, <code>/@Channel/videos</code>, <code>playlist?list=...</code>, Instagram profiles/reels.
                </p>
              </div>

              {/* Limit Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Max to fetch:</span>
                <select
                  value={maxVideosLimit}
                  onChange={(e) => setMaxVideosLimit(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={10} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1">10 Videos</option>
                  <option value={25} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1">25 Videos</option>
                  <option value={50} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1">50 Videos (Standard)</option>
                  <option value={100} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1">100 Videos (High)</option>
                  <option value={200} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1">200 Videos (Max)</option>
                </select>
              </div>
            </div>

            {/* Input & Fetch Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://www.youtube.com/@Channel/shorts or https://www.instagram.com/username/reels"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 px-4 py-3 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchChannel()}
                />
                {channelUrl && (
                  <button
                    onClick={() => setChannelUrl('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                onClick={handleFetchChannel}
                disabled={isExtractingChannel || !channelUrl.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:opacity-95 disabled:opacity-50 transition-all shrink-0"
              >
                {isExtractingChannel ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Extracting Videos...</span>
                  </>
                ) : (
                  <>
                    <ListVideo className="h-4 w-4" />
                    <span>Fetch Media</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Channel Profile Header Card & Interactive Grid */}
          {extractedChannelData && (
            <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
              {/* Channel Profile Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  {extractedChannelData.avatarUrl ? (
                    <img
                      src={extractedChannelData.avatarUrl}
                      alt={extractedChannelData.channelTitle}
                      className="h-12 w-12 rounded-full object-cover border-2 border-purple-500/40"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Tv className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {extractedChannelData.channelTitle}
                      </h3>
                      <PlatformBadge platform={extractedChannelData.platform} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {extractedChannelData.uploader ? `@${extractedChannelData.uploader}` : ''} • Found {extractedChannelData.totalFound} items
                    </p>
                  </div>
                </div>

                {/* Batch Action Toolbar */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    onClick={handleSelectAllVideos}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm"
                  >
                    {selectedVideoIds.size === extractedChannelData.videos.length ? (
                      <>
                        <CheckSquare className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-3.5 w-3.5" />
                        <span>Select All ({extractedChannelData.videos.length})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleStartChannelBatch}
                    disabled={selectedVideoIds.size === 0}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/25 hover:opacity-95 disabled:opacity-50 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Selected ({selectedVideoIds.size})</span>
                  </button>
                </div>
              </div>

              {/* Selectable Video Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {extractedChannelData.videos.map((vid, idx) => {
                  const isSelected = selectedVideoIds.has(vid.id);
                  return (
                    <div
                      key={vid.id || idx}
                      onClick={() => handleToggleVideo(vid.id)}
                      className={`relative group rounded-xl border p-2.5 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                          : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/15'
                      }`}
                    >
                      {/* Top Checkbox Overlay */}
                      <div className="absolute top-4 left-4 z-10">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                            isSelected
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-black/60 border-white/40 text-transparent backdrop-blur-md'
                          }`}
                        >
                          <CheckSquare className="h-3.5 w-3.5 fill-current" />
                        </div>
                      </div>

                      {/* Video Thumbnail */}
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-900 mb-2">
                        {vid.thumbnail ? (
                          <img
                            src={vid.thumbnail}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Tv className="h-8 w-8" />
                          </div>
                        )}
                        {/* Duration badge */}
                        <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white backdrop-blur-md">
                          {vid.durationFormatted || 'Short'}
                        </div>
                      </div>

                      {/* Video Title */}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                          {vid.title}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>#{idx + 1}</span>
                          {vid.viewCount && <span>{vid.viewCount.toLocaleString()} views</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE BATCH PROGRESS & QUEUE STATUS TABLE */}
      {queueItems.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-6">
          {/* Batch Status Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand-500" />
                <span>Batch Queue Status</span>
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Total: {queueItems.length}</span>
                <span className="text-emerald-600 dark:text-emerald-400">Completed: {completedCount}</span>
                <span className="text-brand-600 dark:text-brand-400">Active: {downloadingCount}</span>
                {failedCount > 0 && <span className="text-red-500">Failed: {failedCount}</span>}
              </div>
            </div>

            {/* Actions: ZIP Download, Open Folder & Cancel */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {completedCount > 0 && (
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>{isZipping ? 'Creating ZIP...' : `Download All as ZIP (${completedCount})`}</span>
                </button>
              )}

              <button
                onClick={handleOpenFolder}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm"
              >
                <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                <span>Open Folder</span>
              </button>

              <button
                onClick={handleCancelBatch}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear List</span>
              </button>
            </div>
          </div>

          {/* Overall Batch Progress Bar */}
          {batchSummary && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Overall Batch Progress</span>
                <span>{batchSummary.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 via-purple-500 to-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${batchSummary.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Queue Items List (Mobile Card + Desktop Table) */}
          <div className="space-y-3">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
              >
                {/* Left: Thumbnail & Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative h-10 w-16 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-600">
                        <Tv className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title || item.url}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-mono">
                      {item.url}
                    </p>
                  </div>
                </div>

                {/* Center: Status & Progress */}
                <div className="w-full sm:w-48 space-y-1 shrink-0">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className={`capitalize ${
                      item.status === 'completed'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.status === 'failed'
                        ? 'text-red-500'
                        : 'text-brand-600 dark:text-brand-400'
                    }`}>
                      {item.status}...
                    </span>
                    <span className="text-slate-500">{item.percent || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        item.status === 'completed'
                          ? 'bg-emerald-500'
                          : item.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-brand-500'
                      }`}
                      style={{ width: `${item.percent || 0}%` }}
                    />
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'completed' && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Ready</span>
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <button
                      onClick={() => handleRetryItem(item.id)}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      title="Retry"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {(item.status === 'pending' || item.status === 'downloading') && (
                    <button
                      onClick={() => handleCancelItem(item.id)}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
