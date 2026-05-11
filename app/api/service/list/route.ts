import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import Organization from '@/models/Organization';
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

    // Verify ownership of the organization
    const org = await Organization.findOne({ _id: orgId, ownerId: user.id });
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found or access denied' }, { status: 403 });
    }

    const services = await Service.find({ orgId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
