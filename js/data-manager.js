// ============================================
// SISTEMA DE GERENCIAMENTO DE DADOS - AVORAR
// Gerencia Blog, Excursões e Configurações
// ============================================

/**
 * Explicação do Arquivo [data-manager.js]
 * 
 * Sistema centralizado de gerenciamento de dados que utiliza localStorage
 * para persistência. Fornece CRUD completo para:
 * - Posts do Blog
 * - Excursões
 * - Configurações de Pagamento (Asaas, Mercado Pago, Stripe)
 * 
 * O sistema gera IDs únicos, mantém timestamps de criação/atualização
 * e fornece métodos de busca e filtro.
 */

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Explicação da função [generateId]
 * Gera um ID único combinando timestamp com string aleatória.
 * Formato: timestamp-randomstring (ex: 1706540400000-abc123def)
 * @returns {string} ID único
 */
function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Explicação da função [formatDateBR]
 * Converte uma data para formato brasileiro (DD/MM/YYYY)
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada
 */
function formatDateBR(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Explicação da função [formatDateISO]
 * Converte uma data para formato ISO (YYYY-MM-DD)
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada
 */
function formatDateISO(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

/**
 * Explicação da função [slugify]
 * Converte um texto em slug para URLs amigáveis
 * Remove acentos, espaços e caracteres especiais
 * @param {string} text - Texto a ser convertido
 * @returns {string} Slug
 */
function slugify(text) {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

// ============================================
// GERENCIADOR DE DADOS BASE
// ============================================

const DataManager = {
    /**
     * Salva dados no localStorage
     * @param {string} key - Chave de armazenamento
     * @param {any} value - Valor a ser salvo
     */
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            console.log(`[DataManager] Dados salvos em '${key}'`);
            return true;
        } catch (error) {
            console.error(`[DataManager] Erro ao salvar '${key}':`, error);
            return false;
        }
    },

    /**
     * Recupera dados do localStorage
     * @param {string} key - Chave de armazenamento
     * @param {any} defaultValue - Valor padrão se não existir
     * @returns {any} Dados recuperados ou valor padrão
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`[DataManager] Erro ao recuperar '${key}':`, error);
            return defaultValue;
        }
    },

    /**
     * Remove dados do localStorage
     * @param {string} key - Chave a ser removida
     */
    remove(key) {
        localStorage.removeItem(key);
        console.log(`[DataManager] Dados removidos de '${key}'`);
    }
};

// ============================================
// GERENCIADOR DE BLOG
// ============================================

/**
 * Explicação do objeto [BlogManager]
 * 
 * Gerencia todas as operações CRUD para posts do blog.
 * Armazena dados no localStorage com a chave 'avorar_blog_posts'.
 * 
 * Estrutura de um post:
 * {
 *   id: string,
 *   titulo: string,
 *   slug: string,
 *   autor: string,
 *   data: string (ISO),
 *   categoria: string,
 *   status: 'publicado' | 'rascunho',
 *   imagemCapa: string (base64 ou URL),
 *   resumo: string,
 *   conteudo: string (HTML),
 *   tags: string[],
 *   criadoEm: string (ISO),
 *   atualizadoEm: string (ISO)
 * }
 */
const BlogManager = {
    STORAGE_KEY: 'avorar_blog_posts',

    /**
     * Inicializa o blog com dados de exemplo se estiver vazio
     */
    init() {
        const posts = this.getAll();
        if (posts.length === 0) {
            this._seedData();
        }
        console.log(`[BlogManager] Inicializado com ${this.getAll().length} posts`);
    },

    /**
     * Retorna todos os posts
     * @param {boolean} onlyPublished - Se true, retorna apenas publicados
     * @returns {Array} Lista de posts
     */
    getAll(onlyPublished = false) {
        const posts = DataManager.get(this.STORAGE_KEY, []);
        if (onlyPublished) {
            return posts.filter(p => p.status === 'publicado');
        }
        return posts;
    },

    /**
     * Busca um post por ID
     * @param {string} id - ID do post
     * @returns {Object|null} Post encontrado ou null
     */
    getById(id) {
        const posts = this.getAll();
        return posts.find(p => p.id === id) || null;
    },

    /**
     * Busca um post por slug
     * @param {string} slug - Slug do post
     * @returns {Object|null} Post encontrado ou null
     */
    getBySlug(slug) {
        const posts = this.getAll();
        return posts.find(p => p.slug === slug) || null;
    },

    /**
     * Cria um novo post
     * @param {Object} postData - Dados do post
     * @returns {Object} Post criado
     */
    create(postData) {
        const posts = this.getAll();
        const now = new Date().toISOString();
        
        const newPost = {
            id: generateId(),
            titulo: postData.titulo || '',
            slug: slugify(postData.titulo || 'post-' + Date.now()),
            autor: postData.autor || 'Admin',
            data: postData.data || formatDateISO(new Date()),
            categoria: postData.categoria || 'turismo',
            status: postData.status || 'rascunho',
            imagemCapa: postData.imagemCapa || '',
            resumo: postData.resumo || '',
            conteudo: postData.conteudo || '',
            tags: postData.tags || [],
            criadoEm: now,
            atualizadoEm: now
        };

        posts.unshift(newPost);
        DataManager.save(this.STORAGE_KEY, posts);
        console.log(`[BlogManager] Post criado: ${newPost.id}`);
        return newPost;
    },

    /**
     * Atualiza um post existente
     * @param {string} id - ID do post
     * @param {Object} postData - Dados a atualizar
     * @returns {Object|null} Post atualizado ou null se não encontrado
     */
    update(id, postData) {
        const posts = this.getAll();
        const index = posts.findIndex(p => p.id === id);
        
        if (index === -1) {
            console.error(`[BlogManager] Post não encontrado: ${id}`);
            return null;
        }

        const updatedPost = {
            ...posts[index],
            ...postData,
            id: posts[index].id,
            criadoEm: posts[index].criadoEm,
            atualizadoEm: new Date().toISOString()
        };

        // Atualiza slug se o título mudou
        if (postData.titulo && postData.titulo !== posts[index].titulo) {
            updatedPost.slug = slugify(postData.titulo);
        }

        posts[index] = updatedPost;
        DataManager.save(this.STORAGE_KEY, posts);
        console.log(`[BlogManager] Post atualizado: ${id}`);
        return updatedPost;
    },

    /**
     * Exclui um post
     * @param {string} id - ID do post
     * @returns {boolean} True se excluído com sucesso
     */
    delete(id) {
        const posts = this.getAll();
        const filteredPosts = posts.filter(p => p.id !== id);
        
        if (filteredPosts.length === posts.length) {
            console.error(`[BlogManager] Post não encontrado para exclusão: ${id}`);
            return false;
        }

        DataManager.save(this.STORAGE_KEY, filteredPosts);
        console.log(`[BlogManager] Post excluído: ${id}`);
        return true;
    },

    /**
     * Busca posts por termo
     * @param {string} term - Termo de busca
     * @returns {Array} Posts que correspondem à busca
     */
    search(term) {
        const posts = this.getAll();
        const lowerTerm = term.toLowerCase();
        return posts.filter(p => 
            p.titulo.toLowerCase().includes(lowerTerm) ||
            p.resumo.toLowerCase().includes(lowerTerm) ||
            p.conteudo.toLowerCase().includes(lowerTerm) ||
            p.tags.some(tag => tag.toLowerCase().includes(lowerTerm))
        );
    },

    /**
     * Filtra posts por categoria
     * @param {string} categoria - Categoria para filtrar
     * @returns {Array} Posts da categoria
     */
    filterByCategory(categoria) {
        const posts = this.getAll();
        return posts.filter(p => p.categoria === categoria);
    },

    /**
     * Filtra posts por status
     * @param {string} status - Status para filtrar
     * @returns {Array} Posts com o status
     */
    filterByStatus(status) {
        const posts = this.getAll();
        return posts.filter(p => p.status === status);
    },

    /**
     * Retorna posts recentes
     * @param {number} limit - Quantidade de posts
     * @returns {Array} Posts mais recentes
     */
    getRecent(limit = 5) {
        const posts = this.getAll(true);
        return posts.slice(0, limit);
    },

    /**
     * Dados iniciais de exemplo
     */
    _seedData() {
        const samplePosts = [
            {
                titulo: 'Explorando Angra dos Reis',
                autor: 'Administrador',
                data: '2026-01-25',
                categoria: 'turismo',
                status: 'publicado',
                imagemCapa: 'images/resource/news-1.jpg',
                resumo: 'Descubra as maravilhas naturais desta região paradisíaca do Rio de Janeiro.',
                conteudo: '<h2>Um Paraíso Natural</h2><p>Angra dos Reis é um dos destinos mais procurados do Brasil, com suas 365 ilhas e mais de 2000 praias. Cada visita revela novas surpresas e paisagens deslumbrantes.</p><h3>O que fazer em Angra</h3><ul><li>Passeios de barco pelas ilhas</li><li>Mergulho nas águas cristalinas</li><li>Trilhas ecológicas</li><li>Visita às praias desertas</li></ul><p>Venha conhecer este paraíso conosco!</p>',
                tags: ['turismo', 'aventura', 'angra dos reis', 'praias']
            },
            {
                titulo: 'Biologia Marinha em Angra',
                autor: 'Administrador',
                data: '2026-01-22',
                categoria: 'natureza',
                status: 'publicado',
                imagemCapa: 'images/resource/news-2.jpg',
                resumo: 'Um mergulho no mundo subaquático e na rica biodiversidade marinha da região.',
                conteudo: '<h2>Descobrindo a Vida Marinha</h2><p>A região de Angra dos Reis possui uma das maiores biodiversidades marinhas do litoral brasileiro. Nossos passeios de biologia marinha permitem conhecer de perto essa riqueza natural.</p><h3>Espécies que você pode encontrar</h3><ul><li>Tartarugas marinhas</li><li>Diversas espécies de peixes coloridos</li><li>Corais e esponjas</li><li>Golfinhos (com sorte!)</li></ul>',
                tags: ['biologia', 'marinha', 'mergulho', 'natureza']
            },
            {
                titulo: 'Cristo Redentor: História e Beleza',
                autor: 'Administrador',
                data: '2026-01-20',
                categoria: 'cultura',
                status: 'publicado',
                imagemCapa: 'images/resource/news-3.jpg',
                resumo: 'Um dos monumentos mais icônicos do mundo merece ser visitado.',
                conteudo: '<h2>Uma das Sete Maravilhas do Mundo Moderno</h2><p>O Cristo Redentor é mais do que um monumento - é um símbolo do Brasil e do Rio de Janeiro. Com seus 38 metros de altura, ele contempla a cidade do alto do Morro do Corcovado.</p><h3>Informações úteis</h3><p>O acesso pode ser feito de trem, van ou a pé (para os mais aventureiros). A vista panorâmica é simplesmente espetacular.</p>',
                tags: ['cristo redentor', 'rio de janeiro', 'cultura', 'turismo']
            },
            {
                titulo: 'Trilhas e Aventuras no Rio',
                autor: 'Administrador',
                data: '2026-01-18',
                categoria: 'aventura',
                status: 'rascunho',
                imagemCapa: 'images/resource/news-4.jpg',
                resumo: 'Conheça as melhores trilhas da região para quem busca aventura.',
                conteudo: '<h2>Aventuras na Natureza</h2><p>O Rio de Janeiro oferece trilhas incríveis para todos os níveis de experiência. Desde caminhadas leves até desafios para os mais experientes.</p>',
                tags: ['trilhas', 'aventura', 'ecoturismo']
            },
            {
                titulo: 'Gastronomia Caiçara',
                autor: 'Administrador',
                data: '2026-01-15',
                categoria: 'gastronomia',
                status: 'publicado',
                imagemCapa: 'images/resource/news-5.jpg',
                resumo: 'Sabores únicos da cultura local que você precisa experimentar.',
                conteudo: '<h2>Sabores do Mar</h2><p>A gastronomia caiçara é rica em frutos do mar frescos e receitas tradicionais passadas de geração em geração. Não deixe de provar a moqueca, a caldeirada e os peixes grelhados.</p>',
                tags: ['gastronomia', 'cultura', 'frutos do mar']
            }
        ];

        samplePosts.forEach(post => this.create(post));
        console.log('[BlogManager] Dados de exemplo criados');
    }
};

// ============================================
// GERENCIADOR DE EXCURSÕES
// ============================================

/**
 * Explicação do objeto [ExcursaoManager]
 * 
 * Gerencia todas as operações CRUD para excursões.
 * Armazena dados no localStorage com a chave 'avorar_excursoes'.
 * 
 * Estrutura de uma excursão:
 * {
 *   id: string,
 *   titulo: string,
 *   slug: string,
 *   subtitulo: string,
 *   preco: number,
 *   duracao: string,
 *   categoria: string,
 *   status: 'ativo' | 'inativo',
 *   imagemCapa: string,
 *   imagemPrincipal: string,
 *   galeria: string[],
 *   descricao: string (HTML),
 *   inclusos: string,
 *   recomendacoes: string,
 *   local: string,
 *   horario: string,
 *   tags: string[],
 *   criadoEm: string (ISO),
 *   atualizadoEm: string (ISO)
 * }
 */
const ExcursaoManager = {
    STORAGE_KEY: 'avorar_excursoes',

    /**
     * Inicializa as excursões com dados de exemplo se estiver vazio
     */
    init() {
        const excursoes = this.getAll();
        if (excursoes.length === 0) {
            this._seedData();
        }
        console.log(`[ExcursaoManager] Inicializado com ${this.getAll().length} excursões`);
    },

    /**
     * Retorna todas as excursões
     * @param {boolean} onlyActive - Se true, retorna apenas ativas
     * @returns {Array} Lista de excursões
     */
    getAll(onlyActive = false) {
        const excursoes = DataManager.get(this.STORAGE_KEY, []);
        if (onlyActive) {
            return excursoes.filter(e => e.status === 'ativo');
        }
        return excursoes;
    },

    /**
     * Busca uma excursão por ID
     * @param {string} id - ID da excursão
     * @returns {Object|null} Excursão encontrada ou null
     */
    getById(id) {
        const excursoes = this.getAll();
        return excursoes.find(e => e.id === id) || null;
    },

    /**
     * Busca uma excursão por slug
     * @param {string} slug - Slug da excursão
     * @returns {Object|null} Excursão encontrada ou null
     */
    getBySlug(slug) {
        const excursoes = this.getAll();
        return excursoes.find(e => e.slug === slug) || null;
    },

    /**
     * Cria uma nova excursão
     * @param {Object} excursaoData - Dados da excursão
     * @returns {Object} Excursão criada
     */
    create(excursaoData) {
        const excursoes = this.getAll();
        const now = new Date().toISOString();
        
        const newExcursao = {
            id: generateId(),
            titulo: excursaoData.titulo || '',
            slug: slugify(excursaoData.titulo || 'excursao-' + Date.now()),
            subtitulo: excursaoData.subtitulo || '',
            preco: parseFloat(excursaoData.preco) || 0,
            duracao: excursaoData.duracao || '',
            categoria: excursaoData.categoria || 'natureza',
            status: excursaoData.status || 'ativo',
            imagemCapa: excursaoData.imagemCapa || '',
            imagemPrincipal: excursaoData.imagemPrincipal || '',
            galeria: excursaoData.galeria || [],
            descricao: excursaoData.descricao || '',
            inclusos: excursaoData.inclusos || '',
            recomendacoes: excursaoData.recomendacoes || '',
            local: excursaoData.local || '',
            horario: excursaoData.horario || '',
            tags: excursaoData.tags || [],
            criadoEm: now,
            atualizadoEm: now
        };

        excursoes.unshift(newExcursao);
        DataManager.save(this.STORAGE_KEY, excursoes);
        console.log(`[ExcursaoManager] Excursão criada: ${newExcursao.id}`);
        return newExcursao;
    },

    /**
     * Atualiza uma excursão existente
     * @param {string} id - ID da excursão
     * @param {Object} excursaoData - Dados a atualizar
     * @returns {Object|null} Excursão atualizada ou null
     */
    update(id, excursaoData) {
        const excursoes = this.getAll();
        const index = excursoes.findIndex(e => e.id === id);
        
        if (index === -1) {
            console.error(`[ExcursaoManager] Excursão não encontrada: ${id}`);
            return null;
        }

        const updatedExcursao = {
            ...excursoes[index],
            ...excursaoData,
            id: excursoes[index].id,
            criadoEm: excursoes[index].criadoEm,
            atualizadoEm: new Date().toISOString()
        };

        // Atualiza slug se o título mudou
        if (excursaoData.titulo && excursaoData.titulo !== excursoes[index].titulo) {
            updatedExcursao.slug = slugify(excursaoData.titulo);
        }

        // Garante que preço seja número
        if (excursaoData.preco !== undefined) {
            updatedExcursao.preco = parseFloat(excursaoData.preco) || 0;
        }

        excursoes[index] = updatedExcursao;
        DataManager.save(this.STORAGE_KEY, excursoes);
        console.log(`[ExcursaoManager] Excursão atualizada: ${id}`);
        return updatedExcursao;
    },

    /**
     * Exclui uma excursão
     * @param {string} id - ID da excursão
     * @returns {boolean} True se excluída com sucesso
     */
    delete(id) {
        const excursoes = this.getAll();
        const filteredExcursoes = excursoes.filter(e => e.id !== id);
        
        if (filteredExcursoes.length === excursoes.length) {
            console.error(`[ExcursaoManager] Excursão não encontrada para exclusão: ${id}`);
            return false;
        }

        DataManager.save(this.STORAGE_KEY, filteredExcursoes);
        console.log(`[ExcursaoManager] Excursão excluída: ${id}`);
        return true;
    },

    /**
     * Busca excursões por termo
     * @param {string} term - Termo de busca
     * @returns {Array} Excursões que correspondem à busca
     */
    search(term) {
        const excursoes = this.getAll();
        const lowerTerm = term.toLowerCase();
        return excursoes.filter(e => 
            e.titulo.toLowerCase().includes(lowerTerm) ||
            e.subtitulo.toLowerCase().includes(lowerTerm) ||
            e.descricao.toLowerCase().includes(lowerTerm) ||
            e.tags.some(tag => tag.toLowerCase().includes(lowerTerm))
        );
    },

    /**
     * Filtra excursões por categoria
     * @param {string} categoria - Categoria para filtrar
     * @returns {Array} Excursões da categoria
     */
    filterByCategory(categoria) {
        const excursoes = this.getAll();
        return excursoes.filter(e => e.categoria === categoria);
    },

    /**
     * Filtra excursões por status
     * @param {string} status - Status para filtrar
     * @returns {Array} Excursões com o status
     */
    filterByStatus(status) {
        const excursoes = this.getAll();
        return excursoes.filter(e => e.status === status);
    },

    /**
     * Formata preço em Real brasileiro
     * @param {number} preco - Valor
     * @returns {string} Preço formatado
     */
    formatPrice(preco) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(preco);
    },

    /**
     * Dados iniciais de exemplo
     */
    _seedData() {
        const sampleExcursoes = [
            {
                titulo: 'Cristo Redentor',
                subtitulo: 'Visite um dos monumentos mais icônicos do mundo',
                preco: 150.00,
                duracao: '4 horas',
                categoria: 'cultura',
                status: 'ativo',
                imagemCapa: 'images/background/Cristo.webp',
                imagemPrincipal: 'images/background/Cristo.webp',
                galeria: [],
                descricao: '<h2>Sobre o Passeio</h2><p>Uma experiência única visitando o Cristo Redentor, uma das Sete Maravilhas do Mundo Moderno. O monumento de 38 metros de altura oferece uma vista panorâmica incomparável da cidade do Rio de Janeiro.</p><h3>Destaques</h3><ul><li>Vista panorâmica 360° do Rio de Janeiro</li><li>Transporte confortável incluído</li><li>Guia turístico especializado</li><li>Paradas para fotos</li></ul>',
                inclusos: '- Transporte ida e volta\n- Guia turístico\n- Ingressos\n- Água mineral',
                recomendacoes: '- Usar roupas confortáveis\n- Levar protetor solar\n- Chegar 15 minutos antes',
                local: 'Centro de Angra dos Reis',
                horario: '08:00 - 12:00',
                tags: ['turismo', 'cultura', 'cristo redentor', 'rio de janeiro']
            },
            {
                titulo: 'Biologia Marinha',
                subtitulo: 'Mergulho educacional e exploração subaquática',
                preco: 280.00,
                duracao: '6 horas',
                categoria: 'marítimo',
                status: 'ativo',
                imagemCapa: 'images/background/Biologia Marinha Capa 1.webp',
                imagemPrincipal: 'images/background/Biologia Marinha Capa 1.webp',
                galeria: [],
                descricao: '<h2>Projeto Biologia Marinha</h2><p>Uma experiência educacional única onde você poderá conhecer a rica biodiversidade marinha da região de Angra dos Reis. Ideal para famílias, escolas e amantes da natureza.</p><h3>O que você vai aprender</h3><ul><li>Identificação de espécies marinhas</li><li>Ecossistema costeiro</li><li>Preservação ambiental</li><li>Técnicas de mergulho básico</li></ul>',
                inclusos: '- Equipamento de mergulho\n- Biólogo acompanhante\n- Transporte marítimo\n- Lanche\n- Material didático',
                recomendacoes: '- Saber nadar\n- Não usar protetor solar comum (fornecemos biodegradável)\n- Trazer roupa de banho extra',
                local: 'Marina de Angra dos Reis',
                horario: '07:00 - 13:00',
                tags: ['biologia', 'marinha', 'mergulho', 'educacional', 'natureza']
            },
            {
                titulo: 'Cachoeiras',
                subtitulo: 'Trilha até as mais belas quedas d\'água da região',
                preco: 120.00,
                duracao: '5 horas',
                categoria: 'natureza',
                status: 'ativo',
                imagemCapa: 'images/background/Queda de agua.webp',
                imagemPrincipal: 'images/background/Queda de agua.webp',
                galeria: [],
                descricao: '<h2>Aventura nas Cachoeiras</h2><p>Explore as cachoeiras escondidas da região em uma trilha emocionante através da Mata Atlântica. Banhos refrescantes em piscinas naturais e contato direto com a natureza.</p>',
                inclusos: '- Guia especializado\n- Transporte\n- Lanche energético\n- Equipamento de segurança',
                recomendacoes: '- Usar calçado de trilha\n- Levar repelente\n- Preparação física moderada',
                local: 'Centro de Angra dos Reis',
                horario: '08:00 - 13:00',
                tags: ['natureza', 'aventura', 'cachoeiras', 'trilha']
            },
            {
                titulo: 'Trilha das Montanhas',
                subtitulo: 'Aventura radical com vistas espetaculares',
                preco: 200.00,
                duracao: '8 horas',
                categoria: 'aventura',
                status: 'inativo',
                imagemCapa: 'images/background/montanhas.webp',
                imagemPrincipal: 'images/background/montanhas.webp',
                galeria: [],
                descricao: '<h2>Desafio nas Alturas</h2><p>Para os mais aventureiros, oferecemos trilhas de nível avançado com vistas panorâmicas incríveis. Uma experiência desafiadora e gratificante.</p>',
                inclusos: '- Guia especializado\n- Equipamento técnico\n- Alimentação completa\n- Seguro',
                recomendacoes: '- Excelente preparação física\n- Experiência em trilhas\n- Não recomendado para iniciantes',
                local: 'Base da Serra',
                horario: '06:00 - 14:00',
                tags: ['aventura', 'trilha', 'montanha', 'radical']
            },
            {
                titulo: 'Passeio de Barco',
                subtitulo: 'Navegue pelas ilhas paradisíacas de Angra',
                preco: 180.00,
                duracao: '6 horas',
                categoria: 'marítimo',
                status: 'ativo',
                imagemCapa: 'images/background/mar.webp',
                imagemPrincipal: 'images/background/mar.webp',
                galeria: [],
                descricao: '<h2>Ilhas Paradisíacas</h2><p>Navegue pelas águas cristalinas de Angra dos Reis, visitando praias desertas e ilhas paradisíacas. Paradas para banho, mergulho e muito mais.</p>',
                inclusos: '- Passeio de barco\n- Equipamento de snorkel\n- Almoço\n- Bebidas\n- Seguro',
                recomendacoes: '- Levar protetor solar\n- Roupa de banho\n- Toalha',
                local: 'Marina Central',
                horario: '09:00 - 15:00',
                tags: ['barco', 'ilhas', 'praias', 'marítimo']
            }
        ];

        sampleExcursoes.forEach(excursao => this.create(excursao));
        console.log('[ExcursaoManager] Dados de exemplo criados');
    }
};

// ============================================
// GERENCIADOR DE CONFIGURAÇÕES DE PAGAMENTO
// ============================================

/**
 * Explicação do objeto [PaymentConfigManager]
 * 
 * Gerencia as configurações dos gateways de pagamento.
 * Suporta apenas: Asaas, Mercado Pago e Stripe.
 * Armazena dados no localStorage com a chave 'avorar_payment_config'.
 */
const PaymentConfigManager = {
    STORAGE_KEY: 'avorar_payment_config',

    /**
     * Gateways disponíveis
     */
    GATEWAYS: {
        ASAAS: 'asaas',
        MERCADO_PAGO: 'mercadopago',
        STRIPE: 'stripe'
    },

    /**
     * Inicializa com configurações padrão
     */
    init() {
        const config = this.getConfig();
        if (!config) {
            this._setDefaultConfig();
        }
        console.log('[PaymentConfigManager] Inicializado');
    },

    /**
     * Retorna todas as configurações
     * @returns {Object} Configurações de pagamento
     */
    getConfig() {
        return DataManager.get(this.STORAGE_KEY, null);
    },

    /**
     * Retorna configuração do gateway ativo
     * @returns {Object} Configuração do gateway ativo
     */
    getActiveGateway() {
        const config = this.getConfig();
        if (!config) return null;
        return {
            gateway: config.activeGateway,
            config: config.gateways[config.activeGateway]
        };
    },

    /**
     * Define o gateway ativo
     * @param {string} gateway - Identificador do gateway
     * @returns {boolean} Sucesso
     */
    setActiveGateway(gateway) {
        if (!Object.values(this.GATEWAYS).includes(gateway)) {
            console.error(`[PaymentConfigManager] Gateway inválido: ${gateway}`);
            return false;
        }

        const config = this.getConfig();
        config.activeGateway = gateway;
        config.atualizadoEm = new Date().toISOString();
        DataManager.save(this.STORAGE_KEY, config);
        console.log(`[PaymentConfigManager] Gateway ativo: ${gateway}`);
        return true;
    },

    /**
     * Atualiza configurações de um gateway específico
     * @param {string} gateway - Identificador do gateway
     * @param {Object} settings - Configurações
     * @returns {boolean} Sucesso
     */
    updateGatewayConfig(gateway, settings) {
        if (!Object.values(this.GATEWAYS).includes(gateway)) {
            console.error(`[PaymentConfigManager] Gateway inválido: ${gateway}`);
            return false;
        }

        const config = this.getConfig();
        config.gateways[gateway] = {
            ...config.gateways[gateway],
            ...settings
        };
        config.atualizadoEm = new Date().toISOString();
        DataManager.save(this.STORAGE_KEY, config);
        console.log(`[PaymentConfigManager] Configurações do ${gateway} atualizadas`);
        return true;
    },

    /**
     * Retorna configurações de um gateway específico
     * @param {string} gateway - Identificador do gateway
     * @returns {Object|null} Configurações do gateway
     */
    getGatewayConfig(gateway) {
        const config = this.getConfig();
        return config?.gateways[gateway] || null;
    },

    /**
     * Configurações padrão
     */
    _setDefaultConfig() {
        const defaultConfig = {
            activeGateway: this.GATEWAYS.MERCADO_PAGO,
            gateways: {
                [this.GATEWAYS.ASAAS]: {
                    enabled: false,
                    apiKey: '',
                    walletId: '',
                    sandbox: true,
                    webhookUrl: 'https://avorar.com/api/webhook/asaas'
                },
                [this.GATEWAYS.MERCADO_PAGO]: {
                    enabled: true,
                    publicKey: '',
                    accessToken: '',
                    sandbox: true,
                    maxInstallments: 6,
                    interestRate: 0,
                    webhookUrl: 'https://avorar.com/api/webhook/mercadopago'
                },
                [this.GATEWAYS.STRIPE]: {
                    enabled: false,
                    publishableKey: '',
                    secretKey: '',
                    webhookSecret: '',
                    testMode: true,
                    webhookUrl: 'https://avorar.com/api/webhook/stripe'
                }
            },
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        DataManager.save(this.STORAGE_KEY, defaultConfig);
        console.log('[PaymentConfigManager] Configurações padrão criadas');
    }
};

// ============================================
// ESTATÍSTICAS DO DASHBOARD
// ============================================

/**
 * Explicação do objeto [DashboardStats]
 * 
 * Calcula e retorna estatísticas para o dashboard administrativo.
 */
const DashboardStats = {
    /**
     * Retorna estatísticas gerais
     * @returns {Object} Estatísticas
     */
    getStats() {
        const posts = BlogManager.getAll();
        const excursoes = ExcursaoManager.getAll();

        return {
            totalPosts: posts.length,
            postsPublicados: posts.filter(p => p.status === 'publicado').length,
            postsRascunho: posts.filter(p => p.status === 'rascunho').length,
            totalExcursoes: excursoes.length,
            excursoesAtivas: excursoes.filter(e => e.status === 'ativo').length,
            excursoesInativas: excursoes.filter(e => e.status === 'inativo').length,
            // Valores simulados para demonstração
            reservas: Math.floor(Math.random() * 50) + 100,
            visitantes: (Math.random() * 3 + 1).toFixed(1) + 'k'
        };
    },

    /**
     * Retorna atividades recentes
     * @param {number} limit - Quantidade de atividades
     * @returns {Array} Atividades recentes
     */
    getRecentActivity(limit = 5) {
        const posts = BlogManager.getAll().slice(0, limit);
        const excursoes = ExcursaoManager.getAll().slice(0, limit);

        const activities = [
            ...posts.map(p => ({
                tipo: 'Post',
                descricao: `Post: "${p.titulo}"`,
                status: p.status,
                data: p.atualizadoEm
            })),
            ...excursoes.map(e => ({
                tipo: 'Excursão',
                descricao: `Excursão: "${e.titulo}"`,
                status: e.status,
                data: e.atualizadoEm
            }))
        ];

        // Ordena por data mais recente
        activities.sort((a, b) => new Date(b.data) - new Date(a.data));

        return activities.slice(0, limit);
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

/**
 * Inicializa todos os gerenciadores de dados
 */
function initDataManagers() {
    console.log('[DataManager] Inicializando sistema de dados...');
    BlogManager.init();
    ExcursaoManager.init();
    PaymentConfigManager.init();
    console.log('[DataManager] Sistema de dados inicializado!');
}

// Inicializa automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDataManagers);
} else {
    initDataManagers();
}

// ============================================
// EXPORTAÇÃO PARA USO GLOBAL
// ============================================

window.DataManager = DataManager;
window.BlogManager = BlogManager;
window.ExcursaoManager = ExcursaoManager;
window.PaymentConfigManager = PaymentConfigManager;
window.DashboardStats = DashboardStats;
window.generateId = generateId;
window.formatDateBR = formatDateBR;
window.formatDateISO = formatDateISO;
window.slugify = slugify;
