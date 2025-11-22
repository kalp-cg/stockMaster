const bcrypt = require('bcryptjs');

async function testPasswordHashing() {
    const password = 'password123';

    console.log('Testing password hashing...\n');

    // Test hashing
    const hashed = await bcrypt.hash(password, 10);
    console.log('Original password:', password);
    console.log('Hashed password:', hashed);

    // Test verification
    const isValid = await bcrypt.compare(password, hashed);
    console.log('Verification result:', isValid);

    // Test with wrong password
    const isWrong = await bcrypt.compare('wrongpassword', hashed);
    console.log('Wrong password result:', isWrong);
}

testPasswordHashing();
