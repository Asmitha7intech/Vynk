import { prisma, MentorshipStatus } from '@vynk/database';

export const mentorRepository = {
  listAll: (category?: string) => prisma.mentorProfile.findMany({
    where: category ? { expertiseCategories: { has: category } } : undefined,
    include: {
      user: {
        include: { skills: true },
      },
    },
    orderBy: { rating: 'desc' },
  }),

  findByUserId: (userId: string) => prisma.mentorProfile.findUnique({
    where: { userId },
    include: {
      user: true,
      requestsReceived: {
        include: { student: true },
      },
    },
  }),

  findById: (id: string) => prisma.mentorProfile.findUnique({
    where: { id },
    include: {
      user: { include: { skills: true } },
    },
  }),

  createProfile: (userId: string, data: any) => prisma.mentorProfile.create({
    data: {
      ...data,
      userId,
    },
    include: { user: true },
  }),

  createRequest: (studentId: string, data: any) => prisma.mentorshipRequest.create({
    data: {
      studentId,
      mentorId: data.mentorId,
      topic: data.topic,
      goalDescription: data.goalDescription,
      currentChallenge: data.currentChallenge,
      proposedMeetingTimes: data.proposedMeetingTimes,
      status: MentorshipStatus.PENDING,
    },
    include: {
      student: true,
      mentor: { include: { user: true } },
    },
  }),

  updateRequestStatus: (requestId: string, status: MentorshipStatus, note?: string) => prisma.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status,
      mentorNote: note,
    },
    include: { student: true, mentor: { include: { user: true } } },
  }),
};
