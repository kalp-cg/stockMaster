const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000/api';
let authToken = '';
let testUserId = '';
let testProductId = '';
let testLocationId = '';
let testVendorId = '';
let testReceiptId = '';
let testDeliveryId = '';
let testTransferId = '';

const log = (emoji, message) => console.log(`${emoji} ${message}`);
const success = (message) => log('✅', message);
const error = (message) => log('❌', message);
const info = (message) => log('ℹ️', message);

async function testAPI(name, method, endpoint, body = null, useAuth = false) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (useAuth && authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (response.ok) {
            success(`${name}: PASSED`);
            return { success: true, data };
        } else {
            error(`${name}: FAILED - ${data.error || 'Unknown error'}`);
            return { success: false, error: data.error };
        }
    } catch (err) {
        error(`${name}: ERROR - ${err.message}`);
        return { success: false, error: err.message };
    }
}

async function runTests() {
    console.log('\n🚀 Starting End-to-End Backend API Tests\n');
    console.log('='.repeat(50));

    // 1. AUTH TESTS
    console.log('\n📝 AUTHENTICATION TESTS\n');

    const signupResult = await testAPI(
        'Signup',
        'POST',
        '/auth/signup',
        {
            name: 'E2E Test User',
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            role: 'ADMIN'
        }
    );

    if (signupResult.success) {
        authToken = signupResult.data.token;
        testUserId = signupResult.data.user.id;
    }

    const loginResult = await testAPI(
        'Login',
        'POST',
        '/auth/login',
        {
            email: 'admin@example.com',
            password: 'password123'
        }
    );

    if (loginResult.success) {
        authToken = loginResult.data.token;
    }

    await testAPI('Get Current User', 'GET', '/auth/me', null, true);

    // Test Password Reset Flow
    const forgotResult = await testAPI(
        'Forgot Password',
        'POST',
        '/auth/forgot-password',
        { email: 'admin@example.com' }
    );

    if (forgotResult.success) {
        info('Check email for OTP (test will skip reset verification)');
    }

    // 2. PRODUCTS TESTS
    console.log('\n📦 PRODUCTS TESTS\n');

    const createProductResult = await testAPI(
        'Create Product',
        'POST',
        '/products',
        {
            name: 'Test Product E2E',
            description: 'E2E Test Product',
            sku: `SKU-${Date.now()}`,
            unit: 'pcs',
            minStock: 10
        },
        true
    );

    if (createProductResult.success) {
        testProductId = createProductResult.data.product.id;
    }

    await testAPI('Get All Products', 'GET', '/products', null, true);

    if (testProductId) {
        await testAPI('Get Single Product', 'GET', `/products/${testProductId}`, null, true);
        await testAPI(
            'Update Product',
            'PUT',
            `/products/${testProductId}`,
            { minStock: 15 },
            true
        );
    }

    // 3. LOCATIONS TESTS
    console.log('\n📍 LOCATIONS TESTS\n');

    const createLocationResult = await testAPI(
        'Create Location',
        'POST',
        '/locations',
        {
            name: `Test Warehouse ${Date.now()}`,
            address: '123 Test Street'
        },
        true
    );

    if (createLocationResult.success) {
        testLocationId = createLocationResult.data.location.id;
    }

    await testAPI('Get All Locations', 'GET', '/locations', null, true);

    if (testLocationId) {
        await testAPI('Get Single Location', 'GET', `/locations/${testLocationId}`, null, true);
    }

    // 4. VENDORS TESTS
    console.log('\n🏢 VENDORS TESTS\n');

    const createVendorResult = await testAPI(
        'Create Vendor',
        'POST',
        '/vendors',
        {
            name: `Test Vendor ${Date.now()}`,
            email: 'vendor@test.com',
            phone: '1234567890'
        },
        true
    );

    if (createVendorResult.success) {
        testVendorId = createVendorResult.data.vendor.id;
    }

    await testAPI('Get All Vendors', 'GET', '/vendors', null, true);

    // 5. RECEIPTS TESTS
    console.log('\n📥 RECEIPTS TESTS\n');

    if (testProductId && testLocationId && testVendorId) {
        const createReceiptResult = await testAPI(
            'Create Receipt',
            'POST',
            '/receipts',
            {
                vendorId: testVendorId,
                locationId: testLocationId,
                items: [{ productId: testProductId, quantityReceived: 50 }],
                notes: 'E2E Test Receipt'
            },
            true
        );

        if (createReceiptResult.success) {
            testReceiptId = createReceiptResult.data.receipt.id;
        }

        await testAPI('Get All Receipts', 'GET', '/receipts', null, true);

        if (testReceiptId) {
            await testAPI(
                'Validate Receipt',
                'PUT',
                `/receipts/${testReceiptId}`,
                { action: 'validate' },
                true
            );
        }
    }

    // 6. DELIVERIES TESTS
    console.log('\n📤 DELIVERIES TESTS\n');

    if (testProductId && testLocationId) {
        const createDeliveryResult = await testAPI(
            'Create Delivery',
            'POST',
            '/deliveries',
            {
                locationId: testLocationId,
                items: [{ productId: testProductId, quantityDelivered: 10 }],
                notes: 'E2E Test Delivery'
            },
            true
        );

        if (createDeliveryResult.success) {
            testDeliveryId = createDeliveryResult.data.delivery.id;
        }

        await testAPI('Get All Deliveries', 'GET', '/deliveries', null, true);
    }

    // 7. DASHBOARD TEST
    console.log('\n📊 DASHBOARD TEST\n');
    await testAPI('Get Dashboard Data', 'GET', '/dashboard', null, true);

    // 8. MOVE HISTORY TEST
    console.log('\n📜 MOVE HISTORY TEST\n');
    await testAPI('Get Move History', 'GET', '/move-history', null, true);

    console.log('\n' + '='.repeat(50));
    console.log('\n✨ Backend API Tests Complete!\n');
}

runTests().catch(console.error);
