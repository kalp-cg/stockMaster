import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stockmaster.com' },
    update: {},
    create: {
      email: 'admin@stockmaster.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create sample inventory managers
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager1 = await prisma.user.upsert({
    where: { email: 'manager@stockmaster.com' },
    update: {},
    create: {
      email: 'manager@stockmaster.com',
      name: 'John Manager',
      password: managerPassword,
      role: 'INVENTORY_MANAGER',
    },
  });

  const manager2 = await prisma.user.upsert({
    where: { email: 'sarah.manager@stockmaster.com' },
    update: {},
    create: {
      email: 'sarah.manager@stockmaster.com',
      name: 'Sarah Thompson',
      password: managerPassword,
      role: 'INVENTORY_MANAGER',
    },
  });

  console.log('✅ Inventory Managers created: 2 managers');

  // Create sample staff users
  const staffPassword = await bcrypt.hash('staff123', 10);
  
  const staff1 = await prisma.user.upsert({
    where: { email: 'alice@stockmaster.com' },
    update: {},
    create: {
      email: 'alice@stockmaster.com',
      name: 'Alice Johnson',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'bob@stockmaster.com' },
    update: {},
    create: {
      email: 'bob@stockmaster.com',
      name: 'Bob Smith',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const staff3 = await prisma.user.upsert({
    where: { email: 'carol@stockmaster.com' },
    update: {},
    create: {
      email: 'carol@stockmaster.com',
      name: 'Carol Williams',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const staff4 = await prisma.user.upsert({
    where: { email: 'david@stockmaster.com' },
    update: {},
    create: {
      email: 'david@stockmaster.com',
      name: 'David Martinez',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const staff5 = await prisma.user.upsert({
    where: { email: 'emma@stockmaster.com' },
    update: {},
    create: {
      email: 'emma@stockmaster.com',
      name: 'Emma Davis',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const staff6 = await prisma.user.upsert({
    where: { email: 'frank@stockmaster.com' },
    update: {},
    create: {
      email: 'frank@stockmaster.com',
      name: 'Frank Anderson',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const staff7 = await prisma.user.upsert({
    where: { email: 'grace@stockmaster.com' },
    update: {},
    create: {
      email: 'grace@stockmaster.com',
      name: 'Grace Taylor',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const staff8 = await prisma.user.upsert({
    where: { email: 'henry@stockmaster.com' },
    update: {},
    create: {
      email: 'henry@stockmaster.com',
      name: 'Henry Wilson',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  console.log('✅ Staff users created: 8 members');

  // Create sample locations
  const warehouse1 = await prisma.location.upsert({
    where: { id: 'loc-1' },
    update: {},
    create: {
      id: 'loc-1',
      name: 'Main Warehouse',
      address: '123 Industrial Ave, City',
    },
  });

  const warehouse2 = await prisma.location.upsert({
    where: { id: 'loc-2' },
    update: {},
    create: {
      id: 'loc-2',
      name: 'Distribution Center',
      address: '456 Logistics Blvd, Town',
    },
  });

  const warehouse3 = await prisma.location.upsert({
    where: { id: 'loc-3' },
    update: {},
    create: {
      id: 'loc-3',
      name: 'Retail Store',
      address: '789 Commerce St, Downtown',
    },
  });

  console.log('✅ Locations created');

  // Create sample vendors
  const vendor1 = await prisma.vendor.upsert({
    where: { id: 'vendor-1' },
    update: {},
    create: {
      id: 'vendor-1',
      name: 'Tech Supplies Co.',
      email: 'contact@techsupplies.com',
      phone: '555-0101',
      address: '100 Tech Park, Silicon Valley',
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { id: 'vendor-2' },
    update: {},
    create: {
      id: 'vendor-2',
      name: 'Office Essentials Ltd.',
      email: 'sales@officeessentials.com',
      phone: '555-0202',
      address: '200 Business Plaza, Metro City',
    },
  });

  console.log('✅ Vendors created');

  // Create sample products
  const products = [
    {
      id: 'prod-1',
      name: 'Laptop Computer',
      sku: 'TECH-LAP-001',
      description: 'High-performance business laptop',
      unit: 'piece',
      minStock: 5,
    },
    {
      id: 'prod-2',
      name: 'Wireless Mouse',
      sku: 'TECH-MOU-002',
      description: 'Ergonomic wireless mouse',
      unit: 'piece',
      minStock: 20,
    },
    {
      id: 'prod-3',
      name: 'Office Chair',
      sku: 'FURN-CHA-003',
      description: 'Ergonomic office chair with lumbar support',
      unit: 'piece',
      minStock: 10,
    },
    {
      id: 'prod-4',
      name: 'Printer Paper (500 sheets)',
      sku: 'SUPP-PAP-004',
      description: 'A4 white printer paper',
      unit: 'ream',
      minStock: 50,
    },
    {
      id: 'prod-5',
      name: 'USB Flash Drive 32GB',
      sku: 'TECH-USB-005',
      description: '32GB USB 3.0 flash drive',
      unit: 'piece',
      minStock: 30,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }

  console.log('✅ Products created');

  // Create sample stock
  const stocks = [
    { productId: 'prod-1', locationId: 'loc-1', quantity: 15 },
    { productId: 'prod-1', locationId: 'loc-2', quantity: 8 },
    { productId: 'prod-2', locationId: 'loc-1', quantity: 45 },
    { productId: 'prod-2', locationId: 'loc-3', quantity: 12 },
    { productId: 'prod-3', locationId: 'loc-1', quantity: 25 },
    { productId: 'prod-3', locationId: 'loc-2', quantity: 18 },
    { productId: 'prod-4', locationId: 'loc-1', quantity: 120 },
    { productId: 'prod-4', locationId: 'loc-2', quantity: 80 },
    { productId: 'prod-4', locationId: 'loc-3', quantity: 40 },
    { productId: 'prod-5', locationId: 'loc-1', quantity: 60 },
    { productId: 'prod-5', locationId: 'loc-3', quantity: 25 },
  ];

  for (const stock of stocks) {
    await prisma.stock.upsert({
      where: {
        productId_locationId: {
          productId: stock.productId,
          locationId: stock.locationId,
        },
      },
      update: { quantity: stock.quantity },
      create: stock,
    });
  }

  console.log('✅ Stock levels created');

  // Clean up existing activity data
  await prisma.receiptItem.deleteMany({});
  await prisma.receiptOrder.deleteMany({});
  await prisma.deliveryItem.deleteMany({});
  await prisma.deliveryOrder.deleteMany({});
  await prisma.internalTransfer.deleteMany({});
  await prisma.moveHistory.deleteMany({});

  // Create sample receipt orders (staff activity)
  const receipt1 = await prisma.receiptOrder.create({
    data: {
      receiptNumber: 'REC-001',
      vendorId: vendor1.id,
      locationId: warehouse1.id,
      userId: staff1.id,
      isValidated: true,
      totalItems: 2,
      items: {
        create: [
          { productId: 'prod-1', quantityReceived: 5 },
          { productId: 'prod-2', quantityReceived: 20 },
        ],
      },
    },
  });

  const receipt2 = await prisma.receiptOrder.create({
    data: {
      receiptNumber: 'REC-002',
      vendorId: vendor2.id,
      locationId: warehouse2.id,
      userId: staff2.id,
      isValidated: false,
      totalItems: 1,
      items: {
        create: [
          { productId: 'prod-4', quantityReceived: 100 },
        ],
      },
    },
  });

  const receipt3 = await prisma.receiptOrder.create({
    data: {
      receiptNumber: 'REC-003',
      vendorId: vendor1.id,
      locationId: warehouse1.id,
      userId: staff3.id,
      isValidated: true,
      totalItems: 1,
      items: {
        create: [
          { productId: 'prod-5', quantityReceived: 50 },
        ],
      },
    },
  });

  const receipt4 = await prisma.receiptOrder.create({
    data: {
      receiptNumber: 'REC-004',
      vendorId: vendor2.id,
      locationId: warehouse3.id,
      userId: staff1.id,
      isValidated: true,
      totalItems: 1,
      items: {
        create: [
          { productId: 'prod-3', quantityReceived: 10 },
        ],
      },
    },
  });

  console.log('✅ Sample receipts created');

  // Create sample delivery orders (staff activity)
  const delivery1 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: 'DEL-001',
      locationId: warehouse1.id,
      userId: staff1.id,
      isValidated: true,
      totalItems: 2,
      items: {
        create: [
          { productId: 'prod-1', quantityDelivered: 2 },
          { productId: 'prod-2', quantityDelivered: 5 },
        ],
      },
    },
  });

  const delivery2 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: 'DEL-002',
      locationId: warehouse3.id,
      userId: staff4.id,
      isValidated: false,
      totalItems: 1,
      items: {
        create: [
          { productId: 'prod-2', quantityDelivered: 3 },
        ],
      },
    },
  });

  const delivery3 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: 'DEL-003',
      locationId: warehouse2.id,
      userId: staff5.id,
      isValidated: true,
      totalItems: 1,
      items: {
        create: [
          { productId: 'prod-3', quantityDelivered: 5 },
        ],
      },
    },
  });

  const delivery4 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: 'DEL-004',
      locationId: warehouse1.id,
      userId: staff2.id,
      isValidated: true,
      totalItems: 1,
      items: {
        create: [
          { productId: 'prod-4', quantityDelivered: 30 },
        ],
      },
    },
  });

  console.log('✅ Sample deliveries created');

  // Create sample internal transfers (staff activity)
  const transfer1 = await prisma.internalTransfer.create({
    data: {
      transferNumber: 'TRF-001',
      fromLocationId: warehouse1.id,
      toLocationId: warehouse2.id,
      productId: 'prod-1',
      quantity: 3,
      userId: staff2.id,
      isApplied: true,
    },
  });

  const transfer2 = await prisma.internalTransfer.create({
    data: {
      transferNumber: 'TRF-002',
      fromLocationId: warehouse2.id,
      toLocationId: warehouse3.id,
      productId: 'prod-2',
      quantity: 10,
      userId: staff6.id,
      isApplied: false,
    },
  });

  const transfer3 = await prisma.internalTransfer.create({
    data: {
      transferNumber: 'TRF-003',
      fromLocationId: warehouse1.id,
      toLocationId: warehouse3.id,
      productId: 'prod-5',
      quantity: 15,
      userId: staff3.id,
      isApplied: true,
    },
  });

  console.log('✅ Sample transfers created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('   Admin:');
  console.log('     Email: admin@stockmaster.com');
  console.log('     Password: admin123');
  console.log('\n   Inventory Managers (2 users):');
  console.log('     Email: manager@stockmaster.com / Password: manager123');
  console.log('     Email: sarah.manager@stockmaster.com / Password: manager123');
  console.log('\n   Staff (8 users):');
  console.log('     Email: alice@stockmaster.com / Password: staff123');
  console.log('     Email: bob@stockmaster.com / Password: staff123');
  console.log('     Email: carol@stockmaster.com / Password: staff123');
  console.log('     Email: david@stockmaster.com / Password: staff123');
  console.log('     Email: emma@stockmaster.com / Password: staff123');
  console.log('     Email: frank@stockmaster.com / Password: staff123');
  console.log('     Email: grace@stockmaster.com / Password: staff123');
  console.log('     Email: henry@stockmaster.com / Password: staff123');
  console.log('\n⚠️  Please change passwords after first login!\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
