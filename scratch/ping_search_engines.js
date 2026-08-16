const https = require('https');

const host = 'omnidownloader-u8w9.onrender.com';
const key = '8a649fb920a0491cbcd88db9a365f57f';
const keyLocation = `https://${host}/${key}.txt`;
const urlList = [
  `https://${host}/`,
  `https://${host}/#youtube-downloader`,
  `https://${host}/#instagram-reels-downloader`,
  `https://${host}/#tiktok-downloader`,
  `https://${host}/#facebook-video-downloader`,
  `https://${host}/#mp3-converter`,
  `https://${host}/#twitter-video-downloader`,
  `https://${host}/#pinterest-downloader`
];

// Helper to make GET requests
function pingGet(name, url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`[${name}] Status: ${res.statusCode}`);
        resolve({ name, status: res.statusCode });
      });
    }).on('error', (e) => {
      console.log(`[${name}] Error: ${e.message}`);
      resolve({ name, error: e.message });
    });
  });
}

// Helper to post IndexNow payloads
function submitIndexNow(apiHost) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      host,
      key,
      keyLocation,
      urlList
    });

    const req = https.request({
      hostname: apiHost,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`[IndexNow - ${apiHost}] Status: ${res.statusCode} (${res.statusMessage})`);
        resolve({ host: apiHost, status: res.statusCode });
      });
    });

    req.on('error', (e) => {
      console.log(`[IndexNow - ${apiHost}] Error: ${e.message}`);
      resolve({ host: apiHost, error: e.message });
    });

    req.write(payload);
    req.end();
  });
}

async function runAll() {
  console.log('🚀 Initiating Universal Search Engine Submission & IndexNow Broadcast...');

  // 1. Google Sitemap Ping
  await pingGet('Google Sitemap Ping', `https://www.google.com/ping?sitemap=https://${host}/sitemap.xml`);

  // 2. Bing & Yahoo Sitemap Ping
  await pingGet('Bing/Yahoo Sitemap Ping', `https://www.bing.com/ping?sitemap=https://${host}/sitemap.xml`);

  // 3. IndexNow Global Dispatch (Bing, Yahoo, DuckDuckGo, Naver, Seznam)
  await submitIndexNow('api.indexnow.org');
  await submitIndexNow('www.bing.com');
  await submitIndexNow('yandex.com');

  console.log('✅ Universal search engine ping & IndexNow broadcast completed successfully!');
}

runAll();
