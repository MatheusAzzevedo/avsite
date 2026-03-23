# Dockerfile para desenvolvimento da API Avorar
FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos necessários para instalar dependências, incluindo o diretório prisma
COPY package.json package-lock.json ./
COPY prisma/ prisma/

# Instala dependências
RUN npm install --include=dev

# Copia o restante do código da API
COPY . .

# Instala o Prisma Client e configura o ambiente de desenvolvimento
RUN npx prisma generate

# Expõe a porta do servidor
EXPOSE 3001

# Inicia o servidor com o script dev (usa ts-node-dev)
CMD ["npm", "run", "dev"]