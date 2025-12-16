# 🚀 PRÓXIMAS AÇÕES - Fase 2 (Sistema de Autenticação)

## Agora que a Fase 1 está Completa...

Você tem um projeto Next.js totalmente funcional com:
- ✅ Banco de dados PostgreSQL configurado
- ✅ Validação com Zod pronta
- ✅ Autenticação JWT implementada
- ✅ Dados de teste inseridos
- ✅ Servidor rodando

## 🎯 Fase 2: Sistema de Autenticação

A próxima etapa é implementar o **Sistema de Autenticação Completo**. Aqui está o que será feito:

### 1. Página de Login (`/admin/login`)
- [ ] Criar componente de formulário de login
- [ ] Validar email e senha com Zod
- [ ] Enviar requisição para API
- [ ] Armazenar token JWT no localStorage
- [ ] Redirecionar para dashboard se login bem-sucedido
- [ ] Mostrar mensagem de erro se falhar

### 2. API de Login (`POST /api/auth/login`)
- [ ] Receber email e senha
- [ ] Validar com loginSchema do Zod
- [ ] Buscar usuário no banco
- [ ] Comparar senha com hash bcrypt
- [ ] Gerar token JWT se correto
- [ ] Retornar erro 401 se inválido

### 3. API de Logout (`POST /api/auth/logout`)
- [ ] Invalidar token (ou apenas remover no cliente)
- [ ] Redirecionar para login
- [ ] Limpar localStorage

### 4. Dashboard Admin (`/admin/dashboard`)
- [ ] Criar layout básico
- [ ] Mostrar informações do usuário
- [ ] Links para gerenciar blog, excursões, pagamentos
- [ ] Proteger rota com middleware

### 5. Componentes Compartilhados
- [ ] Sidebar de navegação
- [ ] Header com dados do usuário
- [ ] Footer
- [ ] Layout admin reutilizável

---

## 📝 Tarefas Específicas (em ordem)

### Tarefa 1: Criar Página de Login

**Arquivo**: `app/admin/login/page.tsx`

```typescript
// Estrutura básica
export default function LoginPage() {
  // Estado para email e senha
  // Função handleSubmit que valida e envia para API
  // Formulário com inputs
  // Mensagens de erro
}
```

**O que fazer**:
1. Criar pasta `app/admin/login/`
2. Criar arquivo `page.tsx`
3. Adicionar form com email e senha
4. Validar com Zod
5. Enviar para API
6. Armazenar token
7. Redirecionar

### Tarefa 2: Criar Componente de Formulário

**Arquivo**: `components/admin/LoginForm.tsx`

```typescript
// Componente reutilizável de login
// Props: onSubmit, isLoading, error
// Deve validar dados localmente
```

### Tarefa 3: Criar API de Login

**Arquivo**: `app/api/auth/login/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // 1. Receber dados
  // 2. Validar com loginSchema
  // 3. Buscar usuário
  // 4. Comparar senha
  // 5. Gerar token
  // 6. Retornar token ou erro
}
```

### Tarefa 4: Criar Dashboard

**Arquivo**: `app/admin/dashboard/page.tsx`

```typescript
// Página protegida
// Mostrar informações do usuário
// Links para outras páginas
// Logout button
```

### Tarefa 5: Criar Layout Admin

**Arquivo**: `app/admin/layout.tsx`

```typescript
// Layout para todas as páginas /admin
// Sidebar navegação
// Header com usuário
// Middleware de proteção
```

---

## 🛠️ Tecnologias a Usar

- **next/router** - Para navegação
- **next/headers** - Para acessar headers no servidor
- **localStorage** - Para armazenar token no cliente
- **fetch** - Para fazer requisições à API
- **Zod** - Para validar dados (já configurado)
- **bcryptjs** - Para comparar senhas (já configurado)
- **JWT** - Para gerar tokens (já configurado)

---

## 📚 Documentação de Referência

Os arquivos abaixo já têm tudo configurado:

```typescript
// Validação
import { loginSchema } from '@/lib/validation'

// Autenticação
import { hashPassword, comparePassword, generateToken, verifyToken } from '@/lib/auth'

// Tipos
import { User, ApiResponse } from '@/lib/types'

// Utilitários
import { logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/utils'
import { ROUTES, API_ENDPOINTS, MESSAGES } from '@/lib/constants'
```

---

## 🔄 Fluxo de Autenticação Esperado

```
1. Usuário acessa /admin/login
   ↓
2. Preenche email e senha
   ↓
3. Clica em "Entrar"
   ↓
4. Página valida com Zod
   ↓
5. Envia POST /api/auth/login
   ↓
6. API valida, busca usuário, compara senha
   ↓
7. Se OK: gera JWT e retorna
   Se erro: retorna mensagem de erro
   ↓
8. Cliente armazena token em localStorage
   ↓
9. Redireciona para /admin/dashboard
   ↓
10. Middleware valida token
    ↓
11. Se válido: mostra dashboard
    Se inválido: redireciona para login
```

---

## 💡 Dicas Importantes

### Security
- ✅ Nunca armazene senha em texto plano
- ✅ Sempre use HTTPS em produção
- ✅ Valide dados no servidor, não apenas no cliente
- ✅ Use JWT com expiração (já configurado: 7 dias)

### Performance
- ✅ Use `isLoading` para evitar múltiplos submits
- ✅ Debounce validação se necessário
- ✅ Cache o token no estado da aplicação

### UX
- ✅ Mostre mensagens de erro claras
- ✅ Desabilite botão enquanto carrega
- ✅ Salve email no localStorage para próximo login (opcional)

---

## 📋 Checklist da Fase 2

- [ ] Página `/admin/login` criada
- [ ] Formulário de login com validação
- [ ] API `/api/auth/login` implementada
- [ ] Token armazenado no cliente
- [ ] Redirecionamento funcionando
- [ ] Dashboard `/admin/dashboard` criado
- [ ] Proteção de rota com middleware
- [ ] Layout admin completo
- [ ] Logout implementado
- [ ] Testes manuais feitos

---

## 🚦 Como Começar

1. **Antes de começar**, leia este arquivo completamente
2. **Crie uma branch**: `git checkout -b fase-2-autenticacao`
3. **Implemente a Tarefa 1** (Página de Login)
4. **Teste localmente**: `npm run dev`
5. **Implemente a Tarefa 2** (Formulário)
6. Continue com as demais tarefas em sequência

---

## 📞 Referências Úteis

Consulte estes arquivos conforme necessário:

- `lib/validation.ts` - Schemas Zod
- `lib/auth.ts` - Funções de autenticação
- `lib/types.ts` - Tipos TypeScript
- `lib/constants.ts` - Constantes e rotas
- `middleware.ts` - Proteção de rotas

---

## ✨ Resultado Final

Ao completar a Fase 2, você terá:

✅ Sistema de autenticação completo
✅ Proteção de rotas funcionando
✅ Dashboard admin responsivo
✅ Logout e sessões gerenciadas
✅ UI profissional e intuitiva
✅ Segurança implementada

---

**Próximo Passo**: Quando estiver pronto, comece a implementar a Fase 2!

**Boa sorte! 🚀**
