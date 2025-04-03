import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    return NextResponse.json({ 
      error: 'This endpoint is deprecated',
      message: 'Direct audio download for Twitter videos is currently not supported'
    }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Server error',
    }, { status: 500 });
  }
} 