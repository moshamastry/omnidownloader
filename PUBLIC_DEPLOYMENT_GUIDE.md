# 🌐 OmniDownloader Pro — Complete Public Live Deployment & Custom Domain Guide

> **Creator & Developer Credits**: Mo Shamas  
> **Official Community**: [Instagram (@omnidownloader)](https://www.instagram.com/omnidownloader/) • [X / Twitter](https://x.com/OmniDownloaderme) • [Facebook](https://www.facebook.com/profile.php?id=61593168399104)

---

## 📌 Architecture Note (Important)

Yeh application ek **Full-Stack Media Downloader** hai:
1. **Frontend (React + TypeScript + TailwindCSS)**: User Interface, Buttons, Quality Selector, Progress Bars, Audio/Video Player.
2. **Backend Engine (Node.js + Express + yt-dlp + FFmpeg)**: YouTube, Instagram, Facebook, TikTok etc. se video aur audio streams nikaal kar merge karta hai.

Serverless platforms jaise **Netlify** ya **Vercel** par Python binaries (`yt-dlp` & `FFmpeg`) direct install nahi ho sakte. Isliye:
* **Best Approach (1-Click)**: Poora project (Frontend + Backend) **Render.com**, **Railway.app**, ya **VPS** par **Docker Container** ke through deploy karein (100% Free 24/7).
* **Split Approach**: Frontend ko Vercel/Netlify par host karein aur backend ko Render/Railway par.

---

## ⚡ Method 1: Free 24/7 Hosting on Render.com (Recommended + Custom Domain)

Render.com par aap **100% Free** me bina kisi credit card ke apni website 24/7 live kar sakte hain aur apna **Custom Domain** (e.g. `yourwebsite.com`) bhi connect kar sakte hain.

### Step 1: GitHub par Code Upload Karein
1. [GitHub.com](https://github.com/) par account banayein aur **New Repository** banayein (e.g. `omnidownloader-pro`).
2. Apne computer terminal / PowerShell me project folder me ye commands chalayein:
   ```bash
   git init
   git add .
   git commit -m "Deploy OmniDownloader Pro by @mo.shamas"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/omnidownloader-pro.git
   git push -u origin main
   ```

### Step 2: Render.com par Deploy Karein
1. [Render.com](https://render.com/) par free account banayein (**Sign Up with GitHub**).
2. Dashboard me **New +** -> **Web Service** par click karein.
3. Apna GitHub repository (`omnidownloader-pro`) select karein.
4. Render automatic `Dockerfile` detect kar lega:
   * **Name**: `omnidownloader` (ya apni pasand ka naam)
   * **Runtime**: `Docker` (Auto selected)
   * **Region**: `Singapore` ya `Oregon`
   * **Instance Type**: **Free** ($0/month)
5. **Create Web Service** button par click karein.
6. 2–4 minute me build complete ho jayegi aur aapko free live link mil jayega:
   👉 `https://omnidownloader-xxxx.onrender.com`

### Step 3: Apna Custom Domain Connect Karein (e.g. `yourname.com`)
1. Render Dashboard me apni Web Service open karein -> **Settings** -> **Custom Domains** par jayein.
2. **Add Custom Domain** par click karein (e.g. `downloader.yourdomain.com` ya `yourdomain.com`).
3. Apne Domain Provider (GoDaddy, Namecheap, Cloudflare, Hostinger) ke DNS records me:
   * **Type**: `CNAME`
   * **Name**: `downloader` (ya `@`)
   * **Target/Value**: Render dwara diya gaya address (e.g. `omnidownloader.onrender.com`)
4. Render automatically **Free SSL (HTTPS)** activate kar dega!

---

## 🚀 Method 2: 1-Click Deploy on Railway.app / Koyeb (24/7 Free)

Railway aur Koyeb bhi Docker containers ko bina setup ke instantly run karte hain.

### Railway.app:
1. [Railway.app](https://railway.app/) par jayein aur GitHub se login karein.
2. **New Project** -> **Deploy from GitHub Repo** select karein.
3. Repo select karte hi Railway `Dockerfile` and `railway.json` ko padh kar automatically live kar dega.
4. **Settings** -> **Generate Domain** par click karein ya **Custom Domain** add karein.

---

## 🌐 Method 3: Vercel / Netlify Deployment

Agar aap Frontend ko Vercel ya Netlify par host karna chahte hain:

1. Project me pehle se `vercel.json` aur `netlify.toml` configure kar diye gaye hain.
2. **Vercel**:
   - [Vercel.com](https://vercel.com/) -> **Add New Project** -> Select GitHub repo.
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Deploy par click karein!
3. **Netlify**:
   - [Netlify.com](https://netlify.com/) -> **Add new site** -> **Import from Git**.
   - Base directory: `frontend`
   - Publish directory: `frontend/dist`
   - Build command: `npm run build`
   - Deploy site par click karein!

> *Note*: Vercel/Netlify frontend ko backend engine se baat karne ke liye aap Environment Variable `VITE_API_URL` me apne Render backend ka URL daal sakte hain.

---

## 💻 Method 4: Instant Public Live from your PC (Cloudflare Tunnel)

Agar aap kisi cloud service par deploy kiye bina, apne hi computer se poori duniya ke liye website live karna chahte hain:

1. Folder me diye gaye [`START_PUBLIC_WEBSITE.bat`](file:///c:/Users/Desktop/Downloads/Antigravity/Multi%20Downloder/START_PUBLIC_WEBSITE.bat) par double click karein.
2. Option **[1] Cloudflare Global Fast Tunnel** select karein.
3. Terminal me ek public link aayega (e.g. `https://xxxx.trycloudflare.com`).
4. Is link ko koi bhi mobile ya PC browser me khol kar live use kar sakta hai!

---

## 🐳 Method 5: VPS / Linux Server (Hostinger, DigitalOcean, AWS)

Agar aapke paas Ubuntu / Debian VPS hai:

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/omnidownloader-pro.git
cd omnidownloader-pro

# 2. Docker compose run karein
docker compose up -d --build
```
Aapka tool port 4000 par 24/7 background me live rahega!

---

## 📱 Official Brand & Developer Social Integration Checklist

* [x] **Creator Name**: Clean professional credit as **Mo Shamas** across Footer, Settings, and Metadata.
* [x] **Top Navbar**: Official Instagram gradient badge `@omnidownloader` (`https://www.instagram.com/omnidownloader/`) + X/Twitter + Facebook.
* [x] **Desktop Sidebar**: "Developer & Community" dedicated card with **Follow @omnidownloader**.
* [x] **Modern Page Footer**: "Crafted with ❤️ by Mo Shamas" with direct link to official `@omnidownloader`.
* [x] **HTML Metadata & OpenGraph**: SEO meta tags with author `Mo Shamas` and official Instagram link for Google & Social Media previews.
* [x] **package.json**: Updated with creator name `Mo Shamas` and official homepage `https://www.instagram.com/omnidownloader/`.
