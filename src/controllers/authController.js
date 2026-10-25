
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// KIỂM TRA DỮ LIỆU ĐĂNG KÝ
function validateRegister(username, fullname, password) {
  if (
    typeof username !== 'string' ||
    typeof fullname !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !fullname.trim() ||
    !password
  ) {
    return 'Vui lòng nhập username, fullname và password';
  }

  if (username.trim().length > 50 || fullname.trim().length > 100) {
    return 'Username hoặc họ tên vượt quá độ dài cho phép';
  }

  if (password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự';
  }

  return null;
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, fullname, password } = req.body || {};

    const validationError = validateRegister(
      username,
      fullname,
      password
    );

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Kiểm tra username đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: {
        username: normalizedUsername
      }
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Username đã tồn tại'
      });
    }

    // Mã hóa mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 12);

    // Transaction đảm bảo đăng ký nhất quán
    const user = await prisma.$transaction(async (tx) => {

      // 1. Tìm hoặc tạo role normal
      let role = await tx.role.findUnique({
        where: {
          rolename: 'normal'
        }
      });

      if (!role) {
        role = await tx.role.create({
          data: {
            rolename: 'normal'
          }
        });
      }

      // 2. Tìm Membership mặc định có score = 10
      let membership = await tx.memberShip.findFirst({
        where: {
          mname: 'DEFAULT',
          score: 10
        }
      });

      if (!membership) {
        membership = await tx.memberShip.create({
          data: {
            mname: 'DEFAULT',
            score: 10
          }
        });
      }

      // 3. Tạo tài khoản và gán Role, Membership
      return tx.user.create({
        data: {
          username: normalizedUsername,
          fullname: fullname.trim(),
          password: hashedPassword,
          roleid: role.roleid,
          mid: membership.mid
        },
        select: {
          uid: true,
          username: true,
          fullname: true,
          role: {
            select: {
              roleid: true,
              rolename: true
            }
          },
          memberShip: {
            select: {
              mid: true,
              mname: true,
              score: true
            }
          }
        }
      });
    });

    return res.status(201).json({
      message: 'Đăng ký thành công',
      user
    });

  } catch (error) {
    console.error('Register error:', error.message);

    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Username đã tồn tại hoặc dữ liệu bị trùng'
      });
    }

    return res.status(500).json({
      message: 'Không thể đăng ký tài khoản'
    });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Vui lòng nhập username và password'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        username: username.trim().toLowerCase()
      },
      include: {
        role: true,
        memberShip: true
      }
    });

    // Kiểm tra tài khoản và mật khẩu
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Username hoặc mật khẩu không chính xác'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET chưa được cấu hình');

      return res.status(500).json({
        message: 'Không thể đăng nhập'
      });
    }

    // Tạo JWT
    const token = jwt.sign(
      {
        userId: user.uid,
        username: user.username,
        role: user.role.rolename
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    );

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        uid: user.uid,
        username: user.username,
        fullname: user.fullname,
        role: user.role.rolename,
        membership: {
          mid: user.memberShip.mid,
          mname: user.memberShip.mname,
          score: user.memberShip.score
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      message: 'Không thể đăng nhập'
    });
  }
}

module.exports = {
  register,
  login
};
