import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { ytdlpService, DownloadProgress } from './ytdlp.service';
import { historyService } from './history.service';

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
  cancelFn?: () => void;
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
  zipFilename?: string;
  zipFilepath?: string;
  items: QueueItem[];
}

export class QueueService {
  private queue: Map<string, QueueItem> = new Map();
  private maxConcurrent: number = 2;
  private activeDownloads: number = 0;
  private isProcessing: boolean = false;
  private listeners: Set<(item: QueueItem, batchSummary: BatchSummary) => void> = new Set();

  constructor() {
    this.maxConcurrent = 2;
  }

  public setMaxConcurrent(limit: number) {
    this.maxConcurrent = Math.max(1, Math.min(5, limit));
    this.processQueue();
  }

  public getMaxConcurrent(): number {
    return this.maxConcurrent;
  }

  public onUpdate(callback: (item: QueueItem, batchSummary: BatchSummary) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(item: QueueItem) {
    const summary = this.getBatchSummary(item.batchId);
    for (const listener of this.listeners) {
      try {
        listener(item, summary);
      } catch (err) {
        console.error('Error notifying queue listener:', err);
      }
    }
  }

  public addItems(
    batchId: string,
    items: Array<{ id: string; url: string; preset?: string; title?: string; thumbnail?: string; duration?: string; uploader?: string; platform?: string }>
  ): QueueItem[] {
    const createdItems: QueueItem[] = [];

    for (const raw of items) {
      const item: QueueItem = {
        id: raw.id,
        batchId,
        url: raw.url,
        title: raw.title || 'Fetching info...',
        thumbnail: raw.thumbnail || '',
        duration: raw.duration || '--:--',
        uploader: raw.uploader || '',
        platform: raw.platform || ytdlpService.detectPlatform(raw.url),
        preset: raw.preset || 'best-video-mp4',
        status: 'pending',
        percent: 0,
        speed: '',
        eta: '',
        createdAt: Date.now(),
      };

      this.queue.set(item.id, item);
      createdItems.push(item);
      this.notify(item);
    }

    this.processQueue();
    return createdItems;
  }

  public async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.activeDownloads < this.maxConcurrent) {
        // Find next pending item
        const nextItem = Array.from(this.queue.values()).find((i) => i.status === 'pending');
        if (!nextItem) break;

        this.startItemDownload(nextItem);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async startItemDownload(item: QueueItem) {
    this.activeDownloads++;
    item.status = 'downloading';
    this.notify(item);

    try {
      let directDownloadUrl: string | undefined;
      let directAudioUrl: string | undefined;

      // If metadata is not known yet, try quick extraction
      if (item.title === 'Fetching info...') {
        try {
          const info = await ytdlpService.getVideoInfo(item.url);
          item.title = info.title;
          item.thumbnail = info.thumbnail;
          item.duration = info.durationFormatted;
          item.uploader = info.uploader;
          item.platform = info.platform;
          directDownloadUrl = info.directDownloadUrl;
          directAudioUrl = info.directAudioUrl;
          this.notify(item);
        } catch {
          // If metadata fails, proceed to download directly
        }
      }

      const { cancel, promise } = ytdlpService.download(
        {
          id: item.id,
          url: item.url,
          preset: item.preset,
          directDownloadUrl,
          directAudioUrl,
          title: item.title,
        },
        (progress: DownloadProgress) => {
          item.percent = progress.percent;
          item.speed = progress.speed;
          item.eta = progress.eta;
          if (progress.status === 'downloading' || progress.status === 'processing') {
            item.status = 'downloading';
          }
          this.notify(item);
        }
      );

      item.cancelFn = cancel;

      const result = await promise;
      item.status = 'completed';
      item.percent = 100;
      item.filename = result.filename;
      item.filepath = result.filepath;
      item.fileSize = result.size;
      item.cancelFn = undefined;

      // Save to download history
      historyService.addHistory({
        id: item.id,
        url: item.url,
        title: item.title || result.filename,
        thumbnail: item.thumbnail,
        duration: item.duration,
        platform: item.platform || 'Web',
        filename: result.filename,
        filepath: result.filepath,
        fileSize: result.size,
        preset: item.preset,
        completedAt: Date.now(),
      });

      this.notify(item);
    } catch (err: any) {
      if ((item.status as string) !== 'canceled') {
        item.status = 'failed';
        item.error = err.message || 'Download error';
        this.notify(item);
      }
    } finally {
      this.activeDownloads--;
      this.processQueue();
    }
  }

  public cancelItem(id: string) {
    const item = this.queue.get(id);
    if (item) {
      if (item.cancelFn) {
        item.cancelFn();
      }
      item.status = 'canceled';
      item.cancelFn = undefined;
      this.notify(item);
      this.processQueue();
    }
  }

  public cancelBatch(batchId: string) {
    for (const item of this.queue.values()) {
      if (item.batchId === batchId && (item.status === 'pending' || item.status === 'downloading')) {
        this.cancelItem(item.id);
      }
    }
  }

  public retryItem(id: string) {
    const item = this.queue.get(id);
    if (item && (item.status === 'failed' || item.status === 'canceled')) {
      item.status = 'pending';
      item.percent = 0;
      item.error = undefined;
      this.notify(item);
      this.processQueue();
    }
  }

  public getBatchItems(batchId: string): QueueItem[] {
    return Array.from(this.queue.values()).filter((i) => i.batchId === batchId);
  }

  public getBatchSummary(batchId: string): BatchSummary {
    const items = this.getBatchItems(batchId);
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const failed = items.filter((i) => i.status === 'failed').length;
    const pending = items.filter((i) => i.status === 'pending').length;
    const downloading = items.filter((i) => i.status === 'downloading').length;

    const totalPercent = total > 0 ? Math.round(items.reduce((acc, curr) => acc + (curr.percent || 0), 0) / total) : 0;
    const isFinished = total > 0 && pending === 0 && downloading === 0;
    const zipAvailable = completed > 0;

    return {
      batchId,
      total,
      completed,
      failed,
      pending,
      downloading,
      progressPercent: totalPercent,
      isFinished,
      zipAvailable,
      items,
    };
  }

  public async createBatchZip(batchId: string): Promise<string> {
    const items = this.getBatchItems(batchId).filter((i) => i.status === 'completed' && i.filepath && fs.existsSync(i.filepath));
    if (items.length === 0) {
      throw new Error('No completed files available to zip');
    }

    const zipFolder = path.resolve(process.cwd(), 'downloads');
    const zipFilename = `batch-${batchId.slice(0, 8)}-${Date.now()}.zip`;
    const zipFilepath = path.join(zipFolder, zipFilename);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipFilepath);
      const archive = archiver('zip', { zlib: { level: 6 } });

      output.on('close', () => {
        resolve(zipFilepath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      for (const item of items) {
        if (item.filepath && fs.existsSync(item.filepath)) {
          const entryName = item.filename || path.basename(item.filepath);
          archive.file(item.filepath, { name: entryName });
        }
      }

      archive.finalize();
    });
  }

  public clearCompleted() {
    for (const [id, item] of this.queue.entries()) {
      if (item.status === 'completed' || item.status === 'canceled' || item.status === 'failed') {
        this.queue.delete(id);
      }
    }
  }
}

export const queueService = new QueueService();
