import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import { emitQueueUpdate } from '@/lib/socket-events';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { orgId, serviceId, name, phone } = body;

    if (!orgId || !serviceId || !name) {
      return NextResponse.json(
        { success: false, error: 'orgId, serviceId, and name are required' },
        { status: 400 }
      );
    }

    // Find the queue for this service
    let queue = await Queue.findOne({ serviceId });

    if (!queue) {
      // If no queue exists for this service, create one
      queue = await Queue.create({
        orgId,
        serviceId,
        customers: [],
      });
    }

    // Calculate the new position based on how many people are currently in the queue (waiting or called)
    const activeCustomers = queue.customers.filter((c: any) => c.status === 'waiting' || c.status === 'called');
    const newPosition = activeCustomers.length + 1;

    const newCustomer = {
      name,
      phone,
      status: 'waiting',
      position: newPosition,
      joinedAt: new Date(),
    };

    queue.customers.push(newCustomer);
    await queue.save();

    // Get the newly added customer (the last one in the array)
    const addedCustomer = queue.customers[queue.customers.length - 1];

    // Emit real-time update
    emitQueueUpdate({
      serviceId,
      type: 'joined',
      customer: addedCustomer,
      queueLength: queue.customers.length,
    });

    return NextResponse.json({
      success: true,
      position: newPosition,
      customer: addedCustomer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
