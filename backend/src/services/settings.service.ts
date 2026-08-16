import path from 'path';
import fs from 'fs';

export interface AppSettings {
  downloadDirectory: string;
  defaultPreset: string;
  maxConcurrentDownloads: number;
  autoDetectClipboard: boolean;
  theme: 'dark' | 'light' | 'system';
  proxyUrl?: string;
}

export class SettingsService {
  private settingsFile: string;
  private settings: AppSettings;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.settingsFile = path.join(dataDir, 'settings.json');

    const defaultDownloads = path.resolve(process.cwd(), 'downloads');
    this.settings = {
      downloadDirectory: defaultDownloads,
      defaultPreset: 'best-video-mp4',
      maxConcurrentDownloads: 2,
      autoDetectClipboard: true,
      theme: 'dark',
      proxyUrl: '',
    };

    this.loadSettings();
  }

  private loadSettings() {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf-8');
        this.settings = { ...this.settings, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }

  private saveSettings() {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    return this.getSettings();
  }
}

export const settingsService = new SettingsService();
