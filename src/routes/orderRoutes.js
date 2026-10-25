
const express = require('express');

const {
  createOrder,
  getOrders,
  getOrderById
} = require('../controllers/orderController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Tất cả API Order đều yêu cầu đăng nhập JWT
router.use(authMiddleware);

// Tạo đơn hàng
router.post('/', createOrder);

// Xem danh sách đơn hàng
router.get('/', getOrders);

// Xem chi tiết đơn hàng
router.get('/:id', getOrderById);

module.exports = router;
