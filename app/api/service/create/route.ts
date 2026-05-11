import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import Organization from '@/models/Organization';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orgId, name, description, estimatedTime } = body;

    if (!orgId || !name) {
      return NextResponse.json(
        { success: false, error: 'orgId and name are required' },
        { status: 400 }
      );
    }

    // Validate organization exists and user owns it
    const organization = await Organization.findById(orgId);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (organization.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to manage this organization' },
        { status: 403 }
      );
    }

    const service = await Service.create({
      orgId,
      name,
      description,
      estimatedTime,
    });

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
