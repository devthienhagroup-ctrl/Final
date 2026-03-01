// scripts/bootstrap-db.js
// Tạo database (DATABASE_URL, SHADOW_DATABASE_URL) nếu chưa có + GRANT quyền cho user app.
// Dùng mysql2/promise.

const mysql = require("mysql2/promise");

function parseConnection(urlString) {
  const url = new URL(urlString);
  const database = url.pathname.replace(/^\//, "");

  if (!database) throw new Error(`DATABASE_URL thiếu tên database: ${urlString}`);

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
    database,
  };
}

function escapeIdentifier(value) {
  return String(value).replace(/`/g, "``");
}
function escapeSqlString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function getAdminCredentials(config) {
  const rootPassword = process.env.MYSQL_ROOT_PASSWORD;

  if (rootPassword) {
    return {
      user: process.env.MYSQL_ROOT_USER || "root",
      password: rootPassword,
    };
  }

  // fallback: dùng chính user trong DATABASE_URL
  return {
    user: config.user,
    password: config.password,
  };
}

async function ensureDatabase(urlString, label) {
  if (!urlString) return;

  const cfg = parseConnection(urlString);
  const admin = getAdminCredentials(cfg);

  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: admin.user,
    password: admin.password,
    multipleStatements: false,
  });

  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${escapeIdentifier(
        cfg.database
      )}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    if (cfg.user) {
      await conn.query(
        `GRANT ALL PRIVILEGES ON \`${escapeIdentifier(
          cfg.database
        )}\`.* TO '${escapeSqlString(cfg.user)}'@'%'`
      );
      await conn.query("FLUSH PRIVILEGES");
    }

    console.log(
      `✅ DB ready: ${label} -> ${cfg.database} @ ${cfg.host}:${cfg.port}` +
        (cfg.user ? ` (granted to ${cfg.user})` : "")
    );
  } finally {
    await conn.end();
  }
}

async function main() {
  await ensureDatabase(process.env.DATABASE_URL, "DATABASE_URL");
  await ensureDatabase(process.env.SHADOW_DATABASE_URL, "SHADOW_DATABASE_URL");
}

main().catch((err) => {
  console.error("❌ bootstrap-db failed:", err);
  process.exit(1);
});