
const prisma = require('../config/prisma');

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        uid: req.user.userId
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

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy tài khoản'
      });
    }

    return res.status(200).json({
      message: 'Lấy thông tin tài khoản thành công',
      user
    });

  } catch (error) {
    console.error('Get profile error:', error.message);

    return res.status(500).json({
      message: 'Không thể lấy thông tin tài khoản'
    });
  }
}

module.exports = { getProfile };
