const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

function loadMergedConfig() {
  const configPath = path.join(__dirname, '../config/mergedConfig.json');
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    console.log('📂 Config Data:', configData); // JSON verisini ekrana yazdırarak kontrol et
    return JSON.parse(configData);
  } catch (error) {
    console.error('Hata: mergedConfig.json okunamadı veya geçersiz.', error);
    return {};
  }
}

async function uploadVideo(auth, videoFileName) {
  const youtube = google.youtube({
    version: 'v3',
    auth
  });

  // Load merged configuration data
  const mergedConfig = loadMergedConfig();

  // Process videoFileName to extract duration and color.
  console.log('📂 Video dosyasının adı işleniyor...');
  const videoNameParts = path.basename(videoFileName, path.extname(videoFileName)).split(" ");
  const duration = videoNameParts[0]; // örn: "10" veya "1"
  const color = videoNameParts.slice(1).join(" "); // örn: "Countdown Timer 4k"

  // Prepare title by replacing placeholders in defaultTitle using mergedConfig
  console.log('📂 Başlık belirleniyor...');
  let title = mergedConfig.defaultTitle || "{duration} {color} Screen 4K";
  title = title.replace("{duration}", duration).replace("{color}", color);

  // Prepare description using mergedConfig description field.
  console.log('📂 Açıklama hazırlanıyor...');
  let description = mergedConfig.description || "";
  description = description.replace("{duration}", duration);

  // Prepare tags and keywords.
  // For tags, we use the keywords field split by comma.
  console.log('📂 Etiketler ve anahtar kelimeler hazırlanıyor...');
  const keywords = mergedConfig.keywords || "";
  // Split tags by comma and trim them
  const videoTags = keywords.split(',').map(tag => tag.trim());

  // For hashtags, use the hashtags field.
  const videoHashtags = (mergedConfig.hashtags || "").split(' ').filter(tag => tag.startsWith("#"));

  // Define a default playlist ID for all videos (in case needed)
  const playlistId = 'PL5YLVjbz9u8G8lTymnC-R9YCo8EtiB6zt';

  try {
    // Prepare request body for video upload.
    const requestBody = {
      snippet: {
        title,
        description: `${description}\n\n📌 Hashtagler: ${videoHashtags.join(' ')}`,
        tags: videoTags
      },
      status: {
        privacyStatus: 'public'
      }
    };

    console.log('📤 Video yükleme isteği hazırlanıyor:', requestBody);
    const res = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody,
      media: {
        body: fs.createReadStream(path.join(process.env.VIDEO_UPLOAD_DIR, videoFileName))
      }
    });

    console.log(`✅ Video yüklendi: ${videoFileName}`);
    console.log(res.data);

    // Add video to the default playlist
    console.log('📂 Video oynatma listesine ekleniyor...');
    await youtube.playlistItems.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: res.data.id
          }
        }
      }
    });
    console.log(`✅ Video oynatma listesine eklendi: ${playlistId}`);

    // Post a community comment
    console.log('📂 Community gönderisi oluşturuluyor...');
    const communityText = `${title} videosu yüklendi! İzlemek için: https://youtu.be/${res.data.id}`;
    await youtube.comments.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          textOriginal: communityText,
          parentId: res.data.id
        }
      }
    });
    console.log(`✅ Community gönderisi oluşturuldu: https://youtu.be/${res.data.id}`);

    // Upload Shorts video if available, based on color.
    console.log('📂 Shorts videosu yükleniyor...');
    const shortsVideoPath = path.join(process.env.VIDEO_UPLOAD_DIR, `${color}-shorts.mp4`);
    let shortsResponse = null;
    if (fs.existsSync(shortsVideoPath)) {
      shortsResponse = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title: `${color} Shorts Video`,
            description: `This is a ${color} shorts video.`,
            tags: [color, 'shorts']
          },
          status: {
            privacyStatus: 'public'
          }
        },
        media: {
          body: fs.createReadStream(shortsVideoPath)
        }
      });
      console.log(`✅ Shorts video yüklendi: ${shortsVideoPath}`);
    } else {
      console.error(`❌ Shorts video dosyası bulunamadı: ${shortsVideoPath}`);
    }

    // Extended log details merging media and playlist info.
    const extendedLog = {
      uploadedVideoId: res.data.id,
      title,
      duration: `${duration} dakika`,
      color,
      videoFile: videoFileName,
      playlists: {
        default: { id: playlistId, url: `https://www.youtube.com/playlist?list=${playlistId}` },
        // Special color playlist based on the video's color.
        specialColor: mergedConfig.playlists && mergedConfig.playlists.specialColor && mergedConfig.playlists.specialColor[color.toLowerCase()] 
          ? { url: mergedConfig.playlists.specialColor[color.toLowerCase()] }
          : null,
        // Color shorts playlist.
        colorShorts: mergedConfig.playlists && mergedConfig.playlists.colorShorts 
          ? { url: mergedConfig.playlists.colorShorts }
          : null
      },
      community: { url: `https://youtu.be/${res.data.id}` },
      shorts: shortsResponse ? { id: shortsResponse.data.id, url: `https://youtu.be/${shortsResponse.data.id}` } : null,
      extraInfo: {
        tr: mergedConfig.tr || "",
        hashtags: mergedConfig.hashtags || "",
        keywords: mergedConfig.keywords || ""
      }
    };

    console.log("📋 Extended Log:", extendedLog);
    return { ...res.data, extendedLog };
  } catch (error) {
    console.error(`🚨 Video yükleme hatası: ${videoFileName}`, error);
    if (error.response) {
      console.error('🔍 Hata detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        errors: error.response.data.errors,
        request: error.response.request
      });
      if (error.response.status === 400 && error.response.data.errors) {
        error.response.data.errors.forEach(err => {
          if (err.reason === 'invalidTags') {
            console.error(`❌ Geçersiz etiketler: ${videoTags}`);
          }
        });
      }
    }
    return null;
  }
}

module.exports = uploadVideo;
