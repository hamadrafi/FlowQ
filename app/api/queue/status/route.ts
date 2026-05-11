import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Queue from '@/models/Queue';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('serviceId');
    const customerId = searchParams.get('customerId');

    if (!serviceId || !customerId) {
      return NextResponse.json({ success: false, error: 'serviceId and customerId are required' }, { status: 400 });
    }

    const queue = await Queue.findOne({ serviceId });
    if (!queue) {
      return NextResponse.json({ success: false, error: 'Queue not found' }, { status: 404 });
    }

    // Find our customer in the array
    const customerIndex = queue.customers.findIndex((c: any) => c._id.toString() === customerId || c.id === customerId);
    
    if (customerIndex === -1) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const customer = queue.customers[customerIndex];

    // If customer is already completed, skipped, or transferred, their position is effectively 0
    if (customer.status !== 'waiting' && customer.status !== 'called') {
      return NextResponse.json({
        success: true,
        customer: { ...customer.toObject(), position: 0 }
      });
    }

    // Calculate RELATIVE position
    // Count how many people are 'waiting' or 'called' AND appear before this customer in the array
    const peopleAhead = queue.customers.slice(0, customerIndex).filter((c: any) => 
      c.status === 'waiting' || c.status === 'called'
    ).length;

    const relativePosition = peopleAhead + 1;

    return NextResponse.json({
      success: true,
      customer: {
        ...customer.toObject(),
        position: relativePosition
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
