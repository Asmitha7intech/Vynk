import { prisma, ConversationType } from '@vynk/database';

export const messageRepository = {
  findDirectConversation: (userAId: string, userBId: string) => prisma.conversation.findFirst({
    where: {
      type: ConversationType.DIRECT,
      AND: [
        { members: { some: { userId: userAId } } },
        { members: { some: { userId: userBId } } },
      ],
    },
    include: {
      members: { include: { user: true } },
    },
  }),

  createDirectConversation: (userAId: string, userBId: string) => prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      members: {
        create: [
          { userId: userAId },
          { userId: userBId },
        ],
      },
    },
    include: {
      members: { include: { user: true } },
    },
  }),

  createCrewConversation: (crewId: string, title: string, memberUserIds: string[]) => prisma.conversation.create({
    data: {
      type: ConversationType.CREW,
      title,
      crewId,
      members: {
        create: memberUserIds.map((userId) => ({ userId })),
      },
    },
    include: {
      members: { include: { user: true } },
    },
  }),

  createMentorConversation: (requestId: string, title: string, studentId: string, mentorUserId: string) => prisma.conversation.create({
    data: {
      type: ConversationType.MENTOR,
      title,
      mentorshipRequestId: requestId,
      members: {
        create: [
          { userId: studentId },
          { userId: mentorUserId },
        ],
      },
    },
    include: {
      members: { include: { user: true } },
    },
  }),

  listUserConversations: (userId: string) => prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: { include: { user: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  }),

  getConversationMessages: (conversationId: string, take = 50) => prisma.message.findMany({
    where: { conversationId, isDeleted: false },
    include: { sender: true },
    orderBy: { createdAt: 'asc' },
    take,
  }),

  createMessage: (conversationId: string, senderId: string, content: string, attachments: string[] = [], replyToId?: string) => prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
      attachments,
      replyToId,
    },
    include: { sender: true },
  }),
};
