#!/usr/bin/env node
/**
 * Script para atualizar créditos no footer de todas as páginas
 */

const fs = require('fs');
const path = require('path');

const API_ROOT = path.join(__dirname, '..');
const PAGES = [
  'index-10.html',
  'index-11.html',
  'about.html',
  'blog.html',
  'blog-single.html',
  'portfolio.html',
  'portfolio-single.html',
  'contact.html'
];

const OLD_PATTERN = /<div class="footer-legal-links">[\s\S]*?<\/div>/;
const NEW_CONTENT = `<div class="footer-legal-links">
        <span>Criado por: </span>
        <a href="https://wa.me/5511962605997" target="_blank" rel="noopener noreferrer">Matheus Azevedo</a>
      </div>`;

function updateFooterCredits(file) {
  const fullPath = path.join(API_ROOT, 'public', file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [SKIP] ${file} não encontrado`);
    return false;
  }

  let html = fs.readFileSync(fullPath, 'utf8');
  
  if (html.includes('Criado por: Matheus Azevedo')) {
    console.log(`  [OK] ${file} já atualizado`);
    return false;
  }

  if (!OLD_PATTERN.test(html)) {
    console.warn(`  [SKIP] ${file} sem footer-legal-links encontrado`);
    return false;
  }

  html = html.replace(OLD_PATTERN, NEW_CONTENT);
  fs.writeFileSync(fullPath, html, 'utf8');
  console.log(`  [OK] ${file} créditos atualizados`);
  return true;
}

function main() {
  console.log('Atualizando créditos no footer...\n');
  
  let updated = 0;
  PAGES.forEach(file => {
    if (updateFooterCredits(file)) updated++;
  });
  
  console.log(`\n✅ ${updated} arquivo(s) atualizado(s)`);
}

main();
