const fetch = require('node-fetch');

async function testEndpoints() {
    console.log('Testing Backend Endpoints...\n');

    // Test 1: Health check
    try {
        const health = await fetch('http://localhost:4000/');
        const healthText = await health.text();
        console.log('✅ Health Check:', healthText);
    } catch (e) {
        console.log('❌ Health Check Failed:', e.message);
    }

    // Test 2: Signup (create new user)
    try {
        const signup = await fetch('http://localhost:4000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: `test${Date.now()}@example.com`,
                password: 'password123'
            })
        });
        const signupData = await signup.json();
        console.log('\n✅ Signup Status:', signup.status);
        console.log('Signup Response:', signupData);

        if (signupData.token) {
            // Test 3: Get current user
            const me = await fetch('http://localhost:4000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${signupData.token}` }
            });
            const meData = await me.json();
            console.log('\n✅ Get Me Status:', me.status);
            console.log('Me Response:', meData);
        }
    } catch (e) {
        console.log('❌ Signup Failed:', e.message);
    }

    // Test 4: Login with existing user
    try {
        const login = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });
        const loginData = await login.json();
        console.log('\n📝 Login Status:', login.status);
        console.log('Login Response:', loginData);
    } catch (e) {
        console.log('❌ Login Error:', e.message);
    }
}

testEndpoints();
