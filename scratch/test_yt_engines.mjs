import axios from 'axios';

const testUrl = 'https://www.youtube.com/watch?v=DeJJ8kmMwwY';
const videoId = 'DeJJ8kmMwwY';

async function testCobalt() {
  console.log('--- Testing Cobalt Instances ---');
  const instances = [
    'https://api.cobalt.tools',
    'https://cobalt-api.kwiatekm.pl',
    'https://co.wuk.sh',
    'https://cobalt.hyonsu.com',
  ];

  for (const inst of instances) {
    try {
      console.log(`Trying ${inst}...`);
      const res = await axios.post(`${inst}/`, {
        url: testUrl,
        videoQuality: '720',
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        timeout: 5000,
      });
      console.log(`✅ Cobalt [${inst}] response:`, res.data);
      if (res.data?.url) return res.data.url;
    } catch (err) {
      console.log(`❌ Cobalt [${inst}] failed:`, err.message);
    }
  }
}

async function testY2Mate() {
  console.log('\n--- Testing Y2Mate API ---');
  try {
    const form = new URLSearchParams();
    form.append('k_query', testUrl);
    form.append('k_page', 'home');
    form.append('hl', 'en');
    form.append('q_auto', '0');

    const res = await axios.post('https://www.y2mate.com/mates/analyzeV2/ajax', form.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 6000,
    });
    console.log('✅ Y2Mate analyze response status:', res.data?.status);
    if (res.data?.links) {
      console.log('Y2Mate formats available:', Object.keys(res.data.links));
      const mp4Formats = res.data.links.mp4 || {};
      const firstK = Object.values(mp4Formats)[0];
      console.log('Sample mp4 key:', firstK?.k, firstK?.q);
      if (firstK?.k) {
        const convertForm = new URLSearchParams();
        convertForm.append('k', firstK.k);
        convertForm.append('vid', res.data.vid || videoId);
        const convRes = await axios.post('https://www.y2mate.com/mates/convertV2/index', convertForm.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
          },
          timeout: 8000,
        });
        console.log('✅ Y2Mate converted download link:', convRes.data?.dlink || convRes.data);
      }
    }
  } catch (err) {
    console.log('❌ Y2Mate failed:', err.message);
  }
}

async function testSaveFrom() {
  console.log('\n--- Testing SaveFrom API ---');
  try {
    const res = await axios.post('https://worker.sf-helper.com/project/api/video/fetch', {
      url: testUrl,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 6000,
    });
    console.log('✅ SaveFrom response:', res.data);
  } catch (err) {
    console.log('❌ SaveFrom failed:', err.message);
  }
}

async function run() {
  await testCobalt();
  await testY2Mate();
  await testSaveFrom();
}

run();
