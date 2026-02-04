#!/usr/bin/env node
/**
 * Script de build: injeta o footer (componente único) em todas as páginas HTML.
 * 
 * Uso: node scripts/inject-footer.js
 * 
 * Substitui o placeholder <!-- FOOTER_COMPONENT --> pelo conteúdo de includes/footer.html
 * em cada página. Mantém uma única fonte de verdade para o rodapé.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FOOTER_ROOT = path.join(ROOT, 'includes', 'footer.html');
const FOOTER_API = path.join(ROOT, 'api', 'public', 'includes', 'footer.html');

const PAGES_ROOT = [
  'index-10.html',
  'index-11.html',
  'about.html',
  'blog.html',
  'blog-single.html',
  'portfolio.html',
  'portfolio-single.html',
  'contact.html'
];

const PAGES_API = [
  'index-10.html',
  'index-11.html',
  'about.html',
  'blog.html',
  'blog-single.html',
  'portfolio.html',
  'portfolio-single.html',
  'contact.html'
];

const PLACEHOLDER = '<!-- FOOTER_COMPONENT -->';

function injectFooter(htmlPath, footerContent) {
  const fullPath = path.join(ROOT, htmlPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [SKIP] ${htmlPath} não encontrado`);
    return;
  }

  let html = fs.readFileSync(fullPath, 'utf8');
  if (!html.includes(PLACEHOLDER)) {
    console.warn(`  [SKIP] ${htmlPath} sem placeholder`);
    return;
  }

  html = html.replace(PLACEHOLDER, footerContent.trim());
  fs.writeFileSync(fullPath, html);
  console.log(`  [OK] ${htmlPath}`);
}

function main() {
  console.log('Injectando footer em todas as páginas...\n');

  const footerRoot = fs.readFileSync(FOOTER_ROOT, 'utf8');
  const footerApi = fs.readFileSync(FOOTER_API, 'utf8');

  console.log('Páginas raiz (links relativos):');
  PAGES_ROOT.forEach(p => injectFooter(p, footerRoot));

  console.log('\nPáginas api/public (URLs amigáveis):');
  PAGES_API.forEach(p => injectFooter(path.join('api', 'public', p), footerApi));

  console.log('\nConcluído.');
}

main();
