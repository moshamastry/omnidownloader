# 🚀 YouTube Bot Protection Bypass Guide (Render & Cloud Hosting)

इस गाइड में बताया गया है कि Render / Cloud Datacenter IPs पर आ रहे **"Sign in to confirm you're not a bot"** error को हमेशा के लिए कैसे हल करें।

---

## ❓ यह Error क्यों आता है?
जब आप OmniDownloader को Render, AWS, या किसी भी Cloud Server पर deploy करते हैं, तो उस Server का IP Datacenter IP (Oregon/US) होता है। YouTube स्वचालित रूप से Cloud Datacenter IPs से आने वाली requests को bot मानकर ब्लॉक कर देता है और `Sign in to confirm you're not a bot` की मांग करता है।

---

## 🛠️ प्रोजेक्ट में किए गए स्थायी सुधार (New Features)

1. **📱 Multi-Client Automatic Fallback (`android`, `ios`, `mweb`, `tv_embedded`)**:
   - `yt-dlp` अब YouTube के mobile clients (`android`, `ios`) के माध्यम से requests भेजता है, जिन पर YouTube का bot detection बहुत कम trigger होता है।
   - अगर एक client fail होता है, तो सिस्टम automatically alternative clients से retry करता है।

2. **🍪 Multi-Source Cookies Authentication**:
   - आप अपने browser की YouTube cookies को Render के Environment Variables (`YOUTUBE_COOKIES`), Secret File (`/etc/secrets/cookies.txt`), या Web UI Settings में जोड़ सकते हैं।
   - Server चालू होते ही cookies automatically `yt-dlp` में pass हो जाती हैं।

3. **🌐 Residential & SOCKS5 Proxy Support**:
   - Environment variable `PROXY_URL` के जरिए आप residential proxy जोड़ सकते हैं, जिससे Datacenter IP का नामोनिशान मिट जाता है।

4. **🔄 Automatic `yt-dlp` Update**:
   - Server startup पर `yt-dlp -U` run करके हमेशा YouTube के latest cipher/SABR fixes को auto-update कर लेता है।

5. **🔍 Detailed Backend Diagnostic Logs**:
   - Terminal logs में clear alerts दिखते हैं:
     - 🚨 `[YOUTUBE_BOT_DETECTION_BLOCKED]`
     - 🍪 `[YOUTUBE_COOKIES_EXPIRED]`
     - 🌍 `[CONTENT_GEO_RESTRICTED]`
     - ⏳ `[RATE_LIMITED]`

---

## 📋 Step-by-Step Setup: YouTube Cookies Export & Upload Guide

YouTube cookies export करने के लिए नीचे दिए गए आसान steps follow करें:

### Step 1: Browser Extension Install करें
1. अपने Chrome, Brave, Edge, या Firefox browser में जाएं।
2. Chrome Web Store से **"Get cookies.txt LOCALLY"** extension install करें:
   - [Chrome Web Store Link](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   *(यह extension open-source और secure है, यह आपका डाटा किसी third-party server पर नहीं भेजता)*

### Step 2: YouTube Cookies Export करें
1. Browser में [https://www.youtube.com](https://www.youtube.com) खोलें और login करें।
   > 💡 **Best Practice Tip**: Cookies export करने के लिए एक secondary / burner Google account का उपयोग करें।
2. YouTube के किसी भी पेज पर रहते हुए **"Get cookies.txt LOCALLY"** extension के icon पर click करें।
3. **"Export"** button पर click करके `cookies.txt` file download करें, या extension window से पूरे text को **Copy** कर लें।

---

### Step 3: Render पर Cookies Setup करें (Choose any 1 method)

#### ✅ Method A: Render Environment Variables (सबसे आसान और Recommended)
1. अपने [Render Dashboard](https://dashboard.render.com/) पर जाएं।
2. अपनी service (`omnidownloader-pro`) पर click करें।
3. Left menu से **Environment** tab में जाएं।
4. **"Add Environment Variable"** पर click करें:
   - **Key**: `YOUTUBE_COOKIES`
   - **Value**: अपनी `cookies.txt` file का पूरा content (text) यहां paste कर दें।
5. **"Save Changes"** पर click करें।
6. Render automatically service को redeploy करेगा और backend logs में दिखेगा:
   `🍪 Cookies Status: ✅ Active (env_content, XXXX bytes) - YouTube bot protection bypass enabled.`

#### 📁 Method B: Render Secret Files
1. Render Dashboard में अपनी service पर जाएं।
2. **Environment** -> **Secret Files** section में जाएं।
3. **"Add Secret File"** पर click करें:
   - **Filename**: `cookies.txt` (यह `/etc/secrets/cookies.txt` पर mount होगा)
   - **Contents**: अपनी `cookies.txt` file का content paste करें।
4. Save करें। App automatically इसे detect कर लेगा।

#### 💻 Method C: Web UI Settings Manager
1. अपनी live deployed website खोलें।
2. Footer या Sidebar से **⚙️ Settings** icon पर click करें।
3. **Cookies / Session Manager** box में अपना cookies text paste करें।
4. **"Save Settings"** पर click करें।

---

## 🌐 Residential Proxy Setup (Optional - 100% Permanent Cloud Solution)

यदि आप cookies बार-बार export नहीं करना चाहते और बिना cookies के 24/7 unlimited downloads चाहते हैं:
1. कोई भी Residential Proxy provider चुनें (जैसे Webshare, IPRoyal, Bright Data, Smartproxy, आदि)।
2. Render Dashboard -> **Environment** में variable जोड़ें:
   - **Key**: `PROXY_URL`
   - **Value**: `http://username:password@proxy-host:port` (या `socks5://username:password@proxy-host:port`)
3. Save करें। सभी YouTube requests इस residential IP के through route होंगी।

---

## 🔍 Verification (चेक कैसे करें कि सब सही काम कर रहा है)

1. Render के **Logs** tab में जाएं।
2. Server start होने पर आपको यह diagnostic banner दिखेगा:
   ```text
   🚀 Multi Downloader Backend Server running on http://localhost:4000
   🎬 Engine Status: yt-dlp ✅ Available (2024.xx.xx), FFmpeg ✅ Available
   🍪 Cookies Status: ✅ Active (env_content, 3500 bytes) - YouTube bot protection bypass enabled.
   📱 YouTube Extractor Clients: android,ios,mweb,web
   ```
3. अब अपनी website पर जाकर कोई भी YouTube Shorts / Video link डालें और **Fetch Info** पर click करें। Video बिना किसी bot error के तुरंत extract और download हो जाएगा!
