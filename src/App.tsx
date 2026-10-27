import React, { useState } from 'react';
import { Sidebar, ModuleKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardModule } from './components/modules/DashboardModule';
import { ClientesModule } from './components/modules/ClientesModule';
import { ProveedoresModule } from './components/modules/ProveedoresModule';
import { TesoreriaModule } from './components/modules/TesoreriaModule';
import { ContabilidadModule } from './components/modules/ContabilidadModule';
import { InventarioModule } from './components/modules/InventarioModule';
import { MigrationHubModule } from './components/modules/MigrationHubModule';
import { ConfiguracionModule } from './components/modules/ConfiguracionModule';
import { SueldosModule } from './components/modules/SueldosModule';
import { mockEmpresa } from './services/mockData';

export function App() {
  const getInitialModule = (): ModuleKey => {
    const hash = window.location.hash.replace('#', '') as ModuleKey;
    const validModules: ModuleKey[] = ['tablero', 'clientes', 'proveedores', 'tesoreria', 'contabilidad', 'inventario', 'sueldos', 'migracion', 'configuracion'];
    if (validModules.includes(hash)) return hash;
    return 'sueldos';
  };

  const [activeModule, setActiveModuleState] = useState<ModuleKey>(getInitialModule);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const setActiveModule = (mod: ModuleKey) => {
    setActiveModuleState(mod);
    window.location.hash = mod;
  };

  const renderModule = () => {
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
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Barra lateral */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Cabecera superior */}
        <Header empresa={mockEmpresa} activeModule={activeModule} />

        {/* Área de contenido scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto pb-10">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
