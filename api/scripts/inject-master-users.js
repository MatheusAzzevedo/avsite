/**
 * Injeta 2 usuários master no banco. Roda no deploy (idempotente).
 * - dantydias@gmail.com / dantydias123 (ADMIN)
 * - azetus.io@gmail.com / Matheus123 (ADMIN)
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const MASTER_USERS = [
  { email: 'dantydias@gmail.com', password: 'dantydias123', name: 'Danty Dias' },
  { email: 'azetus.io@gmail.com', password: 'Matheus123', name: 'Matheus Azevedo' }
];

async function main() {
  console.log('🔐 Injetando usuários master...');
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
    console.log('   ✅', user.email, '(' + user.name + ')');
  }
  console.log('✨ Usuários master injetados.');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao injetar usuários:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
