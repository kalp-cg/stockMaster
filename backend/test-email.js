const fetch = require('node-fetch');

async function testEmailFunctionality() {
    try {
        console.log('Testing Email Functionality (Forgot Password)...\n');

        const response = await fetch('http://localhost:4000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@stockmaster.com'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Email functionality working!');
            console.log('Message:', data.message);
            console.log('✉️ Check your email for the OTP (or check server logs)');
        } else {
            const error = await response.text();
            console.log('❌ Email test failed:', error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testEmailFunctionality();