# --- ЭТАП 1: Сборка приложения ---
# Берем образ Node.js с полным набором инструментов
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# --- ЭТАП 2: Создание финального образа ---
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY README.md .

CMD [ "npm", "run", "start:prod" ]