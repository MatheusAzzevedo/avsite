# Sistema Administrativo Avorar

Sistema de gestão completo em HTML, CSS e JavaScript puro para gerenciamento do site Avorar Turismo.

## 📁 Estrutura de Arquivos

```
admin/
├── css/
│   └── admin-style.css        # Estilos completos do sistema
├── js/
│   └── admin-main.js          # Funções JavaScript principais
├── login.html                 # Página de login
├── dashboard.html             # Dashboard principal
├── blog.html                  # Gerenciamento de posts
├── blog-editor.html           # Editor de posts com canvas
├── excursoes.html             # Gerenciamento de excursões
├── excursao-editor.html       # Editor detalhado de excursões
├── checkout.html              # Página de checkout
├── config-pagamento.html      # Configuração de APIs de pagamento
└── README.md                  # Esta documentação
```

## 🚀 Funcionalidades Implementadas

### 1. Sistema de Login
- Autenticação com e-mail e senha
- Validação de campos
- Redirecionamento automático
- Design moderno com gradiente

### 2. Dashboard
- Estatísticas em cards coloridos (posts, excursões, reservas, visitantes)
- Tabela de atividades recentes
- Excursões mais procuradas com gráficos visuais
- Menu lateral responsivo

### 3. Gerenciamento de Blog
- **Listagem de Posts**: Visualização em tabela com busca e filtros
- **Editor de Posts**: 
  - Campos: título, autor, data, categoria, status
  - Upload de imagem de capa com preview
  - Editor de texto rico (negrito, itálico, alinhamento, listas, links)
  - Campo de resumo
  - Tags
  - Salvar como rascunho ou publicar
- **Ações**: Editar e excluir posts com confirmação

### 4. Gerenciamento de Excursões
- **Listagem em Cards**: Visual atrativo com imagens, preços e categorias
- **Filtros**: Busca, categoria e status
- **Editor Completo**:
  - Informações básicas (título, subtítulo, preço, duração)
  - Três tipos de imagens (capa, principal, galeria)
  - Editor de texto rico para descrição detalhada
  - Informações adicionais (inclusos, recomendações, local, horário)
  - Sistema de tags
  - Controle de status (ativo/inativo)

### 5. Checkout de Pagamento
- Layout em duas colunas (formulário + resumo)
- Formulário de dados pessoais
- Três métodos de pagamento:
  - **Cartão de Crédito**: Com parcelamento
  - **PIX**: QR Code e código copiável
  - **Boleto**: Geração após confirmação
- Resumo do pedido com cálculo de valores
- Máscaras automáticas para CPF, telefone e cartão
- Validação de termos e condições

### 6. Configuração de Pagamento
- **4 Gateways Suportados**:
  - Stripe (internacional)
  - Mercado Pago (Brasil - PIX, boleto, cartão)
  - PagSeguro (Brasil)
  - PayPal (internacional)
- Configuração específica para cada gateway
- Modo teste/sandbox
- URLs de webhook configuráveis
- Histórico de transações
- Teste de conexão

## 🎨 Design e Responsividade

### Design System
- **Cores Primárias**: Sistema de variáveis CSS customizável
- **Typography**: Fontes do sistema (San Francisco, Segoe UI, Roboto)
- **Espaçamento**: Grid system e utilitários
- **Componentes**: Cards, badges, tabelas, modais, forms

### Responsividade
- **Desktop**: Layout completo com sidebar fixa
- **Tablet**: Sidebar colapsável
- **Mobile**: Menu hambúrguer, cards empilhados, formulários em coluna única

## 🔧 Recursos Técnicos

### JavaScript
- Sistema de autenticação com localStorage
- Validação de formulários
- Gerenciamento de modais
- Preview de imagens
- Editor de texto rico (contentEditable)
- Sistema de notificações (toasts)
- Busca e filtros em tempo real
- Máscaras de input

### CSS
- CSS Variables para temas
- Flexbox e Grid Layout
- Animações e transições suaves
- Design responsivo (mobile-first)
- Utilitários e helpers

## 📱 Navegação

```
Login → Dashboard
         ├── Blog → Editor de Post
         ├── Excursões → Editor de Excursão
         ├── Checkout
         └── Config. Pagamento
```

## 🔐 Autenticação

O sistema utiliza localStorage para simular autenticação:
- **Email**: Qualquer email válido
- **Senha**: Qualquer senha
- Dados salvos: `isAuthenticated`, `userEmail`, `userName`

## 💾 Armazenamento Local

Todos os dados são simulados com localStorage para demonstração:
- Posts do blog
- Excursões
- Configurações de pagamento
- Estado de autenticação

## 🎯 Próximos Passos (Integração Backend)

Para transformar em sistema funcional:
1. Conectar com API REST
2. Implementar autenticação JWT
3. Upload real de imagens
4. Integração com gateways de pagamento
5. Banco de dados para persistência
6. Sistema de permissões

## 📝 Notas de Uso

### Login
Acesse `login.html` e use qualquer email/senha para entrar no sistema.

### Navegação
Use o menu lateral para navegar entre as páginas. Em mobile, clique no ícone de menu.

### Editor de Texto
No editor de posts/excursões, use a barra de ferramentas para formatar o texto.

### Upload de Imagens
Clique nas áreas de upload para selecionar imagens do seu computador.

### Modais
Clique fora do modal ou no botão X para fechar.

## 🔍 Bibliotecas Externas

- **Font Awesome 6.4.0**: Ícones (CDN)
- Apenas CSS e JavaScript puro, sem frameworks

## 📐 Especificações Técnicas

- HTML5 semântico
- CSS3 com features modernas
- JavaScript ES6+
- Mobile-first responsive design
- Cross-browser compatible

## 🎨 Paleta de Cores

- **Primary**: #2563eb (Azul)
- **Success**: #10b981 (Verde)
- **Danger**: #ef4444 (Vermelho)
- **Warning**: #f59e0b (Laranja)
- **Info**: #06b6d4 (Ciano)
- **Dark**: #0f172a
- **Light**: #f8fafc

## 📄 Licença

Sistema desenvolvido para Avorar Turismo - 2026
