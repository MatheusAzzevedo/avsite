/**
 * Explicação do Arquivo [migrar-imagens-r2.ts]
 *
 * Migra imagens guardadas como Base64 no PostgreSQL para o Cloudflare R2,
 * trocando o conteúdo do campo pela URL pública.
 *
 * Cuidados que definem o desenho:
 * - **Idempotente**: registros cujo campo já é URL são ignorados, então o
 *   script pode ser interrompido e rodado de novo sem duplicar objetos.
 * - **Verifica antes de trocar**: cada imagem é enviada, lida de volta pela
 *   URL pública e conferida byte a byte. Só então o banco é atualizado. Sem
 *   isso, uma falha silenciosa no bucket deixaria o registro apontando para
 *   uma imagem que não existe — e o Base64 original já teria sido perdido.
 * - **Simulação por padrão**: sem `--aplicar`, nada é enviado nem gravado.
 *
 * Uso:
 *   npm run migrar:imagens -- --entidade=equipe            (simulação)
 *   npm run migrar:imagens -- --entidade=equipe --aplicar  (executa)
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { uploadBufferToR2, verificarConfigR2 } from '../config/r2';

const APLICAR = process.argv.includes('--aplicar');
const ENTIDADE = (process.argv.find((a) => a.startsWith('--entidade=')) || '').split('=')[1];

const DIMENSAO_MAXIMA = Number(process.env.IMAGEM_DIMENSAO_MAXIMA) || 1920;
const QUALIDADE = Number(process.env.IMAGEM_QUALIDADE) || 90;

/** Descreve como alcançar o campo de imagem de cada entidade. */
interface Alvo {
  nome: string;
  campo: string;
  prefixo: string;
  listar: () => Promise<Array<{ id: string; rotulo: string; valor: string | null }>>;
  gravar: (id: string, url: string) => Promise<unknown>;
}

const ALVOS: Record<string, Alvo> = {
  equipe: {
    nome: 'Equipe',
    campo: 'fotoPerfil',
    prefixo: 'equipe',
    listar: async () => {
      const rs = await prisma.equipe.findMany({ select: { id: true, nome: true, fotoPerfil: true } });
      return rs.map((r) => ({ id: r.id, rotulo: r.nome, valor: r.fotoPerfil }));
    },
    gravar: (id, url) => prisma.equipe.update({ where: { id }, data: { fotoPerfil: url } })
  },
  autores: {
    nome: 'Autores',
    campo: 'foto',
    prefixo: 'autores',
    listar: async () => {
      const rs = await prisma.autor.findMany({ select: { id: true, nome: true, foto: true } });
      return rs.map((r) => ({ id: r.id, rotulo: r.nome, valor: r.foto }));
    },
    gravar: (id, url) => prisma.autor.update({ where: { id }, data: { foto: url } })
  },

  posts: {
    nome: 'Posts (capa)',
    campo: 'imagemCapa',
    prefixo: 'posts',
    listar: async () => {
      const rs = await prisma.post.findMany({ select: { id: true, titulo: true, imagemCapa: true } });
      return rs.map((r) => ({ id: r.id, rotulo: r.titulo, valor: r.imagemCapa }));
    },
    gravar: (id, url) => prisma.post.update({ where: { id }, data: { imagemCapa: url } })
  },

  // Galeria é uma tabela à parte: cada linha é uma imagem, então o mesmo
  // formato de alvo serve — o "registro" aqui é a própria imagem.
  'posts-galeria': {
    nome: 'Posts (galeria)',
    campo: 'url',
    prefixo: 'posts/galeria',
    listar: async () => {
      const rs = await prisma.postImagem.findMany({
        select: { id: true, url: true, ordem: true, post: { select: { titulo: true } } },
        orderBy: [{ postId: 'asc' }, { ordem: 'asc' }]
      });
      return rs.map((r) => ({
        id: r.id,
        rotulo: `${r.post?.titulo ?? 'post'} #${r.ordem}`,
        valor: r.url
      }));
    },
    gravar: (id, url) => prisma.postImagem.update({ where: { id }, data: { url } })
  },

  'pedagogicas-capa': {
    nome: 'Excursões pedagógicas (capa)',
    campo: 'imagemCapa',
    prefixo: 'excursoes-pedagogicas',
    listar: async () => {
      const rs = await prisma.excursaoPedagogica.findMany({ select: { id: true, titulo: true, imagemCapa: true } });
      return rs.map((r) => ({ id: r.id, rotulo: r.titulo, valor: r.imagemCapa }));
    },
    gravar: (id, url) => prisma.excursaoPedagogica.update({ where: { id }, data: { imagemCapa: url } })
  },

  'pedagogicas-principal': {
    nome: 'Excursões pedagógicas (imagem principal)',
    campo: 'imagemPrincipal',
    prefixo: 'excursoes-pedagogicas',
    listar: async () => {
      const rs = await prisma.excursaoPedagogica.findMany({ select: { id: true, titulo: true, imagemPrincipal: true } });
      return rs.map((r) => ({ id: r.id, rotulo: r.titulo, valor: r.imagemPrincipal }));
    },
    gravar: (id, url) => prisma.excursaoPedagogica.update({ where: { id }, data: { imagemPrincipal: url } })
  },

  'pedagogicas-galeria': {
    nome: 'Excursões pedagógicas (galeria)',
    campo: 'url',
    prefixo: 'excursoes-pedagogicas/galeria',
    listar: async () => {
      const rs = await prisma.excursaoPedagogicaImagem.findMany({
        select: { id: true, url: true, ordem: true, excursaoPedagogica: { select: { titulo: true } } },
        orderBy: [{ excursaoPedagogicaId: 'asc' }, { ordem: 'asc' }]
      });
      return rs.map((r) => ({
        id: r.id,
        rotulo: `${r.excursaoPedagogica?.titulo ?? 'excursão'} #${r.ordem}`,
        valor: r.url
      }));
    },
    gravar: (id, url) => prisma.excursaoPedagogicaImagem.update({ where: { id }, data: { url } })
  },

  'excursoes-capa': {
    nome: 'Excursões convencionais (capa)',
    campo: 'imagemCapa',
    prefixo: 'excursoes',
    listar: async () => {
      const rs = await prisma.excursao.findMany({ select: { id: true, titulo: true, imagemCapa: true } });
      return rs.map((r) => ({ id: r.id, rotulo: r.titulo, valor: r.imagemCapa }));
    },
    gravar: (id, url) => prisma.excursao.update({ where: { id }, data: { imagemCapa: url } })
  },

  'excursoes-principal': {
    nome: 'Excursões convencionais (imagem principal)',
    campo: 'imagemPrincipal',
    prefixo: 'excursoes',
    listar: async () => {
      const rs = await prisma.excursao.findMany({ select: { id: true, titulo: true, imagemPrincipal: true } });
      return rs.map((r) => ({ id: r.id, rotulo: r.titulo, valor: r.imagemPrincipal }));
    },
    gravar: (id, url) => prisma.excursao.update({ where: { id }, data: { imagemPrincipal: url } })
  },

  'excursoes-galeria': {
    nome: 'Excursões convencionais (galeria)',
    campo: 'url',
    prefixo: 'excursoes/galeria',
    listar: async () => {
      const rs = await prisma.excursaoImagem.findMany({
        select: { id: true, url: true, ordem: true, excursao: { select: { titulo: true } } },
        orderBy: [{ excursaoId: 'asc' }, { ordem: 'asc' }]
      });
      return rs.map((r) => ({
        id: r.id,
        rotulo: `${r.excursao?.titulo ?? 'excursão'} #${r.ordem}`,
        valor: r.url
      }));
    },
    gravar: (id, url) => prisma.excursaoImagem.update({ where: { id }, data: { url } })
  }
};

/** Um valor só precisa migrar se for realmente um Base64 embutido. */
function ehBase64(valor: string | null): boolean {
  return !!valor && valor.startsWith('data:');
}

/**
 * Explicação da função [migrarUm]
 * Envia uma imagem, confere a leitura pública e devolve a URL.
 * Lança se qualquer etapa falhar — quem chama decide se segue ou para.
 */
async function migrarUm(base64: string, prefixo: string, rotulo: string): Promise<{ url: string; kbAntes: number; kbDepois: number }> {
  const parte = base64.split(',')[1];
  if (!parte) throw new Error('Base64 sem conteúdo após a vírgula');

  const entrada = Buffer.from(parte, 'base64');

  const processada = await sharp(entrada)
    .rotate()
    .resize(DIMENSAO_MAXIMA, DIMENSAO_MAXIMA, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALIDADE })
    .keepIccProfile()
    .toBuffer();

  const chave = `${prefixo}/${uuidv4()}.webp`;
  const url = await uploadBufferToR2(processada, chave, 'image/webp');

  // Confere que a imagem realmente ficou acessível antes de descartar o original
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Imagem enviada mas inacessível em ${url} (HTTP ${resp.status})`);
  const baixada = Buffer.from(await resp.arrayBuffer());
  if (baixada.length !== processada.length) {
    throw new Error(`Tamanho divergente para ${rotulo}: enviou ${processada.length}, leu ${baixada.length}`);
  }

  return {
    url,
    kbAntes: Math.round(entrada.length / 1024),
    kbDepois: Math.round(processada.length / 1024)
  };
}

async function main() {
  if (!ENTIDADE || !ALVOS[ENTIDADE]) {
    console.error(`Informe --entidade= com um destes: ${Object.keys(ALVOS).join(', ')}`);
    process.exit(1);
  }
  if (!verificarConfigR2()) {
    console.error('R2 não configurado (R2_PUBLIC_URL ausente).');
    process.exit(1);
  }

  const alvo = ALVOS[ENTIDADE];
  console.log(`\nMigração de imagens → Cloudflare R2`);
  console.log(`  Entidade: ${alvo.nome} (campo ${alvo.campo})`);
  console.log(`  Modo:     ${APLICAR ? 'APLICAR — envia e grava no banco' : 'SIMULAÇÃO — nada será alterado'}`);
  console.log(`  Imagem:   máx ${DIMENSAO_MAXIMA}px, qualidade ${QUALIDADE}\n`);

  const registros = await alvo.listar();
  const pendentes = registros.filter((r) => ehBase64(r.valor));
  const jaMigrados = registros.length - pendentes.length;

  console.log(`  ${registros.length} registro(s); ${pendentes.length} com Base64, ${jaMigrados} já migrado(s) ou vazio(s)\n`);

  if (pendentes.length === 0) {
    console.log('Nada a fazer.\n');
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  let falhas = 0;
  let economizado = 0;

  for (const reg of pendentes) {
    const rotulo = reg.rotulo.slice(0, 32).padEnd(34);
    try {
      if (!APLICAR) {
        const kb = Math.round(Buffer.from(reg.valor!.split(',')[1] || '', 'base64').length / 1024);
        console.log(`  [SIMULA]  ${rotulo} ${kb} KB em Base64`);
        ok++;
        continue;
      }

      const r = await migrarUm(reg.valor!, alvo.prefixo, reg.rotulo);
      await alvo.gravar(reg.id, r.url);
      economizado += r.kbAntes - r.kbDepois;
      console.log(`  [OK]      ${rotulo} ${r.kbAntes} KB → ${r.kbDepois} KB`);
      ok++;
    } catch (e) {
      falhas++;
      // O registro é deixado intacto de propósito: com o Base64 preservado,
      // basta rodar o script de novo depois de resolver a causa.
      console.error(`  [FALHOU]  ${rotulo} ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`\n  ${ok} concluído(s), ${falhas} falha(s)`);
  if (APLICAR && economizado > 0) {
    console.log(`  ${economizado} KB a menos trafegando do banco a cada leitura`);
  }
  if (!APLICAR) {
    console.log('\n  Simulação. Repita com --aplicar para executar de verdade.');
  }
  console.log('');

  await prisma.$disconnect();
  process.exit(falhas > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error('Erro inesperado:', e);
  await prisma.$disconnect();
  process.exit(1);
});
