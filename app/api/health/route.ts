import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    
    return NextResponse.json({
      status: "ok",
      db: "connected"
    });
  } catch (error: any) {
    console.error('Database connection error:', error.message);
    
    return NextResponse.json(
      {
        status: "error",
        message: "db connection failed"
      },
      { status: 500 }
    );
  }
}
