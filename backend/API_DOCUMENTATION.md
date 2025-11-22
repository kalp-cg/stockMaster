# StockMaster API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 🔐 Authentication Endpoints

### Sign Up
**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STAFF" // STAFF | INVENTORY_MANAGER | ADMIN
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "clxx123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF",
    "createdAt": "2024-11-22T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Login
**POST** `/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "clxx123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Logout
**POST** `/auth/logout`

Invalidate the current session.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User
**GET** `/auth/me`

Get current authenticated user information.

**Response (200):**
```json
{
  "user": {
    "id": "clxx123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF"
  }
}
```

---

## 📦 Products

### List Products
**GET** `/products?search=laptop&page=1&limit=10`

Get all products with pagination and search.

**Query Parameters:**
- `search` (optional): Search by name, SKU, or description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "products": [
    {
      "id": "clxx123",
      "name": "Laptop Dell XPS",
      "description": "15-inch laptop",
      "sku": "LAP-001",
      "unit": "pcs",
      "minStock": 10,
      "totalStock": 45,
      "isLowStock": false,
      "stocks": [
        {
          "id": "clxx456",
          "quantity": 45,
          "location": {
            "id": "clxx789",
            "name": "Main Warehouse"
          }
        }
      ],
      "createdAt": "2024-11-22T10:00:00Z",
      "updatedAt": "2024-11-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### Create Product
**POST** `/products`

Create a new product.

**Request Body:**
```json
{
  "name": "Laptop Dell XPS",
  "description": "15-inch laptop",
  "sku": "LAP-001",
  "unit": "pcs",
  "minStock": 10
}
```

**Response (201):**
```json
{
  "id": "clxx123",
  "name": "Laptop Dell XPS",
  "description": "15-inch laptop",
  "sku": "LAP-001",
  "unit": "pcs",
  "minStock": 10,
  "createdAt": "2024-11-22T10:00:00Z",
  "updatedAt": "2024-11-22T10:00:00Z"
}
```

---

### Get Product by ID
**GET** `/products/{id}`

**Response (200):**
```json
{
  "id": "clxx123",
  "name": "Laptop Dell XPS",
  "sku": "LAP-001",
  "unit": "pcs",
  "minStock": 10,
  "totalStock": 45,
  "isLowStock": false,
  "stocks": [
    {
      "id": "clxx456",
      "quantity": 45,
      "location": {
        "id": "clxx789",
        "name": "Main Warehouse",
        "address": "123 Main St"
      }
    }
  ]
}
```

---

### Update Product
**PUT** `/products/{id}`

**Request Body:**
```json
{
  "name": "Laptop Dell XPS Updated",
  "sku": "LAP-001",
  "unit": "pcs",
  "minStock": 15
}
```

---

### Delete Product
**DELETE** `/products/{id}`

Cannot delete products with existing stock or transaction history.

---

## 🏢 Vendors

### List Vendors
**GET** `/vendors?search=tech&page=1&limit=10`

**Response (200):**
```json
{
  "vendors": [
    {
      "id": "clxx123",
      "name": "Tech Supplies Inc",
      "email": "sales@techsupplies.com",
      "phone": "+1234567890",
      "address": "456 Tech Avenue",
      "_count": {
        "receipts": 15
      },
      "createdAt": "2024-11-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### Create Vendor
**POST** `/vendors`

**Request Body:**
```json
{
  "name": "Tech Supplies Inc",
  "email": "sales@techsupplies.com",
  "phone": "+1234567890",
  "address": "456 Tech Avenue"
}
```

---

### Update Vendor
**PUT** `/vendors/{id}`

---

### Delete Vendor
**DELETE** `/vendors/{id}`

Cannot delete vendors with existing receipts.

---

## 📍 Locations

### List Locations
**GET** `/locations?search=warehouse&page=1&limit=10`

**Response (200):**
```json
{
  "locations": [
    {
      "id": "clxx123",
      "name": "Main Warehouse",
      "address": "123 Main St, City",
      "_count": {
        "stocks": 45,
        "receipts": 20,
        "deliveries": 15
      },
      "createdAt": "2024-11-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

---

### Create Location
**POST** `/locations`

**Request Body:**
```json
{
  "name": "Main Warehouse",
  "address": "123 Main St, City"
}
```

---

### Get Location with Stock
**GET** `/locations/{id}`

**Response (200):**
```json
{
  "id": "clxx123",
  "name": "Main Warehouse",
  "address": "123 Main St",
  "stocks": [
    {
      "id": "clxx456",
      "quantity": 45,
      "product": {
        "id": "clxx789",
        "name": "Laptop Dell XPS",
        "sku": "LAP-001",
        "unit": "pcs"
      }
    }
  ]
}
```

---

## 📥 Receipts (Incoming Inventory)

### List Receipts
**GET** `/receipts?status=pending&page=1&limit=10`

**Query Parameters:**
- `status`: `validated` or `pending`
- `page`, `limit`: Pagination

**Response (200):**
```json
{
  "receipts": [
    {
      "id": "clxx123",
      "receiptNumber": "RCP-000001",
      "vendorId": "clxx456",
      "locationId": "clxx789",
      "totalItems": 50,
      "notes": "Monthly stock",
      "isValidated": false,
      "validatedAt": null,
      "vendor": {
        "id": "clxx456",
        "name": "Tech Supplies Inc"
      },
      "location": {
        "id": "clxx789",
        "name": "Main Warehouse"
      },
      "user": {
        "id": "clxx111",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "items": [
        {
          "id": "clxx222",
          "productId": "clxx333",
          "quantityReceived": 50,
          "product": {
            "id": "clxx333",
            "name": "Laptop Dell XPS",
            "sku": "LAP-001"
          }
        }
      ],
      "createdAt": "2024-11-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### Create Receipt
**POST** `/receipts`

Create a new receipt order (does NOT increase stock until validated).

**Request Body:**
```json
{
  "vendorId": "clxx456",
  "locationId": "clxx789",
  "items": [
    {
      "productId": "clxx333",
      "quantityReceived": 50
    },
    {
      "productId": "clxx444",
      "quantityReceived": 30
    }
  ],
  "notes": "Monthly stock replenishment"
}
```

**Response (201):**
```json
{
  "id": "clxx123",
  "receiptNumber": "RCP-000001",
  "vendorId": "clxx456",
  "locationId": "clxx789",
  "totalItems": 80,
  "notes": "Monthly stock replenishment",
  "isValidated": false,
  "items": [...]
}
```

---

### Validate Receipt
**PUT** `/receipts/{id}`

Validate receipt and **increase stock**.

**Request Body:**
```json
{
  "action": "validate"
}
```

**Response (200):**
```json
{
  "message": "Receipt validated successfully",
  "receipt": {
    "id": "clxx123",
    "receiptNumber": "RCP-000001",
    "isValidated": true,
    "validatedAt": "2024-11-22T11:00:00Z"
  }
}
```

**Side Effects:**
- Stock quantity increases at the specified location
- Move history records created for each item

---

## 📤 Deliveries (Outgoing Inventory)

### List Deliveries
**GET** `/deliveries?status=pending&page=1&limit=10`

**Query Parameters:**
- `status`: `validated` or `pending`
- `page`, `limit`: Pagination

---

### Create Delivery
**POST** `/deliveries`

Create a new delivery order. System validates stock availability.

**Request Body:**
```json
{
  "locationId": "clxx789",
  "items": [
    {
      "productId": "clxx333",
      "quantityDelivered": 10
    }
  ],
  "notes": "Customer order #1234"
}
```

**Response (201 or 409 if insufficient stock):**
```json
{
  "id": "clxx123",
  "deliveryNumber": "DEL-000001",
  "locationId": "clxx789",
  "totalItems": 10,
  "isValidated": false,
  "items": [...]
}
```

---

### Validate Delivery
**PUT** `/deliveries/{id}`

Validate delivery and **decrease stock**.

**Request Body:**
```json
{
  "action": "validate"
}
```

**Response (200):**
```json
{
  "message": "Delivery validated successfully",
  "delivery": {
    "id": "clxx123",
    "deliveryNumber": "DEL-000001",
    "isValidated": true,
    "validatedAt": "2024-11-22T12:00:00Z"
  }
}
```

**Side Effects:**
- Stock quantity decreases at the specified location
- Move history records created for each item

---

## 🔄 Internal Transfers

### List Transfers
**GET** `/transfers?status=pending&page=1&limit=10`

---

### Create Transfer
**POST** `/transfers`

Create internal transfer between locations. System validates stock at source.

**Request Body:**
```json
{
  "fromLocationId": "clxx789",
  "toLocationId": "clxx888",
  "productId": "clxx333",
  "quantity": 20,
  "notes": "Stock rebalancing"
}
```

**Response (201 or 409 if insufficient stock):**
```json
{
  "id": "clxx123",
  "transferNumber": "TRN-000001",
  "fromLocationId": "clxx789",
  "toLocationId": "clxx888",
  "productId": "clxx333",
  "quantity": 20,
  "isApplied": false,
  "fromLocation": {...},
  "toLocation": {...}
}
```

---

### Apply Transfer
**PUT** `/transfers/{id}`

Apply transfer and **move stock between locations**.

**Request Body:**
```json
{
  "action": "apply"
}
```

**Response (200):**
```json
{
  "message": "Transfer applied successfully",
  "transfer": {
    "id": "clxx123",
    "transferNumber": "TRN-000001",
    "isApplied": true,
    "appliedAt": "2024-11-22T13:00:00Z"
  }
}
```

**Side Effects:**
- Stock decreases at source location
- Stock increases at destination location
- Two move history records created (TRANSFER_OUT and TRANSFER_IN)

---

## ⚙️ Stock Adjustments

### List Adjustments
**GET** `/adjustments?page=1&limit=10`

---

### Create Adjustment
**POST** `/adjustments`

Manually adjust stock with a reason. Changes apply immediately.

**Request Body:**
```json
{
  "locationId": "clxx789",
  "productId": "clxx333",
  "quantityChange": -5, // Negative to decrease, positive to increase
  "reason": "Damaged items removed",
  "notes": "5 laptops damaged during inspection"
}
```

**Response (201):**
```json
{
  "id": "clxx123",
  "adjustmentNumber": "ADJ-000001",
  "locationId": "clxx789",
  "productId": "clxx333",
  "quantityChange": -5,
  "reason": "Damaged items removed",
  "notes": "5 laptops damaged during inspection",
  "createdAt": "2024-11-22T14:00:00Z"
}
```

**Side Effects:**
- Stock immediately updated
- Move history record created

---

## 📊 Move History

### List Move History
**GET** `/move-history?productId=clxx333&locationId=clxx789&moveType=RECEIPT&page=1&limit=20`

**Query Parameters:**
- `productId` (optional): Filter by product
- `locationId` (optional): Filter by location
- `moveType` (optional): RECEIPT | DELIVERY | TRANSFER_OUT | TRANSFER_IN | ADJUSTMENT_INCREASE | ADJUSTMENT_DECREASE
- `page`, `limit`: Pagination

**Response (200):**
```json
{
  "moveHistory": [
    {
      "id": "clxx123",
      "moveType": "RECEIPT",
      "productId": "clxx333",
      "locationId": "clxx789",
      "userId": "clxx111",
      "quantityBefore": 10,
      "quantityAfter": 60,
      "quantityChanged": 50,
      "referenceId": "clxx456",
      "notes": "Receipt validation: RCP-000001",
      "product": {
        "id": "clxx333",
        "name": "Laptop Dell XPS",
        "sku": "LAP-001"
      },
      "location": {
        "id": "clxx789",
        "name": "Main Warehouse"
      },
      "user": {
        "id": "clxx111",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-11-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

## 📈 Dashboard

### Get Dashboard Summary
**GET** `/dashboard?locationId=clxx789&days=30`

**Query Parameters:**
- `locationId` (optional): Filter by specific location
- `days` (optional): Number of days for history (default: 30)

**Response (200):**
```json
{
  "summary": {
    "totalProducts": 25,
    "totalLocations": 3,
    "totalStockQuantity": 1250,
    "uniqueStockItems": 45,
    "lowStockProductsCount": 3,
    "pendingReceipts": 2,
    "pendingDeliveries": 1,
    "pendingTransfers": 0
  },
  "lowStockProducts": [
    {
      "id": "clxx333",
      "name": "Laptop Dell XPS",
      "sku": "LAP-001",
      "minStock": 50,
      "totalStock": 45,
      "isLowStock": true
    }
  ],
  "recentMoves": [...],
  "moveStats": {
    "RECEIPT": {
      "count": 15,
      "totalQuantity": 500
    },
    "DELIVERY": {
      "count": 10,
      "totalQuantity": 250
    }
  },
  "topMovingProducts": [
    {
      "product": {
        "id": "clxx333",
        "name": "Laptop Dell XPS",
        "sku": "LAP-001"
      },
      "moveCount": 25,
      "totalQuantityMoved": 300
    }
  ],
  "stockByLocation": [
    {
      "location": {
        "id": "clxx789",
        "name": "Main Warehouse"
      },
      "totalStock": 850,
      "uniqueProducts": 20
    }
  ],
  "filters": {
    "locationId": "clxx789",
    "days": 30,
    "dateFrom": "2024-10-23T00:00:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Name, SKU, and unit are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Product not found"
}
```

### 409 Conflict
```json
{
  "error": "Product with this SKU already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Testing with cURL

### Example Flow

```bash
# 1. Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"pass123","role":"ADMIN"}'

# 2. Login (save the token)
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"pass123"}' | jq -r '.token')

# 3. Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Laptop","sku":"LAP-001","unit":"pcs","minStock":10}'

# 4. View dashboard
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Postman Collection

Import this collection into Postman for easy testing:

**Collection Variables:**
- `base_url`: `http://localhost:3000/api`
- `token`: (set after login)

All authenticated requests should use:
```
Authorization: Bearer {{token}}
```