import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Landmark,
  BookOpenCheck,
  Boxes,
  ArrowRightLeft,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Terminal,
  BadgeDollarSign
} from 'lucide-react';

export type ModuleKey =
  | 'tablero'
  | 'clientes'
  | 'proveedores'
  | 'tesoreria'
  | 'contabilidad'
  | 'inventario'
  | 'sueldos'
  | 'migracion'
  | 'configuracion';

interface SidebarProps {
  activeModule: ModuleKey;
  onSelectModule: (module: ModuleKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  collapsed,
  onToggleCollapse
}) => {
  const menuItems: { key: ModuleKey; label: string; icon: React.ElementType; code: string; badge?: string }[] = [
    { key: 'tablero', label: 'Tablero de Control', icon: LayoutDashboard, code: '01' },
    { key: 'clientes', label: 'Clientes y Ventas', icon: Users, code: '02', badge: 'AFIP' },
    { key: 'proveedores', label: 'Proveedores y Compras', icon: ShoppingBag, code: '03' },
    { key: 'tesoreria', label: 'Tesorería y Cheques', icon: Landmark, code: '04' },
    { key: 'contabilidad', label: 'Contabilidad y Libros', icon: BookOpenCheck, code: '05' },
    { key: 'inventario', label: 'Inventario y Stock', icon: Boxes, code: '06' },
    { key: 'sueldos', label: 'Sueldos y Cargas', icon: BadgeDollarSign, code: '07', badge: 'LSD' },
    { key: 'migracion', label: 'Centro de Migración', icon: ArrowRightLeft, code: '08', badge: 'HUB' },
    { key: 'configuracion', label: 'Configuración Fiscal', icon: Settings, code: '09' }
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-300 flex flex-col justify-between transition-all duration-200 z-20 select-none ${collapsed ? 'w-16' : 'w-64'
        }`}
    >
      <div>
        {/* Cabecera del Sidebar — Blanca y unificada con el Header con líneas en Verde Bosque */}
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-emerald-800/25 bg-white text-[#042f22]">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="logo-circle h-8 w-8 shrink-0 bg-emerald-50/90 flex items-center justify-center overflow-hidden">
                <img src="/logogrow.png" alt="Grow Labs" className="h-5 w-5 object-contain" />
              </div>
              <div className="truncate">
                <h1 className="text-xs font-extrabold tracking-wider uppercase text-[#064e3b] leading-tight whitespace-nowrap">
                  GROW // ERP
                </h1>
                <span className="text-[9px] text-[#357a59] tracking-widest block font-semibold uppercase whitespace-nowrap">
                  PRECISION ENGINE
                </span>
              </div>
            </div>
          ) : (
            <div className="logo-circle mx-auto h-8 w-8 bg-emerald-50/90 flex items-center justify-center overflow-hidden p-1">
              <img src="/logogrow.png" alt="Grow Labs" className="h-5 w-5 object-contain" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="p-1 text-[#357a59] hover:text-[#064e3b] hover:bg-emerald-50 transition-colors hidden sm:block border border-emerald-700/25"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Lista de Módulos con bordes rectos y acento en Verde Esmeralda Oscuro */}
        <nav className="p-2 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectModule(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-sans transition-all text-left border ${isActive
                    ? 'bg-[#064e3b] text-white border-[#047857] border-l-4 border-l-emerald-400 font-bold shadow-sm'
                    : 'text-[#064e3b] hover:text-[#042f22] hover:bg-emerald-50/70 border-transparent hover:border-emerald-200 font-semibold'
                  }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] ${isActive ? 'text-emerald-300 font-bold' : 'text-emerald-700/70'}`}>
                    {item.code}
                  </span>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-[#047857]'}`} />
                </div>

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate uppercase tracking-tight text-[11px] font-semibold">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1 py-0.2 font-sans font-bold uppercase ${isActive
                            ? 'bg-[#047857] text-emerald-100 border border-emerald-400/50'
                            : 'bg-emerald-50 text-[#064e3b] border border-emerald-200'
                          }`}
                      >
                        [{item.badge}]
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Espacio Central del Sidebar: Logo Grow Labs contenido en un círculo sin bordes */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
        {!collapsed ? (
          <div className="logo-circle w-28 h-28 bg-emerald-50/75 flex items-center justify-center overflow-hidden p-4 transition-transform hover:scale-105">
            <img
              src="/logogrow.png"
              alt="Grow Labs Ecosystem"
              className="w-full h-full object-contain select-none"
            />
          </div>
        ) : (
          <div className="logo-circle w-10 h-10 bg-emerald-50/75 flex items-center justify-center overflow-hidden p-1.5">
            <img
              src="/logogrow.png"
              alt="Grow Labs"
              className="w-full h-full object-contain select-none"
            />
          </div>
        )}
      </div>

      {/* Indicador Técnico de Base de Datos Productiva */}
      {!collapsed ? (
        <div className="p-3 m-2 bg-emerald-50/70 border border-emerald-300 border-l-4 border-l-[#064e3b] text-slate-800">
          <div className="flex items-center gap-1.5 text-[#064e3b] font-mono font-bold text-[10px] uppercase mb-1">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>SUPABASE DB // EN VIVO</span>
          </div>
          <p className="text-[10px] font-mono text-slate-600 leading-tight">
            PERSISTENCIA POSTGRESQL TRANSACCIONAL Y PARTIDA DOBLE ACTIVA (14 TABLAS).
          </p>
        </div>
      ) : (
        <div className="p-2 text-center border-t border-slate-300 bg-emerald-50" title="Supabase DB en Vivo">
          <ShieldAlert className="w-4 h-4 text-[#064e3b] mx-auto" />
        </div>
      )}
    </aside>
  );
};
