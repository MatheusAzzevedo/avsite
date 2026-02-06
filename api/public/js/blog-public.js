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
     * Explicação da função [getTimeAgo]
     * Calcula o tempo decorrido desde uma data.
     * @param {Date} date - Data para calcular
     * @returns {string} Texto do tempo decorrido
     */
    function getTimeAgo(date) {
        var now = new Date();
        var diffMs = now - date;
        var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            var diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) return 'Agora';
            return diffHours + ' hora' + (diffHours > 1 ? 's' : '') + ' atrás';
        }

        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return diffDays + ' dias atrás';
        if (diffDays < 30) {
            var weeks = Math.floor(diffDays / 7);
            return weeks + ' semana' + (weeks > 1 ? 's' : '') + ' atrás';
        }

        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var year = date.getFullYear();
        return day + '/' + month + '/' + year;
    }

    /**
     * Explicação da função [loadBlogPosts]
     * Carrega os posts publicados via API e renderiza na página.
     */
    async function loadBlogPosts() {
        console.log('[Blog] Carregando posts publicados...');

        if (typeof BlogManager === 'undefined') {
            setTimeout(loadBlogPosts, 100);
            return;
        }

        var grid = document.getElementById('blogGrid');
        var loadingState = document.getElementById('loadingState');
        var emptyState = document.getElementById('emptyState');

        try {
            var posts = await BlogManager.getAll(true);
            if (!Array.isArray(posts)) posts = [];
        } catch (err) {
            console.error('[Blog] Erro ao carregar posts:', err);
            posts = [];
        }

        if (loadingState) loadingState.remove();

        if (!posts || posts.length === 0) {
            if (grid) grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = posts.map(function(post) {
            var postDate = new Date(post.data);
            var timeAgo = getTimeAgo(postDate);
            var image = post.imagemCapa || 'images/resource/news-1.jpg';
            var titulo = escapeHtml(post.titulo);
            var cat = escapeHtml(post.categoria);
            var slug = (post.slug || '').replace(/'/g, '\\\'');
            return '<div class="news-block col-xl-4 col-lg-6 col-md-6 col-sm-12">' +
                '<div class="inner-box">' +
                '<div class="image-box">' +
                '<a href="blog-single.html?slug=' + encodeURIComponent(post.slug || '') + '">' +
                '<img src="' + escapeHtml(image) + '" alt="' + titulo + '" onerror="this.src=\'images/Imagens%20para%20o%20site/IMG-20250910-WA0076.jpg\'">' +
                '</a></div>' +
                '<div class="lower">' +
                '<h4><a href="blog-single.html?slug=' + encodeURIComponent(post.slug || '') + '">' + titulo + '</a></h4>' +
                '<div class="info">' +
                '<div class="cat i-block"><i class="far fa-folder"></i> ' + cat + '</div>' +
                '<div class="time i-block"><i class="far fa-clock"></i> ' + timeAgo + '</div>' +
                '</div>' +
                '<div class="link-box">' +
                '<a href="blog-single.html?slug=' + encodeURIComponent(post.slug || '') + '" class="theme-btn">continuar lendo <i class="far fa-long-arrow-alt-right"></i></a>' +
                '</div></div></div>';
        }).join('');
    }

    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(loadBlogPosts, 200);
    });
})();
