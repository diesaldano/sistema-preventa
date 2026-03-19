'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useTheme } from '@/lib/theme-context';
import { formatPrice } from '@/lib/utils';
import CheckoutStepper from '@/components/checkout-stepper';
import { AlertCircle, Upload, X, CheckCircle } from 'lucide-react';
import { BrandHeader } from '@/components/brand-header';

const BANK_DATA = {
  alias: 'diez.producciones',
  cbu: '0140123456789012345678',
  bank: 'XYZ Bank',
};

const STEPS = [
  { id: 1, label: 'Datos Personales' },
  { id: 2, label: 'Transferencia' },
  { id: 3, label: 'Comprobante' },
  { id: 4, label: 'Confirmación' },
];

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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (items.length === 0) {
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

  const isStep1Valid = formData.name.trim() && formData.email.trim() && formData.phone.trim();

  const handleNextStep = async () => {
    setError(null);
    if (currentStep === 1) {
      if (!isStep1Valid) {
        setError('Por favor completa todos los campos');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
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
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setError('Formato no válido. Usa JPG, PNG o PDF');
      return;
    }
    if (file.size > maxSize) {
      setError('Archivo demasiado grande. Máximo 5MB');
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
      const formDataToSend = new FormData();
      formDataToSend.append('customerName', formData.name);
      formDataToSend.append('customerEmail', formData.email);
      formDataToSend.append('customerPhone', formData.phone);
      formDataToSend.append(
        'items',
        JSON.stringify(
          items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          }))
        )
      );
      formDataToSend.append('total', total.toString());

      if (uploadedFile) {
        formDataToSend.append('comprobante', uploadedFile);
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok || !data.code) {
        throw new Error(data.error ?? 'Error al crear el pedido');
      }

      setOrderCode(data.code);
      setCurrentStep(4);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  };

  const handleViewOrder = () => {
    if (orderCode) {
      clearCart();
      router.push(`/pedido/${orderCode}`);
    }
  };

  return (
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
                <form className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
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
                    <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
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
                    <label className="block text-sm font-medium text-slate-200 mb-2">Teléfono</label>
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
                <div>
                  <p className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>Transferir A:</p>
                  <div className={`rounded-lg border p-4 space-y-2 font-mono text-sm transition-colors ${
                    isDark
                      ? 'border-slate-800 bg-slate-800/40'
                      : 'border-slate-300 bg-slate-100'
                  }`}>
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Alias:</span>{' '}
                      <span className={`font-semibold ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>{BANK_DATA.alias}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>CBU:</span>{' '}
                      <span className={`font-semibold break-all ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>{BANK_DATA.cbu}</span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Banco:</span>{' '}
                      <span className={`font-semibold ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>{BANK_DATA.bank}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>Monto Exacto:</p>
                  <div className={`rounded-lg border p-4 space-y-2 transition-colors ${
                    isDark
                      ? 'border-blue-500/30 bg-blue-500/10'
                      : 'border-blue-300 bg-blue-100/50'
                  }`}>
                    <div className={`text-2xl font-bold ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>{formatPrice(total)}</div>
                    <div className={`flex gap-2 text-xs ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <p>
                        <strong>IMPORTANTE:</strong> Transferir el monto EXACTO para validar tu
                        pago automáticamente
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
                }`}>Formatos: JPG, PNG, PDF (máx 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
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
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-8 space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
                    <CheckCircle className="text-emerald-400" size={32} />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-100">
                    ¡Listo! Tu Pedido está Registrado
                  </h2>
                  <div className="mt-4 border-b border-emerald-500/30" />
                </div>
                <div className="rounded-lg bg-slate-900/50 border border-emerald-500/30 p-6 text-center">
                  <p className="text-sm text-slate-400 mb-2">Tu Código de Retiro:</p>
                  <div className="text-4xl font-mono font-bold text-amber-400 tracking-wider">
                    {orderCode}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200 mb-3">Resumen de tu Pedido:</p>
                  <div className="rounded-lg border border-emerald-500/30 bg-slate-900/50 p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-emerald-500/20">
                      <div>
                        <span className="text-slate-400">Cliente:</span>
                        <p className="font-medium text-slate-100">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Email:</span>
                        <p className="font-medium text-slate-100">{formData.email}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Teléfono:</span>
                      <p className="font-medium text-slate-100">{formData.phone}</p>
                    </div>
                    <div className="border-t border-emerald-500/20 pt-3 space-y-1">
                      {items.map((item) => (
                        <div key={item.productId} className="flex justify-between">
                          <span className="text-slate-300">{item.quantity}x {item.name}</span>
                          <span className="font-medium text-slate-100">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-emerald-500/20 pt-3 flex justify-between font-bold text-base">
                      <span className="text-slate-100">TOTAL:</span>
                      <span className="text-amber-400 font-medium text-lg">{formatPrice(total)}</span>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 text-center font-medium text-amber-300">
                      Estado: PENDIENTE VALIDACIÓN
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200 mb-3">Próximos Pasos:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-emerald-400 flex-shrink-0" size={18} />
                      <span className="text-slate-300">Recibiremos tu transferencia</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-emerald-400 flex-shrink-0" size={18} />
                      <span className="text-slate-300">Validaremos tu pago (puede tardar 24hs)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-emerald-400 flex-shrink-0" size={18} />
                      <span className="text-slate-300">Te confirmaremos por email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-emerald-400 flex-shrink-0" size={18} />
                      <span className="text-slate-300">Retira tu pedido el día del evento con este código</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleViewOrder}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-8 py-2 text-sm font-semibold text-slate-950 transition"
                  >
                    Ver Estado de Mi Pedido →
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
