import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import { emitQueueUpdate } from '@/lib/socket-events';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { serviceId } = body;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId is required' },
        { status: 400 }
      );
    }

    const queue = await Queue.findOne({ serviceId });

    if (!queue) {
      return NextResponse.json(
        { success: false, error: 'Queue not found' },
        { status: 404 }
      );
    }

    // Find the first customer with status 'waiting'
    const nextCustomer = queue.customers.find((c) => c.status === 'waiting');

    if (!nextCustomer) {
      return NextResponse.json({
        success: true,
        message: 'Queue is empty',
        customer: null,
      });
    }

    // Update customer status to 'called'
    nextCustomer.status = 'called';
    nextCustomer.calledAt = new Date();

    await queue.save();

    // Emit real-time update
    emitQueueUpdate({
      serviceId,
      type: 'called',
      customer: nextCustomer,
    });

    return NextResponse.json({
      success: true,
      customer: nextCustomer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
