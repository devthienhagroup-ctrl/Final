#!/bin/sh
set -eu

echo "Installing dependencies..."
npm install

echo "Resolving known non-critical migration states (if present)..."
# These commands are idempotent: if the migration is not failed, Prisma returns P3012.
# We intentionally ignore that case so startup can continue.
npx prisma migrate resolve --rolled-back 20260226130000_add_product_images || true
npx prisma migrate resolve --rolled-back 202603150001_add_cart_tables || true

echo "Applying migrations..."
npx prisma migrate deploy

echo "Generating Prisma client and seeding database..."
npx prisma generate
npx prisma db seed

echo "Starting NestJS in watch mode..."
npm run start:dev
