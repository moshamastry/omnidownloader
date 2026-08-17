import { Innertube, UniversalCache } from 'youtubei.js';

async function testYouTubeI() {
  try {
    console.log('Initializing YouTube.js (Innertube)...');
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
    console.log('Fetching video info for DeJJ8kmMwwY...');
    const info = await yt.getInfo('DeJJ8kmMwwY');
    console.log('Title:', info.basic_info.title);
    console.log('Duration:', info.basic_info.duration);
    console.log('Formats count:', info.streaming_data?.formats?.length);
    console.log('Adaptive formats count:', info.streaming_data?.adaptive_formats?.length);
    if (info.streaming_data?.formats?.length > 0) {
      console.log('Direct progressive MP4 URL available!');
    }
  } catch (err) {
    console.error('YouTube.js test error:', err.message);
  }
}

testYouTubeI();
