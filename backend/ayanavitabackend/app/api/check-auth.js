const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  const email = 'test@ayanavita.com';

  const user = await prisma.user.findUnique({ where: { email } });
  console.log('User from DB:', user ? {
    id: user.id,
    email: user.email,
    passwordPrefix: (user.password || '').slice(0, 4),
    passwordLength: (user.password || '').length
  } : null);

  if (!user) {
    console.log('USER NOT FOUND');
    await prisma.$disconnect();
    return;
  }

  const ok = await bcrypt.compare('123456', user.password);
  console.log('bcrypt.compare =', ok);

  await prisma.$disconnect();
})();
