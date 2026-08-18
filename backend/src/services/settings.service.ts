import path from 'path';
import fs from 'fs';

export interface AppSettings {
  downloadDirectory: string;
  defaultPreset: string;
  maxConcurrentDownloads: number;
  autoDetectClipboard: boolean;
  theme: 'dark' | 'light' | 'system';
  proxyUrl?: string;
  cookiesContent?: string;
  extractorClients?: string;
}

export interface CookieStatus {
  hasCookies: boolean;
  source: 'env_content' | 'env_path' | 'render_secret' | 'data_file' | 'root_file' | 'ui_settings' | 'none';
  filePath: string | null;
  sizeBytes: number;
  message: string;
}

export class SettingsService {
  private settingsFile: string;
  private cookiesFile: string;
  private envCookiesFile: string;
  private settings: AppSettings;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.settingsFile = path.join(dataDir, 'settings.json');
    this.cookiesFile = path.join(dataDir, 'cookies.txt');
    this.envCookiesFile = path.join(dataDir, 'env_cookies.txt');

    const defaultDownloads = path.resolve(process.cwd(), 'downloads');
    this.settings = {
      downloadDirectory: defaultDownloads,
      defaultPreset: 'best-video-mp4',
      maxConcurrentDownloads: 2,
      autoDetectClipboard: true,
      theme: 'dark',
      proxyUrl: process.env.PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.YTDLP_PROXY || '',
      cookiesContent: '',
      extractorClients: process.env.YTDLP_EXTRACTOR_CLIENTS || 'android_vr,android_creator,android,ios,mweb',
    };

    this.initEnvCookies();
    this.loadSettings();
  }

  /**
   * Normalizes cookies string into standard Netscape format with tabs
   * Handles space conversions caused by web UI inputs or Render environment variable editors
   */
  public normalizeNetscapeCookies(raw?: string): string {
    if (!raw || typeof raw !== 'string') return '';
    let text = raw.trim();

    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      text = text.slice(1, -1);
    }

    if (text.includes('\\n')) {
      text = text.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
    }

    // Check if cookies content is Base64 encoded
    if (
      !text.includes('\n') &&
      !text.includes('\t') &&
      /^[A-Za-z0-9+/=\r\n]+$/.test(text)
    ) {
      try {
        const decoded = Buffer.from(text, 'base64').toString('utf-8');
        if (decoded.includes('\t') || decoded.includes('youtube') || decoded.includes('TRUE')) {
          text = decoded;
        }
      } catch {}
    }

    const lines = text.split(/\r?\n/);
    const cleanLines: string[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (line.startsWith('#')) {
        cleanLines.push(line);
        continue;
      }

      // If it already has tabs, keep it
      if (line.includes('\t')) {
        cleanLines.push(line);
        continue;
      }

      // If it has spaces instead of tabs (Render env var converts tabs to spaces)
      // Matches: Domain Flag Path Secure Expiry Name Value
      const parts = line.split(/\s+/);
      if (parts.length >= 7) {
        const domain = parts[0];
        const flag = parts[1].toUpperCase();
        const pathVal = parts[2];
        const secure = parts[3].toUpperCase();
        const expiry = parts[4];
        const name = parts[5];
        const value = parts.slice(6).join(' ');
        cleanLines.push([domain, flag, pathVal, secure, expiry, name, value].join('\t'));
        continue;
      }

      // If key=value format (e.g. raw cookie header string)
      if (line.includes('=')) {
        const pairs = line.split(';');
        for (const pair of pairs) {
          const [k, ...v] = pair.trim().split('=');
          if (k && v.length > 0) {
            cleanLines.push([
              '.youtube.com',
              'TRUE',
              '/',
              'TRUE',
              '2147483647',
              k.trim(),
              v.join('=').trim()
            ].join('\t'));
          }
        }
        continue;
      }

      cleanLines.push(line);
    }

    return '# Netscape HTTP Cookie File\n' + cleanLines.join('\n') + '\n';
  }

  /**
   * Initializes cookies provided directly via environment variables (ideal for Render/Docker)
   */
  private initEnvCookies() {
    try {
      const rawEnvCookies =
        process.env.YOUTUBE_COOKIES ||
        process.env.COOKIES_CONTENT ||
        process.env.COOKIES_DATA ||
        process.env.COOKIES_BASE64 ||
        '';

      if (rawEnvCookies && rawEnvCookies.trim().length > 10) {
        const content = this.normalizeNetscapeCookies(rawEnvCookies);

        // Write to data/env_cookies.txt, data/cookies.txt, and root cookies.txt for maximum compatibility
        fs.writeFileSync(this.envCookiesFile, content, 'utf-8');
        fs.writeFileSync(this.cookiesFile, content, 'utf-8');
        try {
          fs.writeFileSync(path.resolve(process.cwd(), 'cookies.txt'), content, 'utf-8');
        } catch {}

        console.log(`🍪 [SettingsService] Successfully normalized & loaded YouTube cookies (${content.length} bytes).`);
      }
    } catch (err: any) {
      console.error('⚠️ [SettingsService] Error writing env cookies:', err.message);
    }
  }

  private loadSettings() {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf-8');
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      }
      if (fs.existsSync(this.cookiesFile) && !this.settings.cookiesContent) {
        this.settings.cookiesContent = fs.readFileSync(this.cookiesFile, 'utf-8');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }

  private saveSettings() {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2), 'utf-8');
      if (this.settings.cookiesContent !== undefined) {
        const cleanCookies = this.normalizeNetscapeCookies(this.settings.cookiesContent);
        fs.writeFileSync(this.cookiesFile, cleanCookies, 'utf-8');
        try {
          fs.writeFileSync(path.resolve(process.cwd(), 'cookies.txt'), cleanCookies, 'utf-8');
        } catch {}
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }

  public getSettings(): AppSettings {
    const activeProxy = this.getActiveProxy();
    return {
      ...this.settings,
      proxyUrl: activeProxy || this.settings.proxyUrl || '',
    };
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    return this.getSettings();
  }

  /**
   * Resolves the active proxy URL from settings or environment variables
   */
  public getActiveProxy(): string | null {
    if (this.settings.proxyUrl && this.settings.proxyUrl.trim()) {
      return this.settings.proxyUrl.trim();
    }
    const envProxy =
      process.env.PROXY_URL ||
      process.env.HTTPS_PROXY ||
      process.env.HTTP_PROXY ||
      process.env.YTDLP_PROXY ||
      process.env.ALL_PROXY ||
      '';
    return envProxy.trim() || null;
  }

  /**
   * Resolves configured extractor client order for YouTube
   */
  public getExtractorClients(): string {
    return (
      this.settings.extractorClients?.trim() ||
      process.env.YTDLP_EXTRACTOR_CLIENTS?.trim() ||
      'android_vr,android_creator,android,ios,mweb'
    );
  }

  /**
   * Resolves the path to the active cookies file from multiple prioritized sources:
   * 1. Environment variable content file (env_cookies.txt)
   * 2. Custom path from env (YOUTUBE_COOKIES_PATH / COOKIES_FILE_PATH)
   * 3. Render Secret File (/etc/secrets/cookies.txt or /etc/secrets/youtube_cookies.txt)
   * 4. App data cookies file (data/cookies.txt)
   * 5. Workspace root cookies file (cookies.txt or fb_cookies.txt)
   */
  public getCookiesFilePath(): string | null {
    // 1. Env cookies file
    if (fs.existsSync(this.envCookiesFile) && fs.statSync(this.envCookiesFile).size > 10) {
      return this.envCookiesFile;
    }

    // 2. Custom env path
    const customEnvPath = process.env.YOUTUBE_COOKIES_PATH || process.env.COOKIES_FILE_PATH || process.env.COOKIES_FILE;
    if (customEnvPath) {
      const resolvedCustom = path.resolve(customEnvPath);
      if (fs.existsSync(resolvedCustom) && fs.statSync(resolvedCustom).size > 10) {
        return resolvedCustom;
      }
    }

    // 3. Render Secret File default mount paths
    const renderSecretPaths = [
      '/etc/secrets/cookies.txt',
      '/etc/secrets/youtube_cookies.txt',
      '/etc/secrets/youtube.txt',
    ];
    for (const secPath of renderSecretPaths) {
      if (fs.existsSync(secPath) && fs.statSync(secPath).size > 10) {
        return secPath;
      }
    }

    // 4. Data cookies file
    if (fs.existsSync(this.cookiesFile) && fs.statSync(this.cookiesFile).size > 10) {
      return this.cookiesFile;
    }

    // 5. Root directory cookies
    const rootCookies = path.resolve(process.cwd(), 'cookies.txt');
    if (fs.existsSync(rootCookies) && fs.statSync(rootCookies).size > 10) {
      return rootCookies;
    }

    const fbCookies = path.resolve(process.cwd(), 'fb_cookies.txt');
    if (fs.existsSync(fbCookies) && fs.statSync(fbCookies).size > 10) {
      return fbCookies;
    }

    return null;
  }

  /**
   * Diagnostic summary of cookie configuration
   */
  public getCookieStatus(): CookieStatus {
    const filePath = this.getCookiesFilePath();
    if (!filePath) {
      return {
        hasCookies: false,
        source: 'none',
        filePath: null,
        sizeBytes: 0,
        message: 'No active cookies file found. Cloud datacenter IPs may trigger YouTube bot verification.',
      };
    }

    const size = fs.statSync(filePath).size;
    let source: CookieStatus['source'] = 'data_file';

    if (filePath === this.envCookiesFile) {
      source = 'env_content';
    } else if (filePath.startsWith('/etc/secrets/')) {
      source = 'render_secret';
    } else if (filePath.includes(process.env.YOUTUBE_COOKIES_PATH || '___not_set___')) {
      source = 'env_path';
    } else if (filePath.endsWith('cookies.txt') && !filePath.includes('data')) {
      source = 'root_file';
    }

    return {
      hasCookies: true,
      source,
      filePath,
      sizeBytes: size,
      message: `Cookies active (${source}, ${size} bytes). Bypass protection enabled.`,
    };
  }
}

export const settingsService = new SettingsService();
