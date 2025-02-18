const fs = require('fs');
const path = require('path');

const CHANNEL_NAME = process.env.CHANNEL_NAME || "Default Channel"; // Use channel name from ENV variable
const YOUTUBE_BASE_URL = process.env.YOUTUBE_BASE_URL || "https://youtu.be/"; // Base URL for YouTube videos

// Predefined tags for different colors
const COLOR_TAGS = {
  red: ["red screen", "red screensaver", "red screen 10 min", "red screen 10 hours"],
  black: ["black screen", "black screensaver", "black screen 10 min", "black screen 10 hours"],
  white: ["white screen", "white screensaver", "white screen 10 min", "white screen 10 hours"],
  // Add more colors as needed
};

/**
 * Immediately share a selected media file.
 * @param {string} mediaFilePath - The full path of the media file to share.
 */
function shareNow(mediaFilePath) {
  if (!fs.existsSync(mediaFilePath)) {
    console.error(`❌ Medya dosyası bulunamadı: ${mediaFilePath}`);
    return;
  }
  const color = getColorFromFilename(mediaFilePath);
  const tags = COLOR_TAGS[color] || [];
  const title = `${color.charAt(0).toUpperCase() + color.slice(1)} Screen 4K`;
  const description = `This is a ${color} screen video. Enjoy the ${color} ambience.`;
  const url = `${YOUTUBE_BASE_URL}${path.basename(mediaFilePath, '.mp4')}`;
  console.log(`🚀 Medya şimdi paylaşıldı: ${mediaFilePath}`);
  console.log(`🔗 Paylaşılan Medya URL'si: ${url}`);
  console.log(`📺 İşlem Yapılan Kanal: ${CHANNEL_NAME}`);
  console.log(`📂 Başlık: ${title}`);
  console.log(`📂 Açıklama: ${description}`);
  console.log(`📂 Etiketler: ${tags.join(', ')}`);
  
  const logPath = path.join(__dirname, '../logs/shareNowLog.json');
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: 'shareNow',
    media: mediaFilePath,
    url,
    channel: CHANNEL_NAME,
    title,
    description,
    tags
  };
  fs.appendFileSync(logPath, JSON.stringify(logEntry, null, 2) + '\n', 'utf8');
}

/**
 * Shares a random media file from the designated Shorts folder.
 * Adds color tag information based on the file name, displays a generated URL and channel info.
 * @param {string} shortsDir - The directory that contains Shorts video files.
 */
function shareRandomShorts(shortsDir) {
  if (!fs.existsSync(shortsDir)) {
    console.error(`❌ Shorts dizini bulunamadı: ${shortsDir}`);
    return;
  }
  const mediaFiles = fs.readdirSync(shortsDir).filter(file => file.endsWith('.mp4'));
  if (mediaFiles.length === 0) {
    console.log('ℹ️ Shorts dosyası bulunamadı.');
    return;
  }
  const randomIndex = Math.floor(Math.random() * mediaFiles.length);
  const selectedFile = mediaFiles[randomIndex];
  const fullPath = path.join(shortsDir, selectedFile);
  
  const color = getColorFromFilename(selectedFile);
  const tags = COLOR_TAGS[color] || [];
  const title = `${color.charAt(0).toUpperCase() + color.slice(1)} Screen 4K`;
  const description = `This is a ${color} screen video. Enjoy the ${color} ambience.`;
  const url = `${YOUTUBE_BASE_URL}${selectedFile.split('.mp4')[0]}`;
  console.log(`🚀 Shorts video paylaşıldı: ${selectedFile}`);
  console.log(`✅ Renk etiketi: ${color}`);
  console.log(`🔗 Paylaşılan Shorts URL'si: ${url}`);
  console.log(`📂 Başlık: ${title}`);
  console.log(`📂 Açıklama: ${description}`);
  console.log(`📂 Etiketler: ${tags.join(', ')}`);
  
  const logPath = path.join(__dirname, '../logs/shortsShareLog.json');
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: 'shareRandomShorts',
    media: selectedFile,
    fullPath,
    colorTag: color,
    url,
    channel: CHANNEL_NAME,
    title,
    description,
    tags
  };
  fs.appendFileSync(logPath, JSON.stringify(logEntry, null, 2) + '\n', 'utf8');
}

/**
 * Shares a community post and, optionally, creates a poll.
 * @param {string} message - The text of the community post.
 * @param {object} [pollOptions] - Optional poll data containing a question and list of choices.
 */
function shareCommunity(message, pollOptions = null) {
  const url = `https://www.youtube.com/community_post/${Buffer.from(message).toString('hex').slice(0,8)}`;
  console.log(`🚀 Community gönderisi paylaşıldı: "${message}"`);
  console.log(`🔗 Community gönderi URL'si: ${url}`);
  console.log(`📺 İşlem Yapılan Kanal: ${CHANNEL_NAME}`);
  
  let pollResult = null;
  if (pollOptions && pollOptions.question && Array.isArray(pollOptions.choices)) {
    pollResult = createPoll(pollOptions.question, pollOptions.choices);
    console.log('✅ Anket oluşturuldu:', pollResult);
  }
  
  const logPath = path.join(__dirname, '../logs/communityShareLog.json');
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: 'shareCommunity',
    message,
    url,
    channel: CHANNEL_NAME,
    poll: pollResult
  };
  fs.appendFileSync(logPath, JSON.stringify(logEntry, null, 2) + '\n', 'utf8');
}

/**
 * Simulates poll creation.
 * @param {string} question - The poll question.
 * @param {string[]} choices - Array of choices.
 * @returns {object} The simulated poll result.
 */
function createPoll(question, choices) {
  const poll = {
    id: Math.random().toString(36).substring(2, 10),
    question,
    choices,
    createdAt: new Date().toISOString()
  };
  return poll;
}

/**
 * Extracts color from the file name.
 * @param {string} filename - The file name.
 * @returns {string} The color.
 */
function getColorFromFilename(filename) {
  const lowerName = filename.toLowerCase();
  const colors = ['red', 'black', 'white', 'gray', 'green'];
  for (const color of colors) {
    if (lowerName.includes(color)) {
      return color;
    }
  }
  return 'default';
}

module.exports = {
  shareNow,
  shareRandomShorts,
  shareCommunity,
  createPoll
};