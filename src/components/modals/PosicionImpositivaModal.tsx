import React, { useMemo, useState } from 'react';
import { Calculator, Download, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import { calcularPosicionImpositivaMensual } from '../../utils/posicionImpositiva';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PosicionImpositivaModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { facturasVenta, facturasCompra, asientosContables, empresa } = useErp();
  const [periodo, setPeriodo] = useState<string>(() => new Date().toISOString().slice(0, 7));

  const pos = useMemo(
    () =>
      calcularPosicionImpositivaMensual({
        periodo,
        facturasVenta,
        facturasCompra,
        asientos: asientosContables
      }),
    [periodo, facturasVenta, facturasCompra, asientosContables]
  );

  if (!isOpen) return null;

  const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExportarCsv = () => {
    const rows = [
      ['Posicion Impositiva Mensual', empresa.razonSocial, `Periodo ${periodo}`],
      ['Concepto', 'Importe (ARS)'],
      ['Ventas Netas Gravadas', pos.ventasNeto.toFixed(2)],
      ['IVA Debito Fiscal (Neto de NC)', pos.ivaDebitoFiscal.toFixed(2)],
      ['Compras Netas Gravadas', pos.comprasNeto.toFixed(2)],
      ['IVA Credito Fiscal (Neto de NC)', pos.ivaCreditoFiscal.toFixed(2)],
      ['Saldo Tecnico IVA (DF - CF)', pos.saldoTecnicoIva.toFixed(2)],
      ['Retenciones IVA Sufridas', pos.retencionesIvaSufridas.toFixed(2)],
      ['Percepciones IVA Sufridas', pos.percepcionesIvaSufridas.toFixed(2)],
      ['Saldo a Pagar IVA', pos.saldoAPagarIva.toFixed(2)],
      ['Saldo Libre Disponibilidad', pos.saldoLibreDisponibilidad.toFixed(2)],
      ['Retenciones IIBB', pos.retencionesIibb.toFixed(2)],
      ['Retenciones Ganancias', pos.retencionesGanancias.toFixed(2)],
      ['Retenciones SUSS', pos.retencionesSuss.toFixed(2)]
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Posicion_Impositiva_${periodo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-[#1b365d] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-sky-300" />
            <div>
              <h3 className="font-bold text-sm">Posición Impositiva Mensual (IVA & Retenciones)</h3>
              <p className="text-[11px] text-slate-200">{empresa.razonSocial} — CUIT {empresa.cuit}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-slate-700">Período Fiscal:</label>
              <input
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-800"
              />
            </div>
            <div className="text-[11px] text-slate-500">
              Comprobantes analizados: <strong>{pos.cantidadComprobantesVenta}</strong> ventas /{' '}
              <strong>{pos.cantidadComprobantesCompra}</strong> compras
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-lg p-3.5 bg-white">
              <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">1. Débito Fiscal (Ventas)</p>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Neto Gravado Ventas:</span>
                <span className="font-mono font-semibold">{fmt(pos.ventasNeto)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>IVA Débito Fiscal (neto NC):</span>
                <span className="font-mono font-bold text-rose-700">{fmt(pos.ivaDebitoFiscal)}</span>
              </div>
              {pos.ncVentasIvaRestado > 0 && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Incluye -{fmt(pos.ncVentasIvaRestado)} por Notas de Crédito emitidas.
                </p>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg p-3.5 bg-white">
              <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">2. Crédito Fiscal (Compras)</p>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Neto Gravado Compras:</span>
                <span className="font-mono font-semibold">{fmt(pos.comprasNeto)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>IVA Crédito Fiscal (neto NC):</span>
                <span className="font-mono font-bold text-emerald-700">{fmt(pos.ivaCreditoFiscal)}</span>
              </div>
              {pos.ncComprasIvaRestado > 0 && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Incluye -{fmt(pos.ncComprasIvaRestado)} por Notas de Crédito recibidas.
                </p>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-1.5">
            <p className="text-[11px] font-bold uppercase text-slate-600 mb-1">3. Liquidación Mensual & Pagos a Cuenta</p>
            <div className="flex justify-between">
              <span>Saldo Técnico IVA (Débito - Crédito):</span>
              <span className="font-mono font-bold">{fmt(pos.saldoTecnicoIva)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>(-) Retenciones IVA Sufridas:</span>
              <span className="font-mono">{fmt(pos.retencionesIvaSufridas)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>(-) Percepciones IVA Sufridas:</span>
              <span className="font-mono">{fmt(pos.percepcionesIvaSufridas)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center text-sm font-bold">
              <span>{pos.saldoAPagarIva > 0 ? 'Saldo a Pagar ARCA (F.2002):' : 'Saldo a Favor Libre Disponibilidad:'}</span>
              <span className={`font-mono ${pos.saldoAPagarIva > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {fmt(pos.saldoAPagarIva > 0 ? pos.saldoAPagarIva : pos.saldoLibreDisponibilidad)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="border border-slate-200 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-500 uppercase">Retenciones IIBB</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{fmt(pos.retencionesIibb)}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-500 uppercase">Retenciones Ganancias</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{fmt(pos.retencionesGanancias)}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-500 uppercase">Retenciones SUSS</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{fmt(pos.retencionesSuss)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleExportarCsv}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1b365d] text-white font-semibold hover:bg-[#142847]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

