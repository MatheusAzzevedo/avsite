# 🌐 Guia de Configuração para Produção

## 📋 Pré-requisitos

- Projeto Next.js rodando localmente
- Servidor com Node.js 18+
- PostgreSQL disponível (ou serviço gerenciado)
- Domínio configurado
- SSL/TLS certificate

---

## ✅ Passo 1: Variáveis de Ambiente para Produção

### 1.1 Criar `.env.production.local`

```bash
# ====================================
# Banco de Dados (Railway, AWS, Azure, etc)
# ====================================

DB_USER=seu_usuario
DB_PASSWORD=sua_senha_super_segura
DB_HOST=seu-host-producao.com
DB_PORT=5432
DB_NAME=avoar_production

DATABASE_URL=postgresql://seu_usuario:sua_senha@seu-host-producao.com:5432/avoar_production

# ====================================
# Segurança
# ====================================

# Gerar novo JWT_SECRET:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=seu_jwt_secret_muito_longo_e_aleatorio_32bytes

# ====================================
# Ambiente
# ====================================

NODE_ENV=production

# ====================================
# URLs Públicas
# ====================================

NEXT_PUBLIC_API_URL=https://seu-dominio.com
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com

# ====================================
# Opcional: Analytics, Email, etc
# ====================================

# SENDGRID_API_KEY=sua_chave
# STRIPE_SECRET_KEY=sua_chave
# STRIPE_PUBLISHABLE_KEY=sua_chave
```

---

## ✅ Passo 2: Build para Produção

Na pasta `sistema/`:

```bash
# Build da aplicação
npm run build

# Verificar se está tudo OK
npm start
```

**Esperado:**
```
> avoar-sistema@0.3.0 start
> next start

▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Environments: .env.production.local
Ready in 0.9s
```

---

## ✅ Passo 3: Opções de Hosting

### A. Vercel (Recomendado para Next.js)

**Vantagens:**
- Deploy automático do GitHub
- Otimizações Next.js nativas
- Fácil gerenciamento de variáveis de ambiente
- Edge Functions

**Passos:**

1. Fazer push para GitHub:
```bash
git push origin main
```

2. Ir para [vercel.com](https://vercel.com)
3. Conectar repositório GitHub
4. Configurar variáveis de ambiente
5. Deploy automático!

### B. Railway

**Vantagens:**
- Fácil deploy
- PostgreSQL incluído
- Preços baixos

**Passos:**

1. Criar conta em [railway.app](https://railway.app)
2. Conectar repositório GitHub
3. Configurar variáveis de ambiente
4. Deploy com um clique

### C. AWS EC2

**Vantagens:**
- Controle total
- Escalabilidade
- Muitos serviços disponíveis

**Passos:**

1. Lançar EC2 instance (Ubuntu 20.04 LTS)
2. Instalar Node.js e PM2:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

3. Clonar repositório
4. Configurar `.env.production.local`
5. Build e start com PM2:
```bash
npm run build
pm2 start npm -- start --name "avoar-app"
pm2 save
```

### D. DigitalOcean App Platform

Simples e direto, similar ao Vercel.

### E. Docker + Container

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## ✅ Passo 4: Banco de Dados em Produção

### Opção A: Railway PostgreSQL (Integrado)

Railway oferece PostgreSQL gerenciado.

### Opção B: AWS RDS

1. Criar instance RDS PostgreSQL
2. Copiar `DATABASE_URL` para `.env.production.local`
3. Executar migration:
```bash
psql $DATABASE_URL < lib/db/schema.sql
```

### Opção C: Azure Database for PostgreSQL

Similar a AWS RDS, super confiável.

---

## ✅ Passo 5: Domain e SSL/TLS

### Configurar HTTPS

**Com Vercel:**
- Automático (Let's Encrypt)
- Renova automaticamente

**Com outros:**
1. Comprar SSL certificate ou usar Let's Encrypt
2. Configurar no servidor/load balancer
3. Redirecionar HTTP → HTTPS

```bash
# Let's Encrypt (Certbot)
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d seu-dominio.com
```

---

## ✅ Passo 6: Monitoramento

### PM2 Monitoring

```bash
pm2 install pm2-auto-pull  # Auto-deploy do GitHub
pm2 install pm2-logrotate   # Rotação de logs
pm2 logs
```

### Uptime Monitoring

- [UptimeRobot](https://uptimerobot.com) - Gratuito
- [Pingdom](https://www.pingdom.com) - Pago
- [Datadog](https://www.datadoghq.com) - Enterprise

### Logs

```bash
# Ver logs
pm2 logs avoar-app

# Com tail
pm2 logs avoar-app --lines 100
```

---

## ✅ Passo 7: Segurança em Produção

### Checklist de Segurança

- [ ] `JWT_SECRET` é forte e único
- [ ] Senhas do banco estão seguras
- [ ] HTTPS habilitado
- [ ] CORS configurado corretamente
- [ ] Headers de segurança configurados
- [ ] Rate limiting implementado
- [ ] SQL Injection prevenido (Zod + Parameterized queries)
- [ ] XSS prevenido
- [ ] CSRF tokens em formulários
- [ ] Backups automáticos do banco

### Headers de Segurança (Next.js)

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## ✅ Passo 8: Backups

### PostgreSQL

```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Automático com Railway/AWS
- Habilitado por padrão
- Retenção configurável

---

## 🚀 Checklist de Deploy

- [ ] Build local funciona (`npm run build`)
- [ ] `.env.production.local` configurado
- [ ] Banco de dados em produção criado
- [ ] Schema SQL executado em produção
- [ ] Variáveis de ambiente no servidor/CI/CD
- [ ] HTTPS/SSL configurado
- [ ] Domínio apontando para servidor
- [ ] Testes de carga bem-sucedidos
- [ ] Monitoramento configurado
- [ ] Backups automáticos ativados
- [ ] Rotina de segurança implementada

---

## 📞 Troubleshooting

### "Connection refused" no banco

```bash
# Verificar se banco está acessível
psql $DATABASE_URL -c "SELECT version();"

# Configurar firewall se necessário
```

### "Out of memory"

```bash
# Aumentar memoria do Node
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

### Requests muito lentos

- Verificar índices do banco (schema.sql já tem)
- Implementar caching
- Usar CDN para assets estáticos
- Considerar replicação de banco

---

## 📚 Recursos

- [Vercel Deployment](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [AWS Best Practices](https://docs.aws.amazon.com)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Última atualização**: 27 de Janeiro de 2025

