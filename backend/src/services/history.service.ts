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

/**
 * Zero-Log History Service:
 * Ensures complete visitor privacy. Download history is kept 100% on the client device (LocalStorage).
 * No visitor media URLs or download items are logged or persisted on the server.
 */
export class HistoryService {
  public getAll(): HistoryItem[] {
    return [];
  }

  public addHistory(_item: HistoryItem) {
    // Zero-Log: Do not record visitors' private downloads on the server
  }

  public deleteItem(_id: string): boolean {
    return true;
  }

  public clearAll() {
    // Zero-Log
  }
}

export const historyService = new HistoryService();
