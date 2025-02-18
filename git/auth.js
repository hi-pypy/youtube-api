const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');
const LOG_PATH = path.join(__dirname, '../logs/authorizeLog.json');

// Define the scopes your application needs.
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

// Updated: set default scopes if none provided.
async function authorize(scopes = SCOPES) {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    const errorMsg = '⚠️ Credentials dosyası bulunamadı.';
    console.error(errorMsg);
    logEvent(errorMsg);
    throw new Error(errorMsg);
  }
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
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

// Updated: Check for a valid scopes array.
function getAccessToken(oAuth2Client, scopes) {
  return new Promise((resolve, reject) => {
    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return reject(new Error('Missing required parameter: scope'));
    }
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    });
    console.log('🌐 Bu URL\'yi ziyaret ederek uygulamayı yetkilendirin:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
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

function logEvent(event) {
  const log = {
    timestamp: new Date().toISOString(),
    event
  };
  console.log('📝 Log:', log);
  const logData = JSON.stringify(log, null, 2) + '\n';
  fs.appendFileSync(LOG_PATH, logData, 'utf8');
}

module.exports = { authorize, refreshToken, SCOPES };