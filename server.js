require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dir = path.join(__dirname, 'public');
app.use('/public/', express.static(dir));

const authenticateToken = require('./authenticate');

const userRoutes = require('./src/routers/auth');
const dashboardRoutes = require('./src/routers/dashboard');
const companyRouters = require('./src/routers/company');
const shippingRoutes = require('./src/routers/shipping');
const bankRoutes = require('./src/routers/banks');
const generalRoutes = require('./src/routers/general');
const customerRoutes = require('./src/routers/customer');
const deliveryRoutes = require('./src/routers/delivery');
const receiptsRoutes = require('./src/routers/receipts');
const supplierRoutes = require('./src/routers/supplier');
const productRoutes = require('./src/routers/product');
const brandRoutes = require('./src/routers/brand');
const categoryRoutes = require('./src/routers/categories');
const posRoutes = require('./src/routers/pos')
const quotationRoutes = require('./src/routers/quotations');
const salesRoutes = require('./src/routers/sales');
const purchaseRoutes = require('./src/routers/purchases');
const indonesiaRouters = require('./src/routers/indonesia');
const adjustmentRouters = require('./src/routers/adjustment');
const transferRouters = require('./src/routers/transfer');
const stockOpnameRouters = require('./src/routers/stockOpname');
const invoiceRouters = require('./src/routers/invoice');
const reconciliateRouters = require('./src/routers/reconciliate');
const paymentRouters = require('./src/routers/payment');
const taskRoutes = require('./src/routers/tasks');
const notificationRoutes = require('./src/routers/notifications');
const activityRoutes = require('./src/routers/acitvities');

const serialNumberRoutes = require('./src/routers/serialNumbers');

const tokopediaRoutes = require('./src/routers/tokopedia');

const updateRoutes = require('./src/routers/update');
app.use('/update', updateRoutes);

app.use('/auth', userRoutes);
app.use('/dashboard', authenticateToken, dashboardRoutes);
app.use('/setting', authenticateToken, companyRouters);
app.use('/setting', authenticateToken, shippingRoutes);
app.use('/setting', authenticateToken, bankRoutes);
app.use('/setting', authenticateToken, generalRoutes);
app.use('/customers', authenticateToken, customerRoutes);
app.use('/delivery', authenticateToken, deliveryRoutes);
app.use('/receipts', authenticateToken, receiptsRoutes);
app.use('/suppliers', authenticateToken, supplierRoutes);
app.use('/products', authenticateToken, productRoutes);
app.use('/brands', authenticateToken, brandRoutes);
app.use('/categories', authenticateToken, categoryRoutes );
app.use('/pos', authenticateToken, posRoutes);
app.use('/quotations', authenticateToken, quotationRoutes);
app.use('/sales', authenticateToken, salesRoutes);
app.use('/purchases', authenticateToken, purchaseRoutes);
app.use('/indonesia', authenticateToken, indonesiaRouters);
app.use('/adjustments', authenticateToken, adjustmentRouters);
app.use('/transfers', authenticateToken, transferRouters);
app.use('/stockopname', authenticateToken, stockOpnameRouters);
app.use('/invoices', authenticateToken, invoiceRouters);
app.use('/reconciliate', authenticateToken, reconciliateRouters);
app.use('/payments', authenticateToken, paymentRouters);
app.use('/tasks', authenticateToken, taskRoutes);
app.use('/notifications', authenticateToken, notificationRoutes);
app.use('/activities', authenticateToken, activityRoutes);

app.use('/serial', authenticateToken, serialNumberRoutes);

app.use('/tokopedia', authenticateToken, tokopediaRoutes);

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.DATA_BASE)
.then(() => {
    app.listen(PORT, () => console.log(`Server listen on port ${PORT}`));
});
