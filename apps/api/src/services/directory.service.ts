import { prisma } from '@vynk/database';

export interface DirectoryQueryOptions {
  search?: string;
  page?: number;
  limit?: number;
  status?: 'all' | 'claimed' | 'unclaimed';
  department?: string;
  sortBy?: 'name_asc' | 'name_desc' | 'studentId_asc' | 'studentId_desc';
}

export class DirectoryService {
  async search(options: DirectoryQueryOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const allRecords: any[] = await (prisma as any).classroomDirectory.findMany({});

    // Filter in memory for robust query support across SQLite/LocalStore/Postgres
    let filtered = allRecords;

    if (options.status === 'claimed') {
      filtered = filtered.filter((r) => r.isClaimed);
    } else if (options.status === 'unclaimed') {
      filtered = filtered.filter((r) => !r.isClaimed);
    }

    if (options.department && options.department !== 'all') {
      filtered = filtered.filter((r) =>
        r.department?.toLowerCase() === options.department?.toLowerCase()
      );
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      filtered = filtered.filter((r) =>
        r.normalizedName?.includes(q) ||
        r.originalDisplayName?.toLowerCase().includes(q) ||
        r.studentId?.toLowerCase().includes(q)
      );
    }

    // Sort
    const sortBy = options.sortBy || 'name_asc';
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return b.originalDisplayName.localeCompare(a.originalDisplayName);
        case 'studentId_asc':
          return a.studentId.localeCompare(b.studentId);
        case 'studentId_desc':
          return b.studentId.localeCompare(a.studentId);
        case 'name_asc':
        default:
          return a.originalDisplayName.localeCompare(b.originalDisplayName);
      }
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    // Populate claimed user data
    const recordsWithUser = await Promise.all(
      paginated.map(async (record) => {
        let auditTrail = [];
        try {
          auditTrail = typeof record.auditTrail === 'string'
            ? JSON.parse(record.auditTrail)
            : record.auditTrail || [];
        } catch {
          auditTrail = [];
        }

        let claimedUser = null;
        if (record.isClaimed && record.claimedUserId) {
          const user = await (prisma as any).user.findUnique({
            where: { id: record.claimedUserId },
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true,
              headline: true,
            },
          });
          claimedUser = user;
        }

        return {
          ...record,
          auditTrail,
          claimedUser,
        };
      })
    );

    return {
      items: recordsWithUser,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const record = await (prisma as any).classroomDirectory.findUnique({
      where: { id },
    });
    if (!record) return null;

    let auditTrail = [];
    try {
      auditTrail = typeof record.auditTrail === 'string'
        ? JSON.parse(record.auditTrail)
        : record.auditTrail || [];
    } catch {
      auditTrail = [];
    }

    let claimedUser = null;
    if (record.isClaimed && record.claimedUserId) {
      claimedUser = await (prisma as any).user.findUnique({
        where: { id: record.claimedUserId },
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          headline: true,
        },
      });
    }

    return {
      ...record,
      auditTrail,
      claimedUser,
    };
  }

  async claim(userId: string, directoryId: string, studentId: string) {
    const record = await (prisma as any).classroomDirectory.findUnique({
      where: { id: directoryId },
    });

    if (!record) {
      throw new Error('Directory record not found');
    }

    if (record.isClaimed) {
      throw new Error('This directory record has already been claimed');
    }

    // Verify studentId matches
    if (record.studentId.trim().toLowerCase() !== studentId.trim().toLowerCase()) {
      throw new Error(`Student ID does not match this directory record (Expected: ${record.studentId})`);
    }

    // Check if user already claimed another record
    const existingClaim = await (prisma as any).classroomDirectory.findFirst({
      where: { claimedUserId: userId },
    });

    if (existingClaim) {
      throw new Error(`You have already claimed directory record for ${existingClaim.originalDisplayName}`);
    }

    // Fetch claiming user
    const user = await (prisma as any).user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let auditTrail = [];
    try {
      auditTrail = typeof record.auditTrail === 'string'
        ? JSON.parse(record.auditTrail)
        : record.auditTrail || [];
    } catch {
      auditTrail = [];
    }

    auditTrail.push({
      timestamp: new Date().toISOString(),
      updatedBy: userId,
      change: `Claimed by user ${user.displayName || user.username} (${userId}) with verification ${studentId}`,
    });

    const updated = await (prisma as any).classroomDirectory.update({
      where: { id: directoryId },
      data: {
        isClaimed: true,
        claimedUserId: userId,
        claimedAt: new Date().toISOString(),
        claimVerificationMethod: 'STUDENT_ID_VERIFIED',
        auditTrail: JSON.stringify(auditTrail),
        updatedAt: new Date().toISOString(),
      },
    });

    return {
      ...updated,
      auditTrail,
      claimedUser: {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
      },
    };
  }

  async update(id: string, updatedBy: string, data: {
    originalDisplayName?: string;
    department?: string;
    notes?: string;
    reason: string;
  }) {
    const record = await (prisma as any).classroomDirectory.findUnique({ where: { id } });
    if (!record) throw new Error('Directory record not found');

    let auditTrail = [];
    try {
      auditTrail = typeof record.auditTrail === 'string'
        ? JSON.parse(record.auditTrail)
        : record.auditTrail || [];
    } catch {
      auditTrail = [];
    }

    const changes: string[] = [];
    if (data.originalDisplayName && data.originalDisplayName !== record.originalDisplayName) {
      changes.push(`Name changed from "${record.originalDisplayName}" to "${data.originalDisplayName}"`);
    }
    if (data.department && data.department !== record.department) {
      changes.push(`Department changed from "${record.department}" to "${data.department}"`);
    }
    if (data.notes !== undefined && data.notes !== record.notes) {
      changes.push('Updated administrator notes');
    }

    auditTrail.push({
      timestamp: new Date().toISOString(),
      updatedBy,
      change: `${changes.join('; ')} (Reason: ${data.reason})`,
    });

    const updated = await (prisma as any).classroomDirectory.update({
      where: { id },
      data: {
        originalDisplayName: data.originalDisplayName || record.originalDisplayName,
        normalizedName: data.originalDisplayName ? data.originalDisplayName.trim().toLowerCase() : record.normalizedName,
        department: data.department || record.department,
        notes: data.notes !== undefined ? data.notes : record.notes,
        auditTrail: JSON.stringify(auditTrail),
        updatedAt: new Date().toISOString(),
      },
    });

    return {
      ...updated,
      auditTrail,
    };
  }
}

export const directoryService = new DirectoryService();
