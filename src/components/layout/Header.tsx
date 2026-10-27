import React from 'react';
import { Shield, Bell, Search, Activity, Terminal, Lock } from 'lucide-react';
import { EmpresaConfig } from '../../types/models';

interface HeaderProps {
  empresa: EmpresaConfig;
  activeModule: string;
}

export const Header: React.FC<HeaderProps> = ({ empresa, activeModule }) => {
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

      {/* Derecha: Telemetría de AFIP, Buscador terminal y Perfil */}
      <div className="flex items-center gap-3">
        {/* Telemetría AFIP */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-300 text-[10px] font-mono">
          <span className="w-1.5 h-1.5 bg-emerald-500"></span>
          <span className="font-bold text-emerald-700">WS-AFIP: CONECTADO</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">100% CUADRE</span>
        </div>

        {/* Buscador Técnico */}
        <div className="relative hidden lg:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="BUSCAR [CUIT / COMPROBANTE / CUENTA]..."
            className="pl-8 pr-3 py-1 text-[11px] font-mono bg-slate-50 border border-slate-300 focus:outline-none focus:border-zonda-700 focus:bg-white w-64 transition-all uppercase placeholder:text-slate-400"
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
        <div className="flex items-center gap-2 pl-3 border-l border-slate-300">
          <div className="w-7 h-7 bg-zonda-700 text-white flex items-center justify-center font-mono font-bold text-[11px]">
            LM
          </div>
          <div className="hidden md:block text-left">
            <p className="text-[11px] font-bold text-slate-900 leading-tight uppercase font-mono">L. MARINERO</p>
            <p className="text-[9px] text-slate-500 font-mono tracking-wider">ADMIN // AUDITOR</p>
          </div>
        </div>
      </div>
    </header>
  );
};
