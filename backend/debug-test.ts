import prisma from './src/lib/prisma';
import { hashPassword } from './src/lib/auth';

async function debugTest() {
    console.log('Testing Prisma and Auth...\n');

    try {
        // Test 1: Database connection
        console.log('1. Testing database connection...');
        const userCount = await prisma.user.count();
        console.log(`✅ Database connected! Found ${userCount} users\n`);

        // Test 2: Hash password
        console.log('2. Testing password hashing...');
        const hashed = await hashPassword('test123');
        console.log(`✅ Password hashed: ${hashed.substring(0, 20)}...\n`);

        // Test 3: Find user
        console.log('3. Testing user query...');
        const user = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        });
        console.log(`✅ User found:`, user ? user.email : 'Not found\n');

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.log('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugTest();
