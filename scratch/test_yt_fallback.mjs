import axios from 'axios';

async function testYouTubeStreamFallback(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (!match || !match[1]) {
    console.log('No video id found');
    return;
  }
  const videoId = match[1];
  console.log('Testing video ID:', videoId);

  const instances = [
    'https://inv.tux.pizza',
    'https://invidious.projectsegfau.lt',
    'https://invidious.drgns.space',
    'https://vid.puffyan.us',
    'https://invidious.nerdvpn.de',
  ];

  for (const inst of instances) {
    try {
      console.log(`Trying ${inst}...`);
      const res = await axios.get(`${inst}/api/v1/videos/${videoId}`, {
        timeout: 6000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        }
      });
      if (res.data && (res.data.formatStreams?.length > 0 || res.data.adaptiveFormats?.length > 0)) {
        console.log('✅ Success on instance:', inst);
        console.log('Title:', res.data.title);
        const streams = res.data.formatStreams || [];
        console.log('Available progressive streams:', streams.map(s => `${s.qualityLabel} (${s.container})`));
        if (streams.length > 0) {
          console.log('Best stream URL:', streams[0].url?.slice(0, 100) + '...');
          return {
            title: res.data.title,
            streamUrl: streams[0].url,
          };
        }
      }
    } catch (err) {
      console.log(`Failed on ${inst}:`, err.message);
    }
  }
}

testYouTubeStreamFallback('https://youtube.com/shorts/DeJJ8kmMwwY');
