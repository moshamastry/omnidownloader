import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  openFolder: (path: string) => ipcRenderer.invoke('shell:openFolder', path),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('notify', { title, body }),
});
