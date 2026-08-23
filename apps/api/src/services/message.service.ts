import { messageRepository } from '../repositories/message.repository';
import { vynkRepository } from '../repositories/vynk.repository';
import { prisma } from '@vynk/database';

export const messageService = {
  getUserConversations: (userId: string) => messageRepository.listUserConversations(userId),

  getConversationMessages: async (conversationId: string, userId: string) => {
    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!membership) {
      throw new Error('You do not have access to this conversation.');
    }

    return messageRepository.getConversationMessages(conversationId);
  },

  getOrCreateDirectConversation: async (userAId: string, userBId: string) => {
    // Rule: Direct messaging requires an ACCEPTED Vynk
    const connection = await vynkRepository.findConnection(userAId, userBId);
    if (!connection || connection.status !== 'ACCEPTED') {
      throw new Error('Direct messaging is only available between accepted Vynks (connections).');
    }

    let conv = await messageRepository.findDirectConversation(userAId, userBId);
    if (!conv) {
      conv = await messageRepository.createDirectConversation(userAId, userBId);
    }
    return conv;
  },

  sendMessage: async (conversationId: string, senderId: string, content: string, attachments: string[] = [], replyToId?: string) => {
    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
    });

    if (!membership) {
      throw new Error('You do not have permission to send messages in this conversation.');
    }

    const message = await messageRepository.createMessage(conversationId, senderId, content, attachments, replyToId);

    // Update conversation last message timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: content.substring(0, 100),
      },
    });

    return message;
  },
};
