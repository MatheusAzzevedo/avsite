/**
 * Script da página pública de post único (blog-single.html).
 * Externalizado para compatibilidade com Content-Security-Policy (CSP) - script-src 'self'.
 */

(function() {
    'use strict';

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDate(dateString) {
        var date = new Date(dateString);
        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var year = date.getFullYear();
        return day + '/' + month + '/' + year;
    }

    /**
     * Explicação da função [loadPost]
     * Carrega um post pela API (BlogManager.getBySlug). Exibe erro se não encontrado ou não publicado.
     */
    async function loadPost() {
        console.log('[Blog Single] Carregando post...');

        if (typeof BlogManager === 'undefined') {
            setTimeout(loadPost, 100);
            return;
        }

        var urlParams = new URLSearchParams(window.location.search);
        var slug = urlParams.get('slug');

        var loadingState = document.getElementById('loadingState');
        var postContent = document.getElementById('postContent');
        var errorState = document.getElementById('errorState');

        if (!slug) {
            if (loadingState) loadingState.style.display = 'none';
            if (errorState) errorState.style.display = 'block';
            return;
        }

        var post;
        try {
            post = await BlogManager.getBySlug(slug);
        } catch (err) {
            console.error('[Blog Single] Erro ao carregar post:', err);
            if (loadingState) loadingState.style.display = 'none';
            if (errorState) errorState.style.display = 'block';
            return;
        }

        if (!post || (post.status || '').toUpperCase() !== 'PUBLICADO') {
            if (loadingState) loadingState.style.display = 'none';
            if (errorState) errorState.style.display = 'block';
            return;
        }

        document.getElementById('pageTitle').textContent = post.titulo + ' - Avorar Turismo';
        document.getElementById('breadcrumbTitle').textContent = post.titulo;
        document.getElementById('postTitle').textContent = post.titulo;
        document.getElementById('postCategory').textContent = capitalizeFirst(post.categoria);
        document.getElementById('postDate').textContent = formatDate(post.data);
        document.getElementById('postAuthor').textContent = post.autor;
        document.getElementById('postBody').innerHTML = post.conteudo || '';

        if (post.imagemCapa) {
            document.getElementById('postImage').src = post.imagemCapa;
            document.getElementById('postImage').alt = post.titulo;
        }

        if (post.tags && post.tags.length > 0) {
            document.getElementById('postTags').style.display = 'block';
            document.getElementById('tagsContainer').innerHTML = post.tags
                .map(function(tag) { return '<a href="blog.html">' + escapeHtml(tag) + '</a>'; })
                .join(', &ensp; ');
        }

        if (loadingState) loadingState.style.display = 'none';
        if (postContent) postContent.style.display = 'block';

        loadRecentPosts(post.id);
    }

    /**
     * Explicação da função [loadRecentPosts]
     * Carrega os posts recentes via API para a sidebar.
     * @param {string} excludeId - ID do post atual para excluir da lista
     */
    async function loadRecentPosts(excludeId) {
        var posts = [];
        try {
            posts = await BlogManager.getAll(true);
            if (!Array.isArray(posts)) posts = [];
        } catch (e) {
            posts = [];
        }
        posts = posts.filter(function(p) { return p.id !== excludeId; }).slice(0, 3);

        var container = document.getElementById('recentPosts');
        if (!container) return;

        if (posts.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center;">Nenhum outro post disponível</p>';
            return;
        }

        container.innerHTML = posts.map(function(post) {
            var image = post.imagemCapa || 'images/Imagens%20para%20o%20site/IMG-20250910-WA0091.jpg';
            var date = formatDate(post.data);
            var titulo = escapeHtml(post.titulo);
            var slug = encodeURIComponent(post.slug || '');
            return '<div class="post">' +
                '<div class="inner">' +
                '<div class="image">' +
                '<a href="blog-single.html?slug=' + slug + '">' +
                '<img src="' + image + '" alt="' + titulo + '" onerror="this.src=\'images/Imagens%20para%20o%20site/IMG-20250910-WA0091.jpg\'" style="width: 80px; height: 60px; object-fit: cover;">' +
                '</a></div>' +
                '<div class="date"><span>' + date + '</span></div>' +
                '<div class="text"><a href="blog-single.html?slug=' + slug + '">' + titulo + '</a></div>' +
                '</div></div>';
        }).join('');
    }

    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(loadPost, 200);
    });
})();
