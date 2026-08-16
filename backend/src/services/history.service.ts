import path from 'path';
import fs from 'fs';

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

export class HistoryService {
  private historyFile: string;
  private items: HistoryItem[] = [];

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.historyFile = path.join(dataDir, 'history.json');
    this.loadHistory();
  }

  private loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        const raw = fs.readFileSync(this.historyFile, 'utf-8');
        this.items = JSON.parse(raw);
      } else {
        this.items = [];
      }
    } catch {
      this.items = [];
    }
  }

  private saveHistory() {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(this.items, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save history file:', err);
    }
  }

  public getAll(): HistoryItem[] {
    return [...this.items].sort((a, b) => b.completedAt - a.completedAt);
  }

  public addHistory(item: HistoryItem) {
    // Remove if already exists with same id
    this.items = this.items.filter((i) => i.id !== item.id);
    this.items.unshift(item);
    // Keep last 200 items
    if (this.items.length > 200) {
      this.items = this.items.slice(0, 200);
    }
    this.saveHistory();
  }

  public deleteItem(id: string): boolean {
    const initialLen = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    if (this.items.length !== initialLen) {
      this.saveHistory();
      return true;
    }
    return false;
  }

  public clearAll() {
    this.items = [];
    this.saveHistory();
  }
}

export const historyService = new HistoryService();
