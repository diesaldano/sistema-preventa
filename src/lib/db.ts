// Database functions using Prisma ORM

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Product, Order, OrderStatus } from './types';

// Singleton instance for Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaInstance: PrismaClient | undefined;
}

const prismaSingleton = globalThis.prismaInstance ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaInstance = prismaSingleton;

export const prisma = prismaSingleton;

/**
 * Generar slug a partir del nombre
 * Ej: "Cerveza Quilmes" → "cerveza-quilmes"
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

/**
 * Mapear producto con todos los campos incluyendo sizes
 */
function mapProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    imageUrl: '',
    stock: p.stock,
    sizes: p.sizes || [],  // Array de tailles disponibles
  };
}

/**
 * Mapear item de orden incluyendo size (talle)
 */
function mapOrderItem(item: any) {
  return {
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    size: item.size, // Talle seleccionado (ej: "M", "L", "XL")
  };
}

/**
 * 🎯 Interfaz de BD para Productos
 */
export const db = {
  product: {
    findMany: async () => {
      const products = await prisma.product.findMany();
      return products.map(mapProduct);
    },

    findUnique: async (id: string) => {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return null;
      return mapProduct(product);
    },

    findByCategory: async (category: string) => {
      const products = await prisma.product.findMany({
        where: { category },
      });
      return products.map(mapProduct);
    },

    findAvailable: async () => {
      const products = await prisma.product.findMany({
        where: { 
          stock: { gt: 0 },
          available: true,
        },
      });
      return products.map(mapProduct);
    },

    /**
     * Buscar múltiples productos por IDs
     * Usada en R1.2 para recalcular total sin confiar en frontend
     */
    findByIds: async (ids: string[]) => {
      if (!ids || ids.length === 0) return [];
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
      });
      return products.map(mapProduct);
    },

    create: async (data: Product) => {
      const product = await prisma.product.create({
        data: {
          id: randomUUID(),
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          stock: data.stock,
        },
      });
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: '',
        stock: product.stock,
      };
    },

    update: async (id: string, data: Partial<Product>) => {
      const updateData: any = {};
      if (data.name) {
        updateData.name = data.name;
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.stock !== undefined) updateData.stock = data.stock;

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
      });
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: '',
        stock: product.stock,
      };
    },

    delete: async (id: string) => {
      await prisma.product.delete({ where: { id } });
      return true;
    },

    updateStock: async (id: string, quantity: number) => {
      const product = await prisma.product.update({
        where: { id },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: '',
        stock: product.stock,
      };
    },
  },

  /**
   * 🎯 Interfaz de BD para Órdenes
   */
  order: {
    findMany: async () => {
      const orders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      return orders.map((o: any) => ({
        code: o.code,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        items: o.items.map(mapOrderItem),
        total: o.total,
        status: o.status as OrderStatus,
        comprobante: o.comprobante,
        comprobanteMime: o.comprobanteMime,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      }));
    },

    findUnique: async (code: string) => {
      const order = await prisma.order.findUnique({
        where: { code },
        include: { items: true },
      });
      if (!order) return null;
      return {
        code: order.code,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items.map(mapOrderItem),
        total: order.total,
        status: order.status as OrderStatus,
        comprobante: order.comprobante,
        comprobanteMime: order.comprobanteMime,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    },

    findByStatus: async (status: string) => {
      const orders = await prisma.order.findMany({
        where: { status: status as any },
        include: { items: true },
      });
      return orders.map((o: any) => ({
        code: o.code,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        items: o.items.map(mapOrderItem),
        total: o.total,
        status: o.status as OrderStatus,
        comprobante: o.comprobante,
        comprobanteMime: o.comprobanteMime,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      }));
    },

    findByEmail: async (email: string) => {
      const orders = await prisma.order.findMany({
        where: { customerEmail: email },
        include: { items: true },
      });
      return orders.map((o: any) => ({
        code: o.code,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        items: o.items.map(mapOrderItem),
        total: o.total,
        status: o.status as OrderStatus,
        comprobante: o.comprobante,
        comprobanteMime: o.comprobanteMime,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      }));
    },

    findPending: async () => {
      const orders = await prisma.order.findMany({
        where: { status: 'PENDING_PAYMENT' },
        include: { items: true },
      });
      return orders.map((o: any) => ({
        code: o.code,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        items: o.items.map(mapOrderItem),
        total: o.total,
        status: o.status as OrderStatus,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      }));
    },

    /**
     * R1.3: Buscar orden duplicada reciente (mismo email, últimos 5 minutos)
     * Previene doble-click o intento de crear múltiples órdenes simultáneamente
     */
    findRecentByEmail: async (email: string, windowMinutes: number = 5) => {
      if (!email) return null;
      
      const now = new Date();
      const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
      
      const order = await prisma.order.findFirst({
        where: {
          customerEmail: email.toLowerCase(),
          createdAt: {
            gte: windowStart,
          },
        },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });
      
      if (!order) return null;
      
      return {
        code: order.code,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items.map(mapOrderItem),
        total: order.total,
        status: order.status as OrderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    },

    /**
     * R1.4: Contar órdenes por IP en las últimas 24 horas
     * Límite: 5 órdenes por IP en 24h
     */
    countByIp: async (ip: string, windowHours: number = 24) => {
      if (!ip) return 0;
      
      const windowStart = new Date(new Date().getTime() - windowHours * 60 * 60 * 1000);
      
      const count = await prisma.order.count({
        where: {
          createdAt: {
            gte: windowStart,
          },
          // Nota: IP no está en schema actual, es solo para demostración
          // En producción, necesitarías agregar campo IP a Order model
        },
      });
      
      return count;
    },

    /**
     * R1.4: Contar órdenes por email en la última hora
     * Límite: 2 órdenes por email en 1h
     */
    countByEmailInLastHour: async (email: string) => {
      if (!email) return 0;
      
      const oneHourAgo = new Date(new Date().getTime() - 60 * 60 * 1000);
      
      const count = await prisma.order.count({
        where: {
          customerEmail: email.toLowerCase(),
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });
      
      return count;
    },

    /**
     * R1.4: Obtener detalles de todas las órdenes por email recientes
     * Para análisis de patrones sospechosos
     */
    getRecentOrdersByEmail: async (email: string, windowHours: number = 24) => {
      if (!email) return [];
      
      const windowStart = new Date(new Date().getTime() - windowHours * 60 * 60 * 1000);
      
      const orders = await prisma.order.findMany({
        where: {
          customerEmail: email.toLowerCase(),
          createdAt: {
            gte: windowStart,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { items: true },
      });
      
      return orders.map((o: any) => ({
        code: o.code,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        itemCount: o.items.length,
      }));
    },

    create: async (data: Order) => {
      const order = await prisma.order.create({
        data: {
          code: data.code,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          total: data.total,
          status: data.status as any,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              size: item.size,  // Talle seleccionado
            })),
          },
        },
        include: { items: true },
      });
      return {
        code: order.code,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items.map(mapOrderItem),
        total: order.total,
        status: order.status as OrderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    },

    updateStatus: async (code: string, status: OrderStatus) => {
      try {
        const order = await prisma.order.update({
          where: { code },
          data: { status: status as any },
          include: { items: true },
        });
        return {
          code: order.code,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          items: order.items.map(mapOrderItem),
          total: order.total,
          status: order.status as OrderStatus,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Error updating status');
      }
    },

    update: async (code: string, data: Partial<Order>) => {
      const order = await prisma.order.update({
        where: { code },
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          total: data.total,
          status: data.status ? (data.status as any) : undefined,
        },
        include: { items: true },
      });
      return {
        code: order.code,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        status: order.status as OrderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    },

    delete: async (code: string) => {
      // Gracias a onDelete: Cascade en Prisma, al eliminar la orden se eliminan automáticamente los items
      await prisma.order.delete({ where: { code } });
      return true;
    },

    getStats: async () => {
      const orders = await prisma.order.findMany();
      const items = await prisma.orderItem.findMany();

      const stats = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, o: any) => sum + o.total, 0),
        byStatus: {
          PENDING_PAYMENT: orders.filter((o: any) => o.status === 'PENDING_PAYMENT').length,
          PAYMENT_REVIEW: orders.filter((o: any) => o.status === 'PAYMENT_REVIEW').length,
          PAID: orders.filter((o: any) => o.status === 'PAID').length,
          REDEEMED: orders.filter((o: any) => o.status === 'REDEEMED').length,
          CANCELLED: orders.filter((o: any) => o.status === 'CANCELLED').length,
        },
        totalItems: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
      };

      return stats;
    },

    uploadReceipt: async (code: string, comprobante: string, comprobanteMime: string) => {
      const order = await prisma.order.update({
        where: { code },
        data: {
          comprobante,
          comprobanteMime,
          status: 'PAYMENT_REVIEW',  // Cambiar a PAYMENT_REVIEW cuando se carga comprobante
          updatedAt: new Date(),
        },
        include: { items: true },
      });
      return {
        code: order.code,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        status: order.status as OrderStatus,
        comprobante: order.comprobante,
        comprobanteMime: order.comprobanteMime,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    },

    getReceipt: async (code: string) => {
      const order = await prisma.order.findUnique({
        where: { code },
      });
      if (!order) return null;
      return {
        comprobante: order.comprobante,
        comprobanteMime: order.comprobanteMime,
      };
    },

    /**
     * R1.2: Calcular total desde BD sin confiar en frontend
     * Valida que los precios/cantidades no hayan sido modificados
     * 
     * Retorna:
     * - total: Monto correcto (Σ precio_BD × cantidad)
     * - valid: Si todos los productos existen y hay stock
     * - fraudDetected: Si hubo intento de manipular precios/cantidades
     * - details: Info de cada producto para audit
     */
    calculateTotalFromItems: async (
      items: Array<{ productId: string; quantity: number; price?: number }>
    ) => {
      if (!items || items.length === 0) {
        return {
          total: 0,
          valid: false,
          error: 'No hay items en la orden',
          fraudDetected: false,
          details: [],
        };
      }

      try {
        // Obtener precios REALES de BD
        const productIds = items.map((item) => item.productId);
        const bdProducts = await db.product.findByIds(productIds);

        const details: any[] = [];
        let calculatedTotal = 0;
        let fraudDetected = false;
        let stockIssue = false;

        // Validar CADA item
        for (const item of items) {
          const bdProduct = bdProducts.find((p: any) => p.id === item.productId);

          // Si el producto no existe → FRAUDE o error
          if (!bdProduct) {
            fraudDetected = true;
            details.push({
              productId: item.productId,
              quantity: item.quantity,
              frontendPrice: item.price,
              bdPrice: null,
              match: false,
              reason: 'Producto no encontrado en BD',
              fraudFlag: true,
            });
            continue;
          }

          // Si no hay stock suficiente → ERROR (no es fraude, es falta de stock)
          if (bdProduct.stock < item.quantity) {
            stockIssue = true;
            details.push({
              productId: item.productId,
              quantity: item.quantity,
              available: bdProduct.stock,
              frontendPrice: item.price,
              bdPrice: bdProduct.price,
              match: false,
              reason: `Stock insuficiente (tiene ${bdProduct.stock}, pide ${item.quantity})`,
              fraudFlag: false,
            });
            continue;
          }

          // Calcular línea de producto = precio_BD × cantidad
          const lineTotal = bdProduct.price * item.quantity;
          calculatedTotal += lineTotal;

          // Si frontend envió un precio diferente → POSIBLE FRAUDE
          const priceMatch = !item.price || item.price === bdProduct.price;
          if (!priceMatch) {
            fraudDetected = true;
          }

          details.push({
            productId: item.productId,
            quantity: item.quantity,
            frontendPrice: item.price || null,
            bdPrice: bdProduct.price,
            match: priceMatch,
            calculatedLineTotal: lineTotal,
          });
        }

        return {
          total: calculatedTotal,
          valid: !fraudDetected && !stockIssue && details.every((d) => d.match !== false),
          error: fraudDetected
            ? 'Precio modificado - Intento de fraude detectado'
            : stockIssue
              ? 'Stock insuficiente para algunos productos'
              : null,
          fraudDetected,
          stockIssue,
          details,
        };
      } catch (error) {
        console.error('Error calculando total:', error);
        return {
          total: 0,
          valid: false,
          error: error instanceof Error ? error.message : 'Error al calcular total',
          fraudDetected: false,
          details: [],
        };
      }
    },
  },

  /**
   * R3.1: Security logging para tracking de intentos fallidos
   * Registra IP, email, razón y detalles para análisis de patterns
   */
  securityLog: {
    create: async (clientIp: string, email: string, reason: string, details?: string) => {
      try {
        const log = await prisma.securityLog.create({
          data: {
            clientIp,
            email: email.toLowerCase(),
            reason,
            details: details || null,
          },
        });
        console.log(`[SecurityLog] ${reason} | IP: ${clientIp} | Email: ${email}`);
        return log;
      } catch (error) {
        console.error('Error logging security event:', error);
        return null;
      }
    },

    /**
     * Obtener intentos fallidos recientes de un IP (últimas 24h por defecto)
     * Usado para detectar abuso desde mismo IP
     */
    getByIp: async (clientIp: string, hoursBack: number = 24) => {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      return prisma.securityLog.findMany({
        where: {
          clientIp,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    /**
     * Obtener intentos fallidos recientes de un email (últimas 24h por defecto)
     * Usado para detectar abuso desde mismo email
     */
    getByEmail: async (email: string, hoursBack: number = 24) => {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      return prisma.securityLog.findMany({
        where: {
          email: email.toLowerCase(),
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    /**
     * Obtener intentos de un IP específico (últimas N horas)
     */
    getByIP: async (clientIp: string, hoursBack: number = 1) => {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      return prisma.securityLog.findMany({
        where: {
          clientIp,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    /**
     * Obtener intentos por razón (ej: rate_limit, fraud)
     */
    getByReason: async (reason: string, hoursBack: number = 24) => {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      return prisma.securityLog.findMany({
        where: {
          reason,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  /**
   * PHASE 4: User management para Admin + Staff
   */
  user: {
    create: async (email: string, password_hash: string, role: 'ADMIN' | 'STAFF', createdBy?: string) => {
      return prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password_hash,
          role,
          createdBy: createdBy || null,
        },
      });
    },

    findByEmail: async (email: string) => {
      return prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
    },

    findById: async (id: string) => {
      return prisma.user.findUnique({
        where: { id },
      });
    },

    findAll: async (role?: 'ADMIN' | 'STAFF') => {
      if (role) {
        return prisma.user.findMany({
          where: { role, active: true },
          select: { id: true, email: true, role: true, createdAt: true },
        });
      }
      return prisma.user.findMany({
        where: { active: true },
        select: { id: true, email: true, role: true, createdAt: true },
      });
    },

    updatePassword: async (id: string, newPasswordHash: string) => {
      return prisma.user.update({
        where: { id },
        data: { password_hash: newPasswordHash },
      });
    },

    deactivate: async (id: string) => {
      return prisma.user.update({
        where: { id },
        data: { active: false },
      });
    },
  },

  /**
   * PHASE 4: Token blacklist para invalidar JWT
   */
  blacklistedToken: {
    create: async (
      tokenHash: string,
      userId: string,
      tokenType: 'ACCESS' | 'REFRESH',
      expiresAt: Date,
      reason: string = 'logout'
    ) => {
      return prisma.blacklistedToken.create({
        data: {
          token_hash: tokenHash,
          user_id: userId,
          token_type: tokenType as any,
          expires_at: expiresAt,
          reason,
        },
      });
    },

    findByHash: async (tokenHash: string) => {
      return prisma.blacklistedToken.findUnique({
        where: { token_hash: tokenHash },
      });
    },

    isBlacklisted: async (tokenHash: string): Promise<boolean> => {
      const entry = await prisma.blacklistedToken.findUnique({
        where: { token_hash: tokenHash },
      });
      return !!entry;
    },

    deleteExpired: async () => {
      // Cleanup tokens que ya expiraron
      const deleted = await prisma.blacklistedToken.deleteMany({
        where: {
          expires_at: { lt: new Date() },
        },
      });
      console.log(`[BlacklistedToken] Cleaned up ${deleted.count} expired entries`);
      return deleted.count;
    },

    deleteByUserId: async (userId: string) => {
      // Logout all sessions de un usuario
      return prisma.blacklistedToken.deleteMany({
        where: { user_id: userId },
      });
    },
  },
};

