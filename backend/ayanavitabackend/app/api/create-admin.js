const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();

  const email = 'admin@ayanavita.com';
  const password = '123456'; // đổi sau khi đăng nhập
  const hashedPassword = await bcrypt.hash(password, 10);

  // xoá admin cũ nếu có
  await prisma.user.deleteMany({
    where: { email },
  });

  // tạo admin mới
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'ADMIN', // phải đúng enum Role trong schema.prisma
      isActive: true,
    },
  });

  console.log('ADMIN CREATED:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  await prisma.$disconnect();
})();
