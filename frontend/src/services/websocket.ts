import { DownloadProgress, QueueItem, BatchSummary } from '../types';

type ProgressCallback = (progress: DownloadProgress) => void;
type QueueCallback = (item: QueueItem, batchSummary: BatchSummary) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private progressListeners: Set<ProgressCallback> = new Set();
  private queueListeners: Set<QueueCallback> = new Set();

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const isFileOrElectron = typeof window !== 'undefined' && (
      window.location.protocol === 'file:' || 
      !window.location.host || 
      window.location.origin === 'null' ||
      Boolean((window as any).electronAPI)
    );

    let wsUrl: string;
    if (isFileOrElectron) {
      wsUrl = 'ws://localhost:4000/ws';
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:4000';
      wsUrl = `${protocol}//${host}/ws`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to downloader server');
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'download_progress') {
            for (const listener of this.progressListeners) {
              listener(payload.data);
            }
          } else if (payload.type === 'queue_update') {
            for (const listener of this.queueListeners) {
              listener(payload.data.item, payload.data.batchSummary);
            }
          }
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = (err) => {
        console.error('WS Error:', err);
        if (this.ws) this.ws.close();
      };
    } catch (err) {
      console.error('Failed to instantiate WebSocket:', err);
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    }
  }

  public onProgress(callback: ProgressCallback) {
    this.progressListeners.add(callback);
    return () => {
      this.progressListeners.delete(callback);
    };
  }

  public onQueueUpdate(callback: QueueCallback) {
    this.queueListeners.add(callback);
    return () => {
      this.queueListeners.delete(callback);
    };
  }
}

export const wsService = new WebSocketService();
