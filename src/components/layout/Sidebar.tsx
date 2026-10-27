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
      className={`bg-white border-r border-slate-300 flex flex-col justify-between transition-all duration-200 z-20 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Cabecera del Sidebar */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-300 bg-slate-900 text-white">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-zonda-600 flex items-center justify-center font-mono font-bold text-xs text-white">
                Z
              </div>
              <div>
                <h1 className="text-xs font-mono font-bold tracking-widest uppercase">ZONDA // ERP</h1>
                <span className="text-[9px] text-cyan-400 font-mono tracking-wider block">PRECISION CONSOLE</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-6 h-6 bg-zonda-600 flex items-center justify-center font-mono font-bold text-xs text-white">
              Z
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir consola' : 'Colapsar consola'}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block border border-slate-700"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Lista de Módulos con bordes rectos y acento afilado */}
        <nav className="p-2 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectModule(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono transition-all text-left border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 border-l-4 border-l-zonda-500 font-bold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-mono ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {item.code}
                  </span>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                </div>

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate uppercase tracking-tight text-[11px]">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1 py-0.2 font-mono font-bold uppercase ${
                          isActive
                            ? 'bg-zonda-700 text-white border border-zonda-500'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
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

      {/* Indicador Técnico de Modo Seguro */}
      {!collapsed ? (
        <div className="p-3 m-2 bg-slate-50 border border-amber-300 border-l-4 border-l-amber-500 text-slate-800">
          <div className="flex items-center gap-1.5 text-amber-800 font-mono font-bold text-[10px] uppercase mb-1">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>MODO SEGURO // SANDBOX</span>
          </div>
          <p className="text-[10px] font-mono text-slate-600 leading-tight">
            ESCRITURAS EXTERNAS BLOQUEADAS. REGLAS DE AUDITORÍA EN MEMORIA LOCAL.
          </p>
        </div>
      ) : (
        <div className="p-2 text-center border-t border-slate-300 bg-amber-50" title="Modo Seguro Activo">
          <ShieldAlert className="w-4 h-4 text-amber-600 mx-auto" />
        </div>
      )}
    </aside>
  );
};
