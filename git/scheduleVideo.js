const fs = require('fs');

async function scheduleVideo(youtube) {
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: 'Başlık',
        description: 'Açıklama',
        tags: ['etiket1', 'etiket2'],
        scheduledStartTime: '2025-02-20T10:00:00Z', // Zamanlayıcı
      },
      status: {
        privacyStatus: 'private',
      },
    },
    media: {
      body: fs.createReadStream('path/to/video.mp4'),
    },
  });

  console.log('Video zamanlandı:', res.data);
}

module.exports = scheduleVideo;