# Dockerfile para API Avorar – build a partir da raiz do repo
# O Railway usa este Dockerfile quando Root Directory não resolve

FROM node:20-alpine

WORKDIR /app

# Instala dependências (apenas pasta api/)
COPY api/package.json ./
RUN npm install

# Cópia do código da API
COPY api/ .
RUN npx prisma generate && npm run build

EXPOSE 3001

# Aplica schema no PostgreSQL e inicia a API
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
