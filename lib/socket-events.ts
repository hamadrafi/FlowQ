import { getIO } from './socket';

export type QueueEventType = 'joined' | 'called' | 'completed' | 'skipped' | 'transferred' | 'left';

interface EmitQueueUpdateParams {
  serviceId: string;
  type: QueueEventType;
  customer: any;
  queueLength?: number;
  fromServiceId?: string;
  toServiceId?: string;
}

/**
 * Utility to emit queue updates to the relevant rooms.
 */
export const emitQueueUpdate = ({
  serviceId,
  type,
  customer,
  queueLength,
  fromServiceId,
  toServiceId,
}: EmitQueueUpdateParams) => {
  const io = getIO();
  if (!io) {
    console.warn('⚠️  Socket.IO not initialized. Event not emitted:', type);
    return;
  }

  const payload: any = {
    serviceId,
    type,
    customer,
  };

  if (queueLength !== undefined) payload.queueLength = queueLength;
  if (fromServiceId) payload.fromServiceId = fromServiceId;
  if (toServiceId) payload.toServiceId = toServiceId;

  // Emit to specific service room
  const roomName = `service_${serviceId}`;
  io.to(roomName).emit('queue_updated', payload);
  
  console.log(`📡 Socket Event: "queue_updated" emitted to ${roomName} [Type: ${type}]`);

  // Special case for transfer: also emit to the other involved room
  if (type === 'transferred') {
    const otherServiceId = fromServiceId === serviceId ? toServiceId : fromServiceId;
    if (otherServiceId) {
      const otherRoom = `service_${otherServiceId}`;
      io.to(otherRoom).emit('queue_updated', payload);
      console.log(`📡 Socket Event: "queue_updated" also emitted to ${otherRoom} [Type: transferred]`);
    }
  }
};
