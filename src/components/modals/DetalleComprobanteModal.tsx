import React from 'react';
import {
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  CreditCard,
  FileText,
  Printer,
  Send,
  ShieldCheck,
  X
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type {
  Cliente,
  FacturaAdeudada,
  FacturaAdeudadaProveedor,
  Proveedor
} from '../../types/models';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modo: 'cliente' | 'proveedor';
  factura: FacturaAdeudada | FacturaAdeudadaProveedor;
  cliente?: Cliente;
  proveedor?: Proveedor;
  onCobrarOPagar?: () => void;
  onEmitirNcNd?: () => void;
  onImprimirPdf?: () => void;
  onEnviarWhatsApp?: () => void;
}

export const DetalleComprobanteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  modo,
  factura,
  cliente,
  proveedor,
  onCobrarOPagar,
  onEmitirNcNd,
  onImprimirPdf,
  onEnviarWhatsApp
}) => {
  const { facturasVenta, facturasCompra, asientosContables, inventario } = useErp();

  if (!isOpen) return null;

  const nro = factura.nroComprobante;
  const nroSinPto = nro.includes('-') ? nro.split('-')[1] : nro;

  const compVenta =
    modo === 'cliente'
      ? facturasVenta.find(
          (fv) => `${fv.puntoVenta}-${fv.numero}` === nro || fv.numero === nroSinPto
        )
      : undefined;

  const compCompra =
    modo === 'proveedor'
      ? facturasCompra.find((fc) => fc.numero === nro || fc.numero.endsWith(nroSinPto))
      : undefined;

  const total = factura.total || 0;
  const pagadoOCobrado =
    modo === 'cliente'
      ? (factura as FacturaAdeudada).cobrado || 0
      : (factura as FacturaAdeudadaProveedor).pagado || 0;
  const saldo = factura.saldo || 0;
  const pctCancelado = total > 0 ? Math.min(100, Math.round((pagadoOCobrado / total) * 100)) : 0;

  const netoGravado = compVenta
    ? compVenta.netoGravado
    : compCompra
    ? compCompra.netoGravado
    : Number((total / 1.21).toFixed(2));
  const ivaTotal = compVenta
    ? Number(((compVenta.iva21 || 0) + (compVenta.iva105 || 0)).toFixed(2))
    : compCompra
    ? compCompra.iva
    : Number((total - netoGravado).toFixed(2));

  // Asientos contables vinculados al comprobante
  const asientosVinculados = asientosContables.filter(
    (a) => a.concepto.includes(nro) || (nroSinPto.length >= 6 && a.concepto.includes(nroSinPto))
  );

  // Movimientos de stock vinculados al comprobante
  const movsStockVinculados = inventario.flatMap((art) =>
    (art.movimientos || [])
      .filter(
        (m) =>
          (m.facturaNro && (m.facturaNro.includes(nro) || m.facturaNro.includes(nroSinPto))) ||
          (m.comprobanteEgreso && (m.comprobanteEgreso.includes(nro) || m.comprobanteEgreso.includes(nroSinPto))) ||
          (m.descripcion && m.descripcion.includes(nro))
      )
      .map((m) => ({
        articuloCodigo: art.codigo,
        articuloNombre: art.descripcion,
        ...m
      }))
  );

  // Movimientos de cuenta corriente vinculados
  const movsCtaCte =
    modo === 'cliente'
      ? (cliente?.movimientos || []).filter(
          (m) => m.comprobante.includes(nro) || m.concepto.includes(nro) || (nroSinPto.length >= 6 && m.concepto.includes(nroSinPto))
        )
      : (proveedor?.movimientos || []).filter(
          (m) => m.comprobante.includes(nro) || m.concepto.includes(nro) || (nroSinPto.length >= 6 && m.concepto.includes(nroSinPto))
        );

  const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const entidadNombre = modo === 'cliente' ? cliente?.razonSocial : proveedor?.razonSocial;
  const entidadCuit = modo === 'cliente' ? cliente?.cuit : proveedor?.cuit;
  const entidadIva = modo === 'cliente' ? cliente?.condicionIva : proveedor?.condicionIva;
  const entidadDomicilio = modo === 'cliente' ? cliente?.domicilio : proveedor?.domicilio;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-xs"
      >
        {/* Header */}
        <div className="bg-[#064e3b] text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm tracking-tight">
                  {factura.tipo} N° {factura.nroComprobante}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    saldo <= 0.01
                      ? 'bg-emerald-400 text-[#042f22]'
                      : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {saldo <= 0.01 ? 'Cancelada 100%' : 'Saldo Pendiente'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 truncate">
                {entidadNombre} · CUIT {entidadCuit} ({entidadIva})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Bloque 1: Datos Generales + Resumen Financiero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Datos del Comprobante y Entidad
              </p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-slate-500 block text-[10px]">Emisión</span>
                  <strong className="font-mono text-slate-900">{factura.fechaEmision}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Vencimiento / Pago</span>
                  <strong className="font-mono text-slate-900">{factura.fechaPago}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px]">Concepto / Descripción</span>
                  <strong className="text-slate-900">{factura.descripcion}</strong>
                </div>
                {entidadDomicilio && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[10px]">Domicilio</span>
                    <span className="text-slate-700">{entidadDomicilio}</span>
                  </div>
                )}
                {compVenta?.cae && (
                  <div className="col-span-2 pt-1.5 border-t border-slate-200 flex items-center gap-2 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>CAE ARCA:</strong> <span className="font-mono">{compVenta.cae}</span> · Vto:{' '}
                      <span className="font-mono">{compVenta.caeVencimiento || '-'}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Desglose Impositivo</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Neto Gravado:</span>
                  <span className="font-mono font-semibold">{fmt(netoGravado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IVA (21% / 10.5%):</span>
                  <span className="font-mono font-semibold">{fmt(ivaTotal)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Total:</span>
                  <span className="font-mono">{fmt(total)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-700 font-semibold">
                    {modo === 'cliente' ? 'Cobrado:' : 'Pagado:'} {fmt(pagadoOCobrado)}
                  </span>
                  <span className="text-rose-600 font-bold">Saldo: {fmt(saldo)}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 transition-all" style={{ width: `${pctCancelado}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 text-right">{pctCancelado}% cancelado</p>
              </div>
            </div>
          </div>

          {/* Bloque 2: Artículos / Movimientos de Stock */}
          {movsStockVinculados.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#064e3b]" />
                <span>Trazabilidad de Stock / Artículos ({movsStockVinculados.length})</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100 text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Artículo</th>
                    <th className="py-2 px-3">Depósito</th>
                    <th className="py-2 px-3 text-right">Cantidad</th>
                    <th className="py-2 px-3 text-right">Precio Unit.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movsStockVinculados.map((m, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-mono">{m.articuloCodigo}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{m.articuloNombre}</td>
                      <td className="py-2 px-3 text-slate-600">{m.deposito}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{m.cantidad}</td>
                      <td className="py-2 px-3 text-right font-mono">{fmt(m.precio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bloque 3: Movimientos en Cuenta Corriente / Cobros o Pagos */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#064e3b]" />
              <span>Historial en Cuenta Corriente ({movsCtaCte.length})</span>
            </div>
            {movsCtaCte.length === 0 ? (
              <p className="p-4 text-slate-400 text-center">Sin cobros/pagos imputados todavía.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100 text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3">Comprobante</th>
                    <th className="py-2 px-3">Detalle</th>
                    <th className="py-2 px-3 text-right">Debe</th>
                    <th className="py-2 px-3 text-right">Haber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movsCtaCte.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 px-3 font-mono">{m.fecha}</td>
                      <td className="py-2 px-3 font-semibold">{m.comprobante}</td>
                      <td className="py-2 px-3 text-slate-600">{m.concepto}</td>
                      <td className="py-2 px-3 text-right font-mono">{m.debe > 0 ? fmt(m.debe) : '-'}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">
                        {m.haber > 0 ? fmt(m.haber) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bloque 4: Asiento Contable en Libro Diario */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-[#064e3b]" />
              <span>Asientos Contables Vinculados ({asientosVinculados.length})</span>
            </div>
            {asientosVinculados.length === 0 ? (
              <p className="p-4 text-slate-400 text-center">
                Comprobante histórico de saldo inicial (sin asiento de emisión en el período actual).
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {asientosVinculados.map((as) => (
                  <div key={as.numero} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Asiento #{as.numero} · {as.fecha} — {as.concepto}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Debe = Haber ({fmt(as.totalDebe)})
                      </span>
                    </div>
                    <table className="w-full text-left text-[11px]">
                      <tbody className="divide-y divide-slate-100">
                        {as.renglones.map((r, rIdx) => (
                          <tr key={rIdx}>
                            <td className="py-1 font-mono text-slate-500 w-20">{r.cuentaCodigo}</td>
                            <td className="py-1 text-slate-800">{r.cuentaNombre}</td>
                            <td className="py-1 text-right font-mono w-28">{r.debe > 0 ? fmt(r.debe) : '-'}</td>
                            <td className="py-1 text-right font-mono w-28">{r.haber > 0 ? fmt(r.haber) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Acciones Rápidas */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {onImprimirPdf && (
              <button
                type="button"
                onClick={onImprimirPdf}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> PDF / QR ARCA
              </button>
            )}
            {onEnviarWhatsApp && (
              <button
                type="button"
                onClick={onEnviarWhatsApp}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> WhatsApp
              </button>
            )}
            {onEmitirNcNd && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEmitirNcNd();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold"
              >
                Emitir NC / ND
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {saldo > 0.01 && onCobrarOPagar && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCobrarOPagar();
                }}
                className="px-4 py-1.5 rounded-lg bg-[#064e3b] hover:bg-[#047857] text-white font-bold"
              >
                {modo === 'cliente' ? '$ Cobrar esta Factura' : '$ Pagar esta Factura'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
