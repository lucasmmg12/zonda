import { ComprobanteVenta, ComprobanteCompra } from '../types/models';

/**
 * Formateadores posicionales para el Régimen de Información de Compras y Ventas
 * LIBRO DE IVA DIGITAL — AFIP / ARCA Resolución General N° 4597
 */
function padNum(val: number | string, len: number): string {
  const clean = String(val).replace(/\D/g, '');
  return clean.padStart(len, '0').slice(-len);
}

function padAlpha(val: string, len: number): string {
  const clean = (val || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  return clean.padEnd(len, ' ').slice(0, len);
}

function formatImporteAfip15(amount: number): string {
  const cents = Math.round(Math.abs(amount || 0) * 100);
  return String(cents).padStart(15, '0').slice(-15);
}

function formatFechaAfip8(isoDate: string): string {
  const clean = (isoDate || '').replace(/\D/g, '');
  return clean.length === 8 ? clean : new Date().toISOString().split('T')[0].replace(/\D/g, '');
}

function getCodigoComprobanteAfip(tipo: string): string {
  if (tipo.includes('Nota de Crédito A')) return '003';
  if (tipo.includes('Nota de Débito A')) return '002';
  if (tipo.includes('Factura B')) return '006';
  if (tipo.includes('Factura C')) return '011';
  return '001'; // Factura A por defecto
}

/**
 * Genera los 4 archivos posicionales oficiales del Libro de IVA Digital RG 4597:
 * 1. LIBRO_IVA_DIGITAL_VENTAS_CBTE (266 caracteres por línea)
 * 2. LIBRO_IVA_DIGITAL_VENTAS_ALICUOTAS (62 caracteres por línea)
 * 3. LIBRO_IVA_DIGITAL_COMPRAS_CBTE (325 caracteres por línea)
 * 4. LIBRO_IVA_DIGITAL_COMPRAS_ALICUOTAS (84 caracteres por línea)
 */
export function generateLibroIvaDigitalRg4597(
  facturasVenta: ComprobanteVenta[],
  facturasCompra: ComprobanteCompra[]
): {
  ventasCbteTxt: string;
  ventasAlicuotasTxt: string;
  comprasCbteTxt: string;
  comprasAlicuotasTxt: string;
  resumenPosicionIva: {
    totalVentasNeto: number;
    totalIvaDebitoFiscal: number;
    totalVentasBruto: number;
    totalComprasNeto: number;
    totalIvaCreditoFiscal: number;
    totalComprasBruto: number;
    saldoTecnicoIva: number; // > 0 a pagar a ARCA, < 0 saldo a favor
  };
} {
  // 1. VENTAS COMPROBANTES (266 chars) y ALÍCUOTAS (62 chars)
  const lineasVentasCbte: string[] = [];
  const lineasVentasAlic: string[] = [];

  let totalVentasNeto = 0;
  let totalIvaDebitoFiscal = 0;
  let totalVentasBruto = 0;

  for (const fv of facturasVenta) {
    const signo = fv.tipo.includes('Crédito') ? -1 : 1;
    totalVentasNeto += fv.netoGravado * signo;
    totalIvaDebitoFiscal += (fv.iva21 + (fv.iva105 || 0)) * signo;
    totalVentasBruto += fv.total * signo;

    const fecha8 = formatFechaAfip8(fv.fechaEmision);
    const tipo3 = getCodigoComprobanteAfip(fv.tipo);
    const ptoVta5 = padNum(fv.puntoVenta || '0001', 5);
    const nro20 = padNum(fv.numero || '1', 20);
    const codDoc2 = '80'; // CUIT
    const cuit20 = padNum(fv.clienteCuit || '30711234561', 20);
    const denom30 = padAlpha(fv.clienteNombre, 30);
    const impTotal15 = formatImporteAfip15(fv.total);
    const ceros15 = '000000000000000';
    const moneda3 = 'PES';
    const tipoCambio10 = '0001000000';
    const cantAlic1 = '1';
    const codOp1 = ' ';
    const vtoPago8 = formatFechaAfip8(fv.fechaVencimiento || fv.fechaEmision);

    // Registro 266 posiciones
    const lineaCbte =
      fecha8 +
      tipo3 +
      ptoVta5 +
      nro20 +
      nro20 +
      codDoc2 +
      cuit20 +
      denom30 +
      impTotal15 +
      ceros15 +
      ceros15 +
      ceros15 +
      ceros15 +
      ceros15 +
      ceros15 +
      ceros15 +
      moneda3 +
      tipoCambio10 +
      cantAlic1 +
      codOp1 +
      ceros15 +
      vtoPago8;

    lineasVentasCbte.push(lineaCbte);

    // Alícuota Ventas (62 posiciones): Tipo(3) + PtoVta(5) + Nro(20) + Neto(15) + CodAlic(4 -> 0005=21%) + ImpuestoLiquidado(15)
    const lineaAlic =
      tipo3 +
      ptoVta5 +
      nro20 +
      formatImporteAfip15(fv.netoGravado) +
      '0005' +
      formatImporteAfip15(fv.iva21);
    lineasVentasAlic.push(lineaAlic);
  }

  // 2. COMPRAS COMPROBANTES y ALÍCUOTAS
  const lineasComprasCbte: string[] = [];
  const lineasComprasAlic: string[] = [];

  let totalComprasNeto = 0;
  let totalIvaCreditoFiscal = 0;
  let totalComprasBruto = 0;

  for (const fc of facturasCompra) {
    totalComprasNeto += fc.netoGravado;
    totalIvaCreditoFiscal += fc.iva;
    totalComprasBruto += fc.total;

    const partes = (fc.numero || '0001-00000001').split('-');
    const fecha8 = formatFechaAfip8(fc.fechaComprobante);
    const tipo3 = getCodigoComprobanteAfip(fc.tipo);
    const ptoVta5 = padNum(partes[0] || '0001', 5);
    const nro20 = padNum(partes[1] || fc.numero, 20);
    const despacho16 = '                ';
    const codDoc2 = '80';
    const cuit20 = padNum(fc.proveedorCuit || '30654321987', 20);
    const denom30 = padAlpha(fc.proveedorNombre, 30);
    const impTotal15 = formatImporteAfip15(fc.total);
    const ceros15 = '000000000000000';
    const percIibb15 = formatImporteAfip15(fc.retencionIIBB || 0);
    const percIva15 = formatImporteAfip15(fc.retencionIva || 0);
    const moneda3 = 'PES';
    const tipoCambio10 = '0001000000';
    const cantAlic1 = '1';
    const codOp1 = ' ';
    const credFiscal15 = formatImporteAfip15(fc.iva);

    const lineaCompCbte =
      fecha8 +
      tipo3 +
      ptoVta5 +
      nro20 +
      despacho16 +
      codDoc2 +
      cuit20 +
      denom30 +
      impTotal15 +
      ceros15 +
      ceros15 +
      percIva15 +
      ceros15 +
      percIibb15 +
      ceros15 +
      ceros15 +
      moneda3 +
      tipoCambio10 +
      cantAlic1 +
      codOp1 +
      credFiscal15 +
      ceros15 +
      '00000000000' +
      padAlpha('', 30) +
      ceros15;

    lineasComprasCbte.push(lineaCompCbte);

    // Alícuota Compras (84 posiciones): Tipo(3)+PtoVta(5)+Nro(20)+CodDoc(2)+CUIT(20)+Neto(15)+CodAlic(4)+IVA(15)
    const lineaCompAlic =
      tipo3 +
      ptoVta5 +
      nro20 +
      codDoc2 +
      cuit20 +
      formatImporteAfip15(fc.netoGravado) +
      '0005' +
      formatImporteAfip15(fc.iva);
    lineasComprasAlic.push(lineaCompAlic);
  }

  const saldoTecnicoIva = Number((totalIvaDebitoFiscal - totalIvaCreditoFiscal).toFixed(2));

  return {
    ventasCbteTxt: lineasVentasCbte.join('\r\n'),
    ventasAlicuotasTxt: lineasVentasAlic.join('\r\n'),
    comprasCbteTxt: lineasComprasCbte.join('\r\n'),
    comprasAlicuotasTxt: lineasComprasAlic.join('\r\n'),
    resumenPosicionIva: {
      totalVentasNeto: Number(totalVentasNeto.toFixed(2)),
      totalIvaDebitoFiscal: Number(totalIvaDebitoFiscal.toFixed(2)),
      totalVentasBruto: Number(totalVentasBruto.toFixed(2)),
      totalComprasNeto: Number(totalComprasNeto.toFixed(2)),
      totalIvaCreditoFiscal: Number(totalIvaCreditoFiscal.toFixed(2)),
      totalComprasBruto: Number(totalComprasBruto.toFixed(2)),
      saldoTecnicoIva
    }
  };
}

export function downloadTxtFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
