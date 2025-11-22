const fetch = require('node-fetch');

async function testLogin() {
    try {
        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Login successful!');
            console.log('Token:', data.token);
        } else {
            console.log('❌ Login failed:', data.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testLogin();
