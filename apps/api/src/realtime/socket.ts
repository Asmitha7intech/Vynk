import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { TokenPayload } from '@vynk/types';

interface AuthenticatedSocket extends Socket {
  userPayload?: TokenPayload;
}

const onlineUsers = new Map<string, string>(); // userId -> socketId

export function setupSocketServer(server: HttpServer, jwtVerifier?: (token: string) => TokenPayload) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

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
    if (!userId) return;

    onlineUsers.set(userId, socket.id);
    io.emit('user:presence', { userId, isOnline: true });

    // Join user's personal room for direct alerts
    socket.join(`user:${userId}`);

    // Room subscription for conversations (Direct, Crew squad, Mentor thread)
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Realtime message event
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
      onlineUsers.delete(userId);
      io.emit('user:presence', { userId, isOnline: false, lastSeenAt: new Date().toISOString() });
    });
  });

  return io;
}
