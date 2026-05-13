import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify API functionality
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'API is working correctly!',
      timestamp: new Date().toISOString(),
      path: request.url,
      method: 'GET',
      status: 'success'
    }, { status: 200 });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Test endpoint failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'POST test successful!',
      receivedData: body,
      timestamp: new Date().toISOString(),
      status: 'success'
    }, { status: 200 });
  } catch (error) {
    console.error('Error in test POST endpoint:', error);
    return NextResponse.json(
      { error: 'Test POST endpoint failed' },
      { status: 500 }
    );
  }
}
