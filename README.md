# StockMaster - Inventory Management System

A full-stack inventory management system built with Next.js 14, PostgreSQL, Prisma, and JWT authentication.

## Features

### Backend & Database
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Database**: PostgreSQL with Prisma ORM
- **Business Logic**: Complete inventory management with stock tracking
- **API**: RESTful API with proper error handling and validation

### Inventory Management
- **Products**: CRUD operations with SKU management and stock tracking
- **Vendors**: Vendor management with contact information
- **Locations**: Multiple warehouse/location support
- **Receipts**: Receive inventory from vendors (increases stock)
- **Deliveries**: Ship inventory to customers (decreases stock)
- **Transfers**: Move stock between locations (internal transfers)
- **Adjustments**: Manual stock adjustments with reasons
- **Move History**: Complete audit trail of all stock movements

### Dashboard & Analytics
- **KPIs**: Real-time inventory metrics and statistics
- **Low Stock Alerts**: Automatic detection of products below minimum thresholds
- **Move Tracking**: Detailed history of all inventory movements
- **Location Analytics**: Stock distribution across locations

## Tech Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **Styling**: Tailwind CSS + ShadCN UI components
- **Database**: PostgreSQL
- **ORM**: Prisma ORM with full type safety
- **Authentication**: JWT tokens + bcrypt password hashing
- **API**: REST API via Next.js route handlers

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Edit `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/stockmaster?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   NEXTAUTH_SECRET="your-nextauth-secret-change-this-in-production"
   ```

3. **Set up the database:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Core Entities
- `GET/POST /api/products` - Products CRUD
- `GET/PUT/DELETE /api/products/[id]` - Individual product operations
- `GET/POST /api/vendors` - Vendors CRUD
- `GET/PUT/DELETE /api/vendors/[id]` - Individual vendor operations
- `GET/POST /api/locations` - Locations CRUD
- `GET/PUT/DELETE /api/locations/[id]` - Individual location operations

### Inventory Operations
- `GET/POST /api/receipts` - Receipt management
- `PUT /api/receipts/[id]` - Validate receipts (increases stock)
- `GET/POST /api/deliveries` - Delivery management
- `PUT /api/deliveries/[id]` - Validate deliveries (decreases stock)
- `GET/POST /api/transfers` - Internal transfer management
- `PUT /api/transfers/[id]` - Apply transfers (moves stock between locations)
- `GET/POST /api/adjustments` - Stock adjustments

### Analytics
- `GET /api/dashboard` - Dashboard KPIs and analytics
- `GET /api/move-history` - Complete move history with filtering

## Database Schema

### Core Entities
- **Users**: Authentication and role management (Admin, Inventory Manager, Staff)
- **Products**: Product catalog with SKU, units, and minimum stock levels
- **Vendors**: Supplier information
- **Locations**: Warehouse/storage locations
- **Stock**: Current inventory quantities per product per location

### Transaction Entities
- **ReceiptOrders & ReceiptItems**: Receiving inventory from vendors
- **DeliveryOrders & DeliveryItems**: Shipping inventory to customers
- **InternalTransfers**: Moving stock between locations
- **StockAdjustments**: Manual inventory adjustments
- **MoveHistory**: Complete audit trail of all stock movements

### Business Logic Rules
1. **Receipts**: Must be validated to increase stock levels
2. **Deliveries**: Must be validated to decrease stock levels (with stock validation)
3. **Transfers**: Must be applied to move stock between locations (with stock validation)
4. **Adjustments**: Immediately update stock with audit trail
5. **All Operations**: Create detailed move history records for full traceability

## Development

### Project Structure
```
src/
├── app/
│   ├── api/              # API routes
│   ├── login/            # Authentication pages
│   ├── dashboard/        # Dashboard page
│   ├── products/         # Product management pages
│   ├── vendors/          # Vendor management pages
│   ├── locations/        # Location management pages
│   ├── receipts/         # Receipt management pages
│   ├── deliveries/       # Delivery management pages
│   ├── transfers/        # Transfer management pages
│   ├── adjustments/      # Adjustment management pages
│   └── move-history/     # Move history pages
├── lib/
│   ├── prisma.ts         # Prisma client
│   └── auth.ts           # Authentication utilities
├── components/           # Reusable UI components
└── middleware.ts         # Route protection middleware
```

### Key Features Implemented
- ✅ Complete authentication system with JWT
- ✅ Protected routes with middleware
- ✅ Full CRUD APIs for all entities
- ✅ Inventory business logic with stock validation
- ✅ Comprehensive move history tracking
- ✅ Dashboard with real-time KPIs
- ✅ Low stock detection and alerts
- ✅ Multi-location inventory support
- ✅ Complete audit trail

## Production Deployment

1. Set strong JWT secrets in environment variables
2. Use a production PostgreSQL database
3. Run database migrations: `npx prisma migrate deploy`
4. Build the application: `npm run build`
5. Start production server: `npm start`

## License

MIT License - feel free to use for your projects!
