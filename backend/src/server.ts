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

(app as any).broadcastProgress = broadcastProgress;

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

