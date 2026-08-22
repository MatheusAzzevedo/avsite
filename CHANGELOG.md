# Changelog

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

## 2026-08-20 - feat: migrar as fotos de Autores do Base64 para o Cloudflare R2

### Arquivos Modificados
- `api/public/admin/js/autores.js` [Foto enviada ao R2 em vez de convertida para Base64]

### Detalhes das Alterações
- **Segundo domínio migrado**: A foto do autor passa a ser enviada ao R2, com o campo guardando apenas a URL. O salvamento não mudou, porque já lia `fotoUrl.value`.
- **Limite local removido**: A tela rejeitava acima de 5 MB, contra os 25 MB do servidor. O teto mais apertado no navegador levava o usuário a comprimir a imagem por fora antes de enviar.
- **Onde a tela vive**: Não existe `autores.html`. O `autores.js` é carregado por `blog.html`, e o formulário de autor é um modal dentro dessa página. A verificação inicial falhou por procurar numa página inexistente.
- **Resultado medido**: Foto de 286 KB em Base64 virou 32 KB no R2. Na resposta pública de posts, o campo do autor caiu para 101 caracteres.
- **Validação em navegador real**: Os cards do blog renderizam o avatar do autor vindo do R2. Pelo modal em `blog.html`, um PNG de 3000x2000 enviado pelo seletor de arquivo real chegou ao campo como URL e a prévia carregou em 1920x1280.
- **Pendente para a fase 5**: As capas dos posts continuam em Base64 — uma delas com 441 KB —, o que ainda domina o peso da listagem do blog.

---
