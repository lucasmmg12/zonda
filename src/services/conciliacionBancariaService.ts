import { MovimientoTesoreria } from '../types/models';

export interface ExtractoBancarioLinea {
  id: string;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  referencia: string;
  debito: number;
  credito: number;
  importeNeto: number; // credito - debito
}

export interface MatchConciliacion {
  extractoLineaId: string;
  movimientoId: string;
  diferenciaDias: number;
  confianza: 'Exacta' | 'Aproximada';
}

function normalizarFechaIso(raw: string): string {
  const s = (raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmY) {
    const d = dmY[1].padStart(2, '0');
    const m = dmY[2].padStart(2, '0');
    const y = dmY[3].length === 2 ? `20${dmY[3]}` : dmY[3];
    return `${y}-${m}-${d}`;
  }
  return new Date().toISOString().split('T')[0];
}

function parsearNumeroAr(raw: string | undefined): number {
  if (!raw) return 0;
  let clean = raw.replace(/\$/g, '').replace(/\s/g, '').trim();
  if (!clean) return 0;
  // Formato argentino: 1.234.567,89 -> 1234567.89
  if (clean.includes(',') && clean.includes('.')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const num = Number(clean);
  return Number.isFinite(num) ? Number(num.toFixed(2)) : 0;
}

/**
 * Parsea un extracto bancario CSV (separado por ; o ,) con columnas de Fecha, Concepto, Débito/Crédito o Importe.
 */
export function parsearExtractoCsv(csvText: string): ExtractoBancarioLinea[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const tieneHeader = headers.some((h) => h.includes('fecha') || h.includes('concepto') || h.includes('debito') || h.includes('credito') || h.includes('importe'));
  const startIdx = tieneHeader ? 1 : 0;

  const idxFecha = tieneHeader ? headers.findIndex((h) => h.includes('fecha')) : 0;
  const idxConcepto = tieneHeader ? headers.findIndex((h) => h.includes('concepto') || h.includes('descrip')) : 1;
  const idxRef = tieneHeader ? headers.findIndex((h) => h.includes('ref') || h.includes('nro') || h.includes('comprob')) : -1;
  const idxDebito = tieneHeader ? headers.findIndex((h) => h.includes('debit') || h.includes('débit') || h.includes('egreso')) : 2;
  const idxCredito = tieneHeader ? headers.findIndex((h) => h.includes('credit') || h.includes('crédit') || h.includes('ingreso')) : 3;
  const idxImporte = tieneHeader ? headers.findIndex((h) => h.includes('importe') || h.includes('monto')) : -1;

  const result: ExtractoBancarioLinea[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 2) continue;

    const fecha = normalizarFechaIso(cols[idxFecha >= 0 ? idxFecha : 0]);
    const concepto = cols[idxConcepto >= 0 ? idxConcepto : 1] || 'Movimiento bancario';
    const referencia = idxRef >= 0 ? cols[idxRef] || '' : '';

    let debito = 0;
    let credito = 0;
    if (idxImporte >= 0 && idxDebito < 0 && idxCredito < 0) {
      const imp = parsearNumeroAr(cols[idxImporte]);
      if (imp >= 0) credito = imp;
      else debito = Math.abs(imp);
    } else {
      debito = Math.abs(parsearNumeroAr(cols[idxDebito]));
      credito = Math.abs(parsearNumeroAr(cols[idxCredito]));
    }

    const importeNeto = Number((credito - debito).toFixed(2));
    if (debito === 0 && credito === 0) continue;

    result.push({
      id: `EXT-${i}-${Date.now()}`,
      fecha,
      concepto,
      referencia,
      debito,
      credito,
      importeNeto
    });
  }
  return result;
}

/**
 * Cruza líneas del extracto bancario contra movimientos pendientes de Tesorería
 * por coincidencia exacta de importe neto y proximidad de fecha (<= 3 días).
 */
export function sugerirCoincidenciasConciliacion(
  extracto: ExtractoBancarioLinea[],
  movimientos: MovimientoTesoreria[]
): MatchConciliacion[] {
  const matches: MatchConciliacion[] = [];
  const movsUsados = new Set<string>();

  for (const linea of extracto) {
    const tLinea = new Date(normalizarFechaIso(linea.fecha)).getTime();
    let mejorMatch: { movId: string; diffDias: number } | null = null;

    for (const mov of movimientos) {
      if (mov.conciliado || movsUsados.has(mov.id)) continue;
      const netoMov = Number(((mov.ingresos || 0) - (mov.egresos || 0)).toFixed(2));
      if (Math.abs(netoMov - linea.importeNeto) > 0.01) continue;

      const tMov = new Date(normalizarFechaIso(mov.fecha)).getTime();
      const diffDias = Number.isFinite(tLinea) && Number.isFinite(tMov)
        ? Math.round(Math.abs(tLinea - tMov) / (1000 * 60 * 60 * 24))
        : 0;

      if (diffDias <= 3 && (!mejorMatch || diffDias < mejorMatch.diffDias)) {
        mejorMatch = { movId: mov.id, diffDias };
      }
    }

    if (mejorMatch) {
      movsUsados.add(mejorMatch.movId);
      matches.push({
        extractoLineaId: linea.id,
        movimientoId: mejorMatch.movId,
        diferenciaDias: mejorMatch.diffDias,
        confianza: mejorMatch.diffDias === 0 ? 'Exacta' : 'Aproximada'
      });
    }
  }

  return matches;
}

