import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { TokenPayload } from '@vynk/types';
import { prisma } from '@vynk/database';

interface AuthenticatedSocket extends Socket {
  userPayload?: TokenPayload;
}

// Multi-session tracking: userId -> Set of active socket IDs
const userSockets = new Map<string, Set<string>>();
let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function isUserOnline(userId: string): boolean {
  const set = userSockets.get(userId);
  return !!set && set.size > 0;
}

export function getOnlineUserIds(): string[] {
  const online: string[] = [];
  for (const [userId, set] of userSockets.entries()) {
    if (set.size > 0) {
      online.push(userId);
    }
  }
  return online;
}

export function broadcastToConversation(conversationId: string, event: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`conv:${conversationId}`).emit(event, data);
  }
}

export function sendToUser(userId: string, event: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}

export function setupSocketServer(server: HttpServer, jwtVerifier?: (token: string) => TokenPayload) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance = io;

  // JWT Middleware for WebSockets
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      if (jwtVerifier) {
        socket.userPayload = jwtVerifier(token);
      } else {
        // Basic payload decode fallback
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          socket.userPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        }
      }
      next();
    } catch (err) {
      next(new Error('Invalid or expired socket token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userPayload?.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Register active socket for this user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    const currentSessions = userSockets.get(userId)!;
    const wasOffline = currentSessions.size === 0;
    currentSessions.add(socket.id);

    // Join user's personal room for direct events (notifications, direct chats, friend requests)
    socket.join(`user:${userId}`);

    if (wasOffline) {
      io.emit('user:presence', { userId, isOnline: true });
    }

    // Send current list of online users to the newly connected client
    socket.emit('presence:initial', { onlineUserIds: getOnlineUserIds() });

    // Room subscription for conversations with authorization check
    socket.on('conversation:join', async (conversationId: string) => {
      try {
        const member = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });
        if (member) {
          socket.join(`conv:${conversationId}`);
        } else {
          socket.emit('error', { message: 'Unauthorized conversation room' });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to join conversation room' });
      }
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Room subscription for communities
    socket.on('community:join', async (communityId: string) => {
      try {
        const community = await prisma.community.findUnique({
          where: { id: communityId },
          include: {
            members: {
              where: { userId },
            },
          },
        });
        if (!community) {
          socket.emit('error', { message: 'Community not found' });
          return;
        }
        if (community.isPrivate) {
          const isApproved = community.members.some((m: any) => m.status === 'APPROVED');
          if (!isApproved) {
            socket.emit('error', { message: 'Unauthorized private community' });
            return;
          }
        }
        socket.join(`community:${communityId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join community room' });
      }
    });

    socket.on('community:leave', (communityId: string) => {
      socket.leave(`community:${communityId}`);
    });

    // Realtime message event (fallback socket event)
    socket.on('message:send', (data: { conversationId: string; message: any }) => {
      socket.to(`conv:${data.conversationId}`).emit('message:new', data);
    });

    // Typing indicators
    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('typing:status', {
        conversationId,
        userId,
        username: socket.userPayload?.username,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('typing:status', {
        conversationId,
        userId,
        username: socket.userPayload?.username,
        isTyping: false,
      });
    });

    socket.on('disconnect', () => {
      const sessions = userSockets.get(userId);
      if (sessions) {
        sessions.delete(socket.id);
        if (sessions.size === 0) {
          userSockets.delete(userId);
          io.emit('user:presence', { userId, isOnline: false, lastSeenAt: new Date().toISOString() });
        }
      }
    });
  });

  return io;
}
