# 🚀 Guía de Uso - Sistema de Preventa Diez Producciones

## 🎯 Descripción General

Sistema completo de preventa digital de bebidas para eventos. Permite:
- Venta anticipada de bebidas
- Validación de pagos por admin
- Retiro en el evento con código único
- Panel de control administrativo

---

## 📋 Rutas Disponibles

### Para Clientes
| Ruta | Descripción |
|------|-------------|
| `/` | **Tienda** - Catálogo de productos + carrito |
| `/checkout` | **Checkout** - Formulario de compra |
| `/checkout/success` | **Confirmación** - Muestra código único |
| `/pedido/[code]` | **Mi Pedido** - Estado del pedido (ej: `/pedido/AR-483`) |

### Para Administración
| Ruta | Descripción |
|------|-------------|
| `/admin` | **Panel Admin** - Validar/rechazar pagos |
| `/despacho` | **Panel Staff** - Marcar entregas |

---

## 🛒 Flujo de uso - Cliente

### 1. Entrar a la Tienda (`/`)
- Ves catálogo de bebidas disponibles
- Carrito flotante a la derecha muestra total

### 2. Agregar Productos
- Selecciona cantidad
- Click en "Agregar"
- Carrito se actualiza automáticamente
- Los productos se guardan en localStorage

### 3. Ir a Checkout (`/checkout`)
- Si el carrito está vacío, pedirá que agregues productos
- Completa: Nombre, Email, Teléfono
- Revisa el resumen de la compra
- Click en "Crear Pedido"

### 4. Recibir Código (`/checkout/success`)
- Código único: **AR-483** (ejemplo)
- Guardar para mostrar en el evento

### 5. Ver Estado (`/pedido/AR-483`)
- Puedo ver mi código en cualquier momento
- Estados:
  - ⏳ Pago Pendiente de Validación
  - ✓ Pedido Confirmado - Listo para Retirar
  - ✓ Entregado

---

## 👨‍💼 Flujo - Administrador

### 1. Panel Admin (`/admin`)
- Ve lista de **Pedidos Pendientes de Validación**
- Cada pedido muestra:
  - Código (ej: AR-483)
  - Nombre cliente
  - Email
  - Total
  - Botones: **Validar** y **Rechazar**

### 2. Validar Pago
- Click en **Validar**
- El estado cambia a "CONFIRMED"
- El cliente verá su código como válido

### 3. Rechazar Pago
- Click en **Rechazar**
- El estado cambia a "CANCELLED"
- El cliente lo verá rechazado

---

## 🎁 Flujo - Staff (Despacho)

### 1. Panel Despacho (`/despacho`)
- Input para buscar código
- Ej: Escribe **AR-483**
- Click en **Buscar**

### 2. Ver Pedido
- Aparece:
  - Código
  - Nombre del cliente
  - Teléfono
  - Productos
  - Total
  - Estado

### 3. Marcar Entrega
- Si estado es **"Listo para Retirar"**
- Click en **✓ Marcar como Entregado**
- Pedido cambia a "DELIVERED"
- Cliente lo verá como entregado

---

## 📊 API Routes (Backend)

```
GET    /api/products                    → Lista productos
GET    /api/orders                      → Lista todos los pedidos
POST   /api/orders                      → Crear pedido
GET    /api/orders/[code]               → Obtener pedido específico
POST   /api/orders/[code]/validate      → Validar pago
POST   /api/orders/[code]/reject        → Rechazar pedido
POST   /api/orders/[code]/deliver       → Marcar como entregado
```

### Ejemplo: Crear Pedido
```bash
POST /api/orders
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "1123456789",
  "items": [
    { "productId": "cerveza-quilmes", "quantity": 2, "price": 1500 }
  ],
  "total": 3000
}

Response:
{
  "code": "AR-483",
  "status": "PENDING_VALIDATION",
  ...
}
```

---

## 🗄️ Base de Datos

### Productos (Mock)
```
- cerveza-quilmes: $1.500
- cerveza-brahma: $1.400
- fernet-branca: $12.000
- coca-cola: $2.500
```

### Pedidos - Estados
- `PENDING_VALIDATION` - Esperando validación de admin
- `CONFIRMED` - Validado, listo para retirar
- `CANCELLED` - Rechazado
- `DELIVERED` - Entregado en evento

---

## 🔧 Desarrollo

### Instalar dependencias
```bash
npm install
```

### Ejecutar servidor local
```bash
npm run dev
```

Abre: `http://localhost:3000`

### Build para producción
```bash
npm run build
npm start
```

---

## 🚀 Próximas Mejoras

- [ ] Conectar Prisma + Supabase
- [ ] Gateway de pagos (Stripe, MercadoPago)
- [ ] Notificaciones por email
- [ ] QR para códigos de retiro
- [ ] Dashboard de estadísticas
- [ ] Descarga de reportes

---

## 📞 Soporte

Para preguntas sobre el funcionamiento del sistema, contactar a desarrollo.
