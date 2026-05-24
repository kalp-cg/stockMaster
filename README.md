# 📦 StockMaster - Enterprise Inventory Management System

<div align="center">

![StockMaster Logo](https://img.shields.io/badge/StockMaster-IMS-714B67?style=for-the-badge&logo=database&logoColor=white)

**A comprehensive, production-ready ERP system for modern warehouse operations**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)

[Features](#-key-features) • [Architecture](#-system-architecture) • [Installation](#-installation) • [Live Demo (Frontend)](https://stock-master-lbnz-cwk224bfz-kalp-cgs-projects.vercel.app/) • [Demo Credentials](#-demo-credentials) • [Documentation](#-documentation)

</div>

---

## 🌐 Live Application
- **Frontend (Vercel):** [https://stock-master-lbnz-cwk224bfz-kalp-cgs-projects.vercel.app/](https://stock-master-lbnz-cwk224bfz-kalp-cgs-projects.vercel.app/)
- **Backend (Render):** [https://stockmaster-1-cnov.onrender.com](https://stockmaster-1-cnov.onrender.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Installation](#-installation)
- [Usage](#-usage)
- [Role-Based Access Control](#-role-based-access-control)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**StockMaster** is a full-stack Enterprise Resource Planning (ERP) system designed for comprehensive warehouse and inventory management. Built with modern technologies and following industry best practices, it provides complete control over stock movements, vendor management, multi-warehouse operations, and financial tracking.

### 🎯 Problem Statement

Traditional warehouse operations face critical challenges:
- ❌ Manual inventory tracking leads to errors and discrepancies
- ❌ No centralized system for end-to-end workflow management
- ❌ Lack of role-based access control creates security vulnerabilities
- ❌ Poor visibility into real-time stock levels across locations
- ❌ Difficulty in maintaining audit trails and compliance

### ✅ Our Solution

StockMaster solves these problems with:
- ✅ Automated stock tracking with real-time updates
- ✅ Complete workflow management from receiving to delivery
- ✅ Granular role-based permissions (40+ permissions, 3 roles)
- ✅ Multi-warehouse support with location-aware operations
- ✅ Comprehensive audit trail and move history
- ✅ Professional ERP-style UI with Odoo-inspired design

---

## 🚀 Key Features

### 📊 **Dashboard & Analytics**
- Real-time KPIs (Total Products, Vendors, Stock Value)
- Low stock alerts with severity levels (Critical, Warning, Low)
- Recent activities feed
- Quick action buttons for common operations

### 📦 **Receipt Management** (Incoming Stock)
- Complete workflow: Draft → Waiting → Done → Canceled
- Product search with live filtering (by name or SKU)
- Quantity tracking with difference highlighting
- Manager validation increases stock automatically
- PDF/CSV/Print export for validated receipts
- Notes field for discrepancy explanations

### 🚚 **Delivery Orders** (Outgoing Stock)
- Multi-item delivery creation
- Stock validation before shipment
- Automatic stock reduction on validation
- Delivery status tracking
- Customer order management

### 🔄 **Internal Transfers**
- Move stock between warehouse locations
- Source and destination tracking
- Dual ledger entries (Transfer Out + Transfer In)
- Total inventory remains constant

### ⚖️ **Stock Adjustments**
- Handle damaged, lost, or found items
- Mandatory reason field for audit compliance
- Adjustment types: Increase/Decrease
- Before/After quantity tracking

### 💰 **Financial Management**
- Invoice generation with automatic tax calculation
- Payment tracking linked to invoices
- Outstanding balance management
- Payment history and reconciliation

### 📈 **Reports & Analytics**
- Stock valuation reports
- Movement history analysis
- Sales analytics
- Inventory turnover metrics
- CSV/PDF export capabilities

### 🔐 **Security & Audit**
- Complete audit trail (Who, What, When, IP Address)
- Move history with before/after quantities
- Role-based access control (RBAC)
- JWT authentication with token expiration
- Password hashing with bcrypt

### 🏭 **Multi-Warehouse Support**
- Same product in multiple locations
- Location-aware stock operations
- Composite key design (Product + Location)
- Inter-location transfers

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 14 App Router]
        B[React 19 Components]
        C[Tailwind CSS]
        D[Context API for State]
    end
    
    subgraph "API Layer"
        E[Express.js REST API]
        F[JWT Middleware]
        G[RBAC Middleware]
        H[Validation Layer]
    end
    
    subgraph "Data Layer"
        I[Prisma ORM]
        J[PostgreSQL Database]
        K[18 Database Models]
    end
    
    subgraph "Security Layer"
        L[bcrypt Password Hashing]
        M[JWT Tokens]
        N[Permission Guards]
        O[Audit Logging]
    end
    
    A --> E
    B --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    F --> M
    G --> N
    H --> O
```

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.x | React framework with App Router |
| **React** | 19.x | UI component library |
| **TypeScript** | 5.x | Type-safe development |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Lucide React** | - | Icon library |

### **Backend**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.x | Web framework |
| **TypeScript** | 5.x | Type-safe backend |
| **Prisma** | 6.x | ORM and query builder |
| **jsonwebtoken** | 9.x | JWT authentication |
| **bcryptjs** | 2.x | Password hashing |

### **Database**
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary relational database |
| **Prisma Schema** | Database modeling and migrations |

### **Development Tools**
| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Git** | Version control |

---

## 📊 Database Schema

### **Entity Relationship Diagram**

```mermaid
erDiagram
    User ||--o{ ReceiptOrder : creates
    User ||--o{ DeliveryOrder : creates
    User ||--o{ InternalTransfer : creates
    User ||--o{ AuditLog : generates
    
    Product ||--o{ Stock : "stored in"
    Product ||--o{ ReceiptItem : "included in"
    Product ||--o{ DeliveryItem : "included in"
    Product ||--o{ MoveHistory : "tracked in"
    
    Location ||--o{ Stock : contains
    Location ||--o{ ReceiptOrder : "receives to"
    Location ||--o{ DeliveryOrder : "ships from"
    
    Vendor ||--o{ ReceiptOrder : supplies
    
    ReceiptOrder ||--o{ ReceiptItem : contains
    DeliveryOrder ||--o{ DeliveryItem : contains
    
    Invoice ||--o{ InvoiceItem : contains
    Invoice ||--o{ Payment : "paid by"
    
    Product ||--o{ LowStockAlert : triggers
    Location ||--o{ LowStockAlert : "alerts for"
    
    User {
        string id PK
        string email UK
        string password
        string name
        string role
        datetime createdAt
    }
    
    Product {
        string id PK
        string name
        string sku UK
        string description
        string unit
        int minStock
        datetime createdAt
    }
    
    Stock {
        string id PK
        int quantity
        string productId FK
        string locationId FK
        datetime updatedAt
    }
    
    ReceiptOrder {
        string id PK
        string receiptNumber UK
        boolean isValidated
        string vendorId FK
        string locationId FK
        string createdById FK
        text notes
        datetime createdAt
    }
    
    MoveHistory {
        string id PK
        string moveType
        int quantityBefore
        int quantityAfter
        int quantityChanged
        string productId FK
        string locationId FK
        string referenceId
        text notes
        datetime createdAt
    }
```

### **Core Models (18 Total)**

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | System users | email, password, role |
| **Product** | Inventory items | name, sku, unit, minStock |
| **Vendor** | Suppliers | name, email, phone, address |
| **Location** | Warehouse locations | name, type, warehouseId |
| **Stock** | Current stock levels | quantity, productId, locationId |
| **ReceiptOrder** | Incoming stock | receiptNumber, isValidated, vendorId |
| **DeliveryOrder** | Outgoing stock | deliveryNumber, isValidated, customerId |
| **InternalTransfer** | Location transfers | transferNumber, sourceId, destinationId |
| **StockAdjustment** | Inventory corrections | reason, quantityChange, adjustmentType |
| **Invoice** | Financial documents | invoiceNumber, totalAmount, taxAmount |
| **Payment** | Payment records | paymentNumber, amount, method |
| **MoveHistory** | Stock ledger | moveType, quantityBefore, quantityAfter |
| **LowStockAlert** | Stock alerts | severity, threshold, isRead |
| **AuditLog** | System audit trail | action, entityType, userId, ipAddress |
| **Settings** | System configuration | key, value, category |

---

## 📥 Installation

### **Prerequisites**

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git for cloning the repository

### **Step 1: Clone Repository**

```bash
git clone https://github.com/kalp-cg/stockMaster.git
cd stockMaster
```

### **Step 2: Install Dependencies**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### **Step 3: Environment Setup**

**Backend (.env)**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/stockmaster"
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
PORT=4000
NODE_ENV=development
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### **Step 4: Database Setup**

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with demo data
npx prisma db seed
```

### **Step 5: Run Applications**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on: `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs on: `http://localhost:3000`

---

## 🔑 Demo Credentials

### **Test Accounts**

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | admin@stockmaster.com | admin123 | Full system access |
| **Inventory Manager** | manager@stockmaster.com | manager123 | Validate operations, manage stock |
| **Warehouse Staff** | alice@stockmaster.com | staff123 | Create drafts, view data |

---

## 🎭 Role-Based Access Control

### **Permission Matrix**

```mermaid
graph LR
    subgraph "Admin (Full Access)"
        A1[User Management]
        A2[System Settings]
        A3[All Operations]
        A4[Location Management]
    end
    
    subgraph "Inventory Manager (Operational Control)"
        M1[Validate Receipts]
        M2[Validate Deliveries]
        M3[Approve Transfers]
        M4[Stock Adjustments]
        M5[Product CRUD]
        M6[Vendor CRUD]
        M7[Financial Management]
        M8[Reports & Analytics]
    end
    
    subgraph "Staff (Execution)"
        S1[Create Receipt Drafts]
        S2[Create Delivery Drafts]
        S3[View Products]
        S4[View Stock]
    end
    
    A3 --> M1
    A3 --> M2
    M1 --> S1
    M2 --> S2
```

### **Detailed Permissions (40+ Total)**

| Category | Admin | Manager | Staff |
|----------|-------|---------|-------|
| **Products** | Full CRUD | Full CRUD | View Only |
| **Vendors** | Full CRUD | Full CRUD | View Only |
| **Locations** | Full CRUD | View Only | View Only |
| **Users** | Full CRUD | View Only | ❌ |
| **Receipts** | All | Create/Validate | Create Only |
| **Deliveries** | All | Create/Validate | Create Only |
| **Transfers** | All | Create/Validate | ❌ |
| **Adjustments** | All | Create | ❌ |
| **Invoices** | All | Full CRUD | ❌ |
| **Payments** | All | Full CRUD | ❌ |
| **Reports** | All | All | ❌ |
| **Audit Trail** | All | View All | ❌ |
| **Settings** | Full | ❌ | ❌ |

---

## 📚 API Documentation

### **Authentication Endpoints**

```http
POST /auth/register
POST /auth/login
GET  /auth/me
POST /auth/logout
```

### **Core Resource Endpoints**

| Resource | Endpoints | Auth Required | Permissions |
|----------|-----------|---------------|-------------|
| **Products** | GET, POST, PUT, DELETE `/products` | ✅ | VIEW_PRODUCTS, CREATE_PRODUCTS |
| **Vendors** | GET, POST, PUT, DELETE `/vendors` | ✅ | VIEW_VENDORS, CREATE_VENDORS |
| **Receipts** | GET, POST, PUT `/receipts` | ✅ | VIEW_RECEIPTS, CREATE_RECEIPTS |
| **Validate Receipt** | POST `/receipts/:id/validate` | ✅ | VALIDATE_RECEIPTS |
| **Deliveries** | GET, POST, PUT `/deliveries` | ✅ | VIEW_DELIVERIES, CREATE_DELIVERIES |
| **Transfers** | GET, POST `/transfers` | ✅ | VIEW_TRANSFERS, CREATE_TRANSFERS |
| **Adjustments** | GET, POST `/adjustments` | ✅ | VIEW_ADJUSTMENTS, CREATE_ADJUSTMENTS |
| **Stock** | GET `/stock` | ✅ | VIEW_STOCK |
| **Move History** | GET `/move-history` | ✅ | VIEW_MOVE_HISTORY |
| **Reports** | GET `/reports/*` | ✅ | VIEW_REPORTS |

### **Example API Request**

```javascript
// Login
const response = await fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'manager@stockmaster.com',
    password: 'manager123'
  })
});
const { token, user } = await response.json();

// Get Products with Auth
const products = await fetch('http://localhost:4000/products', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🎨 Screenshots

### **Dashboard**
<div align="center">
<img src="https://via.placeholder.com/800x450/714B67/FFFFFF?text=Dashboard+with+Real-time+KPIs" alt="Dashboard">
</div>

### **Receipt Management**
<div align="center">
<img src="https://via.placeholder.com/800x450/714B67/FFFFFF?text=Receipt+Workflow+%28Draft+%E2%86%92+Waiting+%E2%86%92+Done%29" alt="Receipts">
</div>

### **Product Management**
<div align="center">
<img src="https://via.placeholder.com/800x450/714B67/FFFFFF?text=Product+CRUD+with+Stock+Levels" alt="Products">
</div>

### **Stock Move History**
<div align="center">
<img src="https://via.placeholder.com/800x450/714B67/FFFFFF?text=Complete+Stock+Ledger+Tracking" alt="Move History">
</div>

---

## 🚀 Deployment

### **Deployed Environment**

| Component | Platform | URL |
|---------|----------|------|
| **Frontend** | Vercel | [stock-master-lbnz-cwk224bfz-kalp-cgs-projects.vercel.app](https://stock-master-lbnz-cwk224bfz-kalp-cgs-projects.vercel.app/) |
| **Backend** | Render | [stockmaster-1-cnov.onrender.com](https://stockmaster-1-cnov.onrender.com) |
| **Database** | Neon.tech | PostgreSQL Serverless |

### **Quick Deploy to Render & Vercel**

**Backend (Render):**
1. Connect GitHub repository to Render as a "Web Service"
2. Set Build Command: `npm install && npx prisma generate && npm run build`
3. Set Start Command: `npm start`
4. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, etc.

**Frontend (Vercel):**
1. Import repository to Vercel
2. Set Root Directory to `frontend`
3. Framework Preset: `Next.js`
4. Build Command: `npm run build`
5. Add environment variable: `NEXT_PUBLIC_API_URL` pointing to backend URL.
railway add

# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up
```

### **Quick Deploy to Vercel**

```bash
# From the repo root
cd frontend
npm run deploy:vercel
```

If the project is not linked yet, Vercel will ask you to connect the repo once and then reuse that setup for later deploys.

### **Environment Variables for Production**

**Backend:**
```env
DATABASE_URL=<Railway PostgreSQL URL>
JWT_SECRET=<Generate 32+ char secret>
NODE_ENV=production
FRONTEND_URL=<Your Vercel URL>
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=<Your Railway Backend URL>
```

---

## 📖 Usage

### **Complete Workflow Example**

#### **1. Staff Creates Receipt**
```
Login as Staff → Receipts → Create New
- Select Vendor: "Steel Suppliers Inc"
- Select Location: "Main Warehouse"
- Add Product: "Steel Rods 10mm"
- Ordered Qty: 100 | Received Qty: 98
- Add Note: "2 items damaged during transport"
- Submit for Validation
Status: WAITING
```

#### **2. Manager Validates Receipt**
```
Login as Manager → Receipts → View Waiting Receipts
- Review quantities and notes
- Click "Validate Receipt"
Status: DONE ✅
Stock Updated: +98 units
Move History: Created RECEIPT entry
```

#### **3. Internal Transfer**
```
Manager → Transfers → Create New
- Source: Main Warehouse (98 units)
- Destination: Production Floor
- Product: Steel Rods 10mm
- Quantity: 20
- Validate Transfer
Result: Main Warehouse (78), Production Floor (20)
```

#### **4. Delivery to Customer**
```
Staff → Deliveries → Create New
- Customer: "XYZ Manufacturing"
- Location: Production Floor
- Product: Steel Rods 10mm
- Quantity: 15
- Submit

Manager → Validate Delivery
Result: Production Floor stock reduced to 5 units
```

#### **5. Stock Adjustment**
```
Manager → Adjustments → Create New
- Location: Production Floor
- Product: Steel Rods 10mm
- Adjustment: -3 (decrease)
- Reason: "3 units damaged during cutting"
Result: Final stock = 2 units
```

---

## 🧪 Testing

### **Run Tests**

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### **Test Coverage**

- ✅ Authentication flow
- ✅ RBAC permission checks
- ✅ Stock calculation logic
- ✅ Move history creation
- ✅ API endpoint validation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### **Coding Standards**

- Use TypeScript for type safety
- Follow ESLint configuration
- Write descriptive commit messages
- Add comments for complex logic
- Update documentation for new features

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Kalp CG**
- GitHub: [@kalp-cg](https://github.com/kalp-cg)
- Repository: [stockMaster](https://github.com/kalp-cg/stockMaster)

---

## 🙏 Acknowledgments

- Design inspiration from [Odoo ERP](https://www.odoo.com/)
- Icons by [Lucide](https://lucide.dev/)
- UI framework by [Tailwind CSS](https://tailwindcss.com/)
- Database ORM by [Prisma](https://www.prisma.io/)

---

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Email: [Your Email]
- Documentation: [Wiki](https://github.com/kalp-cg/stockMaster/wiki)

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Built with ❤️ using Next.js, TypeScript, and PostgreSQL**

[⬆ Back to Top](#-stockmaster---enterprise-inventory-management-system)

</div>
