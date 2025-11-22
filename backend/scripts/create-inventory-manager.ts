import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createInventoryManager() {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: 'manager@stockmaster.com' }
        });

        if (existingUser) {
            console.log('✅ Inventory Manager already exists!');
            console.log('\n📧 Email: manager@stockmaster.com');
            console.log('🔑 Password: Manager@123');
            console.log('👤 Role: INVENTORY_MANAGER\n');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('Manager@123', 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name: 'John Manager',
                email: 'manager@stockmaster.com',
                password: hashedPassword,
                role: 'INVENTORY_MANAGER'
            }
        });

        console.log('✅ Inventory Manager created successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: manager@stockmaster.com');
        console.log('🔑 Password: Manager@123');
        console.log('👤 Name: John Manager');
        console.log('🎭 Role: INVENTORY_MANAGER');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🔐 Login at: http://localhost:3000/login\n');

    } catch (error) {
        console.error('❌ Error creating Inventory Manager:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createInventoryManager();
