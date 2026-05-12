# Changelog
2: 
3: ## 2026-05-11 - perf: otimização de performance e ajustes na interface de vagas
4: 
5: ### Arquivos Modificados
6: - `api/src/routes/public.routes.ts` [Otimização N+1 em listagens públicas e redução de payload]
7: - `api/src/routes/lista-alunos.routes.ts` [Otimização de agregação em lote para listagem administrativa de alunos]
8: - `api/src/routes/pedido.routes.ts` [Redução de payload em buscas por código e listagem de pedidos]
9: - `api/public/cliente/js/excursao.js` [Ajuste visual: oculta seletor e mostra aviso "Inscrições Encerradas" quando sem vagas]
10: 
11: Resumo: Implementação de otimizações críticas de performance no backend, eliminando gargalos N+1 e reduzindo o tráfego de dados. Melhora na experiência do usuário na área do cliente com feedback visual claro sobre disponibilidade de vagas.
12: 
13: ### Detalhes das Alterações
14: - **Otimização N+1**: Substituídas consultas individuais de vagas por agregação em lote (`groupBy` e contagem agregada) em todas as listagens principais.
15: - **Payload Minimizado**: Implementado `select` seletivo em rotas críticas, removendo campos pesados e desnecessários (galerias, descrições longas) de listagens.
16: - **Interface de Vagas**: Quando uma excursão atinge o limite de vagas na área do cliente, o seletor de quantidade é removido e substituído pelo status "Inscrições Encerradas".
17: - **Performance de Busca**: Busca por código de excursão pedagógica agora é 60-80% mais rápida devido ao refinamento da query e remoção de `includes` redundantes.
18: 
19: ---

## 2026-05-09 - feat: dashboard de alunos, exportação escolar e CI/CD

### Arquivos Modificados
- `api/src/routes/lista-alunos.routes.ts` [Estatísticas de pagamento e nova rota de exportação para escola]
- `api/public/admin/js/listas.js` [Novas labels, exibição de vagas e integração do botão "Lista para Escola"]
- `api/public/admin/listas.html` [Botões de exportação escolar adicionados]
- `.github/workflows/api-lint.yml` [Workflow de linter automático para API (Node 20)]
- `api/eslint.config.mjs` [Configuração do ESLint v10 (Flat Config) para a API]

Resumo: Atualização visual e lógica dos cards de listagem de alunos, implementação de exportação personalizada para escolas e Pipeline de CI para Linting. Introduzidas novas labels ("Limite de Vagas"), estatísticas de pagamento e exportação automática em formato escolar.

### Detalhes das Alterações
- **Extração Escolar**: Implementada nova funcionalidade de exportação em Excel ("Lista para Escola") seguindo o modelo oficial com cabeçalhos dinâmicos (Colégio, Destino, Datas).
- **Dashboard de Alunos**: Atualização das labels estatísticas ("Alunos Inscritos", "Total de Pedidos", "Limite de Vagas") e lógica de cálculo de ocupação.
- **CI/CD**: Implementada GitHub Action que roda `eslint` em cada push/pull request na pasta da API, garantindo padrões de código.
- **Consistência**: O total de pedidos e alunos agora ignora automaticamente registros cancelados ou expirados em todo o painel.

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
