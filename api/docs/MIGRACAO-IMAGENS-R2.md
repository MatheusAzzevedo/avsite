# Migração de imagens para o Cloudflare R2

Registro do que foi feito, por quê, e como repetir o procedimento em outro
ambiente. Concluído em 22/08/2026.

## O problema

As imagens do sistema eram gravadas como Base64 dentro das próprias colunas do
PostgreSQL. Isso tinha três efeitos:

- **Peso nas respostas.** A página "Sobre Nós" carregava ~2,6 MB de texto a cada
  visita, sem CDN e sem cache de imagem, saindo do banco e passando pelo Node.
- **Banco inflado.** A tabela `excursoes_pedagogicas` ocupava 188 MB com 44 linhas.
- **Perda de qualidade.** O limite de 5 MB no painel levava o usuário a comprimir
  a foto por fora antes de enviar. Somava-se ao `optimize-images.js`, que
  recomprimia os arquivos no lugar a cada execução.

Um caminho anterior gravava em `api/uploads/`, no disco — que o Railway recria a
cada deploy, então esses arquivos se perdiam.

## Como ficou

| Camada | Antes | Depois |
|---|---|---|
| Armazenamento | Base64 no Postgres / disco efêmero | Cloudflare R2 |
| Campo no banco | a imagem inteira | uma URL (~100 caracteres) |
| Processamento | nenhum | máx. 1920px, WebP q90, perfil de cor preservado |
| Entrega | pelo Node, a cada requisição | direto da Cloudflare |

### Resultado medido em produção

- Banco: **248 MB → 22 MB**
- `/api/public/equipe`: **~2,6 MB → 478 bytes**
- 125 imagens migradas, 0 falhas
- Bucket `avoar-producao`: 125 objetos, 31,8 MB

## Variáveis de ambiente

As cinco mudam juntas — um conjunto misturado grava no bucket errado.

| Variável | Onde obter |
|---|---|
| `R2_ACCOUNT_ID` | painel do R2 |
| `R2_BUCKET_NAME` | nome do bucket |
| `R2_ACCESS_KEY_ID` | ao criar o token de API |
| `R2_SECRET_ACCESS_KEY` | idem — exibido uma única vez |
| `R2_PUBLIC_URL` | Settings → Public access (formato `https://pub-*.r2.dev`) |

Opcionais: `IMAGEM_DIMENSAO_MAXIMA` (1920) e `IMAGEM_QUALIDADE` (90).

**O token deve ser "Object Read & Write", restrito ao bucket.** As opções Admin
permitem apagar buckets inteiros.

**`R2_PUBLIC_URL` não é o endpoint S3.** O endereço
`<conta>.r2.cloudflarestorage.com` exige assinatura em cada requisição e
responde 400 sem ela — usá-lo aqui quebraria todas as imagens do site.

## Procedimento de migração

A ordem importa. Migrar os dados antes de publicar o código derruba as imagens
do site inteiro, porque a CSP ainda não libera o domínio do R2.

1. **Publicar o código** com a liberação da CSP e cadastrar as variáveis no
   ambiente. Estado intermediário é seguro: a CSP aceita `data:` e o R2, então o
   acervo em Base64 continua funcionando.
2. **Confirmar o deploy** conferindo se o `img-src` já inclui o domínio do R2.
3. **Validar o bucket** com `npm run test:r2` — envia, lê pela URL pública
   comparando o conteúdo, e apaga.
4. **Backup do banco**, obrigatório. Se o `pg_dump` local for de versão anterior
   à do servidor, use o cliente correspondente via container:
   `docker run --rm -e U="$URL" -v <destino>:/backup postgres:17 sh -c 'pg_dump "$U" -Fc -f /backup/nome.dump'`
5. **Simulação**: `npm run migrar:imagens -- --entidade=<alvo>` não altera nada.
6. **Aplicar**, um alvo por vez, verificando a página correspondente entre eles.

### Alvos, do menor para o maior

`equipe`, `autores`, `posts`, `posts-galeria`, `excursoes-capa`,
`excursoes-principal`, `excursoes-galeria`, `pedagogicas-capa`,
`pedagogicas-principal`, `pedagogicas-galeria`.

### Garantias do script

- **Idempotente**: registros que já são URL são ignorados; pode rodar de novo.
- **Verifica antes de trocar**: cada imagem é enviada, lida de volta pela URL
  pública e conferida. Só então o banco é atualizado. Uma falha mantém o Base64
  intacto para nova tentativa.
- **Simula por padrão**: só grava com `--aplicar`.

## Limpeza pós-migração

O PostgreSQL não devolve o espaço sozinho — as linhas antigas viram tuplas
mortas. `VACUUM FULL` recupera, travando cada tabela enquanto roda (foram 2 a 3
segundos por tabela aqui, com o site respondendo normalmente):

```
docker run --rm -e U="$URL" postgres:17 sh -c 'psql "$U" -q -c "VACUUM FULL public.<tabela>"'
```

Uma tabela por comando: o `psql` envolve múltiplos comandos numa transação, e
`VACUUM` não aceita isso.

Também foram feitos: redução do limite do corpo da requisição de 50 MB para
2 MB, e remoção do `express.static('/uploads')`.

## Pontos que custaram tempo

- **CSP.** Sem liberar a origem do R2 no `img-src`, o navegador bloqueia as
  imagens: o backend responde 200, o log fica limpo, e as fotos somem.
- **`r2.dev` não é para produção.** A Cloudflare documenta que é limitado por
  taxa, sem cache nem WAF. Um domínio personalizado exige a zona DNS na
  Cloudflare — o domínio da Avoar está na Hostinger, com o e-mail na mesma zona,
  então a mudança ficou adiada.
- **`r2.dev` recusa user-agents não-navegador.** Um script com `urllib` do Python
  recebe 403; com curl ou navegador, 200. Não é falha do bucket.
- **Nome de arquivo em latin1.** O multer entrega `originalname` em latin1;
  acentos precisam ser reinterpretados como UTF-8 antes de uso.
- **Recodificar nem sempre reduz.** Imagens já comprimidas e abaixo do teto podem
  crescer ao virar WebP. O ganho estrutural é tirar a imagem da coluna.

## Pendências conhecidas

- 7 excursões pedagógicas têm `documentoUrl` apontando para o disco efêmero; os
  arquivos não existem mais. A rota de download detecta e devolve mensagem
  explicativa, mas os documentos precisam ser reenviados.
- O domínio personalizado para o R2 continua pendente, junto da migração da zona
  DNS para a Cloudflare.
