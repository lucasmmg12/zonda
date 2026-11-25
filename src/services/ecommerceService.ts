import { supabase } from '../lib/supabase';
import type { ArticuloInventario } from '../types/models';
import type {
  EcommerceAtributo,
  EcommerceCartItem,
  EcommerceCategoria,
  EcommerceCompradorGoogle,
  EcommerceCupon,
  EcommercePedido,
  EcommerceProducto,
  EcommerceProductoVariante,
  EcommerceTenantState,
  EcommerceTiendaConfig
} from '../types/ecommerce';

const STORAGE_PREFIX = 'zonda_ecommerce_tenant_v1_';
const SLUG_INDEX_KEY = 'zonda_ecommerce_slug_index_v1';
const CART_PREFIX = 'zonda_ecommerce_cart_v1_';
const ECOMMERCE_SYNC_CHANNEL = 'zonda_ecommerce_sync_v1';

export function slugifyTienda(nombre: string): string {
  return (nombre || 'mi-tienda')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'mi-tienda';
}

/**
 * Genera el producto cartesiano de atributos estilo Tiendanube:
 * Ej: [{ nombre: "Talle", valores: ["S", "M"] }, { nombre: "Color", valores: ["Negro", "Blanco"] }]
 * => 4 variantes con SKU, combinación, precio base y stock inicial.
 */
export function generarMatrizVariantes(
  skuBase: string,
  precioBase: number,
  atributos: EcommerceAtributo[],
  variantesPrevias: EcommerceProductoVariante[] = []
): EcommerceProductoVariante[] {
  const validAttrs = atributos
    .map((a) => ({
      nombre: a.nombre.trim(),
      valores: a.valores.map((v) => v.trim()).filter(Boolean)
    }))
    .filter((a) => a.nombre.length > 0 && a.valores.length > 0);

  if (validAttrs.length === 0) return [];

  let combos: Record<string, string>[] = [{}];
  for (const attr of validAttrs) {
    const next: Record<string, string>[] = [];
    for (const c of combos) {
      for (const val of attr.valores) {
        next.push({ ...c, [attr.nombre]: val });
      }
    }
    combos = next;
  }

  return combos.map((combinacion, idx) => {
    const nombre = Object.values(combinacion).join(' / ');
    const slugParts = Object.values(combinacion)
      .map((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))
      .join('-');
    const existente = variantesPrevias.find((vp) => vp.nombre.toLowerCase() === nombre.toLowerCase());
    if (existente) {
      return { ...existente, combinacion, nombre };
    }
    return {
      id: `VAR-${Date.now()}-${idx}`,
      sku: `${skuBase || 'SKU'}-${slugParts || idx + 1}`,
      nombre,
      combinacion,
      precio: precioBase,
      stock: 10,
      activa: true
    };
  });
}

export function buildDefaultEcommerceState(
  tenantId: string,
  empresaNombre: string,
  inventarioErp: ArticuloInventario[] = []
): EcommerceTenantState {
  const slug = slugifyTienda(empresaNombre);
  const now = new Date().toISOString();

  const categorias: EcommerceCategoria[] = [
    { id: `CAT-${tenantId}-1`, tenantId, nombre: 'Destacados', icono: '⭐', orden: 1, activa: true },
    { id: `CAT-${tenantId}-2`, tenantId, nombre: 'Insumos y Materiales', icono: '📦', orden: 2, activa: true },
    { id: `CAT-${tenantId}-3`, tenantId, nombre: 'Equipamiento', icono: '🛠️', orden: 3, activa: true }
  ];

  const productos: EcommerceProducto[] = inventarioErp.slice(0, 6).map((art, i) => {
    const precioConIva = Number((art.precioVentaNeto * (1 + (art.alicuotaIva || 21) / 100)).toFixed(2));
    const tieneVariantes = i === 0;
    const atributos: EcommerceAtributo[] = tieneVariantes
      ? [
          { nombre: 'Presentación', valores: ['Estándar', 'Pack x5'] },
          { nombre: 'Calidad', valores: ['Profesional', 'Industrial'] }
        ]
      : [];
    const variantes: EcommerceProductoVariante[] = tieneVariantes
      ? generarMatrizVariantes(art.sku || art.codigo, precioConIva || 15000, atributos).map((v, vIdx) => ({
          ...v,
          precio: v.nombre.includes('Pack x5') ? Number(((precioConIva || 15000) * 4.5).toFixed(2)) : precioConIva || 15000,
          stock: Math.max(2, Math.floor((art.disponible || 20) / 4) + vIdx)
        }))
      : [];
    const stockTotal = tieneVariantes
      ? variantes.reduce((acc, v) => acc + (v.activa ? v.stock : 0), 0)
      : Math.max(0, art.disponible ?? art.stockActual ?? 10);

    return {
      id: `ECP-${art.id}`,
      tenantId,
      articuloInventarioId: art.id,
      sku: art.sku || art.codigo,
      nombre: art.descripcion,
      descripcionCorta: `${art.categoria || 'Catálogo Oficial'} · Stock sincronizado en vivo con Zonda ERP.`,
      descripcionLarga: `Producto oficial distribuido por ${empresaNombre}. Código interno ${art.codigo}. Facturación electrónica ARCA (A o B) automática y entrega garantizada.`,
      categoriaId: categorias[i % categorias.length].id,
      marca: empresaNombre.split(' ')[0] || 'Oficial',
      precioBase: precioConIva || 12500,
      enOferta: i === 1,
      precioOferta: i === 1 ? Number(((precioConIva || 12500) * 0.9).toFixed(2)) : undefined,
      stockTotal,
      imagenes: [],
      publicado: true,
      destacado: i < 3,
      tieneVariantes,
      atributos,
      variantes,
      createdAt: now,
      updatedAt: now
    };
  });

  const config: EcommerceTiendaConfig = {
    id: `TIENDA-${tenantId}`,
    tenantId,
    slug,
    activa: true,
    identidad: {
      nombreTienda: `${empresaNombre} Store`,
      slogan: 'Tienda Oficial · Stock en Tiempo Real y Facturación Automática',
      logoUrl: '/logogrow.png',
      colorPrimario: '#1b365d',
      colorAcento: '#059669',
      whatsappNumero: '5492644693547',
      whatsappMensaje: `Hola ${empresaNombre}! Quiero consultar por un producto de la tienda online.`,
      instagram: `@${slug.replace(/-/g, '')}`,
      emailContacto: `ventas@${slug.replace(/-/g, '')}.com.ar`,
      direccionLocal: 'San Juan, Argentina',
      horarios: 'Lun a Vie 8:30 a 18:00 · Sáb 9:00 a 13:00'
    },
    marquesina: {
      activa: true,
      mensajes: [
        '🚚 Envíos a todo el país y retiro en sucursal sin cargo',
        '💳 Pagá con Mercado Pago, Tarjetas o Transferencia Bancaria (10% OFF)',
        '🧾 Factura A o B automática vinculada a ARCA'
      ],
      bgColor: '#1b365d',
      textColor: '#ffffff'
    },
    hero: {
      titulo: `Bienvenido a ${empresaNombre} Store`,
      subtitulo: 'Comprá online con stock real garantizado, múltiples variantes y pago inmediato.',
      textoBoton: 'Explorar Catálogo',
      imagenFondoUrl: ''
    },
    pagos: {
      mercadoPagoActivo: true,
      mercadoPagoCuotasTexto: 'Hasta 6 cuotas con tarjetas o dinero en cuenta de Mercado Pago',
      transferenciaActiva: true,
      transferenciaCbu: '0720099120000004512345',
      transferenciaAlias: `${slug.toUpperCase().replace(/-/g, '.')}.VENTAS`,
      transferenciaTitular: empresaNombre,
      transferenciaDescuentoPct: 10,
      efectivoRetiroActivo: true,
      cuentaTesoreriaDestinoId: 'CTA-02'
    },
    envios: [
      {
        id: 'ENV-RETIRO',
        nombre: 'Retiro en Local / Sucursal',
        descripcion: 'Listo para retirar en el día tras confirmar el pago.',
        costo: 0,
        activo: true,
        tipo: 'retiro_local'
      },
      {
        id: 'ENV-LOCAL',
        nombre: 'Envío a Domicilio (Moto / Flete Local)',
        descripcion: 'Entrega en 24/48 hs hábiles.',
        costo: 4500,
        gratisDesde: 120000,
        activo: true,
        tipo: 'envio_domicilio'
      },
      {
        id: 'ENV-CORREO',
        nombre: 'Envío Nacional (Correo Argentino / Andreani)',
        descripcion: 'Despacho a todo el país con código de seguimiento.',
        costo: 8900,
        gratisDesde: 250000,
        activo: true,
        tipo: 'correo_nacional'
      }
    ],
    faqs: [
      {
        pregunta: '¿Necesito cuenta de Google para comprar?',
        respuesta: 'Sí, el ingreso con Google Auth protege tu compra y te permite consultar el estado de tus pedidos y facturas en cualquier momento.'
      },
      {
        pregunta: '¿Qué medios de pago aceptan?',
        respuesta: 'Aceptamos Mercado Pago (tarjetas de crédito, débito y saldo), Transferencia Bancaria con descuento y Efectivo al retirar.'
      },
      {
        pregunta: '¿Emiten Factura A o B?',
        respuesta: 'Sí, al completar tu DNI o CUIT en el checkout emitimos el comprobante electrónico automáticamente.'
      }
    ],
    updatedAt: now
  };

  const cupones: EcommerceCupon[] = [
    {
      id: `CUP-${tenantId}-1`,
      tenantId,
      codigo: 'BIENVENIDO10',
      tipo: 'porcentaje',
      valor: 10,
      minimoCompra: 10000,
      usosActuales: 0,
      usosMaximos: 500,
      activo: true
    }
  ];

  return {
    config,
    categorias,
    productos,
    pedidos: [],
    compradores: [],
    cupones
  };
}

function registerSlugMapping(slug: string, tenantId: string) {
  try {
    const raw = localStorage.getItem(SLUG_INDEX_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[slug.toLowerCase()] = tenantId;
    localStorage.setItem(SLUG_INDEX_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function resolveTenantIdBySlug(slug: string): string | null {
  try {
    const raw = localStorage.getItem(SLUG_INDEX_KEY);
    if (!raw) return null;
    const map: Record<string, string> = JSON.parse(raw);
    return map[slug.toLowerCase()] || null;
  } catch {
    return null;
  }
}

export function loadEcommerceState(
  tenantId: string,
  empresaNombre: string,
  inventarioErp: ArticuloInventario[] = []
): EcommerceTenantState {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tenantId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as EcommerceTenantState;
      if (parsed?.config?.slug) {
        registerSlugMapping(parsed.config.slug, tenantId);
      }
      return parsed;
    }
  } catch {
    // fallback to default
  }
  const initial = buildDefaultEcommerceState(tenantId, empresaNombre, inventarioErp);
  saveEcommerceState(tenantId, initial);
  return initial;
}

export function saveEcommerceState(tenantId: string, state: EcommerceTenantState): void {
  try {
    const normalized: EcommerceTenantState = {
      ...state,
      config: {
        ...state.config,
        tenantId,
        slug: slugifyTienda(state.config.slug || state.config.identidad.nombreTienda),
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem(`${STORAGE_PREFIX}${tenantId}`, JSON.stringify(normalized));
    registerSlugMapping(normalized.config.slug, tenantId);
    window.dispatchEvent(new CustomEvent('zonda_ecommerce_updated', { detail: { tenantId, state: normalized } }));

    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(ECOMMERCE_SYNC_CHANNEL);
      ch.postMessage({ type: 'ECOMMERCE_STATE_UPDATED', tenantId });
      ch.close();
    }

    // Persistencia asíncrona best-effort en Supabase (no bloquea la UI si las tablas aún no fueron migradas)
    void supabase
      .from('ecommerce_tiendas')
      .upsert(
        {
          tenant_id: tenantId,
          slug: normalized.config.slug,
          activa: normalized.config.activa,
          config: normalized.config,
          updated_at: normalized.config.updatedAt
        },
        { onConflict: 'tenant_id' }
      )
      .then(() => {}, () => {});
  } catch (err) {
    console.error('Error guardando estado Ecommerce:', err);
  }
}

export function loadCartForTenant(tenantId: string): EcommerceCartItem[] {
  try {
    const raw = localStorage.getItem(`${CART_PREFIX}${tenantId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCartForTenant(tenantId: string, items: EcommerceCartItem[]): void {
  try {
    localStorage.setItem(`${CART_PREFIX}${tenantId}`, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function buildCartKey(productoId: string, varianteId?: string): string {
  return varianteId ? `${productoId}__${varianteId}` : productoId;
}

export function descontarStockVariantesEnEstado(
  state: EcommerceTenantState,
  pedido: EcommercePedido
): EcommerceTenantState {
  const productosActualizados = state.productos.map((prod) => {
    const itemsDelProd = pedido.items.filter((i) => i.productoId === prod.id);
    if (itemsDelProd.length === 0) return prod;

    if (prod.tieneVariantes && prod.variantes.length > 0) {
      const nuevasVariantes = prod.variantes.map((v) => {
        const cantVendida = itemsDelProd
          .filter((i) => i.varianteId === v.id)
          .reduce((acc, i) => acc + i.cantidad, 0);
        return cantVendida > 0 ? { ...v, stock: Math.max(0, v.stock - cantVendida) } : v;
      });
      const nuevoStockTotal = nuevasVariantes.reduce((acc, v) => acc + (v.activa ? v.stock : 0), 0);
      return {
        ...prod,
        variantes: nuevasVariantes,
        stockTotal: nuevoStockTotal,
        updatedAt: new Date().toISOString()
      };
    }

    const totalVendido = itemsDelProd.reduce((acc, i) => acc + i.cantidad, 0);
    return {
      ...prod,
      stockTotal: Math.max(0, prod.stockTotal - totalVendido),
      updatedAt: new Date().toISOString()
    };
  });

  return {
    ...state,
    productos: productosActualizados
  };
}
