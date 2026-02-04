/**
 * Script para carregar o rodapé dinamicamente em todas as páginas
 * Insere o footer antes do fechamento da tag body
 */

document.addEventListener('DOMContentLoaded', function() {
  // Determinar o caminho correto do footer baseado na localização da página
  const currentPath = window.location.pathname;
  const isPublic = currentPath.includes('/admin/') ? false : true;
  
  // Determinar o caminho relativo do footer
  let footerPath = 'includes/footer.html';
  
  // Se estivermos em uma página do admin, ajustar o caminho
  if (currentPath.includes('/admin/')) {
    footerPath = '../includes/footer.html';
  }
  
  // Fetch e inserir o footer
  fetch(footerPath)
    .then(response => {
      if (!response.ok) {
        // Se não encontrar, tente outro caminho (para fallback)
        throw new Error('Footer não encontrado em ' + footerPath);
      }
      return response.text();
    })
    .then(html => {
      // Criar um elemento temporário para armazenar o HTML
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      // Obter o elemento footer
      const footer = temp.querySelector('footer');
      
      if (footer) {
        // Inserir o footer antes do fechamento da tag body
        // Se houver um elemento site-container, inserir após ele; senão, no final do body
        const siteContainer = document.querySelector('.site-container');
        if (siteContainer) {
          siteContainer.appendChild(footer);
        } else {
          document.body.appendChild(footer);
        }
      }
    })
    .catch(error => {
      console.warn('Erro ao carregar footer:', error);
      // Não exibir erro para o usuário - apenas log no console
    });
});
