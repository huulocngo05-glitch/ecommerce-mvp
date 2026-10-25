
const express = require('express');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

// THÊM: Import Order Routes
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Đọc dữ liệu JSON từ request
app.use(express.json());

// Trang chủ API
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Ecommerce API is running'
  });
});

// Kiểm tra trạng thái API
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

// Routes đăng ký và đăng nhập
app.use('/api/auth', authRoutes);

// Routes người dùng
app.use('/api/users', userRoutes);

// Routes quản lý sản phẩm (CRUD)
app.use('/api/products', productRoutes);

// THÊM: Routes quản lý đơn hàng
app.use('/api/orders', orderRoutes);

// Xử lý URL không tồn tại
app.use((req, res) => {
  res.status(404).json({
    message: 'API endpoint không tồn tại'
  });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    message: 'Đã xảy ra lỗi máy chủ'
  });
});

module.exports = app;
