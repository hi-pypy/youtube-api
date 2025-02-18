async function playlistManagement(youtube, videoId, playlistId) {
  const res = await youtube.playlistItems.insert({
    part: 'snippet',
    requestBody: {
      snippet: {
        playlistId: playlistId, // Gelen playlist ID'yi kullan
        resourceId: {
          kind: 'youtube#video',
          videoId: videoId,
        },
      },
    },
  });

  console.log('Video playlist\'e eklendi:', res.data);
}

module.exports = playlistManagement;