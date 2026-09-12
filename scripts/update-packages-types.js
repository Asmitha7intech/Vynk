const fs = require('fs');
const path = require('path');

const typesPath = path.resolve(__dirname, '../packages/types/src/index.ts');
let content = fs.readFileSync(typesPath, 'utf8');

// Update Role
content = content.replace(
  "export type Role = 'STUDENT' | 'MENTOR' | 'MODERATOR' | 'ORGANIZATION' | 'ADMIN' | 'SUPER_ADMIN';",
  "export type Role = 'STUDENT' | 'MENTOR' | 'MODERATOR' | 'CAMPUS_ADMIN' | 'VYNK_ADMIN' | 'ORGANIZATION' | 'ADMIN' | 'SUPER_ADMIN';"
);

// Update User interface
if (!content.includes('isAmbassador?: boolean;')) {
  content = content.replace(
    'isAvailableForMentorship?: boolean;',
    'isAvailableForMentorship?: boolean;\n  isAmbassador?: boolean;'
  );
}

// Add Department, CrossDepartmentMatch, ScoreBreakdown
if (!content.includes('export interface Department {')) {
  const extraTypes = `
export interface Department {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  studentCount?: number;
  createdAt: string;
}

export interface CrossDepartmentMatch {
  user: User;
  sharedInterests: string[];
  complementarySkills: string[];
  department: string;
  matchScore: number;
  matchReason: string;
}

export interface ScoreBreakdownFactor {
  category: string;
  xpContribution: number;
  description: string;
  percentageOfTotal: number;
}

export interface UserRankExplanation {
  rank: number;
  totalXp: number;
  scope: LeaderboardScope;
  factors: ScoreBreakdownFactor[];
  xpToNextRank: number;
  streakBonusApplied: number;
}
`;
  content += '\n' + extraTypes;
}

fs.writeFileSync(typesPath, content, 'utf8');
console.log('Updated packages/types/src/index.ts successfully.');
