import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
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
import { UsuariosModule } from './components/modules/UsuariosModule';
import { ZondaCloudModule } from './components/modules/ZondaCloudModule';
import { EcommerceModule } from './components/modules/EcommerceModule';
import { StorefrontApp } from './components/ecommerce/StorefrontApp';
import { ZondaLandingPage } from './components/landing/ZondaLandingPage';
import { AuthOnboardingModal } from './components/modals/AuthOnboardingModal';
import { SuscripcionMercadoPagoModal } from './components/modals/SuscripcionMercadoPagoModal';
import { resolveTenantIdBySlug } from './services/ecommerceService';
import { ZondaChat } from './components/ZondaChat';
import { ErpProvider, useErp } from './context/ErpContext';
import {
  getActiveOperator,
  OperadorProfile,
  sincronizarUsuariosDesdeSupabase
} from './services/usuariosRbacService';
import {
  getSaasWebSession,
  cerrarSesionSaasCompleta,
  iniciarFlujoGoogleSaas,
  type SaasWebSession
} from './services/saasAuthOnboardingService';
import {
  obtenerSuscripcionDeTenant,
  calcularMetricasTrial,
  acreditarPagoSuscripcionMercadoPago20k
} from './services/saasSubscriptionMpService';
import { supabase } from './lib/supabase';

function AppLayout() {
  const { activeModule, setActiveModule, empresa, activeTenantId, cambiarTenantActivo } = useErp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [operadorActual, setOperadorActual] = useState<OperadorProfile>(getActiveOperator());

  const searchParams = new URLSearchParams(window.location.search);
  const tiendaSlug = searchParams.get('tienda');
  const forzarVistaApp = searchParams.get('app') === '1';
  const forzarVistaWeb = searchParams.get('vista') === 'web';

  const [saasSession, setSaasSession] = useState<SaasWebSession | null>(() => getSaasWebSession());
  const [mostrarWebPublica, setMostrarWebPublica] = useState<boolean>(() => {
    if (forzarVistaApp) return false;
    if (forzarVistaWeb) return true;
    return !getSaasWebSession();
  });

  const [authModal, setAuthModal] = useState<{
    open: boolean;
    mode: 'signup' | 'login';
    prefilledEmail?: string;
  }>({ open: false, mode: 'signup' });

  const [suscripcionModal, setSuscripcionModal] = useState<{
    open: boolean;
    tab: 'plan' | 'emails' | 'dominio';
  }>({ open: false, tab: 'plan' });

  const [, setSubTick] = useState(0);

  // Resolver tienda pública Ecommerce si viene ?tienda=slug
  useEffect(() => {
    if (tiendaSlug) {
      const resolvedTenant = resolveTenantIdBySlug(tiendaSlug);
      if (resolvedTenant && resolvedTenant !== activeTenantId) {
        cambiarTenantActivo(resolvedTenant);
      }
    }
  }, [tiendaSlug, activeTenantId, cambiarTenantActivo]);

  // Escuchar retorno de Google OAuth (Supabase Auth) o retorno de pago Mercado Pago ($20.000)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mpStatus = params.get('mp_sub_status');
    const mpTenant = params.get('tenant');
    if (mpStatus === 'approved' && mpTenant) {
      void acreditarPagoSuscripcionMercadoPago20k({
        tenantId: mpTenant,
        medio: 'Mercado Pago Retorno Checkout Pro'
      }).then(() => {
        setSubTick((t) => t + 1);
        window.history.replaceState({}, '', window.location.pathname);
      });
    }

    if (params.get('oauth_callback') === 'google') {
      void supabase.auth.getSession().then(async ({ data }) => {
        const user = data?.session?.user;
        if (user?.email) {
          const res = await iniciarFlujoGoogleSaas({
            emailGoogle: user.email,
            nombreGoogle:
              (user.user_metadata?.full_name as string) ||
              (user.user_metadata?.name as string) ||
              user.email.split('@')[0]
          });
          if (res.session) {
            setSaasSession(res.session);
            setOperadorActual(getActiveOperator());
            if (!res.session.esCuentaZondaCloud && res.session.tenantId) {
              cambiarTenantActivo(res.session.tenantId);
            }
            setMostrarWebPublica(false);
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      });
    }
  }, [cambiarTenantActivo]);

  useEffect(() => {
    const syncOp = () => setOperadorActual(getActiveOperator());
    const syncSub = () => setSubTick((t) => t + 1);
    const onOpenSubEvent = (e: Event) => {
      const custom = e as CustomEvent;
      setSuscripcionModal({
        open: true,
        tab: custom.detail?.tab || 'plan'
      });
    };

    window.addEventListener('zonda_usuarios_updated', syncOp);
    window.addEventListener('zonda_subscription_updated', syncSub);
    window.addEventListener('zonda_open_suscripcion_modal', onOpenSubEvent);
    void sincronizarUsuariosDesdeSupabase().then(() => setOperadorActual(getActiveOperator()));

    return () => {
      window.removeEventListener('zonda_usuarios_updated', syncOp);
      window.removeEventListener('zonda_subscription_updated', syncSub);
      window.removeEventListener('zonda_open_suscripcion_modal', onOpenSubEvent);
    };
  }, []);

  // Aislamiento estricto por usuario y separación absoluta Zonda Core vs Zonda Cloud
  useEffect(() => {
    if (mostrarWebPublica || tiendaSlug) return;

    if (operadorActual.esCuentaZondaCloud) {
      if (activeModule !== 'zondacloud') {
        setActiveModule('zondacloud');
      }
      return;
    }

    if (activeModule === 'zondacloud') {
      setActiveModule('tablero');
    }

    if (operadorActual.tenantId && activeTenantId !== operadorActual.tenantId) {
      cambiarTenantActivo(operadorActual.tenantId);
    }
  }, [operadorActual, activeTenantId, activeModule, mostrarWebPublica, tiendaSlug, setActiveModule, cambiarTenantActivo]);

  if (tiendaSlug) {
    return <StorefrontApp tenantId={activeTenantId} empresaNombre={empresa.razonSocial} />;
  }

  // Vista de Web Pública SaaS (TechPilot Wireframe Kit + Autogestión Google / Email)
  if (mostrarWebPublica) {
    return (
      <>
        <ZondaLandingPage
          tieneSesionActiva={Boolean(saasSession)}
          onIrAlSistema={() => setMostrarWebPublica(false)}
          onOpenAuth={(mode, prefilledEmail) =>
            setAuthModal({ open: true, mode, prefilledEmail })
          }
        />
        <AuthOnboardingModal
          isOpen={authModal.open}
          initialMode={authModal.mode}
          prefilledEmail={authModal.prefilledEmail}
          onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
          onSuccess={(session) => {
            setSaasSession(session);
            setOperadorActual(getActiveOperator());
            if (session.esCuentaZondaCloud) {
              setActiveModule('zondacloud');
            } else {
              if (session.tenantId) {
                cambiarTenantActivo(session.tenantId);
              }
              setActiveModule('tablero');
            }
            setAuthModal((prev) => ({ ...prev, open: false }));
            setMostrarWebPublica(false);
          }}
        />
      </>
    );
  }

  const suscripcionActual = obtenerSuscripcionDeTenant(activeTenantId, {
    razonSocial: empresa.razonSocial,
    cuit: empresa.cuit,
    email: operadorActual.email,
    nombre: operadorActual.nombre
  });
  const metricasTrial = calcularMetricasTrial(suscripcionActual);

  const tienePermisoModulo = operadorActual.esCuentaZondaCloud
    ? activeModule === 'zondacloud'
    : activeModule !== 'zondacloud' &&
      (activeModule === 'usuarios' ||
        operadorActual.rol === 'ADMINISTRADOR GENERAL' ||
        operadorActual.rol === 'CONTADOR / AUDITORÍA' ||
        operadorActual.modulosPermitidos.includes(activeModule));

  const renderModule = () => {
    if (!tienePermisoModulo) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto mt-10 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Módulo restringido para el rol {operadorActual.rol}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Tu usuario actual ({operadorActual.nombre}) no tiene habilitado el acceso a este módulo.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveModule('usuarios')}
              className="px-4 py-2 rounded-xl bg-[#3563e9] hover:bg-[#2952cc] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Administrar permisos</span>
            </button>
            <button
              onClick={() => setActiveModule(operadorActual.modulosPermitidos[0] || 'tablero')}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio</span>
            </button>
          </div>
        </div>
      );
    }

    if (operadorActual.esCuentaZondaCloud) {
      return <ZondaCloudModule />;
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
      case 'ecommerce':
        return <EcommerceModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      {/* Barra lateral */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Contenedor principal */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Cabecera superior limpia con estado de Prueba Gratuita / Suscripción */}
        <Header
          empresa={empresa}
          activeModule={activeModule}
          etiquetaSuscripcion={metricasTrial.etiquetaResumen}
          esTrialVencido={metricasTrial.bloqueadoPorVencimiento}
          onOpenSuscripcion={() => setSuscripcionModal({ open: true, tab: 'plan' })}
          onIrWebPublica={() => setMostrarWebPublica(true)}
          onCerrarSesion={async () => {
            await cerrarSesionSaasCompleta();
            setSaasSession(null);
            setMostrarWebPublica(true);
          }}
        />

        {/* Área de contenido full-width scrollable */}
        <main className="flex-1 overflow-y-auto p-3 md:p-5 bg-transparent">
          <div className="w-full pb-8">{renderModule()}</div>
        </main>
      </div>

      {/* Modal de Suscripción Mensual $20.000 ARS (Mercado Pago), Emails y Dominio Propio */}
      <SuscripcionMercadoPagoModal
        isOpen={suscripcionModal.open || metricasTrial.bloqueadoPorVencimiento}
        initialTab={suscripcionModal.tab}
        tenantId={activeTenantId}
        razonSocial={empresa.razonSocial}
        cuit={empresa.cuit}
        emailUsuario={operadorActual.email}
        nombreUsuario={operadorActual.nombre.split('(')[0].trim()}
        bloqueadoPorVencimiento={metricasTrial.bloqueadoPorVencimiento}
        onClose={() => setSuscripcionModal((prev) => ({ ...prev, open: false }))}
      />

      {/* Copiloto y Asistente Inteligente Zonda */}
      <ZondaChat />
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
