const fetch = require('node-fetch');

async function testSignupDirectly() {
    try {
        console.log('Testing Signup API call directly...\n');

        const testUser = {
            name: 'Frontend Test User',
            email: 'frontend-test@test.com',
            password: 'test123456',
            role: 'STAFF'
        };

        console.log('Sending signup request to:', 'http://localhost:4000/api/auth/signup');
        console.log('User data:', testUser);

        const response = await fetch('http://localhost:4000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.raw());

        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
            console.log('✅ API call successful - the issue is in the frontend');
            console.log('Token:', data.token ? 'Generated' : 'Missing');
            console.log('User:', data.user);
        } else {
            console.log('❌ API call failed - backend issue');
            console.log('Error:', data.error);
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testSignupDirectly();