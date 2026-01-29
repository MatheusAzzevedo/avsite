# Guia Rápido de Início - Sistema Administrativo Avorar

## 🚀 Começando em 3 Passos

### Passo 1: Abrir o Sistema
```
1. Navegue até a pasta: avsite-main/admin/
2. Abra o arquivo: login.html
3. Use qualquer navegador moderno (Chrome, Firefox, Edge)
```

### Passo 2: Fazer Login
```
Email: qualquer@email.com
Senha: qualquersenha
```
✅ O sistema aceita qualquer combinação válida para demonstração

### Passo 3: Explorar
```
Navegue pelo menu lateral:
├── Dashboard (visão geral)
├── Blog (criar/editar posts)
├── Excursões (gerenciar passeios)
├── Checkout (testar pagamento)
└── Config. Pagamento (configurar APIs)
```

---

## 📱 Acessando Páginas Diretamente

Você pode abrir qualquer página diretamente no navegador:

```
admin/login.html           → Login
admin/dashboard.html       → Dashboard
admin/blog.html            → Lista de Posts
admin/blog-editor.html     → Criar/Editar Post
admin/excursoes.html       → Lista de Excursões
admin/excursao-editor.html → Criar/Editar Excursão
admin/checkout.html        → Checkout
admin/config-pagamento.html → Config. Pagamento
```

**Nota:** Todas as páginas (exceto login) redirecionam para login se não autenticado.

---

## 🎨 Testando Funcionalidades

### ✍️ Criar um Post
1. Dashboard → Blog → Novo Post
2. Preencha título, autor, categoria
3. Faça upload de uma imagem
4. Use o editor para escrever conteúdo
5. Clique em "Publicar Post"

### 🏖️ Criar uma Excursão
1. Dashboard → Excursões → Nova Excursão
2. Preencha informações básicas no modal
3. Na página do editor, adicione:
   - Imagens (capa, principal, galeria)
   - Descrição detalhada
   - Inclusos e recomendações
4. Clique em "Salvar Excursão"

### 💳 Testar Checkout
1. Dashboard → Checkout
2. Preencha dados pessoais
3. Selecione método de pagamento:
   - **Cartão**: Preencha dados e parcelas
   - **PIX**: Clique em "Copiar Código"
   - **Boleto**: Apenas confirme
4. Aceite os termos
5. Clique em "Finalizar Pagamento"

### ⚙️ Configurar Gateway
1. Dashboard → Config. Pagamento
2. Clique em um dos gateways:
   - Stripe
   - Mercado Pago ⭐ (ativo)
   - PagSeguro
   - PayPal
3. Preencha as credenciais
4. Ative modo teste se necessário
5. Clique em "Salvar Configurações"

---

## 📋 Atalhos de Teclado (Editor)

```
Ctrl+B  → Negrito
Ctrl+I  → Itálico
Ctrl+U  → Sublinhado
Ctrl+K  → Inserir Link
```

---

## 🔍 Buscar e Filtrar

### No Blog
```
1. Digite no campo de busca → Filtra em tempo real
2. Selecione status (Todos/Publicado/Rascunho)
```

### Nas Excursões
```
1. Digite no campo de busca → Busca por nome
2. Filtre por categoria (Natureza/Cultura/Aventura/Marítimo)
3. Filtre por status (Ativo/Inativo)
```

---

## 💾 Dados Salvos

O sistema usa **localStorage** para simulação:
- Estado de login
- Dados do usuário
- Configurações (em desenvolvimento futuro)

Para "resetar" o sistema:
```javascript
// Abra o Console do navegador (F12) e digite:
localStorage.clear();
location.reload();
```

---

## 📱 Testando Responsividade

### Modo Desktop
- Abra normalmente no navegador
- Sidebar sempre visível à esquerda

### Modo Mobile
- Pressione F12 → Toggle Device Toolbar
- Ou redimensione a janela para < 768px
- Clique no ícone ☰ (hambúrguer) para abrir menu

---

## 🎯 Recursos Visuais

### Cards de Estatísticas (Dashboard)
- 4 cores diferentes por tipo de dado
- Animação ao carregar
- Valores atualizados

### Tabelas
- Hover para destacar linha
- Busca em tempo real
- Botões de ação por item

### Editor de Texto
- Toolbar completa
- Formatação visual
- Preview em tempo real

### Upload de Imagens
- Área drag & drop visual
- Preview imediato
- Suporte múltiplo (galeria)

---

## ⚠️ Limitações Atuais (Protótipo)

❌ Sem persistência real (dados não salvam no servidor)  
❌ Upload de imagens não envia arquivos  
❌ Gateways de pagamento não processam transações reais  
❌ Sem autenticação real (qualquer email/senha funciona)  

✅ Todos os fluxos e designs estão funcionais  
✅ Validações de formulário implementadas  
✅ Navegação completa entre páginas  
✅ Responsividade testada  

---

## 🔧 Personalizando Cores

Edite o arquivo `admin/css/admin-style.css`:

```css
:root {
    --primary-color: #2563eb;      /* Azul principal */
    --success-color: #10b981;      /* Verde sucesso */
    --danger-color: #ef4444;       /* Vermelho erro */
    --warning-color: #f59e0b;      /* Laranja aviso */
    --info-color: #06b6d4;         /* Ciano info */
}
```

Salve e recarregue a página para ver as mudanças.

---

## 📞 Próximos Passos

### Para Desenvolvedores
1. Integrar com API REST
2. Implementar upload real de arquivos
3. Conectar com banco de dados
4. Adicionar autenticação JWT
5. Integrar gateways de pagamento reais

### Para Designers
1. Ajustar cores e tipografia
2. Adicionar mais animações
3. Melhorar feedback visual
4. Otimizar para acessibilidade

### Para Gestores
1. Validar fluxos de trabalho
2. Testar usabilidade
3. Sugerir melhorias
4. Definir próximas funcionalidades

---

## 🆘 Resolução de Problemas

### "Não consigo fazer login"
- Use QUALQUER email e senha válidos
- Exemplo: `admin@test.com` / `123456`

### "Página redireciona para login"
- Isso é normal se não estiver logado
- Faça login primeiro em `login.html`

### "Imagens não aparecem"
- Verifique se as imagens estão na pasta correta
- Caminhos relativos: `../images/...`

### "Botões não funcionam"
- Verifique se o JavaScript está habilitado
- Abra Console (F12) para ver erros

### "Layout quebrado no mobile"
- Teste com largura < 768px
- Use F12 → Device Toolbar

---

## 📚 Documentação Completa

Para mais detalhes técnicos:
- `README.md` → Visão geral do sistema
- `EXPLICACAO-TECNICA.md` → Detalhes de funções e arquivos
- Comentários no código fonte

---

## ✅ Checklist de Validação

Use esta lista para testar todas as funcionalidades:

**Login**
- [ ] Login com email/senha
- [ ] Lembrar-me funciona
- [ ] Redireciona para dashboard

**Dashboard**
- [ ] Cards de estatísticas aparecem
- [ ] Tabela de atividades carrega
- [ ] Menu lateral funciona

**Blog**
- [ ] Listar posts
- [ ] Buscar posts
- [ ] Filtrar por status
- [ ] Criar novo post
- [ ] Editar post existente
- [ ] Excluir post (com confirmação)
- [ ] Upload de imagem com preview
- [ ] Editor de texto funciona

**Excursões**
- [ ] Listar em cards
- [ ] Buscar excursões
- [ ] Filtrar por categoria e status
- [ ] Criar nova excursão
- [ ] Editar excursão
- [ ] Excluir excursão
- [ ] Upload múltiplo de imagens

**Checkout**
- [ ] Formulário de dados pessoais
- [ ] Selecionar cartão de crédito
- [ ] Selecionar PIX
- [ ] Selecionar boleto
- [ ] Resumo do pedido correto
- [ ] Máscaras nos inputs
- [ ] Validação de termos

**Config. Pagamento**
- [ ] Selecionar gateway
- [ ] Preencher credenciais
- [ ] Testar conexão
- [ ] Copiar URLs de webhook
- [ ] Ver histórico de transações

**Responsividade**
- [ ] Desktop (> 1024px)
- [ ] Tablet (768px - 1024px)
- [ ] Mobile (< 768px)
- [ ] Menu hambúrguer mobile

---

**Sistema pronto para validação!** 🎉

Para suporte ou dúvidas, consulte a documentação completa no README.md
