// Database functions - will use Prisma in production
// Currently using mock database

import { productsDB, ordersDB } from './mock-db';
import { Product, Order, OrderStatus } from './types';

/**
 * 🎯 Interfaz de BD para Productos
 * Preparada para migrar a Prisma cuando sea necesario
 */
export const db = {
  product: {
    findMany: async () => productsDB.getAll(),
    findUnique: async (id: string) => productsDB.getById(id),
    findByCategory: async (category: string) => productsDB.getByCategory(category),
    findAvailable: async () => productsDB.getAvailable(),
    create: async (data: Product) => productsDB.create(data),
    update: async (id: string, data: Partial<Product>) => productsDB.update(id, data),
    delete: async (id: string) => productsDB.delete(id),
    updateStock: async (id: string, quantity: number) => productsDB.updateStock(id, quantity),
  },

  /**
   * 🎯 Interfaz de BD para Órdenes
   */
  order: {
    findMany: async () => ordersDB.getAll(),
    findUnique: async (code: string) => ordersDB.getByCode(code),
    findByStatus: async (status: string) => ordersDB.getByStatus(status),
    findByEmail: async (email: string) => ordersDB.getByEmail(email),
    findPending: async () => ordersDB.getPending(),
    create: async (data: Order) => ordersDB.create(data),
    updateStatus: async (code: string, status: OrderStatus) => {
      try {
        return ordersDB.updateStatus(code, status);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Error updating status');
      }
    },
    update: async (code: string, data: Partial<Order>) => ordersDB.update(code, data),
    delete: async (code: string) => ordersDB.delete(code),
    getStats: async () => ordersDB.getStats(),
  },
};
