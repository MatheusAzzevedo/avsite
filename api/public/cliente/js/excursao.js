/**
 * Página de detalhes da excursão - carrega por código e exibe com design premium
 * Script externalizado para compatibilidade com Content-Security-Policy (CSP).
 */

(function () {
    let excursao = null;

    function exibirExcursao(exc) {
        // Elementos gerais
        const mainImage = document.getElementById('mainImage');
        const breadcrumbTitle = document.getElementById('breadcrumbTitle');
        const titulo = document.getElementById('excursaoTitulo');
        const subtitulo = document.getElementById('excursaoSubtitulo');
        const duracao = document.getElementById('excursaoDuracao');
        const local = document.getElementById('excursaoLocal');
        const horario = document.getElementById('excursaoHorario');
        const preco = document.getElementById('excursaoPreco');
        
        // Tabs e descritivos
        const descricao = document.getElementById('excursaoDescricao');
        const inclusos = document.getElementById('excursaoInclusos');
        const recomendacoes = document.getElementById('excursaoRecomendacoes');
        
        // Info grid
        const infoLocal = document.getElementById('infoLocal');
        const infoHorario = document.getElementById('infoHorario');
        const infoDuracao = document.getElementById('infoDuracao');
        
        // Controles
        const quantidade = document.getElementById('quantity');
        const btnDiminuir = document.getElementById('btnDiminuir');
        const btnAumentar = document.getElementById('btnAumentar');
        const loadingState = document.getElementById('loadingState');
        const contentDiv = document.getElementById('excursaoContent');

        // Preencher dados
        if (mainImage) mainImage.src = exc.imagemCapa || '/images/default.jpg';
        if (breadcrumbTitle) breadcrumbTitle.textContent = exc.titulo;
        if (titulo) titulo.textContent = exc.titulo;
        if (subtitulo) subtitulo.textContent = exc.subtitulo || '';
        if (duracao) duracao.textContent = exc.duracao || 'Não informado';
        if (local) local.textContent = exc.local || 'Não informado';
        if (horario) horario.textContent = exc.horario || 'Não informado';
        if (preco) preco.textContent = 'R$ ' + exc.preco.toFixed(2).replace('.', ',');
        
        if (descricao) descricao.innerHTML = exc.descricao || '<p>Descrição não disponível</p>';
        if (inclusos) inclusos.innerHTML = exc.inclusos || '<p>Inclusos não informados</p>';
        if (recomendacoes) recomendacoes.innerHTML = exc.recomendacoes || '<p>Recomendações não informadas</p>';
        
        if (infoLocal) infoLocal.textContent = exc.local || 'Não informado';
        if (infoHorario) infoHorario.textContent = exc.horario || 'Não informado';
        if (infoDuracao) infoDuracao.textContent = exc.duracao || 'Não informado';

        // Carregar galeria (se houver múltiplas imagens)
        const galleryThumbs = document.getElementById('galleryThumbs');
        if (galleryThumbs && exc.imagemCapa) {
            galleryThumbs.innerHTML = `<img src="${exc.imagemCapa}" alt="Galeria" class="thumb active">`;
        }

        // Mostrar conteúdo e esconder loading
        if (loadingState) loadingState.style.display = 'none';
        if (contentDiv) contentDiv.style.display = 'block';

        // Event listeners para quantidade
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
        
        // Configurar tabs
        setupTabs();
        
        // Calcular total inicial
        calcularTotal();
    }

    function calcularTotal() {
        if (!excursao) return;
        const qtd = parseInt(document.getElementById('quantity').value, 10) || 1;
        // Nota: Atualizamos apenas o display, o valor total será calculado no checkout
    }

    /**
     * Extrai apenas os campos essenciais para o checkout, evitando QuotaExceededError.
     * localStorage tem limite ~5MB; imagens base64 e textos longos excedem facilmente.
     * Campos excluídos: imagemCapa, imagemPrincipal, galeria, id, slug, etc.
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
        const quantidade = parseInt(document.getElementById('quantity').value, 10) || 1;
        
        if (quantidade < 1) {
            alert('⚠️ A quantidade mínima é 1 pessoa');
            document.getElementById('quantity').value = 1;
            return;
        }
        
        if (quantidade > 50) {
            alert('⚠️ A quantidade máxima é 50 pessoas por reserva');
            document.getElementById('quantity').value = 50;
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

    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                
                // Remover classe active de todos os botões e painéis
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));
                
                // Adicionar classe active ao botão e painel clicados
                btn.classList.add('active');
                const activePanel = document.getElementById(`tab-${tabName}`);
                if (activePanel) {
                    activePanel.classList.add('active');
                }
            });
        });
    }

    async function init() {
        await clienteAuth.requireAuth();

        const urlParams = new URLSearchParams(window.location.search);
        const codigo = urlParams.get('codigo');

        if (!codigo) {
            document.getElementById('loadingState').style.display = 'none';
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
                console.error('[Excursao] Resposta de erro:', data);
                document.getElementById('loadingState').style.display = 'none';
                document.getElementById('errorState').style.display = 'block';
            }
        } catch (error) {
            console.error('[Excursao] Erro ao carregar:', error);
            document.getElementById('loadingState').style.display = 'none';
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
