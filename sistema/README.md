# Avoar Sistema

Plataforma completa de gerenciamento de excursões ecológicas e blog educativo. Sistema administrativo com autenticação JWT, CRUD de blog com editor rich-text, gerenciamento de excursões, otimização de imagens e pronto para integrações de pagamento.

## ✨ Últimas Atualizações (v0.5.2)

- **CSS Padrão Avoar Aplicado**: Todas as páginas do sistema agora seguem o padrão visual Avoar com fundo preto (#000000), texto branco, cor principal amarela (#FACC15), e fontes Cairo e Montserrat.
- **Layout Corrigido**: Removido conflitos de CSS inline, simplificado layout root e admin.
- **Documentação CSS**: Criado `CSS-PADRAO-AVOAR-APLICADO.txt` com guia completo do padrão de design.
- **Servidor Estático + Proxy**: Servidor estático rodando na porta 3000 com proxy correto para Next.js na porta 3001, garantindo CSS carregado em todas as páginas.

## ⚡ Início Rápido (5 minutos)

```bash
# 1. Entrar na pasta do sistema
cd sistema

# 2. Dependências já instaladas ✅ (552 packages)
# Caso precise: npm install

# 3. Configurar .env.local (Ver GUIA-RAPIDO-SETUP.md)

# 4. Criar banco de dados PostgreSQL
psql -U postgres -c "CREATE DATABASE avoar_db;"
psql -U postgres -d avoar_db < lib/db/schema.sql

# 5. Executar em desenvolvimento
npm run dev

# 6. Acessar: http://localhost:3000
```

**Para instruções detalhadas**: Ver `GUIA-RAPIDO-SETUP.md` ou `CONFIGURACAO-SETUP.md`

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

## ✅ Status de Configuração

- ✅ **Dependências**: 552 packages instalados com sucesso
- ✅ **TypeScript**: Configurado para type-safety completo
- ✅ **Banco de Dados**: Schema SQL pronto com 4 tabelas + indices
- ✅ **Autenticação**: JWT + bcryptjs configurados
- ✅ **Validação**: Zod schemas centralizados
- ✅ **UI**: Tailwind CSS + componentes responsivos
- ✅ **API REST**: CRUD de Blog e Excursões
- ✅ **Segurança**: Middleware, validação de entrada, headers de segurança
- ✅ **Menu de Navegação**: Login acessível do site estático

## 🔄 Últimas Atualizações (v0.4.0)

**Menu de Navegação + Redirecionamento Dinâmico**: 
- Botão "Login" adicionado em todos os 8 arquivos HTML
- Script JavaScript detecta ambiente (desenvolvimento/produção)
- Redireciona corretamente para `/admin/login` em localhost:3000

## 📚 Documentação Importante

### 🔧 Setup e Configuração
- **`GUIA-RAPIDO-SETUP.md`** ⭐ - Guia de 5 minutos (COMECE AQUI!)
- **`CONFIGURACAO-SETUP.md`** - Configuração completa e detalhada
- **`CONFIGURACAO-PRODUCAO.md`** - Deploy e produção
- `SETUP.md` - Guia original (Fase 1)

### 📖 Documentação do Projeto
- `CHANGELOG.md` - Histórico de versões (últimas 5)
- `ESTRUTURA-PROJETO.md` - Arquitetura do projeto
- `FASE-1-COMPLETA.md` - Detalhes da Fase 1
- `FASE-2-COMPLETA.md` - Detalhes da Fase 2
- `../Docs/Plano-Implementacao-Sistema.md` - Plano completo do projeto

### 🛠️ Scripts Automáticos
- `setup.bat` - Setup automático (Windows)
- `setup.sh` - Setup automático (macOS/Linux)
