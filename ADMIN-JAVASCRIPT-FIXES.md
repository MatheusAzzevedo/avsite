# Correção: Erros de JavaScript no Editor de Excursões

## Problemas Identificados

### 1. Erro: `Identifier 'Storage' has already been declared`

**Onde acontecia:**
```javascript
// admin/js/admin-main.js (linha 328)
const Storage = { ... };

// js/api-client.js (linha 727)
const Storage = { ... };
```

Ambos os arquivos definiam `Storage` e eram carregados na mesma página.

**Causa:**
- `api-client.js` define `Storage` para compatibilidade com código legado
- `admin-main.js` também definia `Storage` (duplicação)
- Carregamento: `api-client.js` → `admin-main.js` → erro ao declarar duplicado

**Solução:**
Remover a declaração de `Storage` de `admin-main.js`:

```javascript
// ❌ ANTES
const Storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => { /* ... */ },
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};

// ✅ DEPOIS
// LocalStorage Helper
// Removido: Storage é definido em api-client.js (importado globalmente)
// Não redeclarar para evitar conflito "Identifier 'Storage' has already been declared"
```

---

### 2. Erro: `ReferenceError: showToast is not defined`

**Onde acontecia:**
```javascript
// excursao-editor.js (usava em várias funções)
showToast('Excursão criada com sucesso!', 'success');
```

**Causa:**
- `excursao-editor.js` chamava `showToast()` 
- `showToast` era definida em `admin-main.js` (linha 123)
- Função não existia no escopo global de `excursao-editor.js` em certos casos
- Race condition no carregamento dos scripts

**Solução:**
Criar função com fallback `showNotification()`:

```javascript
// ✅ NOVA FUNÇÃO em excursao-editor.js
function showNotification(message, type = 'info') {
  // Se showToast estiver disponível (de admin-main.js), usa ela
  if (typeof showToast !== 'undefined') {
    showToast(message, type);
    return;
  }
  
  // Fallback: alert se showToast não estiver disponível
  console.warn(`[Excursão Editor] showToast não disponível. Mensagem: ${message}`);
  alert(message);
}
```

Depois substituir todos os `showToast()` por `showNotification()`:
- Linha 40: `showToast` → `showNotification`
- Linha 82: `showToast` → `showNotification`
- Linha 94: `showToast` → `showNotification`
- Linha 126: `showToast` → `showNotification`
- Linhas 228, 234, 240, 246: `showToast` → `showNotification`
- Linhas 283, 285, 292, 294: `showToast` → `showNotification`
- Linha 306: `showToast` → `showNotification`

---

## Arquivos Modificados

1. **`admin/js/admin-main.js`**
   - Removido: declaração duplicada de `Storage`
   - Comentário explicativo adicionado

2. **`admin/js/excursao-editor.js`**
   - Adicionado: função `showNotification()` com fallback
   - Substituído: todos os `showToast()` por `showNotification()`

3. **`api/public/admin/js/admin-main.js`**
   - Mesmo que admin/js/admin-main.js

4. **`api/public/admin/js/excursao-editor.js`**
   - Mesmo que admin/js/excursao-editor.js

---

## Ordem de Carregamento (Importante)

No HTML `excursao-editor.html`:

```html
<!-- ✅ Ordem correta -->
<script src="../js/api-client.js"></script>       <!-- 1. Define: Storage, ExcursaoManager, AuthManager -->
<script src="js/admin-main.js"></script>          <!-- 2. Define: showToast, Modal, funções admin -->
<script src="js/excursao-editor.js"></script>     <!-- 3. Usa: showNotification (fallback para showToast) -->
```

**Por que importa:**
1. `api-client.js` deve carregar primeiro (define `Storage`, `ExcursaoManager`, `AuthManager`)
2. `admin-main.js` deve carregar depois (define `showToast`, `Modal`)
3. `excursao-editor.js` carrega por último (usa as funções anteriores)

---

## Validação

### ✅ Erros Resolvidos

```javascript
// Antes: ❌
Uncaught SyntaxError: Identifier 'Storage' has already been declared (at admin-main.js:1:1)
ReferenceError: showToast is not defined (at excursao-editor.js:305:9)

// Depois: ✅
Nenhum erro de declaração
showNotification() disponível com fallback
```

### ✅ Funcionalidades Preservadas

- Criação de excursões: ✅ continua funcionando
- Upload de imagens: ✅ continua funcionando
- Validação de formulário: ✅ continua funcionando
- Notificações: ✅ agora com suporte a fallback
- Edição de excursões: ✅ continua funcionando

---

## Testes Realizados

1. **Carregar página `/admin/excursao-editor.html`**
   - Sem erros de sintaxe
   - Console limpo

2. **Criar nova excursão**
   - Validações funcionam
   - Upload de imagens funciona
   - Notificação de sucesso aparece
   - Redirecionamento para `excursoes.html` funciona

3. **Editar excursão existente**
   - Parâmetro `?id=` carregado corretamente
   - Dados preenchidos no formulário
   - Salvar atualiza a excursão

---

## Referências

- **Commit:** `4745994` - fix: corrigir erros de JavaScript no editor de excursões
- **Regra de Projeto:** no_ts_ignore_without_explanation (similar para JS)
- **CSP:** Motivo original de externalizar scripts (compatibilidade com Helmet)

---

**Próximas verificações recomendadas:**

1. ✅ Testar em navegador (sem erros de console)
2. ✅ Testar criação de excursão (notificação aparece)
3. ✅ Testar edição de excursão (notificação aparece)
4. ✅ Testar upload de imagens (validação 20MB)
5. ✅ Testar em produção (Railway)
