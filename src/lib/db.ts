// Database functions using Prisma ORM

import { PrismaClient } from '@prisma/client';
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

const prisma = prismaSingleton;

/**
 * 🎯 Interfaz de BD para Productos
 */
export const db = {
  product: {
    findMany: async () => {
      const products = await prisma.product.findMany();
      return products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        imageUrl: '',
        stock: p.stock,
      }));
    },

    findUnique: async (id: number) => {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return null;
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

    findByCategory: async (category: string) => {
      const products = await prisma.product.findMany({
        where: { category },
      });
      return products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        imageUrl: '',
        stock: p.stock,
      }));
    },

    findAvailable: async () => {
      const products = await prisma.product.findMany({
        where: { stock: { gt: 0 } },
      });
      return products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        imageUrl: '',
        stock: p.stock,
      }));
    },

    create: async (data: Product) => {
      const product = await prisma.product.create({
        data: {
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

    update: async (id: number, data: Partial<Product>) => {
      const product = await prisma.product.update({
        where: { id },
        data: {
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

    delete: async (id: number) => {
      await prisma.product.delete({ where: { id } });
      return true;
    },

    updateStock: async (id: number, quantity: number) => {
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
      });
      return orders.map((o: any) => ({
        code: o.code,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        items: o.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        total: o.total,
        status: o.status as OrderStatus,
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
        items: order.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
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
        items: o.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
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
        items: o.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
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
        items: o.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        total: o.total,
        status: o.status as OrderStatus,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
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
              unitPrice: item.price,
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
        items: order.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
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
          items: order.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
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
          price: item.unitPrice,
        })),
        total: order.total,
        status: order.status as OrderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    },

    delete: async (code: string) => {
      // Primero eliminar items relacionados
      await prisma.orderItem.deleteMany({
        where: { orderId: code },
      });
      // Luego eliminar la orden
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
          price: item.unitPrice,
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
  },
};
