import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';

/**
 * POST /api/queue/leave
 * Allows a customer to leave the queue voluntarily.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { serviceId, phone } = body;

    if (!serviceId || !phone) {
      return NextResponse.json(
        { success: false, error: 'serviceId and phone are required' },
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

    // Find the customer in the queue by phone number
    // Only looking for those who are currently 'waiting' or 'called'
    const customer = queue.customers.find(
      (c) => c.phone === phone && (c.status === 'waiting' || c.status === 'called')
    );

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found in active queue' },
        { status: 404 }
      );
    }

    // Update status to 'skipped' (representing they left or were skipped)
    customer.status = 'skipped';

    await queue.save();

    return NextResponse.json({
      success: true,
      message: 'Customer removed from queue',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
