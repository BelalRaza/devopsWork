const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');

const app = express();

// CORS Configuration - Allow all origins for the ECS deployment
app.use(cors());

app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ShopSmart Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Root Route
app.get('/', (req, res) => {
  res.send('ShopSmart Backend Service');
});

module.exports = app;
