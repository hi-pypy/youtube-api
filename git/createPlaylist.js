const { google } = require('googleapis');

async function createPlaylist(auth) {
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.playlists.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: 'Yeni Oynatma Listesi',
          description: 'Bu, manuel olarak oluşturulan bir oynatma listesidir.',
        },
        status: {
          privacyStatus: 'private',
        },
      },
    });

    console.log('Oynatma listesi oluşturuldu:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('Oynatma listesi oluşturulurken hata oluştu:', error);
  }
}

module.exports = createPlaylist;