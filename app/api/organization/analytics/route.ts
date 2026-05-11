import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';
import Service from '@/models/Service';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'orgId is required' },
        { status: 400 }
      );
    }

    const queues = await Queue.find({ orgId }).populate('serviceId', 'name averageWaitTime totalCustomersServed');

    if (!queues || queues.length === 0) {
      return NextResponse.json({
        success: true,
        orgId,
        totalServices: 0,
        summary: {
          totalWaiting: 0,
          totalCompleted: 0,
          totalCalled: 0,
          totalSkipped: 0,
          avgWaitTimeMinutes: 0
        },
        services: [],
        busiestService: null,
      });
    }

    const servicesAnalytics: any[] = [];
    const summary = {
      totalWaiting: 0,
      totalCompleted: 0,
      totalCalled: 0,
      totalSkipped: 0,
    };

    let totalAvgWaitTime = 0;
    let servicesWithWaitTime = 0;
    let busiestService = {
      serviceId: '',
      name: '',
      waiting: -1,
    };

    queues.forEach((queue) => {
      const service = queue.serviceId as any;
      const counts = {
        waiting: 0,
        completed: 0,
        called: 0,
        skipped: 0,
      };

      queue.customers.forEach((customer) => {
        if (customer.status === 'waiting') counts.waiting++;
        else if (customer.status === 'completed') counts.completed++;
        else if (customer.status === 'called') counts.called++;
        else if (customer.status === 'skipped' || customer.status === 'transferred') counts.skipped++;
      });

      summary.totalWaiting += counts.waiting;
      summary.totalCompleted += counts.completed;
      summary.totalCalled += counts.called;
      summary.totalSkipped += counts.skipped;

      if (service?.averageWaitTime > 0) {
        totalAvgWaitTime += service.averageWaitTime;
        servicesWithWaitTime++;
      }

      const serviceData = {
        serviceId: service?._id || queue.serviceId,
        serviceName: service?.name || 'Unknown Service',
        waiting: counts.waiting,
        completed: counts.completed,
        called: counts.called,
        avgWait: service?.averageWaitTime || 0,
      };

      servicesAnalytics.push(serviceData);

      if (counts.waiting > busiestService.waiting) {
        busiestService = {
          serviceId: serviceData.serviceId.toString(),
          name: serviceData.serviceName,
          waiting: counts.waiting,
        };
      }
    });

    const orgAvgWait = servicesWithWaitTime > 0 ? Math.round(totalAvgWaitTime / servicesWithWaitTime) : 0;

    return NextResponse.json({
      success: true,
      orgId,
      totalServices: servicesAnalytics.length,
      summary: {
        ...summary,
        avgWaitTimeMinutes: orgAvgWait
      },
      services: servicesAnalytics,
      busiestService: busiestService.waiting >= 0 ? busiestService : null,
    });
  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
