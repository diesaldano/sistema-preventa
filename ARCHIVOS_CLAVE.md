# 📚 Referencia de Archivos Clave

## 1️⃣ `/src/lib/types.ts` - Tipado de Datos

Define todos los tipos de datos usados en la aplicación.

### Tipos Principales

```typescript
type OrderStatus = 'PENDING_VALIDATION' | 'CONFIRMED' | 'CANCELLED' | 'DELIVERED'
```

#### Product
```typescript
type Product = {
  id: string              // "cerveza-quilmes"
  name: string            // "Cerveza Quilmes"
  description: string     // "Lata 473ml"
  price: number           // 1500 (en centavos)
  category: string        // "cerveza", "gaseosa", "fernet"
  imageUrl: string        // URL de imagen (vacío por ahora)
  stock: number           // Cantidad disponible
}
```

#### Order (Pedido)
```typescript
type Order = {
  code: string                // "AR-483"
  customerName: string        // Nombre completo del cliente
  customerEmail: string       // Email
  customerPhone: string       // Teléfono
  items: OrderItem[]          // Array de productos comprados
  total: number               // Total en pesos
  status: OrderStatus         // Estado actual
  createdAt: Date             // Fecha de creación
  updatedAt: Date             // Última actualización
}
```

#### OrderItem
```typescript
type OrderItem = {
  productId: string     // ID del producto
  quantity: number      // Cantidad
  price: number         // Precio unitario
}
```

---

## 2️⃣ `/src/lib/mock-db.ts` - Base de Datos en Memoria

Simula una base de datos con 6 productos y gestión de pedidos.

### 📦 Base de Datos de Productos (6 items)

```
1. cerveza-quilmes      - $1.500  (200 stock)
2. cerveza-brahma       - $1.400  (200 stock)
3. cerveza-corona       - $2.500  (150 stock)  ← NUEVO
4. fernet-branca        - $12.000 (50 stock)
5. coca-cola            - $2.500  (100 stock)
6. sprite               - $2.500  (100 stock)  ← NUEVO
```

### 🎯 Funciones CRUD - Productos

#### Lectura
```typescript
productsDB.getAll()           // Obtener todos
productsDB.getById(id)        // Obtener por ID
productsDB.getByCategory(cat) // Filtrar por categoría
productsDB.getAvailable()     // Solo stock > 0
```

#### Crear
```typescript
productsDB.create(product)    // Crear nuevo producto
```

#### Actualizar
```typescript
productsDB.update(id, updates)        // Actualizar producto
productsDB.updateStock(id, quantity)  // Cambiar stock (+/-)
```

#### Eliminar
```typescript
productsDB.delete(id)         // Eliminar producto
```

---

### 🎯 Funciones CRUD - Órdenes

#### Lectura
```typescript
ordersDB.getAll()             // Todos los pedidos
ordersDB.getByCode(code)      // Buscar por código
ordersDB.getByStatus(status)  // Filtrar por estado
ordersDB.getByEmail(email)    // Pedidos de un cliente
ordersDB.getPending()         // Solo pendientes de validación
```

#### Crear
```typescript
ordersDB.create(order)        // Crear nuevo pedido
```

#### Actualizar
```typescript
ordersDB.updateStatus(code, status)   // Cambiar estado
ordersDB.update(code, updates)        // Actualizar campos
```

#### Eliminar
```typescript
ordersDB.delete(code)         // Eliminar pedido (admin only)
```

#### Estadísticas
```typescript
ordersDB.getStats()           // {total, pending, confirmed, delivered, cancelled, totalRevenue}
```

---

## 3️⃣ `/src/lib/db.ts` - Interfaz Database

Interfaz asincrónica preparada para Prisma + Supabase en el futuro.

```typescript
// Productos
await db.product.findMany()
await db.product.findUnique(id)
await db.product.findByCategory(category)
await db.product.findAvailable()
await db.product.create(data)
await db.product.update(id, data)
await db.product.delete(id)
await db.product.updateStock(id, quantity)

// Órdenes
await db.order.findMany()
await db.order.findUnique(code)
await db.order.findByStatus(status)
await db.order.findByEmail(email)
await db.order.findPending()
await db.order.create(data)
await db.order.updateStatus(code, status)
await db.order.update(code, data)
await db.order.delete(code)
await db.order.getStats()
```

---

## 📌 Campos Importantes

### Estados de Pedido
```
PENDING_VALIDATION → ⏳ Pago esperando validación
CONFIRMED         → ✓ Pago validado, listo para retirar
CANCELLED         → ✕ Pedido rechazado
DELIVERED         → ✓ Entregado en el evento
```

### Códigos de Pedido
Generado automáticamente con formato: `AR-XXX` (ej: AR-483)
- Basado en número random 0-999
- Único para cada pedido
- Usado para retiro en evento

### Categorías de Productos
- `cerveza` - Bebidas alcohólicas (cerveza)
- `fernet` - Bebidas alcohólicas (fernet)
- `gaseosa` - Bebidas no alcohólicas

---

## 🔄 Flujo de Creación de Pedido

```javascript
// 1. Cliente agrega al carrito (frontend)
items = [
  { productId: "cerveza-quilmes", quantity: 2, price: 1500 }
]
total = 3000

// 2. Envía al checkout (POST /api/orders)
POST /api/orders {
  name: "Juan Pérez",
  email: "juan@example.com",
  phone: "1123456789",
  items: [...],
  total: 3000
}

// 3. Backend crea Order
const order = {
  code: "AR-483",                    // generado automáticamente
  customerName: "Juan Pérez",
  customerEmail: "juan@example.com",
  customerPhone: "1123456789",
  items: [...],
  total: 3000,
  status: "PENDING_VALIDATION",      // estado inicial
  createdAt: now,
  updatedAt: now
}

// 4. Admin valida (POST /api/orders/AR-483/validate)
status: CONFIRMED

// 5. Staff marca entrega (POST /api/orders/AR-483/deliver)
status: DELIVERED
```

---

## 🚀 Próxima Migración a Prisma

Cuando sea necesario conectar a Supabase:

```prisma
model Product {
  id String @id @default(cuid())
  name String
  description String?
  price Int
  category String
  imageUrl String?
  stock Int
  active Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orderItems OrderItem[]
}

model Order {
  id String @id @default(cuid())
  code String @unique
  customerName String
  customerEmail String
  customerPhone String
  status String
  total Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  items OrderItem[]
}

model OrderItem {
  id String @id @default(cuid())
  orderId String
  productId String
  quantity Int
  unitPrice Int
  order Order @relation(fields: [orderId], references: [id])
}
```

Las funciones en `db.ts` funcionarán sin cambios al migrar el mock a Prisma.
