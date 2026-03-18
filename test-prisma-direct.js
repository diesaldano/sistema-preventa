// Test directo de conexión Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Conectando a base de datos...');
    const products = await prisma.product.findMany();
    console.log('Productos encontrados:', products.length);
    
    console.log('Creando orden de prueba...');
    const order = await prisma.order.create({
      data: {
        code: 'TEST-' + Date.now(),
        customerName: 'Test User',
        customerEmail: 'test@test.com',
        customerPhone: '+54911111111',
        total: 300000,
        status: 'PENDING_PAYMENT',
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 2,
              price: 150000
            }
          ]
        }
      },
      include: { items: true }
    });
    
    console.log('Orden creada:', order.code);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
