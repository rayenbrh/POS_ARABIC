FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json backend/
RUN npm install --prefix backend

COPY frontend/package*.json frontend/
RUN npm install --prefix frontend

COPY backend backend
COPY frontend frontend

RUN npm run build --prefix frontend

WORKDIR /app/backend
EXPOSE 5000
CMD ["node", "server.js"]
