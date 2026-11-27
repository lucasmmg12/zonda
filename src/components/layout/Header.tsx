import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Search, X, BookOpen, ArrowRight, FileDown, Cloud, Building2, Lock, Unlock, UserCheck, GraduationCap, Radio, ChevronDown, CreditCard, LogOut, Globe, HelpCircle } from 'lucide-react';
import { EmpresaConfig } from '../../types/models';
import { ManualesCentroAyudaModal } from '../modals/ManualesCentroAyudaModal';
import { RoleAuthModal, getActiveOperator, OperadorProfile } from '../modals/RoleAuthModal';
import { TutorialInteractivoModal } from '../modals/TutorialInteractivoModal';
import { SyncComunicacionesModal } from '../modals/SyncComunicacionesModal';
import { getUsuariosList } from '../../services/usuariosRbacService';
import { useErp, flattenCuentasContables } from '../../context/ErpContext';
import type { ModuleKey } from './Sidebar';

interface HeaderProps {
  empresa: EmpresaConfig;
  activeModule: string;
  etiquetaSuscripcion?: string;
  esTrialVencido?: boolean;
  onOpenSuscripcion?: () => void;
  onIrWebPublica?: () => void;
  onCerrarSesion?: () => void;
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
    | 'LEGAJO'
    | 'USUARIO';
  titulo: string;
  sub: string;
  detalleExtra?: string;
  modulo: ModuleKey;
  queryHint?: string;
}

export const Header: React.FC<HeaderProps> = ({
  empresa,
  activeModule,
  etiquetaSuscripcion,
  esTrialVencido = false,
  onOpenSuscripcion,
  onIrWebPublica,
  onCerrarSesion
}) => {
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
    asientosContables,
    tenants,
    activeTenantId,
    activeTenant,
    actualizarAutorizacionZondaCloud
  } = useErp();

  const [modalManualesOpen, setModalManualesOpen] = useState(false);
  const [modalRolesOpen, setModalRolesOpen] = useState(false);
  const [modalSyncOpen, setModalSyncOpen] = useState(false);
  const [modalTutorialOpen, setModalTutorialOpen] = useState<boolean>(false);
  const [menuAyudaOpen, setMenuAyudaOpen] = useState(false);
  const [menuUsuarioOpen, setMenuUsuarioOpen] = useState(false);
  const [operadorActual, setOperadorActual] = useState<OperadorProfile>(getActiveOperator());

  const mapModuleToManualId = (mod: string): string => {
    const m = mod.toLowerCase();
    if (m.includes('zondacloud') || m.includes('cloud')) return 'zondacloud';
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

    // 11. Usuarios y Roles RBAC (Módulo 10)
    getUsuariosList().forEach((usr) => {
      if (
        raw &&
        matchTextOrCuit(
          `usuario ${usr.id} ${usr.nombre} ${usr.rol} ${usr.email} ${usr.sector || ''}`,
          usr.cuil
        )
      ) {
        results.push({
          id: `USR-${usr.id}`,
          entityId: usr.id,
          tipo: 'USUARIO',
          titulo: `${usr.id} · ${usr.nombre} (${usr.rol})`,
          sub: `${usr.email} · ${usr.modulosPermitidos.length}/10 módulos · ${usr.activo ? 'ACTIVO' : 'SUSPENDIDO'}`,
          modulo: 'usuarios',
          queryHint: usr.nombre
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
      usuarios: '10 · Usuarios y Accesos',
      zondacloud: '11 · Zonda Cloud (ARCA)',
      ecommerce: '12 · Ecommerce (Tienda)'
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
    <header className="h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 lg:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Izquierda: Breadcrumb estilo Grow Labs Suite + Empresa Activa */}
      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden relative">
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap shrink-0">
          <span className="text-slate-400 font-medium">
            {operadorActual.esCuentaZondaCloud ? 'Zonda Cloud' : 'Workspace'}
          </span>
          <span className="text-slate-300">›</span>
          <span className="font-bold text-slate-900">
            {formatModuleLabel(activeModule).replace(/^\d+\s*·\s*/, '')}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 pl-2.5 border-l border-slate-200 whitespace-nowrap min-w-0">
          {operadorActual.esCuentaZondaCloud ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
              <Cloud className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                {tenants.filter((t) => t.autorizacionZondaCloud.autorizado).length}/{tenants.length} Empresas Autorizadas
              </span>
            </div>
          ) : (
            <>
              <div
                title={`${empresa.razonSocial} · CUIT ${empresa.cuit}`}
                className="hidden min-[1680px]:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 text-slate-700 shrink-0"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[150px]">
                  {empresa.razonSocial}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nuevoEstado = !activeTenant?.autorizacionZondaCloud.autorizado;
                  actualizarAutorizacionZondaCloud(
                    activeTenantId,
                    {
                      autorizado: nuevoEstado,
                      fechaAutorizacion: nuevoEstado
                        ? new Date().toISOString().slice(0, 16).replace('T', ' ')
                        : activeTenant?.autorizacionZondaCloud.fechaAutorizacion || ''
                    },
                    {
                      actor: `${operadorActual.nombre} (${empresa.razonSocial})`,
                      accion: nuevoEstado
                        ? 'ACEPTACIÓN DE GESTIÓN DESDE ZONDA CLOUD'
                        : 'REVOCACIÓN DE ACCESO A ZONDA CLOUD',
                      detalle: nuevoEstado
                        ? 'El usuario aceptó que Zonda Cloud gestione sus Compras, Ventas, Impuestos y Balances ARCA.'
                        : 'El usuario revocó el permiso de Zonda Cloud sobre su empresa.'
                    }
                  );
                }}
                title="Aceptar o revocar que Zonda Cloud gestione tus impuestos ARCA"
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                  activeTenant?.autorizacionZondaCloud.autorizado
                    ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {activeTenant?.autorizacionZondaCloud.autorizado ? (
                  <>
                    <Unlock className="w-3 h-3 shrink-0" />
                    <span>Cloud Activo</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>Activar Cloud</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Derecha: Buscador Global Pill + Acciones Limpias + Operador */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Buscador Global Omnicanal */}
        <div ref={searchContainerRef} className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            placeholder="Buscar cliente o módulo..."
            className="h-8 pl-8 pr-14 text-xs rounded-xl bg-slate-100/80 border border-slate-200/80 focus:outline-none focus:border-teal-500 focus:bg-white w-44 sm:w-52 xl:w-60 transition-all placeholder:text-slate-400 font-medium text-slate-800"
          />
          {globalQuery ? (
            <button
              type="button"
              onClick={() => {
                setGlobalQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 border border-slate-200/90 rounded-md px-1.5 py-0.5 bg-white pointer-events-none">
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

        {/* Píldora limpia de Prueba Gratuita 30 Días / Suscripción $20.000 */}
        {onOpenSuscripcion && (
          <button
            type="button"
            onClick={onOpenSuscripcion}
            title="Ver estado de tus 30 días gratis y suscripción Mercado Pago ($20.000/mes)"
            className={`hidden md:flex h-8 px-3 rounded-xl text-[11px] font-semibold items-center gap-1.5 transition-colors whitespace-nowrap ${
              esTrialVencido
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-[#eff3fd] hover:bg-[#dfe8fc] text-[#3563e9] border border-[#3563e9]/20'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>{etiquetaSuscripcion || 'Prueba Gratis · 30 días'}</span>
          </button>
        )}

        {/* Menú desplegable único de Ayuda y Recursos ("Menos es Más") */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuAyudaOpen(!menuAyudaOpen);
              setMenuUsuarioOpen(false);
              setShowNotif(false);
            }}
            className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Ayuda</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {menuAyudaOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMenuAyudaOpen(false);
                  setModalTutorialOpen(true);
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium text-left"
              >
                <GraduationCap className="w-4 h-4 text-[#3563e9]" />
                <span>Tutorial interactivo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuAyudaOpen(false);
                  setModalManualesOpen(true);
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium text-left"
              >
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>Manuales del módulo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuAyudaOpen(false);
                  setModalSyncOpen(true);
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium text-left"
              >
                <Radio className="w-4 h-4 text-emerald-600" />
                <span>Estado de sincronización</span>
              </button>
              <a
                href="/DOSSIER_COMERCIAL_ZONDA_ERP.pdf"
                download="DOSSIER_COMERCIAL_ZONDA_ERP.pdf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuAyudaOpen(false)}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium"
              >
                <FileDown className="w-4 h-4 text-slate-500" />
                <span>Descargar Dossier PDF</span>
              </a>
              {onIrWebPublica && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuAyudaOpen(false);
                    onIrWebPublica();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium text-left border-t border-slate-100 mt-1 pt-2"
                >
                  <Globe className="w-4 h-4 text-[#3563e9]" />
                  <span>Ver Sitio Web Público</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotif(!showNotif);
              setMenuAyudaOpen(false);
              setMenuUsuarioOpen(false);
            }}
            title="Notificaciones"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors relative"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 absolute top-1.5 right-1.5"></span>
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Notificaciones</span>
                <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 text-[11px]">
                <strong>Sincronizado:</strong> Última actualización a las {lastSync}.
              </div>
              <div className="p-2.5 rounded-xl bg-teal-50/70 text-teal-800 text-[11px]">
                <strong>Agenda Fiscal:</strong> Revisá tus próximos vencimientos en Configuración.
              </div>
            </div>
          )}
        </div>

        {/* Menú de Perfil / Sesión */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuUsuarioOpen(!menuUsuarioOpen);
              setMenuAyudaOpen(false);
              setShowNotif(false);
            }}
            className="h-8 flex items-center gap-2 pl-2 pr-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <div className="w-5 h-5 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              <UserCheck className="w-3 h-3 text-teal-400" />
            </div>
            <span className="hidden lg:inline text-xs font-semibold text-slate-800 max-w-[140px] truncate">
              {operadorActual.esCuentaZondaCloud
                ? 'Zonda Cloud'
                : operadorActual.nombre.split('(')[0].trim()}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {menuUsuarioOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="font-bold text-slate-900 truncate">
                  {operadorActual.nombre.split('(')[0].trim()}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{operadorActual.email}</div>
              </div>
              {onOpenSuscripcion && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuUsuarioOpen(false);
                    onOpenSuscripcion();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium text-left"
                >
                  <CreditCard className="w-4 h-4 text-[#3563e9]" />
                  <span>Suscripción y Dominio Email</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuUsuarioOpen(false);
                  setModalRolesOpen(true);
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium text-left"
              >
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>Cambiar perfil / operador</span>
              </button>
              {onCerrarSesion && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuUsuarioOpen(false);
                    onCerrarSesion();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-rose-50 flex items-center gap-2.5 text-rose-600 font-semibold text-left border-t border-slate-100 mt-1 pt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              )}
            </div>
          )}
        </div>
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
        onSelectOperador={(op) => {
          setOperadorActual(op);
        }}
      />

      {/* Modal de Tutorial Interactivo al Iniciar Sesión con Imágenes */}
      <TutorialInteractivoModal
        isOpen={modalTutorialOpen}
        onClose={() => setModalTutorialOpen(false)}
      />

      {/* Modal Monitor de Comunicaciones y Sincronización Omnicanal */}
      <SyncComunicacionesModal
        isOpen={modalSyncOpen}
        onClose={() => setModalSyncOpen(false)}
      />
    </header>
  );
};
