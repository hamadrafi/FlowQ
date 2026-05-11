import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import { emitQueueUpdate } from '@/lib/socket-events';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { fromServiceId, toServiceId, phone, name, position } = body;

    // Validate required fields
    if (!fromServiceId || !toServiceId) {
      return NextResponse.json(
        { success: false, error: 'fromServiceId and toServiceId are required' },
        { status: 400 }
      );
    }

    if (!phone && !name && !position) {
      return NextResponse.json(
        { success: false, error: 'Customer identifier (phone, name, or position) is required' },
        { status: 400 }
      );
    }

    // Find source and destination queues
    const [sourceQueue, destQueue] = await Promise.all([
      Queue.findOne({ serviceId: fromServiceId }),
      Queue.findOne({ serviceId: toServiceId }),
    ]);

    if (!sourceQueue) {
      return NextResponse.json(
        { success: false, error: 'Source queue not found' },
        { status: 404 }
      );
    }

    if (!destQueue) {
      return NextResponse.json(
        { success: false, error: 'Destination queue not found' },
        { status: 404 }
      );
    }

    // Locate customer in source queue (only active customers)
    let customerIndex = -1;
    if (phone) {
      customerIndex = sourceQueue.customers.findIndex(
        (c) => c.phone === phone && (c.status === 'waiting' || c.status === 'called')
      );
    } else if (name) {
      customerIndex = sourceQueue.customers.findIndex(
        (c) => c.name === name && (c.status === 'waiting' || c.status === 'called')
      );
    } else if (position) {
      customerIndex = sourceQueue.customers.findIndex(
        (c) => c.position === position && (c.status === 'waiting' || c.status === 'called')
      );
    }

    if (customerIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Customer not found in source queue or not in an active state' },
        { status: 404 }
      );
    }

    const customer = sourceQueue.customers[customerIndex];

    // Check if customer already exists in destination queue to prevent duplicates
    const isDuplicate = destQueue.customers.some(
      (c) => 
        (phone && c.phone === phone && (c.status === 'waiting' || c.status === 'called')) ||
        (!phone && c.name === customer.name && (c.status === 'waiting' || c.status === 'called'))
    );

    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: 'Customer is already in the destination queue' },
        { status: 400 }
      );
    }

    // Mark customer as transferred in source queue
    customer.status = 'transferred';

    // Create new customer entry for destination queue
    const newCustomer = {
      name: customer.name,
      phone: customer.phone,
      status: 'waiting',
      position: destQueue.customers.length + 1,
      joinedAt: new Date(),
      transferredFrom: fromServiceId,
    };

    // Add customer to destination queue
    destQueue.customers.push(newCustomer as any);

    // Save both queues
    await Promise.all([sourceQueue.save(), destQueue.save()]);

    const updatedCustomer = destQueue.customers[destQueue.customers.length - 1];

    // Emit real-time update to both rooms
    emitQueueUpdate({
      serviceId: toServiceId,
      type: 'transferred',
      customer: updatedCustomer,
      fromServiceId,
      toServiceId,
    });

    return NextResponse.json({
      success: true,
      message: 'customer transferred successfully',
      from: fromServiceId,
      to: toServiceId,
      customer: updatedCustomer,
    });
  } catch (error: any) {
    console.error('Transfer API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
