# API Avorar Turismo

Backend em Node.js/Express/TypeScript com PostgreSQL para o sistema Avorar Turismo.

## Status Atual

**✅ API funcionando normalmente em produção (Railway)**

Últimas implementações:
- Excursões agora aparecem corretamente no site e admin (trust proxy configurado)
- Rate limiting funcionando com proxy reverso (Railway)
- 6 excursões no banco e listadas normalmente: Cristo Redentor, Biologia Marinha, Cachoeiras, Passeio de Barco, 2 de teste
- Sistema de logging robusto com Winston para debugging em Railway
- CRUD completo de excursões, posts e uploads de imagens

## Estrutura do Projeto

```
api/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.ts            # Dados iniciais
├── src/
│   ├── config/
│   │   └── database.ts    # Configuração Prisma
│   ├── middleware/
│   │   ├── auth.middleware.ts     # Autenticação JWT
│   │   └── validate.middleware.ts # Validação Zod
│   ├── routes/
│   │   ├── auth.routes.ts         # Login/Registro
│   │   ├── excursao.routes.ts     # CRUD Excursões
│   │   ├── post.routes.ts         # CRUD Posts
│   │   ├── upload.routes.ts       # Upload de imagens
│   │   ├── payment-config.routes.ts # Config pagamentos
│   │   └── public.routes.ts       # Rotas públicas (sem auth)
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   ├── excursao.schema.ts
│   │   └── post.schema.ts
│   ├── utils/
│   │   ├── api-error.ts
│   │   ├── logger.ts
│   │   └── slug.ts
│   └── server.ts          # Servidor Express
├── uploads/               # Imagens enviadas
├── .env                   # Variáveis de ambiente
├── package.json
└── tsconfig.json
```

## Comandos

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run prisma:generate

# Criar tabelas no banco
npm run prisma:push

# Popular banco com dados iniciais
npm run seed

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Produção
npm start
```

## Variáveis de Ambiente

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=sua-chave-secreta
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000
```

## Credenciais Padrão

Após executar `npm run seed`:

- **Email:** admin@avorar.com
- **Senha:** admin123

## Documentação

- [API-DOCS.md](./API-DOCS.md) - Documentação completa da API
- [DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md) - Guia de deploy
