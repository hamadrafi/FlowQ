import { io, Socket } from 'socket.io-client';

/**
 * Client-side Socket.IO singleton.
 * Ensures only one connection is maintained per client session.
 */

let socket: Socket | undefined;

export const getSocket = () => {
  if (!socket) {
    console.log('🔌 Connecting to Socket.IO server...');
    
    // The path must match the one defined on the server
    socket = io({
      path: '/api/socket/io',
      addTrailingSlash: false,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to real-time server');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from real-time server');
    });
  }

  return socket;
};

/**
 * Utility functions for joining rooms
 */
export const joinOrgRoom = (orgId: string) => {
  const s = getSocket();
  if (s) {
    s.emit('join_org', orgId);
  }
};

export const joinServiceRoom = (serviceId: string) => {
  const s = getSocket();
  if (s) {
    s.emit('join_service', serviceId);
  }
};
