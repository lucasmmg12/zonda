import React, { useState, useEffect } from 'react';
import { Shield, Bell, Search, Activity, Terminal, Lock, CreditCard, Plug } from 'lucide-react';
import { EmpresaConfig, AfipWsConfig, MercadoPagoConfig } from '../../types/models';
import { getAfipConfig } from '../../services/afip/afipWsClient';
import { getMercadoPagoConfig } from '../../services/mercadopago/mercadoPagoClient';
import { ConexionesManagerModal } from '../modals/ConexionesManagerModal';

interface HeaderProps {
  empresa: EmpresaConfig;
  activeModule: string;
}

export const Header: React.FC<HeaderProps> = ({ empresa, activeModule }) => {
  const [afipConfig, setAfipConfig] = useState<AfipWsConfig>(getAfipConfig());
  const [mpConfig, setMpConfig] = useState<MercadoPagoConfig>(getMercadoPagoConfig());
  const [modalConexionesOpen, setModalConexionesOpen] = useState(false);
  const [tabModal, setTabModal] = useState<'afip' | 'mercadopago'>('afip');

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
  return (
    <header className="h-14 bg-white border-b border-slate-300 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Izquierda: Empresa y Módulo activo con estética de consola */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-300">
          <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm border border-slate-700">
            Z
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-xs uppercase">{empresa.razonSocial}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 font-mono border border-slate-300">
                CUIT: {empresa.cuit}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
              GROW LABS // SANATORIO ARGENTINO
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 uppercase text-[10px]">MÓDULO ACTIVO:</span>
          <span className="text-white bg-slate-900 px-2 py-0.5 font-bold uppercase text-[10px] tracking-wider border border-slate-800">
            [ {activeModule} ]
          </span>
        </div>
      </div>

      {/* Derecha: Telemetría de AFIP, Mercado Pago, Buscador y Perfil */}
      <div className="flex items-center gap-2.5">
        {/* Telemetría AFIP Dinámica */}
        <button
          onClick={() => abrirModalConexiones('afip')}
          title="Haga clic para configurar o verificar Web Services de AFIP"
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-bold transition-all ${
            afipConfig.estadoConexion === 'conectado'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 animate-pulse'
          }`}
        >
          <span
            className={`w-2 h-2 ${
              afipConfig.estadoConexion === 'conectado' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          ></span>
          <span>
            {afipConfig.estadoConexion === 'conectado'
              ? `WS-AFIP: ${afipConfig.ambiente.toUpperCase()}`
              : 'WS-AFIP: NO CONECTADO'}
          </span>
        </button>

        {/* Telemetría Mercado Pago Dinámica */}
        <button
          onClick={() => abrirModalConexiones('mercadopago')}
          title="Haga clic para vincular o configurar Mercado Pago (Checkout Pro y QR)"
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-bold transition-all ${
            mpConfig.estadoConexion === 'conectado'
              ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-[#009ee3]" />
          <span>
            {mpConfig.estadoConexion === 'conectado'
              ? `MP: ${mpConfig.modo.toUpperCase()}`
              : 'MP: NO VINCULADO'}
          </span>
        </button>

        {/* Buscador Técnico */}
        <div className="relative hidden xl:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="BUSCAR [CUIT / COMPROBANTE / CUENTA]..."
            className="pl-8 pr-3 py-1 text-[11px] bg-slate-50 border border-slate-300 focus:outline-none focus:border-zonda-700 focus:bg-white w-56 transition-all uppercase placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Notificaciones */}
        <button
          title="Notificaciones de Auditoría"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-300 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-amber-500 absolute top-1 right-1"></span>
        </button>

        {/* Perfil Usuario Operador */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-300">
          <div className="w-7 h-7 bg-zonda-700 text-white flex items-center justify-center font-bold text-[11px]">
            LM
          </div>
          <div className="hidden md:block text-left">
            <p className="text-[11px] font-bold text-slate-900 leading-tight uppercase">L. MARINERO</p>
            <p className="text-[9px] text-slate-500 tracking-wider">ADMIN // AUDITOR</p>
          </div>
        </div>
      </div>

      {/* Modal Centralizado de Conexiones */}
      <ConexionesManagerModal
        isOpen={modalConexionesOpen}
        onClose={() => setModalConexionesOpen(false)}
        defaultTab={tabModal}
      />
    </header>
  );
};
