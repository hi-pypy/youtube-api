/**
 * Dummy function to simulate sharing a video on Telegram.
 * @param {string} videoFileName - Name of the video file.
 * @param {object} result - The result data from the upload.
 */
function shareOnTelegram(videoFileName, result) {
  console.log(`Simulating Telegram share for video: ${videoFileName}`);
  console.log('Share result:', result);
}

module.exports = {
  shareOnTelegram
};