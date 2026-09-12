import { prisma } from '@vynk/database';

export const institutionsService = {
  listApproved: async () => {
    return prisma.institution.findMany({
      where: { isApproved: true },
      orderBy: { name: 'asc' },
    });
  },

  verifyCampusEmail: async (userId: string, institutionId: string, campusEmail: string) => {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new Error('Institution not found');
    }

    const emailDomain = campusEmail.split('@')[1]?.toLowerCase();
    const isDomainMatch = institution.domains.some((d) => d.toLowerCase() === emailDomain);

    if (!isDomainMatch) {
      throw new Error(`Email '${campusEmail}' does not belong to verified domains for ${institution.name}`);
    }

    const verification = await prisma.studentVerification.upsert({
      where: { userId },
      update: {
        institutionId,
        campusEmail,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
      create: {
        userId,
        institutionId,
        campusEmail,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    // Update User college and emailVerified flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        college: institution.name,
        emailVerified: true,
      },
    });

    return verification;
  },
};
