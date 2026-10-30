import React, { useState, useEffect } from 'react';
import { Bell, Search, X, BookOpen } from 'lucide-react';
import { EmpresaConfig } from '../../types/models';
import { ManualesCentroAyudaModal } from '../modals/ManualesCentroAyudaModal';
import { RoleAuthModal, getActiveOperator, OperadorProfile } from '../modals/RoleAuthModal';
import { useErp } from '../../context/ErpContext';
import type { ModuleKey } from './Sidebar';

interface HeaderProps {
  empresa: EmpresaConfig;
  activeModule: string;
}

export const Header: React.FC<HeaderProps> = ({ empresa, activeModule }) => {
  const {
    lastSync,
    setActiveModule,
    clientes,
    proveedores,
    inventario,
    empleados
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

  // Buscador global interactivo
  const [globalQuery, setGlobalQuery] = useState('');
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const handleUserUpdate = () => {
      setOperadorActual(getActiveOperator());
    };

    window.addEventListener('zonda_usuarios_updated', handleUserUpdate);

    return () => {
      window.removeEventListener('zonda_usuarios_updated', handleUserUpdate);
    };
  }, []);

  // Resultados de búsqueda rápida global
  const q = globalQuery.trim().toLowerCase();
  const resultadosBusqueda: { tipo: string; titulo: string; sub: string; modulo: ModuleKey }[] = [];
  if (q.length >= 2) {
    clientes
      .filter((c) => c.razonSocial.toLowerCase().includes(q) || c.cuit.includes(q))
      .slice(0, 3)
      .forEach((c) =>
        resultadosBusqueda.push({
          tipo: 'CLIENTE',
          titulo: c.razonSocial,
          sub: `CUIT: ${c.cuit} | Saldo: $${c.saldo.toLocaleString('es-AR')}`,
          modulo: 'clientes'
        })
      );
    proveedores
      .filter((p) => p.razonSocial.toLowerCase().includes(q) || p.cuit.includes(q))
      .slice(0, 3)
      .forEach((p) =>
        resultadosBusqueda.push({
          tipo: 'PROVEEDOR',
          titulo: p.razonSocial,
          sub: `CUIT: ${p.cuit} | Saldo: $${p.saldo.toLocaleString('es-AR')}`,
          modulo: 'proveedores'
        })
      );
    inventario
      .filter((i) => i.descripcion.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((i) =>
        resultadosBusqueda.push({
          tipo: 'ARTÍCULO',
          titulo: `${i.codigo} - ${i.descripcion}`,
          sub: `Stock: ${i.disponible} | $${i.precioVentaNeto.toLocaleString('es-AR')}`,
          modulo: 'inventario'
        })
      );
    empleados
      .filter((e) => e.nombreCompleto.toLowerCase().includes(q) || e.cuil.includes(q))
      .slice(0, 2)
      .forEach((e) =>
        resultadosBusqueda.push({
          tipo: 'LEGAJO',
          titulo: e.nombreCompleto,
          sub: `CUIL: ${e.cuil} | ${e.cct}`,
          modulo: 'sueldos'
        })
      );
  }

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

  return (
    <header className="h-14 bg-white border-b border-emerald-800/25 px-4 lg:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Izquierda: Módulo Activo y Datos Fiscales en una sola línea limpia (sin duplicar logo) */}
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

      {/* Derecha: Buscador + Barra Unificada de Conexiones + Manuales + Operador (Todo en 1 línea sin saltos) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Buscador Global Compacto */}
        <div className="relative hidden lg:block">
          <Search className="w-3.5 h-3.5 text-[#357a59] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Buscar CUIT, cliente o ítem..."
            className="h-8 pl-8 pr-6 text-xs bg-emerald-50/40 border border-emerald-800/25 focus:outline-none focus:border-[#064e3b] focus:bg-white w-48 xl:w-60 transition-all placeholder:text-[#357a59]/70 font-medium text-[#042f22]"
          />
          {globalQuery && (
            <button
              onClick={() => setGlobalQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#357a59] hover:text-[#042f22]"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {q.length >= 2 && (
            <div className="absolute right-0 mt-1 w-80 bg-white border border-[#064e3b] shadow-xl z-50 divide-y divide-emerald-800/15 text-xs">
              {resultadosBusqueda.length > 0 ? (
                resultadosBusqueda.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveModule(item.modulo);
                      setGlobalQuery('');
                    }}
                    className="w-full text-left p-2.5 hover:bg-emerald-50 flex flex-col gap-0.5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#042f22] truncate">{item.titulo}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#064e3b] text-white font-semibold">
                        {item.tipo}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#357a59]">{item.sub}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-[#357a59] text-[11px]">
                  Sin coincidencias para "{globalQuery}"
                </div>
              )}
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
                <strong>Supabase Conectado:</strong> Proyecto <code>dtjmckbrofevgfqbkzli</code> sincronizado ({lastSync}).
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
