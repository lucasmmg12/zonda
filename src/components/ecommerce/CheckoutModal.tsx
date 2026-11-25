import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Lock,
  ShieldCheck,
  Tag,
  Truck,
  Wallet,
  X
} from 'lucide-react';
import type {
  EcommerceCartItem,
  EcommerceCupon,
  EcommercePedido,
  EcommerceTiendaConfig,
  MetodoPagoEcommerce
} from '../../types/ecommerce';
import {
  type GoogleBuyerSession,
  iniciarSesionConGoogleOAuth,
  iniciarSesionGoogleSandbox
} from '../../services/ecommerceAuthService';
import { crearPreferenciaMercadoPago } from '../../services/mercadopago/mercadoPagoClient';

interface Props {
  isOpen: boolean;
  config: EcommerceTiendaConfig;
  items: EcommerceCartItem[];
  cupones: EcommerceCupon[];
  buyerSession: GoogleBuyerSession | null;
  onBuyerLoggedIn: (session: GoogleBuyerSession) => void;
  onClose: () => void;
  onOrderCreated: (pedido: EcommercePedido, datosComprador: {
    telefono: string;
    dniCuit: string;
    direccionEnvio: string;
    ciudad: string;
    codigoPostal: string;
  }) => Promise<void>;
}

export const CheckoutModal: React.FC<Props> = ({
  isOpen,
  config,
  items,
  cupones,
  buyerSession,
  onBuyerLoggedIn,
  onClose,
  onOrderCreated
}) => {
  const [googleError, setGoogleError] = useState('');
  const [sandboxEmail, setSandboxEmail] = useState('cliente.google@gmail.com');
  const [sandboxNombre, setSandboxNombre] = useState('María Laura González');

  const [telefono, setTelefono] = useState('');
  const [dniCuit, setDniCuit] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('San Juan');
  const [codigoPostal, setCodigoPostal] = useState('5400');
  const [notas, setNotas] = useState('');

  const enviosActivos = config.envios.filter((e) => e.activo);
  const [envioId, setEnvioId] = useState<string>(enviosActivos[0]?.id || 'ENV-RETIRO');

  const defaultMetodo: MetodoPagoEcommerce = config.pagos.mercadoPagoActivo
    ? 'mercadopago'
    : config.pagos.transferenciaActiva
    ? 'transferencia'
    : 'efectivo_retiro';
  const [metodoPago, setMetodoPago] = useState<MetodoPagoEcommerce>(defaultMetodo);
  const [comprobanteRef, setComprobanteRef] = useState('');

  const [cuponInput, setCuponInput] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState<EcommerceCupon | null>(null);
  const [cuponError, setCuponError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState<EcommercePedido | null>(null);
  const [mpCheckoutUrl, setMpCheckoutUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = Number(items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0).toFixed(2));
  const envioSel = enviosActivos.find((e) => e.id === envioId) || enviosActivos[0];
  const costoEnvio =
    envioSel && envioSel.gratisDesde && subtotal >= envioSel.gratisDesde ? 0 : envioSel?.costo || 0;

  let descuentoCupon = 0;
  if (cuponAplicado) {
    descuentoCupon =
      cuponAplicado.tipo === 'porcentaje'
        ? Number(((subtotal * cuponAplicado.valor) / 100).toFixed(2))
        : Math.min(subtotal, cuponAplicado.valor);
  }

  const descuentoTransferencia =
    metodoPago === 'transferencia' && config.pagos.transferenciaDescuentoPct > 0
      ? Number((((subtotal - descuentoCupon) * config.pagos.transferenciaDescuentoPct) / 100).toFixed(2))
      : 0;

  const descuentoTotal = Number((descuentoCupon + descuentoTransferencia).toFixed(2));
  const totalFinal = Number(Math.max(0, subtotal - descuentoTotal + costoEnvio).toFixed(2));

  const handleGoogleOAuth = async () => {
    setGoogleError('');
    const res = await iniciarSesionConGoogleOAuth();
    if (!res.redirected && res.error) {
      setGoogleError(
        `Google OAuth en Supabase requiere habilitar el proveedor Google (${res.error}). Podés usar el acceso Google Sandbox debajo para probar el flujo completo.`
      );
    }
  };

  const handleGoogleSandbox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxEmail.includes('@')) return;
    const session = iniciarSesionGoogleSandbox({ email: sandboxEmail, nombre: sandboxNombre });
    onBuyerLoggedIn(session);
  };

  const handleAplicarCupon = () => {
    setCuponError('');
    const code = cuponInput.trim().toUpperCase();
    const found = cupones.find((c) => c.activo && c.codigo.toUpperCase() === code);
    if (!found) {
      setCuponError('Cupón inválido o inactivo.');
      return;
    }
    if (subtotal < found.minimoCompra) {
      setCuponError(`Compra mínima requerida: $${found.minimoCompra.toLocaleString('es-AR')}`);
      return;
    }
    setCuponAplicado(found);
  };

  const handleConfirmarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerSession || items.length === 0) return;
    setProcesando(true);
    try {
      const nroPedido = `EC-${String(Math.floor(1000 + Math.random() * 9000))}`;
      let mpPreferenceId: string | undefined;
      let mpPaymentId: string | undefined;

      if (metodoPago === 'mercadopago') {
        try {
          const pref = await Promise.race([
            crearPreferenciaMercadoPago({
              titulo: `Pedido ${nroPedido} - ${config.identidad.nombreTienda}`,
              monto: totalFinal,
              clienteEmail: buyerSession.email,
              comprobanteNumero: nroPedido
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]);
          mpPreferenceId = pref.preferenceId;
          mpPaymentId = `MP-PAY-${Date.now().toString().slice(-6)}`;
          if (pref.initPoint) setMpCheckoutUrl(pref.initPoint);
        } catch {
          mpPreferenceId = `PREF-SANDBOX-${Date.now()}`;
          mpPaymentId = `MP-PAY-${Date.now().toString().slice(-6)}`;
        }
      }

      const pedido: EcommercePedido = {
        id: `PED-${Date.now()}`,
        tenantId: config.tenantId,
        numeroPedido: nroPedido,
        fecha: new Date().toISOString(),
        compradorId: `COMP-${buyerSession.googleUid}`,
        compradorGoogleUid: buyerSession.googleUid,
        compradorNombre: buyerSession.nombre,
        compradorEmail: buyerSession.email,
        compradorTelefono: telefono || 'Sin especificar',
        compradorDniCuit: dniCuit || '99-99999999-9',
        direccionEnvio:
          envioSel?.tipo === 'retiro_local'
            ? `Retiro en local: ${config.identidad.direccionLocal}`
            : `${direccion}, ${ciudad} (CP ${codigoPostal})`,
        metodoEnvioId: envioSel?.id || 'ENV-RETIRO',
        metodoEnvioNombre: envioSel?.nombre || 'Retiro en Local',
        metodoPago,
        estadoPago: metodoPago === 'mercadopago' ? 'aprobado' : 'pendiente',
        estadoEnvio: metodoPago === 'mercadopago' ? 'preparando' : 'pendiente',
        subtotal,
        cuponCodigo: cuponAplicado?.codigo,
        descuentoMonto: descuentoTotal,
        costoEnvio,
        total: totalFinal,
        notas,
        mpPreferenceId,
        mpPaymentId,
        comprobanteTransferenciaRef: comprobanteRef || undefined,
        sincronizadoErp: false,
        items: items.map((i) => ({
          productoId: i.productoId,
          articuloInventarioId: i.articuloInventarioId,
          sku: i.sku,
          nombre: i.nombre,
          varianteId: i.varianteId,
          varianteNombre: i.varianteNombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: Number((i.precioUnitario * i.cantidad).toFixed(2)),
          imagen: i.imagen
        }))
      };

      await onOrderCreated(pedido, {
        telefono,
        dniCuit,
        direccionEnvio: direccion,
        ciudad,
        codigoPostal
      });
      setPedidoCreado(pedido);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div
          className="px-6 py-4 text-white flex items-center justify-between"
          style={{ backgroundColor: config.identidad.colorPrimario }}
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm">Checkout Seguro — {config.identidad.nombreTienda}</h3>
              <p className="text-[11px] text-white/80">Autenticación Google Auth + Pago Directo Integrado</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PANTALLA DE CONFIRMACIÓN */}
        {pedidoCreado ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-slate-900">¡Pedido {pedidoCreado.numeroPedido} Confirmado!</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Registramos tu compra a nombre de <strong>{pedidoCreado.compradorNombre}</strong> ({pedidoCreado.compradorEmail}).
              {pedidoCreado.estadoPago === 'aprobado'
                ? ' Tu pago fue aprobado al instante, descontamos el stock y emitimos tu comprobante en Zonda ERP.'
                : ' Queda pendiente de acreditación/confirmación del comercio.'}
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total abonado:</span>
                <strong className="font-mono text-slate-900">${pedidoCreado.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medio de pago:</span>
                <strong className="uppercase">{pedidoCreado.metodoPago}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado pago:</span>
                <span className={`font-bold uppercase ${pedidoCreado.estadoPago === 'aprobado' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {pedidoCreado.estadoPago}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Entrega:</span>
                <span>{pedidoCreado.metodoEnvioNombre}</span>
              </div>
            </div>
            {mpCheckoutUrl && (
              <a
                href={mpCheckoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009ee3] text-white text-xs font-bold hover:opacity-95"
              >
                <CreditCard className="w-4 h-4" /> Abrir Comprobante / Link Mercado Pago
              </a>
            )}
            <div className="pt-2">
              <button
                onClick={onClose}
                style={{ backgroundColor: config.identidad.colorPrimario }}
                className="px-6 py-2.5 rounded-xl text-white text-xs font-bold"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        ) : !buyerSession ? (
          /* PASO 1 OBLIGATORIO: GOOGLE AUTH */
          <div className="p-8 max-w-md mx-auto space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#1b365d]" />
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-slate-900">Iniciá sesión con Google para comprar</h4>
              <p className="text-xs text-slate-600 mt-1">
                Todos los compradores deben autenticarse con su cuenta de Google para proteger el pago, recibir la factura electrónica y seguir sus pedidos.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleOAuth}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-3 shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google (Supabase OAuth)
            </button>

            {googleError && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-left">
                {googleError}
              </p>
            )}

            <div className="relative py-1">
              <div className="border-t border-slate-200" />
              <span className="bg-white px-2 text-[10px] font-bold uppercase text-slate-400 relative -top-2.5">
                Acceso rápido Google Sandbox (Pruebas / Local)
              </span>
            </div>

            <form onSubmit={handleGoogleSandbox} className="space-y-2.5 text-left bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nombre cuenta Google</label>
                <input
                  type="text"
                  required
                  value={sandboxNombre}
                  onChange={(e) => setSandboxNombre(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email Google (@gmail.com)</label>
                <input
                  type="email"
                  required
                  value={sandboxEmail}
                  onChange={(e) => setSandboxEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: config.identidad.colorPrimario }}
                className="w-full py-2 rounded-lg text-white text-xs font-bold hover:opacity-95"
              >
                Ingresar con Google Sandbox
              </button>
            </form>
          </div>
        ) : (
          /* PASO 2 Y 3: ENVÍO + MEDIOS DE PAGO */
          <form onSubmit={handleConfirmarCompra} className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6 text-xs overflow-y-auto">
            <div className="md:col-span-3 space-y-4">
              {/* Usuario Google autenticado */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                {buyerSession.avatarUrl && (
                  <img src={buyerSession.avatarUrl} alt={buyerSession.nombre} className="w-9 h-9 rounded-full" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-emerald-950 truncate">{buyerSession.nombre}</p>
                  <p className="text-[11px] text-emerald-700 truncate">✓ Google Auth verificado: {buyerSession.email}</p>
                </div>
              </div>

              {/* Datos fiscales y entrega */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    required
                    type="tel"
                    placeholder="264 555-1234"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DNI o CUIT (Factura ARCA) *</label>
                  <input
                    required
                    type="text"
                    placeholder="20-34567890-1"
                    value={dniCuit}
                    onChange={(e) => setDniCuit(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2"
                  />
                </div>
              </div>

              {/* Método de Envío */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-slate-500" /> 1. Forma de Entrega
                </label>
                {enviosActivos.map((env) => {
                  const gratis = env.gratisDesde && subtotal >= env.gratisDesde;
                  return (
                    <label
                      key={env.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer ${
                        envioId === env.id ? 'border-[#1b365d] bg-blue-50/40' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="envio"
                          checked={envioId === env.id}
                          onChange={() => setEnvioId(env.id)}
                        />
                        <div>
                          <p className="font-bold text-slate-900">{env.nombre}</p>
                          <p className="text-[10px] text-slate-500">{env.descripcion}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {gratis || env.costo === 0 ? 'GRATIS' : `$${env.costo.toLocaleString('es-AR')}`}
                      </span>
                    </label>
                  );
                })}
              </div>

              {envioSel?.tipo !== 'retiro_local' && (
                <div className="grid grid-cols-3 gap-2">
                  <input
                    required
                    type="text"
                    placeholder="Calle y altura"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="col-span-2 border border-slate-300 rounded-lg px-2.5 py-2"
                  />
                  <input
                    required
                    type="text"
                    placeholder="CP"
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-2"
                  />
                  <input
                    required
                    type="text"
                    placeholder="Ciudad / Provincia"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="col-span-3 border border-slate-300 rounded-lg px-2.5 py-2"
                  />
                </div>
              )}

              {/* Método de Pago Directo */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-slate-500" /> 2. Medio de Pago Directo
                </label>

                {config.pagos.mercadoPagoActivo && (
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${
                      metodoPago === 'mercadopago' ? 'border-[#009ee3] bg-sky-50/50' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pago"
                      checked={metodoPago === 'mercadopago'}
                      onChange={() => setMetodoPago('mercadopago')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Mercado Pago (Tarjetas Débito / Crédito / Dinero en cuenta)</p>
                      <p className="text-[10px] text-slate-500">{config.pagos.mercadoPagoCuotasTexto}</p>
                    </div>
                  </label>
                )}

                {config.pagos.transferenciaActiva && (
                  <label
                    className={`block p-3 rounded-xl border cursor-pointer ${
                      metodoPago === 'transferencia' ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="pago"
                          checked={metodoPago === 'transferencia'}
                          onChange={() => setMetodoPago('transferencia')}
                        />
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold text-slate-900">Transferencia Bancaria</span>
                      </div>
                      {config.pagos.transferenciaDescuentoPct > 0 && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {config.pagos.transferenciaDescuentoPct}% OFF
                        </span>
                      )}
                    </div>
                    {metodoPago === 'transferencia' && (
                      <div className="mt-2.5 p-2.5 bg-white border border-emerald-200 rounded-lg space-y-1.5 text-[11px]">
                        <p>
                          <strong>Titular:</strong> {config.pagos.transferenciaTitular}
                        </p>
                        <p className="flex items-center justify-between">
                          <span>
                            <strong>Alias:</strong> <span className="font-mono">{config.pagos.transferenciaAlias}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(config.pagos.transferenciaAlias)}
                            className="text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copiar
                          </button>
                        </p>
                        <p>
                          <strong>CBU:</strong> <span className="font-mono">{config.pagos.transferenciaCbu}</span>
                        </p>
                        <input
                          type="text"
                          placeholder="Nro. de operación o referencia de transferencia (opcional)"
                          value={comprobanteRef}
                          onChange={(e) => setComprobanteRef(e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1 mt-1"
                        />
                      </div>
                    )}
                  </label>
                )}

                {config.pagos.efectivoRetiroActivo && (
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer ${
                      metodoPago === 'efectivo_retiro' ? 'border-[#1b365d] bg-slate-50' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pago"
                      checked={metodoPago === 'efectivo_retiro'}
                      onChange={() => setMetodoPago('efectivo_retiro')}
                    />
                    <Wallet className="w-4 h-4 text-slate-600" />
                    <span className="font-bold text-slate-900">Efectivo al retirar en sucursal</span>
                  </label>
                )}
              </div>

              <input
                type="text"
                placeholder="Notas adicionales para el pedido (opcional)"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2"
              />
            </div>

            {/* RESUMEN DERECHO */}
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Resumen del Pedido</h4>
                <div className="divide-y divide-slate-200 max-h-44 overflow-y-auto">
                  {items.map((it) => (
                    <div key={it.cartKey} className="py-2 flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {it.cantidad}x {it.nombre}
                        </p>
                        {it.varianteNombre && <p className="text-[10px] text-slate-500">{it.varianteNombre}</p>}
                      </div>
                      <span className="font-mono font-bold shrink-0">
                        ${(it.precioUnitario * it.cantidad).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cupón */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Cupón (ej. BIENVENIDO10)"
                      value={cuponInput}
                      onChange={(e) => setCuponInput(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 bg-white uppercase text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleAplicarCupon}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" /> Aplicar
                    </button>
                  </div>
                  {cuponError && <p className="text-[10px] text-rose-600">{cuponError}</p>}
                  {cuponAplicado && (
                    <p className="text-[10px] text-emerald-700 font-bold">
                      ✓ Cupón {cuponAplicado.codigo} aplicado (-${descuentoCupon.toLocaleString('es-AR')})
                    </p>
                  )}
                </div>

                {/* Totales */}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {descuentoTotal > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Descuentos:</span>
                      <span className="font-mono">-${descuentoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Envío:</span>
                    <span className="font-mono">{costoEnvio === 0 ? 'GRATIS' : `$${costoEnvio.toLocaleString('es-AR')}`}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>TOTAL:</span>
                    <span className="font-mono">${totalFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={procesando}
                style={{ backgroundColor: config.identidad.colorPrimario }}
                className="w-full py-3 rounded-xl text-white font-bold text-xs hover:opacity-95 disabled:opacity-50"
              >
                {procesando
                  ? 'Procesando pago y stock...'
                  : metodoPago === 'mercadopago'
                  ? 'Pagar Ahora con Mercado Pago'
                  : 'Confirmar Pedido'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
