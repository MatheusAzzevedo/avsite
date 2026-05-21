import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migração de categorias...');

  // 1. Migrar Excursoes Convencionais
  const excursoes = await prisma.excursao.findMany({
    where: {
      categoria: { not: '' }
    }
  });

  console.log(`Encontradas ${excursoes.length} excursões convencionais para migrar.`);

  for (const excursao of excursoes) {
    const slug = excursao.categoria;
    
    // Verifica se a categoria existe na tabela CategoriaExcursao
    const cat = await prisma.categoriaExcursao.findUnique({
      where: { slug }
    });

    if (cat) {
      await prisma.excursao.update({
        where: { id: excursao.id },
        data: {
          categorias: {
            connect: { id: cat.id }
          }
        }
      });
      console.log(`✅ Excursão "${excursao.titulo}" vinculada à categoria "${cat.nome}"`);
    } else {
      console.warn(`⚠️ Categoria com slug "${slug}" não encontrada para a excursão "${excursao.titulo}".`);
    }
  }



  console.log('✨ Migração concluída!');
}

main()
  .catch((e) => {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
