# 🚀 Sistema de Preventa - Diez Producciones

Sistema de **preventa digital de bebidas para eventos**
Solución personalizada para **Diez Producciones**

Permite vender bebidas antes del evento, validar pagos y retirar con un **código único** el día del evento.

---

# 📋 Resumen del Proyecto

| Aspecto   | Descripción                                |
| --------- | ------------------------------------------ |
| Objetivo  | Preventa digital de bebidas                |
| Escala    | 500 personas iniciales (escalable a 1000+) |
| Pago      | Transferencia bancaria (Alias / CBU)       |
| Seguridad | Código único de retiro                     |
| Estado    | Beta funcional                             |

---

# 🧠 Idea del Sistema

Flujo simple:

Compra → Validación de pago → Retiro en evento

Beneficios:

* evita filas
* asegura stock
* pago anticipado
* retiro rápido

---

# 👤 Flujo de Usuario

## COMPRA ANTICIPADA

1 Usuario entra a `/`
2 Selecciona bebidas
3 Click **Continuar al pago**
4 Completa datos

* nombre
* teléfono
* email

5 Ve alias para transferir
6 Sube comprobante
7 Recibe código único

Ejemplo:

```
AR-483
```

Estado del pedido:

```
PENDING_VALIDATION
```

---

## VALIDACIÓN (ADMIN)

Admin entra a:

```
/admin
```

Ve pedidos pendientes

Opciones:

* Validar pago
* Rechazar

Estados posibles:

```
CONFIRMED
CANCELLED
```

---

## DÍA DEL EVENTO

Staff entra a:

```
/despacho
```

Cliente muestra código:

```
AR-483
```

Sistema muestra pedido.

Si está confirmado:

```
ENTREGAR PEDIDO
```

Estado final:

```
DELIVERED
```

El código **no puede reutilizarse**.

---

# 🌐 API

## Productos

GET

```
/api/products
```

Lista productos disponibles.

---

## Pedidos

Crear pedido

POST

```
/api/orders
```

---

Obtener pedido

GET

```
/api/orders/[code]
```

---

Validar pago

POST

```
/api/orders/[code]/validate
```

---

Rechazar pedido

POST

```
/api/orders/[code]/reject
```

---

Entregar pedido

POST

```
/api/orders/[code]/deliver
```

---

# 📁 Estructura del Proyecto

```
src

app
 ├ page.tsx
 ├ layout.tsx
 ├ globals.css

 ├ checkout
 │  └ page.tsx

 ├ pedido
 │  └ [code]
 │     └ page.tsx

 ├ despacho
 │  └ page.tsx

 ├ admin
 │  └ page.tsx

 └ api
    ├ products
    │  └ route.ts
    └ orders
       ├ route.ts
       └ [code]
          ├ route.ts
          ├ validate
          │  └ route.ts
          ├ reject
          │  └ route.ts
          └ deliver
             └ route.ts

lib
 ├ mock-db.ts
 ├ types.ts
 ├ utils.ts
 └ db.ts

prisma
 ├ schema.prisma
 └ seed.ts
```

---

# 🗄 Base de Datos

Estado actual:

Mock DB en memoria.

⚠ Se pierde al reiniciar servidor.

Próximo paso:

Conectar con **Supabase + Prisma**

---

# 📦 schema.prisma

```
generator client {
 provider = "prisma-client-js"
}

datasource db {
 provider = "postgresql"
 url      = env("DATABASE_URL")
}

model Product {

 id          String @id
 name        String
 description String
 price       Int
 category    String
 imageUrl    String
 stock       Int
}

model Order {

 code        String @id
 name        String
 email       String
 phone       String

 items       Json

 total       Int
 status      String

 createdAt   DateTime @default(now())
}
```

---

# 🌱 prisma/seed.ts

```
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
  }

 ];

 for (const product of products) {

  await prisma.product.upsert({

   where: {
    id: product.name.toLowerCase().replace(/\s/g,"-")
   },

   update: product,

   create: {
    id: product.name.toLowerCase().replace(/\s/g,"-"),
    ...product
   }

  });

 }

 console.log("Productos cargados");

}

main()
.catch((e)=>{
 console.error(e)
 process.exit(1)
})
.finally(async()=>{
 await prisma.$disconnect()
})
```

---

# 🧾 types.ts

```
export type Product = {

 id: string
 name: string
 description: string
 price: number
 category: string
 imageUrl: string
 stock: number

}

export type Order = {

 code: string
 name: string
 email: string
 phone: string

 items: any[]

 total: number

 status:

 | "PENDING_VALIDATION"
 | "CONFIRMED"
 | "CANCELLED"
 | "DELIVERED"

}
```

---

# 🧠 utils.ts

```
export function generateCode(){

 const number = Math.floor(
  100 + Math.random() * 900
 )

 return "AR-" + number

}
```

---

# 🗂 mock-db.ts

```
import { Product, Order } from "./types"

export const products: Product[] = []

export const orders: Order[] = []
```

---

# ⚙️ Stack Tecnológico

* Next.js
* TypeScript
* Prisma
* Supabase
* Tailwind

---

# 🚀 Próximos Pasos

1 Conectar Prisma con Supabase
2 Persistencia real
3 Subida de comprobantes
4 Dashboard admin
5 Estadísticas de ventas

---

# 🎯 Objetivo Final

Sistema rápido para eventos de:

```
500 - 1000 personas
```

Con:

* preventa
* validación de pago
* retiro rápido

---

# 💡 Usar GitHub Copilot para Crear/Editar Archivos

## Pasos:

1. **Instala la extensión de Copilot** en VS Code
   - Ve a Extensions → Busca "GitHub Copilot"
   - Instala y autoriza con tu cuenta GitHub

2. **Para crear un nuevo archivo:**
   - Crea la carpeta/archivo manualmente
   - Abre el archivo vacío
   - Escribe un comentario describiendo qué quieres:
   ```typescript
   // Crear componente de carrito con TypeScript y React
   ```
   - Copilot sugerirá código. Presiona Tab para aceptar
   - Continúa escribiendo comentarios para guiar el código

3. **Para editar archivos existentes:**
   - Abre el archivo
   - Coloca el cursor donde quieres cambiar
   - Escribe comentarios describiendo qué hacer:
   ```typescript
   // Agregar función para validar email
   ```
   - Copilot completará automáticamente

4. **Atajos útiles:**
   - `Ctrl + Shift + A` - Abrir chat de Copilot
   - `Ctrl + Enter` - Ver más sugerencias
   - `Alt + ]` - Siguiente sugerencia

5. **En el chat de Copilot:**
   - Pide: "Crea el archivo `lib/db.ts` con conexión a Prisma"
   - Pide: "Agrega validación de email en el archivo checkout/page.tsx"
   - Copilot generará código listo para copiar

**Tip:** Describe el contexto (Next.js, TypeScript, Tailwind) para mejores sugerencias.
