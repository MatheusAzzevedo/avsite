/**
 * Script da página Gerenciar Blog (admin/blog.html).
 * Externalizado para compatibilidade com Content-Security-Policy (CSP) - script-src 'self'.
 * Usa BlogManager do api-client.js (API) com chamadas assíncronas.
 */

(function() {
    'use strict';

    function escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDateBR(dateValue) {
        if (!dateValue) return '-';
        return typeof window.formatDate === 'function'
            ? window.formatDate(dateValue)
            : new Date(dateValue).toLocaleDateString('pt-BR');
    }

    /**
     * Explicação da função [renderPosts]
     * Renderiza a lista de posts na tabela HTML.
     * @param {Array} posts - Lista de posts a renderizar
     */
    function renderPosts(posts) {
        const tbody = document.getElementById('postsTableBody');
        const emptyState = document.getElementById('emptyState');
        const postCount = document.getElementById('postCount');
        if (!tbody || !postCount) return;

        postCount.textContent = (posts && posts.length) ? posts.length : 0;

        if (!posts || posts.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = posts.map(function(post) {
            var titulo = escapeHtml(post.titulo);
            var resumo = post.resumo ? escapeHtml(post.resumo.substring(0, 60) + '...') : 'Sem resumo';
            var autor = escapeHtml(post.autor);
            var dataStr = formatDateBR(post.data);
            var cat = capitalizeFirst(post.categoria);
            var statusNorm = (post.status || '').toUpperCase();
            var statusClass = statusNorm === 'PUBLICADO' ? 'badge-success' : 'badge-warning';
            var statusLabel = statusNorm === 'PUBLICADO' ? 'Publicado' : 'Rascunho';
            var tituloAttr = escapeHtml(post.titulo).replace(/'/g, "\\'");
            return '<tr data-id="' + post.id + '">' +
                '<td><strong>' + titulo + '</strong><br><span style="color: var(--text-light); font-size: 0.875rem;">' + resumo + '</span></td>' +
                '<td>' + autor + '</td>' +
                '<td>' + dataStr + '</td>' +
                '<td><span class="badge badge-info">' + cat + '</span></td>' +
                '<td><span class="badge ' + statusClass + '">' + statusLabel + '</span></td>' +
                '<td><div class="table-actions">' +
                '<button class="btn btn-sm btn-secondary" onclick="window.editPost(\'' + post.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-info" onclick="window.viewPost(\'' + escapeHtml(post.slug || '') + '\')" title="Visualizar"><i class="fas fa-eye"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="window.deletePost(\'' + post.id + '\', \'' + tituloAttr + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    }

    /**
     * Explicação da função [loadPosts]
     * Carrega todos os posts via API e renderiza na tabela.
     */
    async function loadPosts() {
        console.log('[Blog Admin] Carregando posts...');
        var tbody = document.getElementById('postsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Carregando...</td></tr>';
        try {
            var posts = await BlogManager.getAll();
            if (!Array.isArray(posts)) posts = [];
            renderPosts(posts);
        } catch (err) {
            console.error('[Blog Admin] Erro ao carregar posts:', err);
            if (typeof showToast === 'function') showToast('Erro ao carregar posts. Tente novamente.', 'error');
            renderPosts([]);
        }
    }

    /**
     * Explicação da função [filterPosts]
     * Filtra os posts já carregados por busca, status e categoria (client-side).
     */
    async function filterPosts() {
        var searchTerm = (document.getElementById('searchPosts') && document.getElementById('searchPosts').value) ? document.getElementById('searchPosts').value.toLowerCase() : '';
        var statusFilter = (document.getElementById('filterStatus') && document.getElementById('filterStatus').value) || 'todos';
        var categoriaFilter = (document.getElementById('filterCategoria') && document.getElementById('filterCategoria').value) || 'todos';

        var posts;
        try {
            posts = await BlogManager.getAll();
        } catch (err) {
            posts = [];
        }
        if (!Array.isArray(posts)) posts = [];

        if (searchTerm) {
            posts = posts.filter(function(p) {
                var tit = (p.titulo || '').toLowerCase();
                var res = (p.resumo || '').toLowerCase();
                var aut = (p.autor || '').toLowerCase();
                return tit.includes(searchTerm) || res.includes(searchTerm) || aut.includes(searchTerm);
            });
        }
        if (statusFilter !== 'todos') {
            posts = posts.filter(function(p) {
                var s = (p.status || '').toUpperCase();
                return (statusFilter === 'publicado' && s === 'PUBLICADO') || (statusFilter === 'rascunho' && s === 'RASCUNHO');
            });
        }
        if (categoriaFilter !== 'todos') {
            posts = posts.filter(function(p) { return p.categoria === categoriaFilter; });
        }

        renderPosts(posts);
    }

    function editPost(postId) {
        window.location.href = 'blog-editor.html?id=' + encodeURIComponent(postId);
    }

    function viewPost(slug) {
        window.open('../blog-single.html?slug=' + encodeURIComponent(slug || ''), '_blank');
    }

    /**
     * Explicação da função [deletePost]
     * Exclui um post via API após confirmação.
     */
    function deletePost(postId, postTitle) {
        if (typeof confirmDelete !== 'function') {
            if (confirm('Excluir "' + postTitle + '"?')) doDelete();
            return;
        }
        confirmDelete(postTitle, function() { doDelete(); });

        async function doDelete() {
            try {
                var success = await BlogManager.delete(postId);
                if (success) {
                    if (typeof showToast === 'function') showToast('Post excluído com sucesso!', 'success');
                    var row = document.querySelector('tr[data-id="' + postId + '"]');
                    if (row) {
                        row.style.animation = 'slideOutRight 0.3s ease';
                        setTimeout(function() { loadPosts(); }, 300);
                    } else {
                        loadPosts();
                    }
                } else {
                    if (typeof showToast === 'function') showToast('Erro ao excluir post.', 'error');
                }
            } catch (err) {
                console.error('[Blog Admin] Erro ao excluir:', err);
                if (typeof showToast === 'function') showToast('Erro ao excluir post.', 'error');
            }
        }
    }

    window.loadPosts = loadPosts;
    window.filterPosts = filterPosts;
    window.editPost = editPost;
    window.viewPost = viewPost;
    window.deletePost = deletePost;

    function initSidebarToggle() {
        var toggle = document.getElementById('sidebarToggle');
        if (window.innerWidth <= 768 && toggle) toggle.style.display = 'inline-block';
        window.addEventListener('resize', function() {
            if (toggle) toggle.style.display = window.innerWidth <= 768 ? 'inline-block' : 'none';
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        initSidebarToggle();
        loadPosts();
    });
})();
