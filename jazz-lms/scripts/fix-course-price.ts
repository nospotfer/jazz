import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_FULL_COURSE_PRICE_EUR = 29.99;

async function main() {
  const result = await prisma.course.updateMany({
    where: {
      price: {
        gt: 0,
      },
    },
    data: {
      price: DEFAULT_FULL_COURSE_PRICE_EUR,
    },
  });

  console.log(`✅ Precio actualizado a €${DEFAULT_FULL_COURSE_PRICE_EUR.toFixed(2)} en ${result.count} curso(s).`);
}

main()
  .catch((error) => {
    console.error('❌ Error al actualizar el precio del curso:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
