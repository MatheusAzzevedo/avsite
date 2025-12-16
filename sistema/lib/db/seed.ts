const { query } = require('./index');
const { hashPassword } = require('../auth');

/**
 * Script para inserir dados de teste no banco de dados
 * Execute com: npx ts-node lib/db/seed.ts
 */

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    // Criar usuário admin de teste
    console.log('📝 Criando usuário admin de teste...');
    const adminPassword = await hashPassword('admin123456');
    
    const userResult = await query(
      `INSERT INTO users (email, password_hash) 
       VALUES ($1, $2) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, created_at`,
      ['admin@avoar.com.br', adminPassword]
    );

    if (userResult.rows.length > 0) {
      console.log('✅ Usuário criado:', userResult.rows[0]);
      console.log('   Email: admin@avoar.com.br');
      console.log('   Senha: admin123456\n');
    } else {
      console.log('ℹ️  Usuário já existe\n');
    }

    // Inserir excursão de exemplo
    console.log('📝 Criando excursão de exemplo...');
    const excursaoResult = await query(
      `INSERT INTO excursoes 
       (title, subtitle, description, price, active) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING
       RETURNING id, title, price`,
      [
        'Biologia Marinha',
        'Exploração do ecossistema costeiro',
        'Uma jornada fascinante pelo mundo dos recifes de coral e vida marinha.',
        199.99,
        true
      ]
    );

    if (excursaoResult.rows.length > 0) {
      console.log('✅ Excursão criada:', excursaoResult.rows[0]);
    } else {
      console.log('ℹ️  Excursão já existe');
    }

    // Inserir post de blog de exemplo
    console.log('\n📝 Criando post de blog de exemplo...');
    
    const users = await query('SELECT id FROM users LIMIT 1');
    
    if (users.rows.length > 0) {
      const authorId = users.rows[0].id;
      const blogResult = await query(
        `INSERT INTO blog_posts 
         (title, subtitle, content, author_id, published) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING
         RETURNING id, title, published`,
        [
          'Primeiros Passos na Ecologia Marinha',
          'Entenda os conceitos fundamentais',
          JSON.stringify({
            type: 'doc',
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: 'Este é um post de exemplo sobre ecologia marinha.'
              }]
            }]
          }),
          authorId,
          true
        ]
      );

      if (blogResult.rows.length > 0) {
        console.log('✅ Post de blog criado:', blogResult.rows[0]);
      } else {
        console.log('ℹ️  Post já existe');
      }
    }

    console.log('\n✅ Seed concluído com sucesso!\n');
    console.log('📌 Dados de teste inseridos:');
    console.log('   - User: admin@avoar.com.br / admin123456');
    console.log('   - Excursão: Biologia Marinha (R$ 199,99)');
    console.log('   - Post: Primeiros Passos na Ecologia Marinha');

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    process.exit(1);
  }
}

seed();
