#!/usr/bin/env node
/**
 * Script para substituir footer hardcoded pelo placeholder em todas as páginas
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

const FOOTER_PATTERN = /<!-- Footer -->[\s\S]*?<\/footer>/;
const PLACEHOLDER = '    <!-- Footer -->\n    <!-- FOOTER_COMPONENT -->';

function replaceFooter(file) {
  const fullPath = path.join(API_ROOT, 'public', file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [SKIP] ${file} não encontrado`);
    return false;
  }

  let html = fs.readFileSync(fullPath, 'utf8');
  
  if (html.includes('<!-- FOOTER_COMPONENT -->')) {
    console.log(`  [OK] ${file} já tem placeholder`);
    return false;
  }

  if (!FOOTER_PATTERN.test(html)) {
    console.warn(`  [SKIP] ${file} sem footer encontrado`);
    return false;
  }

  html = html.replace(FOOTER_PATTERN, PLACEHOLDER);
  fs.writeFileSync(fullPath, html, 'utf8');
  console.log(`  [OK] ${file} footer substituído`);
  return true;
}

function main() {
  console.log('Substituindo footer hardcoded pelo placeholder...\n');
  
  let replaced = 0;
  PAGES.forEach(file => {
    if (replaceFooter(file)) replaced++;
  });
  
  console.log(`\n✅ ${replaced} arquivo(s) atualizado(s)`);
}

main();
