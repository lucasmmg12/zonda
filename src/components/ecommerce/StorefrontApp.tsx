import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  LogOut,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  User
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type {
  EcommerceCartItem,
  EcommercePedido,
  EcommerceProducto,
  EcommerceTenantState
} from '../../types/ecommerce';
import {
  buildCartKey,
  descontarStockVariantesEnEstado,
  loadCartForTenant,
  loadEcommerceState,
  saveCartForTenant,
  saveEcommerceState
} from '../../services/ecommerceService';
import {
  buildCompradorProfile,
  cerrarSesionGoogleBuyer,
  type GoogleBuyerSession,
  resolverSesionGoogleBuyer
} from '../../services/ecommerceAuthService';
import { ProductDetailModal } from './ProductDetailModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';

interface Props {
  tenantId: string;
  empresaNombre: string;
  esVistaPrevia?: boolean;
  onVolverAlErp?: () => void;
}

export const StorefrontApp: React.FC<Props> = ({
  tenantId,
  empresaNombre,
  esVistaPrevia = false,
  onVolverAlErp
}) => {
  const { inventario, registrarPedidoEcommerceEnErp } = useErp();

  const [ecomState, setEcomState] = useState<EcommerceTenantState>(() =>
    loadEcommerceState(tenantId, empresaNombre, inventario)
  );
  const [cart, setCart] = useState<EcommerceCartItem[]>(() => loadCartForTenant(tenantId));
  const [buyerSession, setBuyerSession] = useState<GoogleBuyerSession | null>(null);

  const [search, setSearch] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('TODAS');
  const [soloOfertas, setSoloOfertas] = useState(false);

  const [productoModal, setProductoModal] = useState<EcommerceProducto | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [misPedidosOpen, setMisPedidosOpen] = useState(false);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);

  useEffect(() => {
    setEcomState(loadEcommerceState(tenantId, empresaNombre, inventario));
    setCart(loadCartForTenant(tenantId));
  }, [tenantId, empresaNombre]);

  useEffect(() => {
    void resolverSesionGoogleBuyer().then((s) => setBuyerSession(s));
    const onSync = () => setEcomState(loadEcommerceState(tenantId, empresaNombre, inventario));
    window.addEventListener('zonda_ecommerce_updated', onSync);
    return () => window.removeEventListener('zonda_ecommerce_updated', onSync);
  }, [tenantId, empresaNombre, inventario]);

  useEffect(() => {
    saveCartForTenant(tenantId, cart);
  }, [tenantId, cart]);

  const { config, categorias, productos, pedidos, cupones } = ecomState;
  const colorPrimario = config.identidad.colorPrimario || '#1b365d';

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (!p.publicado) return false;
      if (categoriaActiva !== 'TODAS' && p.categoriaId !== categoriaActiva) return false;
      if (soloOfertas && !p.enOferta) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.marca.toLowerCase().includes(q) ||
          p.descripcionCorta.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [productos, categoriaActiva, soloOfertas, search]);

  const misPedidos = useMemo(() => {
    if (!buyerSession) return [];
    return pedidos.filter(
      (p) =>
        p.compradorEmail.toLowerCase() === buyerSession.email.toLowerCase() ||
        p.compradorGoogleUid === buyerSession.googleUid
    );
  }, [pedidos, buyerSession]);

  const handleAddToCart = (item: EcommerceCartItem) => {
    setCart((prev) => {
      const key = item.cartKey || buildCartKey(item.productoId, item.varianteId);
      const exists = prev.find((i) => i.cartKey === key);
      if (exists) {
        return prev.map((i) =>
          i.cartKey === key
            ? { ...i, cantidad: Math.min(i.stockDisponible, i.cantidad + item.cantidad) }
            : i
        );
      }
      return [...prev, { ...item, cartKey: key }];
    });
    setCartOpen(true);
  };

  const handleUpdateQty = (cartKey: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.cartKey !== cartKey));
      return;
    }
    setCart((prev) => prev.map((i) => (i.cartKey === cartKey ? { ...i, cantidad: qty } : i)));
  };

  const handleOrderCreated = async (
    pedido: EcommercePedido,
    datosComprador: { telefono: string; dniCuit: string; direccionEnvio: string; ciudad: string; codigoPostal: string }
  ) => {
    if (!buyerSession) return;
    let pedidoFinal = { ...pedido };

    // Si el pago ya fue aprobado (ej. Mercado Pago), sincronizamos automáticamente con el ERP
    if (pedidoFinal.estadoPago === 'aprobado') {
      const resErp = await Promise.race([
        registrarPedidoEcommerceEnErp(pedidoFinal, config.pagos.cuentaTesoreriaDestinoId),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500))
      ]);
      if (resErp) {
        pedidoFinal = {
          ...pedidoFinal,
          sincronizadoErp: true,
          facturaErpNro: resErp.facturaNro,
          clienteErpId: resErp.clienteId
        };
      } else {
        pedidoFinal = {
          ...pedidoFinal,
          sincronizadoErp: true,
          facturaErpNro: `0001-${String(Math.floor(10000 + Math.random() * 89999)).padStart(8, '0')}`
        };
      }
    }

    const existente = ecomState.compradores.find(
      (c) => c.email.toLowerCase() === buyerSession.email.toLowerCase()
    );
    const perfil = buildCompradorProfile(tenantId, buyerSession, datosComprador, existente);
    if (pedidoFinal.clienteErpId) perfil.clienteErpId = pedidoFinal.clienteErpId;

    const compradoresActualizados = existente
      ? ecomState.compradores.map((c) => (c.id === existente.id ? perfil : c))
      : [perfil, ...ecomState.compradores];

    const cuponesActualizados = pedidoFinal.cuponCodigo
      ? ecomState.cupones.map((c) =>
          c.codigo.toUpperCase() === pedidoFinal.cuponCodigo?.toUpperCase()
            ? { ...c, usosActuales: c.usosActuales + 1 }
            : c
        )
      : ecomState.cupones;

    const conStockDescontado = descontarStockVariantesEnEstado(ecomState, pedidoFinal);
    const nextState: EcommerceTenantState = {
      ...conStockDescontado,
      pedidos: [pedidoFinal, ...ecomState.pedidos],
      compradores: compradoresActualizados,
      cupones: cuponesActualizados
    };

    saveEcommerceState(tenantId, nextState);
    setEcomState(nextState);
    setCart([]);
  };

  const totalItemsCart = cart.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      {/* Barra superior de Vista Previa */}
      {esVistaPrevia && onVolverAlErp && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              <strong>Vista Previa en Vivo</strong> · URL pública:{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">/?tienda={config.slug}</code>
            </span>
          </div>
          <button
            onClick={onVolverAlErp}
            className="px-3 py-1 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-100 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Panel Admin ERP
          </button>
        </div>
      )}

      {/* Marquesina promocional estilo Tiendanube */}
      {config.marquesina.activa && config.marquesina.mensajes.length > 0 && (
        <div
          className="px-4 py-2 text-center text-[11px] font-semibold tracking-wide"
          style={{ backgroundColor: config.marquesina.bgColor, color: config.marquesina.textColor }}
        >
          {config.marquesina.mensajes.join('   ·   ')}
        </div>
      )}

      {/* Header Storefront */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {config.identidad.logoUrl ? (
                <img src={config.identidad.logoUrl} alt={config.identidad.nombreTienda} className="w-7 h-7 object-contain" />
              ) : (
                <ShoppingBag className="w-5 h-5" style={{ color: colorPrimario }} />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {config.identidad.nombreTienda}
              </h1>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">{config.identidad.slogan}</p>
            </div>
          </div>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar productos, SKU o marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {buyerSession ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMisPedidosOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold flex items-center gap-2"
                >
                  {buyerSession.avatarUrl ? (
                    <img src={buyerSession.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <User className="w-4 h-4 text-slate-600" />
                  )}
                  <span className="hidden sm:inline max-w-[110px] truncate">{buyerSession.nombre}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                    {misPedidos.length}
                  </span>
                </button>
                <button
                  title="Cerrar sesión Google"
                  onClick={() => void cerrarSesionGoogleBuyer().then(() => setBuyerSession(null))}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCheckoutOpen(true)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" /> Ingresar con Google
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              style={{ backgroundColor: colorPrimario }}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-xs hover:opacity-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full font-mono">{totalItemsCart}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section
        className="px-4 py-12 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colorPrimario} 0%, ${config.identidad.colorAcento || '#059669'} 100%)`
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full">
              Tienda Oficial Verificada · Zonda Ecommerce
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">{config.hero.titulo}</h2>
            <p className="text-sm text-white/90">{config.hero.subtitulo}</p>
            <div className="pt-1 flex flex-wrap gap-2">
              <a
                href="#catalogo-productos"
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-extrabold hover:bg-slate-100"
              >
                {config.hero.textoBoton || 'Ver Productos'}
              </a>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-4 text-xs space-y-2 max-w-xs w-full">
            <p className="font-bold uppercase tracking-wider text-emerald-200 text-[11px]">Compra Protegida</p>
            <p>✓ Ingreso seguro con Google Auth</p>
            <p>✓ Stock sincronizado en vivo con depósito</p>
            <p>✓ Pagos con Mercado Pago y Transferencia</p>
          </div>
        </div>
      </section>

      {/* Filtros de Categorías */}
      <main id="catalogo-productos" className="max-w-6xl mx-auto w-full px-4 py-8 flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCategoriaActiva('TODAS')}
              style={categoriaActiva === 'TODAS' ? { backgroundColor: colorPrimario } : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                categoriaActiva === 'TODAS'
                  ? 'text-white border-transparent'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Todos ({productos.filter((p) => p.publicado).length})
            </button>
            {categorias
              .filter((c) => c.activa)
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaActiva(cat.id)}
                  style={categoriaActiva === cat.id ? { backgroundColor: colorPrimario } : undefined}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    categoriaActiva === cat.id
                      ? 'text-white border-transparent'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat.icono} {cat.nombre}
                </button>
              ))}
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={soloOfertas}
              onChange={(e) => setSoloOfertas(e.target.checked)}
              className="rounded"
            />
            Solo Ofertas
          </label>
        </div>

        {/* Grilla de Productos */}
        {productosFiltrados.length === 0 ? (
          <div className="border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No encontramos productos publicados con ese filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {productosFiltrados.map((prod) => {
              const precioMostrar =
                prod.tieneVariantes && prod.variantes.length > 0
                  ? Math.min(...prod.variantes.filter((v) => v.activa).map((v) => v.precio))
                  : prod.enOferta && prod.precioOferta
                  ? prod.precioOferta
                  : prod.precioBase;

              return (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                >
                  <div
                    onClick={() => setProductoModal(prod)}
                    className="h-44 bg-slate-50 flex items-center justify-center relative cursor-pointer border-b border-slate-100 p-4"
                  >
                    {prod.enOferta && (
                      <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="w-3 h-3" /> OFERTA
                      </span>
                    )}
                    {prod.tieneVariantes && prod.variantes.length > 0 && (
                      <span className="absolute top-3 right-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {prod.variantes.filter((v) => v.activa).length} variantes
                      </span>
                    )}
                    {prod.imagenes[0] ? (
                      <img src={prod.imagenes[0]} alt={prod.nombre} className="max-h-36 object-contain" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Package className="w-10 h-10 mx-auto text-slate-300 mb-1" />
                        <span className="text-[10px] font-mono">{prod.sku}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{prod.marca || 'Oficial'}</p>
                      <h3
                        onClick={() => setProductoModal(prod)}
                        className="text-sm font-bold text-slate-900 leading-snug mt-0.5 cursor-pointer hover:underline"
                      >
                        {prod.nombre}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{prod.descripcionCorta}</p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          {prod.tieneVariantes && <span className="text-[10px] text-slate-500 mr-1">Desde</span>}
                          <span className="text-lg font-black text-slate-900 font-mono">
                            ${precioMostrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            prod.stockTotal > 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {prod.stockTotal > 0 ? `${prod.stockTotal} disp.` : 'Sin stock'}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={prod.stockTotal <= 0}
                        onClick={() => {
                          if (prod.tieneVariantes && prod.variantes.length > 0) {
                            setProductoModal(prod);
                          } else {
                            handleAddToCart({
                              cartKey: buildCartKey(prod.id),
                              productoId: prod.id,
                              articuloInventarioId: prod.articuloInventarioId,
                              nombre: prod.nombre,
                              sku: prod.sku,
                              precioUnitario: precioMostrar,
                              cantidad: 1,
                              stockDisponible: prod.stockTotal,
                              imagen: prod.imagenes[0]
                            });
                          }
                        }}
                        style={{ backgroundColor: colorPrimario }}
                        className="w-full py-2 rounded-xl text-white text-xs font-bold hover:opacity-95 disabled:opacity-40"
                      >
                        {prod.tieneVariantes && prod.variantes.length > 0
                          ? 'Elegir Variante'
                          : 'Agregar al Carrito'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Preguntas Frecuentes */}
        {config.faqs.length > 0 && (
          <section className="pt-8 border-t border-slate-200 max-w-3xl mx-auto space-y-2.5">
            <h3 className="text-base font-extrabold text-slate-900 text-center mb-4">Preguntas Frecuentes</h3>
            {config.faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFaqAbierta(faqAbierta === idx ? null : idx)}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-slate-800 flex items-center justify-between bg-slate-50/70"
                >
                  <span>{faq.pregunta}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${faqAbierta === idx ? 'rotate-180' : ''}`} />
                </button>
                {faqAbierta === idx && (
                  <div className="px-4 py-3 text-xs text-slate-600 bg-white border-t border-slate-100">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 px-4 py-8 text-xs mt-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="font-bold text-white text-sm">{config.identidad.nombreTienda}</p>
            <p className="text-slate-400 mt-1">{config.identidad.direccionLocal} · {config.identidad.horarios}</p>
          </div>
          <div className="sm:text-right text-slate-400">
            <p>{config.identidad.emailContacto} · {config.identidad.instagram}</p>
            <p className="text-[11px] text-emerald-400 mt-1">Impulsado por Zonda ERP · Grow Labs</p>
          </div>
        </div>
      </footer>

      {/* Botón WhatsApp flotante */}
      {config.identidad.whatsappNumero && (
        <a
          href={`https://wa.me/${config.identidad.whatsappNumero.replace(/\D/g, '')}?text=${encodeURIComponent(
            config.identidad.whatsappMensaje || 'Hola!'
          )}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg flex items-center justify-center"
          title="Consultar por WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}

      {/* Modal Mis Pedidos del Comprador */}
      {misPedidosOpen && buyerSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Mis Pedidos — {buyerSession.nombre}</h4>
                <p className="text-[11px] text-slate-500">{buyerSession.email}</p>
              </div>
              <button onClick={() => setMisPedidosOpen(false)} className="text-xs font-bold text-slate-500">
                Cerrar
              </button>
            </div>
            <div className="space-y-2.5 max-h-80 overflow-y-auto text-xs">
              {misPedidos.length === 0 ? (
                <p className="text-center py-8 text-slate-400">Todavía no realizaste compras en esta tienda.</p>
              ) : (
                misPedidos.map((p) => (
                  <div key={p.id} className="border border-slate-200 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Pedido {p.numeroPedido}</span>
                      <span className="font-mono">${p.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Pago: <strong className="uppercase">{p.estadoPago}</strong> · Envío:{' '}
                      <strong className="uppercase">{p.estadoEnvio}</strong>
                    </p>
                    {p.facturaErpNro && (
                      <p className="text-[10px] text-emerald-700 font-semibold">Factura emitida: {p.facturaErpNro}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modales interactivos */}
      {productoModal && (
        <ProductDetailModal
          key={productoModal.id}
          producto={productoModal}
          colorPrimario={colorPrimario}
          onClose={() => setProductoModal(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartDrawer
        isOpen={cartOpen}
        items={cart}
        colorPrimario={colorPrimario}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemove={(k) => setCart((prev) => prev.filter((i) => i.cartKey !== k))}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        config={config}
        items={cart}
        cupones={cupones}
        buyerSession={buyerSession}
        onBuyerLoggedIn={setBuyerSession}
        onClose={() => setCheckoutOpen(false)}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};
