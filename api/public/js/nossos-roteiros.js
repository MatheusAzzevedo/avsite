/**
 * Script da página Nossos Roteiros.
 * Externalizado para compatibilidade com Content-Security-Policy (CSP) - script-src 'self' não permite inline.
 * Envia o formulário abrindo o WhatsApp com nome e mensagem preenchidos.
 */
(function () {
  var form = document.getElementById('roteiros-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nome = document.getElementById('roteiros-nome').value.trim();
    var msg = document.getElementById('roteiros-mensagem').value.trim();
    var text = 'Olá! Gostaria de saber mais sobre os roteiros. Meu nome é ' + encodeURIComponent(nome);
    if (msg) text += '. ' + encodeURIComponent(msg);
    window.open('https://wa.me/553125147884?text=' + text, '_blank', 'noopener,noreferrer');
  });
})();
