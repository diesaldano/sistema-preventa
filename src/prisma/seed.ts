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
        name: "Cerveza Corona",
        description: "Lata 473ml",
        price: 1800,
        category: "cerveza",
        imageUrl: "",
        stock: 150,
      },
        {
        name: "Cerveza Heineken",
        description: "Lata 473ml",
        price: 1700,
        category: "cerveza",
        imageUrl: "",
        stock: 180,
        },
            {
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
        slug: product.name.toLowerCase().replace(/\s/g, "-"),
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