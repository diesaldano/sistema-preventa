import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Middleware centralizado para verificar autenticación
 * IMPORTANT: Este middleware corre en Node.js runtime (no edge)
 * porque jsonwebtoken requiere el módulo 'crypto' de Node.js
 */

export const runtime = 'nodejs'; // ← Necesario para usar jsonwebtoken

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long!!!!!';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ✅ PERMITIR SIN AUTENTICACIÓN:
  
  // 1. Página de login
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // 2. Rutas públicas para usuarios invitados (compra sin autenticación)
  if (pathname === '/' || 
      pathname === '/pagar' ||
      pathname === '/pagar/bloqueado' ||
      pathname === '/pagar/error' ||
      pathname === '/pagar/exito' ||
      pathname.startsWith('/pedido/')) {
    return NextResponse.next();
  }

  // 3. Assets estáticos (CSS, JS, imágenes, fonts)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // 4. API PÚBLICOS - RUTAS QUE NO REQUIEREN AUTENTICACIÓN
  // IMPORTANTE: Cuando agregues nuevos endpoints públicos, agregarlos AQUÍ
  // SIN excepción - si no está aquí, middleware los bloquea
  const publicApiRoutes = [
    '/api/auth/login',           // Login guest + admin
    '/api/auth/refresh',         // Refresh JWT tokens
    '/api/orders',               // Crear orden + GET orden específica
    '/api/products',             // Listar productos
    '/api/polling-config',       // Config de polling (cliente lee esto)
    '/api/debug/',               // Debug endpoints (dev only)
  ];
  
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ❌ PROTEGIDAS: Obtener token
  const token = request.cookies.get('accessToken')?.value;

  // Sin token: redirigir a /login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar JWT
  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    console.log(`[Middleware] Token inválido en ${pathname}:`, error);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ✅ Proteger /despacho (solo STAFF)
  if (pathname.startsWith('/despacho')) {
    if (payload.role !== 'STAFF') {
      console.log(`[Middleware] Acceso denegado a /despacho - Rol: ${payload.role}`);
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // ✅ Proteger /admin (solo ADMIN)
  if (pathname.startsWith('/admin')) {
    if (payload.role !== 'ADMIN') {
      console.log(`[Middleware] Acceso denegado a /admin - Rol: ${payload.role}`);
      return NextResponse.redirect(new URL('/despacho', request.url));
    }
    return NextResponse.next();
  }

  // Otras rutas: permitir
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Solo proteger rutas administrativas
    '/despacho/:path*',
    '/admin/:path*',
    // Las demás rutas (/, /pagar, /pedido, /login) serán manejadas por el middleware
    // pero se permitirán sin autenticación (ver lógica arriba)
  ],
};
