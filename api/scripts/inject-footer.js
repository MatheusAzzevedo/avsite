#!/usr/bin/env node
/**
 * Script de build: injeta o footer (componente único) nas páginas api/public.
 * Usado no deploy (Railway) onde só a pasta api existe.
 *
 * Uso: node scripts/inject-footer.js (a partir da pasta api)
 */

const fs = require('fs');
const path = require('path');

const API_ROOT = path.join(__dirname, '..');
const FOOTER_PATH = path.join(API_ROOT, 'public', 'includes', 'footer.html');

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

const PLACEHOLDER = '<!-- FOOTER_COMPONENT -->';

function main() {
  if (!fs.existsSync(FOOTER_PATH)) {
    console.warn('[build:footer] Arquivo de footer não encontrado, pulando.');
    return;
  }

  const footerContent = fs.readFileSync(FOOTER_PATH, 'utf8');

  PAGES.forEach((file) => {
    const fullPath = path.join(API_ROOT, 'public', file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`  [SKIP] ${file} não encontrado`);
      return;
    }

    let html = fs.readFileSync(fullPath, 'utf8');
    if (!html.includes(PLACEHOLDER)) {
      console.warn(`  [SKIP] ${file} sem placeholder`);
      return;
    }

    html = html.replace(PLACEHOLDER, footerContent.trim());
    fs.writeFileSync(fullPath, html);
    console.log(`  [OK] ${file}`);
  });
}

main();
