import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import { initSocket } from '@/lib/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('⚡ Initializing Socket.IO from API Route...');
    initSocket(res.socket.server as any);
  }
  res.end();
};

export default ioHandler;
