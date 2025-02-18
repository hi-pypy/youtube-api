const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

async function uploadVideosSequentially(auth, videoFiles) {
  const youtube = google.youtube({ version: 'v3', auth });

  const playlistId = 'PL5YLVjbz9u8G8lTymnC-R9YCo8EtiB6zt'; // Mevcut oynatma listesi ID'si

  const titles = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/title.json'), 'utf8'));
  const descriptions = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/explain.json'), 'utf8'));
  const tags = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/tags.json'), 'utf8'));
  const shortsBio = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/shortsbio.json'), 'utf8'));

  // Geçersiz anahtar kelimeleri filtrelemek için fonksiyon
  const filterInvalidTags = (tags) => {
    const validTagPattern = /^[a-zA-Z0-9\s]+$/;
    const maxLength = 30;
    return tags.filter(tag => validTagPattern.test(tag) && tag.length <= maxLength);
  };

  for (const videoFile of videoFiles) {
    let videoTags = [];

    try {
      const [duration, color] = path.basename(videoFile, path.extname(videoFile)).split(" ");

      const titleTemplate = titles[0];
      const title = titleTemplate.replace("{duration}", duration);

      const descriptionTemplate = descriptions[0].description;
      const description = descriptionTemplate.replace("{duration}", duration);

      // Video etiketlerini oluştur
      videoTags = filterInvalidTags(tags.keywords.map(tag => tag.replace("{duration}", duration)));

      console.log(`⏫ Video yükleniyor: ${videoFile}`);
      console.log(`📛 Başlık: ${title}`);
      console.log(`📝 Açıklama: ${description}`);
      console.log(`🏷️ Etiketler: ${videoTags}`);

      const videoPath = path.join(process.env.VIDEO_UPLOAD_DIR, videoFile);
      if (!fs.existsSync(videoPath)) {
        console.error(`❌ Dosya bulunamadı: ${videoPath}`);
        continue;
      }

      // Video yükleme
      const res = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title,
            description,
            tags: videoTags,
          },
          status: {
            privacyStatus: 'public',
          },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      });

      console.log('✅ Video yüklendi:', res.data);

      // Video'yu oynatma listesine ekleme
      await youtube.playlistItems.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: res.data.id,
            },
          },
        },
      });

      console.log(`📺 Video oynatma listesine eklendi: ${playlistId}`);

      // Yüklenen video bilgilerini loglama
      const sharedLog = `title: ${title}\nurl: https://youtu.be/${res.data.id}\nlog: ${new Date().toISOString()}\n\n`;
      fs.appendFileSync('shared.txt', sharedLog, 'utf8');

      // Community verilerini oluşturma ve loglama
      const communityData = {
        title: `${color} ekran ${duration} dakika`,
        description: `Bu, ${duration} dakikalık bir ${color} ekran videosudur. İzlemek için: https://youtu.be/${res.data.id}`,
        shorts: `shorts/${color}.mp4`,
        img: `img/${color}.png`
      };
      fs.writeFileSync('community.json', JSON.stringify(communityData, null, 2), 'utf8');
      console.log('📂 Community verileri kaydedildi:', communityData);

      // Shorts videosu paylaşımı
      const shortsTitle = shortsBio[color].title;
      const shortsDescription = shortsBio[color].description;

      const shortsVideoPath = path.join(process.env.SHORTS_VIDEO_DIR, `${color}-shorts.mp4`);
      if (fs.existsSync(shortsVideoPath)) {
        await youtube.videos.insert({
          part: 'snippet,status',
          requestBody: {
            snippet: {
              title: shortsTitle,
              description: shortsDescription,
              tags: [color, 'shorts', 'screen'],
            },
            status: {
              privacyStatus: 'public',
            },
          },
          media: {
            body: fs.createReadStream(shortsVideoPath),
          },
        });

        console.log(`🎬 Shorts video paylaşıldı: ${shortsVideoPath}`);
      } else {
        console.error(`❌ Shorts video dosyası bulunamadı: ${shortsVideoPath}`);
      }

    } catch (error) {
      if (error.message.includes('The user has exceeded the number of videos they may upload')) {
        console.error('❌ Yükleme limiti aşıldı. Lütfen daha sonra tekrar deneyin.');
        break;
      } else if (error.message.includes('The request metadata specifies invalid video keywords')) {
        console.error('❌ Geçersiz video etiketleri tespit edildi:', videoTags);
        console.error('Error details:', error);
        break;
      } else {
        console.error(`🚨 Hata oluştu: ${error.message}`);
      }
      // API'yi aşırı yüklememek için kısa bir süre bekleyelim
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 dakika bekle
    }
  }
}

module.exports = uploadVideosSequentially;