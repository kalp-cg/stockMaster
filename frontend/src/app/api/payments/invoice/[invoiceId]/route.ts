import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
    request: NextRequest,
    { params }: { params: { invoiceId: string } }
) {
    try {
        const token = request.headers.get('Authorization');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const response = await fetch(`${API_URL}/api/payments/invoice/${params.invoiceId}`, {
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
