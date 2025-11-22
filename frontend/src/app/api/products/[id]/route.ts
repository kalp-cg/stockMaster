import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:4000/api';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${params.id}`, {
            method: 'GET',
            headers: {
                'Authorization': request.headers.get('authorization') || '',
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();

        const response = await fetch(`${API_BASE_URL}/products/${params.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': request.headers.get('authorization') || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${params.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': request.headers.get('authorization') || '',
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}