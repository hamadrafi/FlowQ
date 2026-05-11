import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'orgId is required' }, { status: 400 });
    }

    // Only look at the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const queues = await Queue.find({ orgId })
      .populate('serviceId', 'name')
      .lean();

    const activities: any[] = [];

    for (const queue of queues) {
      const serviceName = (queue.serviceId as any)?.name || 'Unknown Service';

      for (const customer of queue.customers) {
        // Completed in last 24h
        if (customer.status === 'completed' && customer.completedAt && new Date(customer.completedAt) > since) {
          activities.push({
            type: 'completed',
            customerName: customer.name,
            serviceName,
            timestamp: customer.completedAt,
          });
        }
        // Joined in last 24h
        if (customer.joinedAt && new Date(customer.joinedAt) > since) {
          activities.push({
            type: 'joined',
            customerName: customer.name,
            serviceName,
            timestamp: customer.joinedAt,
          });
        }
      }
    }

    // Sort newest first, take top 10
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recent = activities.slice(0, 10);

    return NextResponse.json({ success: true, activities: recent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
