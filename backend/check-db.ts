import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    console.log('=== DATABASE CHECK ===\n');

    // Check Users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            resetPasswordToken: true,
            resetPasswordExpires: true,
        },
    });
    console.log(`📊 Total Users: ${users.length}`);
    console.log('Users:', JSON.stringify(users, null, 2));
    console.log('\n');

    // Check Products
    const products = await prisma.product.count();
    console.log(`📦 Total Products: ${products}`);

    // Check Locations
    const locations = await prisma.location.count();
    console.log(`📍 Total Locations: ${locations}`);

    // Check Vendors
    const vendors = await prisma.vendor.count();
    console.log(`🏢 Total Vendors: ${vendors}`);

    // Check Receipts
    const receipts = await prisma.receiptOrder.count();
    console.log(`📥 Total Receipts: ${receipts}`);

    // Check Deliveries
    const deliveries = await prisma.deliveryOrder.count();
    console.log(`📤 Total Deliveries: ${deliveries}`);

    // Check Transfers
    const transfers = await prisma.internalTransfer.count();
    console.log(`🔄 Total Transfers: ${transfers}`);

    // Check Adjustments
    const adjustments = await prisma.stockAdjustment.count();
    console.log(`⚙️ Total Adjustments: ${adjustments}`);

    // Check Move History
    const moveHistory = await prisma.moveHistory.count();
    console.log(`📜 Total Move History Records: ${moveHistory}`);

    await prisma.$disconnect();
}

checkDatabase().catch((e) => {
    console.error(e);
    process.exit(1);
});
