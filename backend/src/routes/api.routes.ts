import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { ytdlpService } from '../services/ytdlp.service';
import { queueService } from '../services/queue.service';
import { historyService } from '../services/history.service';
import { settingsService } from '../services/settings.service';
import { authService } from '../services/auth.service';
import { announcementService } from '../services/announcement.service';

export const apiRouter = Router();

// Helper to extract client IP across reverse proxies & local networks
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) return String(realIp).trim();
  return req.socket.remoteAddress || '127.0.0.1';
};

// Helper to extract bearer token
const getAuthToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers['x-auth-token'];
  if (customHeader) return String(customHeader).trim();
  return undefined;
};

// 0. Auth & Quota Routes
apiRouter.get('/auth/quota', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const token = getAuthToken(req);
  const quota = authService.getQuota(ip, token);
  res.json(quota);
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  try {
    const result = authService.register(email, name, password);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = authService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

// 0b. Admin Routes (Admin Dashboard)
apiRouter.post('/admin/login-pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  try {
    const result = authService.loginMasterAdmin(pin || '');
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Master Admin authentication failed' });
  }
});

apiRouter.get('/admin/stats', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user || (user.role !== 'admin' && user.role !== 'moderator' && !user.email.toLowerCase().includes('admin'))) {
    return res.status(403).json({ error: 'Staff access required' });
  }

  const stats = authService.getAdminStats();
  res.json(stats);
});

apiRouter.get('/admin/users', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user || (user.role !== 'admin' && user.role !== 'moderator' && !user.email.toLowerCase().includes('admin'))) {
    return res.status(403).json({ error: 'Staff access required' });
  }

  const users = authService.getAllUsers();
  res.json({ users });
});

apiRouter.post('/admin/users/:id/toggle-pro', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user || (user.role !== 'admin' && user.role !== 'moderator' && !user.email.toLowerCase().includes('admin'))) {
    return res.status(403).json({ error: 'Staff access required' });
  }

  try {
    const updatedUser = authService.toggleProStatus(String(req.params.id));
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to toggle Pro' });
  }
});

// Role assignment: Master Admin only
apiRouter.post('/admin/users/:id/role', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user || (user.role !== 'admin' && !user.email.toLowerCase().includes('admin'))) {
    return res.status(403).json({ error: 'Master Admin permission required to assign roles' });
  }

  const { role } = req.body;
  if (!['admin', 'moderator', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const updatedUser = authService.changeUserRole(String(req.params.id), role);
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update role' });
  }
});

// Delete user: Master Admin only
apiRouter.delete('/admin/users/:id', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user || (user.role !== 'admin' && !user.email.toLowerCase().includes('admin'))) {
    return res.status(403).json({ error: 'Master Admin permission required to delete users' });
  }

  const deleted = authService.deleteUser(String(req.params.id));
  res.json({ success: deleted });
});

// 0c. Announcement & Broadcast Routes
apiRouter.get('/announcements', (_req: Request, res: Response) => {
  const activeAnnouncements = announcementService.getAll(true);
  res.json({ announcements: activeAnnouncements });
});

apiRouter.get('/admin/announcements', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user || (user.role !== 'admin' && user.role !== 'moderator' && !user.email.toLowerCase().includes('admin'))) {
    return res.status(403).json({ error: 'Staff access required' });
  }

  const all = announcementService.getAll(false);
  res.json({ announcements: all });
});

apiRouter.post('/admin/announcements', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user || (user.role !== 'admin' && !user.email.toLowerCase().includes('admin'))) {
    return res.status(403).json({ error: 'Master Admin permission required to broadcast notifications' });
  }

  const { title, message, type } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  try {
    const created = announcementService.create({
      title,
      message,
      type: type || 'info',
      createdBy: user.name || user.email,
    });

    // Broadcast in real-time over WebSocket if server handler exists
    const broadcastNotification = (req.app as any).broadcastNotification;
    if (typeof broadcastNotification === 'function') {
      broadcastNotification(created);
    }

    res.json({ success: true, announcement: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create announcement' });
  }
});

apiRouter.delete('/admin/announcements/:id', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user || (user.role !== 'admin' && !user.email.toLowerCase().includes('admin'))) {
    return res.status(403).json({ error: 'Master Admin permission required' });
  }

  const deleted = announcementService.delete(String(req.params.id));
  res.json({ success: deleted });
});

apiRouter.post('/admin/announcements/:id/toggle', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  const user = authService.verifyToken(token);
  if (!user || (user.role !== 'admin' && !user.email.toLowerCase().includes('admin'))) {
    return res.status(403).json({ error: 'Master Admin permission required' });
  }

  const updated = announcementService.toggleActive(String(req.params.id));
  if (!updated) return res.status(404).json({ error: 'Announcement not found' });
  res.json({ success: true, announcement: updated });
});

// 1. Health check
apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await ytdlpService.checkHealth();
    res.json({
      status: 'ok',
      engine: 'yt-dlp',
      ...health,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 2. Extract Single Video Metadata
apiRouter.post('/info', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const info = await ytdlpService.getVideoInfo(url);
    res.json(info);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to extract video details' });
  }
});

// 2b. Extract Channel / Playlist / Shorts Videos
apiRouter.post('/channel/extract', async (req: Request, res: Response) => {
  const { url, maxVideos } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Channel / Playlist URL parameter is required' });
  }

  try {
    const limit = maxVideos ? parseInt(String(maxVideos), 10) : 50;
    const channelResult = await ytdlpService.extractChannelVideos(url, limit);
    res.json(channelResult);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to extract channel videos' });
  }
});

// 3. Batch Inspect Metadata
apiRouter.post('/bulk/info', async (req: Request, res: Response) => {
  const { urls } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'URLs array is required' });
  }

  const results = [];
  for (const rawUrl of urls.slice(0, 50)) {
    const url = String(rawUrl).trim();
    if (!url) continue;

    try {
      const info = await ytdlpService.getVideoInfo(url);
      results.push({
        url,
        success: true,
        data: info,
      });
    } catch (err: any) {
      results.push({
        url,
        success: false,
        platform: ytdlpService.detectPlatform(url),
        error: err.message,
      });
    }
  }

  res.json({ items: results });
});

// 4. Start Single Download (Quota Enforced)
apiRouter.post('/download', async (req: Request, res: Response) => {
  const { id, url, preset, customFormatId, directDownloadUrl, directAudioUrl, title } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Quota enforcement
  const ip = getClientIp(req);
  const token = getAuthToken(req);
  const quota = authService.getQuota(ip, token);

  if (!quota.canDownload) {
    return res.status(403).json({
      error: `Daily free limit reached (${quota.dailyLimit}/${quota.dailyLimit}). Please sign up or log in for unlimited downloads!`,
      isLimitReached: true,
      quota,
    });
  }

  const downloadId = id || `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const settings = settingsService.getSettings();

  try {
    const { promise } = ytdlpService.download(
      {
        id: downloadId,
        url,
        preset: preset || settings.defaultPreset,
        customFormatId,
        outputDir: settings.downloadDirectory,
        directDownloadUrl,
        directAudioUrl,
        title,
      },
      (progress) => {
        // Broadcasted via WebSocket handler in server.ts
        if ((req.app as any).broadcastProgress) {
          (req.app as any).broadcastProgress(progress);
        }
      }
    );

    // If request wants to wait for completion (e.g. standard REST caller)
    const result = await promise;

    // Record quota usage
    authService.recordDownload(ip, token);

    // Add to history
    historyService.addHistory({
      id: downloadId,
      url,
      title: result.filename,
      platform: ytdlpService.detectPlatform(url),
      filename: result.filename,
      filepath: result.filepath,
      fileSize: result.size,
      preset: preset || settings.defaultPreset,
      completedAt: Date.now(),
    });

    res.json({
      id: downloadId,
      status: 'completed',
      filename: result.filename,
      size: result.size,
      downloadUrl: `/api/files/${encodeURIComponent(result.filename)}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Download failed' });
  }
});

// 5. Bulk Queue Management (Quota Enforced)
apiRouter.post('/bulk/start', (req: Request, res: Response) => {
  const { batchId, items } = req.body;
  if (!batchId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'batchId and items array are required' });
  }

  const ip = getClientIp(req);
  const token = getAuthToken(req);
  const quota = authService.getQuota(ip, token);

  // For guest users, enforce batch limit
  if (!quota.isPro && items.length > 3) {
    return res.status(403).json({
      error: `Free guests can download up to 3 links per batch. Sign up free for unlimited bulk batch downloads!`,
      isLimitReached: true,
      quota,
    });
  }

  if (!quota.canDownload) {
    return res.status(403).json({
      error: `Daily free limit reached (${quota.dailyLimit}/${quota.dailyLimit}). Please sign up or log in for unlimited downloads!`,
      isLimitReached: true,
      quota,
    });
  }

  const settings = settingsService.getSettings();
  queueService.setMaxConcurrent(settings.maxConcurrentDownloads);

  const queued = queueService.addItems(batchId, items);

  // Record quota usage
  authService.recordDownload(ip, token);

  res.json({
    batchId,
    queuedCount: queued.length,
    summary: queueService.getBatchSummary(batchId),
  });
});

apiRouter.get('/bulk/summary/:batchId', (req: Request, res: Response) => {
  const batchId = String(req.params.batchId);
  const summary = queueService.getBatchSummary(batchId);
  res.json(summary);
});

apiRouter.post('/bulk/cancel-item', (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  queueService.cancelItem(id);
  res.json({ success: true });
});

apiRouter.post('/bulk/retry-item', (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  queueService.retryItem(id);
  res.json({ success: true });
});

apiRouter.post('/bulk/cancel-batch', (req: Request, res: Response) => {
  const { batchId } = req.body;
  if (!batchId) return res.status(400).json({ error: 'batchId required' });
  queueService.cancelBatch(batchId);
  res.json({ success: true });
});

apiRouter.get('/bulk/zip/:batchId', async (req: Request, res: Response) => {
  const batchId = String(req.params.batchId);
  try {
    const zipPath = await queueService.createBatchZip(batchId);
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ error: 'Failed to create zip file' });
    }

    const filename = path.basename(zipPath);
    res.download(zipPath, filename, (err) => {
      if (err) console.error('Zip download error:', err);
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error generating ZIP bundle' });
  }
});

// 6. Download History
apiRouter.get('/history', (_req: Request, res: Response) => {
  const history = historyService.getAll();
  res.json({ items: history });
});

apiRouter.delete('/history/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = historyService.deleteItem(id);
  res.json({ success: deleted });
});

apiRouter.delete('/history', (_req: Request, res: Response) => {
  historyService.clearAll();
  res.json({ success: true });
});

// 7. Settings
apiRouter.get('/settings', (_req: Request, res: Response) => {
  res.json(settingsService.getSettings());
});

apiRouter.post('/settings', (req: Request, res: Response) => {
  const updated = settingsService.updateSettings(req.body);
  if (req.body.maxConcurrentDownloads) {
    queueService.setMaxConcurrent(req.body.maxConcurrentDownloads);
  }
  if (req.body.downloadDirectory) {
    ytdlpService.setDownloadDir(req.body.downloadDirectory);
  }
  res.json(updated);
});

// 8. Stream / Download File to Device (Mobile & Web friendly)
apiRouter.get('/files/:filename', (req: Request, res: Response) => {
  const filename = decodeURIComponent(String(req.params.filename));
  const settings = settingsService.getSettings();
  const filePath = path.join(settings.downloadDirectory, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on server' });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('File download error:', err);
    }
  });
});

// 9. Desktop Native Open in Folder (for Electron / Local mode)
apiRouter.post('/open-folder', (req: Request, res: Response) => {
  const { filepath } = req.body;
  const target = filepath || settingsService.getSettings().downloadDirectory;

  if (process.platform === 'win32') {
    exec(`explorer.exe /select,"${target}"`, () => {});
  } else if (process.platform === 'darwin') {
    exec(`open -R "${target}"`, () => {});
  } else {
    exec(`xdg-open "${path.dirname(target)}"`, () => {});
  }

  res.json({ success: true, path: target });
});

