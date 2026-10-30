import React, { useState } from 'react';
import { ShieldCheck, Lock, UserCheck, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface OperadorProfile {
  id: string;
  nombre: string;
  rol: 'ADMINISTRADOR GENERAL' | 'CONTADOR / AUDITORÍA' | 'TESORERÍA Y FINANZAS' | 'FACTURACIÓN Y VENTAS';
  email: string;
  pin: string;
  modulosPermitidos: string[];
  descripcionPermisos: string;
}

export const OPERADORES_PREDEFINIDOS: OperadorProfile[] = [
  {
    id: 'OP-ADMIN',
    nombre: 'Administrador General',
    rol: 'ADMINISTRADOR GENERAL',
    email: 'admin@growsanjuan.com',
    pin: '1234',
    modulosPermitidos: ['dashboard', 'clientes', 'proveedores', 'tesoreria', 'contabilidad', 'inventario', 'sueldos', 'migracion', 'configuracion'],
    descripcionPermisos: 'Acceso total a los 9 módulos, configuración de certificados ARCA, Mercado Pago y cierres contables.'
  },
  {
    id: 'OP-CONTADOR',
    nombre: 'Contador / Auditoría',
    rol: 'CONTADOR / AUDITORÍA',
    email: 'auditoria@growsanjuan.com',
    pin: '2026',
    modulosPermitidos: ['dashboard', 'contabilidad', 'sueldos', 'clientes', 'proveedores', 'tesoreria', 'configuracion'],
    descripcionPermisos: 'Libro Diario, Plan de Cuentas, Libro IVA Digital RG 4597, Sueldos F.931 y Auditoría Fiscal.'
  },
  {
    id: 'OP-TESORERIA',
    nombre: 'Tesorería y Finanzas',
    rol: 'TESORERÍA Y FINANZAS',
    email: 'tesoreria@growsanjuan.com',
    pin: '5555',
    modulosPermitidos: ['dashboard', 'tesoreria', 'clientes', 'proveedores'],
    descripcionPermisos: 'Conciliación bancaria, custodia y depósito de cheques, órdenes de pago y cobranzas Mercado Pago.'
  },
  {
    id: 'OP-FACTURACION',
    nombre: 'Facturación y Ventas',
    rol: 'FACTURACIÓN Y VENTAS',
    email: 'facturacion@growsanjuan.com',
    pin: '1111',
    modulosPermitidos: ['dashboard', 'clientes', 'inventario'],
    descripcionPermisos: 'Emisión de Facturas Electrónicas con CAE, cobros QR/Link Mercado Pago, envío por WhatsApp y Kardex.'
  }
];

const STORAGE_OPERADOR_KEY = 'zonda_active_operator_v2';

export function getActiveOperator(): OperadorProfile {
  try {
    const raw = localStorage.getItem(STORAGE_OPERADOR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const found = OPERADORES_PREDEFINIDOS.find((o) => o.id === parsed.id);
      if (found) return found;
    }
  } catch {
    // Fallback
  }
  return OPERADORES_PREDEFINIDOS[0];
}

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
  const [selectedId, setSelectedId] = useState<string>(operadorActual.id);
  const [pinInput, setPinInput] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const candidato = OPERADORES_PREDEFINIDOS.find((o) => o.id === selectedId) || OPERADORES_PREDEFINIDOS[0];

  const handleCambiarSesion = async (op: OperadorProfile) => {
    localStorage.setItem(STORAGE_OPERADOR_KEY, JSON.stringify(op));
    onSelectOperador(op);
    setStatusMsg(`Sesión activa cambiada a: ${op.nombre} (${op.rol})`);

    try {
      await supabase.from('erp_webhooks_log').insert({
        origen: 'AUTH_RBAC',
        evento: 'session.operator_switch',
        referencia_externa: op.id,
        monto: 0,
        estado: 'AUTORIZADO',
        payload: {
          operador: op.nombre,
          rol: op.rol,
          email: op.email,
          timestamp: new Date().toISOString()
        }
      });
    } catch {
      // No bloquear cambio de sesión
    }

    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 650);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 max-w-2xl w-full shadow-2xl font-mono text-xs">
        <div className="bg-[#0f172a] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold uppercase tracking-wider">
              Control de Acceso y Roles (RBAC) — Zonda ERP Security
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-300 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                Operador en Sesión Activa
              </span>
              <span className="text-sm font-bold text-slate-900">{operadorActual.nombre}</span>
              <span className="text-[11px] text-emerald-700 block">{operadorActual.rol} — {operadorActual.email}</span>
            </div>
            <span className="px-2.5 py-1 bg-[#064e3b] text-white text-[10px] font-bold uppercase">
              SESIÓN VERIFICADA
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-2">
              Seleccionar Perfil / Rol Operativo (Cambio Rápido 1-Clic o con PIN):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OPERADORES_PREDEFINIDOS.map((op) => {
                const isSelected = op.id === selectedId;
                const isCurrent = op.id === operadorActual.id;
                return (
                  <div
                    key={op.id}
                    onClick={() => {
                      setSelectedId(op.id);
                      setPinInput(op.pin);
                    }}
                    className={`p-3 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#064e3b] bg-emerald-50/60 ring-1 ring-[#064e3b]'
                        : 'border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#064e3b]" />
                        {op.rol}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-800">{op.nombre}</div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">{op.descripcionPermisos}</p>
                    <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Módulos: {op.modulosPermitidos.length}/9</span>
                      <span className="font-bold text-[#064e3b]">PIN Demo: {op.pin}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <KeyRound className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="font-bold text-slate-700">PIN de Autorización:</span>
              <input
                type="password"
                value={pinInput}
                placeholder={candidato.pin}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-24 px-2 py-1 border border-slate-300 bg-white font-mono text-center font-bold"
              />
              <span className="text-[10px] text-slate-500">(Opcional en modo prueba)</span>
            </div>

            <button
              onClick={() => handleCambiarSesion(candidato)}
              className="w-full sm:w-auto px-4 py-2 bg-[#064e3b] hover:bg-emerald-800 text-white font-bold uppercase flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Activar Rol: {candidato.rol}</span>
            </button>
          </div>

          {statusMsg && (
            <div className="p-2.5 bg-emerald-100 border border-emerald-400 text-emerald-950 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#064e3b]" />
              <span>{statusMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

