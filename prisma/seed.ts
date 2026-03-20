const { PrismaClient } = require('@prisma/client');

// Tipos para TypeScript
type OrderStatus = 'PENDING_PAYMENT' | 'PAYMENT_REVIEW' | 'PAID' | 'REDEEMED' | 'CANCELLED';

const prisma = new PrismaClient();

// Función reutilizable para formatear precios
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // Limpiar datos previos
  console.log('🗑️  Limpiando datos previos...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('✓ Base de datos limpia\n');

  // Crear 10 productos realistas
  console.log('🍺 Creando productos...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: 'agua-mineral',
        name: 'Agua Mineral',
        description: 'Lata 355ml - Natural',
        price: 3000,  // $3.000
        category: 'bebidas',
        stock: 300,
      },
    }),
    prisma.product.create({
      data: {
        id: 'coca-cola-lata',
        name: 'Coca-Cola',
        description: 'Lata 355ml',
        price: 6000,  // $6.000
        category: 'bebidas',
        stock: 250,
      },
    }),
    prisma.product.create({
      data: {
        id: 'quilmes-lata',
        name: 'Cerveza Quilmes',
        description: 'Lata 355ml - Clásica',
        price: 6000,  // $6.000
        category: 'cerveza',
        stock: 200,
      },
    }),
    prisma.product.create({
      data: {
        id: 'stella-artois',
        name: 'Cerveza Stella Artois',
        description: 'Lata 354ml - Premium',
        price: 7000,  // $7.000
        category: 'cerveza',
        stock: 180,
      },
    }),
    prisma.product.create({
      data: {
        id: 'remera-diez',
        name: 'Remera DIEZ',
        description: 'Remera oficial DIEZ Producciones',
        price: 15000,  // $15.000
        category: 'merch',
        stock: 100,
      },
    }),
    prisma.product.create({
      data: {
        id: 'remera-salamanca',
        name: 'Remera Salamanca',
        description: 'Remera oficial Salamanca',
        price: 15000,  // $15.000
        category: 'merch',
        stock: 100,
      },
    }),
    prisma.product.create({
      data: {
        id: 'entrada-envio',
        name: 'Entrada + Envío',
        description: 'Entrada + Envío Cuatro Avenidas, Tucumán',
        price: 35000,  // $35.000
        category: 'entrada',
        stock: 500,
      },
    }),
    prisma.product.create({
      data: {
        id: 'combo-fernet-coca',
        name: 'Combo: Fernet medianol + Coca Grande',
        description: 'Pack promotivo - Fernet medianol botella + Coca-Cola grande',
        price: 40000,  // $40.000
        category: 'combo',
        stock: 80,
      },
    }),
    prisma.product.create({
      data: {
        id: 'fernet-medianol',
        name: 'Fernet Medianol',
        description: 'Botella 750ml - Bebida alcohólica',
        price: 8000,  // $8.000
        category: 'bebidas',
        stock: 120,
      },
    }),
    prisma.product.create({
      data: {
        id: 'pack-quilmes-4',
        name: 'Pack Cerveza Quilmes 4 Latas',
        description: 'Pack 4 latas de 355ml cada una',
        price: 24000,  // $24.000
        category: 'cerveza',
        stock: 150,
      },
    }),
  ]);

  console.log(`✓ ${products.length} productos creados\n`);
  products.forEach((p) => {
    console.log(
      `  • [${p.id}] ${p.name}: $${formatPrice(p.price)} (Stock: ${p.stock})`
    );
  });

  // Crear 10 órdenes de prueba
  console.log('\n📦 Creando órdenes de prueba...');
  const orders = await Promise.all([
    // Orden 1 - PENDING_PAYMENT
    prisma.order.create({
      data: {
        code: 'AR-0001',
        customerName: 'Juan Rodriguez',
        customerEmail: 'juan@example.com',
        customerPhone: '+54911234567',
        total: 12000,  // $12.000
        status: 'PENDING_PAYMENT' as OrderStatus,
        items: {
          create: [
            {
              id: `item-001-1`,
              productId: 'quilmes-lata',
              quantity: 2,
              price: 6000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    // Orden 2 - PAYMENT_REVIEW
    prisma.order.create({
      data: {
        code: 'AR-0002',
        customerName: 'María Garcia',
        customerEmail: 'maria@example.com',
        customerPhone: '+54912345678',
        total: 15000,  // $15.000
        status: 'PAYMENT_REVIEW' as OrderStatus,
        items: {
          create: [
            {
              id: `item-002-1`,
              productId: 'coca-cola-lata',
              quantity: 2,
              price: 6000,
            },
            {
              id: `item-002-2`,
              productId: 'agua-mineral',
              quantity: 1,
              price: 3000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    // Orden 3 - PAID
    prisma.order.create({
      data: {
        code: 'AR-0003',
        customerName: 'Carlos López',
        customerEmail: 'carlos@example.com',
        customerPhone: '+54913456789',
        total: 40000,  // $40.000
        status: 'PAID' as OrderStatus,
        items: {
          create: [
            {
              id: `item-003-1`,
              productId: 'combo-fernet-coca',
              quantity: 1,
              price: 40000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    // Orden 4 - PAID
    prisma.order.create({
      data: {
        code: 'AR-0004',
        customerName: 'Ana Martinez',
        customerEmail: 'ana@example.com',
        customerPhone: '+54914567890',
        total: 35000,  // $35.000
        status: 'PAID' as OrderStatus,
        items: {
          create: [
            {
              id: `item-004-1`,
              productId: 'entrada-envio',
              quantity: 1,
              price: 35000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    // Orden 5 - REDEEMED
    prisma.order.create({
      data: {
        code: 'AR-0005',
        customerName: 'Diego Saldaño',
        customerEmail: 'diego@example.com',
        customerPhone: '+54915678901',
        total: 24000,  // $24.000
        status: 'REDEEMED' as OrderStatus,
        items: {
          create: [
            {
              id: `item-005-1`,
              productId: 'pack-quilmes-4',
              quantity: 1,
              price: 24000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    // Orden 6 - PENDING_PAYMENT
    prisma.order.create({
      data: {
        code: 'AR-0006',
        customerName: 'Laura Ferreira',
        customerEmail: 'laura@example.com',
        customerPhone: '+54916789012',
        total: 15000,  // $15.000
        status: 'PENDING_PAYMENT' as OrderStatus,
        items: {
          create: [
            {
              id: `item-006-1`,
              productId: 'remera-diez',
              quantity: 1,
              price: 15000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    // Orden 7 - PAYMENT_REVIEW
    prisma.order.create({
      data: {
        code: 'AR-0007',
        customerName: 'Pablo Gonzalez',
        customerEmail: 'pablo@example.com',
        customerPhone: '+54917890123',
        total: 34000,  // $34.000
        status: 'PAYMENT_REVIEW' as OrderStatus,
        items: {
          create: [
            {
              id: `item-007-1`,
              productId: 'stella-artois',
              quantity: 4,
              price: 7000,
            },
            {
              id: `item-007-2`,
              productId: 'coca-cola-lata',
              quantity: 1,
              price: 6000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    // Orden 8 - PAID
    prisma.order.create({
      data: {
        code: 'AR-0008',
        customerName: 'Sofia Navarro',
        customerEmail: 'sofia@example.com',
        customerPhone: '+54918901234',
        total: 8000,  // $8.000
        status: 'PAID' as OrderStatus,
        items: {
          create: [
            {
              id: `item-008-1`,
              productId: 'fernet-medianol',
              quantity: 1,
              price: 8000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    // Orden 9 - REDEEMED
    prisma.order.create({
      data: {
        code: 'AR-0009',
        customerName: 'Roberto Pérez',
        customerEmail: 'roberto@example.com',
        customerPhone: '+54919012345',
        total: 30000,  // $30.000
        status: 'REDEEMED' as OrderStatus,
        items: {
          create: [
            {
              id: `item-009-1`,
              productId: 'remera-salamanca',
              quantity: 2,
              price: 15000,
            },
          ],
        },
      },
      include: { items: true },
    }),
    // Orden 10 - CANCELLED
    prisma.order.create({
      data: {
        code: 'AR-0010',
        customerName: 'Valentina Ruiz',
        customerEmail: 'valentina@example.com',
        customerPhone: '+54910123456',
        total: 6000,  // $6.000
        status: 'CANCELLED' as OrderStatus,
        items: {
          create: [
            {
              id: `item-010-1`,
              productId: 'agua-mineral',
              quantity: 2,
              price: 3000,
            },
          ],
        },
      },
      include: { items: true },
    }),
  ]);

  console.log(`✓ ${orders.length} órdenes de prueba creadas\n`);
  orders.forEach((o) => {
    console.log(
      `  • [${o.code}] ${o.customerName}: ${formatPrice(o.total)} - ${o.status} (${o.items.length} item${o.items.length > 1 ? 's' : ''})`
    );
  });

  console.log('\n✅ Seed completado correctamente!');
  console.log(`  • ${products.length} productos`);
  console.log(`  • ${orders.length} órdenes de prueba`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });