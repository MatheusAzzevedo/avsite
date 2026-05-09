# Changelog

## 2026-05-09 - feat: melhorias nos cards de listagem de alunos e controle de vagas

### Arquivos Modificados
- `api/src/routes/lista-alunos.routes.ts` [Estatísticas de pagamento (PIX/Cartão) e capacidade]
- `api/public/admin/js/listas.js` [Interface com novas labels e exibição de ocupação]
- `.github/workflows/api-lint.yml` [Workflow de linter automático para API]
- `api/eslint.config.mjs` [Configuração do ESLint v10 (Flat Config) para a API]

Resumo: Atualização visual e lógica dos cards de listagem de alunos e implementação de Pipeline de CI para Linting da API. Introduzidas novas labels e estatísticas de pagamento nos cards administrativos. A nova GitHub Action garante que o código da API siga os padrões de linting (ESLint v10) em cada atualização.

### Detalhes das Alterações
- **CI/CD**: Implementada GitHub Action que roda `eslint` em cada push/pull request na pasta da API.
- **Novas Labels**: Cards renomeados para "Alunos Inscritos (PIX + Cartão de Crédito)", "Total de Pedidos", "Pagamentos PIX" e "Pagamentos Cartão de Crédito" para melhor clareza.
- **Divisão por Pagamento**: Implementada lógica no backend para separar inscritos por método de pagamento, facilitando a conciliação financeira rápida.
- **Exibição de Vagas**: Adicionado 5º item de estatística nos cards mostrando o preenchimento da excursão (ocupadas/capacidade) ou "Ilimitado".
- **Consistência de Dados**: O total de pedidos e alunos agora ignora automaticamente registros cancelados ou expirados em todo o painel de listas.

---

## 2026-05-07 - feat: sistema de limite de vagas (capacidade) em excursões

### Arquivos Modificados
- `api/prisma/schema.prisma` [Adicionado campo `vagas` opcional nos modelos `Excursao` e `ExcursaoPedagogica`]
- `api/src/routes/pedido.routes.ts` [Implementada lógica de validação de capacidade na criação de pedidos (bloqueia overbooking)]
- `api/public/admin/js/excursao-editor.js` [Interface administrativa para controle de capacidade]

---

## 2026-05-04 - feat: paginação e filtragem no servidor para excursões pedagógicas

### Arquivos Modificados
- `api/src/routes/excursao-pedagogica.routes.ts` [Implementada lógica de filtragem completa com Prisma; paginação no backend]
- `api/public/admin/js/excursoes-pedagogicas.js` [Refatoração para paginação e filtragem no servidor com debouncing]

---

## 2026-04-27 - feat: adicionar CPF e endereço do responsável na extração completa

### Arquivos Modificados
- `api/src/routes/lista-alunos.routes.ts` [Inclusão das colunas de CPF e Endereço do Responsável na rota de exportação]

---

## 2026-04-22 - feat: exportação de pedidos cancelados na lista de alunos

### Arquivos Modificados
- `api/src/routes/lista-alunos.routes.ts` [Nova rota para exportar pedidos filtrados por status CANCELADO]
- `api/public/admin/js/listas.js` [Função exportarCancelados e event listeners]
