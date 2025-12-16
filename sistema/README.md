# Avoar Sistema

Plataforma de gerenciamento de excursões ecológicas e blog educativo. Sistema administrativo completo com autenticação, CRUD de blog, gerenciamento de excursões e integração com pagamentos.

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Configurar banco de dados (executar schema.sql)
# Ver SETUP.md para instruções

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 📁 Estrutura do Projeto

- `app/` - Páginas e rotas Next.js
- `components/` - Componentes React reutilizáveis
- `lib/` - Validação (Zod), autenticação (JWT), banco de dados (PostgreSQL), utilitários
- `public/` - Arquivos estáticos
- `middleware.ts` - Proteção de rotas administrativas

## 🔧 Stack Tecnológico

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Estilização modular
- **Zod** - Validação de dados em tempo de execução
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação com tokens
- **bcryptjs** - Hash seguro de senhas
- **Sharp** - Otimização de imagens

## 📝 Fases de Desenvolvimento

- [x] Fase 1: Setup Base (Database + Validation + Auth)
- [x] Fase 2: Sistema de Autenticação (Login + Dashboard)
- [x] Fase 3: Módulo Blog (Editor + CRUD)
- [x] Fase 4: Módulo Excursões (CRUD + Imagens)
- [ ] Fase 5: Módulo Pagamento

## 🔄 Últimas Atualizações

**Menu de Navegação**: Adicionado botão "Login" em todos os arquivos HTML do site estático com redirecionamento dinâmico. O script JavaScript detecta automaticamente se está em ambiente de desenvolvimento (localhost) ou produção e configura a URL correta para acessar a página de login administrativo (`/admin/login`) do sistema Next.js.

## 📚 Documentação Importante

- `SETUP.md` - Guia passo a passo de configuração
- `FASE-1-COMPLETA.md` - Detalhes da Fase 1 implementada
- `../Docs/Plano-Implementacao-Sistema.md` - Plano completo do projeto
