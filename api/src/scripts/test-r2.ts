/**
 * Explicação do Arquivo [test-r2.ts]
 *
 * Diagnóstico da integração com o Cloudflare R2.
 * Executa o ciclo completo que a aplicação usa: upload → leitura pública → exclusão.
 *
 * A leitura pública é o passo que mais importa: credenciais válidas fazem o
 * upload funcionar mesmo com o bucket fechado, e nesse caso as imagens só
 * falhariam no navegador do visitante, com 404 e sem erro no backend.
 *
 * Uso: npm run test:r2
 */

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env da raiz de api/ antes de importar o módulo que lê as variáveis
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { getR2Client, getBucketName, getPublicUrl } from '../config/r2';

async function runTest() {
  console.log('🔄 Teste de integração com o Cloudflare R2\n');

  let falhou = false;
  const chave = `diagnostico/teste-r2-${Date.now()}.txt`;
  const conteudo = `Arquivo de diagnóstico da Avoar Turismo — ${new Date().toISOString()}`;

  try {
    const s3 = getR2Client();
    const bucket = getBucketName();

    console.log(`  Account ID: ${process.env.R2_ACCOUNT_ID?.slice(0, 5)}...`);
    console.log(`  Bucket:     ${bucket}`);
    console.log(`  URL base:   ${process.env.R2_PUBLIC_URL}`);
    console.log(`  Chave:      ${chave}\n`);

    // 1. Upload
    process.stdout.write('1/3 Upload... ');
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: chave,
      Body: Buffer.from(conteudo),
      ContentType: 'text/plain'
    }));
    console.log('✅');

    // 2. Leitura pública — valida que o bucket serve o objeto pela URL configurada
    const publicUrl = getPublicUrl(chave);
    process.stdout.write('2/3 Leitura pública... ');
    const resp = await fetch(publicUrl);
    const corpo = await resp.text();

    if (!resp.ok) {
      console.log(`❌ HTTP ${resp.status}`);
      console.log(`\n    A URL ${publicUrl} não devolveu o arquivo.`);
      console.log('    Causa provável: acesso público do bucket desabilitado, ou R2_PUBLIC_URL incorreta.');
      console.log('    No painel do R2: Settings → Public access → habilitar r2.dev ou vincular um domínio.');
      falhou = true;
    } else if (corpo.trim() !== conteudo) {
      console.log('❌ conteúdo divergente');
      falhou = true;
    } else {
      console.log(`✅ HTTP ${resp.status}, conteúdo confere`);
      console.log(`    ${publicUrl}`);
    }

    // 3. Exclusão
    process.stdout.write('3/3 Exclusão... ');
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: chave }));
    console.log('✅');

    console.log(falhou
      ? '\n⚠️  Upload e exclusão funcionam, mas a entrega pública não. As imagens não apareceriam no site.'
      : '\n🎉 Ciclo completo funcionando: upload, leitura pública e exclusão.');
  } catch (error) {
    falhou = true;
    console.log('❌');
    console.error('\nErro durante o teste:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      const codigo = (error as { Code?: string }).Code;
      if (codigo) console.error(`  Código: ${codigo}`);
    } else {
      console.error(error);
    }
  }

  process.exit(falhou ? 1 : 0);
}

runTest();
