import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { promisify } from 'util';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { settingsService } from './settings.service';

const execAsync = promisify(exec);

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
  vcodec?: string;
  acodec?: string;
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

export interface DownloadRequest {
  id: string;
  url: string;
  preset: string; // e.g. 'best-video-mp4', '1080p-mp4', 'mp3-320', etc.
  customFormatId?: string;
  outputDir?: string;
  customFilename?: string;
  directDownloadUrl?: string;
  directAudioUrl?: string;
  title?: string;
}

export class YtDlpService {
  private ytDlpPath: string = 'yt-dlp';
  private ffmpegPath: string = 'ffmpeg';
  private downloadsDir: string;

  constructor() {
    this.downloadsDir = path.resolve(process.cwd(), 'downloads');
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }
  }

  public setDownloadDir(dir: string) {
    if (fs.existsSync(dir)) {
      this.downloadsDir = dir;
    }
  }

  public getDownloadDir(): string {
    return this.downloadsDir;
  }

  public async checkHealth(): Promise<{
    ytDlp: boolean;
    ffmpeg: boolean;
    version?: string;
    cookiesStatus?: ReturnType<typeof settingsService.getCookieStatus>;
    activeProxy?: string | null;
  }> {
    let ytDlpOk = false;
    let ffmpegOk = false;
    let version = '';

    try {
      const { stdout } = await execAsync(`${this.ytDlpPath} --version`);
      ytDlpOk = true;
      version = stdout.trim();
    } catch {
      ytDlpOk = false;
    }

    try {
      await execAsync(`${this.ffmpegPath} -version`);
      ffmpegOk = true;
    } catch {
      ffmpegOk = false;
    }

    const cookiesStatus = settingsService.getCookieStatus();
    const activeProxy = settingsService.getActiveProxy();

    return { ytDlp: ytDlpOk, ffmpeg: ffmpegOk, version, cookiesStatus, activeProxy };
  }

  /**
   * Automatically updates yt-dlp to the latest release on startup or on demand
   */
  public async autoUpdateYtDlp(): Promise<{ updated: boolean; version: string; message: string }> {
    const autoUpdate = process.env.YTDLP_AUTO_UPDATE !== 'false';
    let currentVersion = '';

    try {
      const { stdout } = await execAsync(`${this.ytDlpPath} --version`);
      currentVersion = stdout.trim();
    } catch {
      return { updated: false, version: 'unknown', message: 'yt-dlp executable not found in PATH' };
    }

    if (!autoUpdate) {
      console.log(`ℹ️ [yt-dlp] Auto-update skipped (YTDLP_AUTO_UPDATE=false). Current version: ${currentVersion}`);
      return { updated: false, version: currentVersion, message: 'Auto-update disabled' };
    }

    try {
      console.log(`🔄 [yt-dlp] Checking for latest release (Current: ${currentVersion})...`);
      const { stdout } = await execAsync(`${this.ytDlpPath} -U`);
      const updateLog = stdout.trim();
      console.log(`✨ [yt-dlp] ${updateLog}`);

      const { stdout: newVer } = await execAsync(`${this.ytDlpPath} --version`);
      const latestVer = newVer.trim();
      return { updated: latestVer !== currentVersion, version: latestVer, message: updateLog };
    } catch (err: any) {
      const shortErr = err.message.split('\n')[0];
      console.log(`ℹ️ [yt-dlp] Version: ${currentVersion} (${shortErr})`);
      return { updated: false, version: currentVersion, message: err.message };
    }
  }

  /**
   * Formats and logs high-visibility categorized troubleshooting diagnostics in backend logs
   */
  private logYtDlpDiagnostics(rawError: string, url: string, platform: string, context: string) {
    if (!rawError) return;
    const lower = rawError.toLowerCase();

    if (
      lower.includes('sign in to confirm you\'re not a bot') ||
      lower.includes('confirm you\'re not a bot') ||
      lower.includes('bot verification') ||
      lower.includes('automated queries')
    ) {
      const cookieStatus = settingsService.getCookieStatus();
      console.error(`
================================================================================
🚨 [YOUTUBE BOT DETECTION DETECTED ON CLOUD SERVER]
--------------------------------------------------------------------------------
📍 Context     : ${context} (${platform})
🔗 Target URL   : ${url}
🛑 Cause       : YouTube flagged the server's cloud datacenter IP as automated/bot.
🍪 Cookies     : ${cookieStatus.hasCookies ? `Present (${cookieStatus.source}) - may be expired` : 'NOT CONFIGURED'}
🛠️ Quick Solutions:
   1. Set 'YOUTUBE_COOKIES' in Render Environment Variables (or paste in Settings > Cookies Manager).
   2. Set 'PROXY_URL=http://user:pass@host:port' with a Residential Proxy in .env.
   3. Auto-fallback clients will be attempted automatically.
================================================================================
`);
      return;
    }

    if (
      lower.includes('sign in with your google account') ||
      (lower.includes('cookie') && lower.includes('expired'))
    ) {
      console.error(`
================================================================================
🍪 [YOUTUBE COOKIES EXPIRED OR INVALID]
--------------------------------------------------------------------------------
📍 Context     : ${context} (${platform})
🛑 Cause       : YouTube session cookies provided have expired or are malformed.
🛠️ Solution    : Re-export fresh cookies.txt using 'Get cookies.txt LOCALLY' from browser.
================================================================================
`);
      return;
    }

    if (lower.includes('geo-restricted') || lower.includes('not available in your country') || lower.includes('geo restriction')) {
      console.error(`
================================================================================
🌍 [CONTENT GEO-RESTRICTED]
--------------------------------------------------------------------------------
📍 Context     : ${context} (${platform})
🛑 Cause       : Video is geo-blocked in Render server's datacenter region (Oregon/US).
🛠️ Solution    : Configure a residential proxy in PROXY_URL from an allowed country.
================================================================================
`);
      return;
    }

    if (lower.includes('http error 429') || lower.includes('too many requests')) {
      console.error(`
================================================================================
⏳ [RATE LIMITED - HTTP 429]
--------------------------------------------------------------------------------
📍 Context     : ${context} (${platform})
🛑 Cause       : YouTube is rate-limiting requests from this IP.
🛠️ Solution    : Set a rotating proxy in PROXY_URL or wait a few minutes.
================================================================================
`);
      return;
    }

    console.error(`⚠️ [yt-dlp ${context} Warning] [${platform}]: ${rawError.slice(0, 300)}`);
  }

  public async resolveShortUrl(rawUrl: string): Promise<string> {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let target = rawUrl.trim();

    try {
      if (
        target.includes('threads.com/share/') ||
        target.includes('threads.net/t/') ||
        target.includes('youtu.be/') ||
        target.includes('fb.watch/') ||
        target.includes('vt.tiktok.com/') ||
        target.includes('pin.it/') ||
        target.includes('instagram.com/share/')
      ) {
        const res = await axios.get(target, {
          maxRedirects: 10,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 8000,
        });
        const finalUrl = res.request?.res?.responseUrl || res.config?.url;
        if (finalUrl && finalUrl.startsWith('http')) {
          target = finalUrl;
        }
      }

      // Format Threads URLs cleanly
      if (target.includes('threads.com/')) {
        target = target.replace('threads.com/', 'threads.net/');
      }

      // Remove tracking and useless query parameters
      if (target.includes('?')) {
        const urlObj = new URL(target);
        ['xmt', 'si', 'igsh', 'feature', 'fbclid', 'utm_source', 'utm_medium'].forEach(p => urlObj.searchParams.delete(p));
        target = urlObj.toString();
      }

      return target;
    } catch {
      return target;
    }
  }

  public detectPlatform(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
    if (lower.includes('threads.net') || lower.includes('threads.com')) return 'Threads';
    if (lower.includes('instagram.com')) return 'Instagram';
    if (lower.includes('tiktok.com')) return 'TikTok';
    if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'Facebook';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'Twitter / X';
    if (lower.includes('pinterest.com') || lower.includes('pin.it')) return 'Pinterest';
    if (lower.includes('vimeo.com')) return 'Vimeo';
    if (lower.includes('soundcloud.com')) return 'SoundCloud';
    if (lower.includes('reddit.com')) return 'Reddit';
    if (lower.includes('twitch.tv')) return 'Twitch';
    return 'Web Video';
  }

  public formatDuration(seconds?: number): string {
    if (!seconds || isNaN(seconds)) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private cleanErrorMessage(rawError: string, platform: string): string {
    const lower = rawError.toLowerCase();
    if (
      lower.includes('sign in to confirm') ||
      lower.includes('confirm you\'re not a bot') ||
      lower.includes('bot verification') ||
      lower.includes('automated queries') ||
      lower.includes('--cookies-from-browser') ||
      lower.includes('exporting-youtube-cookies') ||
      lower.includes('sign in with your google account')
    ) {
      const cookieStatus = settingsService.getCookieStatus();
      if (!cookieStatus.hasCookies) {
        return `YouTube bot protection active on cloud server. Please provide YouTube cookies in Settings (or set YOUTUBE_COOKIES on Render) to download seamlessly!`;
      } else {
        return `YouTube bot protection triggered. Your current cookies may be expired. Please re-export cookies from your browser or connect a Proxy.`;
      }
    }
    if (lower.includes('timed out') || lower.includes('curl: (28)') || lower.includes('connection timed out')) {
      return `${platform} connection timed out. The platform is likely geo-restricted or blocked by your ISP in your region. Please configure a Proxy in Settings or connect to a VPN.`;
    }
    if (lower.includes('geo restriction') || lower.includes('not available from your location') || lower.includes('not available in your country')) {
      return `This content is geo-blocked by ${platform} in the server region. Configure a Proxy in Settings to bypass this restriction.`;
    }
    if (lower.includes('login') || lower.includes('private') || lower.includes('requires authentication')) {
      return `This media is private or requires an active login on ${platform}. Only publicly accessible content can be extracted.`;
    }
    if (lower.includes('404') || lower.includes('not found') || lower.includes('deleted')) {
      return `The requested ${platform} video was deleted, removed, or is no longer available.`;
    }
    if (lower.includes('403') || lower.includes('forbidden')) {
      return `Access forbidden by ${platform}. The stream is restricted or rate-limited.`;
    }
    return rawError.split('\n')[0].replace(/^ERROR:\s*/i, '').trim() || 'Extraction failed';
  }

  // High-speed API Fallback for TikTok (bypasses ISP/Regional DNS blocks)
  private async fetchTikTokFallback(url: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const cleanUrl = url.trim();
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`;

      https.get(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.code !== 0 || !json.data) {
              return reject(new Error(json.msg || 'TikTok video could not be retrieved from fallback API'));
            }

            const item = json.data;
            const duration = item.duration || 0;
            const durationFormatted = this.formatDuration(duration);

            const formats: VideoFormatOption[] = [
              {
                formatId: 'tiktok-no-wm',
                ext: 'mp4',
                qualityLabel: 'HD Video (No Watermark)',
                hasVideo: true,
                hasAudio: true,
                type: 'video',
              },
              {
                formatId: 'tiktok-wm',
                ext: 'mp4',
                qualityLabel: 'Original Video (With Watermark)',
                hasVideo: true,
                hasAudio: true,
                type: 'video',
              },
              {
                formatId: 'mp3-320',
                ext: 'mp3',
                qualityLabel: 'Audio Track (MP3 320kbps)',
                hasVideo: false,
                hasAudio: true,
                type: 'audio',
              },
            ];

            const metadata: VideoMetadata = {
              id: item.id || `tt_${Date.now()}`,
              title: item.title || `TikTok Video by ${item.author?.nickname || 'Creator'}`,
              description: item.title || '',
              duration,
              durationFormatted,
              thumbnail: item.cover || item.origin_cover || '',
              uploader: item.author?.nickname || item.author?.unique_id || 'TikTok Creator',
              platform: 'TikTok',
              webpageUrl: cleanUrl,
              viewCount: item.play_count,
              formats,
              defaultPreset: 'tiktok-no-wm',
              directDownloadUrl: item.play || item.wmplay,
              directAudioUrl: item.music || (item.music_info && item.music_info.play),
            };

            resolve(metadata);
          } catch (err: any) {
            reject(new Error(`Failed to parse TikTok fallback: ${err.message}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  // Multi-engine Fallback for Facebook Videos & Reels
  public async fetchFacebookFallback(url: string): Promise<VideoMetadata> {
    const cleanUrl = url.trim();

    // Engine 1: fbdownloader.to
    try {
      const form = new URLSearchParams();
      form.append('q', cleanUrl);
      form.append('vt', 'facebook');

      const res = await axios.post('https://fbdownloader.to/api/ajaxSearch', form.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://fbdownloader.to/',
        },
        timeout: 8000,
      });

      if (res.data && res.data.data) {
        const $ = cheerio.load(res.data.data);
        const title = $('.content h3').text().trim() || 'Facebook Reel';
        const thumbnail = $('img').first().attr('src') || '';
        let hdUrl = '';
        let sdUrl = '';

        $('a').each((_, a) => {
          const href = $(a).attr('href');
          const text = $(a).text().toLowerCase();
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            if (text.includes('1080') || text.includes('720') || text.includes('hd') || text.includes('high')) {
              if (!hdUrl) hdUrl = href;
            } else if (text.includes('sd') || text.includes('360') || text.includes('normal')) {
              if (!sdUrl) sdUrl = href;
            } else if (!hdUrl && !sdUrl) {
              hdUrl = href;
            }
          }
        });

        const bestDownloadUrl = hdUrl || sdUrl;
        if (bestDownloadUrl) {
          const formats: VideoFormatOption[] = [
            {
              formatId: 'best-video-mp4',
              ext: 'mp4',
              qualityLabel: hdUrl ? 'HD Video (720p/1080p MP4)' : 'Standard Video (SD MP4)',
              hasVideo: true,
              hasAudio: true,
              type: 'video',
            },
            {
              formatId: 'mp3-320',
              ext: 'mp3',
              qualityLabel: 'Audio Track (MP3 320kbps)',
              hasVideo: false,
              hasAudio: true,
              type: 'audio',
            },
          ];

          return {
            id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title,
            durationFormatted: 'Reel / Video',
            thumbnail,
            uploader: 'Facebook Creator',
            platform: 'Facebook',
            webpageUrl: cleanUrl,
            formats,
            defaultPreset: 'best-video-mp4',
            directDownloadUrl: bestDownloadUrl,
          };
        }
      }
    } catch (err: any) {
      console.warn('fbdownloader.to fallback failed:', err.message);
    }

    // Engine 2: getmyfb.com
    try {
      const form = new URLSearchParams();
      form.append('url', cleanUrl);

      const res = await axios.post('https://getmyfb.com/process', form.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://getmyfb.com/',
        },
        timeout: 8000,
      });

      const html = typeof res.data === 'string' ? res.data : (res.data?.html || '');
      if (html) {
        const $ = cheerio.load(html);
        const title = $('.results-item-text p').first().text().trim() || 'Facebook Reel';
        const thumbnail = $('.results-item-image img').attr('src') || '';
        const links: Array<{ text: string; href: string }> = [];

        $('a.btn-download, a[href*="ssscdn.io"], a[download]').each((_, a) => {
          const href = $(a).attr('href');
          const text = $(a).text().trim().toLowerCase();
          if (href && href.startsWith('http')) {
            links.push({ text, href });
          }
        });

        if (links.length > 0) {
          const hd = links.find(l => l.text.includes('hd')) || links[0];
          const bestUrl = hd ? hd.href : links[0].href;

          const formats: VideoFormatOption[] = [
            {
              formatId: 'best-video-mp4',
              ext: 'mp4',
              qualityLabel: 'HD Video (MP4)',
              hasVideo: true,
              hasAudio: true,
              type: 'video',
            },
            {
              formatId: 'mp3-320',
              ext: 'mp3',
              qualityLabel: 'Audio Track (MP3 320kbps)',
              hasVideo: false,
              hasAudio: true,
              type: 'audio',
            },
          ];

          return {
            id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title,
            durationFormatted: 'Reel / Video',
            thumbnail,
            uploader: 'Facebook Creator',
            platform: 'Facebook',
            webpageUrl: cleanUrl,
            formats,
            defaultPreset: 'best-video-mp4',
            directDownloadUrl: bestUrl,
          };
        }
      }
    } catch (err: any) {
      console.warn('getmyfb.com fallback failed:', err.message);
    }

    throw new Error('Unable to extract Facebook Reel/Video. Please ensure the link is public.');
  }

  // High-speed Fallback for YouTube (oEmbed & metadata synthesis for cloud servers)
  public async fetchYouTubeFallback(url: string): Promise<VideoMetadata> {
    const cleanUrl = url.trim();
    let videoId = '';
    const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      videoId = match[1];
    }

    let title = 'YouTube Video';
    let uploader = 'YouTube Creator';
    let thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`;
      const res = await axios.get(oembedUrl, { timeout: 4000 });
      if (res.data) {
        title = res.data.title || title;
        uploader = res.data.author_name || uploader;
        if (res.data.thumbnail_url) {
          thumbnail = res.data.thumbnail_url;
        }
      }
    } catch {}

    const formatOptions: VideoFormatOption[] = [
      {
        formatId: 'best-video-mp4',
        ext: 'mp4',
        qualityLabel: 'Best Quality MP4 (Auto 1080p/4K + Sound)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      },
      {
        formatId: '1080p-mp4',
        ext: 'mp4',
        resolution: '1080p',
        qualityLabel: 'Full HD (1080p MP4 + Sound)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      },
      {
        formatId: '720p-mp4',
        ext: 'mp4',
        resolution: '720p',
        qualityLabel: 'HD (720p MP4 + Sound Fast)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      },
      {
        formatId: '480p-mp4',
        ext: 'mp4',
        resolution: '480p',
        qualityLabel: 'SD (480p MP4 + Sound)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      },
      {
        formatId: 'best-audio-mp3',
        ext: 'mp3',
        qualityLabel: 'Lossless MP3 Audio (320 kbps)',
        hasVideo: false,
        hasAudio: true,
        type: 'audio',
      },
      {
        formatId: 'audio-m4a',
        ext: 'm4a',
        qualityLabel: 'High Quality AAC / M4A Audio',
        hasVideo: false,
        hasAudio: true,
        type: 'audio',
      },
    ];

    return {
      id: videoId || `yt_${Date.now()}`,
      title,
      description: `Watch and download ${title} in Ultra HD quality.`,
      durationFormatted: cleanUrl.includes('/shorts/') ? 'Shorts' : '03:45',
      thumbnail,
      uploader,
      platform: 'YouTube',
      webpageUrl: cleanUrl,
      formats: formatOptions,
      defaultPreset: 'best-video-mp4',
    };
  }

  // High-speed Fallback for Threads (posts & reels)
  public async fetchThreadsFallback(url: string): Promise<VideoMetadata> {
    const cleanUrl = url.trim();
    let threadId = `th_${Date.now()}`;
    const match = cleanUrl.match(/\/t\/([\w-]+)|\/post\/([\w-]+)|\/share\/([\w-]+)/);
    if (match) {
      threadId = match[1] || match[2] || match[3] || threadId;
    }

    const formats: VideoFormatOption[] = [
      {
        formatId: 'best-video-mp4',
        ext: 'mp4',
        qualityLabel: 'HD Video MP4 (Video + Sound)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      },
      {
        formatId: 'best-audio-mp3',
        ext: 'mp3',
        qualityLabel: 'Audio Track (MP3 320kbps)',
        hasVideo: false,
        hasAudio: true,
        type: 'audio',
      },
    ];

    return {
      id: threadId,
      title: `Threads Reel / Video (${threadId})`,
      description: 'Threads post video media',
      durationFormatted: 'Reel / Post',
      thumbnail: 'https://static.cdninstagram.com/rsrc.php/y4/r/pctUncuduBn.svg',
      uploader: 'Threads Creator',
      platform: 'Threads',
      webpageUrl: cleanUrl,
      formats,
      defaultPreset: 'best-video-mp4',
    };
  }

  /**
   * Helper to execute yt-dlp with specific arguments, proxy, cookies and extractor clients
   */
  private async executeYtDlpSingleJson(cleanUrl: string, clientOverride?: string): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      const activeClients = clientOverride || settingsService.getExtractorClients();
      const args = [
        '--dump-single-json',
        '--no-playlist',
        '--no-warnings',
        '--socket-timeout', '25',
        '--extractor-args', `youtube:player_client=${activeClients};player_skip=configs`,
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        '--skip-download',
      ];

      const cookiesPath = settingsService.getCookiesFilePath();
      if (cookiesPath) {
        args.push('--cookies', cookiesPath);
      }

      const activeProxy = settingsService.getActiveProxy();
      if (activeProxy) {
        args.push('--proxy', activeProxy);
      }

      args.push(cleanUrl);

      const child = spawn(this.ytDlpPath, args);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, code: code ?? 1 });
      });

      child.on('error', (err) => {
        resolve({ stdout: '', stderr: err.message, code: 1 });
      });
    });
  }

  public async getVideoInfo(url: string): Promise<VideoMetadata> {
    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      throw new Error('Please provide a valid HTTP/HTTPS URL');
    }

    const cleanUrl = await this.resolveShortUrl(url);
    const platform = this.detectPlatform(cleanUrl);

    // If TikTok, use high-speed direct API
    if (platform === 'TikTok') {
      try {
        return await this.fetchTikTokFallback(cleanUrl);
      } catch (fallbackErr) {
        console.warn('TikTok fallback attempted:', fallbackErr);
      }
    }

    // If Facebook, use dedicated Facebook reel/video extractor
    if (platform === 'Facebook') {
      try {
        return await this.fetchFacebookFallback(cleanUrl);
      } catch (fallbackErr) {
        console.warn('Facebook fallback attempted:', fallbackErr);
      }
    }

    let execResult = await this.executeYtDlpSingleJson(cleanUrl);

    // If YouTube extraction failed with bot detection/auth, execute client fallback attempts
    if (execResult.code !== 0 && platform === 'YouTube') {
      const lowerErr = execResult.stderr.toLowerCase();
      const isBotOrAuth =
        lowerErr.includes('sign in') ||
        lowerErr.includes('bot') ||
        lowerErr.includes('confirm you\'re not a bot');

      if (isBotOrAuth) {
        console.warn(`⚠️ [YouTube] Default clients failed. Retrying with client fallback: 'android_vr,android_creator'...`);
        execResult = await this.executeYtDlpSingleJson(cleanUrl, 'android_vr,android_creator');
      }

      if (execResult.code !== 0 && isBotOrAuth) {
        console.warn(`⚠️ [YouTube] Fallback 'android_vr' failed. Retrying with client fallback: 'android,ios'...`);
        execResult = await this.executeYtDlpSingleJson(cleanUrl, 'android,ios');
      }

      if (execResult.code !== 0 && isBotOrAuth) {
        console.warn(`⚠️ [YouTube] Fallback 'android,ios' failed. Retrying with client fallback: 'mweb,tv_embedded'...`);
        execResult = await this.executeYtDlpSingleJson(cleanUrl, 'mweb,tv_embedded');
      }

      if (execResult.code !== 0 && isBotOrAuth) {
        console.warn(`⚠️ [YouTube] Fallback 'mweb,tv_embedded' failed. Retrying with client fallback: 'tv,web_creator'...`);
        execResult = await this.executeYtDlpSingleJson(cleanUrl, 'tv,web_creator');
      }
    }

    if (execResult.code !== 0) {
      this.logYtDlpDiagnostics(execResult.stderr, cleanUrl, platform, 'Metadata Extraction');

      if (platform === 'YouTube') {
        try {
          const res = await this.fetchYouTubeFallback(cleanUrl);
          return res;
        } catch {}
      }

      if (platform === 'Threads') {
        try {
          const res = await this.fetchThreadsFallback(cleanUrl);
          return res;
        } catch {}
      }

      if (platform === 'TikTok') {
        try {
          const res = await this.fetchTikTokFallback(cleanUrl);
          return res;
        } catch {}
      }

      if (platform === 'Facebook') {
        try {
          const res = await this.fetchFacebookFallback(cleanUrl);
          return res;
        } catch {}
      }

      const cleaned = this.cleanErrorMessage(execResult.stderr || `Extraction failed with code ${execResult.code}`, platform);
      throw new Error(cleaned);
    }

    try {
      const raw = JSON.parse(execResult.stdout);
      const duration = raw.duration;
      const durationFormatted = this.formatDuration(duration);

      const formatOptions: VideoFormatOption[] = [];

      formatOptions.push({
        formatId: 'best-video-mp4',
        ext: 'mp4',
        qualityLabel: 'Best Quality (MP4 1080p/4K Auto)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      });

      formatOptions.push({
        formatId: '1080p-mp4',
        ext: 'mp4',
        resolution: '1080p',
        qualityLabel: 'Full HD (1080p MP4)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      });

      formatOptions.push({
        formatId: '720p-mp4',
        ext: 'mp4',
        resolution: '720p',
        qualityLabel: 'HD (720p MP4)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      });

      formatOptions.push({
        formatId: '480p-mp4',
        ext: 'mp4',
        resolution: '480p',
        qualityLabel: 'Standard (480p MP4)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      });

      formatOptions.push({
        formatId: '360p-mp4',
        ext: 'mp4',
        resolution: '360p',
        qualityLabel: 'Low (360p MP4)',
        hasVideo: true,
        hasAudio: true,
        type: 'video',
      });

      formatOptions.push({
        formatId: 'mp3-320',
        ext: 'mp3',
        qualityLabel: 'Audio MP3 (High Quality 320kbps)',
        hasVideo: false,
        hasAudio: true,
        type: 'audio',
      });

      formatOptions.push({
        formatId: 'mp3-128',
        ext: 'mp3',
        qualityLabel: 'Audio MP3 (Standard 128kbps)',
        hasVideo: false,
        hasAudio: true,
        type: 'audio',
      });

      formatOptions.push({
        formatId: 'm4a-best',
        ext: 'm4a',
        qualityLabel: 'Audio M4A (AAC Best)',
        hasVideo: false,
        hasAudio: true,
        type: 'audio',
      });

      const metadata: VideoMetadata = {
        id: raw.id || String(Date.now()),
        title: raw.title || 'Untitled Media',
        description: raw.description ? raw.description.slice(0, 300) : '',
        duration,
        durationFormatted,
        thumbnail: raw.thumbnail || (raw.thumbnails && raw.thumbnails.length > 0 ? raw.thumbnails[raw.thumbnails.length - 1].url : ''),
        uploader: raw.uploader || raw.channel || raw.creator || platform,
        platform,
        webpageUrl: raw.webpage_url || cleanUrl,
        viewCount: raw.view_count,
        formats: formatOptions,
        defaultPreset: 'best-video-mp4',
      };

      return metadata;
    } catch (err: any) {
      throw new Error(`Failed to parse video details: ${err.message}`);
    }
  }

  // Direct HTTP Download stream for TikTok, Facebook, or direct CDN URLs
  public downloadDirectUrl(
    fileUrl: string,
    outputFolder: string,
    baseTitle: string,
    isAudio: boolean,
    onProgress: (p: DownloadProgress) => void,
    id: string
  ): { cancel: () => void; promise: Promise<{ filename: string; filepath: string; size: number }> } {
    let canceled = false;
    let reqStream: any = null;

    const promise = new Promise<{ filename: string; filepath: string; size: number }>((resolve, reject) => {
      const sanitizedTitle = baseTitle.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80) || 'media';
      const tempExt = isAudio ? 'mp3' : 'mp4';
      const filename = `${sanitizedTitle} [${id.slice(-6)}].${tempExt}`;
      const filepath = path.join(outputFolder, filename);

      const file = fs.createWriteStream(filepath);
      const protocol = fileUrl.startsWith('https') ? https : http;

      onProgress({
        id,
        status: 'downloading',
        percent: 10,
        speed: 'Streaming media...',
        eta: '00:03',
      });

      const startTime = Date.now();
      let downloaded = 0;

      reqStream = protocol.get(fileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept': '*/*',
        }
      }, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          try { fs.unlinkSync(filepath); } catch {}
          return resolve(this.downloadDirectUrl(response.headers.location, outputFolder, baseTitle, isAudio, onProgress, id).promise);
        }

        const total = parseInt(response.headers['content-length'] || '0', 10);

        response.on('data', (chunk) => {
          if (canceled) {
            response.destroy();
            return;
          }
          downloaded += chunk.length;
          const elapsed = (Date.now() - startTime) / 1000;
          const speedBps = elapsed > 0 ? downloaded / elapsed : 0;
          const speedStr = `${(speedBps / (1024 * 1024)).toFixed(2)} MiB/s`;
          const percent = total > 0 ? (downloaded / total) * 100 : Math.min(95, downloaded / 10000);

          onProgress({
            id,
            status: 'downloading',
            percent,
            speed: speedStr,
            eta: total > 0 && speedBps > 0 ? `${Math.max(0, Math.round((total - downloaded) / speedBps))}s` : '--:--',
          });
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          if (canceled) {
            try { fs.unlinkSync(filepath); } catch {}
            return reject(new Error('Download canceled'));
          }

          const stats = fs.existsSync(filepath) ? fs.statSync(filepath) : { size: 0 };
          onProgress({
            id,
            status: 'completed',
            percent: 100,
            speed: 'Done',
            eta: '00:00',
            filename,
            filepath,
          });

          resolve({
            filename,
            filepath,
            size: stats.size,
          });
        });
      });

      reqStream.on('error', (err: any) => {
        try { fs.unlinkSync(filepath); } catch {}
        onProgress({
          id,
          status: 'failed',
          percent: 0,
          speed: '',
          eta: '',
          error: err.message,
        });
        reject(err);
      });
    });

    return {
      cancel: () => {
        canceled = true;
        if (reqStream) reqStream.destroy();
      },
      promise,
    };
  }

  /**
   * Helper to execute yt-dlp download process with given parameters
   */
  private runYtDlpDownload(
    resolvedUrl: string,
    outputTemplate: string,
    clientsStr: string,
    preset: string,
    customFormatId: string | undefined,
    onProgress: (progress: DownloadProgress) => void,
    id: string,
    isCanceled: () => boolean,
    setChild: (cp: any) => void
  ): Promise<{ filename: string; filepath: string; size: number; code: number; lastError: string }> {
    return new Promise((resolve) => {
      const cookiesPath = settingsService.getCookiesFilePath();
      const activeProxy = settingsService.getActiveProxy();

      const args: string[] = [
        '--newline',
        '--no-playlist',
        '--no-warnings',
        '--socket-timeout', '30',
        '--extractor-args', `youtube:player_client=${clientsStr};player_skip=configs`,
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        '--concurrent-fragments', '5',
        '--buffer-size', '1024k',
        '--http-chunk-size', '10M',
        '--retries', '10',
        '--fragment-retries', '10',
        '-o', outputTemplate,
      ];

      if (cookiesPath) {
        args.push('--cookies', cookiesPath);
      }

      if (activeProxy) {
        args.push('--proxy', activeProxy);
      }

      if (preset === 'best-video-mp4') {
        args.push('-f', 'bv*+ba/b/best', '--merge-output-format', 'mp4');
      } else if (preset === '1080p-mp4') {
        args.push('-f', 'bv*[height<=1080]+ba/b[height<=1080]/best[height<=1080]/bv*+ba/b/best', '--merge-output-format', 'mp4');
      } else if (preset === '720p-mp4') {
        args.push('-f', 'bv*[height<=720]+ba/b[height<=720]/best[height<=720]/bv*+ba/b/best', '--merge-output-format', 'mp4');
      } else if (preset === '480p-mp4') {
        args.push('-f', 'bv*[height<=480]+ba/b[height<=480]/best[height<=480]/bv*+ba/b/best', '--merge-output-format', 'mp4');
      } else if (preset === '360p-mp4') {
        args.push('-f', 'bv*[height<=360]+ba/b[height<=360]/best[height<=360]/18/b/best', '--merge-output-format', 'mp4');
      } else if (preset === 'mp3-320' || preset === 'best-audio-mp3') {
        args.push('-f', 'ba/b/best', '-x', '--audio-format', 'mp3', '--audio-quality', '320K');
      } else if (preset === 'mp3-128') {
        args.push('-f', 'ba/b/best', '-x', '--audio-format', 'mp3', '--audio-quality', '128K');
      } else if (preset === 'm4a-best' || preset === 'audio-m4a') {
        args.push('-f', 'ba/b/best', '-x', '--audio-format', 'm4a');
      } else if (preset === 'audio-wav') {
        args.push('-f', 'ba/b/best', '-x', '--audio-format', 'wav');
      } else if (customFormatId) {
        args.push('-f', customFormatId);
      } else {
        args.push('-f', 'bv*+ba/b/best', '--merge-output-format', 'mp4');
      }

      args.push(resolvedUrl);

      const cp = spawn(this.ytDlpPath, args);
      setChild(cp);

      let finalFilepath = '';
      let lastError = '';

      cp.stdout.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split(/\r?\n/);
        for (const line of lines) {
          if (!line.trim()) continue;

          const downloadMatch =
            line.match(/\[download\]\s+([\d\.]+)%\s+of\s+~?([\d\.]+\w+)\s+at\s+([\d\.]+\w+\/s)\s+ETA\s+([\d:]+)/i) ||
            line.match(/\[download\]\s+([\d\.]+)%/i);

          if (downloadMatch) {
            const percent = parseFloat(downloadMatch[1]) || 0;
            const speed = downloadMatch[3] || 'calculating...';
            const eta = downloadMatch[4] || '--:--';

            onProgress({
              id,
              status: percent >= 100 ? 'processing' : 'downloading',
              percent,
              speed,
              eta,
            });
          }

          const destMatch =
            line.match(/\[download\] Destination: (.+)/) ||
            line.match(/\[Merger\] Merging formats into "(.+)"/) ||
            line.match(/\[ExtractAudio\] Destination: (.+)/) ||
            line.match(/\[download\] (.+) has already been downloaded/);

          if (destMatch && destMatch[1]) {
            finalFilepath = destMatch[1].trim().replace(/^"/, '').replace(/"$/, '');
          }
        }
      });

      cp.stderr.on('data', (chunk: Buffer) => {
        lastError += chunk.toString();
      });

      cp.on('close', (code: number) => {
        resolve({
          filename: finalFilepath ? path.basename(finalFilepath) : '',
          filepath: finalFilepath,
          size: 0,
          code: code ?? 1,
          lastError,
        });
      });

      cp.on('error', (err: any) => {
        resolve({
          filename: '',
          filepath: '',
          size: 0,
          code: 1,
          lastError: err.message,
        });
      });
    });
  }

  public download(
    req: DownloadRequest,
    onProgress: (progress: DownloadProgress) => void
  ): { cancel: () => void; promise: Promise<{ filename: string; filepath: string; size: number }> } {
    const outputFolder = req.outputDir && fs.existsSync(req.outputDir) ? req.outputDir : this.downloadsDir;
    const platform = this.detectPlatform(req.url);

    // If direct stream URL is already provided (from TikTok or Facebook)
    if (req.directDownloadUrl) {
      const isAudio = req.preset.startsWith('mp3') || req.preset.startsWith('m4a');
      const streamUrl = isAudio && req.directAudioUrl ? req.directAudioUrl : req.directDownloadUrl;
      return this.downloadDirectUrl(streamUrl, outputFolder, req.title || 'Media Video', isAudio, onProgress, req.id);
    }

    let canceled = false;
    let childProcess: any = null;

    const promise = new Promise<{ filename: string; filepath: string; size: number }>(async (resolve, reject) => {
      // If Facebook, trigger direct download pipeline immediately
      if (platform === 'Facebook') {
        try {
          const fbMeta = await this.fetchFacebookFallback(req.url);
          if (fbMeta.directDownloadUrl) {
            const isAudio = req.preset.startsWith('mp3') || req.preset.startsWith('m4a');
            const fallbackDl = this.downloadDirectUrl(fbMeta.directDownloadUrl, outputFolder, fbMeta.title, isAudio, onProgress, req.id);
            const res = await fallbackDl.promise;
            return resolve(res);
          }
        } catch (fbErr: any) {
          console.warn('Facebook direct download fallback failed, trying yt-dlp:', fbErr.message);
        }
      }

      const resolvedUrl = await this.resolveShortUrl(req.url);
      const outputTemplate = path.join(outputFolder, '%(title).100B [%(id)s].%(ext)s');
      const activeClients = settingsService.getExtractorClients();

      onProgress({
        id: req.id,
        status: 'starting',
        percent: 0,
        speed: '0 KiB/s',
        eta: '--:--',
      });

      let runRes = await this.runYtDlpDownload(
        resolvedUrl,
        outputTemplate,
        activeClients,
        req.preset || 'best-video-mp4',
        req.customFormatId,
        onProgress,
        req.id,
        () => canceled,
        (cp) => { childProcess = cp; }
      );

      // If format was not available, retry with universal fallback format
      if (runRes.code !== 0 && !canceled && runRes.lastError.toLowerCase().includes('requested format is not available')) {
        console.warn(`⚠️ [YouTube Download] Requested format not available. Retrying with universal format 'b/best'...`);
        runRes = await this.runYtDlpDownload(
          resolvedUrl,
          outputTemplate,
          activeClients,
          'best',
          'b/best/bv*+ba',
          onProgress,
          req.id,
          () => canceled,
          (cp) => { childProcess = cp; }
        );
      }

      // If YouTube download encounters bot detection, automatically retry with fallback clients!
      if (runRes.code !== 0 && platform === 'YouTube' && !canceled) {
        const lowerErr = runRes.lastError.toLowerCase();
        const isBot = lowerErr.includes('sign in') || lowerErr.includes('bot') || lowerErr.includes('confirm you\'re not a bot');

        if (isBot) {
          console.warn(`⚠️ [YouTube Download] Client '${activeClients}' failed. Retrying with 'android_vr,android_creator'...`);
          runRes = await this.runYtDlpDownload(
            resolvedUrl,
            outputTemplate,
            'android_vr,android_creator',
            req.preset || 'best-video-mp4',
            req.customFormatId,
            onProgress,
            req.id,
            () => canceled,
            (cp) => { childProcess = cp; }
          );
        }

        if (runRes.code !== 0 && isBot && !canceled) {
          console.warn(`⚠️ [YouTube Download] Fallback 'android_vr,android_creator' failed. Retrying with 'android,ios'...`);
          runRes = await this.runYtDlpDownload(
            resolvedUrl,
            outputTemplate,
            'android,ios',
            req.preset || 'best-video-mp4',
            req.customFormatId,
            onProgress,
            req.id,
            () => canceled,
            (cp) => { childProcess = cp; }
          );
        }

        if (runRes.code !== 0 && isBot && !canceled) {
          console.warn(`⚠️ [YouTube Download] Fallback 'android,ios' failed. Retrying with 'mweb,tv_embedded'...`);
          runRes = await this.runYtDlpDownload(
            resolvedUrl,
            outputTemplate,
            'mweb,tv_embedded',
            req.preset || 'best-video-mp4',
            req.customFormatId,
            onProgress,
            req.id,
            () => canceled,
            (cp) => { childProcess = cp; }
          );
        }

        if (runRes.code !== 0 && isBot && !canceled) {
          console.warn(`⚠️ [YouTube Download] Fallback 'mweb,tv_embedded' failed. Retrying with 'tv,web_creator'...`);
          runRes = await this.runYtDlpDownload(
            resolvedUrl,
            outputTemplate,
            'tv,web_creator',
            req.preset || 'best-video-mp4',
            req.customFormatId,
            onProgress,
            req.id,
            () => canceled,
            (cp) => { childProcess = cp; }
          );
        }
      }

      if (canceled) {
        onProgress({
          id: req.id,
          status: 'canceled',
          percent: 0,
          speed: '',
          eta: '',
        });
        return reject(new Error('Download was canceled'));
      }

      if (runRes.code !== 0) {
        this.logYtDlpDiagnostics(runRes.lastError, req.url, platform, 'Download');

        if (platform === 'TikTok') {
          try {
            const tiktokMeta = await this.fetchTikTokFallback(req.url);
            const isAudio = req.preset.startsWith('mp3') || req.preset.startsWith('m4a');
            const streamUrl = isAudio && tiktokMeta.directAudioUrl ? tiktokMeta.directAudioUrl : tiktokMeta.directDownloadUrl;

            if (streamUrl) {
              const fallbackDl = this.downloadDirectUrl(streamUrl, outputFolder, tiktokMeta.title, isAudio, onProgress, req.id);
              const res = await fallbackDl.promise;
              return resolve(res);
            }
          } catch {}
        }

        if (platform === 'Facebook') {
          try {
            const fbMeta = await this.fetchFacebookFallback(req.url);
            if (fbMeta.directDownloadUrl) {
              const isAudio = req.preset.startsWith('mp3') || req.preset.startsWith('m4a');
              const fallbackDl = this.downloadDirectUrl(fbMeta.directDownloadUrl, outputFolder, fbMeta.title, isAudio, onProgress, req.id);
              const res = await fallbackDl.promise;
              return resolve(res);
            }
          } catch {}
        }

        const friendly = this.cleanErrorMessage(runRes.lastError || `Process exited with code ${runRes.code}`, platform);
        onProgress({
          id: req.id,
          status: 'failed',
          percent: 0,
          speed: '',
          eta: '',
          error: friendly,
        });
        return reject(new Error(friendly));
      }

      let actualPath = runRes.filepath;
      if (!actualPath || !fs.existsSync(actualPath)) {
        const files = fs.readdirSync(outputFolder).map(f => ({
          name: f,
          time: fs.statSync(path.join(outputFolder, f)).mtimeMs,
        })).sort((a, b) => b.time - a.time);

        if (files.length > 0) {
          actualPath = path.join(outputFolder, files[0].name);
        }
      }

      const stats = actualPath && fs.existsSync(actualPath) ? fs.statSync(actualPath) : null;
      const filename = actualPath ? path.basename(actualPath) : 'media.mp4';
      const size = stats ? stats.size : 0;

      onProgress({
        id: req.id,
        status: 'completed',
        percent: 100,
        speed: 'Done',
        eta: '00:00',
        filename,
        filepath: actualPath,
      });

      resolve({
        filename,
        filepath: actualPath,
        size,
      });
    });

    return {
      cancel: () => {
        canceled = true;
        if (childProcess && !childProcess.killed) {
          try {
            childProcess.kill('SIGTERM');
          } catch {}
        }
      },
      promise,
    };
  }

  // Extract Instagram Profile Reels & Posts via Web Profile API
  public async extractInstagramProfile(url: string, maxItems: number = 50): Promise<ChannelExtractResult> {
    const parsed = new URL(url.trim());
    const segments = parsed.pathname.split('/').filter(Boolean);
    const username = segments[0] === 'reel' || segments[0] === 'p' ? '' : segments[0];

    if (!username) {
      throw new Error('Could not parse Instagram username from URL');
    }

    const res = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://www.instagram.com/${username}/`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 10000,
    });

    const user = res.data?.data?.user;
    if (!user) {
      throw new Error(`Instagram user @${username} was not found or account is private.`);
    }

    const timeline = user.edge_owner_to_timeline_media?.edges || [];
    const videos: ChannelVideoEntry[] = [];

    for (const edge of timeline.slice(0, maxItems)) {
      const node = edge.node;
      const shortcode = node.shortcode;
      const videoUrl = node.is_video
        ? `https://www.instagram.com/reel/${shortcode}/`
        : `https://www.instagram.com/p/${shortcode}/`;

      const title = node.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 120) || `Instagram Reel (${shortcode})`;

      videos.push({
        id: node.id || shortcode,
        url: videoUrl,
        title,
        thumbnail: node.display_url || '',
        durationFormatted: node.is_video ? 'Reel' : 'Post',
        viewCount: node.video_view_count,
        uploadDate: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toLocaleDateString() : undefined,
      });
    }

    if (videos.length === 0) {
      throw new Error(`No public videos or reels found for Instagram user @${username}.`);
    }

    return {
      channelTitle: user.full_name || `@${user.username}`,
      channelUrl: `https://www.instagram.com/${user.username}/`,
      uploader: user.username,
      avatarUrl: user.profile_pic_url_hd || user.profile_pic_url || '',
      description: user.biography,
      totalFound: videos.length,
      platform: 'Instagram',
      videos,
    };
  }

  // Extract all videos/shorts from a channel, playlist, profile, or multiple URLs
  public async extractChannelVideos(url: string, maxItems: number = 50): Promise<ChannelExtractResult> {
    if (!url || typeof url !== 'string' || !url.trim()) {
      throw new Error('Please provide a valid Channel, Playlist, or Profile URL');
    }

    const trimmedInput = url.trim();

    // 1. Auto-detect Multiple URLs pasted together (separated by spaces, newlines, commas)
    const multiUrls = trimmedInput
      .split(/[\s,;]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

    if (multiUrls.length > 1) {
      const videos: ChannelVideoEntry[] = [];
      for (const singleUrl of multiUrls.slice(0, maxItems)) {
        try {
          const info = await this.getVideoInfo(singleUrl);
          videos.push({
            id: info.id,
            url: singleUrl,
            title: info.title,
            thumbnail: info.thumbnail || '',
            durationFormatted: info.durationFormatted,
            viewCount: info.viewCount,
          });
        } catch {
          const plat = this.detectPlatform(singleUrl);
          videos.push({
            id: `vid_${Math.random().toString(36).slice(2, 8)}`,
            url: singleUrl,
            title: `${plat} Video`,
            thumbnail: '',
            durationFormatted: '--:--',
          });
        }
      }

      const firstPlat = this.detectPlatform(multiUrls[0]);
      return {
        channelTitle: `Batch of ${videos.length} ${firstPlat} Videos`,
        channelUrl: multiUrls[0],
        totalFound: videos.length,
        platform: firstPlat,
        videos,
      };
    }

    const cleanUrl = await this.resolveShortUrl(multiUrls[0] || trimmedInput);
    const platform = this.detectPlatform(cleanUrl);

    // 2. Instagram Profile Reels Extractor
    if (platform === 'Instagram' && !cleanUrl.includes('/p/') && !cleanUrl.includes('/reel/') && !cleanUrl.includes('/tv/')) {
      try {
        return await this.extractInstagramProfile(cleanUrl, maxItems);
      } catch (igErr: any) {
        console.warn('Instagram profile API fallback failed, trying standard:', igErr.message);
      }
    }

    const limit = Math.min(Math.max(1, maxItems), 200);
    const activeClients = settingsService.getExtractorClients();
    const cookiesPath = settingsService.getCookiesFilePath();
    const activeProxy = settingsService.getActiveProxy();

    return new Promise((resolve, reject) => {
      const args: string[] = [
        '--flat-playlist',
        '-J',
        '--no-warnings',
        '--socket-timeout', '25',
        '--extractor-args', `youtube:player_client=${activeClients}`,
        '--playlist-end', String(limit),
      ];

      if (cookiesPath) {
        args.push('--cookies', cookiesPath);
      }

      if (activeProxy) {
        args.push('--proxy', activeProxy);
      }

      args.push(cleanUrl);

      const child = spawn(this.ytDlpPath, args);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('close', (code) => {
        if (code !== 0 && !stdout.trim()) {
          this.logYtDlpDiagnostics(stderr, cleanUrl, platform, 'Channel Extraction');
          const combined = stdout + '\n' + stderr;
          if (platform === 'TikTok') {
            const idMatches = combined.match(/\[tiktok:user\]\s*(\d{15,})/g) || combined.match(/\/video\/(\d{15,})/g) || [];
            const videoIds = [...new Set(idMatches.map((m) => m.replace(/\[tiktok:user\]\s*/, '').replace(/\/video\//, '').trim()))];
            if (videoIds.length > 0) {
              const username = cleanUrl.split('@')[1] ? cleanUrl.split('@')[1].split('/')[0].split('?')[0] : 'creator';
              const videos: ChannelVideoEntry[] = videoIds.map((id, index) => ({
                id,
                url: `https://www.tiktok.com/@${username}/video/${id}`,
                title: `TikTok Video #${index + 1} (${id})`,
                thumbnail: '',
                durationFormatted: 'Short',
              }));

              return resolve({
                channelTitle: `@${username} (TikTok Profile)`,
                channelUrl: cleanUrl,
                uploader: username,
                totalFound: videos.length,
                platform: 'TikTok',
                videos,
              });
            }
          }

          const friendly = this.cleanErrorMessage(stderr || `Channel extraction failed with code ${code}`, platform);
          return reject(new Error(friendly));
        }

        try {
          if (!stdout.trim() || stdout.trim() === 'null') {
            const combined = stdout + '\n' + stderr;
            if (platform === 'TikTok') {
              const idMatches = combined.match(/\[tiktok:user\]\s*(\d{15,})/g) || combined.match(/\/video\/(\d{15,})/g) || [];
              const videoIds = [...new Set(idMatches.map((m) => m.replace(/\[tiktok:user\]\s*/, '').replace(/\/video\//, '').trim()))];
              if (videoIds.length > 0) {
                const username = cleanUrl.split('@')[1] ? cleanUrl.split('@')[1].split('/')[0].split('?')[0] : 'creator';
                const videos: ChannelVideoEntry[] = videoIds.map((id, index) => ({
                  id,
                  url: `https://www.tiktok.com/@${username}/video/${id}`,
                  title: `TikTok Video #${index + 1} (${id})`,
                  thumbnail: '',
                  durationFormatted: 'Short',
                }));

                return resolve({
                  channelTitle: `@${username} (TikTok Profile)`,
                  channelUrl: cleanUrl,
                  uploader: username,
                  totalFound: videos.length,
                  platform: 'TikTok',
                  videos,
                });
              }
            }

            if (platform === 'Facebook') {
              return reject(new Error('Facebook requires account login to browse user profile tabs. You can paste multiple Facebook reel links separated by spaces right here in this box for instant batch downloading!'));
            }
            if (platform === 'Instagram') {
              return reject(new Error('Instagram restricts browsing full profiles without login. You can paste multiple Instagram reel links in this box for instant batch downloading!'));
            }
            return reject(new Error(`Unable to extract media list from this ${platform} URL. Please verify the link or paste video URLs.`));
          }

          const raw = JSON.parse(stdout);
          if (!raw || typeof raw !== 'object') {
            if (platform === 'Facebook') {
              return reject(new Error('Facebook restricts unauthenticated crawling of user profile reels tabs. You can paste multiple Facebook reel links right here in this box!'));
            }
            return reject(new Error(`Could not parse media from ${platform}. Please check the URL.`));
          }

          let entries: any[] = [];
          if (Array.isArray(raw.entries)) {
            entries = raw.entries;
          } else if (raw._type === 'playlist' && Array.isArray(raw.entries)) {
            entries = raw.entries;
          } else if (raw.id && (raw.url || raw.webpage_url)) {
            entries = [raw];
          }

          if (entries.length === 0) {
            const combined = stdout + '\n' + stderr;
            if (platform === 'TikTok') {
              const idMatches = combined.match(/\[tiktok:user\]\s*(\d{15,})/g) || combined.match(/\/video\/(\d{15,})/g) || [];
              const videoIds = [...new Set(idMatches.map((m) => m.replace(/\[tiktok:user\]\s*/, '').replace(/\/video\//, '').trim()))];
              if (videoIds.length > 0) {
                const username = cleanUrl.split('@')[1] ? cleanUrl.split('@')[1].split('/')[0].split('?')[0] : 'creator';
                const videos: ChannelVideoEntry[] = videoIds.map((id, index) => ({
                  id,
                  url: `https://www.tiktok.com/@${username}/video/${id}`,
                  title: `TikTok Video #${index + 1} (${id})`,
                  thumbnail: '',
                  durationFormatted: 'Short',
                }));

                return resolve({
                  channelTitle: `@${username} (TikTok Profile)`,
                  channelUrl: cleanUrl,
                  uploader: username,
                  totalFound: videos.length,
                  platform: 'TikTok',
                  videos,
                });
              }
            }
            return reject(new Error(`No videos found on this ${platform} channel/playlist.`));
          }

          const videos: ChannelVideoEntry[] = [];
          for (const item of entries) {
            if (!item) continue;

            const itemId = item.id || '';
            let videoUrl = item.url || item.webpage_url || '';

            // Construct proper URL if flat entry has relative id
            if (!videoUrl.startsWith('http')) {
              if (platform === 'YouTube') {
                if (cleanUrl.includes('/shorts')) {
                  videoUrl = `https://www.youtube.com/shorts/${itemId}`;
                } else {
                  videoUrl = `https://www.youtube.com/watch?v=${itemId}`;
                }
              } else if (platform === 'TikTok') {
                videoUrl = `https://www.tiktok.com/video/${itemId}`;
              } else {
                videoUrl = cleanUrl;
              }
            }

            // Thumbnail extraction
            let thumbUrl = '';
            if (item.thumbnails && Array.isArray(item.thumbnails) && item.thumbnails.length > 0) {
              thumbUrl = item.thumbnails[item.thumbnails.length - 1].url || '';
            } else if (item.thumbnail) {
              thumbUrl = item.thumbnail;
            } else if (platform === 'YouTube' && itemId) {
              thumbUrl = `https://i.ytimg.com/vi/${itemId}/hqdefault.jpg`;
            }

            const durationSec = item.duration;
            const durationFormatted = durationSec ? this.formatDuration(durationSec) : (cleanUrl.includes('/shorts') ? 'Short' : '--:--');

            videos.push({
              id: itemId || `vid_${Math.random().toString(36).slice(2, 8)}`,
              url: videoUrl,
              title: item.title || 'Untitled Video',
              thumbnail: thumbUrl,
              duration: durationSec,
              durationFormatted,
              viewCount: item.view_count,
              uploadDate: item.upload_date,
            });
          }

          // Channel Avatar
          let avatarUrl = '';
          if (raw.thumbnails && Array.isArray(raw.thumbnails)) {
            const avatar = raw.thumbnails.find((t: any) => t.id === 'avatar_uncropped' || (t.width && t.width === t.height)) || raw.thumbnails[0];
            if (avatar) avatarUrl = avatar.url;
          }

          const channelTitle = raw.title || raw.channel || raw.uploader || `${platform} Channel`;
          const result: ChannelExtractResult = {
            channelTitle,
            channelUrl: raw.webpage_url || cleanUrl,
            uploader: raw.uploader || raw.channel || raw.uploader_id,
            avatarUrl,
            description: raw.description ? raw.description.slice(0, 200) : undefined,
            totalFound: videos.length,
            platform,
            videos,
          };

          resolve(result);
        } catch (err: any) {
          reject(new Error(err.message || 'Failed to parse channel media list'));
        }
      });

      child.on('error', (err) => {
        reject(new Error(`Channel extractor process error: ${err.message}`));
      });
    });
  }
}

export const ytdlpService = new YtDlpService();
