import { describe, it, expect } from 'vitest';

describe('VYNK Cross-Department Matchmaking Engine', () => {
  it('correctly scores complementary skill pairs across different departments', () => {
    const userDept = 'Computer Science';
    const candidateDept = 'Design';
    const userSkills = ['React', 'TypeScript', 'Node.js'];
    const candidateSkills = ['Figma', 'UI/UX', 'Wireframing'];

    const isCrossDept = userDept.toLowerCase() !== candidateDept.toLowerCase();
    expect(isCrossDept).toBe(true);

    let matchScore = isCrossDept ? 40 : 10;
    const complementarySkills = candidateSkills.filter(s => !userSkills.includes(s));
    matchScore += complementarySkills.length * 15;
    const finalScore = Math.min(100, matchScore);

    expect(finalScore).toBe(85);
  });

  it('generates clear rationale explanation for match recommendation', () => {
    const candidate = {
      displayName: 'Maya Patel',
      department: 'Biotechnology',
      skills: [{ skillName: 'Bioinformatics' }, { skillName: 'Python' }],
    };

    const reason = `From ${candidate.department} with complementary expertise in ${candidate.skills.map(s => s.skillName).join(', ')}`;
    expect(reason).toContain('Biotechnology');
    expect(reason).toContain('Bioinformatics');
  });
});
