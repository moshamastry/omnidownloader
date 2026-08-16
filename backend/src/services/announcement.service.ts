import path from 'path';
import fs from 'fs';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  createdAt: number;
  createdBy?: string;
  active: boolean;
}

export class AnnouncementService {
  private announcementsFile: string;
  private announcements: Announcement[] = [];

  constructor() {
    const possibleDataDirs = [
      path.resolve(process.cwd(), 'data'),
      path.resolve(__dirname, '../../data'),
      path.resolve(__dirname, '../data'),
    ];

    let chosenDir = possibleDataDirs[0];
    for (const dir of possibleDataDirs) {
      if (fs.existsSync(dir)) {
        chosenDir = dir;
        break;
      }
    }

    if (!fs.existsSync(chosenDir)) {
      fs.mkdirSync(chosenDir, { recursive: true });
    }

    this.announcementsFile = path.join(chosenDir, 'announcements.json');
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.announcementsFile)) {
        this.announcements = JSON.parse(fs.readFileSync(this.announcementsFile, 'utf-8'));
      } else {
        this.announcements = [];
      }
    } catch {
      this.announcements = [];
    }

    // Default welcome announcement if none exist
    if (this.announcements.length === 0) {
      this.announcements.push({
        id: 'ann_welcome_01',
        title: '🚀 Welcome to OmniDownloader Pro!',
        message: 'Download any video, reel, audio, or playlist in up to 8K Ultra HD at maximum speeds.',
        type: 'info',
        createdAt: Date.now(),
        createdBy: 'Admin',
        active: true,
      });
      this.saveAnnouncements();
    }
  }

  private saveAnnouncements() {
    try {
      fs.writeFileSync(this.announcementsFile, JSON.stringify(this.announcements, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save announcements:', err);
    }
  }

  public getAll(onlyActive: boolean = false): Announcement[] {
    if (onlyActive) {
      return this.announcements.filter((a) => a.active);
    }
    return this.announcements;
  }

  public create(data: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'alert';
    createdBy?: string;
  }): Announcement {
    const newAnnouncement: Announcement = {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type || 'info',
      createdAt: Date.now(),
      createdBy: data.createdBy || 'Admin',
      active: true,
    };

    this.announcements.unshift(newAnnouncement);
    this.saveAnnouncements();
    return newAnnouncement;
  }

  public delete(id: string): boolean {
    const initialLen = this.announcements.length;
    this.announcements = this.announcements.filter((a) => a.id !== id);
    if (this.announcements.length !== initialLen) {
      this.saveAnnouncements();
      return true;
    }
    return false;
  }

  public toggleActive(id: string): Announcement | null {
    const found = this.announcements.find((a) => a.id === id);
    if (!found) return null;
    found.active = !found.active;
    this.saveAnnouncements();
    return found;
  }
}

export const announcementService = new AnnouncementService();
