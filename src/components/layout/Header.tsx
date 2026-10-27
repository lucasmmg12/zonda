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
    <header className="h-14 bg-white border-b border-black px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Izquierda: Empresa y Módulo activo con estética de consola Grow */}
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

      {/* Derecha: Telemetría de AFIP, Mercado Pago, Buscador y Perfil */}
      <div className="flex items-center gap-2.5">
        {/* Telemetría AFIP Dinámica */}
        <button
          onClick={() => abrirModalConexiones('afip')}
          title="Haga clic para configurar o verificar Web Services de AFIP"
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-bold transition-all ${
            afipConfig.estadoConexion === 'conectado'
              ? 'bg-[#ecfdf5] text-[#064e3b] border-[#047857] hover:bg-[#d1fae5]'
              : 'bg-white text-black border-black hover:bg-slate-100 animate-pulse'
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
              : 'WS-AFIP: NO CONECTADO'}
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
              : 'MP: NO VINCULADO'}
          </span>
        </button>

        {/* Buscador Técnico */}
        <div className="relative hidden xl:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="BUSCAR [CUIT / COMPROBANTE / CUENTA]..."
            className="pl-8 pr-3 py-1 text-[11px] bg-white border border-slate-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black w-56 transition-all uppercase placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Notificaciones */}
        <button
          title="Notificaciones de Auditoría"
          className="p-1.5 text-black hover:text-white hover:bg-black border border-transparent hover:border-black transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-[#047857] absolute top-1 right-1"></span>
        </button>

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
    </header>
  );
};
