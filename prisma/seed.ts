const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // Limpiar datos previos
  console.log('🗑️  Limpiando datos previos...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('✓ Base de datos limpia\n');

  // Crear 6 productos
  console.log('🍺 Creando productos...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: 'cerveza-quilmes',
        name: 'Cerveza Quilmes',
        description: 'Lata 355ml - Clásica',
        price: 150000,  // $1500 centavos
        category: 'cerveza',
        stock: 200,
      },
    }),
    prisma.product.create({
      data: {
        id: 'cerveza-brahma',
        name: 'Cerveza Brahma',
        description: 'Lata 350ml - Tradicional',
        price: 140000,  // $1400
        category: 'cerveza',
        stock: 200,
      },
    }),
    prisma.product.create({
      data: {
        id: 'cerveza-corona',
        name: 'Cerveza Corona',
        description: 'Botella 355ml - Premium',
        price: 250000,  // $2500
        category: 'cerveza',
        stock: 150,
      },
    }),
    prisma.product.create({
      data: {
        id: 'fernet-branca',
        name: 'Fernet Branca',
        description: 'Botella 750ml - Digestivo',
        price: 1200000,  // $12000
        category: 'fernet',
        stock: 50,
      },
    }),
    prisma.product.create({
      data: {
        id: 'coca-cola',
        name: 'Coca-Cola',
        description: 'Lata 355ml - Bebida',
        price: 250000,  // $2500
        category: 'combinado',
        stock: 100,
      },
    }),
    prisma.product.create({
      data: {
        id: 'sprite',
        name: 'Sprite',
        description: 'Lata 355ml - Lima Limón',
        price: 250000,  // $2500
        category: 'combinado',
        stock: 100,
      },
    }),
  ]);

  console.log(`✓ ${products.length} productos creados\n`);
  products.forEach((p) => {
    console.log(
      `  • [${p.id}] ${p.name}: $${(p.price / 100).toLocaleString('es-AR')} (Stock: ${p.stock})`
    );
  });

  // Crear órdenes de prueba
  console.log('\n📦 Creando órdenes de prueba...');
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        code: 'AR-0001',
        customerName: 'Juan Rodriguez',
        customerEmail: 'juan@example.com',
        customerPhone: '+54911234567',
        total: 300000,  // $3000
        status: 'PENDING_PAYMENT',
        items: {
          create: [
            {
              id: `item-001-1`,
              productId: 'cerveza-quilmes',
              quantity: 2,
              price: 150000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    prisma.order.create({
      data: {
        code: 'AR-0002',
        customerName: 'María Garcia',
        customerEmail: 'maria@example.com',
        customerPhone: '+54912345678',
        total: 2400000,
        status: 'PAYMENT_REVIEW',
        items: {
          create: [
            {
              id: `item-002-1`,
              productId: 'fernet-branca',
              quantity: 2,
              price: 1200000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    prisma.order.create({
      data: {
        code: 'AR-0003',
        customerName: 'Carlos López',
        customerEmail: 'carlos@example.com',
        customerPhone: '+54913456789',
        total: 650000,
        status: 'PAID',
        items: {
          create: [
            {
              id: `item-003-1`,
              productId: 'cerveza-quilmes',
              quantity: 2,
              price: 150000,
            },
            {
              id: `item-003-2`,
              productId: 'coca-cola',
              quantity: 1,
              price: 250000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    prisma.order.create({
      data: {
        code: 'AR-0004',
        customerName: 'Ana Martinez',
        customerEmail: 'ana@example.com',
        customerPhone: '+54914567890',
        total: 500000,
        status: 'REDEEMED',
        items: {
          create: [
            {
              id: `item-004-1`,
              productId: 'cerveza-corona',
              quantity: 2,
              price: 250000,
            },
          ],
        },
      },
      include: { items: true },
    }),
  ]);

  console.log(`✓ ${orders.length} órdenes creadas\n`);
  orders.forEach((o) => {
    let status = '?';
    if (o.status === 'PENDING_PAYMENT') status = '⏳';
    if (o.status === 'PAYMENT_REVIEW') status = '👀';
    if (o.status === 'PAID') status = '✓';
    if (o.status === 'REDEEMED') status = '📦';
    if (o.status === 'CANCELLED') status = '✗';
    console.log(`  ${status} ${o.code}: ${o.customerName} - $${(o.total / 100).toLocaleString('es-AR')}`);
  });

  console.log('\n✅ Seed completado correctamente!\n');
  console.log('📊 Resumen:');
  console.log(`  • ${products.length} productos`);
  console.log(`  • ${orders.length} órdenes de prueba`);
  console.log('  • Estado: Listo para testing\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
