'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useToastContext } from '@/lib/toast-context';
import { useOrderPolling } from '@/lib/hooks';
import { formatPrice } from '@/lib/utils';
import { BrandHeader } from '@/components/brand-header';
import { Order } from '@/lib/types';

declare global {
  interface Window {
    html2pdf?: any;
  }
}

function OrderDisplay({ order, isDark, isPolling, lastUpdate }: { order: Order; isDark: boolean; isPolling: boolean; lastUpdate: Date | null }) {
  const orderRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToastContext();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return isDark ? 'bg-red-600/40 text-red-100 border-red-500' : 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'PAYMENT_REVIEW':
        return isDark ? 'bg-orange-600/40 text-orange-100 border-orange-500' : 'bg-amber-100 text-amber-800 border-amber-400';
      case 'PAID':
        return isDark ? 'bg-emerald-600/40 text-emerald-100 border-emerald-500' : 'bg-emerald-100 text-emerald-800 border-emerald-400';
      case 'REDEEMED':
        return isDark ? 'bg-blue-600/40 text-blue-100 border-blue-500' : 'bg-blue-100 text-blue-800 border-blue-400';
      case 'CANCELLED':
        return isDark ? 'bg-red-600/40 text-red-100 border-red-500' : 'bg-red-100 text-red-800 border-red-400';
      default:
        return isDark ? 'bg-slate-700 text-slate-100 border-slate-600' : 'bg-slate-200 text-slate-900 border-slate-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return '⏳ Esperando tu pago (transferencia)';
      case 'PAYMENT_REVIEW':
        return '👀 Tu pago está siendo revisado';
      case 'PAID':
        return '✓ Pago confirmado. Listo para retirar';
      case 'REDEEMED':
        return '✓ Retirado en evento';
      case 'CANCELLED':
        return '✗ Pedido rechazado';
      default:
        return status;
    }
  };

  const downloadComprobante = () => {
    if (!localOrder.comprobante) return;
    
    // Determinar extensión según MIME type
    const mimeType = localOrder.comprobanteMime || 'image/jpeg';
    const extension = mimeType === 'application/pdf' ? 'pdf' : 
                      mimeType === 'image/png' ? 'png' : 'jpg';
    
    // Crear elemento para descargar
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${localOrder.comprobante}`;
    link.download = `comprobante-pago-${localOrder.code}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTicket = async () => {
    try {
      console.log(`📥 Descargando ticket para ${order.code}...`);
      
      // Descargar HTML del ticket
      const response = await fetch(`/api/orders/${order.code}/ticket`);
      
      if (!response.ok) {
        throw new Error('No se pudo descargar el ticket');
      }

      const html = await response.text();

      // Verificar si html2pdf está disponible
      if (window.html2pdf) {
        console.log('✅ html2pdf disponible, generando PDF...');
        
        const element = document.createElement('div');
        element.innerHTML = html;

        const opt = {
          margin: 5,
          filename: `ticket-${order.code}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        };

        window.html2pdf().set(opt).from(element).save();
      } else {
        console.log('⚠️ html2pdf no disponible, descargando HTML...');
        
        // Descargar como HTML si html2pdf no está disponible
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${order.code}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success('✅ Ticket descargado correctamente', '📥 Éxito');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al descargar ticket';
      toast.error(errorMsg, '❌ Error');
      console.error('Error downloading ticket:', err);
    }
  };

  const captureScreenshot = async () => {
    if (!orderRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Capturar el elemento del pedido
      const canvas = await html2canvas(orderRef.current, {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      // Convertir a blob y descargar
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pedido-${order.code}-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Error capturing screenshot:', err);
      toast.error('No se pudo capturar la pantalla. Intenta de nuevo.', '❌ Error de captura');
    }
  };

  const handleUploadComprobante = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('comprobante', file);

      const response = await fetch(`/api/orders/${order.code}/upload-comprobante`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir comprobante');
      }

      setUploadSuccess(true);
      setLocalOrder(data);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div ref={orderRef} className={`rounded-lg border p-6 shadow-lg transition-colors ${isDark ? 'border-slate-800 bg-slate-900 shadow-slate-900/40' : 'border-slate-200 bg-slate-50 shadow-slate-300/20'}`}>
      {/* Estado + Polling Badge */}
      <div className={`mb-6 pb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`inline-block px-4 py-2 rounded-lg border-2 font-bold text-sm ${getStatusBadgeColor(localOrder.status)}`}>
            {getStatusText(localOrder.status)}
          </div>
          {isPolling && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Actualizando...
            </div>
          )}
        </div>
        
        {!isPolling && (
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Recarga la página para ver actualizaciones
          </div>
        )}
        
        {lastUpdate && (
          <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
          </div>
        )}
      </div>

      {/* Código y Detalles */}
      <div className={`mb-6 pb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Código de Retiro</p>
        <p className={`text-5xl font-bebas font-bold mb-6 tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
          {localOrder.code}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Nombre</p>
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{localOrder.customerName}</p>
          </div>
          <div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Email</p>
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{localOrder.customerEmail}</p>
          </div>
          <div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Teléfono</p>
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{localOrder.customerPhone}</p>
          </div>
          <div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Fecha</p>
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {new Date(localOrder.createdAt).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className={`mb-6 pb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <h3 className={`font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Productos</h3>
        <div className="space-y-3">
          {localOrder.items.map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between text-sm border p-3 rounded transition-colors ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <div>
                <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Producto #{idx + 1}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.productId}</p>
                {/* Mostrar talle si existe */}
                {item.size && (
                  <p className={`text-xs font-medium mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    Talle: <strong>{item.size}</strong>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>x{item.quantity}</p>
                <p className={isDark ? 'text-xs text-amber-400' : 'text-xs text-amber-600'}>{formatPrice(item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between mb-6">
        <p className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Total</p>
        <p className={`text-2xl font-bold font-bebas tracking-wide ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatPrice(localOrder.total)}</p>
      </div>


      {/* 📋 DESCARGAR ORDEN DE PEDIDO - Siempre disponible */}
      <div className={`mb-6 rounded-xl border-3 p-6 transition-all ${
        isDark
          ? 'border-blue-500/80 bg-blue-600/30 shadow-lg shadow-blue-500/20'
          : 'border-blue-500 bg-blue-100/50 shadow-lg shadow-blue-400/30'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`text-3xl`}>📋</div>
          <div>
            <p className={`font-bold text-lg ${isDark ? 'text-blue-100' : 'text-blue-900'}`}>
              Orden de Pedido
            </p>
            <p className={`text-xs font-medium ${isDark ? 'text-blue-200/80' : 'text-blue-800'}`}>
              Descargar tu comprobante de compra con todos los detalles
            </p>
          </div>
        </div>

        <button
          onClick={downloadTicket}
          className={`w-full font-bold py-3 px-4 rounded-lg text-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-600/50'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-600/50'
          }`}
        >
          <span>📥 Descargar Orden de Pedido</span>
        </button>
      </div>

      {/* Mensaje según estado */}
      <div className={`rounded-lg border-2 p-6 text-center transition-colors ${
        localOrder.status === 'PENDING_PAYMENT' 
          ? isDark ? 'bg-red-600/30 border-red-500 shadow-lg shadow-red-600/20' : 'bg-yellow-100 border-yellow-400'
          : localOrder.status === 'PAYMENT_REVIEW'
          ? isDark ? 'bg-orange-600/30 border-orange-500 shadow-lg shadow-orange-600/20' : 'bg-amber-100 border-amber-400'
          : localOrder.status === 'PAID'
          ? isDark ? 'bg-emerald-600/30 border-emerald-500 shadow-lg shadow-emerald-600/20' : 'bg-emerald-100 border-emerald-400'
          : localOrder.status === 'CANCELLED'
          ? isDark ? 'bg-red-600/30 border-red-500 shadow-lg shadow-red-600/20' : 'bg-red-100 border-red-400'
          : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-300'
      }`}>
        {localOrder.status === 'PENDING_PAYMENT' ? (
          <p className={`font-bold text-lg ${isDark ? 'text-red-100' : 'text-yellow-900'}`}>
            ⏳ Procesando tu pago
          </p>
        ) : localOrder.status === 'PAYMENT_REVIEW' ? (
          <p className={`font-bold text-lg ${isDark ? 'text-orange-100' : 'text-amber-900'}`}>
            👀 Revisión de pago
          </p>
        ) : localOrder.status === 'PAID' ? (
          <p className={`font-bold text-lg ${isDark ? 'text-emerald-100' : 'text-emerald-900'}`}>
            ✓ Pago confirmado. Listo para retirar
          </p>
        ) : localOrder.status === 'REDEEMED' ? (
          <p className={`font-bold text-lg ${isDark ? 'text-blue-100' : 'text-blue-900'}`}>
            ✓ Tu pedido fue retirado exitosamente. ¡Gracias por tu compra!
          </p>
        ) : localOrder.status === 'CANCELLED' ? (
          <p className={`font-bold text-lg ${isDark ? 'text-red-100' : 'text-red-900'}`}>
            ✗ Tu pedido ha sido cancelado. Por favor contacta con nosotros si tienes dudas.
          </p>
        ) : (
          <p className={`font-bold text-lg ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            Estado: {getStatusText(localOrder.status)}
          </p>
        )}
        <p className={`text-sm mt-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {localOrder.status === 'PENDING_PAYMENT' && 'Por favor realiza la transferencia bancaria'}
          {localOrder.status === 'PAYMENT_REVIEW' && 'Nuestro equipo está verificando tu comprobante. Te notificaremos pronto.'}
          {localOrder.status === 'PAID' && `Presenta el código ${localOrder.code} el día del evento para retirar`}
        </p>
      </div>
    </div>
  );
}

export default function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [code, setCode] = useState<string | undefined>(undefined);
  const { order, loading, error, isPolling, lastUpdate } = useOrderPolling(code);

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { code: orderCode } = await params;
        setCode(orderCode);
      } catch (err) {
        console.error('Error resolving params:', err);
      }
    };
    resolveParams();
  }, [params]);

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader event="Mi Pedido" subtitle="Estado de tu compra" />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        {loading && (
          <div className={`rounded-lg border p-8 text-center transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
              </div>
              <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>Cargando pedido...</p>
            </div>
          </div>
        )}

        {error && !order && (
          <div className={`rounded-lg border border-l-4 p-6 transition-colors ${isDark ? 'border-red-500/30 border-l-red-500 bg-red-500/10' : 'border-red-400/30 border-l-red-500 bg-red-100/50'}`}>
            <p className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              ⚠️ Error al cargar el pedido
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-red-300/80' : 'text-red-600/80'}`}>
              {error}
            </p>
            <p className={`text-xs mt-3 ${isDark ? 'text-red-400/60' : 'text-red-600/60'}`}>
              💡 Verifica que el código sea correcto. Si recién completaste el checkout, deberías tener un código de la forma AR-XXXX.
            </p>
          </div>
        )}

        {order && <OrderDisplay order={order} isDark={isDark} isPolling={isPolling} lastUpdate={lastUpdate} />}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className={`inline-block px-6 py-2 rounded-lg font-medium transition-all ${isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
