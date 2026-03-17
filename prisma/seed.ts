import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      name: "Cerveza Quilmes",
      description: "Lata 473ml",
      price: 1500,
      category: "cerveza",
      imageUrl: "",
      stock: 200,
    },
    {
      name: "Cerveza Brahma",
      description: "Lata 473ml",
      price: 1400,
      category: "cerveza",
      imageUrl: "",
      stock: 200,
    },
    {
      name: "Fernet Branca",
      description: "Botella 750ml",
      price: 12000,
      category: "fernet",
      imageUrl: "",
      stock: 50,
    },
    {
      name: "Coca Cola",
      description: "Botella 2L",
      price: 2500,
      category: "gaseosa",
      imageUrl: "",
      stock: 100,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        id: product.name.toLowerCase().replace(/\s/g, "-"),
      },
      update: product,
      create: {
        id: product.name.toLowerCase().replace(/\s/g, "-"),
        ...product,
      },
    });
  }

  console.log("Productos cargados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
