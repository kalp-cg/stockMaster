import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams(searchParams);
    
    const response = await fetch(`${API_URL}/api/move-history?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch move history' }, { status: 500 });
  }
}
