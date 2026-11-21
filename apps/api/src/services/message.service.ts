import { messageRepository } from '../repositories/message.repository';
import { vynkRepository } from '../repositories/vynk.repository';
import { prisma } from '@vynk/database';
import { eventService } from './event.service';
import { broadcastToConversation, sendToUser } from '../realtime/socket';
import { blockService } from './block.service';

export const messageService = {
  getUserConversations: async (userId: string) => {
    const conversations = await messageRepository.listUserConversations(userId);

    // Compute accurate unreadCount and normalize for each conversation
    const normalized = await Promise.all(
      conversations.map(async (conv: any) => {
        const membership = conv.members?.find((m: any) => m.userId === userId);
        const lastReadAt = membership?.lastReadAt ? new Date(membership.lastReadAt) : new Date(0);

        let unreadCount = 0;
        try {
          unreadCount = await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
              createdAt: { gt: lastReadAt },
              isDeleted: false,
            },
          });
        } catch {
          unreadCount = 0;
        }

        // Format members as plain User objects to match @vynk/types Conversation interface
        const memberUsers = (conv.members || []).map((m: any) => m.user || m);

        return {
          ...conv,
          unreadCount,
          members: memberUsers,
        };
      })
    );

    return normalized;
  },

  getConversationMessages: async (conversationId: string, userId: string, take = 50) => {
    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!membership) {
      throw new Error('You do not have access to this conversation.');
    }

    return messageRepository.getConversationMessages(conversationId, take);
  },

  getOrCreateDirectConversation: async (userAId: string, userBId: string) => {
    if (userAId === userBId) {
      throw new Error('Cannot start a direct conversation with yourself.');
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userBId },
    });
    if (!targetUser) {
      throw new Error('Recipient student profile not found.');
    }

    // Verify blocking status
    const isBlocked = await blockService.isBlocked(userAId, userBId);
    if (isBlocked) {
      throw new Error('Cannot communicate with a blocked user.');
    }

    // Check for existing direct conversation
    let conv = await messageRepository.findDirectConversation(userAId, userBId);
    if (!conv) {
      conv = await messageRepository.createDirectConversation(userAId, userBId);
    }

    // Normalize members to plain User list for consistency
    const memberUsers = (conv.members || []).map((m: any) => m.user || m);
    return {
      ...conv,
      members: memberUsers,
    };
  },

  markConversationRead: async (conversationId: string, userId: string) => {
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!membership) {
      throw new Error('Conversation membership not found.');
    }

    const now = new Date();
    await prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        lastReadAt: now,
      },
    });

    return { success: true, conversationId, lastReadAt: now };
  },

  sendMessage: async (conversationId: string, senderId: string, rawContent: string, attachments: string[] = [], replyToId?: string) => {
    const content = (rawContent || '').trim();
    if (!content) {
      throw new Error('Message content cannot be empty.');
    }
    if (content.length > 5000) {
      throw new Error('Message content exceeds the 5,000 character limit.');
    }

    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
    });

    if (!membership) {
      throw new Error('You do not have permission to send messages in this conversation.');
    }

    // Check if any member has blocked the sender or vice-versa
    const members = await prisma.conversationMember.findMany({
      where: { conversationId },
    });
    for (const m of members) {
      if (m.userId !== senderId) {
        const isBlocked = await blockService.isBlocked(senderId, m.userId);
        if (isBlocked) {
          throw new Error('Cannot send messages to a blocked user.');
        }
      }
    }

    // Persist message first in transactional database
    const message = await messageRepository.createMessage(conversationId, senderId, content, attachments, replyToId);

    // Update conversation metadata
    const now = new Date();
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: now,
        lastMessageText: content.substring(0, 100),
        updatedAt: now,
      },
    });

    // Real-time broadcast to all clients in conversation room
    broadcastToConversation(conversationId, 'message:new', {
      conversationId,
      message,
    });

    // Notify other members of conversation update
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (conv?.members) {
      for (const m of conv.members) {
        if (m.userId !== senderId) {
          sendToUser(m.userId, 'conversation:updated', {
            conversationId,
            lastMessageText: content.substring(0, 100),
            lastMessageAt: now.toISOString(),
            senderId,
          });
        }
      }
    }

    // Publish privacy-safe event for analytics
    await eventService.publish({
      eventType: 'MESSAGE_SENT',
      userId: senderId,
      payload: {
        messageId: message.id,
        conversationId,
        senderId,
        contentLength: content.length,
        attachmentsCount: attachments.length,
        hasReply: !!replyToId,
      },
    });

    return message;
  },
};
