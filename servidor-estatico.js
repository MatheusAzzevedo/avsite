const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const NEXTJS_PORT = 3001;
const ROOT_DIR = __dirname;

// Mapeamento de extensões para MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.ico': 'image/x-icon'
};

// Função para obter MIME type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// Função para servir arquivo
function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - Arquivo não encontrado</h1>');
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

// Função para verificar se arquivo existe
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

// Função para fazer proxy para Next.js
function proxyToNextJS(req, res) {
  // Criar headers para o proxy
  const proxyHeaders = {
    ...req.headers,
    'x-forwarded-for': req.connection.remoteAddress,
    'x-forwarded-proto': 'http',
    'x-forwarded-host': req.headers.host,
    'x-forwarded-port': PORT,
    host: `localhost:${NEXTJS_PORT}`
  };

  // Remover headers que podem causar conflitos
  delete proxyHeaders['content-length'];

  const options = {
    hostname: 'localhost',
    port: NEXTJS_PORT,
    path: req.url,
    method: req.method,
    headers: proxyHeaders,
    timeout: 30000
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Adicionar headers de cache
    const headers = {
      ...proxyRes.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Erro ao conectar com Next.js:', err.message);
    res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Serviço Indisponível</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          h1 { color: #333; }
          p { color: #666; }
          code { background: #ddd; padding: 5px 10px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>⚠️ Serviço Temporariamente Indisponível</h1>
        <p>O sistema administrativo (Next.js) não está rodando na porta ${NEXTJS_PORT}.</p>
        <p><strong>Para iniciar:</strong></p>
        <p><code>cd sistema && npm run dev -- -p ${NEXTJS_PORT}</code></p>
        <p>Ou execute o script: <code>iniciar-servidores.bat</code> (Windows)</p>
      </body>
      </html>
    `);
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.writeHead(504, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>504 Gateway Timeout</h1>');
  });

  req.pipe(proxyReq, { end: true });
}

// Criar servidor
const server = http.createServer((req, res) => {
  // Log da requisição
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Remover query string e normalizar URL
  let urlPath = req.url.split('?')[0];
  
  // Proxy para Next.js se for rota /admin/* ou /api/*
  if (urlPath.startsWith('/admin/') || urlPath.startsWith('/api/')) {
    proxyToNextJS(req, res);
    return;
  }
  
  // Redirecionar / para index-10.html
  if (urlPath === '/' || urlPath === '/index.html') {
    urlPath = '/index-10.html';
  }

  // Construir caminho do arquivo
  let filePath = path.join(ROOT_DIR, urlPath);

  // Verificar se é diretório e tentar index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Verificar se arquivo existe
  if (fileExists(filePath)) {
    serveFile(filePath, res);
  } else {
    // Tentar com .html se não tiver extensão
    if (!path.extname(filePath)) {
      const htmlPath = filePath + '.html';
      if (fileExists(htmlPath)) {
        serveFile(htmlPath, res);
        return;
      }
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>404 - Não Encontrado</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #333; }
          a { color: #0066cc; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>404 - Página não encontrada</h1>
        <p>O arquivo solicitado não foi encontrado.</p>
        <p><a href="/">Voltar para a página inicial</a></p>
      </body>
      </html>
    `);
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║   🚀 Servidor Estático Avoar Site Rodando!                ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Servidor estático rodando em: http://localhost:${PORT}`);
  console.log(`📁 Diretório raiz: ${ROOT_DIR}`);
  console.log('');
  console.log('📄 Páginas disponíveis:');
  console.log('   • http://localhost:3000/ (index-10.html)');
  console.log('   • http://localhost:3000/index-10.html');
  console.log('   • http://localhost:3000/index-11.html');
  console.log('   • http://localhost:3000/about.html');
  console.log('   • http://localhost:3000/blog.html');
  console.log('   • http://localhost:3000/contact.html');
  console.log('   • http://localhost:3000/portfolio.html');
  console.log('');
  console.log('🔗 Links funcionando:');
  console.log('   • Todos os links relativos entre HTML');
  console.log('   • CSS, JS, imagens e fontes');
  console.log('   • Login: http://localhost:3000/admin/login (proxy para Next.js)');
  console.log('');
  console.log('⚠️  IMPORTANTE: Inicie o Next.js na porta 3001:');
  console.log(`   cd sistema && npm run dev -- -p ${NEXTJS_PORT}`);
  console.log('');
  console.log('⏹️  Para parar: Pressione Ctrl + C');
  console.log('');
});

// Tratamento de erros
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Erro: Porta ${PORT} já está em uso!`);
    console.error('   Feche o servidor Next.js ou use outra porta.');
  } else {
    console.error('❌ Erro no servidor:', err);
  }
  process.exit(1);
});

