// scripts/prisma-setup.js
// Flow chuẩn:
// 1) bootstrap DB
// 2) resolve migration failed (mặc định: rolled-back cho 202603230001_add_blog_tables)
// 3) migrate deploy (hoặc reset nếu DEV_RESET=1)
// 4) generate + seed
//
// ENV tuỳ chọn:
// - DEV_RESET=1            => npx prisma migrate reset --force (DEV/local thôi)
// - RESOLVE_BLOG=applied   => nếu bạn đã apply blog tables bằng tay, set applied
// - RESOLVE_BLOG=rolled-back (default)
// - EXTRA_ROLLED_BACK="m1,m2" => thêm migrations cần mark rolled-back
// - EXTRA_APPLIED="m1,m2"     => thêm migrations cần mark applied

const { execSync } = require("node:child_process");

function run(cmd, options = {}) {
  console.log(`\n➡️  ${cmd}`);
  execSync(cmd, {
    stdio: "inherit",
    env: process.env,
    ...options,
  });
}

function parseList(envValue) {
  if (!envValue) return [];
  return String(envValue)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function tryResolve(flag, migrationName) {
  try {
    run(`npx prisma migrate resolve --${flag} ${migrationName}`);
    return true;
  } catch (e) {
    console.log(`ℹ️  Skip resolve ${migrationName} (--${flag})`);
    return false;
  }
}

async function main() {
  // 1) bootstrap DB (tạo DB + grant)
  run("node scripts/bootstrap-db.js");

  // 2) Fix cứng lỗi P3009 của bạn: migration blog đang FAILED
  // Mặc định rolled-back (an toàn hơn nếu migration fail do SQL).
  const blogResolveMode = (process.env.RESOLVE_BLOG || "rolled-back").toLowerCase();
  const blogMigration = "202603230001_add_blog_tables";

  if (blogResolveMode !== "rolled-back" && blogResolveMode !== "applied") {
    throw new Error(
      `RESOLVE_BLOG phải là "rolled-back" hoặc "applied". Hiện tại: ${process.env.RESOLVE_BLOG}`
    );
  }

  console.log(`\n🧩 Resolving failed migration: ${blogMigration} -> ${blogResolveMode}`);
  tryResolve(blogResolveMode, blogMigration);

  // 3) Resolve thêm nếu bạn cần (tuỳ môi trường)
  const extraRolledBack = parseList(process.env.EXTRA_ROLLED_BACK);
  const extraApplied = parseList(process.env.EXTRA_APPLIED);

  for (const m of extraRolledBack) tryResolve("rolled-back", m);
  for (const m of extraApplied) tryResolve("applied", m);

  // 4) DEV reset hoặc deploy
  if (process.env.DEV_RESET === "1") {
    console.log("\n🧨 DEV_RESET=1 => prisma migrate reset (DEV/local only)");
    run("npx prisma migrate reset --force");
  } else {
    run("npx prisma migrate deploy");
  }

  // 5) generate + seed
  run("npx prisma generate");
  run("npx prisma db seed");
}

main().catch((err) => {
  console.error("\n❌ prisma-setup failed:", err);
  process.exit(1);
});