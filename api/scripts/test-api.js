/**
 * Script para testar se a API Avorar Turismo está funcionando.
 * 
 * Uso:
 *   node scripts/test-api.js                    → testa produção (Railway)
 *   node scripts/test-api.js http://localhost:3001  → testa local
 * 
 * Testes em sequência:
 *   1. Health check
 *   2. Login (admin@avorar.com / admin123)
 *   3. Listar excursões públicas
 *   4. Criar excursão (com token do login)
 */

const BASE_URL = process.argv[2] || 'https://avoarturismo.up.railway.app';

function log(msg, type = 'info') {
  const prefix = type === 'ok' ? '✅' : type === 'fail' ? '❌' : '  ';
  console.log(`${prefix} ${msg}`);
}

async function request(method, path, body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('\n🧪 Testando API Avorar Turismo');
  console.log(`   Base URL: ${BASE_URL}\n`);

  let token = null;
  let allOk = true;

  // 1. Health check
  try {
    const { status, data } = await request('GET', '/api/health');
    if (status === 200 && data && data.status === 'ok') {
      log('Health check: API respondendo', 'ok');
    } else {
      log(`Health check falhou: status ${status}`, 'fail');
      allOk = false;
    }
  } catch (err) {
    log(`Health check erro: ${err.message}`, 'fail');
    allOk = false;
  }

  // 2. Login
  try {
    const { status, data } = await request('POST', '/api/auth/login', {
      email: 'admin@avorar.com',
      password: 'admin123'
    });
    if (status === 200 && data && data.success && data.data && data.data.token) {
      token = data.data.token;
      log('Login: autenticação OK', 'ok');
    } else {
      log(`Login falhou: status ${status} - ${data?.error || JSON.stringify(data)}`, 'fail');
      allOk = false;
    }
  } catch (err) {
    log(`Login erro: ${err.message}`, 'fail');
    allOk = false;
  }

  // 3. Listar excursões públicas
  try {
    const { status, data } = await request('GET', '/api/public/excursoes');
    if (status === 200 && data && data.success && Array.isArray(data.data)) {
      log(`Listar excursões: ${data.data.length} excursão(ões)`, 'ok');
    } else {
      log(`Listar excursões falhou: status ${status}`, 'fail');
      allOk = false;
    }
  } catch (err) {
    log(`Listar excursões erro: ${err.message}`, 'fail');
    allOk = false;
  }

  // 4. Criar excursão (só se tiver token)
  if (token) {
    try {
      const { status, data } = await request(
        'POST',
        '/api/excursoes',
        {
          titulo: 'Teste API - ' + new Date().toISOString().slice(0, 19),
          preco: 99.9,
          categoria: 'natureza'
        },
        token
      );
      if (status === 201 && data && data.success && data.data && data.data.id) {
        log('Criar excursão: excursão criada com sucesso', 'ok');
      } else {
        log(`Criar excursão falhou: status ${status} - ${data?.error || JSON.stringify(data?.details || data)}`, 'fail');
        allOk = false;
      }
    } catch (err) {
      log(`Criar excursão erro: ${err.message}`, 'fail');
      allOk = false;
    }
  } else {
    log('Criar excursão: pulado (sem token)', 'info');
  }

  console.log('');
  if (allOk) {
    console.log('✅ Todos os testes passaram. A API está funcionando.\n');
  } else {
    console.log('❌ Alguns testes falharam. Verifique a API e as credenciais.\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Erro ao executar testes:', err);
  process.exit(1);
});
