import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {

  const products = [
    {
      id: randomUUID(),
      name: "Cerveza Quilmes",
      description: "Lata 473ml",
      price: 1500,
      category: "cerveza",
      imageUrl: "",
      stock: 200,
    },
    {
        id: randomUUID(),
        name: "Cerveza Corona",
        description: "Lata 473ml",
        price: 1800,
        category: "cerveza",
        imageUrl: "",
        stock: 150,
      },
        {
        id: randomUUID(),
        name: "Cerveza Heineken",
        description: "Lata 473ml",
        price: 1700,
        category: "cerveza",
        imageUrl: "",
        stock: 180,
        },
            {
        id: randomUUID(),
        name: "Cerveza Stella Artois",
        description: "Lata 473ml",
        price: 1600,
        category: "cerveza",
        imageUrl: "",
        stock: 170,
        }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        ...product,
      },
    });
  }

  console.log("⬜ Productos cargados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });