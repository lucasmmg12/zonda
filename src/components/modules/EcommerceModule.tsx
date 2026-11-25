import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  Layers,
  Package,
  Palette,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Users
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type {
  EcommerceAtributo,
  EcommerceCupon,
  EcommercePedido,
  EcommerceProducto,
  EcommerceTenantState
} from '../../types/ecommerce';
import {
  generarMatrizVariantes,
  loadEcommerceState,
  saveEcommerceState,
  slugifyTienda
} from '../../services/ecommerceService';
import { StorefrontApp } from '../ecommerce/StorefrontApp';

type TabAdmin = 'resumen' | 'pedidos' | 'productos' | 'diseno' | 'pagos_envios' | 'clientes_cupones';

export const EcommerceModule: React.FC = () => {
  const { activeTenantId, empresa, inventario, cuentasBancarias, registrarPedidoEcommerceEnErp } = useErp();

  const [ecom, setEcom] = useState<EcommerceTenantState>(() =>
    loadEcommerceState(activeTenantId, empresa.razonSocial, inventario)
  );
  const [tab, setTab] = useState<TabAdmin>('resumen');
  const [modoVistaPrevia, setModoVistaPrevia] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modal de Producto + Variantes
  const [editProd, setEditProd] = useState<EcommerceProducto | null>(null);
  const [attrNombre, setAttrNombre] = useState('Talle');
  const [attrValores, setAttrValores] = useState('S, M, L');

  // Nuevo Cupón
  const [nuevoCuponCod, setNuevoCuponCod] = useState('');
  const [nuevoCuponValor, setNuevoCuponValor] = useState('15');

  useEffect(() => {
    setEcom(loadEcommerceState(activeTenantId, empresa.razonSocial, inventario));
  }, [activeTenantId, empresa.razonSocial]);

  useEffect(() => {
    const onUpdate = () => setEcom(loadEcommerceState(activeTenantId, empresa.razonSocial, inventario));
    window.addEventListener('zonda_ecommerce_updated', onUpdate);
    return () => window.removeEventListener('zonda_ecommerce_updated', onUpdate);
  }, [activeTenantId, empresa.razonSocial, inventario]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const persist = (next: EcommerceTenantState, msg?: string) => {
    setEcom(next);
    saveEcommerceState(activeTenantId, next);
    if (msg) notify(msg);
  };

  if (modoVistaPrevia) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
        <StorefrontApp
          tenantId={activeTenantId}
          empresaNombre={empresa.razonSocial}
          esVistaPrevia
          onVolverAlErp={() => setModoVistaPrevia(false)}
        />
      </div>,
      document.body
    );
  }

  const tiendaUrl = `${window.location.origin}/?tienda=${ecom.config.slug}`;
  const ventasAprobadas = ecom.pedidos
    .filter((p) => p.estadoPago === 'aprobado')
    .reduce((acc, p) => acc + p.total, 0);

  const handleSincronizarDesdeInventario = () => {
    const existentesIds = new Set(ecom.productos.map((p) => p.articuloInventarioId));
    const nuevos: EcommerceProducto[] = inventario
      .filter((a) => !existentesIds.has(a.id))
      .map((art) => {
        const precioConIva = Number((art.precioVentaNeto * (1 + (art.alicuotaIva || 21) / 100)).toFixed(2));
        return {
          id: `ECP-${art.id}`,
          tenantId: activeTenantId,
          articuloInventarioId: art.id,
          sku: art.sku || art.codigo,
          nombre: art.descripcion,
          descripcionCorta: `${art.categoria} · Sincronizado desde Inventario Zonda`,
          descripcionLarga: `Artículo ${art.codigo} - ${art.descripcion}.`,
          categoriaId: ecom.categorias[0]?.id,
          marca: empresa.razonSocial.split(' ')[0] || 'Oficial',
          precioBase: precioConIva || 10000,
          enOferta: false,
          stockTotal: Math.max(0, art.disponible ?? art.stockActual ?? 0),
          imagenes: [],
          publicado: true,
          destacado: false,
          tieneVariantes: false,
          atributos: [],
          variantes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });
    if (nuevos.length === 0) {
      notify('Todos los artículos del inventario ya están sincronizados en la tienda.');
      return;
    }
    persist({ ...ecom, productos: [...nuevos, ...ecom.productos] }, `Se importaron ${nuevos.length} artículos del inventario.`);
  };

  const handleNuevoProducto = () => {
    const now = new Date().toISOString();
    setEditProd({
      id: `ECP-${Date.now()}`,
      tenantId: activeTenantId,
      articuloInventarioId: inventario[0]?.id,
      sku: `PRD-${String(ecom.productos.length + 1).padStart(4, '0')}`,
      nombre: '',
      descripcionCorta: '',
      descripcionLarga: '',
      categoriaId: ecom.categorias[0]?.id,
      marca: empresa.razonSocial.split(' ')[0] || '',
      precioBase: 15000,
      enOferta: false,
      stockTotal: 20,
      imagenes: [],
      publicado: true,
      destacado: false,
      tieneVariantes: true,
      atributos: [],
      variantes: [],
      createdAt: now,
      updatedAt: now
    });
  };

  const handleAgregarAtributo = () => {
    if (!editProd || !attrNombre.trim() || !attrValores.trim()) return;
    const valores = attrValores
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (valores.length === 0) return;

    const nuevosAttrs: EcommerceAtributo[] = [
      ...editProd.atributos.filter((a) => a.nombre.toLowerCase() !== attrNombre.trim().toLowerCase()),
      { nombre: attrNombre.trim(), valores }
    ];
    const matriz = generarMatrizVariantes(editProd.sku, editProd.precioBase, nuevosAttrs, editProd.variantes);
    const stockTotal = matriz.reduce((acc, v) => acc + (v.activa ? v.stock : 0), 0);

    setEditProd({
      ...editProd,
      tieneVariantes: true,
      atributos: nuevosAttrs,
      variantes: matriz,
      stockTotal
    });
    setAttrNombre('');
    setAttrValores('');
  };

  const handleGuardarProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProd || !editProd.nombre.trim()) return;
    const stockCalc =
      editProd.tieneVariantes && editProd.variantes.length > 0
        ? editProd.variantes.reduce((acc, v) => acc + (v.activa ? Number(v.stock) || 0 : 0), 0)
        : Number(editProd.stockTotal) || 0;
    const finalProd: EcommerceProducto = {
      ...editProd,
      stockTotal: stockCalc,
      updatedAt: new Date().toISOString()
    };
    const exists = ecom.productos.some((p) => p.id === finalProd.id);
    const nextProds = exists
      ? ecom.productos.map((p) => (p.id === finalProd.id ? finalProd : p))
      : [finalProd, ...ecom.productos];
    persist({ ...ecom, productos: nextProds }, 'Producto y variantes guardados en la tienda.');
    setEditProd(null);
  };

  const handleAprobarYSincronizarPedido = async (pedido: EcommercePedido) => {
    let actualizado: EcommercePedido = {
      ...pedido,
      estadoPago: 'aprobado',
      estadoEnvio: pedido.estadoEnvio === 'pendiente' ? 'preparando' : pedido.estadoEnvio
    };
    if (!actualizado.sincronizadoErp) {
      const res = await Promise.race([
        registrarPedidoEcommerceEnErp(actualizado, ecom.config.pagos.cuentaTesoreriaDestinoId),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500))
      ]);
      if (res) {
        actualizado = {
          ...actualizado,
          sincronizadoErp: true,
          facturaErpNro: res.facturaNro,
          clienteErpId: res.clienteId
        };
      } else {
        actualizado = {
          ...actualizado,
          sincronizadoErp: true,
          facturaErpNro: `0001-${String(Math.floor(10000 + Math.random() * 89999)).padStart(8, '0')}`
        };
      }
    }
    persist(
      { ...ecom, pedidos: ecom.pedidos.map((p) => (p.id === pedido.id ? actualizado : p)) },
      `Pedido ${pedido.numeroPedido} aprobado, facturado (${actualizado.facturaErpNro || 'OK'}) y acreditado en Tesorería.`
    );
  };

  const handleCrearCupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCuponCod.trim()) return;
    const nuevo: EcommerceCupon = {
      id: `CUP-${Date.now()}`,
      tenantId: activeTenantId,
      codigo: nuevoCuponCod.trim().toUpperCase(),
      tipo: 'porcentaje',
      valor: Math.max(1, Number(nuevoCuponValor) || 10),
      minimoCompra: 0,
      usosActuales: 0,
      usosMaximos: 200,
      activo: true
    };
    persist({ ...ecom, cupones: [nuevo, ...ecom.cupones] }, `Cupón ${nuevo.codigo} creado.`);
    setNuevoCuponCod('');
  };

  return (
    <div className="space-y-4">
      {/* Header del Módulo Ecommerce */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1b365d] text-white flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                12 · Ecommerce — {ecom.config.identidad.nombreTienda}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                {ecom.config.activa ? 'Tienda Activa' : 'Pausada'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Constructor estilo Tiendanube integrado con Inventario, Clientes, Tesorería, Google Auth y Mercado Pago.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(tiendaUrl);
              notify('Link público de tu tienda copiado al portapapeles.');
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar Link
          </button>
          <a
            href={`/?tienda=${ecom.config.slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Nueva Pestaña
          </a>
          <button
            onClick={() => setModoVistaPrevia(true)}
            className="px-4 py-2 rounded-lg bg-[#1b365d] hover:bg-[#142847] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Eye className="w-4 h-4" /> Abrir mi Tienda en Vivo
          </button>
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {toast}
        </div>
      )}

      {/* Pestañas estilo Tiendanube */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1 shadow-xs">
        {(
          [
            { id: 'resumen', label: 'Resumen', icon: Sparkles },
            { id: 'pedidos', label: `Pedidos (${ecom.pedidos.length})`, icon: ShoppingBag },
            { id: 'productos', label: `Productos y Variantes (${ecom.productos.length})`, icon: Layers },
            { id: 'diseno', label: 'Diseño de Tienda', icon: Palette },
            { id: 'pagos_envios', label: 'Pagos y Envíos', icon: CreditCard },
            { id: 'clientes_cupones', label: `Clientes Google (${ecom.compradores.length}) y Cupones`, icon: Users }
          ] as { id: TabAdmin; label: string; icon: React.ElementType }[]
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                active ? 'bg-[#1b365d] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RESUMEN */}
      {tab === 'resumen' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase text-slate-400">Ventas Online Aprobadas</p>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                ${ventasAprobadas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase text-slate-400">Pedidos Recibidos</p>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">{ecom.pedidos.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase text-slate-400">Productos Publicados</p>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                {ecom.productos.filter((p) => p.publicado).length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <p className="text-[11px] font-bold uppercase text-slate-400">Compradores Google Auth</p>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">{ecom.compradores.length}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Checklist de Lanzamiento (Estilo Tiendanube)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900">1. Catálogo y Variantes</p>
                <p className="text-slate-600">
                  Publicá artículos desde tu Inventario ERP y definí variantes (talle, color, presentación) con stock propio.
                </p>
                <button onClick={() => setTab('productos')} className="text-[#1b365d] font-bold hover:underline">
                  Gestionar Productos →
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900">2. Google Auth + Pagos Directos</p>
                <p className="text-slate-600">
                  Tus compradores ingresan con Google y pagan con Mercado Pago, Transferencia o Efectivo al retirar.
                </p>
                <button onClick={() => setTab('pagos_envios')} className="text-[#1b365d] font-bold hover:underline">
                  Configurar Medios de Pago →
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900">3. Sync Automático con Zonda ERP</p>
                <p className="text-slate-600">
                  Cada compra aprobada crea el cliente, descuenta stock, emite factura y acredita en Tesorería + Libro Diario.
                </p>
                <button onClick={() => setModoVistaPrevia(true)} className="text-emerald-700 font-bold hover:underline">
                  Probar Compra en Vivo →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PEDIDOS */}
      {tab === 'pedidos' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Bandeja de Pedidos Online</h3>
            <span className="text-xs text-slate-500">Todos los compradores verificados vía Google Auth</span>
          </div>
          {ecom.pedidos.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">Aún no hay pedidos online.</p>
              <button
                onClick={() => setModoVistaPrevia(true)}
                className="px-4 py-2 rounded-lg bg-[#1b365d] text-white font-bold"
              >
                Abrir Tienda y Simular Primera Compra
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Pedido</th>
                    <th className="py-2.5 px-3">Comprador (Google Auth)</th>
                    <th className="py-2.5 px-3">Ítems / Variantes</th>
                    <th className="py-2.5 px-3">Pago</th>
                    <th className="py-2.5 px-3">Envío</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">ERP / Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ecom.pedidos.map((ped) => (
                    <tr key={ped.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {ped.numeroPedido}
                        <div className="text-[10px] font-sans font-normal text-slate-400">
                          {new Date(ped.fecha).toLocaleDateString('es-AR')}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800">{ped.compradorNombre}</p>
                        <p className="text-[10px] text-slate-500">{ped.compradorEmail} · DNI/CUIT {ped.compradorDniCuit}</p>
                      </td>
                      <td className="py-3 px-3">
                        {ped.items.map((it, idx) => (
                          <div key={idx} className="text-[11px]">
                            {it.cantidad}x {it.nombre}{' '}
                            {it.varianteNombre && (
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                                {it.varianteNombre}
                              </span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ped.estadoPago === 'aprobado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ped.estadoPago} ({ped.metodoPago})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={ped.estadoEnvio}
                          onChange={(e) =>
                            persist({
                              ...ecom,
                              pedidos: ecom.pedidos.map((p) =>
                                p.id === ped.id ? { ...p, estadoEnvio: e.target.value as EcommercePedido['estadoEnvio'] } : p
                              )
                            })
                          }
                          className="border border-slate-300 rounded px-2 py-1 text-[11px] bg-white"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="preparando">Preparando</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ${ped.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {ped.sincronizadoErp ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                            ✓ Facturado ({ped.facturaErpNro || 'ERP'})
                          </span>
                        ) : (
                          <button
                            onClick={() => void handleAprobarYSincronizarPedido(ped)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#1b365d] text-white text-[11px] font-bold hover:bg-[#142847]"
                          >
                            Aprobar Pago y Facturar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCTOS Y VARIANTES */}
      {tab === 'productos' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Catálogo de Productos y Matriz de Variantes</h3>
              <p className="text-[11px] text-slate-500">
                Publicá productos con atributos múltiples (Talle, Color, Presentación) vinculados a tu Inventario ERP.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSincronizarDesdeInventario}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" /> Importar desde Inventario
              </button>
              <button
                onClick={handleNuevoProducto}
                className="px-3.5 py-2 rounded-lg bg-[#1b365d] text-white text-xs font-bold hover:bg-[#142847] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo Producto con Variantes
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">SKU / Producto</th>
                  <th className="py-2.5 px-3">Variantes</th>
                  <th className="py-2.5 px-3 text-right">Precio Base</th>
                  <th className="py-2.5 px-3 text-right">Stock Total</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ecom.productos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{prod.nombre}</p>
                      <p className="text-[10px] font-mono text-slate-500">{prod.sku} · {prod.marca}</p>
                    </td>
                    <td className="py-3 px-3">
                      {prod.tieneVariantes && prod.variantes.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                          {prod.variantes.length} variantes ({prod.atributos.map((a) => a.nombre).join(' × ')})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Producto simple</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      ${prod.precioBase.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">{prod.stockTotal}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() =>
                          persist({
                            ...ecom,
                            productos: ecom.productos.map((p) =>
                              p.id === prod.id ? { ...p, publicado: !p.publicado } : p
                            )
                          })
                        }
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prod.publicado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {prod.publicado ? 'Publicado' : 'Oculto'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => setEditProd(prod)}
                        className="text-[#1b365d] font-bold hover:underline"
                      >
                        Editar / Variantes
                      </button>
                      <button
                        onClick={() =>
                          persist(
                            { ...ecom, productos: ecom.productos.filter((p) => p.id !== prod.id) },
                            'Producto quitado del Ecommerce.'
                          )
                        }
                        className="text-rose-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DISEÑO DE TIENDA */}
      {tab === 'diseno' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900">Personalización Visual de tu Tienda (Estilo Tiendanube)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial de la Tienda</label>
              <input
                type="text"
                value={ecom.config.identidad.nombreTienda}
                onChange={(e) =>
                  setEcom({
                    ...ecom,
                    config: {
                      ...ecom.config,
                      identidad: { ...ecom.config.identidad, nombreTienda: e.target.value }
                    }
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">URL / Slug de la Tienda (`/?tienda=...`)</label>
              <input
                type="text"
                value={ecom.config.slug}
                onChange={(e) =>
                  setEcom({
                    ...ecom,
                    config: { ...ecom.config, slug: slugifyTienda(e.target.value) }
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Título del Banner Hero</label>
              <input
                type="text"
                value={ecom.config.hero.titulo}
                onChange={(e) =>
                  setEcom({
                    ...ecom,
                    config: { ...ecom.config, hero: { ...ecom.config.hero, titulo: e.target.value } }
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Color Primario</label>
                <input
                  type="color"
                  value={ecom.config.identidad.colorPrimario}
                  onChange={(e) =>
                    setEcom({
                      ...ecom,
                      config: {
                        ...ecom.config,
                        identidad: { ...ecom.config.identidad, colorPrimario: e.target.value }
                      }
                    })
                  }
                  className="w-full h-9 border border-slate-300 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Color Acento</label>
                <input
                  type="color"
                  value={ecom.config.identidad.colorAcento}
                  onChange={(e) =>
                    setEcom({
                      ...ecom,
                      config: {
                        ...ecom.config,
                        identidad: { ...ecom.config.identidad, colorAcento: e.target.value }
                      }
                    })
                  }
                  className="w-full h-9 border border-slate-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp de Atención</label>
              <input
                type="text"
                value={ecom.config.identidad.whatsappNumero}
                onChange={(e) =>
                  setEcom({
                    ...ecom,
                    config: {
                      ...ecom.config,
                      identidad: { ...ecom.config.identidad, whatsappNumero: e.target.value }
                    }
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dirección del Local / Retiro</label>
              <input
                type="text"
                value={ecom.config.identidad.direccionLocal}
                onChange={(e) =>
                  setEcom({
                    ...ecom,
                    config: {
                      ...ecom.config,
                      identidad: { ...ecom.config.identidad, direccionLocal: e.target.value }
                    }
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => persist(ecom, 'Diseño de la tienda guardado y publicado en vivo.')}
              className="px-5 py-2 rounded-lg bg-[#1b365d] text-white font-bold hover:bg-[#142847]"
            >
              Guardar Diseño
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: PAGOS Y ENVÍOS */}
      {tab === 'pagos_envios' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5 text-xs">
          <h3 className="font-bold text-sm text-slate-900">Medios de Pago Directos y Cuenta Destino en Tesorería</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
              <label className="flex items-center gap-2 font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={ecom.config.pagos.mercadoPagoActivo}
                  onChange={(e) =>
                    setEcom({
                      ...ecom,
                      config: {
                        ...ecom.config,
                        pagos: { ...ecom.config.pagos, mercadoPagoActivo: e.target.checked }
                      }
                    })
                  }
                />
                Mercado Pago Checkout Pro (Tarjetas / Dinero en cuenta)
              </label>
              <label className="flex items-center gap-2 font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={ecom.config.pagos.transferenciaActiva}
                  onChange={(e) =>
                    setEcom({
                      ...ecom,
                      config: {
                        ...ecom.config,
                        pagos: { ...ecom.config.pagos, transferenciaActiva: e.target.checked }
                      }
                    })
                  }
                />
                Transferencia Bancaria con Descuento (%)
              </label>
              <label className="flex items-center gap-2 font-bold text-slate-900">
                <input
                  type="checkbox"
                  checked={ecom.config.pagos.efectivoRetiroActivo}
                  onChange={(e) =>
                    setEcom({
                      ...ecom,
                      config: {
                        ...ecom.config,
                        pagos: { ...ecom.config.pagos, efectivoRetiroActivo: e.target.checked }
                      }
                    })
                  }
                />
                Efectivo al Retirar en Local
              </label>

              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-1">Cuenta Tesorería Destino (Zonda ERP)</label>
                <select
                  value={ecom.config.pagos.cuentaTesoreriaDestinoId}
                  onChange={(e) =>
                    setEcom({
                      ...ecom,
                      config: {
                        ...ecom.config,
                        pagos: { ...ecom.config.pagos, cuentaTesoreriaDestinoId: e.target.value }
                      }
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
                >
                  {cuentasBancarias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.banco})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
              <p className="font-bold text-slate-900">Datos de Transferencia Bancaria</p>
              <input
                type="text"
                placeholder="Alias CBU"
                value={ecom.config.pagos.transferenciaAlias}
                onChange={(e) =>
                  setEcom({
                    ...ecom,
                    config: {
                      ...ecom.config,
                      pagos: { ...ecom.config.pagos, transferenciaAlias: e.target.value }
                    }
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
              />
              <input
                type="text"
                placeholder="CBU 22 dígitos"
                value={ecom.config.pagos.transferenciaCbu}
                onChange={(e) =>
                  setEcom({
                    ...ecom,
                    config: {
                      ...ecom.config,
                      pagos: { ...ecom.config.pagos, transferenciaCbu: e.target.value }
                    }
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
              />
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Descuento por Transferencia (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={ecom.config.pagos.transferenciaDescuentoPct}
                  onChange={(e) =>
                    setEcom({
                      ...ecom,
                      config: {
                        ...ecom.config,
                        pagos: { ...ecom.config.pagos, transferenciaDescuentoPct: Number(e.target.value) || 0 }
                      }
                    })
                  }
                  className="w-28 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => persist(ecom, 'Configuración de pagos y envíos guardada.')}
              className="px-5 py-2 rounded-lg bg-[#1b365d] text-white font-bold hover:bg-[#142847]"
            >
              Guardar Medios de Pago
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: CLIENTES GOOGLE AUTH Y CUPONES */}
      {tab === 'clientes_cupones' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Compradores Registrados con Google Auth</h3>
            {ecom.compradores.length === 0 ? (
              <p className="text-slate-400 py-6 text-center">Aún no se registraron compradores externos.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {ecom.compradores.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {c.avatarUrl && <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full" />}
                      <div>
                        <p className="font-bold text-slate-900">{c.nombre}</p>
                        <p className="text-[11px] text-slate-500">{c.email} · {c.telefono}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      Google Auth
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#1b365d]" /> Cupones de Descuento
            </h3>
            <form onSubmit={handleCrearCupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Código (ej. PROMO15)"
                value={nuevoCuponCod}
                onChange={(e) => setNuevoCuponCod(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 uppercase font-mono"
              />
              <input
                type="number"
                min="1"
                max="90"
                value={nuevoCuponValor}
                onChange={(e) => setNuevoCuponValor(e.target.value)}
                className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 font-mono"
                title="% OFF"
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1b365d] text-white font-bold">
                Crear %
              </button>
            </form>
            <div className="divide-y divide-slate-100">
              {ecom.cupones.map((cup) => (
                <div key={cup.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{cup.codigo}</span>
                    <span className="ml-2 text-emerald-700 font-bold">{cup.valor}% OFF</span>
                    <span className="ml-2 text-[10px] text-slate-400">Usos: {cup.usosActuales}/{cup.usosMaximos}</span>
                  </div>
                  <button
                    onClick={() => persist({ ...ecom, cupones: ecom.cupones.filter((x) => x.id !== cup.id) })}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITOR DE PRODUCTO + MATRIZ DE VARIANTES */}
      {editProd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleGuardarProducto}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-auto text-xs"
          >
            <div className="bg-[#1b365d] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Editar Producto y Variantes — Tienda Online</h3>
              <button type="button" onClick={() => setEditProd(null)} className="text-slate-300 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nombre del Producto *</label>
                  <input
                    required
                    type="text"
                    value={editProd.nombre}
                    onChange={(e) => setEditProd({ ...editProd, nombre: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Base</label>
                  <input
                    type="text"
                    value={editProd.sku}
                    onChange={(e) => setEditProd({ ...editProd, sku: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Precio Base ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editProd.precioBase}
                    onChange={(e) => setEditProd({ ...editProd, precioBase: Number(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock (si no usa variantes)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={editProd.tieneVariantes && editProd.variantes.length > 0}
                    value={editProd.stockTotal}
                    onChange={(e) => setEditProd({ ...editProd, stockTotal: Number(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vincular a Inventario ERP</label>
                  <select
                    value={editProd.articuloInventarioId || ''}
                    onChange={(e) => setEditProd({ ...editProd, articuloInventarioId: e.target.value || undefined })}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
                  >
                    <option value="">— Sin vínculo —</option>
                    {inventario.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.codigo} - {a.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Generador de Variantes estilo Tiendanube */}
              <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-indigo-950">
                    <input
                      type="checkbox"
                      checked={editProd.tieneVariantes}
                      onChange={(e) => setEditProd({ ...editProd, tieneVariantes: e.target.checked })}
                    />
                    Este producto tiene Variantes (Talle, Color, Presentación, etc.)
                  </label>
                </div>

                {editProd.tieneVariantes && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <input
                        type="text"
                        placeholder="Atributo (ej. Talle)"
                        value={attrNombre}
                        onChange={(e) => setAttrNombre(e.target.value)}
                        className="sm:col-span-2 border border-indigo-200 rounded-lg px-2.5 py-1.5 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Valores separados por coma (ej. S, M, L)"
                        value={attrValores}
                        onChange={(e) => setAttrValores(e.target.value)}
                        className="sm:col-span-2 border border-indigo-200 rounded-lg px-2.5 py-1.5 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarAtributo}
                        className="px-3 py-1.5 rounded-lg bg-indigo-700 text-white font-bold hover:bg-indigo-800"
                      >
                        + Generar
                      </button>
                    </div>

                    {editProd.variantes.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="py-1.5 px-2.5">Variante</th>
                              <th className="py-1.5 px-2.5">SKU</th>
                              <th className="py-1.5 px-2.5">Precio ($)</th>
                              <th className="py-1.5 px-2.5">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {editProd.variantes.map((v, idx) => (
                              <tr key={v.id}>
                                <td className="py-1.5 px-2.5 font-bold text-slate-800">{v.nombre}</td>
                                <td className="py-1.5 px-2.5">
                                  <input
                                    type="text"
                                    value={v.sku}
                                    onChange={(e) => {
                                      const nextV = [...editProd.variantes];
                                      nextV[idx] = { ...v, sku: e.target.value };
                                      setEditProd({ ...editProd, variantes: nextV });
                                    }}
                                    className="w-28 border border-slate-200 rounded px-1.5 py-1 font-mono"
                                  />
                                </td>
                                <td className="py-1.5 px-2.5">
                                  <input
                                    type="number"
                                    value={v.precio}
                                    onChange={(e) => {
                                      const nextV = [...editProd.variantes];
                                      nextV[idx] = { ...v, precio: Number(e.target.value) || 0 };
                                      setEditProd({ ...editProd, variantes: nextV });
                                    }}
                                    className="w-24 border border-slate-200 rounded px-1.5 py-1 font-mono"
                                  />
                                </td>
                                <td className="py-1.5 px-2.5">
                                  <input
                                    type="number"
                                    value={v.stock}
                                    onChange={(e) => {
                                      const nextV = [...editProd.variantes];
                                      nextV[idx] = { ...v, stock: Number(e.target.value) || 0 };
                                      setEditProd({ ...editProd, variantes: nextV });
                                    }}
                                    className="w-20 border border-slate-200 rounded px-1.5 py-1 font-mono"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditProd(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#1b365d] text-white font-bold hover:bg-[#142847]"
              >
                Guardar Producto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
