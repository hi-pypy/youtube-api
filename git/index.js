require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const schedule = require('node-schedule');
const { authorize, SCOPES } = require('./auth');
const { uploadVideo } = require('./videoUpload');
const telegramManager = require('./telegramManager');
const instagramManager = require('./instagramManager');
const communityManager = require('./communityManager');
const mediaManager = require('./mediaManager');
const accountManager = require('./accountManager');
const scheduleManager = require('./scheduleManager');

const LOG_PATH = path.join(__dirname, '../logs/upload.log');
const STATUS_LOG_PATH = path.join(__dirname, '../logs/status.log');
const MAX_LOG_SIZE = 1024 * 1024 * 10; // 10MB

async function main() {
  try {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
      throw new Error('⚠️ .env dosyası bulunamadı. Lütfen gerekli çevresel değişkenleri tanımlayın.');
    }
    const requiredEnvVars = ['VIDEO_UPLOAD_DIR'];
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        throw new Error(`⚠️ Çevresel değişken tanımlı değil: ${varName}`);
      }
    });
    const auth = await authorize(SCOPES);
    const videoUploadDir = process.env.VIDEO_UPLOAD_DIR;
    const videoFiles = fs.readdirSync(videoUploadDir).filter(file => file.endsWith('.mp4'));
    
    console.log(`📂 Toplam bekleyen video sayısı: ${videoFiles.length}`);
    const plannedUploadCount = Math.min(5, videoFiles.length);
    const uploadTimes = [
      { hour: 12, minute: 0 },
      { hour: 14, minute: 0 },
      { hour: 16, minute: 0 },
      { hour: 18, minute: 0 },
      { hour: 20, minute: 0 },
      { hour: 21, minute: 0 },
      { hour: 22, minute: 0 }
    ];
    
    let uploadedCount = 0;
    for (const { hour, minute } of uploadTimes) {
      if (uploadedCount < plannedUploadCount) {
        const uploadTime = new Date();
        uploadTime.setHours(hour, minute, 0, 0);
        console.log(`⏰ Planlanan yükleme: ${videoFiles[uploadedCount]} için zaman: ${uploadTime.toLocaleTimeString()}`);
        schedule.scheduleJob(uploadTime, async () => {
          try {
            await uploadVideo(auth, videoFiles[uploadedCount]);
            uploadedCount++;
            console.log(`📊 Günlük yükleme durumu: ${uploadedCount}/${plannedUploadCount} video yüklendi`);
            logStatus({ nextVideo: videoFiles[uploadedCount], status: 'scheduled', uploadTime });
          } catch (error) {
            console.error(`🚨 Yükleme sırasında hata: ${error.message}`);
            logStatus({ nextVideo: videoFiles[uploadedCount], status: 'error', error: error.message });
          }
        });
      }
    }
    
    console.log('🚀 Video yükleme programı başlatıldı.');
    displayMenu();
  } catch (error) {
    console.error('❌ Ana fonksiyonda hata:', error.message);
    logStatus({ status: 'error', error: error.message });
    displayMenu();
  }
}



// Retrieve the video uploads directory from the environment variable.
const VIDEO_UPLOAD_DIR = process.env.VIDEO_UPLOAD_DIR;

if (!VIDEO_UPLOAD_DIR) {
  console.error('❌ VIDEO_UPLOAD_DIR is not defined in environment variables.');
  process.exit(1);
}

/**
 * Checks if the given directory exists; if not, creates it.
 * @param {string} dirPath - The directory path to check/create.
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory not found: ${dirPath}. Creating directory...`);
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Directory created: ${dirPath}`);
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}: ${error.message}`);
      process.exit(1);
    }
  }
}



// Helper function to log status messages
function logStatus(statusObj) {
  const statusData = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...statusObj
  }, null, 2) + '\n';
  fs.appendFileSync(STATUS_LOG_PATH, statusData, 'utf8');
}

/**
 * Log upload details
 */
function logUpload(status, videoFileName, details) {
  const log = {
    timestamp: new Date().toISOString(),
    status,
    videoFileName,
    details
  };
  console.log('📝 Log:', log);
  const logData = JSON.stringify(log, null, 2) + '\n';
  if (fs.existsSync(LOG_PATH)) {
    const stats = fs.statSync(LOG_PATH);
    if (stats.size > MAX_LOG_SIZE) {
      const newLogPath = LOG_PATH.replace('.json', `_${Date.now()}.json`);
      fs.renameSync(LOG_PATH, newLogPath);
      console.log(`🗃️ Log dosyası maksimum boyuta ulaştı, yeni dosya oluşturuldu: ${newLogPath}`);
    }
  }
  fs.appendFileSync(LOG_PATH, logData, 'utf8');
}

/**
 * Log status details
 */
function logStatus(status) {
  const logData = JSON.stringify(status, null, 2) + '\n';
  fs.appendFileSync(STATUS_LOG_PATH, logData, 'utf8');
  console.log('📊 Durum:', status);
}

/**
 * Upload a scheduled video
 */
async function uploadScheduledVideo(auth, videoFileName) {
  try {
    console.log(`📤 Yükleniyor: ${videoFileName} (%0)`);
    console.log(`📂 İçerik okunuyor: ${videoFileName}`);
    console.log('📂 Başlık, açıklama, etiketler, kartlar, altyazılar hazırlanıyor...');
    const result = await uploadVideo(auth, videoFileName);
    if (result) {
      console.log(`✅ Video yüklendi: ${videoFileName} (%100)`);
      logUpload('success', videoFileName, result);
      logStatus({ currentVideo: videoFileName, status: 'uploaded' });
      telegramManager.shareOnTelegram(videoFileName, result);
      instagramManager.shareOnInstagram(videoFileName, result);
    } else {
      console.log(`❌ Video yüklenemedi: ${videoFileName}`);
      logUpload('failed', videoFileName, result);
      logStatus({ currentVideo: videoFileName, status: 'failed' });
    }
  } catch (error) {
    console.error(`🚨 Video yükleme hatası: ${videoFileName}`, error);
    logUpload('error', videoFileName, error.message);
    logStatus({ currentVideo: videoFileName, status: 'error', error: error.message });
  }
}

/**
 * Displays the main menu.
 */



/**
 * Displays the main menu.
 */
function displayMenu() {
  console.log('\n--- MENU ---');
  console.log('1. Günlük Yükleme Durumu');
  console.log('2. Bekleyen Videolar');
  console.log('3. Video Detayları');
  console.log('4. Gelişmiş İşlemler');
  console.log('5. Shorts & Community Yönetimi');
  console.log('6. Medya Paylaşımları');
  console.log('7. Hesap Yönetimi');
  console.log('8. Schedule Yönetimi');
  console.log('9. Çıkış');
  // Insert menu prompt logic here...
}

/**
 * Displays pending videos. It first validates that the VIDEO_UPLOAD_DIR environment variable is defined.
 */


// Start the application
main().catch(console.error);



function displayPendingVideos() {
  const videoUploadDir = process.env.VIDEO_UPLOAD_DIR;
  if (!videoUploadDir) {
    console.error('⚠️ Çevresel değişken tanımlı değil: VIDEO_UPLOAD_DIR');
    displayMenu();
    return;
  }
  const videoFiles = fs.readdirSync(videoUploadDir).filter(file => file.endsWith('.mp4'));
  console.log('\n📁 Bekleyen Videolar:');
  if (videoFiles.length > 0) {
    videoFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
  } else {
    console.log('Bekleyen video yok.');
  }
  displayMenu();
}

/**
 * Displays video details by reading the status log file.
 */
function displayVideoDetails() {
  let statusLog = [];
  if (fs.existsSync(STATUS_LOG_PATH)) {
    try {
      statusLog = JSON.parse(fs.readFileSync(STATUS_LOG_PATH, 'utf8'));
    } catch (e) {
      console.error('Video detaylarını okurken hata oluştu:', e);
      displayMenu();
      return;
    }
  }
  console.log('\n📄 Video Detayları:');
  if (statusLog.length > 0) {
    const failedVideos = statusLog.filter(log => log.status === 'failed').length;
    const scheduledVideos = statusLog.filter(log => log.status === 'scheduled').length;
    const uploadedVideos = statusLog.filter(log => log.status === 'uploaded').length;
    console.log(`Toplam Video: ${statusLog.length}`);
    console.log(`Başarılı Yüklemeler: ${uploadedVideos}`);
    console.log(`Başarısız Yüklemeler: ${failedVideos}`);
    console.log(`Planlanmış Yüklemeler: ${scheduledVideos}`);
    console.log('\nDetaylar:');
    statusLog.forEach((log, index) => {
      console.log(`${index + 1}. Dosya: ${log.currentVideo || log.nextVideo}`);
      console.log(`   Durum: ${log.status}`);
      if (log.status === 'scheduled') {
        console.log(`   Planlanan Zaman: ${log.uploadTime}`);
      }
      if (log.status === 'failed') {
        console.log(`   Hata: ${log.error}`);
      }
    });
  } else {
    console.log('📄 Henüz video detayları yok.');
  }
  displayMenu();
}

/**
 * Prompts the user for schedule details.
 */
function promptForScheduleDetails(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Video dosya yolunu girin: ', (videoPath) => {
    rl.question('Paylaşım türünü girin (Şimdi Yayınla / Shorts / Community): ', (shareType) => {
      rl.question('Planlanan tarih ve saati girin (YYYY-MM-DD HH:MM formatında): ', (dateTimeInput) => {
        const scheduledDateTime = new Date(dateTimeInput);
        rl.close();
        callback(videoPath, shareType, scheduledDateTime);
      });
    });
  });
}

/**
 * Displays scheduled tasks.
 */
function displayScheduledTasks() {
  console.log('\nPlanlanmış görevler görüntüleniyor...');
  // In a full implementation, scheduled tasks would be listed here.
  displayMenu();
}

/**
 * Schedule Management Menu.
 */
function displayScheduleManagement() {
  console.log('\n--- Schedule Yönetimi ---');
  console.log('1. Video Seçin, Dosya Yolu Belirleyin, Paylaşım Tarihi ve Saatini Ayarlayın');
  console.log('2. Planlanmış İşlemleri Görüntüle');
  console.log('3. Ana Menüye Dön');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Seçiminizi yapın: ', (choice) => {
    rl.close();
    switch (choice) {
      case '1':
        promptForScheduleDetails((videoPath, shareType, dateTime) => {
          scheduleManager.scheduleVideoSharing(videoPath, shareType, dateTime, (filePath, type) => {
            if (type === 'Şimdi Yayınla') {
              mediaManager.shareNow(filePath);
            } else if (type === 'Shorts') {
              const shortsDir = process.env.SHORTS_DIR || path.join(process.env.VIDEO_UPLOAD_DIR, 'shorts');
              mediaManager.shareRandomShorts(shortsDir);
            } else if (type === 'Community') {
              mediaManager.shareCommunity(`Scheduled community post for file ${filePath}`);
            }
          });
          displayScheduleManagement();
        });
        break;
      case '2':
        displayScheduledTasks();
        break;
      case '3':
        displayMenu();
        break;
      default:
        console.log('Geçersiz seçim. Lütfen tekrar deneyin.');
        displayScheduleManagement();
        break;
    }
  });
}

// Optionally, perform authorization before starting your application logic.
authorize()
  .then(auth => {
    console.log('Authorization successful.');
    // You can pass the auth client to functions that require it.
    displayMenu();
  })
  .catch(err => {
    console.error('Authorization error:', err);
    process.exit(1);
  });

// Export functions if needed by other modules.
module.exports = {
  displayPendingVideos,
  displayVideoDetails,
  promptForScheduleDetails,
  displayScheduledTasks,
  displayScheduleManagement,
  displayMenu
};




function displayUploadStatus() {
  if (fs.existsSync(STATUS_LOG_PATH)) {
    const statusLog = fs.readFileSync(STATUS_LOG_PATH, 'utf8');
    console.log('\n📊 Günlük Yükleme Durumu:');
    console.log(statusLog);
  } else {
    console.log('📊 Henüz yükleme durumu yok.');
  }
  displayMenu();
}

function displayPendingVideos() {
  const videoUploadDir = process.env.VIDEO_UPLOAD_DIR;
  const videoFiles = fs.readdirSync(videoUploadDir).filter(file => file.endsWith('.mp4'));
  console.log('\n📁 Bekleyen Videolar:');
  if (videoFiles.length > 0) {
    videoFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
  } else {
    console.log('Bekleyen video yok.');
  }
  displayMenu();
}

function displayVideoDetails() {
  const statusLog = fs.existsSync(STATUS_LOG_PATH) ? JSON.parse(fs.readFileSync(STATUS_LOG_PATH, 'utf8')) : [];
  console.log('\n📄 Video Detayları:');
  if (statusLog.length > 0) {
    const failedVideos = statusLog.filter(log => log.status === 'failed').length;
    const scheduledVideos = statusLog.filter(log => log.status === 'scheduled').length;
    const uploadedVideos = statusLog.filter(log => log.status === 'uploaded').length;
    console.log(`Toplam Video: ${statusLog.length}`);
    console.log(`Başarılı Yüklemeler: ${uploadedVideos}`);
    console.log(`Başarısız Yüklemeler: ${failedVideos}`);
    console.log(`Planlanmış Yüklemeler: ${scheduledVideos}`);
    console.log('\nDetaylar:');
    statusLog.forEach((log, index) => {
      console.log(`${index + 1}. Dosya: ${log.currentVideo || log.nextVideo}`);
      console.log(`   Durum: ${log.status}`);
      if (log.status === 'scheduled') {
        console.log(`   Planlanan Zaman: ${log.uploadTime}`);
      }
      if (log.status === 'failed') {
        console.log(`   Hata: ${log.error}`);
      }
    });
  } else {
    console.log('📄 Henüz video detayları yok.');
  }
  displayMenu();
}

function displayAdvancedOptions() {
  console.log('\n🛠️ Gelişmiş İşlemler:');
  console.log('1. Log Görüntüleme');
  console.log('2. Ayarlar');
  console.log('3. API Test');
  console.log('4. Hata Raporlama');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Seçiminizi yapın: ', (choice) => {
    rl.close();
    switch (choice) {
      case '1':
        displayLogs();
        break;
      case '2':
        displaySettings();
        break;
      case '3':
        performApiTest();
        break;
      case '4':
        reportError();
        break;
      default:
        console.log('Geçersiz seçim. Lütfen tekrar deneyin.');
        displayAdvancedOptions();
        break;
    }
  });
}

function displayLogs() {
  console.log('\n--- Loglar ---');
  if (fs.existsSync(LOG_PATH)) {
    const logs = fs.readFileSync(LOG_PATH, 'utf8');
    console.log(logs);
  } else {
    console.log('📄 Henüz log yok.');
  }
  displayAdvancedOptions();
}

function displaySettings() {
  console.log('\n--- Ayarlar ---');
  console.log('1. Ayar 1');
  console.log('2. Ayar 2');
  console.log('3. Ana Menüye Dön');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Seçiminizi yapın: ', (choice) => {
    rl.close();
    switch (choice) {
      case '1':
        console.log('Ayar 1 seçildi.');
        break;
      case '2':
        console.log('Ayar 2 seçildi.');
        break;
      case '3':
        displayMenu();
        break;
      default:
        console.log('Geçersiz seçim. Lütfen tekrar deneyin.');
        displaySettings();
        break;
    }
  });
}

function performApiTest() {
  console.log('API testi yapılıyor...');
  // API test kodları burada olacak
  displayAdvancedOptions();
}

function reportError() {
  console.log('Hata raporlama...');
  // Hata raporlama kodları burada olacak
  displayAdvancedOptions();
}

function displayShortsCommunityManagement() {
  console.log('\n--- Shorts & Community Yönetimi ---');
  console.log('1. Community Gönderi Loglarını Görüntüle');
  console.log('2. Shorts Video Loglarını Görüntüle');
  console.log('3. Ana Menüye Dön');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Seçiminizi yapın: ', (choice) => {
    rl.close();
    switch (choice) {
      case '1':
        communityManager.displayCommunityLogs();
        displayShortsCommunityManagement();
        break;
      case '2':
        communityManager.displayShortsLogs();
        displayShortsCommunityManagement();
        break;
      case '3':
        displayMenu();
        break;
      default:
        console.log('Geçersiz seçim. Lütfen tekrar deneyin.');
        displayShortsCommunityManagement();
        break;
    }
  });
}

/**
 * Media Sharing Management Menu.
 */
function displayMediaSharingManagement() {
  console.log('\n--- Medya Paylaşımları Yönetimi ---');
  console.log('1. Şimdi Yayınla');
  console.log('2. Shorts Paylaş');
  console.log('3. Community Paylaş, Anket Oluştur');
  console.log('4. Ana Menüye Dön');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Seçiminizi yapın: ', (choice) => {
    rl.close();
    switch (choice) {
      case '1': {
        promptForMediaPath('Şimdi Yayınla', (mediaPath) => {
          mediaManager.shareNow(mediaPath);
          displayMediaSharingManagement();
        });
        break;
      }
      case '2': {
        const shortsDir = process.env.SHORTS_DIR || path.join(process.env.VIDEO_UPLOAD_DIR, 'shorts');
        mediaManager.shareRandomShorts(shortsDir);
        displayMediaSharingManagement();
        break;
      }
      case '3': {
        promptForCommunityPost((message, poll) => {
          mediaManager.shareCommunity(message, poll);
          displayMediaSharingManagement();
        });
        break;
      }
      case '4':
        displayMenu();
        break;
      default:
        console.log('Geçersiz seçim. Lütfen tekrar deneyin.');
        displayMediaSharingManagement();
        break;
    }
  });
}

/**
 * Account Management Menu.
 */
function displayAccountManagement() {
  console.log('\n--- Hesap Yönetimi ---');
  console.log('1. Hesap Ekle');
  console.log('2. Hesap Güncelle');
  console.log('3. Açık Hesapları Görüntüle');
  console.log('4. Ana Menüye Dön');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Seçiminizi yapın: ', (choice) => {
    rl.close();
    switch (choice) {
      case '1':
        promptForNewAccount((account) => {
          accountManager.addAccount(account);
          displayAccountManagement();
        });
        break;
      case '2':
        promptForAccountUpdate((index, updatedAccount) => {
          accountManager.updateAccount(index, updatedAccount);
          displayAccountManagement();
        });
        break;
      case '3':
        accountManager.viewAccounts();
        displayAccountManagement();
        break;
      case '4':
        displayMenu();
        break;
      default:
        console.log('Geçersiz seçim. Lütfen tekrar deneyin.');
        displayAccountManagement();
        break;
    }
  });
}

/**
 * Schedule Management Menu.
 */
function displayScheduleManagement() {
  console.log('\n--- Schedule Yönetimi ---');
  console.log('1. Video Seçin, Dosya Yolu Belirleyin, Paylaşım Tarihi ve Saatini Ayarlayın');
  console.log('2. Planlanmış İşlemleri Görüntüle');
  console.log('3. Ana Menüye Dön');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Seçiminizi yapın: ', (choice) => {
    rl.close();
    switch (choice) {
      case '1':
        promptForScheduleDetails((videoPath, shareType, dateTime) => {
          scheduleManager.scheduleVideoSharing(videoPath, shareType, dateTime, (filePath, type) => {
            if (type === 'Şimdi Yayınla') {
              mediaManager.shareNow(filePath);
            } else if (type === 'Shorts') {
              const shortsDir = process.env.SHORTS_DIR || path.join(process.env.VIDEO_UPLOAD_DIR, 'shorts');
              mediaManager.shareRandomShorts(shortsDir);
            } else if (type === 'Community') {
              mediaManager.shareCommunity(`Scheduled community post for file ${filePath}`);
            }
          });
          displayScheduleManagement();
        });
        break;
      case '2':
        displayScheduledTasks();
        break;
      case '3':
        displayMenu();
        break;
      default:
        console.log('Geçersiz seçim. Lütfen tekrar deneyin.');
        displayScheduleManagement();
        break;
    }
  });
}

function promptForMediaPath(action, callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question(`${action} için medya dosyasının tam yolunu girin: `, (mediaPath) => {
    rl.close();
    callback(mediaPath);
  });
}

function promptForCommunityPost(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Community gönderisi mesajını girin: ', (message) => {
    rl.question('Anket oluşturulsun mu? (evet/hayır): ', (answer) => {
      let poll = null;
      if (answer.trim().toLowerCase() === 'evet') {
        rl.question('Anket sorusunu girin: ', (question) => {
          rl.question('Anket seçeneklerini virgülle ayırarak girin: ', (choicesInput) => {
            const choices = choicesInput.split(',').map(s => s.trim());
            poll = { question, choices };
            rl.close();
            callback(message, poll);
          });
        });
      } else {
        rl.close();
        callback(message, poll);
      }
    });
  });
}

function promptForNewAccount(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const account = {};

  rl.question('Hesap adı: ', (name) => {
    account.name = name;
    rl.question('Hesap email: ', (email) => {
      account.email = email;
      rl.question('Hesap şifresi: ', (password) => {
        account.password = password;
        rl.question('Hesap türü (admin/user): ', (type) => {
          account.type = type.toLowerCase() === 'admin' ? 'admin' : 'user';
          rl.close();
          callback(account);
        });
      });
    });
  });
}

function promptForAccountUpdate(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Güncellemek istediğiniz hesabın indeksini girin: ', (index) => {
    const updatedAccount = {};
    rl.question('Yeni hesap adı (boş bırakılırsa değişmez): ', (name) => {
      if (name) updatedAccount.name = name;
      rl.question('Yeni hesap email (boş bırakılırsa değişmez): ', (email) => {
        if (email) updatedAccount.email = email;
        rl.question('Yeni hesap şifresi (boş bırakılırsa değişmez): ', (password) => {
          if (password) updatedAccount.password = password;
          rl.question('Yeni hesap türü (admin/user, boş bırakılırsa değişmez): ', (type) => {
            if (type) updatedAccount.type = type.toLowerCase() === 'admin' ? 'admin' : 'user';
            rl.close();
            callback(parseInt(index, 10), updatedAccount);
          });
        });
      });
    });
  });
}

module.exports = {
  promptForNewAccount,
  promptForAccountUpdate
};

