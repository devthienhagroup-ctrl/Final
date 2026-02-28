const { execSync } = require('node:child_process')
function run(command, options = {}) {
  console.log(`\n➡️  ${command}`)
  execSync(command, {
    stdio: 'inherit',
    env: process.env,
    ...options,
  })
}

async function hasUserTable() {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()

  try {
    const rows = await prisma.$queryRawUnsafe("SHOW TABLES LIKE 'User'")
    return Array.isArray(rows) && rows.length > 0
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  run('node scripts/bootstrap-db.js')
  const rollbackMigrations = [
    '20260226130000_add_product_images',
    '202603080001_course_translation_strings',
  ]

  for (const migrationName of rollbackMigrations) {
    try {
      run(`npx prisma migrate resolve --rolled-back ${migrationName}`)
    } catch (error) {
      console.log(`ℹ️ Bỏ qua migrate resolve cho ${migrationName} vì migration này không cần rollback ở môi trường hiện tại.`)
    }
  }
  run('npx prisma migrate deploy')
  run('npx prisma generate')

  const userTableExists = await hasUserTable()

  if (!userTableExists) {
    console.log('⚠️ Không thấy bảng User sau migrate deploy, chạy thêm prisma db push để đồng bộ schema.')
    run('npx prisma db push')
    run('npx prisma generate')
  }

  run('npx prisma db seed')
}

main().catch((error) => {
  console.error('\n❌ Prisma setup thất bại:', error)
  process.exit(1)
})