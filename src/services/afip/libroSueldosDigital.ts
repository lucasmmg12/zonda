import { EmpleadoLegajo, LiquidacionPeriodo } from '../../types/models';

/**
 * Generador y Validador Oficial de Archivo TXT para AFIP Libro Sueldos Digital (LSD)
 * Normativa: RG AFIP N° 3781 / 5250 y modificatorias.
 * Formato posicional de longitud fija por tipo de registro (01, 02, 03, 04).
 */

export interface ResultadoGeneracionLsd {
  contenidoTxt: string;
  nombreArchivo: string;
  totalRegistros: number;
  totalBruto: number;
  totalDescuentos: number;
  totalNeto: number;
  erroresValidacion: string[];
}

// Relleno a la izquierda con ceros
const padLeftZero = (valor: string | number, length: number): string => {
  const str = String(valor).replace(/[^0-9]/g, '');
  return str.padStart(length, '0').slice(-length);
};

// Formato de importes en centavos sin coma ni punto (ej: 450000.50 -> 000000045000050)
const formatImporteLsd = (monto: number, length = 15): string => {
  const centavos = Math.round(Math.abs(monto) * 100);
  return String(centavos).padStart(length, '0').slice(-length);
};

// Relleno a la derecha con espacios
const padRightSpaces = (str: string, length: number): string => {
  return str.padEnd(length, ' ').slice(0, length);
};

export const generarTxtLibroSueldosDigital = (
  cuitEmpresa: string,
  empleados: EmpleadoLegajo[],
  liquidacion: LiquidacionPeriodo
): ResultadoGeneracionLsd => {
  const lineas: string[] = [];
  const errores: string[] = [];
  const cuitLimpio = cuitEmpresa.replace(/[^0-9]/g, '');

  if (cuitLimpio.length !== 11) {
    errores.push(`CUIT de empresa inválido (${cuitEmpresa}). Debe tener 11 dígitos.`);
  }

  const periodoLsd = liquidacion.periodo.replace(/[^0-9]/g, '').slice(0, 6); // AAAAMM
  const tipoLiqChar = liquidacion.tipoLiquidacion === '1ra Quincena' || liquidacion.tipoLiquidacion === '2da Quincena' ? 'Q' : 'M';
  const nroLiqStr = padLeftZero(liquidacion.numeroLiquidacion, 5);

  // ==========================================
  // REGISTRO 01: CABECERA DE LA LIQUIDACIÓN
  // ==========================================
  // Pos 1-2: '01'
  // Pos 3-13: CUIT Empresa (11)
  // Pos 14-19: Período AAAAMM (6)
  // Pos 20: Tipo Liquidación ('M' o 'Q') (1)
  // Pos 21-25: Número Liquidación (5)
  // Pos 26-27: Días Base (30) (2)
  // Pos 28-33: Cantidad Trabajadores Liquidados (6)
  const reg01 = `01${cuitLimpio}${periodoLsd}${tipoLiqChar}${nroLiqStr}30${padLeftZero(empleados.length, 6)}`;
  lineas.push(reg01);

  let sumBruto = 0;
  let sumRetenciones = 0;
  let sumNeto = 0;

  // Recorrer cada empleado activo liquidado
  empleados.forEach((emp) => {
    const cuilLimpio = emp.cuil.replace(/[^0-9]/g, '');
    if (cuilLimpio.length !== 11) {
      errores.push(`Legajo ${emp.legajo} (${emp.nombreCompleto}): CUIL inválido (${emp.cuil}).`);
    }

    const cbuLimpio = (emp.cbu || '0070112340000000000000').replace(/[^0-9]/g, '').padEnd(22, '0').slice(0, 22);
    const fechaPagoLsd = (liquidacion.fechaPago || '2026-11-04').replace(/[^0-9]/g, '');

    // ==========================================
    // REGISTRO 02: DATOS DEL TRABAJADOR
    // ==========================================
    // Pos 1-2: '02'
    // Pos 3-13: CUIL (11)
    // Pos 14-35: CBU (22)
    // Pos 36-38: Días Trabajados (3)
    // Pos 39-41: Horas Trabajadas (3)
    // Pos 42-49: Fecha Pago AAAAMMDD (8)
    // Pos 50-57: Fecha Rúbrica AAAAMMDD (8)
    // Pos 58: Forma Pago ('1'=Banco, '2'=Efectivo, '3'=Cheque) (1)
    const reg02 = `02${cuilLimpio}${cbuLimpio}030200${fechaPagoLsd}${fechaPagoLsd}1`;
    lineas.push(reg02);

    let empRemunerativo = 0;
    let empNoRemunerativo = 0;
    let empDescuentos = 0;

    // ==========================================
    // REGISTRO 03: CONCEPTOS LIQUIDADOS
    // ==========================================
    emp.conceptosLiquidacion.forEach((con) => {
      const codigoInterno = padRightSpaces(con.codigo, 10);
      const codigoAfip = padLeftZero(con.codigoAfipLsd || '110000', 6);
      const tipoConcepto = con.tipo === 'Remunerativo' ? 'R' : con.tipo === 'No Remunerativo' ? 'N' : 'D';
      const monto = con.remunerativo || con.noRemunerativo || con.descuento || 0;
      const montoFormatted = formatImporteLsd(monto, 15);

      if (con.tipo === 'Remunerativo') empRemunerativo += monto;
      if (con.tipo === 'No Remunerativo') empNoRemunerativo += monto;
      if (con.tipo === 'Descuento') empDescuentos += monto;

      // Pos 1-2: '03'
      // Pos 3-13: CUIL (11)
      // Pos 14-23: Código Concepto Empresa (10)
      // Pos 24-28: Cantidad con 2 dec (ej: 03000) (5)
      // Pos 29: Tipo Concepto ('R','N','D') (1)
      // Pos 30-44: Importe centavos (15)
      // Pos 45-50: Código AFIP Homologado (6)
      const reg03 = `03${cuilLimpio}${codigoInterno}03000${tipoConcepto}${montoFormatted}${codigoAfip}`;
      lineas.push(reg03);
    });

    const empNeto = empRemunerativo + empNoRemunerativo - empDescuentos;
    sumBruto += empRemunerativo + empNoRemunerativo;
    sumRetenciones += empDescuentos;
    sumNeto += empNeto;

    // ==========================================
    // REGISTRO 04: BASES IMPONIBLES F.931
    // ==========================================
    // Base 1 (SIPA Jubilación): Remunerativo
    // Base 2 (INSSJyP): Remunerativo
    // Base 3 (FNE / Asignaciones): Remunerativo
    // Base 4 (Obra Social): Remunerativo
    // Base 5 (LRT): Bruto total
    const base1 = formatImporteLsd(empRemunerativo, 15);
    const base4 = formatImporteLsd(empRemunerativo, 15);
    const base5 = formatImporteLsd(empRemunerativo + empNoRemunerativo, 15);
    const detraccionLsd = formatImporteLsd(7003.68, 15); // Detracción básica mensual Ley 27.430

    // Pos 1-2: '04'
    // Pos 3-13: CUIL (11)
    // Pos 14-28: Base 1 SIPA (15)
    // Pos 29-43: Base 2 INSSJyP (15)
    // Pos 44-58: Base 4 Obra Social (15)
    // Pos 59-73: Base 5 LRT (15)
    // Pos 74-88: Detracción Ley 27.430 (15)
    const reg04 = `04${cuilLimpio}${base1}${base1}${base4}${base5}${detraccionLsd}`;
    lineas.push(reg04);
  });

  const nombreArchivo = `LSD_${cuitLimpio}_${periodoLsd}_${nroLiqStr}.txt`;

  return {
    contenidoTxt: lineas.join('\r\n'),
    nombreArchivo,
    totalRegistros: lineas.length,
    totalBruto: sumBruto,
    totalDescuentos: sumRetenciones,
    totalNeto: sumNeto,
    erroresValidacion: errores
  };
};
