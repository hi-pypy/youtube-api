/**
 * Dummy function to simulate video upload.
 * @param {object} auth - Authentication object
 * @param {string} videoFileName - Name of the video file to upload
 * @returns {Promise<object>} - A promise that resolves with a sample response.
 */
function uploadVideo(auth, videoFileName) {
  return new Promise((resolve) => {
    console.log(`Simulating upload for video: ${videoFileName}`);
    // Simulated result after upload
    resolve({ videoId: 'dummy-video-id', videoFileName });
  });
}

module.exports = {
  uploadVideo
};