import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';

/**
 * Server-Sent Events endpoint for real-time queue position updates.
 * The customer's phone connects here and the server pushes an update
 * every 3 seconds with the customer's current position/status.
 *
 * This works natively in Next.js App Router without needing Socket.IO.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get('serviceId');
  const customerId = searchParams.get('customerId');

  if (!serviceId || !customerId) {
    return new Response('serviceId and customerId required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let intervalId: any;
      let isClosed = false;  // guard flag

      const sendUpdate = async () => {
        if (isClosed) return;  // stop immediately if client disconnected
        try {
          await connectDB();
          const queue = await Queue.findOne({ serviceId });

          if (!queue) {
            if (!isClosed) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'queue_not_found' })}\n\n`));
            return;
          }

          const customerIndex = queue.customers.findIndex(
            (c: any) => c._id.toString() === customerId
          );

          if (customerIndex === -1) {
            if (!isClosed) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'customer_not_found' })}\n\n`));
            return;
          }

          const customer = queue.customers[customerIndex];

          let position = 0;
          if (customer.status === 'waiting' || customer.status === 'called') {
            const peopleAhead = queue.customers
              .slice(0, customerIndex)
              .filter((c: any) => c.status === 'waiting' || c.status === 'called').length;
            position = peopleAhead + 1;
          }

          const payload = {
            customerId,
            status: customer.status,
            position,
            name: customer.name,
          };

          if (!isClosed) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          }
        } catch (err) {
          if (!isClosed) console.error('[SSE] Error sending update:', err);
        }
      };

      // Send immediately on connection
      await sendUpdate();

      // Then send every 3 seconds
      intervalId = setInterval(sendUpdate, 3000);

      // Clean up when the client disconnects
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(intervalId);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
