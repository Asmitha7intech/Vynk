/**
 * Explicit Quest & Challenge Importer
 * 
 * Imports curated educational challenges and arena quizzes into the active database.
 * No auto-seeding runs at server startup; this is only executed on explicit admin command.
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const contentPath = path.resolve(__dirname, '../packages/database/src/content/curated-quests.json');
  if (!fs.existsSync(contentPath)) {
    console.error('Content file not found:', contentPath);
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  console.log('Loading curated quest library...');
  console.log(`  - ${content.dailyChallenges.length} challenges`);
  console.log(`  - ${content.quizzes.length} quizzes (${content.quizQuestions.length} questions)`);

  const dbPath = path.resolve(__dirname, '../data/vynk_db.json');
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db.dailyChallenges = content.dailyChallenges;
    db.quizzes = content.quizzes;
    db.quizQuestions = content.quizQuestions;
    db.badges = content.badges;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('[SUCCESS] Imported curated quests and quizzes into database.');
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
  });
}

module.exports = { main };
