const { PrismaClient } = require('@prisma/client');

async function logProducts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n📦 TABLA PRODUCT - REGISTROS ACTUALES\n');
    console.log('='.repeat(80));

    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (products.length === 0) {
      console.log('ℹ️  No hay productos registrados');
    } else {
      console.log(`✓ Total de productos: ${products.length}\n`);
      
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Precio: $${product.price}`);
        console.log(`   Descripción: ${product.description || 'N/A'}`);
        console.log(`   Imagen: ${product.image || 'N/A'}`);
        console.log(`   Stock: ${product.stock}`);
        console.log(`   Disponible: ${product.available}`);
        console.log(`   Tallas: ${product.sizes ? product.sizes.join(', ') : 'N/A'}`);
        console.log(`   Creado: ${product.createdAt}`);
        console.log(`   Actualizado: ${product.updatedAt}`);
        console.log('');
      });
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

logProducts();
