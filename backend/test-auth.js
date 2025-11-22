const fetch = require('node-fetch');

async function testAuth() {
    console.log('🧪 Testing Authentication Flow...\n');

    // Step 1: Signup
    console.log('1️⃣ Testing Signup...');
    try {
        const signupRes = await fetch('http://localhost:4000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: `test${Date.now()}@example.com`,
                password: 'password123',
                role: 'STAFF'
            })
        });
        const signupData = await signupRes.json();
        console.log('Signup Status:', signupRes.status);
        console.log('Signup Response:', signupData);

        if (signupRes.ok) {
            console.log('✅ Signup successful!\n');

            // Step 2: Login with the same credentials
            console.log('2️⃣ Testing Login with same credentials...');
            const loginRes = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: signupData.user.email,
                    password: 'password123'
                })
            });
            const loginData = await loginRes.json();
            console.log('Login Status:', loginRes.status);
            console.log('Login Response:', loginData);

            if (loginRes.ok) {
                console.log('✅ Login successful!\n');
            } else {
                console.log('❌ Login failed:', loginData.error, '\n');
            }
        } else {
            console.log('❌ Signup failed:', signupData.error, '\n');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Step 3: Test with existing user
    console.log('3️⃣ Testing Login with admin@example.com...');
    try {
        const loginRes = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Login Response:', loginData);

        if (loginRes.ok) {
            console.log('✅ Login successful!');
        } else {
            console.log('❌ Login failed:', loginData.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testAuth();