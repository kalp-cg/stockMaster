const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000/api';
let authToken = '';
let createdLocationId = '';
let createdLocationId2 = ''; // For transfer
let createdVendorId = '';
let createdProductId = '';
let createdReceiptId = '';
let createdDeliveryId = '';
let createdTransferId = '';

// Helper for making requests
async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    console.error(`Error requesting ${endpoint}:`, error.message);
    return { status: 500, data: null, ok: false };
  }
}

async function testAuth() {
  console.log('\n--- Testing Auth ---');

  // 1. Signup
  const uniqueSuffix = Date.now();
  const signupRes = await request('/auth/signup', 'POST', {
    name: `Test User ${uniqueSuffix}`,
    email: `test${uniqueSuffix}@example.com`,
    password: 'password123',
    role: 'ADMIN'
  });
  console.log('Signup:', signupRes.status === 201 ? '✅' : '❌', signupRes.data.error || '');

  // 2. Login
  const loginRes = await request('/auth/login', 'POST', {
    email: `test${uniqueSuffix}@example.com`,
    password: 'password123'
  });
  console.log('Login:', loginRes.status === 200 ? '✅' : '❌', loginRes.data.error || '');

  if (loginRes.ok) {
    authToken = loginRes.data.token;

    // 3. Me
    const meRes = await request('/auth/me', 'GET', null, authToken);
    console.log('Me:', meRes.status === 200 ? '✅' : '❌', meRes.data.error || '');
  }
}

async function testLocations() {
  console.log('\n--- Testing Locations ---');
  if (!authToken) return console.log('Skipping: No auth token');

  // Create Location 1
  const createRes = await request('/locations', 'POST', {
    name: `Warehouse A ${Date.now()}`,
    address: '123 Test St'
  }, authToken);
  console.log('Create Location 1:', createRes.status === 201 ? '✅' : '❌', createRes.data.error || '');
  if (createRes.ok) createdLocationId = createRes.data.id;

  // Create Location 2 (for transfers)
  const createRes2 = await request('/locations', 'POST', {
    name: `Warehouse B ${Date.now()}`,
    address: '456 Test Ave'
  }, authToken);
  console.log('Create Location 2:', createRes2.status === 201 ? '✅' : '❌', createRes2.data.error || '');
  if (createRes2.ok) createdLocationId2 = createRes2.data.id;

  // Get All
  const getAllRes = await request('/locations', 'GET', null, authToken);
  console.log('Get All Locations:', getAllRes.status === 200 && getAllRes.data.locations.length > 0 ? '✅' : '❌');
}

async function testVendors() {
  console.log('\n--- Testing Vendors ---');
  if (!authToken) return console.log('Skipping: No auth token');

  const createRes = await request('/vendors', 'POST', {
    name: `Vendor ${Date.now()}`,
    email: `vendor${Date.now()}@test.com`,
    phone: '555-0123'
  }, authToken);
  console.log('Create Vendor:', createRes.status === 201 ? '✅' : '❌', createRes.data.error || '');
  if (createRes.ok) createdVendorId = createRes.data.id;

  const getAllRes = await request('/vendors', 'GET', null, authToken);
  console.log('Get All Vendors:', getAllRes.status === 200 ? '✅' : '❌');
}

async function testProducts() {
  console.log('\n--- Testing Products ---');
  if (!authToken) return console.log('Skipping: No auth token');

  const createRes = await request('/products', 'POST', {
    name: `Product ${Date.now()}`,
    sku: `SKU-${Date.now()}`,
    description: 'Test Product',
    unit: 'pcs',
    minStock: 10
  }, authToken);
  console.log('Create Product:', createRes.status === 201 ? '✅' : '❌', createRes.data.error || '');
  if (createRes.ok) createdProductId = createRes.data.id;

  const getAllRes = await request('/products', 'GET', null, authToken);
  console.log('Get All Products:', getAllRes.status === 200 ? '✅' : '❌');
}

async function testReceipts() {
  console.log('\n--- Testing Receipts ---');
  if (!authToken || !createdVendorId || !createdLocationId || !createdProductId) {
    return console.log('Skipping: Missing dependencies');
  }

  // Create
  const createRes = await request('/receipts', 'POST', {
    vendorId: createdVendorId,
    locationId: createdLocationId,
    items: [{ productId: createdProductId, quantityReceived: 100 }],
    notes: 'Test Receipt'
  }, authToken);
  console.log('Create Receipt:', createRes.status === 201 ? '✅' : '❌', createRes.data.error || '');
  if (createRes.ok) createdReceiptId = createRes.data.id;

  // Validate
  if (createdReceiptId) {
    const validateRes = await request(`/receipts/${createdReceiptId}`, 'PUT', {
      action: 'validate'
    }, authToken);
    console.log('Validate Receipt:', validateRes.status === 200 ? '✅' : '❌', validateRes.data.error || '');
  }
}

async function testDeliveries() {
  console.log('\n--- Testing Deliveries ---');
  if (!authToken || !createdLocationId || !createdProductId) {
    return console.log('Skipping: Missing dependencies');
  }

  // Create (should succeed as we have 100 stock from receipt)
  const createRes = await request('/deliveries', 'POST', {
    locationId: createdLocationId,
    items: [{ productId: createdProductId, quantityDelivered: 20 }],
    notes: 'Test Delivery'
  }, authToken);
  console.log('Create Delivery:', createRes.status === 201 ? '✅' : '❌', createRes.data.error || '');
  if (createRes.ok) createdDeliveryId = createRes.data.id;

  // Validate
  if (createdDeliveryId) {
    const validateRes = await request(`/deliveries/${createdDeliveryId}`, 'PUT', {
      action: 'validate'
    }, authToken);
    console.log('Validate Delivery:', validateRes.status === 200 ? '✅' : '❌', validateRes.data.error || '');
  }
}

async function testTransfers() {
  console.log('\n--- Testing Transfers ---');
  if (!authToken || !createdLocationId || !createdLocationId2 || !createdProductId) {
    return console.log('Skipping: Missing dependencies');
  }

  // Create (Move 10 from Loc1 to Loc2)
  const createRes = await request('/transfers', 'POST', {
    fromLocationId: createdLocationId,
    toLocationId: createdLocationId2,
    productId: createdProductId,
    quantity: 10,
    notes: 'Test Transfer'
  }, authToken);
  console.log('Create Transfer:', createRes.status === 201 ? '✅' : '❌', createRes.data.error || '');
  if (createRes.ok) createdTransferId = createRes.data.id;

  // Apply
  if (createdTransferId) {
    const applyRes = await request(`/transfers/${createdTransferId}`, 'PUT', {
      action: 'apply'
    }, authToken);
    console.log('Apply Transfer:', applyRes.status === 200 ? '✅' : '❌', applyRes.data.error || '');
  }
}

async function testAdjustments() {
  console.log('\n--- Testing Adjustments ---');
  if (!authToken || !createdLocationId || !createdProductId) {
    return console.log('Skipping: Missing dependencies');
  }

  const createRes = await request('/adjustments', 'POST', {
    locationId: createdLocationId,
    productId: createdProductId,
    quantityChange: -5,
    reason: 'Damaged',
    notes: 'Test Adjustment'
  }, authToken);
  console.log('Create Adjustment:', createRes.status === 201 ? '✅' : '❌', createRes.data.error || '');
}

async function testMoveHistory() {
  console.log('\n--- Testing Move History ---');
  if (!authToken) return console.log('Skipping: No auth token');

  const getRes = await request('/move-history', 'GET', null, authToken);
  console.log('Get Move History:', getRes.status === 200 && getRes.data.moveHistory.length > 0 ? '✅' : '❌');
}

async function testDashboard() {
  console.log('\n--- Testing Dashboard ---');
  if (!authToken) return console.log('Skipping: No auth token');

  const getRes = await request('/dashboard', 'GET', null, authToken);
  console.log('Get Dashboard Data:', getRes.status === 200 ? '✅' : '❌');
  if (getRes.ok) {
    console.log('  - Total Products:', getRes.data.summary.totalProducts);
    console.log('  - Total Stock:', getRes.data.summary.totalStockQuantity);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Backend Tests...');

  await testAuth();
  await testLocations();
  await testVendors();
  await testProducts();
  await testReceipts();
  await testDeliveries();
  await testTransfers();
  await testAdjustments();
  await testMoveHistory();
  await testDashboard();

  console.log('\n🏁 All Tests Completed!');
}

runAllTests();