const mysql = require('mysql2/promise')

function parseConnection(urlString) {
  const url = new URL(urlString)
  const database = url.pathname.replace(/^\//, '')

  if (!database) {
    throw new Error(`DATABASE_URL thiếu tên database: ${urlString}`)
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  }
}

function escapeIdentifier(value) {
  return String(value).replace(/`/g, '``')
}

function escapeSqlString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function getAdminCredentials(config) {
  const rootPassword = process.env.MYSQL_ROOT_PASSWORD

  if (rootPassword) {
    return {
      user: process.env.MYSQL_ROOT_USER || 'root',
      password: rootPassword,
    }
  }

  return {
    user: config.user,
    password: config.password,
  }
}

async function ensureDatabase(urlString, label) {
  if (!urlString) {
    return
  }

  const config = parseConnection(urlString)
  const adminCredentials = getAdminCredentials(config)

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: adminCredentials.user,
    password: adminCredentials.password,
    multipleStatements: false,
  })

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${escapeIdentifier(config.database)}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)

    await connection.query(
      `GRANT ALL PRIVILEGES ON \`${escapeIdentifier(config.database)}\`.* TO '${escapeSqlString(config.user)}'@'%'`,
    )

    await connection.query('FLUSH PRIVILEGES')

    console.log(`✅ Đã đảm bảo database cho ${label}: ${config.database} (granted to ${config.user})`)
  } finally {
    await connection.end()
  }
}

async function main() {
  await ensureDatabase(process.env.DATABASE_URL, 'DATABASE_URL')
  await ensureDatabase(process.env.SHADOW_DATABASE_URL, 'SHADOW_DATABASE_URL')
}

main().catch((error) => {
  console.error('❌ Không thể bootstrap database:', error)
  process.exit(1)
})