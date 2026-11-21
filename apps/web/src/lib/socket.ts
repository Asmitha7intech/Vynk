import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  const token = localStorage.getItem('vynk_access_token');
  if (!socket) {
    socket = io('/', {
      auth: { token },
      autoConnect: !!token,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  } else {
    // Keep auth token synchronized
    if (socket.auth && typeof socket.auth === 'object') {
      (socket.auth as any).token = token;
    }
    if (token && !socket.connected) {
      socket.connect();
    }
  }
  return socket;
}

export function connectSocket(token?: string | null): Socket {
  const authToken = token || localStorage.getItem('vynk_access_token');
  if (!socket) {
    socket = io('/', {
      auth: { token: authToken },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  } else {
    socket.auth = { token: authToken };
    if (!socket.connected && authToken) {
      socket.connect();
    }
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.auth = { token: null };
    socket.disconnect();
  }
}

