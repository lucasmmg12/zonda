import React, { useState } from 'react';
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
import { ErpProvider, useErp } from './context/ErpContext';

function AppLayout() {
  const { activeModule, setActiveModule, empresa } = useErp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
