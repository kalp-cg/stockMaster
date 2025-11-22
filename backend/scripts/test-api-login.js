async function testLoginAPI() {
    try {
        console.log('🔍 Testing Login API Endpoint...\n');
        
        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'manager@stockmaster.com',
                password: 'Manager@123'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login API SUCCESS!\n');
            console.log('Response:', JSON.stringify(data, null, 2));
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ CREDENTIALS ARE WORKING!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
            console.log('❌ Login API FAILED!\n');
            console.log('Status:', response.status);
            console.log('Error:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error calling API:', error);
        console.log('\n⚠️  Make sure the backend server is running on http://localhost:4000\n');
    }
}

testLoginAPI();
