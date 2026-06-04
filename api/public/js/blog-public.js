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
            
            const authorName = escapeHtml(post.autor && post.autor.nome ? post.autor.nome : (post.author && post.author.name ? post.author.name : 'Sem Autor'));
            
            let avatarHtml = '';
            if (post.autor && post.autor.foto) {
                avatarHtml = '<img src="' + post.autor.foto + '" alt="' + authorName + '" class="author-avatar">';
            } else {
                const avatarInitials = authorName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                avatarHtml = '<h3>' + avatarInitials + '</h3>';
            }

            return '<div class="news-block col-lg-4 col-md-6 col-sm-12">' +
                '<div class="inner-box blog-custom-card">' +
                    '<div class="upper-info">' +
                        '<h5><a href="blog-single.html?slug=' + slugEncoded + '">' + titulo + '</a></h5>' +
                        (resumo ? '<p class="post-resumo">' + resumo + '</p>' : '') +
                        '<div class="info">' +
                           '<div class="cat i-block"><i class="far fa-folder"></i> ' + cat + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="upper">' +
                        '<a href="blog-single.html?slug=' + slugEncoded + '">' +
                            '<img src="' + imageSrc + '" alt="' + titulo + '" class="post-img">' +
                        '</a>' +
                    '</div>' +
                    '<div class="avatar-area-custom">' +
                        avatarHtml +
                    '</div>' +
                    '<div class="lower">' +
                        '<h5 class="author-name">' + authorName + '</h5>' +
                        '<p class="author-role">Autor</p>' +
                        '<div class="link-box">' +
                            '<a href="blog-single.html?slug=' + slugEncoded + '" class="theme-btn btn-continuar">Continuar lendo <i class="fas fa-arrow-right"></i></a>' +
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
