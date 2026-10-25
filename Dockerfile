FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/ecommerce_mvp?schema=public" npx prisma generate

COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]

