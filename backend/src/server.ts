import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.routes';
import { queueService } from './services/queue.service';
import { DownloadProgress } from './services/ytdlp.service';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach API Routes
app.use('/api', apiRouter);

// WebSocket Server for live download progress & queue updates
const wss = new WebSocketServer({ server, path: '/ws' });
const clients: Set<WebSocket> = new Set();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);

  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket progress stream active' }));

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
    clients.delete(ws);
  });
});

// Broadcast helper for progress
const broadcastProgress = (progress: DownloadProgress) => {
  const msg = JSON.stringify({
    type: 'download_progress',
    data: progress,
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
};

// Broadcast helper for announcements / notifications
const broadcastNotification = (announcement: any) => {
  const msg = JSON.stringify({
    type: 'announcement_broadcast',
    data: announcement,
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
};

(app as any).broadcastProgress = broadcastProgress;
(app as any).broadcastNotification = broadcastNotification;

// Listen to bulk queue service updates and broadcast
queueService.onUpdate((item, batchSummary) => {
  const msg = JSON.stringify({
    type: 'queue_update',
    data: {
      item,
      batchSummary,
    },
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
});

// SEO: Sitemap & Robots endpoints for Google Search Console
app.get('/robots.txt', (_req, res) => {
  const possibleRobots = [
    path.resolve(process.cwd(), 'frontend/public/robots.txt'),
    path.resolve(process.cwd(), 'frontend/dist/robots.txt'),
    path.resolve(__dirname, '../../frontend/public/robots.txt'),
  ];
  for (const r of possibleRobots) {
    if (fs.existsSync(r)) {
      return res.type('text/plain').sendFile(r);
    }
  }
  res.type('text/plain').send('User-agent: *\nAllow: /\nSitemap: https://omnidownloader.com/sitemap.xml');
});

app.get('/sitemap.xml', (_req, res) => {
  const possibleSitemaps = [
    path.resolve(process.cwd(), 'frontend/public/sitemap.xml'),
    path.resolve(process.cwd(), 'frontend/dist/sitemap.xml'),
    path.resolve(__dirname, '../../frontend/public/sitemap.xml'),
  ];
  for (const s of possibleSitemaps) {
    if (fs.existsSync(s)) {
      return res.type('application/xml').sendFile(s);
    }
  }
  res.status(404).send('Sitemap not found');
});

// Google Search Console Site Verification Handler
app.get('/google:code.html', (req, res) => {
  const fileName = `google${req.params.code}.html`;
  const possiblePaths = [
    path.resolve(process.cwd(), `frontend/public/${fileName}`),
    path.resolve(process.cwd(), `frontend/dist/${fileName}`),
    path.resolve(__dirname, `../../frontend/public/${fileName}`),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return res.type('text/html').sendFile(p);
    }
  }
  res.type('text/html').send(`google-site-verification: google${req.params.code}.html`);
});

// Bing Webmaster Site Verification Handler
app.get('/BingSiteAuth.xml', (_req, res) => {
  const possiblePaths = [
    path.resolve(process.cwd(), 'frontend/public/BingSiteAuth.xml'),
    path.resolve(process.cwd(), 'frontend/dist/BingSiteAuth.xml'),
    path.resolve(__dirname, '../../frontend/public/BingSiteAuth.xml'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return res.type('application/xml').sendFile(p);
    }
  }
  res.type('application/xml').send('<?xml version="1.0"?>\n<users>\n\t<user>3BB7061DB6A87DFDC130DAACFE0BDBC9</user>\n</users>');
});

// IndexNow Key verification endpoint for instant Bing, Yandex & DuckDuckGo indexing
app.get('/8a649fb920a0491cbcd88db9a365f57f.txt', (_req, res) => {
  res.type('text/plain').send('8a649fb920a0491cbcd88db9a365f57f');
});

// Serve frontend static build if available
const possibleFrontendPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
];

let frontendDistPath: string | null = null;
for (const p of possibleFrontendPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    frontendDistPath = p;
    break;
  }
}

if (frontendDistPath) {
  console.log(`📦 Serving frontend static build from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  // SPA Catch-all route (excluding /api and /ws)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath!, 'index.html'));
  });
} else {
  // Root health & welcome fallback
  app.get('/', (_req, res) => {
    res.json({
      app: 'Multi Social Media Downloader API',
      status: 'online',
      version: '1.0.0',
      wsUrl: `ws://localhost:${PORT}/ws`,
    });
  });
}

// Server error handling
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Multi Downloader Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket stream active on ws://localhost:${PORT}/ws`);
  if (frontendDistPath) {
    console.log(`🌐 Web UI is ready at http://localhost:${PORT}`);
  }
});

