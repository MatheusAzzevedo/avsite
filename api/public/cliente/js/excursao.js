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
        const btnDiminuir = document.getElementById('btnDiminuir');
        const btnAumentar = document.getElementById('btnAumentar');

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

        // Listeners para controle de quantidade
        if (quantidade) {
            quantidade.addEventListener('input', calcularTotal);
        }
        
        if (btnDiminuir) {
            btnDiminuir.addEventListener('click', () => {
                const qtdAtual = parseInt(quantidade.value, 10) || 1;
                if (qtdAtual > 1) {
                    quantidade.value = qtdAtual - 1;
                    calcularTotal();
                }
            });
        }
        
        if (btnAumentar) {
            btnAumentar.addEventListener('click', () => {
                const qtdAtual = parseInt(quantidade.value, 10) || 1;
                if (qtdAtual < 50) {
                    quantidade.value = qtdAtual + 1;
                    calcularTotal();
                }
            });
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

    function irParaCheckout() {
        if (!excursao) return;
        const quantidade = parseInt(document.getElementById('quantidade').value, 10) || 1;
        
        if (quantidade < 1) {
            alert('⚠️ A quantidade mínima é 1 pessoa');
            document.getElementById('quantidade').value = 1;
            return;
        }
        
        if (quantidade > 50) {
            alert('⚠️ A quantidade máxima é 50 pessoas por reserva');
            document.getElementById('quantidade').value = 50;
            return;
        }
        
        localStorage.setItem('checkout_excursao', JSON.stringify({ ...excursao, quantidade }));
        window.location.href = 'checkout.html';
    }

    async function init() {
        await clienteAuth.requireAuth();

        const urlParams = new URLSearchParams(window.location.search);
        const codigo = urlParams.get('codigo');

        if (!codigo) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('errorState').style.display = 'block';
            return;
        }

        const btnCheckout = document.getElementById('btnCheckout');
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
                document.getElementById('loading').style.display = 'none';
                document.getElementById('errorState').style.display = 'block';
            }
        } catch (error) {
            console.error('[Excursao] Erro:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('errorState').style.display = 'block';
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
