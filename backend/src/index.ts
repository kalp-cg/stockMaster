import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import productRoutes from './routes/products.routes';
import locationRoutes from './routes/locations.routes';
import vendorRoutes from './routes/vendors.routes';
import receiptRoutes from './routes/receipts.routes';
import deliveryRoutes from './routes/deliveries.routes';
import transferRoutes from './routes/transfers.routes';
import adjustmentRoutes from './routes/adjustments.routes';
import moveHistoryRoutes from './routes/move-history.routes';
import dashboardRoutes from './routes/dashboard.routes';
import alertRoutes from './routes/alerts.routes';
import invoiceRoutes from './routes/invoices.routes';
import reportRoutes from './routes/reports.routes';
import paymentRoutes from './routes/payments.routes';
import settingsRoutes from './routes/settings.routes';
import auditRoutes from './routes/audit.routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/move-history', moveHistoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);

app.get('/', (req, res) => {
    res.send('StockMaster Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
