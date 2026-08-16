export {};

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      selectDirectory: () => Promise<string | null>;
      openFolder: (path: string) => Promise<void>;
      showNotification: (title: string, body: string) => Promise<void>;
    };
  }
}
