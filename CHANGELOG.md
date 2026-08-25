# Changelog

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

## 2026-08-20 - feat: migrar imagens das excursões pedagógicas para o Cloudflare R2

### Arquivos Modificados
- `api/public/admin/js/excursao-pedagogica-editor.js` [Capa, imagem principal e galeria enviadas ao R2]
- `api/src/scripts/migrar-imagens-r2.ts` [Novos alvos: capa, imagem principal e galeria das pedagógicas]

### Detalhes das Alterações
- **Maior volume até aqui**: 13 registros no banco local somavam **55 MB** apenas nas colunas `imagemCapa` e `imagemPrincipal`. Após a migração, essas colunas somam **2.645 bytes**. A listagem pública dos 13 registros passou a pesar 5,2 KB — em produção, uma amostra de apenas 5 registros pesava 1,5 MB.
- **Documento já resolvido**: O envio de documento desta tela já usava `UploadManager.uploadDocument` e passou a funcionar na fase 1, quando o download foi corrigido. Não precisou de alteração.
- **Um handler para dois campos**: `handleImageUploadPedagogica` recebe os ids por parâmetro e serve tanto à capa quanto à imagem principal, então a troca cobriu os dois de uma vez.
- **Recodificação nem sempre reduz**: Das 12 capas migradas, 5 ficaram maiores — por exemplo 330 KB → 438 KB. São imagens já comprimidas e abaixo do teto de 1920px, onde recodificar em WebP com qualidade 90 custa bytes. O saldo continua muito positivo (as duas rodadas somaram ~34 MB a menos no banco), porque os ganhos vêm dos arquivos grandes: 20.369 KB → 590 KB e 7.264 KB → 390 KB. O ganho principal, de qualquer forma, é o campo do banco deixar de carregar a imagem inteira.
- **Validação em navegador real**: A página de detalhes da excursão na área do cliente renderiza as imagens do R2, sem Base64. No editor do admin, capa de 2800x1800, imagem principal de 2200x1500 e três imagens de galeria enviadas de uma vez chegaram como URL, com as prévias renderizadas.

---

## 2026-08-20 - feat: migrar capa e galeria do blog para o Cloudflare R2

### Arquivos Modificados
- `api/public/admin/js/blog-editor.js` [Capa e galeria enviadas ao R2 em vez de convertidas para Base64]
- `api/src/scripts/migrar-imagens-r2.ts` [Novos alvos: capa do post e tabela de galeria]

### Detalhes das Alterações
- **Primeira tela com galeria**: Além da capa, o post tem até 4 imagens na tabela `post_imagens`. O envio múltiplo usa `enviarVarias`, que sobe em sequência e informa qual arquivo está indo — em paralelo, várias fotos grandes saturam a conexão e todas demoram mais.
- **Limite da galeria respeitado antes do envio**: Só as imagens que cabem nas vagas restantes são enviadas. Antes, cada arquivo era lido e descartado depois; agora o excesso nem sobe, e o usuário é avisado de quantas couberam.
- **Falha isolada**: Um arquivo que falha não derruba os demais do lote, e o erro é mostrado com o nome do arquivo.
- **Migração de tabela relacionada**: O script passou a cobrir `PostImagem.url`, onde cada linha é uma imagem. O formato de alvo já existente serviu sem alteração — o "registro" passa a ser a própria imagem, rotulada com o título do post e a ordem.
- **Resultado medido**: A listagem pública do blog caiu de **489.300 para 1.700 bytes**, uma redução de 288 vezes. As 4 imagens de galeria somadas caíram de 251 KB para 118 KB.
- **Recodificação pode inflar**: Uma capa de 26 KB virou 38 KB. Recodificar uma origem pequena já comprimida custa bytes; em valor absoluto é irrelevante, e o ganho real está no campo do banco, que deixa de carregar a imagem inteira.
- **Validação em navegador real**: Listagem e post individual renderizam tudo do R2, com zero Base64 e os 4 links de galeria funcionando. No editor, uma capa de 2600x1700 e três imagens de galeria enviadas de uma vez chegaram como URL; com 3 já na galeria, um lote de 3 novas adicionou apenas 1, respeitando o teto de 4 sem desperdiçar envios.

---
