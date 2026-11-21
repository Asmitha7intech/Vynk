const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(__dirname, '../backups', timestamp);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const dbSrc = path.resolve(__dirname, '../data/vynk_db.json');
const dbDst = path.join(backupDir, 'vynk_db.json');

if (fs.existsSync(dbSrc)) {
  fs.copyFileSync(dbSrc, dbDst);
  const data = JSON.parse(fs.readFileSync(dbDst, 'utf8'));
  console.log(`[BACKUP] Created backup at ${backupDir}`);
  console.log('[BACKUP] Verified JSON integrity. Record counts:');
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      console.log(`  - ${key}: ${value.length}`);
    }
  }
} else {
  console.log('[BACKUP] No existing vynk_db.json found to backup.');
}

const uploadsSrc = path.resolve(__dirname, '../data/uploads');
const uploadsDst = path.join(backupDir, 'uploads');
if (fs.existsSync(uploadsSrc)) {
  fs.cpSync(uploadsSrc, uploadsDst, { recursive: true });
  console.log('[BACKUP] Uploads directory archived.');
}
