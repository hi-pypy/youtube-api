/**
 * Dummy instagramManager file.
 * Simulates sharing of a video on Instagram.
 *
 * @param {string} videoFileName - The name of the video file.
 * @param {object} result - The result object from the upload process.
 */
function shareOnInstagram(videoFileName, result) {
  console.log(`Simulating Instagram sharing for video: ${videoFileName}`);
  console.log('Share result:', result);
}

module.exports = {
  shareOnInstagram
};