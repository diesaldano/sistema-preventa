import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de base de datos...\n");

  // Limpiar datos previos
  console.log("🗑️  Limpiando datos previos...");
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("✓ Base de datos limpia\n");

  // 10 Productos con categorías variadas
  console.log("🍺 Creando 10 productos...");
  const products = [
    {
      id: randomUUID(),
      name: "Cerveza Norte Lata 473ml",
      description: "Cerveza clásica - Lata 473ml",
      price: 600000, // $60 ARS
      category: "cerveza",
      imageUrl: "",
      stock: 250,
    },
    {
      id: randomUUID(),
      name: "Fernet Branca 750ml",
      description: "Fernet Branca - Botella 750ml",
      price: 800000, // $80 ARS
      category: "fernet",
      imageUrl: "",
      stock: 100,
    },
    {
      id: randomUUID(),
      name: "Coca-Cola 2.25L",
      description: "Coca-Cola - Botella 2.25L",
      price: 500000, // $50 ARS
      category: "gaseosa",
      imageUrl: "",
      stock: 150,
    },
    {
      id: randomUUID(),
      name: "Combo Cerveza + Fernet",
      description: "Combo: 1 Cerveza Norte + 1 Fernet (Cuatro Avenidas, Tucumán)",
      price: 1300000, // $130 ARS
      category: "combo",
      imageUrl: "",
      stock: 80,
    },
    {
      id: randomUUID(),
      name: "Remera DIEZ Producciones",
      description: "Remera oficial - Talles S-M-L-XL-XXL",
      price: 1500000, // $150 ARS
      category: "merch",
      imageUrl: "",
      stock: 200,
    },
    {
      id: randomUUID(),
      name: "Vaso Térmico DIEZ",
      description: "Vaso térmico reutilizable - 500ml",
      price: 900000, // $90 ARS
      category: "merch",
      imageUrl: "",
      stock: 120,
    },
    {
      id: randomUUID(),
      name: "Entrada + Envío a Cuatro Avenidas",
      description: "Entrada para evento + Envío al punto de retiro (Cuatro Avenidas, Tucumán)",
      price: 500000, // $50 ARS (solo envío)
      category: "entrada",
      imageUrl: "",
      stock: 500,
    },
    {
      id: randomUUID(),
      name: "Heineken Lata 473ml",
      description: "Cerveza Premium - Lata 473ml",
      price: 750000, // $75 ARS
      category: "cerveza",
      imageUrl: "",
      stock: 180,
    },
    {
      id: randomUUID(),
      name: "Sprite 2L",
      description: "Sprite - Botella 2L",
      price: 550000, // $55 ARS
      category: "gaseosa",
      imageUrl: "",
      stock: 140,
    },
    {
      id: randomUUID(),
      name: "Combo Pista Completa",
      description: "Entrada + Merch + Bebida (Kit VIP - Cuatro Avenidas, Tucumán)",
      price: 3000000, // $300 ARS
      category: "combo",
      imageUrl: "",
      stock: 50,
    },
  ];

  // Crear productos
  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log(`✓ ${products.length} productos creados\n`);

  // Crear órdenes de ejemplo con diferentes estados
  console.log("📋 Creando órdenes de ejemplo...");
  const orders = [
    {
      code: "AR-001",
      customerName: "Juan Pérez",
      customerEmail: "juan@example.com",
      customerPhone: "3815551234",
      total: 1300000, // $130
      status: "PENDING_PAYMENT" as OrderStatus,
      items: [
        {
          productId: products[3].id, // Combo Cerveza + Fernet
          quantity: 1,
          price: 1300000,
        },
      ],
    },
    {
      code: "AR-002",
      customerName: "María García",
      customerEmail: "maria@example.com",
      customerPhone: "3815555678",
      total: 2250000, // $225
      status: "PAYMENT_REVIEW" as OrderStatus,
      items: [
        {
          productId: products[4].id, // Remera
          quantity: 1,
          price: 1500000,
        },
        {
          productId: products[5].id, // Vaso
          quantity: 1,
          price: 900000,
        },
      ],
    },
    {
      code: "AR-003",
      customerName: "Carlos López",
      customerEmail: "carlos@example.com",
      customerPhone: "3815559999",
      total: 600000, // $60
      status: "PAID" as OrderStatus,
      items: [
        {
          productId: products[0].id, // Cerveza Norte
          quantity: 1,
          price: 600000,
        },
      ],
    },
    {
      code: "AR-004",
      customerName: "Ana Martínez",
      customerEmail: "ana@example.com",
      customerPhone: "3815553333",
      total: 3000000, // $300
      status: "REDEEMED" as OrderStatus,
      items: [
        {
          productId: products[9].id, // Combo Pista Completa
          quantity: 1,
          price: 3000000,
        },
      ],
    },
    {
      code: "AR-005",
      customerName: "Diego Fernández",
      customerEmail: "diego@example.com",
      customerPhone: "3815557777",
      total: 1400000, // $140
      status: "CANCELLED" as OrderStatus,
      items: [
        {
          productId: products[1].id, // Fernet
          quantity: 1,
          price: 800000,
        },
        {
          productId: products[2].id, // Coca-Cola
          quantity: 1,
          price: 600000,
        },
      ],
    },
  ];

  for (const order of orders) {
    const { items, ...orderData } = order;
    await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });
  }

  console.log(`✓ ${orders.length} órdenes de ejemplo creadas\n`);
  console.log("✅ Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });