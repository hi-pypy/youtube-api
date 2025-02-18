const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');
const LOG_PATH = path.join(__dirname, '../logs/authorizeLog.json');

// Include all required YouTube API scopes.
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',           // Full YouTube account access.
  'https://www.googleapis.com/auth/youtube.upload',    // Video yükleme ve yönetim.
  'https://www.googleapis.com/auth/youtube.readonly',  // Sadece okuma erişimi.
  'https://www.googleapis.com/auth/youtube.force-ssl',  // SSL ile zorunlu erişim.
  'https://www.googleapis.com/auth/youtubepartner'      // YouTube Partner kaynaklarını yönetmek için.
];

/**
 * Olayları loglamak için yardımcı fonksiyon.
 */
function logEvent(event) {
  const log = {
    timestamp: new Date().toISOString(),
    event,
  };
  console.log('📝 Log:', log);
  const logData = JSON.stringify(log, null, 2) + '\n';
  fs.appendFileSync(LOG_PATH, logData, 'utf8');
}

/**
 * OAuth2 istemcisini belirlenen izinlerle yetkilendirir.
 * @param {Array<string>} scopes - Gerekli izinlerin listesi.
 * @returns {Promise<OAuth2Client>} - Yetkilendirilmiş OAuth2 istemcisi.
 */
async function authorize(scopes = SCOPES) {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    const errorMsg = '⚠️ Credentials dosyası bulunamadı.';
    console.error(errorMsg);
    logEvent(errorMsg);
    throw new Error(errorMsg);
  }
  
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  // Redirect URI'nizin Google Cloud Console'daki ayarlarla eşleştiğinden emin olun.
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (!fs.existsSync(TOKEN_PATH)) {
    return getAccessToken(oAuth2Client, scopes);
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);

  try {
    await oAuth2Client.getAccessToken();
  } catch (refreshError) {
    console.error('❌ Token yenilenirken hata oluştu:', refreshError);
    logEvent(`Token yenilenirken hata oluştu: ${refreshError.message}`);
    return getAccessToken(oAuth2Client, scopes);
  }
  return oAuth2Client;
}

/**
 * Yeni bir access token almak için yetkilendirme URL'si oluşturur.
 * @param {OAuth2Client} oAuth2Client - Token alınacak OAuth2 istemcisi.
 * @param {Array<string>} scopes - Gerekli API izinleri.
 * @returns {Promise<OAuth2Client>} - Token ayarlı OAuth2 istemcisi.
 */
function getAccessToken(oAuth2Client, scopes) {
  return new Promise((resolve, reject) => {
    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return reject(new Error('Missing required parameter: scope'));
    }
    // Updated: Added prompt: 'consent' to force re-consent and obtain refresh token.
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
    console.log('🌐 Bu URL\'yi ziyaret ederek uygulamayı yetkilendirin:', authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.question('📥 O sayfadan aldığınız kodu buraya girin: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          const errorMsg = `❌ Access token alınırken hata oluştu: ${err.message}`;
          console.error(errorMsg);
          logEvent(errorMsg);
          return reject(err);
        }
        oAuth2Client.setCredentials(token);
        saveToken(token);
        resolve(oAuth2Client);
      });
    });
  });
}

/**
 * OAuth2 istemcisi için access token yenileme işlemini yapar.
 * @param {OAuth2Client} oAuth2Client
 * @returns {Promise<OAuth2Client>}
 */
function refreshToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    oAuth2Client.refreshAccessToken((err, tokens) => {
      if (err) {
        return reject('Error refreshing access token: ' + err);
      }
      oAuth2Client.setCredentials(tokens);
      saveToken(tokens);
      resolve(oAuth2Client);
    });
  });
}

/**
 * Token bilgisini diske kaydeder.
 * @param {Object} token - Kaydedilecek token nesnesi.
 */
function saveToken(token) {
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) {
      const errorMsg = `❌ Token kaydedilirken hata oluştu: ${err.message}`;
      console.error(errorMsg);
      logEvent(errorMsg);
    } else {
      const successMsg = `✅ Token kaydedildi: ${TOKEN_PATH}`;
      console.log(successMsg);
      logEvent(successMsg);
    }
  });
}

module.exports = { authorize, refreshToken, SCOPES };