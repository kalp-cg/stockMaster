import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const queryString = searchParams.toString();
        
        const response = await fetch(`${API_URL}/api/alerts?${queryString}`, {
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, id } = body;

        let url = `${API_URL}/api/alerts`;
        let method = 'POST';

        if (action === 'check') {
            url = `${API_URL}/api/alerts/check`;
        } else if (action === 'readAll') {
            url = `${API_URL}/api/alerts/read-all`;
            method = 'PATCH';
        } else if (action === 'read' && id) {
            url = `${API_URL}/api/alerts/${id}/read`;
            method = 'PATCH';
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': request.headers.get('authorization') || '',
                'Content-Type': 'application/json',
            },
            body: action === 'check' || action === 'readAll' || action === 'read' ? undefined : JSON.stringify(body)
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
        }

        const response = await fetch(`${API_URL}/api/alerts/${id}`, {
            method: 'DELETE',
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
