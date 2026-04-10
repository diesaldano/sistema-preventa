'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useTheme } from '@/lib/theme-context';
import { 
  formatPrice,
  isValidEmail,
  isValidPhone,
  isValidName,
  sanitizeName,
  isValidComprobante
} from '@/lib/utils';
import { BANK_DATA, CHECKOUT_CONFIG } from '@/lib/constants';
import CheckoutStepper from '@/components/checkout-stepper';
import { AlertCircle, Upload, X, CheckCircle, Clock, Download } from 'lucide-react';
import { BrandHeader } from '@/components/brand-header';

const STEPS = [
  { id: 1, label: 'Datos Personales' },
  { id: 2, label: 'Transferencia' },
  { id: 3, label: 'Comprobante' },
  { id: 4, label: 'Confirmación' },
];

const CHECKOUT_STORAGE_KEY = 'checkout_data';

// Componente para carrito vacío
function EmptyCartView({ isDark }: { isDark: boolean }) {
  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader event="Carrito Vacío" subtitle="Preventa oficial de bebidas" />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <section className={`w-full rounded-lg border p-8 text-center transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900'
            : 'border-slate-200 bg-slate-50'
        }`}>
          <h2 className={`text-2xl font-semibold ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>Tu carrito está vacío</h2>
          <p className={`mt-2 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>Debes agregar productos antes de continuar</p>
          <Link
            href="/"
            className={`mt-6 inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-semibold transition ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Volver a la Tienda
          </Link>
        </section>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(CHECKOUT_CONFIG.TRANSFER_TIMEOUT_MS);
  const [step2StartTime, setStep2StartTime] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ============================================================
  // 💾 PERSISTENCIA localStorage - Guardar/Cargar Datos
  // ============================================================

  // Cargar datos del localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFormData(parsed);
      }
    } catch (err) {
      console.warn('Error loading checkout data from localStorage:', err);
    }
  }, []);

  // Guardar datos en localStorage cada vez que cambian
  useEffect(() => {
    try {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(formData));
    } catch (err) {
      console.warn('Error saving checkout data to localStorage:', err);
    }
  }, [formData]);

  // ============================================================
  // Validación Frontend Consistente con Backend (R1.1)
  // ============================================================

  const validateName = (name: string): { valid: boolean; error?: string } => {
    if (!name.trim()) {
      return { valid: false, error: 'El nombre es requerido' };
    }
    if (!isValidName(name)) {
      return { valid: false, error: 'Nombre debe tener 2-50 caracteres, sin números' };
    }
    return { valid: true };
  };

  const validateEmail = (email: string): { valid: boolean; error?: string } => {
    if (!email.trim()) {
      return { valid: false, error: 'El email es requerido' };
    }
    if (!isValidEmail(email)) {
      return { valid: false, error: 'Email no válido. Ej: nombre@dominio.com' };
    }
    return { valid: true };
  };

  const validatePhone = (phone: string): { valid: boolean; error?: string } => {
    if (!phone.trim()) {
      return { valid: false, error: 'El teléfono es requerido' };
    }
    if (!isValidPhone(phone)) {
      return { valid: false, error: 'Teléfono debe tener al menos 10 dígitos' };
    }
    return { valid: true };
  };

  const nameValidation = validateName(formData.name);
  const emailValidation = validateEmail(formData.email);
  const phoneValidation = validatePhone(formData.phone);

  const isStep1Valid = nameValidation.valid && emailValidation.valid && phoneValidation.valid;

  // Timer para el step 2 (transferencia)
  useEffect(() => {
    if (currentStep !== 2) return;

    if (!step2StartTime) {
      setStep2StartTime(Date.now());
      setTimeRemaining(CHECKOUT_CONFIG.TRANSFER_TIMEOUT_MS);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - step2StartTime;
      const remaining = Math.max(0, CHECKOUT_CONFIG.TRANSFER_TIMEOUT_MS - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        setError('El tiempo para transferir ha expirado. Por favor, intenta nuevamente.');
        setCurrentStep(1);
        // 🧹 Limpiar localStorage si expira el tiempo
        try {
          localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        } catch (err) {
          console.warn('Error clearing checkout data:', err);
        }
        setFormData({ name: '', email: '', phone: '' });
        setStep2StartTime(null);
        clearCart();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentStep, step2StartTime, clearCart]);

  const handleNextStep = async () => {
    setError(null);
    if (currentStep === 1) {
      // Mostrar primer error encontrado
      if (!nameValidation.valid) {
        setError(nameValidation.error || 'Nombre inválido');
        return;
      }
      if (!emailValidation.valid) {
        setError(emailValidation.error || 'Email inválido');
        return;
      }
      if (!phoneValidation.valid) {
        setError(phoneValidation.error || 'Teléfono inválido');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
      setStep2StartTime(null);
    } else if (currentStep === 3) {
      await handleCreateOrder();
    }
  };

  const handlePreviousStep = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileSelect = (file: File) => {
    // R1.1: Validación de comprobante - solo JPG/PNG
    const validationResult = isValidComprobante(file.type, file.size);
    
    if (!validationResult.valid) {
      setError(validationResult.error || 'Archivo no válido');
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      // ============================================================
      // STEP 1: Crear orden (sin comprobante)
      // ============================================================
      const formDataToSend = new FormData();
      formDataToSend.append('customerName', sanitizeName(formData.name));
      formDataToSend.append('customerEmail', formData.email.toLowerCase().trim());
      formDataToSend.append('customerPhone', formData.phone.replace(/\D/g, ''));
      
      formDataToSend.append(
        'items',
        JSON.stringify(
          items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          }))
        )
      );

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.status === 409) {
        setError(`Ya tienes una orden reciente (${data.recentOrderCode}). Puedes verla en tu historial o espera 5 minutos para crear otra.`);
        setLoading(false);
        return;
      }

      if (response.status === 429) {
        router.push('/pagar/bloqueado');
        return;
      }

      if (!response.ok || !data.code) {
        throw new Error(data.error ?? 'Error al crear el pedido');
      }

      const orderCode = data.code;
      setOrderCode(orderCode);

      // ============================================================
      // STEP 2: Subir comprobante (si existe)
      // ============================================================
      if (uploadedFile) {
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            
            // POST /api/orders/[code]/upload-comprobante
            const uploadResponse = await fetch(`/api/orders/${orderCode}/upload-comprobante`, {
              method: 'POST',
              headers: { 'Content-Type': 'multipart/form-data' },
              body: (() => {
                const fd = new FormData();
                fd.append('comprobante', uploadedFile);
                return fd;
              })(),
            });

            if (!uploadResponse.ok) {
              console.warn('⚠️ Comprobante no se cargó, pero orden creada:', orderCode);
              // No bloqueamos si falla: la orden ya está creada
            } else {
              console.log('✅ Comprobante cargado correctamente');
            }
          };
          reader.readAsDataURL(uploadedFile);
        } catch (err) {
          console.error('Error al cargar comprobante:', err);
          // No abortamos: la orden se creó correctamente
        }
      }

      setCurrentStep(4);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  };

  const handleViewOrder = () => {
    if (orderCode) {
      // 🧹 Limpiar localStorage después de crear orden exitosamente
      try {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      } catch (err) {
        console.warn('Error clearing checkout data:', err);
      }
      clearCart();
      router.push(`/pedido/${orderCode}`);
    }
  };

  const handleDownloadTicket = async () => {
    if (!orderCode) return;
    try {
      const response = await fetch(`/api/orders/${orderCode}/ticket`);
      if (!response.ok) throw new Error('No se pudo descargar el comprobante');
      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${orderCode}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading ticket:', err);
      setError(err instanceof Error ? err.message : 'Error al descargar comprobante');
    }
  };

  // Renderización condicional sin early returns
  return items.length === 0 ? (
    <EmptyCartView isDark={isDark} />
  ) : (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader event="Completa tu Pedido" subtitle="Preventa oficial de bebidas" />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <CheckoutStepper steps={STEPS} currentStep={currentStep} />

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-sm font-medium text-red-300">{error}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className={`rounded-lg border p-8 transition-colors ${
                isDark
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }`}>
                <h2 className={`mb-2 text-xl font-semibold ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>Tus Datos de Contacto</h2>
                <div className={`mb-6 border-b pb-4 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className={`h-1 w-24 rounded ${
                    isDark ? 'bg-slate-700' : 'bg-blue-600'
                  }`} />
                </div>

                {/* Info: Email para comprobante */}
                <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                  isDark
                    ? 'bg-slate-800/50 border-amber-600'
                    : 'bg-amber-50 border-amber-500'
                }`}>
                  <p className={`text-sm font-medium ${
                    isDark ? 'text-amber-200' : 'text-amber-900'
                  }`}>
                    📧 El email que declare será utilizado para enviarle el comprobante de su pedido.
                  </p>
                </div>

                <form className="space-y-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Juan Rodriguez"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                        isDark
                          ? 'border-slate-800 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:ring-slate-700'
                          : 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan@example.com"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                        isDark
                          ? 'border-slate-800 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:ring-slate-700'
                          : 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}>Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+54911234567"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                        isDark
                          ? 'border-slate-800 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:ring-slate-700'
                          : 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:ring-blue-600'
                      }`}
                    />
                  </div>
                </form>
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleNextStep}
                    disabled={!isStep1Valid}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-6 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className={`rounded-lg border p-8 space-y-6 transition-colors ${
                isDark
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }`}>
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className={`mb-2 text-xl font-semibold ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        Realiza tu Transferencia Bancaria
                      </h2>
                      <div className={`mb-6 border-b pb-4 ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}>
                        <div className={`h-1 w-24 rounded ${
                          isDark ? 'bg-slate-700' : 'bg-blue-600'
                        }`} />
                      </div>
                    </div>
                    {/* Timer */}
                    <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border-2 ${
                      timeRemaining < 60000 && timeRemaining > 0
                        ? isDark 
                          ? 'border-red-500/50 bg-red-500/10'
                          : 'border-red-400/50 bg-red-100/50'
                        : timeRemaining === 0
                        ? isDark
                          ? 'border-red-500 bg-red-500/20'
                          : 'border-red-500 bg-red-200'
                        : isDark
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-amber-300 bg-amber-50'
                    }`}>
                      <Clock size={20} className={
                        timeRemaining < 60000 && timeRemaining > 0
                          ? isDark ? 'text-red-400' : 'text-red-600'
                          : timeRemaining === 0
                          ? isDark ? 'text-red-400' : 'text-red-600'
                          : isDark ? 'text-amber-400' : 'text-amber-600'
                      } />
                      <div className={`text-sm font-bold text-right ${
                        timeRemaining < 60000 && timeRemaining > 0
                          ? isDark ? 'text-red-400' : 'text-red-600'
                          : timeRemaining === 0
                          ? isDark ? 'text-red-400' : 'text-red-600'
                          : isDark ? 'text-amber-400' : 'text-amber-600'
                      }`}>
                        <div>{Math.floor(timeRemaining / 60000).toString().padStart(2, '0')}:{Math.floor((timeRemaining % 60000) / 1000).toString().padStart(2, '0')}</div>
                        {timeRemaining === 0 && <div className="text-xs">¡Tiempo agotado!</div>}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-slate-900'
                  }`}>Transferir A:</p>
                  <div className={`rounded-lg border p-5 space-y-4 font-mono text-sm font-bold transition-colors ${
                    isDark
                      ? 'border-slate-800 bg-slate-800/40'
                      : 'border-amber-300 bg-amber-50'
                  }`}>
                    <div>
                      <span className={`text-xs font-normal uppercase tracking-wide ${
                        isDark ? 'text-slate-400' : 'text-slate-700'
                      }`}>Titular</span>
                      <div className={`text-lg font-bold mt-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-800'
                      }`}>{BANK_DATA.titular}</div>
                    </div>
                    <div>
                      <span className={`text-xs font-normal uppercase tracking-wide ${
                        isDark ? 'text-slate-400' : 'text-slate-700'
                      }`}>Alias</span>
                      <div className={`text-2xl font-mono font-bold mt-1 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`}>{BANK_DATA.alias}</div>
                    </div>
                    <div>
                      <span className={`text-xs font-normal uppercase tracking-wide ${
                        isDark ? 'text-slate-400' : 'text-slate-700'
                      }`}>CBU</span>
                      <div className={`text-lg font-mono font-bold mt-1 break-all ${
                        isDark ? 'text-amber-300' : 'text-amber-700'
                      }`}>{BANK_DATA.cbu}</div>
                    </div>
                    <div>
                      <span className={`text-xs font-normal uppercase tracking-wide ${
                        isDark ? 'text-slate-400' : 'text-slate-700'
                      }`}>Banco</span>
                      <div className={isDark ? 'text-slate-300 mt-1' : 'text-slate-800 mt-1 font-semibold'}>{BANK_DATA.bank}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-slate-900'
                  }`}>Monto Exacto:</p>
                  <div className={`rounded-lg border p-4 space-y-2 transition-colors ${
                    isDark
                      ? 'border-blue-500/30 bg-blue-500/10'
                      : 'border-amber-300 bg-amber-50'
                  }`}>
                    <div className={`text-3xl font-bold ${
                      isDark ? 'text-blue-400' : 'text-amber-700'
                    }`}>{formatPrice(total)}</div>
                    <div className={`flex gap-2 text-xs ${
                      isDark ? 'text-blue-300' : 'text-amber-700'
                    }`}>
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <p>
                        <strong>IMPORTANTE:</strong> Transferir el monto EXACTO para validar tu pago automáticamente
                      </p>
                    </div>
                  </div>
                </div>

                {/* Screenshot reminder alert */}
                <div className={`rounded-lg border-2 p-5 space-y-3 ${
                  isDark
                    ? 'border-green-500/60 bg-green-500/15'
                    : 'border-green-500 bg-green-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 rounded-full p-2 ${
                      isDark ? 'bg-green-500/30' : 'bg-green-100'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        isDark ? 'text-green-400' : 'text-green-700'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1m.758 4.899a4 4 0 01-5.656 0m5.656-5.656a4 4 0 010 5.656m-5.656 0a4 4 0 000-5.656" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-sm mb-1 ${
                        isDark ? 'text-green-400' : 'text-green-900'
                      }`}>
                        ⚠️ IMPORTANTE: Captura de Pantalla Obligatoria
                      </h3>
                      <p className={`text-sm mb-2 ${
                        isDark ? 'text-green-300' : 'text-green-800'
                      }`}>
                        Después de realizar la transferencia, <strong>debes capturar una pantalla</strong> que muestre:
                      </p>
                      <ul className={`text-sm space-y-1 ml-4 list-disc ${
                        isDark ? 'text-green-300' : 'text-green-800'
                      }`}>
                        <li>La confirmación de la transferencia realizada</li>
                        <li>El monto transferido</li>
                        <li>La fecha y hora de la transacción</li>
                      </ul>
                      <p className={`text-sm mt-2 font-medium ${
                        isDark ? 'text-green-400' : 'text-green-900'
                      }`}>
                        ✓ En el próximo paso cargarás esta captura
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>Tu Pedido:</p>
                  <div className={`rounded-lg border p-4 space-y-2 text-sm transition-colors ${
                    isDark
                      ? 'border-slate-800 bg-slate-800/40'
                      : 'border-slate-300 bg-slate-100'
                  }`}>
                    {items.map((item) => (
                      <div key={item.productId} className="flex justify-between">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.quantity}x {item.name}</span>
                        <span className={`font-medium ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className={`border-t pt-2 flex justify-between font-semibold ${
                      isDark ? 'border-slate-800' : 'border-slate-300'
                    }`}>
                      <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>TOTAL:</span>
                      <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <button
                    onClick={handlePreviousStep}
                    className={`inline-flex items-center gap-2 rounded-lg border px-6 py-2 text-sm font-medium transition ${
                      isDark
                        ? 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-200'
                        : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={handleNextStep}
                    className={`inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Ya Transferí →
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className={`rounded-lg border p-8 space-y-6 transition-colors ${
                isDark
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }`}>
                <div>
                  <h2 className={`mb-2 text-xl font-semibold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    Subir Comprobante (Opcional)
                  </h2>
                  <div className={`mb-6 border-b pb-4 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <div className={`h-1 w-24 rounded ${
                      isDark ? 'bg-slate-700' : 'bg-blue-600'
                    }`} />
                  </div>
                </div>
                <p className={`text-sm ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Para mayor seguridad, puedes subir el comprobante de tu transferencia. Esto
                  ayuda a validar tu pago.
                </p>
                {!uploadedFile ? (
                  <>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDragDrop}
                      className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition ${
                        isDark
                          ? 'border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10'
                          : 'border-blue-400/50 bg-blue-100/30 hover:bg-blue-100/50'
                      }`}
                    >
                      <Upload className={`mx-auto mb-3 ${
                        isDark ? 'text-blue-500' : 'text-blue-600'
                      }`} size={32} />
                      <p className={`font-medium ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>DRAG & DROP aquí</p>
                      <p className={`text-sm mt-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>o</p>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`inline-flex items-center gap-2 rounded-lg border px-6 py-2 text-sm font-medium transition ${
                          isDark
                            ? 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-200'
                            : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Seleccionar archivo
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={`rounded-lg border p-4 flex items-center justify-between transition-colors ${
                    isDark
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-emerald-300 bg-emerald-100/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <CheckCircle className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={24} />
                      <div>
                        <p className={`font-medium ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>{uploadedFile.name}</p>
                        <p className={`text-xs ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setPreviewUrl(null);
                      }}
                      className={isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
                <p className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>Formatos: JPG, PNG (máx 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex justify-between pt-4">
                  <button
                    onClick={handlePreviousStep}
                    className={`inline-flex items-center gap-2 rounded-lg border px-6 py-2 text-sm font-medium transition ${
                      isDark
                        ? 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-200'
                        : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={loading}
                    className={`inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loading ? 'Procesando...' : 'Confirmar Pedido →'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className={`rounded-lg border p-8 space-y-6 transition-colors ${
                isDark
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-emerald-300 bg-emerald-50'
              }`}>
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border mb-4 transition-colors ${
                    isDark
                      ? 'bg-emerald-500/20 border-emerald-500/30'
                      : 'bg-emerald-100 border-emerald-300'
                  }`}>
                    <CheckCircle className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={32} />
                  </div>
                  <h2 className={`text-2xl font-semibold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    ¡Listo! Tu Pedido está Registrado
                  </h2>
                  <div className={`mt-4 border-b ${
                    isDark ? 'border-emerald-500/30' : 'border-emerald-300'
                  }`} />
                </div>
                <div className={`rounded-lg border p-6 text-center transition-colors ${
                  isDark
                    ? 'bg-slate-900/50 border-emerald-500/30'
                    : 'bg-white border-emerald-200'
                }`}>
                  <p className={`text-sm mb-2 font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>Tu Código de Retiro:</p>
                  <div className={`text-4xl font-mono font-bold tracking-wider ${
                    isDark ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {orderCode}
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>Resumen de tu Pedido:</p>
                  <div className={`rounded-lg border p-4 space-y-3 text-sm transition-colors ${
                    isDark
                      ? 'border-emerald-500/30 bg-slate-900/50'
                      : 'border-emerald-200 bg-white'
                  }`}>
                    <div className={`grid grid-cols-2 gap-4 pb-3 border-b ${
                      isDark ? 'border-emerald-500/20' : 'border-emerald-200'
                    }`}>
                      <div>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Cliente:</span>
                        <p className={`font-medium ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>{formData.name}</p>
                      </div>
                      <div>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Email:</span>
                        <p className={`font-medium ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>{formData.email}</p>
                      </div>
                    </div>
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Teléfono:</span>
                      <p className={`font-medium ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>{formData.phone}</p>
                    </div>
                    <div className={`border-t pt-3 space-y-1 ${
                      isDark ? 'border-emerald-500/20' : 'border-emerald-200'
                    }`}>
                      {items.map((item) => (
                        <div key={item.productId} className="flex justify-between">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.quantity}x {item.name}</span>
                          <span className={`font-medium ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className={`border-t pt-3 flex justify-between font-bold text-base transition-colors ${
                      isDark ? 'border-emerald-500/20' : 'border-emerald-200'
                    }`}>
                      <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>TOTAL:</span>
                      <span className={`font-medium text-lg ${
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      }`}>{formatPrice(total)}</span>
                    </div>
                    <div className={`rounded px-3 py-2 text-center font-medium transition-colors ${
                      isDark
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                        : 'bg-amber-100 border border-amber-300 text-amber-800'
                    }`}>
                      Estado: PENDIENTE VALIDACIÓN
                    </div>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>Próximos Pasos:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={18} />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Recibiremos tu transferencia</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={18} />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Validaremos tu pago (puede tardar 24hs)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={18} />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Te confirmaremos por email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={18} />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Retira tu pedido el día del evento con este código</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 flex flex-col items-center gap-3">
                  <button
                    onClick={handleViewOrder}
                    className={`inline-flex items-center gap-2 rounded-lg px-8 py-2 text-sm font-semibold transition ${
                      isDark
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    Ver Estado de Mi Pedido →
                  </button>
                  <button
                    onClick={handleDownloadTicket}
                    className={`inline-flex items-center gap-2 rounded-lg px-8 py-2 text-sm font-semibold transition ${
                      isDark
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Download size={16} />
                    Descargar Comprobante
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className={`sticky top-6 rounded-lg border p-6 transition-colors ${
              isDark
                ? 'border-slate-800 bg-slate-900'
                : 'border-slate-200 bg-white'
            }`}>
              <h3 className={`font-semibold mb-4 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>Resumen de tu Compra</h3>
              <div className={`space-y-3 mb-4 pb-4 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.quantity}x {item.name}</span>
                    <span className={`font-medium ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold">
                <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>Total:</span>
                <span className={`text-lg ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
