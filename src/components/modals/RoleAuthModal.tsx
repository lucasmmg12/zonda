import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, UserCheck, KeyRound, X, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import {
  OperadorProfile,
  getUsuariosList,
  getActiveOperator,
  cambiarOperadorActivo,
  sincronizarUsuariosDesdeSupabase
} from '../../services/usuariosRbacService';
import { useErp } from '../../context/ErpContext';

export type { OperadorProfile };
export { getActiveOperator };

interface RoleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  operadorActual: OperadorProfile;
  onSelectOperador: (op: OperadorProfile) => void;
}

export const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  isOpen,
  onClose,
  operadorActual,
  onSelectOperador
}) => {
  const { setActiveModule } = useErp();
  const [usuarios, setUsuarios] = useState<OperadorProfile[]>(getUsuariosList());
  const [selectedId, setSelectedId] = useState<string>(operadorActual.id);
  const [pinInput, setPinInput] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      const list = getUsuariosList();
      setUsuarios(list);
    };
    window.addEventListener('zonda_usuarios_updated', refresh);
    if (isOpen) {
      refresh();
      void sincronizarUsuariosDesdeSupabase().then(setUsuarios);
      setSelectedId(operadorActual.id);
      setErrorMsg(null);
      setStatusMsg(null);
    }
    return () => window.removeEventListener('zonda_usuarios_updated', refresh);
  }, [isOpen, operadorActual.id]);

  if (!isOpen) return null;

  const usuariosActivos = usuarios.filter((u) => u.activo);
  const candidato =
    usuariosActivos.find((o) => o.id === selectedId) ||
    usuariosActivos[0] ||
    operadorActual;

  const handleCambiarSesion = async (op: OperadorProfile) => {
    setErrorMsg(null);
    if (!op.activo) {
      setErrorMsg('Este usuario se encuentra SUSPENDIDO. Reactívelo en el Módulo 10.');
      return;
    }
    if (pinInput.trim() !== '' && pinInput.trim() !== op.pin) {
      setErrorMsg(`PIN incorrecto para ${op.rol}. Verifique el PIN asignado.`);
      return;
    }

    await cambiarOperadorActivo(op);
    onSelectOperador(op);
    setStatusMsg(`Sesión activa cambiada a: ${op.rol} (${op.nombre})`);

    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 600);
  };

  const irModuloUsuarios = () => {
    onClose();
    setActiveModule('usuarios');
  };

  return (
    <div className="fixed inset-0 bg-[#042f22]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-emerald-800/30 max-w-2xl w-full shadow-2xl font-sans text-xs">
        <div className="bg-[#064e3b] text-white px-5 py-3.5 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span className="font-bold uppercase tracking-wider">
              Control de Acceso y Roles (RBAC) — Zonda ERP Security
            </span>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-emerald-50/70 border border-emerald-800/25 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#047857] uppercase block">
                Rol / Usuario en Sesión Activa
              </span>
              <span className="text-sm font-extrabold text-[#042f22] uppercase">{operadorActual.rol}</span>
              <span className="text-[11px] text-[#065f46] block">
                {operadorActual.nombre} — {operadorActual.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={irModuloUsuarios}
                className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-[#064e3b] border border-emerald-700/40 text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Agregar / Quitar Usuarios</span>
              </button>
              <span className="px-2.5 py-1.5 bg-[#064e3b] text-white text-[10px] font-bold uppercase">
                SESIÓN VERIFICADA
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-bold text-[#042f22] uppercase">
                Seleccionar Usuario / Rol Habilitado ({usuariosActivos.length} activos):
              </label>
              <button
                onClick={irModuloUsuarios}
                className="text-[11px] font-bold text-[#047857] hover:underline"
              >
                + Administrar padrón completo en Módulo 10 →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {usuariosActivos.map((op) => {
                const isSelected = op.id === candidato.id;
                const isCurrent = op.id === operadorActual.id;
                return (
                  <div
                    key={op.id}
                    onClick={() => {
                      setSelectedId(op.id);
                      setPinInput(op.pin);
                      setErrorMsg(null);
                    }}
                    className={`p-3 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#064e3b] bg-emerald-50/70 ring-1 ring-[#064e3b]'
                        : 'border-emerald-800/20 bg-white hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#042f22] flex items-center gap-1.5 uppercase">
                        <UserCheck className="w-3.5 h-3.5 text-[#047857]" />
                        {op.rol}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-[#064e3b] border border-emerald-400 font-bold">
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-[#065f46]">{op.nombre}</div>
                    <div className="text-[10px] text-[#357a59]">{op.email}</div>
                    <p className="text-[10px] text-[#1e4635] mt-1 leading-snug line-clamp-2">
                      {op.descripcionPermisos}
                    </p>
                    <div className="mt-2 pt-1.5 border-t border-emerald-800/15 flex items-center justify-between text-[10px] tabular-nums">
                      <span className="text-[#357a59] font-semibold">
                        Módulos: {op.modulosPermitidos.length}/10
                      </span>
                      <span className="font-bold text-[#064e3b]">PIN: {op.pin}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/40 border border-emerald-800/25 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <KeyRound className="w-4 h-4 text-[#064e3b] shrink-0" />
              <span className="font-bold text-[#042f22]">PIN de Autorización:</span>
              <input
                type="password"
                value={pinInput}
                placeholder={candidato.pin}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-24 px-2 py-1 border border-emerald-800/30 bg-white text-center font-bold tabular-nums"
              />
            </div>

            <button
              onClick={() => handleCambiarSesion(candidato)}
              className="w-full sm:w-auto px-4 py-2 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase flex items-center justify-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Activar: {candidato.rol}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-300 text-red-900 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-2.5 bg-emerald-100 border border-emerald-400 text-[#042f22] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#064e3b]" />
              <span>{statusMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
