# Explicação Técnica - Sistema Administrativo Avorar

Documentação detalhada de todas as funções, arquivos e estruturas criadas no sistema administrativo.

---

## 📁 Explicação dos Arquivos

### **Explicação do Arquivo [admin-style.css]**

Arquivo CSS principal que contém todos os estilos do sistema administrativo. Utiliza CSS Variables para permitir customização fácil de cores e temas. Implementa um design system completo com:

- **CSS Variables**: Definição de paleta de cores, sombras, bordas e transições reutilizáveis
- **Reset e Base**: Normalização de estilos e definições base para todo o sistema
- **Componentes**: Estilos para cards, tabelas, formulários, badges, modais
- **Layout**: Sistema de grid responsivo com sidebar fixa e conteúdo principal
- **Utilitários**: Classes helper para espaçamento, alinhamento e display
- **Responsividade**: Media queries para tablet e mobile com breakpoint em 768px
- **Animações**: Transições suaves e keyframes para slideUp, fadeIn, spin

O arquivo está organizado em seções comentadas para facilitar manutenção e localização de estilos específicos.

---

### **Explicação do Arquivo [admin-main.js]**

Script JavaScript principal que gerencia toda a lógica do sistema administrativo. Contém funções utilitárias e classes reutilizáveis:

**Principais funcionalidades:**
- **Gerenciamento de Sidebar**: Controle de abertura/fechamento em mobile
- **Sistema de Modais**: Classe Modal para criar e gerenciar popups
- **Preview de Imagens**: Conversão de files para base64 e exibição
- **Validação de Formulários**: Verificação de campos obrigatórios
- **Notificações Toast**: Sistema de alertas com auto-dismiss
- **Editor de Texto Rico**: Classe RichTextEditor usando contentEditable
- **LocalStorage Helper**: Funções para salvar/recuperar dados
- **Autenticação**: Verificação de login em todas as páginas
- **Busca e Filtros**: Funções para filtrar tabelas em tempo real

O arquivo exporta todas as funções para o escopo global (window) permitindo uso direto no HTML.

---

### **Explicação do Arquivo [login.html]**

Página de autenticação do sistema administrativo. Design moderno com gradiente roxo e animação de entrada.

**Estrutura:**
- Container centralizado com animação slideUp
- Formulário com campos de email e senha
- Checkbox "lembrar-me"
- Validação inline no submit
- Redirecionamento automático após login

**Funcionalidade:**
A autenticação é simulada usando localStorage. Qualquer combinação válida de email/senha permite acesso. Os dados são salvos como `isAuthenticated`, `userEmail` e `userName`. Em produção, isso seria substituído por autenticação JWT com backend.

**Design:**
Utiliza gradiente linear de #667eea para #764ba2 no background, criando um visual moderno e profissional.

---

### **Explicação do Arquivo [dashboard.html]**

Painel principal do sistema que exibe visão geral de todas as atividades.

**Componentes:**
1. **Stats Grid**: 4 cards coloridos mostrando métricas (posts, excursões, reservas, visitantes)
2. **Atividades Recentes**: Tabela com últimas ações no sistema
3. **Excursões Populares**: Cards com barras de progresso indicando visualizações

**Layout:**
- Sidebar fixa à esquerda (280px)
- Top bar com título e menu de usuário
- Grid responsivo de estatísticas
- Tabela de dados com hover effects

Cada stat-card usa gradiente diferente para criar identidade visual única.

---

### **Explicação do Arquivo [blog.html]**

Página de gerenciamento de posts do blog com listagem, busca e filtros.

**Funcionalidades:**
- **Busca em tempo real**: Input que filtra posts enquanto digita
- **Filtro por status**: Select para filtrar publicados/rascunhos
- **Tabela responsiva**: Exibe título, autor, data, status e ações
- **Ações por post**: Botões de editar e excluir com confirmação

**Estrutura de dados:**
Cada post na tabela contém:
- Título e descrição curta
- Autor e data de publicação
- Badge de status (publicado/rascunho)
- Botões de ação (editar/excluir)

A busca funciona percorrendo todas as `<tr>` e comparando o textContent com o termo digitado.

---

### **Explicação do Arquivo [blog-editor.html]**

Editor completo para criação e edição de posts com canvas de escrita rica.

**Campos do formulário:**
- Título, autor, data de publicação
- Categoria e status (rascunho/publicado)
- Upload de imagem de capa com preview
- Resumo opcional (textarea)
- Editor de texto rico (contentEditable)
- Tags separadas por vírgula

**Editor Rico:**
Toolbar com botões para:
- Formatação: negrito, itálico, sublinhado
- Alinhamento: esquerda, centro, direita, justificado
- Listas: ordenadas e não ordenadas
- Links e remoção de formatação
- Títulos H1-H4

O conteúdo é salvo como HTML usando `innerHTML` do elemento contentEditable.

---

### **Explicação do Arquivo [excursoes.html]**

Gerenciamento de excursões com visualização em cards visuais.

**Layout em Cards:**
Cada excursão é exibida como card contendo:
- Imagem de capa (200px altura)
- Título e badge de status
- Descrição curta
- Tags de categoria
- Preço destacado
- Botões de editar e excluir

**Filtros:**
- Input de busca por nome
- Select de categoria (natureza, cultura, aventura, marítimo)
- Select de status (ativo/inativo)

**Modal de Nova Excursão:**
Popup para criar excursão básica que redireciona para o editor completo.

---

### **Explicação do Arquivo [excursao-editor.html]**

Editor completo e detalhado para criar/editar excursões.

**Seções organizadas:**

1. **Informações Básicas**: Título, subtítulo, preço, duração, categoria, status
2. **Imagens**: 
   - Imagem de capa (para listagem)
   - Imagem principal (para página detalhada)
   - Galeria (múltiplas imagens)
3. **Descrição Completa**: Editor de texto rico para conteúdo da página
4. **Informações Adicionais**: Inclusos, recomendações, local, horário, tags

**Upload de Múltiplas Imagens:**
A galeria permite selecionar múltiplos arquivos que são exibidos em grid com botão de remover individual.

**Validação:**
Campos obrigatórios são validados antes do submit. O formulário pode ser salvo como rascunho sem validação completa.

---

### **Explicação do Arquivo [checkout.html]**

Página de finalização de compra com múltiplos métodos de pagamento.

**Layout em Duas Colunas:**
1. **Coluna Esquerda**: Formulários de checkout
2. **Coluna Direita**: Resumo do pedido (sticky)

**Métodos de Pagamento:**

1. **Cartão de Crédito**:
   - Número, nome, validade, CVV
   - Seletor de parcelamento (1-6x)
   - Máscaras automáticas

2. **PIX**:
   - Exibição de QR Code simulado
   - Botão copiar código PIX
   - Instruções de uso

3. **Boleto**:
   - Informações sobre geração
   - Prazo de vencimento (3 dias)

**Resumo do Pedido:**
- Imagem do produto
- Detalhes (quantidade, preço)
- Cálculo: subtotal + taxa - desconto = total
- Botão de finalizar pagamento
- Selo de segurança

**Máscaras JavaScript:**
Aplicadas automaticamente nos campos de CPF, telefone, cartão e validade.

---

### **Explicação do Arquivo [config-pagamento.html]**

Configuração de APIs de pagamento com suporte a 4 gateways.

**Gateways Suportados:**

1. **Stripe** (Internacional):
   - Publishable Key, Secret Key
   - Webhook Secret
   - Modo teste

2. **Mercado Pago** (Brasil):
   - Public Key, Access Token
   - Sandbox mode
   - Parcelamento e taxa de juros

3. **PagSeguro** (Brasil):
   - Email da conta
   - Token de segurança
   - Ambiente de teste

4. **PayPal** (Internacional):
   - Client ID, Client Secret
   - Modo sandbox/live

**Seleção Visual:**
Cards clicáveis que destacam o gateway ativo e mostram formulário correspondente.

**URLs de Webhook:**
Campos read-only com URLs para configurar nos painéis dos gateways. Botões para copiar URLs facilmente.

**Histórico de Transações:**
Tabela mostrando últimas transações com ID, cliente, valor, método, status e data.

**Teste de Conexão:**
Botão que simula teste de conectividade com o gateway selecionado.

---

## 🔧 Explicação das Funções

### **Explicação da Função [initSidebar]**

Inicializa o comportamento da sidebar responsiva. Em dispositivos mobile (≤768px), adiciona evento de clique no botão toggle para mostrar/ocultar o menu lateral. Também implementa fechamento automático ao clicar fora da sidebar.

```javascript
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    // Toggle ao clicar no botão
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !toggleBtn?.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}
```

---

### **Explicação da Função [Modal]**

Classe para gerenciar modais (popups) do sistema. Fornece métodos `open()` e `close()` para controlar visibilidade. Automaticamente adiciona listeners para fechar ao clicar no X ou fora do modal.

```javascript
class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.overlay = this.modal?.closest('.modal-overlay');
        this.init();
    }
    
    open() {
        this.overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
}
```

**Uso:** `const modal = new Modal('meuModal'); modal.open();`

---

### **Explicação da Função [previewImage]**

Função para exibir preview de imagem antes do upload. Utiliza FileReader API para converter o arquivo em base64 e exibir em elemento `<img>`.

```javascript
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}
```

**Parâmetros:**
- `input`: Elemento input[type="file"]
- `previewId`: ID do elemento img para exibir preview

---

### **Explicação da Função [validateForm]**

Valida se todos os campos obrigatórios de um formulário estão preenchidos. Aplica borda vermelha nos campos vazios e retorna boolean.

```javascript
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger-color)';
            isValid = false;
        } else {
            input.style.borderColor = 'var(--light-border)';
        }
    });
    
    return isValid;
}
```

**Retorna:** `true` se válido, `false` se houver campos vazios

---

### **Explicação da Função [showToast]**

Exibe notificação temporária (toast) na parte superior direita da tela. Auto-remove após 3 segundos com animação.

```javascript
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    // Aplica estilos e cores baseado no tipo
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
```

**Parâmetros:**
- `message`: Texto da notificação
- `type`: 'success', 'error', 'warning', 'info'

---

### **Explicação da Função [confirmDelete]**

Exibe diálogo de confirmação antes de executar exclusão. Usa `confirm()` nativo do browser e executa callback apenas se confirmado.

```javascript
function confirmDelete(itemName, callback) {
    if (confirm(`Tem certeza que deseja excluir "${itemName}"?`)) {
        callback();
    }
}
```

**Uso:** `confirmDelete('Post XYZ', () => { /* lógica de exclusão */ })`

---

### **Explicação da Função [searchTable]**

Implementa busca em tempo real em tabelas. Filtra linhas baseado no texto digitado, comparando com todo o conteúdo da linha.

```javascript
function searchTable(searchInputId, tableId) {
    const input = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);
    
    input.addEventListener('keyup', function() {
        const filter = this.value.toLowerCase();
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    });
}
```

---

### **Explicação da Função [filterTable]**

Filtra tabela baseado em select dropdown. Compara valor selecionado com conteúdo de coluna específica.

```javascript
function filterTable(selectId, tableId, columnIndex) {
    const select = document.getElementById(selectId);
    const table = document.getElementById(tableId);
    
    select.addEventListener('change', function() {
        const filter = this.value.toLowerCase();
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            if (filter === 'todos') {
                row.style.display = '';
            } else {
                const cell = row.getElementsByTagName('td')[columnIndex];
                const text = cell.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            }
        });
    });
}
```

**Parâmetros:**
- `selectId`: ID do select de filtro
- `tableId`: ID da tabela
- `columnIndex`: Índice da coluna a filtrar (0-based)

---

### **Explicação da Função [RichTextEditor]**

Classe que cria editor de texto rico usando contentEditable. Fornece métodos para formatar texto e manipular conteúdo.

```javascript
class RichTextEditor {
    constructor(elementId) {
        this.editor = document.getElementById(elementId);
        this.init();
    }
    
    execCommand(command, value = null) {
        document.execCommand(command, false, value);
        this.editor.focus();
    }
    
    getContent() {
        return this.editor.innerHTML;
    }
    
    setContent(html) {
        this.editor.innerHTML = html;
    }
}
```

**Métodos:**
- `execCommand(command)`: Executa comando de formatação (bold, italic, etc)
- `getContent()`: Retorna HTML do conteúdo
- `setContent(html)`: Define conteúdo do editor

---

### **Explicação da Função [Storage]**

Objeto utilitário para gerenciar localStorage de forma simplificada com serialização automática.

```javascript
const Storage = {
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    get: (key) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    
    remove: (key) => {
        localStorage.removeItem(key);
    },
    
    clear: () => {
        localStorage.clear();
    }
};
```

**Uso:** `Storage.set('user', {name: 'João'}); Storage.get('user');`

---

### **Explicação da Função [checkAuth]**

Verifica se usuário está autenticado antes de permitir acesso às páginas. Redireciona para login se não autenticado.

```javascript
function checkAuth() {
    const isAuthenticated = Storage.get('isAuthenticated');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!isAuthenticated && currentPage !== 'login.html') {
        window.location.href = 'login.html';
    }
}
```

Executada automaticamente no `DOMContentLoaded` de todas as páginas exceto login.

---

### **Explicação da Função [logout]**

Realiza logout do sistema limpando dados do localStorage e redirecionando para login.

```javascript
function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}
```

---

### **Explicação da Função [formatText]**

Aplica formatação de texto no editor rico usando document.execCommand.

```javascript
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('postContent').focus();
}
```

**Comandos suportados:**
- `bold`, `italic`, `underline`
- `justifyLeft`, `justifyCenter`, `justifyRight`, `justifyFull`
- `insertUnorderedList`, `insertOrderedList`
- `removeFormat`

---

### **Explicação da Função [formatHeading]**

Aplica estilo de título (H1-H4) ou parágrafo no texto selecionado do editor.

```javascript
function formatHeading(tag) {
    if (tag) {
        document.execCommand('formatBlock', false, tag);
    } else {
        document.execCommand('formatBlock', false, 'p');
    }
    document.getElementById('postContent').focus();
}
```

---

### **Explicação da Função [selectPaymentMethod]**

Gerencia seleção de método de pagamento no checkout. Atualiza visual dos cards e exibe formulário correspondente.

```javascript
function selectPaymentMethod(method) {
    selectedPayment = method;
    
    // Remove seleção anterior
    document.querySelectorAll('.payment-method').forEach(el => {
        el.style.borderColor = 'var(--light-border)';
    });
    
    // Marca selecionado
    event.currentTarget.style.borderColor = 'var(--primary-color)';
    
    // Exibe formulário correspondente
    document.getElementById(`${method}Form`).style.display = 'block';
}
```

---

### **Explicação da Função [selectGateway]**

Gerencia seleção de gateway de pagamento na página de configuração. Atualiza visual e exibe configurações específicas.

```javascript
function selectGateway(gateway) {
    currentGateway = gateway;
    
    // Atualiza visual dos cards
    // Oculta todos os forms de config
    document.querySelectorAll('[id^="config-"]').forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostra form correspondente
    document.getElementById(`config-${gateway}`).style.display = 'block';
}
```

---

## 🎯 Resumo de Integração

Todas as páginas compartilham:
- **CSS comum**: `admin-style.css`
- **JS comum**: `admin-main.js`
- **Font Awesome**: Ícones via CDN
- **Estrutura HTML**: Sidebar + Main Content
- **Autenticação**: Verificação via localStorage

O sistema está pronto para:
1. Validação de design e UX
2. Testes de responsividade
3. Demonstração de fluxos de trabalho
4. Posterior integração com backend

---

**Documentação completa do Sistema Administrativo Avorar**  
Versão Protótipo - Janeiro 2026
