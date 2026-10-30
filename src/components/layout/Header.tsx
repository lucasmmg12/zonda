import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Search, X, BookOpen, ArrowRight } from 'lucide-react';
import { EmpresaConfig } from '../../types/models';
import { ManualesCentroAyudaModal } from '../modals/ManualesCentroAyudaModal';
import { RoleAuthModal, getActiveOperator, OperadorProfile } from '../modals/RoleAuthModal';
import { useErp, flattenCuentasContables } from '../../context/ErpContext';
import type { ModuleKey } from './Sidebar';

interface HeaderProps {
  empresa: EmpresaConfig;
  activeModule: string;
}

export interface GlobalSearchResultItem {
  id: string;
  entityId: string;
  tipo:
    | 'CLIENTE'
    | 'PROVEEDOR'
    | 'ARTÍCULO'
    | 'FACTURA VENTA'
    | 'FACTURA COMPRA'
    | 'CHEQUE'
    | 'TESORERÍA'
    | 'CUENTA CONTABLE'
    | 'ASIENTO'
    | 'LEGAJO';
  titulo: string;
  sub: string;
  detalleExtra?: string;
  modulo: ModuleKey;
  queryHint?: string;
}

export const Header: React.FC<HeaderProps> = ({ empresa, activeModule }) => {
  const {
    lastSync,
    setActiveModule,
    clientes,
    proveedores,
    inventario,
    empleados,
    facturasVenta,
    facturasCompra,
    cheques,
    cuentasBancarias,
    planDeCuentas,
    asientosContables
  } = useErp();

  const [modalManualesOpen, setModalManualesOpen] = useState(false);
  const [modalRolesOpen, setModalRolesOpen] = useState(false);
  const [operadorActual, setOperadorActual] = useState<OperadorProfile>(getActiveOperator());

  const mapModuleToManualId = (mod: string): string => {
    const m = mod.toLowerCase();
    if (m.includes('cliente')) return 'clientes';
    if (m.includes('proveedor')) return 'proveedores';
    if (m.includes('tesorer')) return 'tesoreria';
    if (m.includes('contabil')) return 'contabilidad';
    if (m.includes('inventar')) return 'inventario';
    if (m.includes('sueldo')) return 'sueldos';
    if (m.includes('migrac')) return 'migracion';
    if (m.includes('config')) return 'arca';
    return 'dashboard';
  };

  // Buscador global 100% funcional con navegación por teclado y selección directa de entidad
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filtroTipoBusqueda, setFiltroTipoBusqueda] = useState<string>('TODOS');
  const [showNotif, setShowNotif] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleUserUpdate = () => {
      setOperadorActual(getActiveOperator());
    };
    window.addEventListener('zonda_usuarios_updated', handleUserUpdate);
    return () => {
      window.removeEventListener('zonda_usuarios_updated', handleUserUpdate);
    };
  }, []);

  // Atajo global Ctrl+K / Cmd+K para enfocar el buscador y cerrar al hacer clic afuera
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDownGlobal);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const cuentasPlanPlanas = useMemo(() => flattenCuentasContables(planDeCuentas), [planDeCuentas]);

  // Motor de indexación en tiempo real de todo el ERP
  const resultadosBusqueda = useMemo<GlobalSearchResultItem[]>(() => {
    const raw = globalQuery.trim().toLowerCase();
    const cleanDigits = raw.replace(/[^0-9]/g, '');
    const results: GlobalSearchResultItem[] = [];

    const matchTextOrCuit = (text: string, cuit?: string) => {
      if (!raw) return true;
      if (text.toLowerCase().includes(raw)) return true;
      if (cuit) {
        if (cuit.toLowerCase().includes(raw)) return true;
        if (cleanDigits.length >= 2 && cuit.replace(/[^0-9]/g, '').includes(cleanDigits)) return true;
      }
      return false;
    };

    // 1. Clientes
    clientes.forEach((c) => {
      if (
        matchTextOrCuit(`${c.razonSocial} ${c.nombre} ${c.domicilio} ${c.condicionIva}`, c.cuit)
      ) {
        results.push({
          id: `CLI-${c.id}`,
          entityId: c.id,
          tipo: 'CLIENTE',
          titulo: c.razonSocial,
          sub: `CUIT: ${c.cuit} · ${c.condicionIva} · Saldo a cobrar: $${c.saldo.toLocaleString('es-AR')}`,
          modulo: 'clientes',
          queryHint: c.razonSocial
        });
      }
    });

    // 2. Proveedores
    proveedores.forEach((p) => {
      if (
        matchTextOrCuit(
          `${p.razonSocial} ${p.nombre} ${p.cuentaGastoHabitual} ${p.condicionIva}`,
          p.cuit
        )
      ) {
        results.push({
          id: `PRV-${p.id}`,
          entityId: p.id,
          tipo: 'PROVEEDOR',
          titulo: p.razonSocial,
          sub: `CUIT: ${p.cuit} · Deuda pendiente: $${p.saldo.toLocaleString('es-AR')} (${p.facturasAdeudadas.length} fact.)`,
          modulo: 'proveedores',
          queryHint: p.razonSocial
        });
      }
    });

    // 3. Artículos de Inventario y Stock
    inventario.forEach((i) => {
      if (
        matchTextOrCuit(
          `${i.codigo} ${i.sku} ${i.descripcion} ${i.categoria} ${i.deposito}`
        )
      ) {
        results.push({
          id: `INV-${i.id}`,
          entityId: i.id,
          tipo: 'ARTÍCULO',
          titulo: `${i.codigo} · ${i.descripcion}`,
          sub: `Stock Disp.: ${i.disponible} u. · Costo: $${i.costoCalculado.toLocaleString('es-AR')} · Venta: $${i.precioVentaNeto.toLocaleString('es-AR')}`,
          modulo: 'inventario',
          queryHint: i.codigo
        });
      }
    });

    // 4. Facturas Adeudadas de Proveedores y Compras
    proveedores.forEach((p) => {
      p.facturasAdeudadas.forEach((f) => {
        if (
          raw &&
          matchTextOrCuit(
            `${f.tipo} ${f.nroComprobante} ${f.descripcion} ${p.razonSocial} ${f.medioPagoPactado || ''}`,
            p.cuit
          )
        ) {
          results.push({
            id: `FAC-PRV-${p.id}-${f.id}`,
            entityId: p.id,
            tipo: 'FACTURA COMPRA',
            titulo: `${f.tipo} ${f.nroComprobante} — ${p.razonSocial}`,
            sub: `Vence: ${f.fechaPago} · Saldo: $${f.saldo.toLocaleString('es-AR')} · ${f.descripcion}`,
            detalleExtra: f.id,
            modulo: 'proveedores',
            queryHint: p.razonSocial
          });
        }
      });
    });

    facturasCompra.forEach((fc) => {
      if (
        raw &&
        matchTextOrCuit(
          `${fc.tipo} ${fc.numero} ${fc.proveedorNombre} ${fc.cuentaGasto}`,
          fc.proveedorCuit
        )
      ) {
        const provMatch = proveedores.find(
          (p) => p.cuit === fc.proveedorCuit || p.razonSocial === fc.proveedorNombre
        );
        results.push({
          id: `FC-COMP-${fc.id}`,
          entityId: provMatch?.id || fc.id,
          tipo: 'FACTURA COMPRA',
          titulo: `${fc.tipo} ${fc.numero} — ${fc.proveedorNombre}`,
          sub: `Fecha: ${fc.fechaComprobante} · Total: $${fc.total.toLocaleString('es-AR')} (${fc.estadoPago})`,
          modulo: 'proveedores',
          queryHint: fc.proveedorNombre
        });
      }
    });

    // 5. Facturas de Venta Emitidas
    facturasVenta.forEach((fv) => {
      if (
        raw &&
        matchTextOrCuit(
          `${fv.tipo} ${fv.puntoVenta}-${fv.numero} ${fv.clienteNombre} ${fv.cae || ''}`,
          fv.clienteCuit
        )
      ) {
        const cliMatch = clientes.find(
          (c) => c.cuit === fv.clienteCuit || c.razonSocial === fv.clienteNombre
        );
        results.push({
          id: `FV-${fv.id}`,
          entityId: cliMatch?.id || fv.id,
          tipo: 'FACTURA VENTA',
          titulo: `${fv.tipo} ${fv.puntoVenta}-${fv.numero} — ${fv.clienteNombre}`,
          sub: `Total: $${fv.total.toLocaleString('es-AR')} · CAE: ${fv.cae || 'Aprobado'} · Vto: ${fv.fechaVencimiento}`,
          modulo: 'clientes',
          queryHint: fv.clienteNombre
        });
      }
    });

    // 6. Cheques en Cartera y Entregados a Proveedores
    cheques.forEach((ch) => {
      if (
        raw &&
        matchTextOrCuit(
          `cheque ${ch.numero} ${ch.bancoEmisor} ${ch.librador} ${ch.proveedorNombre || ''} ${ch.facturaNro || ''}`,
          ch.cuitLibrador
        )
      ) {
        results.push({
          id: `CHQ-${ch.id}`,
          entityId: ch.id,
          tipo: 'CHEQUE',
          titulo: `Cheque #${ch.numero} (${ch.bancoEmisor})`,
          sub: `Vto: ${ch.fechaPago} · $${ch.importe.toLocaleString('es-AR')} · ${ch.estado}${
            ch.proveedorNombre ? ` · ${ch.proveedorNombre}` : ''
          }`,
          modulo: 'tesoreria',
          queryHint: ch.numero
        });
      }
    });

    // 7. Cuentas de Tesorería / Bancos
    cuentasBancarias.forEach((cta) => {
      if (raw && matchTextOrCuit(`${cta.nombre} ${cta.banco} ${cta.tipoCuenta} ${cta.cbu || ''}`)) {
        results.push({
          id: `CTA-${cta.id}`,
          entityId: cta.id,
          tipo: 'TESORERÍA',
          titulo: `${cta.nombre} (${cta.banco})`,
          sub: `${cta.tipoCuenta} · Saldo Disponible: $${cta.saldoActual.toLocaleString('es-AR')}`,
          modulo: 'tesoreria',
          queryHint: cta.nombre
        });
      }
    });

    // 8. Plan de Cuentas Contables
    cuentasPlanPlanas.forEach((cc) => {
      if (raw && matchTextOrCuit(`${cc.codigo} ${cc.nombre} ${cc.tipo}`)) {
        const saldoCuenta = cc.saldoFinal ?? (cc.saldoDeudor - cc.saldoAcreedor);
        results.push({
          id: `CC-${cc.codigo}`,
          entityId: cc.codigo,
          tipo: 'CUENTA CONTABLE',
          titulo: `${cc.codigo} · ${cc.nombre}`,
          sub: `Rubro: ${cc.tipo} · Saldo: $${saldoCuenta.toLocaleString('es-AR')}`,
          modulo: 'contabilidad',
          queryHint: cc.codigo
        });
      }
    });

    // 9. Asientos Contables
    asientosContables.forEach((as) => {
      if (raw && matchTextOrCuit(`asiento ${as.numero} ${as.concepto} ${as.tipoOrigen}`)) {
        results.push({
          id: `AS-${as.numero}`,
          entityId: String(as.numero),
          tipo: 'ASIENTO',
          titulo: `Asiento N° ${as.numero} — ${as.concepto}`,
          sub: `Fecha: ${as.fecha} · Origen: ${as.tipoOrigen} · Total: $${as.totalDebe.toLocaleString('es-AR')}`,
          modulo: 'contabilidad',
          queryHint: String(as.numero)
        });
      }
    });

    // 10. Legajos / Empleados
    empleados.forEach((emp) => {
      if (matchTextOrCuit(`${emp.nombreCompleto} ${emp.categoria} ${emp.cct} ${emp.legajo}`, emp.cuil)) {
        results.push({
          id: `EMP-${emp.id}`,
          entityId: emp.id,
          tipo: 'LEGAJO',
          titulo: `${emp.legajo} · ${emp.nombreCompleto}`,
          sub: `CUIL: ${emp.cuil} · ${emp.categoria} (${emp.cct})`,
          modulo: 'sueldos',
          queryHint: emp.nombreCompleto
        });
      }
    });

    const filteredByType =
      filtroTipoBusqueda === 'TODOS'
        ? results
        : results.filter((r) => r.tipo === filtroTipoBusqueda);

    return filteredByType.slice(0, 14);
  }, [
    globalQuery,
    filtroTipoBusqueda,
    clientes,
    proveedores,
    inventario,
    facturasCompra,
    facturasVenta,
    cheques,
    cuentasBancarias,
    cuentasPlanPlanas,
    asientosContables,
    empleados
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [globalQuery, filtroTipoBusqueda]);

  const ejecutarSeleccionResultado = (item: GlobalSearchResultItem) => {
    try {
      sessionStorage.setItem('zonda_global_search_target', JSON.stringify(item));
    } catch {
      // ignore storage errors
    }
    setActiveModule(item.modulo);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('zonda_global_search_select', { detail: item }));
    }, 40);
    setSearchFocused(false);
    setGlobalQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        resultadosBusqueda.length > 0 ? (prev + 1) % resultadosBusqueda.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        resultadosBusqueda.length > 0
          ? (prev - 1 + resultadosBusqueda.length) % resultadosBusqueda.length
          : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resultadosBusqueda[selectedIndex]) {
        ejecutarSeleccionResultado(resultadosBusqueda[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setSearchFocused(false);
    }
  };

  const formatModuleLabel = (mod: string): string => {
    const map: Record<string, string> = {
      tablero: '01 · Tablero de Control',
      clientes: '02 · Clientes y Ventas',
      proveedores: '03 · Proveedores y Compras',
      tesoreria: '04 · Tesorería y Cheques',
      contabilidad: '05 · Contabilidad y Libros',
      inventario: '06 · Inventario y Stock',
      sueldos: '07 · Sueldos y Cargas',
      migracion: '08 · Centro de Migración',
      configuracion: '09 · Configuración Fiscal',
      usuarios: '10 · Usuarios y Accesos'
    };
    return map[mod] || mod.toUpperCase();
  };

  const getBadgeColorForType = (tipo: GlobalSearchResultItem['tipo']) => {
    switch (tipo) {
      case 'CLIENTE':
      case 'FACTURA VENTA':
        return 'bg-emerald-700 text-white';
      case 'PROVEEDOR':
      case 'FACTURA COMPRA':
        return 'bg-amber-700 text-white';
      case 'ARTÍCULO':
        return 'bg-[#064e3b] text-white';
      case 'CHEQUE':
      case 'TESORERÍA':
        return 'bg-indigo-700 text-white';
      case 'CUENTA CONTABLE':
      case 'ASIENTO':
        return 'bg-slate-800 text-white';
      default:
        return 'bg-teal-800 text-white';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-emerald-800/25 px-4 lg:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Izquierda: Módulo Activo y Datos Fiscales en una sola línea limpia */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="px-2.5 py-1 bg-[#064e3b] text-white font-semibold text-[11px] tracking-wide uppercase whitespace-nowrap border border-[#047857]">
          {formatModuleLabel(activeModule)}
        </span>

        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-emerald-800/20 whitespace-nowrap overflow-hidden">
          <span className="font-bold text-[#042f22] text-xs tracking-tight truncate">
            {empresa.razonSocial}
          </span>
          <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-[#064e3b] border border-emerald-700/25 font-semibold whitespace-nowrap">
            CUIT {empresa.cuit}
          </span>
        </div>
      </div>

      {/* Derecha: Buscador Global 100% Funcional + Manuales + Alertas + Operador */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Buscador Global Omnicanal */}
        <div ref={searchContainerRef} className="relative">
          <Search className="w-3.5 h-3.5 text-[#357a59] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={globalQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setGlobalQuery(e.target.value);
              setSearchFocused(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar CUIT, cliente, proveedor, factura, cheque o ítem..."
            className="h-8 pl-8 pr-7 text-xs bg-emerald-50/40 border border-emerald-800/25 focus:outline-none focus:border-[#064e3b] focus:bg-white w-48 sm:w-64 xl:w-80 transition-all placeholder:text-[#357a59]/75 font-medium text-[#042f22]"
          />
          {globalQuery ? (
            <button
              type="button"
              onClick={() => {
                setGlobalQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#357a59] hover:text-[#042f22]"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden xl:inline-block absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#357a59]/70 border border-emerald-800/20 px-1 bg-white pointer-events-none">
              Ctrl+K
            </span>
          )}

          {/* Panel Desplegable de Resultados en Vivo */}
          {searchFocused && (
            <div className="absolute right-0 mt-1.5 w-[360px] sm:w-[460px] bg-white border-2 border-[#064e3b] shadow-2xl z-50 text-xs overflow-hidden">
              {/* Filtros rápidos por categoría */}
              <div className="p-2 bg-emerald-50/70 border-b border-emerald-800/15 flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'TODOS', label: 'Todos' },
                  { id: 'CLIENTE', label: 'Clientes' },
                  { id: 'PROVEEDOR', label: 'Proveedores' },
                  { id: 'ARTÍCULO', label: 'Ítems / Stock' },
                  { id: 'FACTURA COMPRA', label: 'Facturas' },
                  { id: 'CHEQUE', label: 'Cheques' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroTipoBusqueda(f.id)}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${
                      filtroTipoBusqueda === f.id
                        ? 'bg-[#064e3b] text-white'
                        : 'bg-white text-[#042f22] border border-emerald-800/20 hover:bg-emerald-100/50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Lista de Resultados */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {resultadosBusqueda.length > 0 ? (
                  resultadosBusqueda.map((item, idx) => {
                    const isHighlighted = idx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => ejecutarSeleccionResultado(item)}
                        className={`w-full text-left p-2.5 flex items-center justify-between gap-2 transition-colors ${
                          isHighlighted ? 'bg-emerald-50/90' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`text-[9px] px-1.5 py-0.2 font-bold uppercase shrink-0 ${getBadgeColorForType(
                                item.tipo
                              )}`}
                            >
                              {item.tipo}
                            </span>
                            <span className="font-extrabold text-[#042f22] truncate text-xs">
                              {item.titulo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">{item.sub}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#064e3b] shrink-0">
                          <span>Ir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-5 text-center text-slate-500 text-xs">
                    No se encontraron registros para <strong>"{globalQuery}"</strong>.
                    <p className="text-[10px] text-slate-400 mt-1">
                      Probá buscando por CUIT, razón social, código de artículo, número de factura o cheque.
                    </p>
                  </div>
                )}
              </div>

              {/* Pie del buscador */}
              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>↑↓ Navegar · Enter para abrir registro directo</span>
                <span className="font-bold text-[#064e3b]">
                  {resultadosBusqueda.length} resultado(s)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Botón Manuales Compacto en 1 Línea */}
        <button
          onClick={() => setModalManualesOpen(true)}
          title="Abrir Manuales Paso a Paso e Instrucciones"
          className="h-8 px-3 border border-[#047857] bg-[#064e3b] hover:bg-[#047857] text-white text-[11px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span>Manuales</span>
        </button>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            title="Notificaciones de Auditoría y Base de Datos"
            className="h-8 w-8 flex items-center justify-center text-[#064e3b] hover:bg-emerald-50 border border-emerald-800/25 transition-colors relative"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 bg-[#16a34a] absolute top-1.5 right-1.5"></span>
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#064e3b] shadow-xl z-50 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-800/15 pb-1.5">
                <span className="font-bold text-[#042f22] uppercase">Centro de Alertas ERP</span>
                <button onClick={() => setShowNotif(false)} className="text-[#357a59] hover:text-[#042f22]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-[#064e3b] text-[11px]">
                <strong>Sincronización Activa:</strong> Última actualización a las {lastSync}.
              </div>
              <div className="p-2 bg-emerald-50/50 border border-emerald-200 text-[#065f46] text-[11px]">
                <strong>Vencimiento Próximo:</strong> F.931 Cargas Sociales ARCA y Facturas de Cuenta Corriente.
              </div>
            </div>
          )}
        </div>

        {/* Perfil Usuario Operador (Control de Acceso RBAC) */}
        <button
          onClick={() => setModalRolesOpen(true)}
          title="Cambiar Operador / Control de Roles y Permisos (RBAC)"
          className="h-8 flex items-center gap-2 pl-2 pr-2.5 border border-emerald-800/25 bg-emerald-50/30 hover:bg-emerald-50 transition-colors whitespace-nowrap"
        >
          <div className="w-5 h-5 bg-[#064e3b] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
            {operadorActual.rol.slice(0, 2).toUpperCase()}
          </div>
          <span className="hidden xl:inline text-[10px] font-bold text-[#042f22] tracking-wide uppercase whitespace-nowrap">
            {operadorActual.rol}
          </span>
        </button>
      </div>

      {/* Modal Centralizado de Manuales e Instrucciones */}
      <ManualesCentroAyudaModal
        isOpen={modalManualesOpen}
        onClose={() => setModalManualesOpen(false)}
        initialManualId={mapModuleToManualId(activeModule)}
      />

      {/* Modal de Control de Acceso y Roles (RBAC) */}
      <RoleAuthModal
        isOpen={modalRolesOpen}
        onClose={() => setModalRolesOpen(false)}
        operadorActual={operadorActual}
        onSelectOperador={(op) => setOperadorActual(op)}
      />
    </header>
  );
};
