#!/bin/sh
set -eu

echo "Installing dependencies..."
npm install

resolve_failed_migration() {
  migration_name="$1"

  set +e
  output=$(npx prisma migrate resolve --rolled-back "$migration_name" 2>&1)
  status=$?
  set -e

  if [ "$status" -eq 0 ]; then
    echo "Marked failed migration as rolled back: $migration_name"
    return 0
  fi

  # P3012 means the migration is not in failed state; this is safe to ignore.
  if printf '%s' "$output" | grep -q "P3012"; then
    return 0
  fi

  echo "$output"
  echo "Failed to resolve migration state for: $migration_name"
  return "$status"
}

mark_migration_as_applied_if_needed() {
  migration_name="$1"

  set +e
  output=$(npx prisma migrate resolve --applied "$migration_name" 2>&1)
  status=$?
  set -e

  if [ "$status" -eq 0 ]; then
    echo "Marked migration as applied: $migration_name"
    return 0
  fi

  # P3008 means the migration is already recorded as applied; this is safe to ignore.
  if printf '%s' "$output" | grep -q "P3008"; then
    return 0
  fi

  echo "$output"
  echo "Failed to mark migration as applied: $migration_name"
  return "$status"
}

echo "Resolving known non-critical migration states (if present)..."
resolve_failed_migration 20260226130000_add_product_images
resolve_failed_migration 202603150001_add_cart_tables

# 202603110001_lesson_stt_refactor was applied manually and is now a no-op migration.
# Depending on the database state, Prisma can report it as failed or pending.
# We first resolve failed state (if any), then mark as applied so deploy can continue safely.
resolve_failed_migration 202603110001_lesson_stt_refactor
mark_migration_as_applied_if_needed 202603110001_lesson_stt_refactor

echo "Applying migrations..."
npx prisma migrate deploy

echo "Generating Prisma client and seeding database..."
npx prisma generate
npx prisma db seed

echo "Starting NestJS in watch mode..."
npm run start:dev
