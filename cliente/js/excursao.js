/**
 * Página de detalhes da excursão - carrega por código e exibe; checkout.
 * Script externalizado para compatibilidade com Content-Security-Policy (CSP).
 */

(function () {
    let excursao = null;

    function exibirExcursao(exc) {
        const img = document.getElementById('excursaoImage');
        const titulo = document.getElementById('excursaoTitulo');
        const subtitulo = document.getElementById('excursaoSubtitulo');
        const preco = document.getElementById('excursaoPreco');
        const local = document.getElementById('excursaoLocal');
        const duracao = document.getElementById('excursaoDuracao');
        const horario = document.getElementById('excursaoHorario');
        const descricao = document.getElementById('excursaoDescricao');
        const loading = document.getElementById('loading');
        const content = document.getElementById('content');
        const quantidade = document.getElementById('quantidade');
        const valorTotal = document.getElementById('valorTotal');

        if (img) img.src = exc.imagemCapa || '/images/default.jpg';
        if (titulo) titulo.textContent = exc.titulo;
        if (subtitulo) subtitulo.textContent = exc.subtitulo || '';
        if (preco) preco.textContent = exc.preco.toFixed(2);
        if (local) local.textContent = exc.local || 'Não informado';
        if (duracao) duracao.textContent = exc.duracao || 'Não informado';
        if (horario) horario.textContent = exc.horario || 'Não informado';
        if (descricao) descricao.innerHTML = exc.descricao || '';

        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'block';

        if (quantidade) {
            quantidade.addEventListener('input', calcularTotal);
        }
        calcularTotal();
    }

    function calcularTotal() {
        if (!excursao) return;
        const qtd = parseInt(document.getElementById('quantidade').value, 10) || 1;
        const total = excursao.preco * qtd;
        const el = document.getElementById('valorTotal');
        if (el) el.textContent = total.toFixed(2);
    }

    /**
     * Extrai apenas os campos essenciais para o checkout, evitando QuotaExceededError.
     * localStorage tem limite ~5MB; imagens base64 e textos longos excedem facilmente.
     */
    function payloadCheckout(exc, qtd) {
        var trunc = function (s, max) {
            if (!s || typeof s !== 'string') return s || '';
            return s.length > max ? s.substring(0, max) : s;
        };
        return {
            codigo: exc.codigo,
            quantidade: qtd,
            preco: exc.preco,
            titulo: exc.titulo || '',
            subtitulo: trunc(exc.subtitulo, 200),
            descricao: trunc(exc.descricao, 2000),
            inclusos: trunc(exc.inclusos, 2000),
            recomendacoes: trunc(exc.recomendacoes, 2000),
            local: trunc(exc.local, 200),
            horario: trunc(exc.horario, 100)
        };
    }

    function irParaCheckout() {
        if (!excursao) return;
        const quantidade = parseInt(document.getElementById('quantidade').value, 10) || 1;
        if (quantidade < 1 || quantidade > 50) {
            alert('Quantidade inválida');
            return;
        }
        try {
            var payload = payloadCheckout(excursao, quantidade);
            localStorage.setItem('checkout_excursao', JSON.stringify(payload));
            window.location.href = 'checkout.html';
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('[Excursao] localStorage cheio. Limpe dados do site e tente novamente.');
                alert('Não foi possível prosseguir. O armazenamento do navegador está cheio. Tente limpar dados do site e recarregar.');
            } else {
                throw e;
            }
        }
    }

    async function init() {
        await clienteAuth.requireAuth();

        const urlParams = new URLSearchParams(window.location.search);
        const codigo = urlParams.get('codigo');

        if (!codigo) {
            alert('Código não fornecido');
            window.location.href = 'dashboard.html';
            return;
        }

        const btnCheckout = document.querySelector('.btn-checkout');
        if (btnCheckout) {
            btnCheckout.addEventListener('click', irParaCheckout);
        }

        try {
            const response = await fetch(`/api/cliente/pedidos/excursao/${encodeURIComponent(codigo)}`);
            const data = await response.json();

            if (response.ok && data.success) {
                excursao = data.data;
                exibirExcursao(excursao);
            } else {
                alert('Excursão não encontrada');
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('[Excursao] Erro:', error);
            alert('Erro ao carregar excursão');
        }
    }

    if (typeof clienteAuth !== 'undefined') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof clienteAuth !== 'undefined') init();
        });
    }
})();
