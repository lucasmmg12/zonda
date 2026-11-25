import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Lock,
  BadgeDollarSign,
  Cloud,
  Store
} from 'lucide-react';
import { getActiveOperator, OperadorProfile } from '../../services/usuariosRbacService';

export type ModuleKey =
  | 'tablero'
  | 'clientes'
  | 'proveedores'
  | 'tesoreria'
  | 'contabilidad'
  | 'inventario'
  | 'sueldos'
  | 'migracion'
  | 'configuracion'
  | 'usuarios'
  | 'zondacloud'
  | 'ecommerce';

interface SidebarProps {
  activeModule: ModuleKey;
  onSelectModule: (module: ModuleKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItemDef {
  key: ModuleKey;
  label: string;
  icon: React.ElementType;
  group: 'Operaciones' | 'Finanzas & Fiscal' | 'Sistema & Tienda';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  collapsed,
  onToggleCollapse
}) => {
  const [operadorActual, setOperadorActual] = useState<OperadorProfile>(getActiveOperator());

  useEffect(() => {
    const syncOperator = () => setOperadorActual(getActiveOperator());
    window.addEventListener('zonda_usuarios_updated', syncOperator);
    return () => window.removeEventListener('zonda_usuarios_updated', syncOperator);
  }, []);

  const allItems: MenuItemDef[] = [
    { key: 'tablero', label: 'Panel Ejecutivo', icon: LayoutDashboard, group: 'Operaciones' },
    { key: 'clientes', label: 'Clientes y Ventas', icon: Users, group: 'Operaciones' },
    { key: 'proveedores', label: 'Proveedores y Compras', icon: ShoppingBag, group: 'Operaciones' },
    { key: 'inventario', label: 'Inventario y Stock', icon: Boxes, group: 'Operaciones' },
    { key: 'tesoreria', label: 'Tesorería y Bancos', icon: Landmark, group: 'Finanzas & Fiscal' },
    { key: 'contabilidad', label: 'Contabilidad y Libros', icon: BookOpenCheck, group: 'Finanzas & Fiscal' },
    { key: 'sueldos', label: 'Sueldos y Cargas', icon: BadgeDollarSign, group: 'Finanzas & Fiscal' },
    { key: 'zondacloud', label: 'Zonda Cloud (ARCA)', icon: Cloud, group: 'Finanzas & Fiscal' },
    { key: 'ecommerce', label: 'Ecommerce (Tienda)', icon: Store, group: 'Sistema & Tienda' },
    { key: 'migracion', label: 'Migración de Datos', icon: ArrowRightLeft, group: 'Sistema & Tienda' },
    { key: 'configuracion', label: 'Configuración Fiscal', icon: Settings, group: 'Sistema & Tienda' },
    { key: 'usuarios', label: 'Usuarios y Accesos', icon: ShieldCheck, group: 'Sistema & Tienda' }
  ];

  const esModoZondaCloud = Boolean(operadorActual.esCuentaZondaCloud);
  const visibleItems = esModoZondaCloud
    ? allItems.filter((item) => item.key === 'zondacloud')
    : allItems.filter((item) => item.key !== 'zondacloud');

  const groups: MenuItemDef['group'][] = esModoZondaCloud
    ? ['Finanzas & Fiscal']
    : ['Operaciones', 'Finanzas & Fiscal', 'Sistema & Tienda'];

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-200 z-20 select-none ${
        collapsed ? 'w-[70px]' : 'w-60'
      }`}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Cabecera Minimalista estilo Grow Labs Suite */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/logogrow.png?v=2" alt="Grow Labs" className="h-5 w-5 object-contain" />
              </div>
              <div className="truncate">
                <h1 className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                  {esModoZondaCloud ? 'Zonda Cloud' : 'Zonda Core'}
                </h1>
                <span className="block text-[10px] text-slate-400 font-medium leading-tight">
                  {esModoZondaCloud ? 'Estudio Contable' : 'Grow Labs Suite'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
              <img src="/logogrow.png?v=2" alt="Grow Labs" className="h-5 w-5 object-contain" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors hidden sm:block"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navegación Agrupada Limpia */}
        <nav className="p-3 space-y-4">
          {groups.map((grp) => {
            const grpItems = visibleItems.filter((i) => i.group === grp);
            if (grpItems.length === 0) return null;
            return (
              <div key={grp} className="space-y-0.5">
                {!collapsed && (
                  <div className="px-3 pb-1 text-[10px] font-semibold text-slate-400 tracking-wide">
                    {grp}
                  </div>
                )}
                {grpItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.key;
                  const tienePermiso =
                    item.key === 'usuarios' ||
                    (esModoZondaCloud && item.key === 'zondacloud') ||
                    operadorActual.rol === 'ADMINISTRADOR GENERAL' ||
                    operadorActual.rol === 'CONTADOR / AUDITORÍA' ||
                    operadorActual.modulosPermitidos.includes(item.key);

                  return (
                    <button
                      key={item.key}
                      onClick={() => onSelectModule(item.key)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] transition-all text-left ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-teal-600' : 'text-slate-400'
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {!collapsed && !tienePermiso && (
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Pie limpio con Logo Grow Labs */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-100 flex flex-col items-center justify-center">
          <img
            src="/logogrow.png?v=2"
            alt="Grow Labs"
            className="h-12 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
          />
          <span className="text-[10px] font-semibold tracking-widest text-slate-400 mt-1 uppercase">
            Grow Labs
          </span>
        </div>
      )}
    </aside>
  );
};
