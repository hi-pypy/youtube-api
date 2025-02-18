const { google } = require('googleapis');

async function getChannelDetails(auth) {
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.channels.list({
      part: 'snippet,contentDetails,statistics',
      mine: true,
    });

    console.log('Kanal Detayları:', response.data);
  } catch (error) {
    console.error('Kanal detaylarını alırken hata oluştu:', error);
  }
}

module.exports = getChannelDetails;