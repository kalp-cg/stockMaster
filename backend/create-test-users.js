const fetch = require('node-fetch');

async function createTestUsers() {
    try {
        console.log('Creating test users for role-based authentication...\n');

        const users = [
            {
                name: 'System Administrator',
                email: 'admin@stockmaster.com',
                password: 'admin123',
                role: 'ADMIN'
            },
            {
                name: 'Inventory Manager',
                email: 'manager@stockmaster.com', 
                password: 'manager123',
                role: 'INVENTORY_MANAGER'
            },
            {
                name: 'Staff Member',
                email: 'staff@stockmaster.com',
                password: 'staff123',
                role: 'STAFF'
            }
        ];

        for (const user of users) {
            console.log(`Creating ${user.role}: ${user.email}`);
            
            const response = await fetch('http://localhost:4000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${user.role} created successfully`);
                console.log(`   ID: ${data.user.id}`);
                console.log(`   Name: ${data.user.name}`);
                console.log(`   Role: ${data.user.role}\n`);
            } else {
                const error = await response.text();
                console.log(`❌ Failed to create ${user.role}: ${error}\n`);
            }
        }

        console.log('🔐 Test Users Created! You can now login with:');
        console.log('');
        console.log('ADMIN ACCESS:');
        console.log('  Email: admin@stockmaster.com');
        console.log('  Password: admin123');
        console.log('  - Full system access including user management');
        console.log('');
        console.log('INVENTORY MANAGER ACCESS:');
        console.log('  Email: manager@stockmaster.com');
        console.log('  Password: manager123');
        console.log('  - Complete inventory operations');
        console.log('');
        console.log('STAFF ACCESS:');
        console.log('  Email: staff@stockmaster.com');
        console.log('  Password: staff123');
        console.log('  - Basic operations only');
        console.log('');
        console.log('🌐 Access the application at:');
        console.log('  Frontend: http://localhost:3000/login');
        console.log('  Backend API: http://localhost:4000');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createTestUsers();