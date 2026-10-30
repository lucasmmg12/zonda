import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AccountingWatermarkBackground } from './components/layout/AccountingWatermarkBackground';
import { DashboardModule } from './components/modules/DashboardModule';
import { ClientesModule } from './components/modules/ClientesModule';
import { ProveedoresModule } from './components/modules/ProveedoresModule';
import { TesoreriaModule } from './components/modules/TesoreriaModule';
import { ContabilidadModule } from './components/modules/ContabilidadModule';
import { InventarioModule } from './components/modules/InventarioModule';
import { MigrationHubModule } from './components/modules/MigrationHubModule';
import { ConfiguracionModule } from './components/modules/ConfiguracionModule';
import { SueldosModule } from './components/modules/SueldosModule';
import { UsuariosModule } from './components/modules/UsuariosModule';
import { ErpProvider, useErp } from './context/ErpContext';
import {
  getActiveOperator,
  OperadorProfile,
  sincronizarUsuariosDesdeSupabase
} from './services/usuariosRbacService';

function AppLayout() {
  const { activeModule, setActiveModule, empresa } = useErp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [operadorActual, setOperadorActual] = useState<OperadorProfile>(getActiveOperator());

  useEffect(() => {
    const syncOp = () => setOperadorActual(getActiveOperator());
    window.addEventListener('zonda_usuarios_updated', syncOp);
    void sincronizarUsuariosDesdeSupabase().then(() => setOperadorActual(getActiveOperator()));
    return () => window.removeEventListener('zonda_usuarios_updated', syncOp);
  }, []);

  const tienePermisoModulo =
    activeModule === 'usuarios' ||
    operadorActual.rol === 'ADMINISTRADOR GENERAL' ||
    operadorActual.modulosPermitidos.includes(activeModule);

  const renderModule = () => {
    if (!tienePermisoModulo) {
      return (
        <div className="bg-white border border-emerald-800/30 p-8 max-w-2xl mx-auto mt-10 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 mx-auto bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-800">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-[11px] font-bold text-[#047857] uppercase tracking-wider">
            CONTROL DE ACCESO BASADO EN ROLES (RBAC)
          </div>
          <h3 className="text-lg font-extrabold text-[#042f22] uppercase">
            Módulo Restringido para el Rol: {operadorActual.rol}
          </h3>
          <p className="text-xs text-[#357a59] max-w-lg mx-auto leading-relaxed">
            El usuario actual (<strong>{operadorActual.nombre}</strong>) tiene acceso habilitado a{' '}
            <strong>{operadorActual.modulosPermitidos.length} de 10 módulos</strong> y no posee permisos para operar{' '}
            <strong className="uppercase">{activeModule}</strong>. Puede cambiar de operador o habilitar el permiso en el Módulo 10.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveModule('usuarios')}
              className="px-4 py-2 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold uppercase flex items-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Ir a Módulo 10 · Usuarios y Accesos</span>
            </button>
            <button
              onClick={() => setActiveModule(operadorActual.modulosPermitidos[0] || 'tablero')}
              className="px-4 py-2 bg-white hover:bg-emerald-50 text-[#064e3b] border border-emerald-800/30 text-xs font-bold uppercase flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Módulo Habilitado</span>
            </button>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'tablero':
        return <DashboardModule />;
      case 'clientes':
        return <ClientesModule />;
      case 'proveedores':
        return <ProveedoresModule />;
      case 'tesoreria':
        return <TesoreriaModule />;
      case 'contabilidad':
        return <ContabilidadModule />;
      case 'inventario':
        return <InventarioModule />;
      case 'sueldos':
        return <SueldosModule />;
      case 'migracion':
        return <MigrationHubModule />;
      case 'configuracion':
        return <ConfiguracionModule />;
      case 'usuarios':
        return <UsuariosModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#f4fbf7] font-sans text-[#042f22]">
      {/* Elementos gráficos contables y financieros casi transparentes en el fondo */}
      <AccountingWatermarkBackground />

      {/* Barra lateral */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Contenedor principal */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Cabecera superior */}
        <Header empresa={empresa} activeModule={activeModule} />

        {/* Área de contenido scrollable con fondo transparente para lucir la filigrana contable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent">
          <div className="max-w-7xl mx-auto pb-10">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErpProvider>
      <AppLayout />
    </ErpProvider>
  );
}

export default App;
