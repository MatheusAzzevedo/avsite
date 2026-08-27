# Changelog

## 2026-08-26 - feat: implementar o envio do formulário de contato do site

### Arquivos Modificados
- `api/src/routes/contato.routes.ts` [Novo: recebe a mensagem e encaminha por e-mail]
- `api/src/schemas/contato.schema.ts` [Novo: validação Zod dos campos]
- `api/src/templates/email-contato.ts` [Novo: template HTML e texto da mensagem]
- `api/public/js/contato-form.js` [Novo: envio por fetch com feedback na página]
- `api/public/contact.html` [Removido `action="#"`; script do formulário carregado]
- `api/src/server.ts` e `api/.env.example` [Rota registrada e `CONTATO_EMAIL_DESTINO` documentada]

### Detalhes das Alterações
- **O formulário nunca funcionou**: Com `action="#"` e `method="post"` e nenhum JavaScript tratando o envio, o navegador fazia um POST nativo para a própria URL. Como não existia rota para isso, o visitante era levado a uma tela com `{"error":"Rota não encontrada"}`. Toda pessoa que preencheu o formulário acreditou ter falado com a Avoar, e a mensagem não chegava a lugar nenhum.
- **Destino configurável**: `CONTATO_EMAIL_DESTINO` define quem recebe; sem ela, cai no remetente já verificado no Brevo. Assim, trocar o endereço é mudança de variável, não de código.
- **Limite dedicado**: 5 mensagens por IP a cada 15 minutos. O limite global de 100 req/15min não serve aqui, porque cada requisição desta rota custa um e-mail — sem restrição própria, o endereço da Avoar viraria destino de spam.
- **Erro encontrado no teste**: O primeiro envio real falhou com `email is not valid in to`. A causa era usar `getFromAddress()`, que devolve o formato de cabeçalho `"Avoar Turismo" <contato@...>`, no campo de destinatário da API. Corrigido para `getSender().email`.
- **Validação em duas camadas**: Os atributos `required` do HTML barram o envio incompleto sem ida ao servidor; o Zod valida no backend, devolvendo erro por campo.
- **Sem armazenamento em banco**: A decisão foi entregar por e-mail, que é onde a equipe já trabalha. O ponto de extensão para histórico fica na rota, antes do envio.
- **Validação em navegador real**: Formulário preenchido e enviado sem sair da página, com aviso de sucesso, campos limpos e botão reabilitado; envio vazio bloqueado pelo navegador antes de chegar à API; e o limite respondendo 429 com mensagem clara na sexta tentativa.

---

## 2026-08-22 - feat: remover do R2 as imagens que deixam de ser usadas

### Arquivos Modificados
- `api/src/utils/limpeza-r2.ts` [Novo: verificação de reuso e remoção de órfãs]
- `api/src/routes/excursao.routes.ts`, `post.routes.ts`, `equipe.routes.ts`, `autores.routes.ts`, `excursao-pedagogica.routes.ts` [Limpeza ligada na exclusão e na atualização]

### Detalhes das Alterações
- **Problema**: Excluir um registro ou trocar uma foto deixava o objeto antigo no bucket para sempre. Confirmado em produção: após excluir uma excursão de teste, a imagem continuou respondendo 200. Sem tratamento, o bucket acumularia lixo indefinidamente, sem forma de distinguir depois o que é órfão do que está em uso.
- **Estratégia escolhida**: Remoção automática junto da alteração, em vez de uma faxina periódica manual. O critério foi a continuidade: uma rotina que depende de alguém lembrar de executá-la não sobrevive à troca de responsável pelo projeto.
- **Verificação de reuso**: A mesma URL pode aparecer em vários campos — é comum a mesma foto servir de capa, imagem principal e item de galeria. Antes de apagar, `removerSeOrfas` conta as ocorrências nos 11 campos do sistema e só remove o que ninguém mais referencia. Sem isso, excluir uma excursão destruiria a imagem de outra que a reaproveitasse, sem recuperação possível.
- **Cobertura da troca de imagem**: `urlsQueSairam` compara o estado anterior com o novo nas rotas de atualização. Trocar foto é mais frequente que excluir cadastro, então seria a maior fonte de lixo se ficasse de fora.
- **Ordem das operações**: A limpeza roda sempre depois da alteração no banco. Se fosse antes e a gravação falhasse, o registro apontaria para uma imagem já apagada e a foto sumiria do site sem explicação. Depois, o pior caso é sobrar um órfão, que é reversível.
- **Falha isolada**: Nunca lança exceção — uma indisponibilidade do R2 não pode impedir alguém de excluir ou editar um registro. As falhas vão ao log com a chave do objeto.
- **Documentos incluídos**: Nas excursões pedagógicas, o `documentoUrl` entra junto das imagens, porque também vive no bucket.
- **Validação**: Quatro cenários exercitados contra o bucket real — imagem compartilhada entre dois registros preservada ao excluir o primeiro e removida ao excluir o segundo; troca de imagem removendo a antiga e mantendo a nova; e atualização sem alterar imagem preservando o arquivo.

---

## 2026-08-22 - chore: migração de produção para o R2 e limpeza pós-migração

### Arquivos Modificados
- `api/src/server.ts` [Limite do corpo reduzido de 50 MB para 2 MB; removido o `express.static('/uploads')`]
- `api/src/routes/documentos.routes.ts` [Confere a existência no R2 antes de redirecionar]
- `api/docs/MIGRACAO-IMAGENS-R2.md` [Novo: registro do procedimento completo]

### Detalhes das Alterações
- **Migração de produção**: 125 imagens migradas do Base64 para o bucket do cliente, sem nenhuma falha — 90 das excursões pedagógicas, 31 do blog, 2 da equipe e 2 de autores. Varredura final nos 10 alvos confirma zero Base64 restante.
- **Espaço recuperado**: O banco caiu de **248 MB para 22 MB**. A migração sozinha levou a 234 MB, porque o PostgreSQL não devolve o espaço das linhas antigas; o `VACUUM FULL` por tabela recuperou o restante, travando cada uma por 2 a 3 segundos, com o site respondendo normalmente durante todo o processo. A `excursoes_pedagogicas` ocupava 188 MB com 44 linhas.
- **Limite do corpo da requisição**: Os 50 MB existiam porque o painel enviava a imagem inteira em Base64. Com apenas URLs trafegando, o corpo voltou a ser pequeno, e manter o limite alto deixava aberta a possibilidade de uma requisição enorme consumir a memória do processo. Uploads de arquivo não são afetados: usam multipart, com limite próprio.
- **Pasta `/uploads` removida**: Era o armazenamento anterior ao R2. Como o disco do Railway é recriado a cada deploy, os arquivos já não existiam — as URLs respondiam 404 mesmo com o serviço ativo. Confirmado que nenhum campo de conteúdo aponta para lá.
- **Regressão corrigida na rota de documentos**: A limpeza revelou 7 excursões cujo documento aponta para o disco efêmero, com os arquivos perdidos. A mudança da fase 1 redirecionava esses casos para o R2, onde também não existem, entregando ao cliente o XML de erro da Cloudflare. A rota passa a conferir a existência antes de redirecionar e devolve a mensagem explicativa quando o arquivo não está em lugar nenhum.
- **Documentação**: Registrado o procedimento completo, incluindo a ordem que importa (código antes dos dados, senão a CSP bloqueia tudo), as garantias do script e as armadilhas encontradas.

## 2026-08-22 - fix: exibir a data das excursões pedagógicas na área do cliente

### Arquivos Modificados
- `api/public/cliente/js/excursao.js` [Passa a ler `dataDestino`, campo usado pelas pedagógicas]

### Detalhes das Alterações
- **Causa**: Os dois tipos de excursão guardam a data em campos diferentes — a convencional em `dataExcursao`, a pedagógica em `dataDestino`. A tela de detalhes do cliente lia apenas `dataExcursao`, campo inexistente no modelo pedagógico. Sem valor, o código caía no texto padrão e exibia "A combinar".
- **Alcance real**: Não eram "algumas" excursões — **43 das 44 em produção têm data definida** e todas exibiam "A combinar". A inconsistência aparecia porque o painel administrativo lê `dataDestino` corretamente, então a mesma excursão mostrava data no admin e "A combinar" no site.
- **Correção contida**: A rota que alimenta a tela (`/api/cliente/pedidos/excursao/:codigo`) já devolvia `dataDestino` — o dado chegava à página. Bastou ler o campo certo. Os dois são aceitos, porque a tela pode receber os dois tipos conforme a origem do link.
- **Escopo verificado**: As demais telas que formatam data (`portfolio-excursoes.js`, `portfolio-single.js`, `pacotes-viagens.js`) consultam `/public/excursoes`, que retorna apenas convencionais, e já liam o campo correto. Nenhuma tela consome a listagem pública de pedagógicas.
- **Validação em navegador real**: Excursão com data passou a exibir 11/06/2026 no cabeçalho e na aba de informações; excursão sem data segue exibindo "A combinar".

---

## 2026-08-20 - feat: migrar imagens das excursões convencionais para o Cloudflare R2

### Arquivos Modificados
- `api/public/admin/js/excursao-editor.js` [Capa, imagem principal e galeria enviadas ao R2]
- `api/src/scripts/migrar-imagens-r2.ts` [Novos alvos: capa, imagem principal e galeria das convencionais]

### Detalhes das Alterações
- **Último domínio de imagem**: Com esta fase, nenhuma tela do painel converte imagem para Base64. As três que ainda faziam isso (blog, pedagógicas e convencionais) passaram a enviar ao R2.
- **Verificação de completude**: Uma consulta às 10 colunas de imagem do banco confirma **zero registros em Base64** e todos apontando para URL — `posts.imagemCapa`, `post_imagens.url`, `excursoes.imagemCapa`, `excursoes.imagemPrincipal`, `excursao_imagens.url`, `excursoes_pedagogicas.imagemCapa`, `excursoes_pedagogicas.imagemPrincipal`, `excursao_pedagogica_imagens.url`, `equipe.fotoPerfil` e `autores.foto`.
- **Peso das listagens públicas após a migração completa**: excursões 764 bytes, pedagógicas 5.257 bytes, posts 1.701 bytes e equipe 235 bytes — todas sem nenhum Base64.
- **Validação em navegador real**: A listagem de excursões e a página individual renderizam tudo do R2. No editor, capa de 2800x1800, imagem principal de 2200x1500 e duas imagens de galeria chegaram como URL, com as prévias renderizadas.
- **Acervo migrado**: 40 objetos no bucket, somando 10,2 MB — vindos de dezenas de megabytes de Base64 espalhados pelas colunas do PostgreSQL.

---
