import React, { useState, useEffect } from 'react';
import { Bell, Search, CreditCard, Database, RefreshCw, X, BookOpen } from 'lucide-react';
import { EmpresaConfig, AfipWsConfig, MercadoPagoConfig } from '../../types/models';
import { getAfipConfig } from '../../services/afip/afipWsClient';
import { getMercadoPagoConfig } from '../../services/mercadopago/mercadoPagoClient';
import { ConexionesManagerModal } from '../modals/ConexionesManagerModal';
import { ManualesCentroAyudaModal } from '../modals/ManualesCentroAyudaModal';
import { useErp } from '../../context/ErpContext';
import type { ModuleKey } from './Sidebar';

interface HeaderProps {
  empresa: EmpresaConfig;
  activeModule: string;
}

export const Header: React.FC<HeaderProps> = ({ empresa, activeModule }) => {
  const {
    dbStatus,
    lastSync,
    refreshAllFromDb,
    setActiveModule,
    clientes,
    proveedores,
    inventario,
    empleados
  } = useErp();

  const [afipConfig, setAfipConfig] = useState<AfipWsConfig>(getAfipConfig());
  const [mpConfig, setMpConfig] = useState<MercadoPagoConfig>(getMercadoPagoConfig());
  const [modalConexionesOpen, setModalConexionesOpen] = useState(false);
  const [tabModal, setTabModal] = useState<'afip' | 'mercadopago'>('afip');
  const [modalManualesOpen, setModalManualesOpen] = useState(false);

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
    const handleUpdate = () => {
      setAfipConfig(getAfipConfig());
      setMpConfig(getMercadoPagoConfig());
    };

    window.addEventListener('afip_config_updated', handleUpdate);
    window.addEventListener('mercadopago_config_updated', handleUpdate);

    return () => {
      window.removeEventListener('afip_config_updated', handleUpdate);
      window.removeEventListener('mercadopago_config_updated', handleUpdate);
    };
  }, []);

  const abrirModalConexiones = (targetTab: 'afip' | 'mercadopago') => {
    setTabModal(targetTab);
    setModalConexionesOpen(true);
  };

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

  return (
    <header className="h-14 bg-white border-b border-black px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Izquierda: Empresa y Módulo activo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-300">
          <div className="h-8 px-2 bg-white flex items-center justify-center border border-black shadow-sm">
            <img src="/logogrow.png" alt="Grow Labs" className="h-5 w-auto object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-black tracking-tight text-xs uppercase">{empresa.razonSocial}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black text-white font-mono border border-black font-semibold">
                CUIT: {empresa.cuit}
              </span>
            </div>
            <p className="text-[10px] text-[#064e3b] font-mono font-bold tracking-wider uppercase">
              GROW LABS // ECOSYSTEM
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 uppercase text-[10px] font-bold">MÓDULO:</span>
          <span className="text-white bg-black px-2 py-0.5 font-bold uppercase text-[10px] tracking-wider border border-black">
            [ {activeModule} ]
          </span>
        </div>
      </div>

      {/* Derecha: Estado DB Supabase, AFIP, Mercado Pago, Buscador y Perfil */}
      <div className="flex items-center gap-2">
        {/* Indicador Supabase Real-Time */}
        <button
          onClick={refreshAllFromDb}
          title={`Base de Datos Supabase PostgreSQL (Última sincr.: ${lastSync}). Click para refrescar.`}
          className={`flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-mono font-bold transition-all ${
            dbStatus === 'conectado'
              ? 'bg-[#ecfdf5] text-[#064e3b] border-[#047857] hover:bg-[#d1fae5]'
              : dbStatus === 'sincronizando'
              ? 'bg-amber-50 text-amber-800 border-amber-400'
              : 'bg-rose-50 text-rose-800 border-rose-400'
          }`}
        >
          {dbStatus === 'sincronizando' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
          ) : (
            <Database className="w-3.5 h-3.5 text-[#047857]" />
          )}
          <span className="hidden lg:inline">
            {dbStatus === 'conectado'
              ? 'SUPABASE DB: ONLINE'
              : dbStatus === 'sincronizando'
              ? 'SINCRONIZANDO...'
              : 'DB: RECONECTAR'}
          </span>
        </button>

        {/* Botón Centro de Manuales e Instrucciones */}
        <button
          onClick={() => setModalManualesOpen(true)}
          title="Abrir Manuales Paso a Paso e Instrucciones de cada Módulo"
          className="flex items-center gap-1.5 px-2.5 py-1 border border-black bg-[#fef9c3] hover:bg-amber-200 text-black text-[11px] font-bold transition-all shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-900" />
          <span>MANUALES E INSTRUCCIONES</span>
        </button>

        {/* Telemetría AFIP Dinámica */}
        <button
          onClick={() => abrirModalConexiones('afip')}
          title="Haga clic para configurar o verificar Web Services de AFIP"
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-bold transition-all ${
            afipConfig.estadoConexion === 'conectado'
              ? 'bg-[#ecfdf5] text-[#064e3b] border-[#047857] hover:bg-[#d1fae5]'
              : 'bg-white text-black border-black hover:bg-slate-100'
          }`}
        >
          <span
            className={`w-2 h-2 ${
              afipConfig.estadoConexion === 'conectado' ? 'bg-[#047857]' : 'bg-black'
            }`}
          ></span>
          <span>
            {afipConfig.estadoConexion === 'conectado'
              ? `WS-AFIP: ${afipConfig.ambiente.toUpperCase()}`
              : 'WS-AFIP: CONFIGURAR'}
          </span>
        </button>

        {/* Telemetría Mercado Pago Dinámica */}
        <button
          onClick={() => abrirModalConexiones('mercadopago')}
          title="Haga clic para vincular o configurar Mercado Pago (Checkout Pro y QR)"
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-bold transition-all ${
            mpConfig.estadoConexion === 'conectado'
              ? 'bg-[#ecfdf5] text-[#064e3b] border-[#047857] hover:bg-[#d1fae5]'
              : 'bg-white text-black border-black hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-black" />
          <span>
            {mpConfig.estadoConexion === 'conectado'
              ? `MP: ${mpConfig.modo.toUpperCase()}`
              : 'MP: CONFIGURAR'}
          </span>
        </button>

        {/* Buscador Técnico con Autocompletado */}
        <div className="relative hidden xl:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="BUSCAR [CUIT / CLIENTE / ITEM]..."
            className="pl-8 pr-6 py-1 text-[11px] bg-white border border-slate-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black w-56 transition-all uppercase placeholder:text-slate-400 font-medium"
          />
          {globalQuery && (
            <button
              onClick={() => setGlobalQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {q.length >= 2 && (
            <div className="absolute right-0 mt-1 w-80 bg-white border-2 border-black shadow-xl z-50 divide-y divide-slate-200 font-mono text-xs">
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
                      <span className="font-bold text-slate-900 truncate">{item.titulo}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 text-white font-bold">
                        {item.tipo}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{item.sub}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-slate-500 text-[11px]">
                  Sin coincidencias para "{globalQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            title="Notificaciones de Auditoría y Base de Datos"
            className="p-1.5 text-black hover:text-white hover:bg-black border border-transparent hover:border-black transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-1.5 h-1.5 bg-[#047857] absolute top-1 right-1"></span>
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-black shadow-2xl z-50 p-3 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-bold text-slate-900 uppercase">Centro de Alertas ERP</span>
                <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-black">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                <strong>Supabase Conectado:</strong> Proyecto <code>dtjmckbrofevgfqbkzli</code> sincronizado en tiempo real ({lastSync}).
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                <strong>Vencimiento Próximo:</strong> F.931 Cargas Sociales AFIP y Facturas de Cuenta Corriente.
              </div>
            </div>
          )}
        </div>

        {/* Perfil Usuario Operador */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-300">
          <div className="w-7 h-7 bg-[#064e3b] text-white flex items-center justify-center font-bold text-[11px] border border-black">
            LM
          </div>
          <div className="hidden md:block text-left">
            <p className="text-[11px] font-bold text-black leading-tight uppercase">L. MARINERO</p>
            <p className="text-[9px] text-[#064e3b] font-bold tracking-wider">ADMIN // GROW LABS</p>
          </div>
        </div>
      </div>

      {/* Modal Centralizado de Conexiones */}
      <ConexionesManagerModal
        isOpen={modalConexionesOpen}
        onClose={() => setModalConexionesOpen(false)}
        defaultTab={tabModal}
      />

      {/* Modal Centralizado de Manuales e Instrucciones */}
      <ManualesCentroAyudaModal
        isOpen={modalManualesOpen}
        onClose={() => setModalManualesOpen(false)}
        initialManualId={mapModuleToManualId(activeModule)}
      />
    </header>
  );
};
