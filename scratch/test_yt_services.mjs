import axios from 'axios';

const videoId = 'DeJJ8kmMwwY';
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

// Test YT1s
async function testYt1s() {
  console.log('Testing YT1s...');
  try {
    const form = new URLSearchParams();
    form.append('q', videoUrl);
    form.append('vt', 'home');

    const res = await axios.post('https://yt1s.com/api/ajaxSearch/index', form.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 5000,
    });
    console.log('✅ YT1s Search response status:', res.data?.status, res.data?.title);
    if (res.data?.links?.mp4) {
      console.log('YT1s Formats:', Object.keys(res.data.links.mp4));
      const firstK = Object.values(res.data.links.mp4)[0];
      const convForm = new URLSearchParams();
      convForm.append('vid', res.data.vid || videoId);
      convForm.append('k', firstK.k);
      const convRes = await axios.post('https://yt1s.com/api/ajaxConvert/index', convForm.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        timeout: 5000,
      });
      console.log('✅ YT1s Direct Link:', convRes.data?.dlink?.slice(0, 80));
      return convRes.data?.dlink;
    }
  } catch (err) {
    console.log('❌ YT1s failed:', err.message);
  }
}

// Test YT5s
async function testYt5s() {
  console.log('\nTesting YT5s...');
  try {
    const form = new URLSearchParams();
    form.append('q', videoUrl);
    form.append('vt', 'mp4');

    const res = await axios.post('https://yt5s.biz/api/ajaxSearch/index', form.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 5000,
    });
    console.log('✅ YT5s Search response:', res.data?.status, res.data?.title);
    if (res.data?.links?.mp4) {
      const firstK = Object.values(res.data.links.mp4)[0];
      const convForm = new URLSearchParams();
      convForm.append('vid', res.data.vid || videoId);
      convForm.append('k', firstK.k);
      const convRes = await axios.post('https://yt5s.biz/api/ajaxConvert/index', convForm.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        timeout: 5000,
      });
      console.log('✅ YT5s Direct Link:', convRes.data?.dlink?.slice(0, 80));
      return convRes.data?.dlink;
    }
  } catch (err) {
    console.log('❌ YT5s failed:', err.message);
  }
}

// Test 10downloader
async function test10Downloader() {
  console.log('\nTesting 10Downloader...');
  try {
    const res = await axios.get(`https://api.10downloader.com/meta?url=${encodeURIComponent(videoUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      timeout: 5000,
    });
    console.log('✅ 10downloader response:', res.data);
  } catch (err) {
    console.log('❌ 10downloader failed:', err.message);
  }
}

// Test ytdl.online
async function testYtdlOnline() {
  console.log('\nTesting ytdl.online...');
  try {
    const form = new URLSearchParams();
    form.append('url', videoUrl);
    const res = await axios.post('https://ytdl.online/api/convert', form.toString(), {
      timeout: 5000,
    });
    console.log('✅ ytdl.online response:', res.data);
  } catch (err) {
    console.log('❌ ytdl.online failed:', err.message);
  }
}

async function run() {
  await testYt1s();
  await testYt5s();
  await test10Downloader();
  await testYtdlOnline();
}

run();
