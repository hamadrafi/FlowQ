import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Singleton pattern for Socket.IO server to prevent multiple instances
 * during development hot reloads.
 */

interface GlobalWithSocket {
  io: SocketIOServer | undefined;
}

const globalWithSocket = global as unknown as GlobalWithSocket;

export const initSocket = (server: NetServer) => {
  if (!globalWithSocket.io) {
    console.log('🚀 Initializing Socket.IO server...');
    
    const io = new SocketIOServer(server, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: '*', // Adjust this for production
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log(`📡 Client connected: ${socket.id}`);

      // Handle joining organization rooms
      socket.on('join_org', (orgId: string) => {
        if (orgId) {
          const roomName = `org_${orgId}`;
          socket.join(roomName);
          console.log(`🏠 Client ${socket.id} joined room: ${roomName}`);
        }
      });

      // Handle joining service rooms
      socket.on('join_service', (serviceId: string) => {
        if (serviceId) {
          const roomName = `service_${serviceId}`;
          socket.join(roomName);
          console.log(`🛠️ Client ${socket.id} joined room: ${roomName}`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    globalWithSocket.io = io;
    (server as any).io = io;
  }

  return globalWithSocket.io;
};

export const getIO = () => {
  if (!globalWithSocket.io) {
    // In some cases we might want to return null instead of throwing
    return null;
  }
  return globalWithSocket.io;
};
