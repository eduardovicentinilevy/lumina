# Lumina — imagem única (API Express + build estático do React)
# Pronta para Google Cloud Run / App Engine flexible / qualquer host de containers.

FROM node:22-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-slim
WORKDIR /app

# better-sqlite3 precisa de build tools nativos no Debian slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_PATH=/app/data/lumina.db
EXPOSE 8080

WORKDIR /app/server
CMD ["node", "src/index.js"]
