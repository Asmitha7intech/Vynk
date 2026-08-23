const fs = require('fs');
const path = require('path');

const authServicePath = path.resolve(__dirname, '../apps/api/src/services/auth.service.ts');
let authServiceContent = fs.readFileSync(authServicePath, 'utf8');
authServiceContent = authServiceContent.replace(
  'graduationYear: number;',
  'graduationYear?: number;'
);
fs.writeFileSync(authServicePath, authServiceContent, 'utf8');

const questsCtrlPath = path.resolve(__dirname, '../apps/api/src/controllers/quests.controller.ts');
let questsCtrlContent = fs.readFileSync(questsCtrlPath, 'utf8');
questsCtrlContent = questsCtrlContent.replace(
  'parsed.answers',
  'parsed.answers.map((a: any) => ({ questionId: a.questionId, selectedOptionIndex: a.selectedIndex ?? a.selectedOptionIndex }))'
);
fs.writeFileSync(questsCtrlPath, questsCtrlContent, 'utf8');

console.log('Fixed authService and questsController');
