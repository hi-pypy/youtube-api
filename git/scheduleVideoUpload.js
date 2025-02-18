const cron = require('node-cron');
const uploadVideosSequentially = require('./uploadVideosSequentially');
const authorize = require('./authorize');

async function scheduleVideoUpload() {
  const videoFiles = [
    '1 Min Countdown Timer 4k.mp4',
    '2 Min Countdown Timer 4k.mp4',
    // Diğer video dosyaları
  ];

  // Her gün belirli bir saatte video yükleme
  cron.schedule('0 12 * * *', () => { // Bu satırda '0 12 * * *' ifadesini değiştirerek saati ayarlayabilirsiniz
    authorize(SCOPES, async (auth) => {
      await uploadVideosSequentially(auth, videoFiles);
    });
  });

  console.log('Video yükleme zamanlayıcı başlatıldı.');
}

module.exports = scheduleVideoUpload;