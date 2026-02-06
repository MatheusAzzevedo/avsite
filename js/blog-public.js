/**
 * Script da página pública do blog (blog.html).
 * Externalizado para compatibilidade com Content-Security-Policy (CSP) - script-src 'self'.
 * Carrega os posts publicados via API (BlogManager.getAll(true)) e renderiza no grid.
 */

(function() {
    'use strict';

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Explicação da função [loadBlogPosts]
     * Carrega os posts publicados via API e renderiza na página.
     */
    async function loadBlogPosts() {
        console.log('[Blog] Carregando posts publicados...');

        if (typeof BlogManager === 'undefined') {
            console.log('[Blog] BlogManager não disponível, aguardando...');
            setTimeout(loadBlogPosts, 100);
            return;
        }

        var grid = document.getElementById('blogGrid');
        var loadingState = document.getElementById('loadingState');
        var emptyState = document.getElementById('emptyState');

        var posts = [];
        try {
            posts = await BlogManager.getAll(true);
            console.log('[Blog] Posts recebidos da API:', posts);
            if (!Array.isArray(posts)) {
                console.warn('[Blog] Resposta não é array:', posts);
                posts = [];
            }
        } catch (err) {
            console.error('[Blog] Erro ao carregar posts:', err);
            posts = [];
        }

        if (loadingState) loadingState.remove();

        console.log('[Blog] Total de posts:', posts.length);

        if (!posts || posts.length === 0) {
            if (grid) grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        console.log('[Blog] Renderizando', posts.length, 'posts...');

        grid.innerHTML = posts.map(function(post) {
            var titulo = escapeHtml(post.titulo);
            var cat = escapeHtml(post.categoria);
            var resumo = post.resumo ? escapeHtml(post.resumo.substring(0, 120)) + '...' : '';
            var imageSrc = (post.imagemCapa || 'images/resource/news-1.jpg').replace(/"/g, '&quot;');
            var slugEncoded = encodeURIComponent(post.slug || '');

            return '<div class="news-block col-xl-4 col-lg-6 col-md-6 col-sm-12">' +
                '<div class="inner-box">' +
                    '<div class="image-box">' +
                        '<a href="blog-single.html?slug=' + slugEncoded + '">' +
                            '<img src="' + imageSrc + '" alt="' + titulo + '" class="post-img">' +
                        '</a>' +
                    '</div>' +
                    '<div class="lower">' +
                        '<h4><a href="blog-single.html?slug=' + slugEncoded + '">' + titulo + '</a></h4>' +
                        (resumo ? '<p style="color: rgba(255,255,255,0.6); font-size: 0.875rem; margin-bottom: 10px;">' + resumo + '</p>' : '') +
                        '<div class="info">' +
                            '<div class="cat i-block"><i class="far fa-folder"></i> ' + cat + '</div>' +
                        '</div>' +
                        '<div class="link-box">' +
                            '<a href="blog-single.html?slug=' + slugEncoded + '" class="theme-btn">continuar lendo <i class="far fa-long-arrow-alt-right"></i></a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        // Fallback de imagem via addEventListener (compatível com CSP)
        document.querySelectorAll('#blogGrid .post-img').forEach(function(img) {
            img.addEventListener('error', function() {
                this.src = 'images/resource/news-1.jpg';
            });
        });

        console.log('[Blog] Posts renderizados com sucesso!');
    }

    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(loadBlogPosts, 200);
    });
})();
