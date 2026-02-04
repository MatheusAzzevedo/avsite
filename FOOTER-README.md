# Rodapé (Footer) - Avoar Turismo

## Visão Geral

O rodapé é um **componente único** reaproveitado em todas as páginas. Uma única fonte de verdade em `includes/footer.html` e `api/public/includes/footer.html` é injetada em todas as páginas via script de build.

## Estrutura

### Componente (fonte única)

1. **includes/footer.html** - Footer para páginas raiz (links relativos: index-10.html, about.html, etc.)
2. **api/public/includes/footer.html** - Footer para api/public (URLs amigáveis: /, /biologia-marinha, etc.)

### CSS

- `css/footer.css` e `api/public/css/footer.css` - Estilos do rodapé

### Script de Build

- `scripts/inject-footer.js` - Substitui `<!-- FOOTER_COMPONENT -->` pelo conteúdo do componente em cada página

### Componentes do Rodapé

O rodapé contém 4 seções:

1. **Brand**
   - Logo da Avoar
   - Nome: "Avoar Turismo Pedagógico e Viagens"
   - Descrição breve da empresa

2. **Informações**
   - CNPJ: 479.278.290/0001-06
   - Endereço completo
   - Telefone/WhatsApp com link clicável

3. **Navegação**
   - Links para todas as páginas principais
   - Início, Biologia Marinha, Excursões, Sobre Nós, Blog, Contato

4. **Copyright**
   - Símbolo © + Avoar Turismo - All rights reserved
   - Crédito: "Criado por Matheus Azevedo" com link para WhatsApp

## Como Funciona

### Build

1. Cada página tem o placeholder `<!-- FOOTER_COMPONENT -->` onde o footer deve aparecer
2. Execute `npm run build:footer` (na raiz) ou `npm run build:footer` (na pasta api)
3. O script lê o componente e substitui o placeholder em todas as páginas
4. As páginas geradas funcionam com `file://` e em produção

### Alterar o Footer

1. Edite `includes/footer.html` (páginas raiz) ou `api/public/includes/footer.html` (api/public)
2. Execute `npm run build:footer` na raiz do projeto

### Integração em Páginas Novas

1. Adicione `<!-- FOOTER_COMPONENT -->` onde o footer deve aparecer (dentro do `.site-container`)
2. Adicione o caminho da página em `scripts/inject-footer.js` (PAGES_ROOT ou PAGES_API)
3. Execute `npm run build:footer`

## Design

### Características

- **Layout responsivo**: 4 colunas → 1 coluna em mobile
- **Cores**: Tema escuro (#1a1a1a) com destaque em laranja (#ff5c00)
- **Tipografia**: Utiliza as mesmas fontes do site (Gotham, Telegraf)
- **Breakpoints**:
  - Desktop: 4 colunas (280px mínimo)
  - Tablet (≤768px): 1 coluna
  - Mobile (≤480px): Texto menor e espaçamento reduzido

### Elementos Interativos

- Links mudam para laranja ao passar mouse
- WhatsApp links abrem em nova aba
- Suporte completo a acessibilidade

## Páginas com Footer Instalado

✅ Todas as páginas públicas:
- index-10.html (Página Inicial)
- index-11.html (Biologia Marinha)
- about.html (Sobre Nós)
- blog.html (Blog)
- blog-single.html (Post Individual)
- portfolio.html (Excursões)
- portfolio-single.html (Excursão Individual)
- contact.html (Contato)

✅ Versões em api/public/:
- Todas as acima com URLs amigáveis

## Personalização

Para modificar o rodapé:

### Editar Informações
Edite `includes/footer.html` ou `api/public/includes/footer.html`

### Editar Estilos
Modifique `css/footer.css`

### Mudança Estrutural
Se alterar a estrutura HTML, atualize também `js/load-footer.js`

## Notas

- O footer **NÃO** aparece em páginas do admin (/admin/), apenas em páginas públicas
- Para alterar o footer, é necessário editar o HTML em cada página (ou usar find/replace)
- Páginas na raiz usam links relativos (index-10.html, about.html, etc.)
- Páginas em api/public usam URLs amigáveis (/, /biologia-marinha, /excursoes, etc.)

---

**Data de Criação**: 2026-02-04
**Desenvolvedor**: Matheus Azevedo
