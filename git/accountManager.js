const fs = require('fs');
const path = require('path');

const ACCOUNTS_PATH = path.join(__dirname, '../config/accounts.json');

/**
 * Load accounts from the configuration file.
 * If the file does not exist, an empty array is returned.
 */
function loadAccounts() {
  if (!fs.existsSync(ACCOUNTS_PATH)) {
    fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify([]));
  }
  const data = fs.readFileSync(ACCOUNTS_PATH, 'utf8');
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

/**
 * Save accounts to the configuration file.
 */
function saveAccounts(accounts) {
  fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(accounts, null, 2));
}

/**
 * Add a new account.
 * @param {object} account - An object representing the account 
 *                           (e.g. { username, email, token }).
 */
function addAccount(account) {
  const accounts = loadAccounts();
  accounts.push(account);
  saveAccounts(accounts);
  console.log('✅ Hesap eklendi:', account);
}

/**
 * Update an existing account.
 * @param {number} index - The index of the account to update.
 * @param {object} updatedAccount - The updated account object.
 */
function updateAccount(index, updatedAccount) {
  const accounts = loadAccounts();
  if (index < 0 || index >= accounts.length) {
    console.error('❌ Geçersiz hesap indexi.');
    return;
  }
  accounts[index] = updatedAccount;
  saveAccounts(accounts);
  console.log('✅ Hesap güncellendi:', updatedAccount);
}

/**
 * Display all available accounts.
 */
function viewAccounts() {
  const accounts = loadAccounts();
  console.log('\n📋 Açık Hesaplar:');
  accounts.forEach((acc, idx) => {
    console.log(`${idx + 1}. Kullanıcı: ${acc.username}, E-posta: ${acc.email}`);
  });
  if (accounts.length === 0) {
    console.log('Henüz hesap eklenmemiş.');
  }
}

module.exports = {
  addAccount,
  updateAccount,
  viewAccounts
};