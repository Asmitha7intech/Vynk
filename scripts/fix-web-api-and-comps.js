const fs = require('fs');
const path = require('path');

// 1. apps/web/src/lib/api.ts
const apiPath = path.resolve(__dirname, '../apps/web/src/lib/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('getCrossDepartmentMatches:')) {
  apiContent = apiContent.replace(
    '  getBadges: () => request<BountyBadge[]>(\'/gamification/badges\'),',
    `  getBadges: () => request<BountyBadge[]>('/gamification/badges'),
  getRankExplanation: (userId: string, scope = 'GLOBAL') => request<any>(\`/gamification/rank-explanation/\${userId}?scope=\${scope}\`),
  getCrossDepartmentMatches: () => request<any[]>('/users/cross-department'),
  getCampusSkillHeatmap: (college?: string) => request<any>(\`/analytics/bigdata/campus-heatmap\${college ? \`?college=\${encodeURIComponent(college)}\` : ''}\`),
  getDepartmentCollaboration: () => request<any>('/analytics/bigdata/dept-collaboration'),`
  );
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('Added missing methods to api.ts');
}

// 2. apps/web/src/components/CrossDepartmentDiscovery.tsx
const crossDeptPath = path.resolve(__dirname, '../apps/web/src/components/CrossDepartmentDiscovery.tsx');
let crossDept = fs.readFileSync(crossDeptPath, 'utf8');
crossDept = crossDept.replace('size="xs"', 'size="sm"');
crossDept = crossDept.replace('.then((data) => setMatches(data || []))', '.then((data: any) => setMatches(data || []))');
fs.writeFileSync(crossDeptPath, crossDept, 'utf8');

// 3. apps/web/src/components/ScoreBreakdownModal.tsx
const scorePath = path.resolve(__dirname, '../apps/web/src/components/ScoreBreakdownModal.tsx');
let score = fs.readFileSync(scorePath, 'utf8');
score = score.replace('.then((res) => setData(res))', '.then((res: any) => setData(res))');
fs.writeFileSync(scorePath, score, 'utf8');

console.log('Fixed web api and components.');
