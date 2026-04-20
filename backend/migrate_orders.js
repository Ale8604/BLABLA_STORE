const prisma = require('./src/lib/prisma');

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "invoiceCode" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "clientName" TEXT NOT NULL DEFAULT ''`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "clientPhone" TEXT NOT NULL DEFAULT ''`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT ''`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "specs" TEXT NOT NULL DEFAULT ''`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Order_invoiceCode_key" ON "Order"("invoiceCode")`);
  console.log('✓ Columnas de facturación agregadas');
}

main()
  .catch(e => { console.error('✗ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
