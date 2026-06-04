/**
 * Explicação do Arquivo [seed.ts]
 * 
 * Script para popular o banco de dados com dados iniciais.
 * Cria usuário admin e excursões/posts de exemplo.
 * 
 * Executar: npm run seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // ===========================================
  // CRIAR USUÁRIO ADMIN
  // ===========================================
  
  console.log('👤 Verificando usuário admin...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@avorar.com' },
    update: {},
    create: {
      email: 'admin@avorar.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      active: true
    }
  });
  
  console.log(`   ✅ Admin garantido: ${admin.email}`);
  console.log(`   📧 Email: admin@avorar.com`);
  console.log(`   🔑 Senha: admin123\n`);

  // ===========================================
  // CRIAR USUÁRIOS ADMIN ADICIONAIS
  // ===========================================
  // Regra: login = email, senha = nome + 123 (primeira letra maiúscula)
  // José Flávio: senha = Jose123
  // ===========================================

  const usuariosAdmin = [
    { name: 'Gilmar', email: 'gilmar@avoarturismo.com.br', password: 'Gilmar123' },
    { name: 'Contato', email: 'contato@avoarturismo.com.br', password: 'Contato123' },
    { name: 'Andrea', email: 'andrea.batista66@yahoo.com.br', password: 'Andrea123' },
    { name: 'Stefania', email: 'stefaniabarreiros92@gmail.com', password: 'Stefania123' },
    { name: 'José Flávio', email: 'flaviofigo07@gmail.com', password: 'Jose123' }
  ];

  for (const u of usuariosAdmin) {
    const hashedPwd = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashedPwd, name: u.name },
      create: {
        email: u.email,
        password: hashedPwd,
        name: u.name,
        role: 'ADMIN',
        active: true
      }
    });
    console.log(`   ✅ Admin: ${u.name} (${u.email})`);
  }
  console.log('');

  // ===========================================
  // CATEGORIAS DE EXCURSÃO (Viagens) - padrão
  // ===========================================
  const categoriasPadrao = [
    { slug: 'natureza', nome: 'Natureza', ordem: 1 },
    { slug: 'cultura', nome: 'Cultura', ordem: 2 },
    { slug: 'aventura', nome: 'Aventura', ordem: 3 },
    { slug: 'marítimo', nome: 'Marítimo', ordem: 4 }
  ];
  for (const c of categoriasPadrao) {
    await prisma.categoriaExcursao.upsert({
      where: { slug: c.slug },
      update: { nome: c.nome, ordem: c.ordem },
      create: c
    });
  }
  console.log('   ✅ Categorias de excursão garantidas (natureza, cultura, aventura, marítimo)\n');

  // ===========================================
  // VERIFICAR SE JÁ EXISTEM DADOS
  // ===========================================
  
  const excursoesCount = await prisma.excursao.count();
  const postsCount = await prisma.post.count();
  
  if (excursoesCount > 0) {
    console.log(`ℹ️  Banco já contém ${excursoesCount} excursão(ões). Pulando criação de dados de teste.`);
    console.log(`ℹ️  Banco já contém ${postsCount} post(s). Pulando criação de dados de teste.\n`);
    console.log('✨ Seed concluído!\n');
    console.log('═══════════════════════════════════════');
    console.log('CREDENCIAIS DO ADMIN:');
    console.log('Email: admin@avorar.com');
    console.log('Senha: admin123');
    console.log('═══════════════════════════════════════\n');
    return;
  }

  // ===========================================
  // CRIAR EXCURSÕES DE EXEMPLO (SOMENTE SE VAZIO)
  // ===========================================
  
  console.log('🏝️ Banco vazio. Criando excursões de exemplo...');
  
  const excursoes = [
    {
      titulo: 'Cristo Redentor',
      slug: 'cristo-redentor',
      subtitulo: 'Visite um dos monumentos mais icônicos do mundo',
      preco: 150.00,
      duracao: '4 horas',
      categoria: 'cultura',
      status: 'ATIVO' as const,
      imagemCapa: '/images/Imagens para o site/IMG-20250524-WA0012.jpg',
      imagemPrincipal: '/images/Imagens para o site/IMG-20250524-WA0013.jpg',
      descricao: '<h2>Sobre o Passeio</h2><p>Uma experiência única visitando o Cristo Redentor, uma das Sete Maravilhas do Mundo Moderno. O monumento de 38 metros de altura oferece uma vista panorâmica incomparável da cidade do Rio de Janeiro.</p><h3>Destaques</h3><ul><li>Vista panorâmica 360° do Rio de Janeiro</li><li>Transporte confortável incluído</li><li>Guia turístico especializado</li><li>Paradas para fotos</li></ul>',
      inclusos: '- Transporte ida e volta\n- Guia turístico\n- Ingressos\n- Água mineral',
      recomendacoes: '- Usar roupas confortáveis\n- Levar protetor solar\n- Chegar 15 minutos antes',
      local: 'Centro de Angra dos Reis',
      horario: '08:00 - 12:00',
      tags: ['turismo', 'cultura', 'cristo redentor', 'rio de janeiro'],
      authorId: admin.id
    },
    {
      titulo: 'Biologia Marinha',
      slug: 'biologia-marinha',
      subtitulo: 'Mergulho educacional e exploração subaquática',
      preco: 280.00,
      duracao: '6 horas',
      categoria: 'marítimo',
      status: 'ATIVO' as const,
      imagemCapa: '/images/Imagens para o site/Biologia marinha/IMG-20250627-WA0021.jpg',
      imagemPrincipal: '/images/Imagens para o site/Biologia marinha/IMG-20250628-WA0007.jpg',
      descricao: '<h2>Projeto Biologia Marinha</h2><p>Uma experiência educacional única onde você poderá conhecer a rica biodiversidade marinha da região de Angra dos Reis. Ideal para famílias, escolas e amantes da natureza.</p>',
      inclusos: '- Equipamento de mergulho\n- Biólogo acompanhante\n- Transporte marítimo\n- Lanche\n- Material didático',
      recomendacoes: '- Saber nadar\n- Não usar protetor solar comum\n- Trazer roupa de banho extra',
      local: 'Marina de Angra dos Reis',
      horario: '07:00 - 13:00',
      tags: ['biologia', 'marinha', 'mergulho', 'educacional', 'natureza'],
      authorId: admin.id
    },
    {
      titulo: 'Cachoeiras',
      slug: 'cachoeiras',
      subtitulo: 'Trilha até as mais belas quedas d\'água da região',
      preco: 120.00,
      duracao: '5 horas',
      categoria: 'natureza',
      status: 'ATIVO' as const,
      imagemCapa: '/images/Imagens para o site/IMG-20251022-WA0002.jpg',
      imagemPrincipal: '/images/Imagens para o site/IMG-20251022-WA0003.jpg',
      descricao: '<h2>Aventura nas Cachoeiras</h2><p>Explore as cachoeiras escondidas da região em uma trilha emocionante através da Mata Atlântica.</p>',
      inclusos: '- Guia especializado\n- Transporte\n- Lanche energético\n- Equipamento de segurança',
      recomendacoes: '- Usar calçado de trilha\n- Levar repelente\n- Preparação física moderada',
      local: 'Centro de Angra dos Reis',
      horario: '08:00 - 13:00',
      tags: ['natureza', 'aventura', 'cachoeiras', 'trilha'],
      authorId: admin.id
    },
    {
      titulo: 'Passeio de Barco',
      slug: 'passeio-de-barco',
      subtitulo: 'Navegue pelas ilhas paradisíacas de Angra',
      preco: 180.00,
      duracao: '6 horas',
      categoria: 'marítimo',
      status: 'ATIVO' as const,
      imagemCapa: '/images/Imagens para o site/IMG-20250725-WA0356.jpg',
      imagemPrincipal: '/images/Imagens para o site/IMG-20250725-WA0365.jpg',
      descricao: '<h2>Ilhas Paradisíacas</h2><p>Navegue pelas águas cristalinas de Angra dos Reis, visitando praias desertas e ilhas paradisíacas.</p>',
      inclusos: '- Passeio de barco\n- Equipamento de snorkel\n- Almoço\n- Bebidas\n- Seguro',
      recomendacoes: '- Levar protetor solar\n- Roupa de banho\n- Toalha',
      local: 'Marina Central',
      horario: '09:00 - 15:00',
      tags: ['barco', 'ilhas', 'praias', 'marítimo'],
      authorId: admin.id
    }
  ];

  for (const excursao of excursoes) {
    await prisma.excursao.upsert({
      where: { slug: excursao.slug },
      update: {},
      create: excursao
    });
    console.log(`   ✅ ${excursao.titulo}`);
  }

  // ===========================================
  // CRIAR POSTS DE EXEMPLO
  // ===========================================
  
  console.log('\n📝 Criando posts de exemplo...');
  
  const posts = [
    {
      titulo: 'Explorando Angra dos Reis',
      slug: 'explorando-angra-dos-reis',
      data: new Date('2026-01-25'),
      categoria: 'turismo',
      status: 'PUBLICADO' as const,
      imagemCapa: '/images/Imagens para o site/IMG-20250910-WA0076.jpg',
      resumo: 'Descubra as maravilhas naturais desta região paradisíaca do Rio de Janeiro.',
      conteudo: '<h2>Um Paraíso Natural</h2><p>Angra dos Reis é um dos destinos mais procurados do Brasil, com suas 365 ilhas e mais de 2000 praias.</p>',
      tags: ['turismo', 'aventura', 'angra dos reis', 'praias'],
      authorId: admin.id
    },
    {
      titulo: 'Biologia Marinha em Angra',
      slug: 'biologia-marinha-em-angra',
      data: new Date('2026-01-22'),
      categoria: 'natureza',
      status: 'PUBLICADO' as const,
      imagemCapa: '/images/Imagens para o site/Biologia marinha/IMG-20250628-WA0019.jpg',
      resumo: 'Um mergulho no mundo subaquático e na rica biodiversidade marinha da região.',
      conteudo: '<h2>Descobrindo a Vida Marinha</h2><p>A região de Angra dos Reis possui uma das maiores biodiversidades marinhas do litoral brasileiro.</p>',
      tags: ['biologia', 'marinha', 'mergulho', 'natureza'],
      authorId: admin.id
    },
    {
      titulo: 'Cristo Redentor: História e Beleza',
      slug: 'cristo-redentor-historia-e-beleza',
      data: new Date('2026-01-20'),
      categoria: 'cultura',
      status: 'PUBLICADO' as const,
      imagemCapa: '/images/Imagens para o site/IMG-20250910-WA0091.jpg',
      resumo: 'Um dos monumentos mais icônicos do mundo merece ser visitado.',
      conteudo: '<h2>Uma das Sete Maravilhas do Mundo Moderno</h2><p>O Cristo Redentor é mais do que um monumento - é um símbolo do Brasil.</p>',
      tags: ['cristo redentor', 'rio de janeiro', 'cultura', 'turismo'],
      authorId: admin.id
    }
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post
    });
    console.log(`   ✅ ${post.titulo}`);
  }

  // ===========================================
  // CRIAR CONFIGURAÇÕES DE PAGAMENTO
  // ===========================================
  
  console.log('\n💳 Criando configurações de pagamento...');
  
  const paymentConfigs = [
    {
      gateway: 'mercadopago',
      active: true,
      config: {
        publicKey: '',
        accessToken: '',
        maxInstallments: 6,
        interestRate: 0
      },
      testMode: true,
      webhookUrl: 'https://avorar.com/api/webhook/mercadopago'
    },
    {
      gateway: 'stripe',
      active: false,
      config: {
        publishableKey: '',
        secretKey: '',
        webhookSecret: ''
      },
      testMode: true,
      webhookUrl: 'https://avorar.com/api/webhook/stripe'
    },
    {
      gateway: 'asaas',
      active: false,
      config: {
        apiKey: '',
        walletId: ''
      },
      testMode: true,
      webhookUrl: 'https://avorar.com/api/webhook/asaas'
    }
  ];

  for (const config of paymentConfigs) {
    await prisma.paymentConfig.upsert({
      where: { gateway: config.gateway },
      update: {},
      create: config
    });
    console.log(`   ✅ ${config.gateway}`);
  }

  console.log('\n✨ Seed concluído com sucesso!\n');
  console.log('═══════════════════════════════════════');
  console.log('CREDENCIAIS DO ADMIN:');
  console.log('Email: admin@avorar.com');
  console.log('Senha: admin123');
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
