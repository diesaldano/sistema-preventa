import { Product, Order } from './types';

/**
 * 📦 Mock Products Database (6 productos)
 * Será reemplazado por Prisma + Supabase en el futuro
 */
let products: Product[] = [
  {
    id: 'cerveza-quilmes',
    name: 'Cerveza Quilmes',
    description: 'Lata 473ml',
    price: 1500,
    category: 'cerveza',
    imageUrl: '',
    stock: 200,
  },
  {
    id: 'cerveza-brahma',
    name: 'Cerveza Brahma',
    description: 'Lata 473ml',
    price: 1400,
    category: 'cerveza',
    imageUrl: '',
    stock: 200,
  },
  {
    id: 'cerveza-corona',
    name: 'Cerveza Corona',
    description: 'Lata 355ml',
    price: 2500,
    category: 'cerveza',
    imageUrl: '',
    stock: 150,
  },
  {
    id: 'fernet-branca',
    name: 'Fernet Branca',
    description: 'Botella 750ml',
    price: 12000,
    category: 'fernet',
    imageUrl: '',
    stock: 50,
  },
  {
    id: 'coca-cola',
    name: 'Coca Cola',
    description: 'Botella 2L',
    price: 2500,
    category: 'gaseosa',
    imageUrl: '',
    stock: 100,
  },
  {
    id: 'sprite',
    name: 'Sprite',
    description: 'Botella 2L',
    price: 2500,
    category: 'gaseosa',
    imageUrl: '',
    stock: 100,
  },
];

/**
 * 📋 Mock Orders Database
 * Array en memoria que simula una BD
 */
let orders: Order[] = [];

/**
 * 🎯 Funciones CRUD para Productos
 */
export const productsDB = {
  /**
   * GET - Obtener todos los productos
   */
  getAll: (): Product[] => {
    return JSON.parse(JSON.stringify(products));
  },

  /**
   * GET - Obtener producto por ID
   */
  getById: (id: string): Product | undefined => {
    const product = products.find((p) => p.id === id);
    return product ? JSON.parse(JSON.stringify(product)) : undefined;
  },

  /**
   * GET - Filtrar productos por categoría
   */
  getByCategory: (category: string): Product[] => {
    return JSON.parse(
      JSON.stringify(products.filter((p) => p.category === category))
    );
  },

  /**
   * GET - Obtener productos disponibles (stock > 0)
   */
  getAvailable: (): Product[] => {
    return JSON.parse(JSON.stringify(products.filter((p) => p.stock > 0)));
  },

  /**
   * CREATE - Crear nuevo producto (para admin)
   */
  create: (product: Product): Product => {
    const exists = products.find((p) => p.id === product.id);
    if (exists) throw new Error('Producto ya existe');
    products.push(product);
    return JSON.parse(JSON.stringify(product));
  },

  /**
   * UPDATE - Actualizar producto
   */
  update: (id: string, updates: Partial<Product>): Product | null => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates };
    return JSON.parse(JSON.stringify(products[index]));
  },

  /**
   * DELETE - Eliminar producto
   */
  delete: (id: string): boolean => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    return true;
  },

  /**
   * BATCH UPDATE - Aumentar/disminuir stock
   */
  updateStock: (id: string, quantityChange: number): Product | null => {
    const product = products.find((p) => p.id === id);
    if (!product) return null;
    product.stock = Math.max(0, product.stock + quantityChange);
    return JSON.parse(JSON.stringify(product));
  },
};

/**
 * 🎯 Funciones CRUD para Órdenes
 */
export const ordersDB = {
  /**
   * GET - Obtener todos los pedidos
   */
  getAll: (): Order[] => {
    return JSON.parse(JSON.stringify(orders));
  },

  /**
   * GET - Obtener pedido por código
   */
  getByCode: (code: string): Order | undefined => {
    const order = orders.find((o) => o.code === code);
    return order ? JSON.parse(JSON.stringify(order)) : undefined;
  },

  /**
   * GET - Filtrar pedidos por estado
   */
  getByStatus: (status: string): Order[] => {
    return JSON.parse(JSON.stringify(orders.filter((o) => o.status === status)));
  },

  /**
   * GET - Filtrar pedidos por email
   */
  getByEmail: (email: string): Order[] => {
    return JSON.parse(
      JSON.stringify(orders.filter((o) => o.customerEmail === email))
    );
  },

  /**
   * GET - Obtener pedidos pendientes de pago (PENDING_PAYMENT)
   */
  getPending: (): Order[] => {
    return JSON.parse(
      JSON.stringify(orders.filter((o) => o.status === 'PENDING_PAYMENT'))
    );
  },

  /**
   * CREATE - Crear nuevo pedido
   */
  create: (order: Order): Order => {
    const exists = orders.find((o) => o.code === order.code);
    if (exists) throw new Error('Código de pedido ya existe');
    orders.push(order);
    return JSON.parse(JSON.stringify(order));
  },

  /**
   * UPDATE - Actualizar estado del pedido con validación de transiciones
   */
  updateStatus: (code: string, newStatus: string): Order | null => {
    const order = orders.find((o) => o.code === code);
    if (!order) return null;

    // REGLA CRÍTICA: REDEEMED es final
    if (order.status === 'REDEEMED') {
      throw new Error('❌ REDEEMED: Pedido ya entregado. No puede cambiar de estado.');
    }

    // REGLA: CANCELLED es final
    if (order.status === 'CANCELLED') {
      throw new Error('❌ CANCELLED: Pedido rechazado. No puede cambiar de estado.');
    }

    // Validar transiciones permitidas
    const validTransitions: Record<string, string[]> = {
      'PENDING_PAYMENT': ['PAYMENT_REVIEW', 'CANCELLED'],
      'PAYMENT_REVIEW': ['PAID', 'CANCELLED'],
      'PAID': ['REDEEMED', 'CANCELLED'],
      'REDEEMED': [],      // No puede cambiar
      'CANCELLED': [],      // No puede cambiar
    };

    if (!validTransitions[order.status].includes(newStatus)) {
      throw new Error(
        `❌ Transición inválida: ${order.status} → ${newStatus}`
      );
    }

    order.status = newStatus as any;
    order.updatedAt = new Date();
    return JSON.parse(JSON.stringify(order));
  },

  /**
   * UPDATE - Actualizar pedido (campos específicos)
   */
  update: (code: string, updates: Partial<Order>): Order | null => {
    const index = orders.findIndex((o) => o.code === code);
    if (index === -1) return null;
    orders[index] = {
      ...orders[index],
      ...updates,
      updatedAt: new Date(),
    };
    return JSON.parse(JSON.stringify(orders[index]));
  },

  /**
   * DELETE - Eliminar pedido (solo admin)
   */
  delete: (code: string): boolean => {
    const index = orders.findIndex((o) => o.code === code);
    if (index === -1) return false;
    orders.splice(index, 1);
    return true;
  },

  /**
   * BATCH - Obtener estadísticas
   */
  getStats: () => {
    return {
      total: orders.length,
      pendingPayment: orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
      paymentReview: orders.filter((o) => o.status === 'PAYMENT_REVIEW').length,
      paid: orders.filter((o) => o.status === 'PAID').length,
      redeemed: orders.filter((o) => o.status === 'REDEEMED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
      totalRevenue: orders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.total, 0),
    };
  },

  /**
   * DEBUG - Resetear base de datos (solo desarrollo)
   */
  reset: () => {
    orders = [];
  },
};

/**
 * 🎯 Exportar ambas bases de datos
 */
export const mockDB = {
  products: productsDB,
  orders: ordersDB,
};
