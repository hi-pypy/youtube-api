const schedule = require('node-schedule');
const fs = require('fs');

/**
 * Schedule a video sharing task.
 * @param {string} videoFilePath - The full path of the video file.
 * @param {string} shareType - The type of sharing (e.g. "Şimdi Yayınla", "Shorts", "Community").
 * @param {Date} scheduledDateTime - The date/time when the sharing should occur.
 * @param {function} callback - A callback function to execute when the scheduled time is reached.
 */
function scheduleVideoSharing(videoFilePath, shareType, scheduledDateTime, callback) {
  if (!fs.existsSync(videoFilePath)) {
    console.error(`❌ Video dosyası bulunamadı: ${videoFilePath}`);
    return;
  }
  const job = schedule.scheduleJob(scheduledDateTime, () => {
    console.log(`⏰ Zamanlandı: ${videoFilePath} için ${shareType} paylaşımı başlatılıyor.`);
    callback(videoFilePath, shareType);
  });
  console.log(`✅ ${shareType} paylaşımı için planlama yapıldı: ${videoFilePath} at ${scheduledDateTime}`);
}

/**
 * Dummy function for scheduling video uploads.
 *
 * @param {string} videoFileName - The video file to be uploaded.
 * @param {Date} uploadTime - The scheduled time for uploading the video.
 */
function scheduleVideoUploads(videoFileName, uploadTime) {
  console.log(`Scheduling video upload for ${videoFileName} at ${uploadTime.toLocaleTimeString()}`);
}

module.exports = {
  scheduleVideoSharing,
  scheduleVideoUploads
};