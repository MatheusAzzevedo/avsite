import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.categoriaExcursao.count();
  console.log(`Categorias encontradas: ${count}`);
  
  const sample = await prisma.categoriaExcursao.findMany({ take: 5 });
  console.log('Sample:', JSON.stringify(sample, null, 2));

  const excursoesWithCats = await prisma.excursao.count({
    where: {
      categorias: { some: {} }
    }
  });
  console.log(`Excursões com categorias vinculadas: ${excursoesWithCats}`);
}

main().finally(() => prisma.$disconnect());
