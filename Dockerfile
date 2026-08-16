# OmniDownloader Pro - Production Multi-Stage Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Copy root and package manifests
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source files
COPY backend ./backend
COPY frontend ./frontend

# Build backend and frontend dist
RUN cd backend && npm run build
RUN cd frontend && npm run build

# --- Runtime Stage ---
FROM node:20-slim

WORKDIR /app

# Install Python, FFmpeg, and yt-dlp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests and install production backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY data ./data

# Environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Start server
CMD ["node", "backend/dist/server.js"]
