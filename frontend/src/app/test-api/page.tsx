'use client';

import { useState } from 'react';

export default function TestApiPage() {
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const testLogin = async () => {
        setLoading(true);
        setResult('Testing...');
        try {
            console.log('Sending request to http://localhost:4000/api/auth/login');
            const response = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'manager@stockmaster.com',
                    password: 'Manager@123'
                }),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                setResult(`✓ SUCCESS!\n\nStatus: ${response.status}\n\nUser: ${data.user.name}\nEmail: ${data.user.email}\nRole: ${data.user.role}\n\nToken: ${data.token.substring(0, 20)}...`);
            } else {
                setResult(`✗ FAILED\n\nStatus: ${response.status}\n\nError: ${JSON.stringify(data, null, 2)}`);
            }
        } catch (error: any) {
            console.error('Error:', error);
            setResult(`✗ ERROR\n\n${error.message}\n\nCheck browser console for details`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
                
                <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                    <p className="text-gray-700 mb-4">
                        This will test if the frontend can connect to the backend API.
                    </p>
                    <button
                        onClick={testLogin}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Testing...' : 'Test Login API'}
                    </button>
                </div>

                {result && (
                    <div className={`p-6 rounded-lg shadow-md font-mono text-sm whitespace-pre-wrap ${
                        result.startsWith('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                        {result}
                    </div>
                )}

                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h2 className="font-semibold text-blue-900 mb-2">Test Details:</h2>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Backend URL: http://localhost:4000</li>
                        <li>• Endpoint: /api/auth/login</li>
                        <li>• Email: manager@stockmaster.com</li>
                        <li>• Password: Manager@123</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
