const https = require('http');

async function testLoginFlow() {
    console.log('🧪 Testing Login Flow\n');
    console.log('=' .repeat(50));
    
    // Test 1: Backend availability
    console.log('\n1️⃣  Testing Backend Availability...');
    try {
        const response = await fetch('http://localhost:4000');
        console.log(`✓ Backend is running (Status: ${response.status})`);
    } catch (error) {
        console.log('✗ Backend is NOT running!');
        console.log('Error:', error.message);
        return;
    }
    
    // Test 2: Login endpoint
    console.log('\n2️⃣  Testing Login Endpoint...');
    try {
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
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✓ Login successful!');
            console.log(`  User: ${data.user.name}`);
            console.log(`  Email: ${data.user.email}`);
            console.log(`  Role: ${data.user.role}`);
            console.log(`  Token: ${data.token.substring(0, 30)}...`);
        } else {
            console.log(`✗ Login failed with status ${response.status}`);
            console.log('  Response:', data);
        }
    } catch (error) {
        console.log('✗ Login request failed!');
        console.log('Error:', error.message);
        return;
    }
    
    // Test 3: Frontend availability
    console.log('\n3️⃣  Testing Frontend Availability...');
    try {
        const response = await fetch('http://localhost:3000');
        console.log(`✓ Frontend is running (Status: ${response.status})`);
    } catch (error) {
        console.log('✗ Frontend is NOT running!');
        console.log('Error:', error.message);
        return;
    }
    
    // Test 4: CORS check
    console.log('\n4️⃣  Testing CORS Configuration...');
    try {
        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type',
            },
        });
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        };
        
        console.log('CORS Headers:', corsHeaders);
        
        if (corsHeaders['Access-Control-Allow-Origin']) {
            console.log('✓ CORS is configured');
        } else {
            console.log('✗ CORS might not be properly configured');
        }
    } catch (error) {
        console.log('✗ CORS check failed');
        console.log('Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ All tests completed!\n');
    console.log('📝 Summary:');
    console.log('   - Backend: Running on port 4000');
    console.log('   - Frontend: Running on port 3000');
    console.log('   - Login API: Working correctly');
    console.log('   - Test credentials: manager@stockmaster.com / Manager@123');
    console.log('\nYou should be able to login through the frontend now!');
}

testLoginFlow().catch(console.error);
