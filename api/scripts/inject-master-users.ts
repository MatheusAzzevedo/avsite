/**
 * Script de execução ÚNICA para injetar 2 usuários master no banco.
 * NÃO roda em deploy. Executar manualmente: npm run inject-masters
 *
 * Usuários criados:
 * - dantydias@gmail.com / dantydias123 (ADMIN)
 * - azetus.io@gmail.com / Matheus123 (ADMIN)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MASTER_USERS = [
  { email: 'dantydias@gmail.com', password: 'dantydias123', name: 'Danty Dias' },
  { email: 'azetus.io@gmail.com', password: 'Matheus123', name: 'Matheus Azevedo' }
] as const;

async function main() {
  console.log('🔐 Injetando usuários master (execução única)...\n');

  for (const u of MASTER_USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: 'ADMIN',
        active: true
      }
    });
    console.log(`   ✅ ${user.email} (${user.name}) - role: ${user.role}`);
  }

  console.log('\n✨ Usuários master injetados com sucesso.');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
