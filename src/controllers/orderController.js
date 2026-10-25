
const prisma = require('../config/prisma');

// Kiểm tra ID hợp lệ
function validId(value) {
  const id = Number(value);

  return (
    Number.isSafeInteger(id) &&
    id > 0 &&
    id <= 2147483647
  );
}

// =====================================
// POST /api/orders
// TẠO ĐƠN HÀNG + ORDER DETAIL + SHIPMENT
// =====================================
async function createOrder(req, res) {
  const uid = req.user?.userId;
  const { items } = req.body || {};

  // Kiểm tra người dùng đã đăng nhập
  if (!validId(uid)) {
    return res.status(401).json({
      message: 'Người dùng chưa được xác thực'
    });
  }

  // Đơn hàng phải có sản phẩm
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: 'Đơn hàng phải có ít nhất một sản phẩm'
    });
  }

  // Kiểm tra dữ liệu sản phẩm
  const seen = new Set();

  for (const item of items) {
    if (
      !item ||
      !validId(item.pid) ||
      !Number.isInteger(item.qty) ||
      item.qty <= 0 ||
      item.qty > 2147483647
    ) {
      return res.status(400).json({
        message: 'Mã sản phẩm hoặc số lượng không hợp lệ'
      });
    }

    // Không cho phép trùng sản phẩm
    if (seen.has(Number(item.pid))) {
      return res.status(400).json({
        message: 'Sản phẩm bị trùng trong đơn hàng'
      });
    }

    seen.add(Number(item.pid));
  }

  try {
    // Transaction đảm bảo dữ liệu nhất quán
    const order = await prisma.$transaction(async (tx) => {
      const details = [];

      // 1. Kiểm tra sản phẩm và trừ tồn kho
      for (const item of items) {
        const pid = Number(item.pid);

        const product = await tx.product.findUnique({
          where: { pid }
        });

        // Sản phẩm không tồn tại
        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${pid}`);
        }

        // Chỉ trừ kho nếu còn đủ số lượng
        const updated = await tx.product.updateMany({
          where: {
            pid,
            quantity: {
              gte: item.qty
            }
          },
          data: {
            quantity: {
              decrement: item.qty
            }
          }
        });

        if (updated.count !== 1) {
          throw new Error(`OUT_OF_STOCK:${pid}`);
        }

        // Lưu thông tin chi tiết đơn hàng
        details.push({
          pid,
          qty: item.qty,
          unit_price: product.price
        });
      }

      // 2. Tạo Order, OrderDetail và Shipment
      return tx.order.create({
        data: {
          uid: Number(uid),

          // createat tự lấy thời gian hiện hành
          // theo @default(now()) trong Prisma

          orderDetails: {
            create: details
          },

          // Tự động tạo Shipment
          shipments: {
            create: {
              status: 'PENDING'
            }
          }
        },

        include: {
          orderDetails: true,
          shipments: true
        }
      });
    });

    // 3. Trả kết quả đặt hàng thành công
    return res.status(201).json({
      message: 'Tạo đơn hàng thành công',
      order
    });

  } catch (error) {
    if (error.message.startsWith('PRODUCT_NOT_FOUND:')) {
      return res.status(404).json({
        message: 'Sản phẩm không tồn tại'
      });
    }

    if (error.message.startsWith('OUT_OF_STOCK:')) {
      return res.status(409).json({
        message: 'Sản phẩm không đủ số lượng tồn kho'
      });
    }

    console.error('Create order error:', error.message);

    return res.status(500).json({
      message: 'Không thể tạo đơn hàng'
    });
  }
}

// =====================================
// GET /api/orders
// XEM DANH SÁCH ĐƠN HÀNG
// =====================================
async function getOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        uid: req.user.userId
      },

      include: {
        orderDetails: {
          include: {
            product: {
              select: {
                pid: true,
                pname: true
              }
            }
          }
        },
        shipments: true
      },

      orderBy: {
        oid: 'desc'
      }
    });

    return res.status(200).json({
      message: 'Lấy danh sách đơn hàng thành công',
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error.message);

    return res.status(500).json({
      message: 'Không thể lấy danh sách đơn hàng'
    });
  }
}

// =====================================
// GET /api/orders/:id
// XEM CHI TIẾT ĐƠN HÀNG
// =====================================
async function getOrderById(req, res) {
  const oid = Number(req.params.id);

  if (!validId(oid)) {
    return res.status(400).json({
      message: 'Mã đơn hàng không hợp lệ'
    });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        oid,
        uid: req.user.userId
      },

      include: {
        orderDetails: {
          include: {
            product: {
              select: {
                pid: true,
                pname: true
              }
            }
          }
        },

        shipments: true
      }
    });

    if (!order) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng'
      });
    }

    return res.status(200).json({
      message: 'Lấy chi tiết đơn hàng thành công',
      order
    });

  } catch (error) {
    console.error('Get order by ID error:', error.message);

    return res.status(500).json({
      message: 'Không thể lấy chi tiết đơn hàng'
    });
  }
}

// Xuất các hàm Controller
module.exports = {
  createOrder,
  getOrders,
  getOrderById
};
