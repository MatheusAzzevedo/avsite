/**
 * Explicação do Arquivo [contato-form.js]
 *
 * Envia o formulário de contato do site para a API.
 *
 * Antes deste arquivo o formulário não tinha tratamento nenhum: com
 * `action="#"` e `method="post"`, o navegador fazia um POST nativo para a
 * própria URL, o servidor não tinha rota para isso, e o visitante era jogado
 * numa tela com um JSON de erro. Na prática, nenhuma mensagem chegava à Avoar.
 */

(function () {
    'use strict';

    const form = document.getElementById('consultant-form');
    if (!form) return;

    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api'
        : window.location.origin + '/api';

    const botao = form.querySelector('button[type="submit"]');
    const textoOriginal = botao ? botao.textContent : 'Enviar';

    /**
     * Explicação da função [mostrarAviso]
     * Exibe o retorno logo acima do botão, onde o olho já está no momento do
     * envio — em vez de no topo da página, que exigiria rolar para descobrir
     * se deu certo.
     */
    function mostrarAviso(tipo, texto) {
        let aviso = form.querySelector('.form-aviso');
        if (!aviso) {
            aviso = document.createElement('div');
            aviso.className = 'form-aviso';
            aviso.setAttribute('role', 'status');
            aviso.setAttribute('aria-live', 'polite');
            const areaEnvio = form.querySelector('.form-submit');
            areaEnvio.parentNode.insertBefore(aviso, areaEnvio);
        }

        const sucesso = tipo === 'sucesso';
        aviso.style.cssText =
            'margin:0 0 1rem;padding:0.85rem 1rem;border-radius:6px;font-size:0.95rem;line-height:1.5;' +
            (sucesso
                ? 'background:#e6f4ee;border:1px solid #2c6a4c;color:#1d4d37;'
                : 'background:#fdecea;border:1px solid #9c3a26;color:#7c2d18;');
        aviso.textContent = texto;
        aviso.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function limparAviso() {
        const aviso = form.querySelector('.form-aviso');
        if (aviso) aviso.remove();
    }

    form.addEventListener('submit', async function (evento) {
        // Impede o POST nativo para action="#", que era a origem do erro.
        evento.preventDefault();
        limparAviso();

        const dados = Object.fromEntries(new FormData(form).entries());

        if (botao) {
            botao.disabled = true;
            botao.textContent = 'Enviando...';
        }

        try {
            const resposta = await fetch(API_BASE + '/public/contato', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const corpo = await resposta.json().catch(function () { return {}; });

            if (resposta.ok && corpo.success) {
                form.reset();
                mostrarAviso('sucesso', corpo.message || 'Mensagem enviada! Em breve entramos em contato.');
                console.log('[Contato] Mensagem enviada com sucesso');
                return;
            }

            // A API devolve mensagem específica para limite de envio, validação
            // e indisponibilidade; repassá-la é mais útil que um texto genérico.
            mostrarAviso('erro', corpo.message || corpo.error || 'Não foi possível enviar. Tente novamente.');
            console.warn('[Contato] Envio recusado:', resposta.status, corpo);
        } catch (erro) {
            mostrarAviso('erro', 'Não foi possível conectar. Verifique sua internet e tente novamente.');
            console.error('[Contato] Falha de rede:', erro);
        } finally {
            if (botao) {
                botao.disabled = false;
                botao.textContent = textoOriginal;
            }
        }
    });
})();
