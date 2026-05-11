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
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'serviceId is required' }, { status: 400 });
    }

    let queue = await Queue.findOne({ serviceId });

    if (!queue) {
      // Create empty queue if it doesn't exist
      // We need orgId to create it, but for now we just return empty
      return NextResponse.json({
        success: true,
        queue: { serviceId, customers: [] }
      });
    }

    return NextResponse.json({
      success: true,
      queue,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
