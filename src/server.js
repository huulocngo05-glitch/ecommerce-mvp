require('dotenv').config();

const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');

    app.listen(PORT, () => {
      console.log(`Ecommerce API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Cannot connect to PostgreSQL:', error.message);
    process.exit(1);
  }
}

startServer();