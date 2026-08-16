import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFDownloader(url) {
  try {
    console.log('Testing FDownloader for:', url);
    const form = new URLSearchParams();
    form.append('k_exp', '');
    form.append('k_token', '');
    form.append('q', url);
    form.append('t', 'media');
    form.append('lang', 'en');
    form.append('v', 'v2');

    const res = await axios.post('https://fdownloader.net/api/ajaxSearch', form.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://fdownloader.net',
        'Referer': 'https://fdownloader.net/en',
      },
      timeout: 10000,
    });

    console.log('FDownloader response status:', res.status);
    console.log('FDownloader data keys:', Object.keys(res.data));
    if (res.data.data) {
      const $ = cheerio.load(res.data.data);
      const links = [];
      $('a.button, a.btn, a[href*="fbcdn"], a[href*="video"]').each((_, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim();
        if (href && !href.startsWith('#') && !href.startsWith('javascript')) {
          links.push({ text, href });
        }
      });
      console.log('Found download links in FDownloader:', links);
      return links;
    }
  } catch (err) {
    console.log('FDownloader error:', err.message);
  }
}

async function testSnapSaveApp(url) {
  try {
    console.log('\nTesting SnapSave for:', url);
    const form = new URLSearchParams();
    form.append('url', url);

    const res = await axios.post('https://snapsave.app/action.php?lang=en', form.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://snapsave.app/',
        'Origin': 'https://snapsave.app',
      },
      timeout: 10000,
    });

    console.log('SnapSave raw length:', res.data.length);
    console.log('SnapSave raw snippet:', res.data.slice(0, 200));
  } catch (err) {
    console.log('SnapSave error:', err.message);
  }
}

async function run() {
  const url = 'https://www.facebook.com/reel/1260102462706817';
  await testFDownloader(url);
  await testSnapSaveApp(url);
}

run();
