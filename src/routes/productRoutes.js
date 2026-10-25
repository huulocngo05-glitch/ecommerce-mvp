
const express = require('express');

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Kiểm tra quyền ADMIN
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Bạn không có quyền thực hiện chức năng này'
    });
  }

  next();
};

// GET: Ai cũng có thể xem sản phẩm
router.get('/', getProducts);
router.get('/:id', getProductById);

// POST, PUT, DELETE: Chỉ ADMIN
router.post('/', authMiddleware, requireAdmin, createProduct);
router.put('/:id', authMiddleware, requireAdmin, updateProduct);
router.delete('/:id', authMiddleware, requireAdmin, deleteProduct);

module.exports = router;
