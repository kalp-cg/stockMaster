import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
    try {
        console.log('🔍 Testing Inventory Manager Login...\n');

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: 'manager@stockmaster.com' }
        });

        if (!user) {
            console.log('❌ User not found in database!\n');
            console.log('Creating user now...\n');
            
            const hashedPassword = await bcrypt.hash('Manager@123', 10);
            const newUser = await prisma.user.create({
                data: {
                    name: 'John Manager',
                    email: 'manager@stockmaster.com',
                    password: hashedPassword,
                    role: 'INVENTORY_MANAGER'
                }
            });
            
            console.log('✅ User created successfully!');
            console.log('📧 Email:', newUser.email);
            console.log('👤 Name:', newUser.name);
            console.log('🎭 Role:', newUser.role);
            console.log('🔑 Password: Manager@123\n');
            return;
        }

        console.log('✅ User found in database!');
        console.log('📧 Email:', user.email);
        console.log('👤 Name:', user.name);
        console.log('🎭 Role:', user.role);
        console.log('🆔 ID:', user.id);
        console.log('\n🔐 Testing password...');

        // Test password
        const isPasswordValid = await bcrypt.compare('Manager@123', user.password);
        
        if (isPasswordValid) {
            console.log('✅ Password is CORRECT!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email: manager@stockmaster.com');
            console.log('🔑 Password: Manager@123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('🌐 Login at: http://localhost:3000/login\n');
        } else {
            console.log('❌ Password is INCORRECT!\n');
            console.log('Resetting password to: Manager@123\n');
            
            const newHashedPassword = await bcrypt.hash('Manager@123', 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: newHashedPassword }
            });
            
            console.log('✅ Password has been reset!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email: manager@stockmaster.com');
            console.log('🔑 Password: Manager@123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
