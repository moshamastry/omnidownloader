# ⚡ OmniDownloader Pro — Multi Social Media Downloader

> A high-performance, modern, and versatile Social Media Video & Audio Downloader application that runs both as a **Desktop Application** (Windows, macOS, Linux via Electron) and as a **Web Application** (in any browser).

---

## ✨ Key Features

- **🌐 Dual-Mode Architecture**: Run as a native Desktop App (with local file dialogs & native integration) or deploy as a Web App for online browser usage.
- **🎬 Single Video Mode**:
  - Auto platform detection (YouTube, Instagram Reels/Posts, TikTok, Twitter/X, Facebook, Pinterest, SoundCloud, Vimeo, and 1000+ sites).
  - Instant metadata inspection (high-res thumbnail, title, channel, duration, platform badge).
  - Multi-resolution selector (1080p Full HD, 720p HD, 480p, 360p) & Lossless Audio presets (MP3 320kbps, 128kbps, M4A).
  - Real-time download progress ring/bar with speed (MB/s), ETA countdown, and celebration confetti.
- **📦 Bulk Download Mode**:
  - Multi-line URL textarea or `.txt` / `.csv` file upload import.
  - Concurrency queue control with live status badges (*Pending*, *Downloading*, *Completed*, *Failed*, *Canceled*).
  - Individual progress bars & speed counters for each row in the batch.
  - **One-Click ZIP Bundling**: Downloads all completed media files packaged in a single `.zip` archive.
- **📋 Auto-Clipboard Detection**: Automatically detects copied social media links and suggests 1-click paste & download.
- **📁 Native File Manager Integration**: Open downloaded files and folders directly in Windows File Explorer / macOS Finder.
- **🎨 Premium UI / UX**:
  - Inspired by Linear, Notion, and Vercel dashboards.
  - Built with React, TypeScript, TailwindCSS, Lucide Icons, and Framer Motion micro-animations.
  - Dark Mode, Light Mode, and System Theme toggles.
- **⚖️ Legal & Copyright Disclaimer**: Built-in Terms of Service modal emphasizing personal, non-DRM, and ethical usage.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, TailwindCSS, Framer Motion, Lucide Icons, Canvas Confetti, React Hot Toast |
| **Backend API** | Node.js, Express, WebSocket (`ws`), Archiver (ZIP), Child Process Engine |
| **Media Extraction** | `yt-dlp` (Open-Source Extractor) + `FFmpeg` (Merging & Audio Conversion) |
| **Desktop Wrapper** | Electron.js (IPC Bridge, Native File Dialogs, Desktop Notifications) |
| **Data Storage** | Persistent JSON / SQLite Storage for Download History & Settings |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **yt-dlp**: Installed and added to PATH ([yt-dlp install guide](https://github.com/yt-dlp/yt-dlp))
- **FFmpeg**: Installed and added to PATH ([ffmpeg download](https://ffmpeg.org/download.html))

---

### 2. ⚡ 1-Click Quick Launch (Recommended)

Simply double click any of the ready-to-use launch scripts:

| Launcher File | Description |
|---|---|
| **`Omni Downloader`** (Desktop Shortcut) | Double click the shortcut on your Windows Desktop to launch instantly! |
| **`START_DOWNLOADER.bat`** | Starts backend + frontend on `http://localhost:4000` & opens default browser automatically. |
| **`START_DESKTOP_APP.bat`** | Starts backend & launches the native Electron Desktop window. |
| **`START_DEV_SERVER.bat`** | Starts live development servers (`localhost:5173` with Vite HMR). |
| **`CREATE_DESKTOP_SHORTCUT.bat`** | Re-creates the Desktop shortcut on your Windows Desktop screen anytime. |

---

### 3. Running in Development (Command Line)

#### Option A: Web Application Mode (Browser)
Run both backend and frontend dev servers:

```bash
# In project root:
npm run start
```
Open your browser at `http://localhost:4000`.

---

#### Option B: Desktop Application Mode (Electron)
```bash
# Start backend, frontend, and launch Electron desktop window
npm run start:electron
```

---

### 4. Production Build

```bash
# 1. Build backend TypeScript
cd backend && npm run build

# 2. Build frontend React bundle
cd ../frontend && npm run build

# 3. Build Electron desktop wrapper
cd ../electron && npm run build
```

---

## 📁 Project Structure

```
Multi Downloder/
├── backend/                  # Node.js Express API & yt-dlp Engine
│   ├── src/
│   │   ├── services/
│   │   │   ├── ytdlp.service.ts    # yt-dlp metadata extraction & download process
│   │   │   ├── queue.service.ts    # Bulk download queue with concurrency & ZIP
│   │   │   ├── history.service.ts  # Persistent download history store
│   │   │   └── settings.service.ts # App configurations & folder preferences
│   │   ├── routes/
│   │   │   └── api.routes.ts       # REST endpoints (/info, /download, /bulk, /history)
│   │   └── server.ts               # Express HTTP + WebSocket progress server
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # React + TypeScript + TailwindCSS Web UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/             # Navbar, Sidebar
│   │   │   ├── single/             # Single Video Downloader & Format Selector
│   │   │   ├── bulk/               # Bulk Queue Manager & ZIP Bundler
│   │   │   ├── history/            # Download History Table & Actions
│   │   │   ├── settings/           # Settings & Diagnostics Modal
│   │   │   ├── disclaimer/         # Disclaimer & Terms of Service Modal
│   │   │   └── ui/                 # PlatformBadges, Buttons, Cards
│   │   ├── context/                # ThemeContext (Dark/Light Mode)
│   │   ├── services/               # REST API client & WebSocket listener
│   │   ├── types/                  # TypeScript interfaces & definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css               # Design tokens & glassmorphism utilities
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── electron/                 # Electron Desktop Shell
│   ├── src/
│   │   ├── main.ts                 # Window lifecycle & IPC dialog handlers
│   │   └── preload.ts              # Secure contextBridge API
│   ├── package.json
│   └── tsconfig.json
│
├── package.json              # Monorepo orchestration scripts
└── README.md
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check `yt-dlp` and `FFmpeg` operational status |
| `POST` | `/api/info` | Fetch single video metadata, formats, and thumbnail |
| `POST` | `/api/download` | Trigger single download with real-time WebSocket progress |
| `POST` | `/api/bulk/info` | Batch inspect an array of URLs |
| `POST` | `/api/bulk/start` | Queue multiple URLs with concurrency limiter |
| `GET` | `/api/bulk/summary/:batchId` | Get status summary of a batch |
| `GET` | `/api/bulk/zip/:batchId` | Package and download batch as `.zip` |
| `GET` | `/api/history` | Retrieve download history |
| `GET` | `/api/settings` | Retrieve user preferences |
| `POST` | `/api/settings` | Update download folder and defaults |
| `POST` | `/api/open-folder` | Open downloaded file/folder in native File Explorer |
| `WS` | `/ws` | Live WebSocket progress streaming |

---

## ⚖️ Disclaimer & Terms of Service

This software is intended solely for personal, non-commercial media archiving and educational purposes. OmniDownloader only accesses publicly available, non-DRM protected content and does not circumvent any access controls or paywalls. Users are exclusively responsible for complying with the copyright laws and terms of service of the content source platforms.
