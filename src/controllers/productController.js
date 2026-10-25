
const prisma = require('../config/prisma');

// Kiểm tra mã sản phẩm
function parseProductId(value) {
  const pid = Number(value);

  if (
    !Number.isInteger(pid) ||
    pid <= 0 ||
    pid > 2147483647
  ) {
    return null;
  }

  return pid;
}

// Kiểm tra giá sản phẩm theo DECIMAL(10,2)
function parsePrice(value) {
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    value === ''
  ) {
    return null;
  }

  const price = Number(value);

  if (
    !Number.isFinite(price) ||
    price < 0 ||
    price > 99999999.99 ||
    Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
  ) {
    return null;
  }

  return price.toFixed(2);
}

// Kiểm tra số lượng tồn kho
function parseQuantity(value) {
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    value === ''
  ) {
    return null;
  }

  const quantity = Number(value);

  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 2147483647
  ) {
    return null;
  }

  return quantity;
}

// 1. Lấy danh sách sản phẩm
async function getProducts(req, res) {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        pid: 'desc'
      }
    });

    return res.status(200).json({
      message: 'Lấy danh sách sản phẩm thành công',
      products
    });
  } catch (error) {
    console.error('Get products error:', error.message);

    return res.status(500).json({
      message: 'Không thể lấy danh sách sản phẩm'
    });
  }
}

// 2. Lấy chi tiết sản phẩm theo pid
async function getProductById(req, res) {
  try {
    const pid = parseProductId(req.params.id);

    if (pid === null) {
      return res.status(400).json({
        message: 'Mã sản phẩm không hợp lệ'
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        pid: pid
      }
    });

    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      });
    }

    return res.status(200).json({
      message: 'Lấy chi tiết sản phẩm thành công',
      product
    });
  } catch (error) {
    console.error('Get product error:', error.message);

    return res.status(500).json({
      message: 'Không thể lấy chi tiết sản phẩm'
    });
  }
}

// 3. Thêm sản phẩm
async function createProduct(req, res) {
  try {
    const { pname, price, quantity } = req.body;

    // Kiểm tra tên sản phẩm
    if (
      typeof pname !== 'string' ||
      !pname.trim() ||
      pname.trim().length > 100
    ) {
      return res.status(400).json({
        message: 'Tên sản phẩm không hợp lệ'
      });
    }

    // Kiểm tra giá và số lượng
    const parsedPrice = parsePrice(price);
    const parsedQuantity = parseQuantity(quantity);

    if (parsedPrice === null) {
      return res.status(400).json({
        message: 'Giá sản phẩm không hợp lệ'
      });
    }

    if (parsedQuantity === null) {
      return res.status(400).json({
        message: 'Số lượng sản phẩm không hợp lệ'
      });
    }

    // Lưu sản phẩm vào PostgreSQL
    const product = await prisma.product.create({
      data: {
        pname: pname.trim(),
        price: parsedPrice,
        quantity: parsedQuantity
      }
    });

    return res.status(201).json({
      message: 'Thêm sản phẩm thành công',
      product
    });
  } catch (error) {
    console.error('Create product error:', error.message);

    return res.status(500).json({
      message: 'Không thể thêm sản phẩm'
    });
  }
}

// 4. Cập nhật sản phẩm
async function updateProduct(req, res) {
  try {
    const pid = parseProductId(req.params.id);

    if (pid === null) {
      return res.status(400).json({
        message: 'Mã sản phẩm không hợp lệ'
      });
    }

    const { pname, price, quantity } = req.body;

    const data = {};

    // Cập nhật tên sản phẩm nếu được gửi
    if (pname !== undefined) {
      if (
        typeof pname !== 'string' ||
        !pname.trim() ||
        pname.trim().length > 100
      ) {
        return res.status(400).json({
          message: 'Tên sản phẩm không hợp lệ'
        });
      }

      data.pname = pname.trim();
    }

    // Cập nhật giá nếu được gửi
    if (price !== undefined) {
      const parsedPrice = parsePrice(price);

      if (parsedPrice === null) {
        return res.status(400).json({
          message: 'Giá sản phẩm không hợp lệ'
        });
      }

      data.price = parsedPrice;
    }

    // Cập nhật số lượng nếu được gửi
    if (quantity !== undefined) {
      const parsedQuantity = parseQuantity(quantity);

      if (parsedQuantity === null) {
        return res.status(400).json({
          message: 'Số lượng sản phẩm không hợp lệ'
        });
      }

      data.quantity = parsedQuantity;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Không có dữ liệu để cập nhật'
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const existingProduct = await prisma.product.findUnique({
      where: {
        pid: pid
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Thực hiện cập nhật
    const product = await prisma.product.update({
      where: {
        pid: pid
      },
      data: data
    });

    return res.status(200).json({
      message: 'Cập nhật sản phẩm thành công',
      product
    });
  } catch (error) {
    console.error('Update product error:', error.message);

    return res.status(500).json({
      message: 'Không thể cập nhật sản phẩm'
    });
  }
}

// 5. Xóa sản phẩm
async function deleteProduct(req, res) {
  try {
    const pid = parseProductId(req.params.id);

    if (pid === null) {
      return res.status(400).json({
        message: 'Mã sản phẩm không hợp lệ'
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const existingProduct = await prisma.product.findUnique({
      where: {
        pid: pid
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Xóa sản phẩm
    await prisma.product.delete({
      where: {
        pid: pid
      }
    });

    return res.status(200).json({
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Delete product error:', error.message);

    if (error.code === 'P2003') {
      return res.status(409).json({
        message: 'Không thể xóa sản phẩm đang được sử dụng trong đơn hàng'
      });
    }

    return res.status(500).json({
      message: 'Không thể xóa sản phẩm'
    });
  }
}

// Xuất 5 hàm để productRoutes.js sử dụng
module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
