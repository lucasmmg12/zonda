import { AsientoContable, ComprobanteCompra, ComprobanteVenta } from '../types/models';

export interface PosicionImpositivaMensual {
  periodo: string; // YYYY-MM
  cantidadComprobantesVenta: number;
  cantidadComprobantesCompra: number;
  ventasNeto: number;
  ivaDebitoFiscal: number;
  ncVentasIvaRestado: number;
  comprasNeto: number;
  ivaCreditoFiscal: number;
  ncComprasIvaRestado: number;
  retencionesIvaSufridas: number;
  percepcionesIvaSufridas: number;
  retencionesIibb: number;
  retencionesGanancias: number;
  retencionesSuss: number;
  saldoTecnicoIva: number; // > 0 a pagar, < 0 a favor técnico
  saldoAPagarIva: number;
  saldoLibreDisponibilidad: number;
}

/**
 * Calcula la Posición Impositiva Mensual (IVA Débito vs IVA Crédito + Retenciones/Percepciones)
 * contemplando Facturas, Notas de Débito y Notas de Crédito del período YYYY-MM.
 */
export function calcularPosicionImpositivaMensual(params: {
  periodo: string;
  facturasVenta: ComprobanteVenta[];
  facturasCompra: ComprobanteCompra[];
  asientos: AsientoContable[];
}): PosicionImpositivaMensual {
  const { periodo, facturasVenta, facturasCompra, asientos } = params;

  const ventasMes = facturasVenta.filter((f) => (f.fechaEmision || '').startsWith(periodo));
  const comprasMes = facturasCompra.filter((f) => (f.fechaComprobante || '').startsWith(periodo));
  const asientosMes = asientos.filter((a) => (a.fecha || '').startsWith(periodo));

  let ventasNeto = 0;
  let ivaDebitoFiscal = 0;
  let ncVentasIvaRestado = 0;

  for (const fv of ventasMes) {
    const ivaTotal = Number(((fv.iva21 || 0) + (fv.iva105 || 0)).toFixed(2));
    const esNc = fv.tipo.toLowerCase().includes('crédito') || fv.tipo.toLowerCase().includes('credito');
    if (esNc) {
      ventasNeto -= fv.netoGravado || 0;
      ivaDebitoFiscal -= ivaTotal;
      ncVentasIvaRestado += ivaTotal;
    } else {
      ventasNeto += fv.netoGravado || 0;
      ivaDebitoFiscal += ivaTotal;
    }
  }

  let comprasNeto = 0;
  let ivaCreditoFiscal = 0;
  let ncComprasIvaRestado = 0;
  let retencionesIvaSufridas = 0;
  let retencionesIibb = 0;

  for (const fc of comprasMes) {
    const ivaTotal = Number((fc.iva || 0).toFixed(2));
    const esNc = fc.tipo.toLowerCase().includes('crédito') || fc.tipo.toLowerCase().includes('credito');
    if (esNc) {
      comprasNeto -= fc.netoGravado || 0;
      ivaCreditoFiscal -= ivaTotal;
      ncComprasIvaRestado += ivaTotal;
    } else {
      comprasNeto += fc.netoGravado || 0;
      ivaCreditoFiscal += ivaTotal;
    }
    retencionesIvaSufridas += fc.retencionIva || 0;
    retencionesIibb += fc.retencionIIBB || 0;
  }

  let percepcionesIvaSufridas = 0;
  let retencionesGanancias = 0;
  let retencionesSuss = 0;

  for (const as of asientosMes) {
    for (const det of as.renglones || []) {
      const desc = (det.cuentaNombre || '').toLowerCase();
      const debe = Number(det.debe || 0);
      if (debe <= 0) continue;
      if (desc.includes('percepci') && desc.includes('iva')) {
        percepcionesIvaSufridas += debe;
      } else if (desc.includes('ret') && desc.includes('iva') && !desc.includes('pagar')) {
        retencionesIvaSufridas += debe;
      } else if (desc.includes('ganancia') && desc.includes('ret')) {
        retencionesGanancias += debe;
      } else if (desc.includes('suss') && desc.includes('ret')) {
        retencionesSuss += debe;
      } else if (desc.includes('iibb') && desc.includes('ret') && !desc.includes('pagar')) {
        retencionesIibb += debe;
      }
    }
  }

  const round2 = (n: number) => Number(n.toFixed(2));
  const saldoTecnicoIva = round2(ivaDebitoFiscal - ivaCreditoFiscal);
  const creditosDisponibilidad = round2(retencionesIvaSufridas + percepcionesIvaSufridas);
  const netoTrasDisponibilidad = round2(saldoTecnicoIva - creditosDisponibilidad);

  return {
    periodo,
    cantidadComprobantesVenta: ventasMes.length,
    cantidadComprobantesCompra: comprasMes.length,
    ventasNeto: round2(ventasNeto),
    ivaDebitoFiscal: round2(ivaDebitoFiscal),
    ncVentasIvaRestado: round2(ncVentasIvaRestado),
    comprasNeto: round2(comprasNeto),
    ivaCreditoFiscal: round2(ivaCreditoFiscal),
    ncComprasIvaRestado: round2(ncComprasIvaRestado),
    retencionesIvaSufridas: round2(retencionesIvaSufridas),
    percepcionesIvaSufridas: round2(percepcionesIvaSufridas),
    retencionesIibb: round2(retencionesIibb),
    retencionesGanancias: round2(retencionesGanancias),
    retencionesSuss: round2(retencionesSuss),
    saldoTecnicoIva,
    saldoAPagarIva: netoTrasDisponibilidad > 0 ? netoTrasDisponibilidad : 0,
    saldoLibreDisponibilidad: netoTrasDisponibilidad < 0 ? Math.abs(netoTrasDisponibilidad) : 0
  };
}