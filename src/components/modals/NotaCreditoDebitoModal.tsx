import React, { useState } from 'react';
import { FileMinus2, FilePlus2, PackageCheck, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import { FacturaAdeudada, FacturaAdeudadaProveedor } from '../../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modo: 'cliente' | 'proveedor';
  entidadId: string;
  entidadNombre: string;
  facturasAdeudadas: (FacturaAdeudada | FacturaAdeudadaProveedor)[];
}

export const NotaCreditoDebitoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  modo,
  entidadId,
  entidadNombre,
  facturasAdeudadas
}) => {
  const { emitirNotaCreditoDebitoCliente, emitirNotaCreditoDebitoProveedor, inventario } = useErp();

  const [tipo, setTipo] = useState<'Nota de Crédito A' | 'Nota de Crédito B' | 'Nota de Débito'>('Nota de Crédito A');
  const [facturaAsociadaId, setFacturaAsociadaId] = useState<string>(facturasAdeudadas[0]?.id || '');
  const [netoGravado, setNetoGravado] = useState<string>('0');
  const [descripcion, setDescripcion] = useState<string>('');
  const [reingresarStock, setReingresarStock] = useState<boolean>(false);
  const [articuloId, setArticuloId] = useState<string>(inventario[0]?.id || '');
  const [cantidadStock, setCantidadStock] = useState<string>('1');
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const esNc = tipo.startsWith('Nota de Crédito');
  const neto = Math.max(0, Number(netoGravado) || 0);
  const iva21 = Number((neto * 0.21).toFixed(2));
  const total = Number((neto + iva21).toFixed(2));

  const handleSeleccionFactura = (id: string) => {
    setFacturaAsociadaId(id);
    const fac = facturasAdeudadas.find((f) => f.id === id);
    if (fac && fac.saldo > 0) {
      setNetoGravado(Number((fac.saldo / 1.21).toFixed(2)).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (neto <= 0) return;
    setGuardando(true);
    try {
      if (modo === 'cliente') {
        await emitirNotaCreditoDebitoCliente({
          clienteId: entidadId,
          tipo,
          facturaAsociadaId: facturaAsociadaId || undefined,
          netoGravado: neto,
          iva21,
          descripcion: descripcion.trim() || `${tipo} aplicada a ${entidadNombre}`,
          reingresarStockItems:
            esNc && reingresarStock && articuloId && Number(cantidadStock) > 0
              ? [{ articuloId, cantidad: Number(cantidadStock) }]
              : undefined
        });
      } else {
        await emitirNotaCreditoDebitoProveedor({
          proveedorId: entidadId,
          tipo,
          facturaAsociadaId: facturaAsociadaId || undefined,
          netoGravado: neto,
          descripcion: descripcion.trim() || `${tipo} de ${entidadNombre}`
        });
      }
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="bg-[#1b365d] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {esNc ? <FileMinus2 className="w-5 h-5 text-emerald-300" /> : <FilePlus2 className="w-5 h-5 text-amber-300" />}
            <div>
              <h3 className="font-bold text-sm tracking-tight">Emitir Nota de Crédito / Débito</h3>
              <p className="text-[11px] text-slate-200">{entidadNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Comprobante</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as typeof tipo)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-[#1b365d]"
              >
                <option value="Nota de Crédito A">Nota de Crédito A</option>
                <option value="Nota de Crédito B">Nota de Crédito B</option>
                <option value="Nota de Débito">Nota de Débito</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Comprobante Asociado</label>
              <select
                value={facturaAsociadaId}
                onChange={(e) => handleSeleccionFactura(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-[#1b365d]"
              >
                <option value="">— Sin comprobante específico —</option>
                {facturasAdeudadas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nroComprobante} (Saldo: ${f.saldo.toLocaleString('es-AR')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Neto Gravado ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={netoGravado}
                onChange={(e) => setNetoGravado(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono text-right"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">IVA 21% ($)</label>
              <input
                type="text"
                readOnly
                value={iva21.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-100 font-mono text-right text-slate-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Comprobante</label>
              <input
                type="text"
                readOnly
                value={`$${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-100 font-mono font-bold text-right text-[#1b365d]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Concepto / Motivo</label>
            <input
              type="text"
              placeholder={esNc ? 'Ej: Devolución de mercadería / Bonificación comercial' : 'Ej: Intereses por mora / Ajuste de precio'}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
            />
          </div>

          {modo === 'cliente' && esNc && inventario.length > 0 && (
            <div className="border border-emerald-200 bg-emerald-50/70 rounded-lg p-3 space-y-2">
              <label className="flex items-center gap-2 font-semibold text-emerald-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reingresarStock}
                  onChange={(e) => setReingresarStock(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <PackageCheck className="w-4 h-4 text-emerald-700" />
                Reingresar mercadería devuelta al Inventario
              </label>
              {reingresarStock && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <select
                    value={articuloId}
                    onChange={(e) => setArticuloId(e.target.value)}
                    className="col-span-2 border border-emerald-300 rounded-lg px-2 py-1.5 bg-white"
                  >
                    {inventario.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.codigo} - {art.descripcion} (Stock: {art.stockActual})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={cantidadStock}
                    onChange={(e) => setCantidadStock(e.target.value)}
                    placeholder="Cant."
                    className="border border-emerald-300 rounded-lg px-2 py-1.5 bg-white font-mono text-right"
                  />
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900">
            {esNc
              ? 'Impacto automático: Descuenta saldo de la factura asociada, reversa IVA y genera el asiento contable de reversión.'
              : 'Impacto automático: Incrementa el saldo en Cuenta Corriente, suma IVA y registra el asiento contable.'}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || neto <= 0}
              className="px-4 py-2 rounded-lg bg-[#1b365d] text-white font-semibold hover:bg-[#142847] disabled:opacity-50"
            >
              {guardando ? 'Procesando...' : `Confirmar ${tipo}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

