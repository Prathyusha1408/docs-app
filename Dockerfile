FROM node:22-slim
WORKDIR /app
RUN mkdir -p /data
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV DB_PATH=/data/data.db
CMD ["node","server.js"]
