const fs = require('fs');
const path = require('path');

const departments = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Information Technology',
  'Mechanical Engineering',
  'Design & Human Computer Interaction',
  'Biotechnology',
  'Data Science & AI',
  'Business Administration'
];

const skillsByDept = {
  'Computer Science & Engineering': ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Next.js', 'GraphQL'],
  'Electronics & Communication': ['Embedded C', 'IoT', 'Arduino', 'Verilog', 'PCB Design', 'MATLAB'],
  'Information Technology': ['Cloud Architecture', 'AWS', 'Cybersecurity', 'Linux', 'Kubernetes', 'CI/CD'],
  'Mechanical Engineering': ['CAD', 'SolidWorks', '3D Printing', 'Robotics', 'Thermodynamics', 'Ansys'],
  'Design & Human Computer Interaction': ['Figma', 'UI/UX Design', 'User Research', 'Design Systems', '3D Motion', 'Branding'],
  'Biotechnology': ['Bioinformatics', 'CRISPR Data', 'Genomics', 'Python', 'Biostatistics'],
  'Data Science & AI': ['PyTorch', 'TensorFlow', 'LLMs', 'Scikit-Learn', 'Pandas', 'Computer Vision'],
  'Business Administration': ['Product Strategy', 'Market Research', 'Pitch Decks', 'Financial Modeling', 'Agile Scrum']
};

const eventTypes = [
  'PROFILE_VIEW',
  'POST_REACT',
  'POST_COMMENT',
  'QUEST_SUBMITTED',
  'CREW_APPLICATION',
  'CREW_AGREEMENT_SIGNED',
  'CROSS_DEPT_DISCOVERY_CLICK',
  'VOYAGE_STARRED',
  'MENTOR_REQUEST'
];

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Generating synthetic Big Data telemetry events for HDFS/Hive testing...');

const recordsCount = 10000;
const events = [];
const csvRows = ['event_id,user_id,institution_id,event_type,source_dept,target_dept,timestamp,xp_earned'];

const now = Date.now();
const oneDayMs = 24 * 60 * 60 * 1000;

for (let i = 1; i <= recordsCount; i++) {
  const sourceDept = departments[Math.floor(Math.random() * departments.length)];
  let targetDept = departments[Math.floor(Math.random() * departments.length)];
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const timestamp = new Date(now - Math.floor(Math.random() * 30 * oneDayMs)).toISOString();
  const xpEarned = eventType === 'QUEST_SUBMITTED' ? 25 : eventType === 'CREW_AGREEMENT_SIGNED' ? 100 : 5;
  const eventId = 'evt_' + i.toString().padStart(6, '0');
  const userId = 'usr_' + (Math.floor(Math.random() * 500) + 1).toString().padStart(4, '0');
  const institutionId = 'inst_mit_001';

  events.push({
    eventId,
    userId,
    institutionId,
    eventType,
    sourceDepartment: sourceDept,
    targetDepartment: targetDept,
    timestamp,
    xpEarned,
  });

  csvRows.push(`${eventId},${userId},${institutionId},${eventType},"${sourceDept}","${targetDept}",${timestamp},${xpEarned}`);
}

fs.writeFileSync(path.join(dataDir, 'vynk_events_10k.json'), JSON.stringify(events, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'vynk_events_10k.csv'), csvRows.join('\n'), 'utf8');

console.log(`Successfully generated ${recordsCount} records in data/vynk_events_10k.json and data/vynk_events_10k.csv`);
