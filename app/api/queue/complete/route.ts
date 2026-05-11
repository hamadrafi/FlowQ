import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';

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

    const currentCustomer = queue.customers.find((c) => c.status === 'called');

    if (!currentCustomer) {
      return NextResponse.json(
        { success: false, error: 'No customer is currently called' },
        { status: 400 }
      );
    }

    // Mark completed
    currentCustomer.status = 'completed';
    currentCustomer.completedAt = new Date();

    // Calculate actual wait time
    const joinedAt = new Date(currentCustomer.joinedAt);
    const completedAt = new Date(currentCustomer.completedAt);
    const waitTimeMinutes = Math.round((completedAt.getTime() - joinedAt.getTime()) / 60000);

    await queue.save();

    // Update Service Analytics (rolling average)
    const Service = (await import('@/models/Service')).default;
    const service = await Service.findById(serviceId);
    if (service) {
      const currentTotal = service.totalCustomersServed || 0;
      const currentAvg = service.averageWaitTime || 0;
      const newTotal = currentTotal + 1;
      const newAvg = Math.round(((currentAvg * currentTotal) + waitTimeMinutes) / newTotal);
      service.totalCustomersServed = newTotal;
      service.averageWaitTime = newAvg;
      await service.save();
    }

    // NOTE: No socket emission needed.
    // The SSE stream at /api/queue/stream polls every 3 seconds and will
    // automatically pick up the new status for each connected customer.

    return NextResponse.json({
      success: true,
      customer: currentCustomer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
