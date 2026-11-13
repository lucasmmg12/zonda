import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Sparkles, Upload, X } from 'lucide-react';
import { CuentaBancaria } from '../../types/models';
import { useErp } from '../../context/ErpContext';
import {
  ExtractoBancarioLinea,
  parsearExtractoCsv,
  sugerirCoincidenciasConciliacion
} from '../../services/conciliacionBancariaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cuenta: CuentaBancaria;
}

export const ConciliacionBancariaModal: React.FC<Props> = ({ isOpen, onClose, cuenta }) => {
  const { conciliarMovimientosCuenta } = useErp();

  const movimientos = cuenta.movimientos || [];
  const [extracto, setExtracto] = useState<ExtractoBancarioLinea[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(
    () => new Set(movimientos.filter((m) => m.conciliado).map((m) => m.id))
  );
  const [guardando, setGuardando] = useState(false);

  const matches = useMemo(
    () => sugerirCoincidenciasConciliacion(extracto, movimientos),
    [extracto, movimientos]
  );

  if (!isOpen) return null;

  const handleArchivoCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const parsed = parsearExtractoCsv(text);
      setExtracto(parsed);
      const auto = sugerirCoincidenciasConciliacion(parsed, movimientos);
      if (auto.length > 0) {
        setSeleccionados((prev) => {
          const next = new Set(prev);
          auto.forEach((m) => next.add(m.movimientoId));
          return next;
        });
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleCargarDemoExtracto = () => {
    const pendientes = movimientos.filter((m) => !m.conciliado).slice(0, 5);
    const csvHeader = 'Fecha;Concepto;Referencia;Debito;Credito\n';
    const csvBody =
      pendientes.length > 0
        ? pendientes
            .map(
              (m) =>
                `${m.fecha};${(m.descripcion || m.clienteProveedor || 'Mov Banco').replace(/;/g, ' ')};${m.nro};${m.egresos || 0};${m.ingresos || 0}`
            )
            .join('\n')
        : `${new Date().toISOString().split('T')[0]};Acreditacion Transferencia;REF-1001;0;150000`;
    const parsed = parsearExtractoCsv(csvHeader + csvBody);
    setExtracto(parsed);
    const auto = sugerirCoincidenciasConciliacion(parsed, movimientos);
    setSeleccionados((prev) => {
      const next = new Set(prev);
      auto.forEach((m) => next.add(m.movimientoId));
      return next;
    });
  };

  const toggleMov = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saldoSeleccionado = movimientos
    .filter((m) => seleccionados.has(m.id))
    .reduce((acc, m) => acc + (m.ingresos || 0) - (m.egresos || 0), 0);

  const handleConfirmar = async () => {
    setGuardando(true);
    try {
      await conciliarMovimientosCuenta(cuenta.id, Array.from(seleccionados));
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#1b365d] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm">Conciliación Bancaria por Extracto CSV — {cuenta.nombre}</h3>
              <p className="text-[11px] text-slate-200">
                Saldo Contable: ${cuenta.saldoActual.toLocaleString('es-AR')} | Saldo Conciliado actual: $
                {cuenta.saldoConciliado.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#1b365d]" />
              Subir Extracto CSV
              <input type="file" accept=".csv,.txt" onChange={handleArchivoCsv} className="hidden" />
            </label>
            <button
              type="button"
              onClick={handleCargarDemoExtracto}
              className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-semibold hover:bg-sky-100 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simular Extracto Homebanking
            </button>
          </div>
          <div className="text-[11px] text-slate-600">
            Coincidencias detectadas: <strong className="text-emerald-700">{matches.length}</strong> | Seleccionados:{' '}
            <strong>{seleccionados.size}</strong> (${saldoSeleccionado.toLocaleString('es-AR')})
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 border-b border-slate-200">
              Extracto Bancario Importado ({extracto.length} líneas)
            </div>
            <div className="divide-y divide-slate-100 overflow-auto max-h-80">
              {extracto.length === 0 ? (
                <p className="p-6 text-center text-slate-400">
                  Subí un CSV de tu banco (Fecha;Concepto;Débito;Crédito) o usá el simulador para cruzar automáticamente.
                </p>
              ) : (
                extracto.map((l) => {
                  const matched = matches.find((m) => m.extractoLineaId === l.id);
                  return (
                    <div key={l.id} className={`p-2.5 flex justify-between items-center ${matched ? 'bg-emerald-50/70' : ''}`}>
                      <div>
                        <p className="font-semibold text-slate-800">{l.concepto}</p>
                        <p className="text-[10px] text-slate-500">
                          {l.fecha} {l.referencia ? `· Ref ${l.referencia}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${l.importeNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {l.importeNeto >= 0 ? '+' : ''}${l.importeNeto.toLocaleString('es-AR')}
                        </p>
                        {matched && <span className="text-[10px] text-emerald-700 font-semibold">Match {matched.confianza}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 border-b border-slate-200">
              Movimientos en Zonda ERP ({movimientos.length})
            </div>
            <div className="divide-y divide-slate-100 overflow-auto max-h-80">
              {movimientos.length === 0 ? (
                <p className="p-6 text-center text-slate-400">Sin movimientos registrados en esta cuenta.</p>
              ) : (
                movimientos.map((m) => {
                  const neto = (m.ingresos || 0) - (m.egresos || 0);
                  const checked = seleccionados.has(m.id);
                  const isAutoMatched = matches.some((mt) => mt.movimientoId === m.id);
                  return (
                    <label
                      key={m.id}
                      className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${
                        checked ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMov(m.id)}
                          className="rounded text-[#1b365d]"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">{m.descripcion || m.clienteProveedor}</p>
                          <p className="text-[10px] text-slate-500">
                            {m.fecha} · {m.tipo} {m.nro}
                            {isAutoMatched && <span className="ml-1.5 text-emerald-700 font-bold">· Sugerido por CSV</span>}
                          </p>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${neto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {neto >= 0 ? '+' : ''}${neto.toLocaleString('es-AR')}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={handleConfirmar}
            className="px-4 py-2 rounded-lg bg-[#1b365d] text-white font-semibold hover:bg-[#142847] flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {guardando ? 'Conciliando...' : 'Confirmar Conciliación'}
          </button>
        </div>
      </div>
    </div>
  );
};

