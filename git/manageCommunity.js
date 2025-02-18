/**
 * This module handles the logging and management for Community posts and Shorts videos.
 */

const fs = require('fs');
const path = require('path');

const COMMUNITY_LOGS_PATH = path.join(__dirname, '../logs/communityLog.json');
const SHORTS_LOGS_PATH = path.join(__dirname, '../logs/shortsLog.json');

// Ensure that log files exist.
function ensureLogFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }
}
ensureLogFile(COMMUNITY_LOGS_PATH);
ensureLogFile(SHORTS_LOGS_PATH);

/**
 * Logs a community post event.
 * @param {object} data - Details about the community post. Ex: { videoId, title, url, additionalInfo }
 */
function logCommunityPost(data) {
  const log = {
    timestamp: new Date().toISOString(),
    ...data
  };
  const logData = JSON.stringify(log, null, 2) + '\n';
  fs.appendFileSync(COMMUNITY_LOGS_PATH, logData, 'utf8');
  console.log('📢 Community Log:', log);
}

/**
 * Logs a Shorts video event.
 * @param {object} data - Details about the Shorts video. Ex: { videoId, title, url, additionalInfo }
 */
function logShortsVideo(data) {
  const log = {
    timestamp: new Date().toISOString(),
    ...data
  };
  const logData = JSON.stringify(log, null, 2) + '\n';
  fs.appendFileSync(SHORTS_LOGS_PATH, logData, 'utf8');
  console.log('🎥 Shorts Log:', log);
}

/**
 * Displays the community post logs.
 */
function displayCommunityLogs() {
  if (fs.existsSync(COMMUNITY_LOGS_PATH)) {
    const logs = fs.readFileSync(COMMUNITY_LOGS_PATH, 'utf8');
    console.log('\n📢 Community Gönderileri Logları:');
    console.log(logs);
  } else {
    console.log('Henüz community gönderisi logu yok.');
  }
}

/**
 * Displays the Shorts video logs.
 */
function displayShortsLogs() {
  if (fs.existsSync(SHORTS_LOGS_PATH)) {
    const logs = fs.readFileSync(SHORTS_LOGS_PATH, 'utf8');
    console.log('\n🎥 Shorts Videosu Logları:');
    console.log(logs);
  } else {
    console.log('Henüz shorts video logu yok.');
  }
}

module.exports = {
  logCommunityPost,
  logShortsVideo,
  displayCommunityLogs,
  displayShortsLogs
};