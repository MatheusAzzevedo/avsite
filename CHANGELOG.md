# Changelog

## 2026-05-09 - feat: melhorias nos cards de listagem de alunos e controle de vagas

### Arquivos Modificados
- `api/src/routes/lista-alunos.routes.ts` [Atualizada rota de listagem para incluir estatísticas de pagamento (PIX/Cartão) e capacidade (vagas)]
- `api/public/admin/js/listas.js` [Interface atualizada com novas labels e exibição de vagas ocupadas/totais nos cards]

### Detalhes das Alterações
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
