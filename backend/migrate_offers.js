const prisma = require('./src/lib/prisma');

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Product"
      ADD COLUMN IF NOT EXISTS "discountPercent" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "offerStart"      TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "offerEnd"        TIMESTAMP(3);
  `);
  console.log('✓ Columnas agregadas correctamente');
}

main()
  .catch(e => { console.error('✗ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
