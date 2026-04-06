export type OrderStatus = 
  | 'PENDING_PAYMENT'      // Esperando pago del usuario
  | 'PAYMENT_REVIEW'       // Usuario pagó, admin revisa
  | 'PAID'                 // Admin confirmó, listo para retiro
  | 'REDEEMED'             // Entregado en evento (FINAL)
  | 'CANCELLED';            // Rechazado (puede ocurrir en cualquier punto)

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  sizes?: string[];  // Tailles disponibles para remeras: ["M", "L", "XL"]
};

export type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
  size?: string;  // Talle seleccionado (ej: "M", "L", "XL") - solo para remeras
};

export type Order = {
  code: string;
  customerIP?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  comprobante?: string;  // Base64 or URL de comprobante
  comprobanteMime?: string;  // MIME type (image/png, application/pdf, etc)
  createdAt: Date;
  updatedAt: Date;
};

// Para compatibilidad con tipos antiguos
export type { Order as OrderData };

