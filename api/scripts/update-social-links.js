#!/usr/bin/env node
/**
 * Script para atualizar links das redes sociais no footer de todas as páginas
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

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/people/Avoar-Turismo/100089301964232/',
  instagram: 'https://www.instagram.com/avoarturismo/',
  linkedin: 'https://www.linkedin.com/company/avoar-turismo-pedag%C3%B3gico/'
};

function updateSocialLinks(file) {
  const fullPath = path.join(API_ROOT, 'public', file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [SKIP] ${file} não encontrado`);
    return false;
  }

  let html = fs.readFileSync(fullPath, 'utf8');
  let updated = false;

  // Padrão para encontrar os links das redes sociais no footer
  const patterns = [
    {
      old: /<a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"><\/i><\/a>/g,
      new: `<a href="${SOCIAL_LINKS.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>`
    },
    {
      old: /<a href="#" aria-label="Instagram"><i class="fab fa-instagram"><\/i><\/a>/g,
      new: `<a href="${SOCIAL_LINKS.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>`
    },
    {
      old: /<a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"><\/i><\/a>/g,
      new: `<a href="${SOCIAL_LINKS.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>`
    }
  ];

  patterns.forEach(pattern => {
    if (pattern.old.test(html)) {
      html = html.replace(pattern.old, pattern.new);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(fullPath, html, 'utf8');
    console.log(`  [OK] ${file} links atualizados`);
    return true;
  } else {
    console.log(`  [SKIP] ${file} sem links para atualizar`);
    return false;
  }
}

function main() {
  console.log('Atualizando links das redes sociais no footer...\n');
  
  let updated = 0;
  PAGES.forEach(file => {
    if (updateSocialLinks(file)) updated++;
  });
  
  console.log(`\n✅ ${updated} arquivo(s) atualizado(s)`);
}

main();
