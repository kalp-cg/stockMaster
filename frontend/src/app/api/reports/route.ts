import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const reportType = searchParams.get('type') || 'stock';
        searchParams.delete('type');
        const queryString = searchParams.toString();
        
        const response = await fetch(`${API_URL}/api/reports/${reportType}?${queryString}`, {
            headers: {
                'Authorization': request.headers.get('authorization') || '',
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
