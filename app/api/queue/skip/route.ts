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

    // Find first customer with status 'called' or 'waiting'
    const customerToSkip = queue.customers.find(
      (c) => c.status === 'called' || c.status === 'waiting'
    );

    if (!customerToSkip) {
      return NextResponse.json(
        { success: false, error: 'No active or waiting customers to skip' },
        { status: 400 }
      );
    }

    // Update status to 'skipped'
    customerToSkip.status = 'skipped';
    // No specific skip timestamp in the requested fields, but we mark it.

    await queue.save();

    // Emit real-time update
    emitQueueUpdate({
      serviceId,
      type: 'skipped',
      customer: customerToSkip,
    });

    return NextResponse.json({
      success: true,
      customer: customerToSkip,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
