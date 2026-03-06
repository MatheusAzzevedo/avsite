/**
 * Script de otimização de imagens (batch)
 *
 * Reduz tamanho das imagens nas pastas especificadas:
 * - Imagens para o site
 * - Imagens para o site/Biologia marinha
 * - Imagens para o site/Pagina Inicial
 * - FOTOS AVOAR PREFERIDAS
 *
 * Usa Sharp para: resize (max 1920px), recompressão.
 * Mantém formato e nome do arquivo (substitui no lugar).
 *
 * Uso: node scripts/optimize-images.js
 *      ou: npm run optimize:images
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const IMAGES_BASE = path.join(__dirname, '../public/images');

const TARGET_FOLDERS = [
  'Imagens para o site',
  'Imagens para o site/Biologia marinha',
  'Imagens para o site/Pagina Inicial',
  'FOTOS AVOAR PREFERIDAS'
];

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 82;
const PNG_COMPRESSION = 9;
const WEBP_QUALITY = 82;

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function getAllImageFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllImageFiles(fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const relativePath = path.relative(IMAGES_BASE, filePath);
  const statsBefore = fs.statSync(filePath);
  const sizeBeforeKB = (statsBefore.size / 1024).toFixed(1);

  try {
    let pipeline = sharp(filePath)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true
      });

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
        break;
      case '.png':
        pipeline = pipeline.png({ compressionLevel: PNG_COMPRESSION });
        break;
      case '.webp':
        pipeline = pipeline.webp({ quality: WEBP_QUALITY });
        break;
      default:
        console.log(`  [PULAR] ${relativePath} - formato não suportado`);
        return { skipped: true };
    }

    const buffer = await pipeline.toBuffer();
    const sizeAfterKB = (buffer.length / 1024).toFixed(1);
    const savings = ((1 - buffer.length / statsBefore.size) * 100).toFixed(1);

    if (buffer.length >= statsBefore.size) {
      console.log(`  [OK] ${relativePath} - já otimizado (${sizeBeforeKB} KB)`);
      return { skipped: true, sizeBefore: statsBefore.size, sizeAfter: statsBefore.size };
    }

    fs.writeFileSync(filePath, buffer);
    console.log(`  [OTIMIZADO] ${relativePath} - ${sizeBeforeKB} KB → ${sizeAfterKB} KB (-${savings}%)`);
    return {
      skipped: false,
      sizeBefore: statsBefore.size,
      sizeAfter: buffer.length,
      savings
    };
  } catch (err) {
    console.error(`  [ERRO] ${relativePath}: ${err.message}`);
    return { error: err.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Otimização de imagens - Avorar Turismo');
  console.log('='.repeat(60));
  console.log(`Pastas: ${TARGET_FOLDERS.join(', ')}`);
  console.log(`Config: max ${MAX_DIMENSION}px, JPEG q=${JPEG_QUALITY}, PNG comp=${PNG_COMPRESSION}`);
  console.log('='.repeat(60));

  const seen = new Set();
  const allFiles = [];
  for (const folder of TARGET_FOLDERS) {
    const fullPath = path.join(IMAGES_BASE, folder);
    const files = getAllImageFiles(fullPath);
    for (const f of files) {
      if (!seen.has(f)) {
        seen.add(f);
        allFiles.push(f);
      }
    }
  }

  if (allFiles.length === 0) {
    console.log('\nNenhuma imagem encontrada nas pastas especificadas.');
    process.exit(0);
    return;
  }

  console.log(`\nEncontradas ${allFiles.length} imagem(ns). Processando...\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let optimized = 0;
  let errors = 0;

  for (const filePath of allFiles) {
    const result = await optimizeImage(filePath);
    if (result.error) {
      errors++;
    } else if (!result.skipped) {
      optimized++;
      totalBefore += result.sizeBefore;
      totalAfter += result.sizeAfter;
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Concluído: ${optimized} otimizada(s), ${errors} erro(s)`);
  if (totalBefore > 0) {
    const totalSavedKB = ((totalBefore - totalAfter) / 1024).toFixed(1);
    const totalSavedPercent = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);
    console.log(`Economia total: ${totalSavedKB} KB (-${totalSavedPercent}%)`);
  }
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
