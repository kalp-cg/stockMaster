const fetch = require('node-fetch');

async function testSignupWithNewEmail() {
    try {
        console.log('Testing Signup with unique email...\n');

        const testUser = {
            name: 'Unique Test User',
            email: `test-${Date.now()}@example.com`,
            password: 'test123456',
            role: 'STAFF'
        };

        console.log('Sending signup request with unique email:', testUser.email);

        const response = await fetch('http://localhost:4000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
            console.log('✅ API is working perfectly!');
            console.log('The issue is in the frontend (likely browser/CORS/JavaScript)');
            console.log('\nFrontend troubleshooting needed:');
            console.log('1. Check browser console for errors');
            console.log('2. Check if form submission is being prevented');
            console.log('3. Verify CORS is working from browser');
        } else {
            console.log('❌ API issue:', data.error);
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testSignupWithNewEmail();