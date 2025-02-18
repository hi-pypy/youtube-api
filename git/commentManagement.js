async function commentManagement(youtube, videoId) {
  try {
    const res = await youtube.commentThreads.list({
      part: 'snippet',
      videoId: videoId,
      maxResults: 10,
    });

    res.data.items.forEach(async (comment) => {
      try {
        const commentText = comment.snippet.topLevelComment.snippet.textDisplay;
        console.log(`Yorum: ${commentText}`);

        // Otomatik yanıt
        await youtube.comments.insert({
          part: 'snippet',
          requestBody: {
            snippet: {
              parentId: comment.snippet.topLevelComment.id,
              textOriginal: 'Bizi takip edin, paylaşın, beğenin!',
            },
          },
        });

        console.log('Otomatik yanıt gönderildi.');
      } catch (error) {
        console.error(`Yorum yanıtı eklenirken hata oluştu: ${error.message}`);
      }
    });
  } catch (error) {
    console.error(`Yorumlar alınırken hata oluştu: ${error.message}`);
  }
}

module.exports = commentManagement;