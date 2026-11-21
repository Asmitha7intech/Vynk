import { describe, it, expect, beforeEach } from 'vitest';
import { communityService } from '../src/services/community.service';
import { prisma } from '@vynk/database';

describe('VYNK Real Communities & Campus Collaboration Service', () => {
  let testUserId: string;
  let anotherUserId: string;

  beforeEach(async () => {
    // Locate or create test users
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length >= 2) {
      testUserId = users[0].id;
      anotherUserId = users[1].id;
    } else {
      testUserId = 'user_test_admin';
      anotherUserId = 'user_test_student';
    }
  });

  it('creates a new community and assigns creator as ADMIN', async () => {
    const community = await communityService.create(testUserId, {
      name: `AI Research Guild ${Date.now()}`,
      description: 'Undergraduate machine learning and research community.',
      category: 'AI & Machine Learning',
      tags: ['ai', 'research', 'pytorch'],
      isPrivate: false,
    });

    expect(community).toBeDefined();
    expect(community.id).toBeDefined();
    expect(community.slug).toContain('ai-research-guild');
    expect(community.creatorId).toBe(testUserId);

    // Verify creator is an approved ADMIN member
    const members = await communityService.getMembers(community.id);
    const creatorMember = members.find((m: any) => m.userId === testUserId);
    expect(creatorMember).toBeDefined();
    expect(creatorMember!.role).toBe('ADMIN');
    expect(creatorMember!.status).toBe('APPROVED');
  });

  it('allows another student to join a public community automatically as APPROVED', async () => {
    const community = await communityService.create(testUserId, {
      name: `Open Cloud Systems ${Date.now()}`,
      description: 'Distributed cloud computing group.',
      category: 'Web Development & Cloud',
      tags: ['cloud', 'kubernetes'],
      isPrivate: false,
    });

    const membership = await communityService.join(anotherUserId, community.id);
    expect(membership.status).toBe('APPROVED');
    expect(membership.role).toBe('MEMBER');

    const members = await communityService.getMembers(community.id);
    expect(members.length).toBe(2);
  });

  it('marks join request for private community as PENDING until approved by admin', async () => {
    const community = await communityService.create(testUserId, {
      name: `Competitive Coding Elite ${Date.now()}`,
      description: 'ICPC campus representation team.',
      category: 'Competitive Programming',
      tags: ['icpc', 'algorithms'],
      isPrivate: true,
    });

    const pendingMembership = await communityService.join(anotherUserId, community.id);
    expect(pendingMembership.status).toBe('PENDING');

    // Admin reviews and approves
    const reviewed = await communityService.reviewMember(
      community.id,
      testUserId,
      anotherUserId,
      'APPROVED'
    );
    expect(reviewed.status).toBe('APPROVED');
  });

  it('allows a member to leave a community', async () => {
    const community = await communityService.create(testUserId, {
      name: `Robotics Guild ${Date.now()}`,
      description: 'Campus hardware builders.',
      category: 'Robotics & Hardware',
      isPrivate: false,
    });

    await communityService.join(anotherUserId, community.id);
    const result = await communityService.leave(anotherUserId, community.id);
    expect(result.success).toBe(true);

    const members = await communityService.getMembers(community.id);
    expect(members.some((m: any) => m.userId === anotherUserId)).toBe(false);
  });

  it('searches and filters communities by category and query, sorted by member count descending', async () => {
    const uniqueCategory = 'Startups & Innovation';
    const c1 = await communityService.create(testUserId, {
      name: `Campus Founders ${Date.now()}`,
      description: 'Student founders and venture studio.',
      category: uniqueCategory,
      tags: ['venture', 'startups'],
    });

    // Add another member to c1 to increase its member count
    await communityService.join(anotherUserId, c1.id);

    const searchResult = await communityService.list({
      category: uniqueCategory,
      limit: 10,
    });

    expect(searchResult.items.length).toBeGreaterThan(0);
    expect(searchResult.items.every((c: any) => c.category === uniqueCategory)).toBe(true);
    // Verify member count descending order
    if (searchResult.items.length >= 2) {
      const count1 = searchResult.items[0]._count?.members || searchResult.items[0].members?.length || 0;
      const count2 = searchResult.items[1]._count?.members || searchResult.items[1].members?.length || 0;
      expect(count1).toBeGreaterThanOrEqual(count2);
    }
  });

  it('enforces rate limit: maximum 3 communities per user per 24 hours', async () => {
    const rateLimitedUserId = `user_rate_limit_${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      await communityService.create(rateLimitedUserId, {
        name: `Rate Limit Guild ${i}_${Date.now()}`,
        description: 'Testing the 3-communities per 24 hour limit.',
        enforceRateLimit: true,
      });
    }

    await expect(
      communityService.create(rateLimitedUserId, {
        name: `Rate Limit Guild Overflow ${Date.now()}`,
        description: 'Testing the 3-communities per 24 hour limit.',
        enforceRateLimit: true,
      })
    ).rejects.toThrow('Daily limit reached: You can create a maximum of 3 communities per 24 hours.');
  });
});
