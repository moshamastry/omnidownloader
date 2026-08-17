import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Clock, 
  User, 
  AlertCircle, 
  Sparkles, 
  FolderOpen, 
  Film,
  Music,
  ArrowRight,
  Eye,
  CheckCircle2,
  QrCode,
  Play,
  Share2,
  Zap,
  Crown,
  Lock,
  ExternalLink,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { VideoMetadata, DownloadProgress } from '../../types';
import { api } from '../../services/api';
import { wsService } from '../../services/websocket';
import { PlatformBadge } from '../ui/PlatformBadge';
import { useAuth } from '../../context/AuthContext';
import { historyStorage } from '../../services/historyStorage';
import { SeoContentSection } from '../seo/SeoContentSection';

interface SingleDownloaderProps {
  initialUrl?: string;
  onClearInitialUrl?: () => void;
}

export const SingleDownloader: React.FC<SingleDownloaderProps> = ({ 
  initialUrl = '', 
  onClearInitialUrl 
}) => {
  const { isPro, quota, openAuthModal, refreshQuota } = useAuth();
  const [url, setUrl] = useState<string>(initialUrl);
  const [isLoadingInfo, setIsLoadingInfo] = useState<boolean>(false);
  const [videoInfo, setVideoInfo] = useState<VideoMetadata | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('best-video-mp4');
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [downloadedFile, setDownloadedFile] = useState<{ filename: string; url: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialUrl && initialUrl !== url) {
      setUrl(initialUrl);
      handleFetchInfo(initialUrl);
      if (onClearInitialUrl) onClearInitialUrl();
    }
  }, [initialUrl]);

  // Subscribe to WebSocket progress updates
  useEffect(() => {
    const unsub = wsService.onProgress((p) => {
      if (p.id === downloadId) {
        setProgress(p);

        if (p.status === 'completed') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success('Download completed successfully!');
          refreshQuota();
          if (p.filename) {
            const fileUrl = api.getFileDownloadUrl(p.filename);
            setDownloadedFile({
              filename: p.filename,
              url: fileUrl,
            });

            // Save to private local browser history (100% Client-Side Privacy)
            historyStorage.addItem({
              id: p.id || String(Date.now()),
              url: videoInfo?.webpageUrl || url,
              title: videoInfo?.title || p.filename,
              thumbnail: videoInfo?.thumbnail,
              duration: videoInfo?.durationFormatted,
              platform: videoInfo?.platform || 'Web',
              filename: p.filename,
              filepath: p.filename,
              fileSize: p.totalBytes || 0,
              preset: selectedPreset,
              completedAt: Date.now(),
            });

            // Automatically trigger device download for web browser visitors
            const a = document.createElement('a');
            a.href = fileUrl;
            a.download = p.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } else if (p.status === 'failed') {
          toast.error(p.error || 'Download failed');
          setErrorMessage(p.error || 'Download failed');
        }
      }
    });

    return () => unsub();
  }, [downloadId]);

  const handleFetchInfo = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl) {
      toast.error('Please enter a video URL');
      return;
    }

    setIsLoadingInfo(true);
    setErrorMessage(null);
    setVideoInfo(null);
    setProgress(null);
    setDownloadedFile(null);

    try {
      const data = await api.getVideoInfo(targetUrl);
      setVideoInfo(data);
      setSelectedPreset(data.defaultPreset || 'best-video-mp4');
      toast.success('Media details loaded!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not fetch video info. Ensure the link is public.');
      toast.error(err.message || 'Failed to extract video');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleStartDownload = async () => {
    if (!url.trim()) return;

    if (!isPro && quota && !quota.canDownload) {
      toast.error('Daily free download limit reached (5/5). Sign up free for unlimited downloads!');
      openAuthModal('register');
      return;
    }

    const id = `dl_${Date.now()}`;
    setDownloadId(id);
    setProgress({
      id,
      status: 'starting',
      percent: 0,
      speed: 'Starting engine...',
      eta: '--:--',
    });
    setDownloadedFile(null);
    setErrorMessage(null);

    try {
      await api.startDownload(
        id,
        url.trim(),
        selectedPreset,
        undefined,
        videoInfo?.directDownloadUrl,
        videoInfo?.directAudioUrl,
        videoInfo?.title
      );
    } catch (err: any) {
      if (err.isLimitReached) {
        toast.error(err.message || 'Daily free limit reached');
        openAuthModal('register');
      } else {
        setErrorMessage(err.message || 'Download failed');
        toast.error(err.message || 'Download error');
      }
      setProgress(null);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await api.openFolder();
      toast.success('Opened downloads folder');
    } catch {
      toast.error('Failed to open folder');
    }
  };

  const formatOptions = [
    { id: 'best-video-mp4', label: 'Best Quality MP4 (Video + Sound)', type: 'video', quality: 'Ultra HD', isPro: false },
    { id: '1080p-mp4', label: 'Full HD 1080p (Video + Sound)', type: 'video', quality: '1080p', isPro: false },
    { id: '720p-mp4', label: 'HD 720p (Video + Sound Fast)', type: 'video', quality: '720p', isPro: false },
    { id: '480p-mp4', label: 'SD 480p (Data Saver + Sound)', type: 'video', quality: '480p', isPro: false },
    { id: 'best-audio-mp3', label: 'Lossless MP3 Audio (320 kbps)', type: 'audio', quality: '320k', isPro: false },
    { id: 'audio-m4a', label: 'High Quality AAC / M4A Audio', type: 'audio', quality: 'AAC', isPro: false },
    { id: 'audio-wav', label: 'Uncompressed WAV (Master Studio)', type: 'audio', quality: 'WAV', isPro: true },
  ];

  const handleSelectPlatform = (platformName: string) => {
    const sampleUrls: Record<string, string> = {
      'YouTube': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'Instagram': 'https://www.instagram.com/reel/',
      'Threads': 'https://www.threads.net/',
      'TikTok': 'https://www.tiktok.com/@tiktok/video/',
      'Twitter / X': 'https://x.com/',
      'Facebook': 'https://www.facebook.com/watch/',
      'Pinterest': 'https://www.pinterest.com/pin/',
      'SoundCloud': 'https://soundcloud.com/',
      'Vimeo': 'https://vimeo.com/',
    };
    if (sampleUrls[platformName] && !url) {
      setUrl(sampleUrls[platformName]);
      toast(`Paste your exact ${platformName} link here!`);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto w-full">
      {/* Hero Header */}
      <div className="text-center space-y-2.5 px-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3.5 py-1 text-xs font-bold text-brand-600 dark:text-brand-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Universal Social Media & Video Downloader</span>
        </div>
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Download High Quality <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">Videos & Audio</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Paste any link from YouTube, Instagram Reels & Stories, TikTok (No Watermark), Twitter/X, Facebook HD, Pinterest or SoundCloud.
        </p>

        {/* Supported Platform Badges with Click-to-paste */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 px-1">
          {['YouTube', 'Instagram', 'TikTok', 'Twitter / X', 'Facebook', 'Pinterest', 'SoundCloud', 'Vimeo', 'Threads', 'Reddit'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSelectPlatform(p)}
              className="hover:scale-105 transition-transform"
            >
              <PlatformBadge platform={p} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {/* Free Plan Limit Notice Bar */}
      {!isPro && quota && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-indigo-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Free Guest Access:</strong> You have <strong>{quota.remainingToday} / {quota.dailyLimit}</strong> free downloads remaining today.
            </span>
          </div>
          <button
            onClick={() => openAuthModal('register')}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-colors shrink-0 shadow-sm flex items-center justify-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5" /> Unlock Unlimited (100% Free)
          </button>
        </div>
      )}

      {/* Main Search / URL Input Box */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 p-2 shadow-lg dark:shadow-2xl backdrop-blur-xl transition-all w-full">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
          <div className="relative flex-1 w-full flex items-center">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchInfo()}
              placeholder="Paste social media video or audio link here..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-3 sm:py-3.5 pl-10 sm:pl-11 pr-16 sm:pr-20 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner"
            />
            {url && (
              <button
                onClick={() => {
                  setUrl('');
                  setVideoInfo(null);
                  setProgress(null);
                  setDownloadedFile(null);
                }}
                className="absolute right-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-1 rounded-md bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => handleFetchInfo()}
            disabled={isLoadingInfo || !url.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {isLoadingInfo ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <span>Fetch Info</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-red-700 dark:text-red-300">Extraction Notice</p>
            <p className="text-xs text-red-600/90 dark:text-red-400/90 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingInfo && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 animate-pulse space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-36 w-full sm:w-60 rounded-xl bg-slate-200 dark:bg-white/5" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-white/5" />
              <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-white/5" />
            </div>
          </div>
        </div>
      )}

      {/* Video Details Card & Format Selector */}
      {videoInfo && !isLoadingInfo && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-6">
          {/* Video Metadata Header */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail Preview with Play overlay */}
            <div className="relative group shrink-0 w-full md:w-72 h-44 sm:h-48 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10">
              {videoInfo.thumbnail ? (
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <Film className="h-12 w-12" />
                </div>
              )}
              {/* Duration Tag */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-xs font-mono font-medium text-white backdrop-blur-md">
                <Clock className="h-3 w-3 text-brand-400" />
                <span>{videoInfo.durationFormatted}</span>
              </div>
              {/* Platform badge overlay */}
              <div className="absolute top-2 left-2">
                <PlatformBadge platform={videoInfo.platform} size="sm" />
              </div>
            </div>

            {/* Video Details */}
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {videoInfo.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {videoInfo.uploader && (
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <User className="h-3.5 w-3.5 text-brand-500" />
                      {videoInfo.uploader}
                    </span>
                  )}
                  {videoInfo.viewCount && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {videoInfo.viewCount.toLocaleString()} views
                    </span>
                  )}
                </div>
                {videoInfo.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {videoInfo.description}
                  </p>
                )}
              </div>

              {/* Format selection header */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Select Download Format</span>
                  <span className="text-[11px] text-brand-500 font-semibold lowercase">All resolutions available</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {formatOptions.map((opt) => {
                    const isSelected = selectedPreset === opt.id;
                    const Icon = opt.type === 'audio' ? Music : Film;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedPreset(opt.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300 shadow-sm ring-1 ring-brand-500/30'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-brand-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`} />
                          <span className="text-xs font-semibold">{opt.label}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Download Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-white/5">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Direct high-speed multi-threaded download engine</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleStartDownload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-indigo-500 transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Start Download</span>
              </button>
            </div>
          </div>

          {/* Progress Bar & Status */}
          {progress && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="capitalize flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                  {progress.status}...
                </span>
                <span>{progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Speed: {progress.speed || '--'}</span>
                <span>ETA: {progress.eta || '--'}</span>
              </div>
            </div>
          )}

          {/* Download Completed Card with Direct Phone/PC Save & QR Code */}
          {downloadedFile && (
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold truncate max-w-sm sm:max-w-md">
                      {downloadedFile.filename}
                    </p>
                    <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                      Saved to device & ready to share!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/20">
                {/* Save to Device Button */}
                <a
                  href={downloadedFile.url}
                  download={downloadedFile.filename}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>⬇️ Save to Phone / PC</span>
                </a>

                {/* QR Code Phone Transfer */}
                <button
                  type="button"
                  onClick={() => setQrModalUrl(`${window.location.origin}${downloadedFile.url}`)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold border border-slate-200 dark:border-white/10 transition-all"
                  title="Scan with mobile camera to download on phone"
                >
                  <QrCode className="h-4 w-4 text-brand-500" />
                  <span>📱 Download to Phone (QR)</span>
                </button>

                {/* Desktop Open Folder */}
                <button
                  onClick={handleOpenFolder}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold border border-slate-200 dark:border-white/10 transition-all"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                  <span>Folder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Code Modal for Phone Transfer */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-brand-500" />
                <span>Scan with Phone Camera</span>
              </h3>
              <button
                onClick={() => setQrModalUrl(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Point your smartphone camera at this QR code to download the file directly to your phone storage!
            </p>

            <div className="flex justify-center p-4 bg-white rounded-2xl shadow-inner border border-slate-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModalUrl)}`}
                alt="Download QR Code"
                className="w-48 h-48 rounded-xl"
              />
            </div>

            <button
              onClick={() => setQrModalUrl(null)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* SEO Rich Landing Section (Google Rank Optimization) */}
      <SeoContentSection />
    </div>
  );
};

