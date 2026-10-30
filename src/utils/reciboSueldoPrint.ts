import type { EmpleadoLegajo, EmpresaConfig, LiquidacionPeriodo } from '../types/models';

const UNIDADES = [
  '',
  'UN',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE'
];

const DIEZ_A_DIECINUEVE = [
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISEIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE'
];

const DECENAS = [
  '',
  'DIEZ',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA'
];

const CENTENAS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS'
];

function convertirGrupoTresDigitos(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  const c = Math.floor(n / 100);
  const resto = n % 100;
  let texto = CENTENAS[c];

  if (resto > 0) {
    if (texto) texto += ' ';
    if (resto < 10) {
      texto += UNIDADES[resto];
    } else if (resto < 20) {
      texto += DIEZ_A_DIECINUEVE[resto - 10];
    } else if (resto < 30) {
      if (resto === 20) texto += 'VEINTE';
      else texto += 'VEINTI' + UNIDADES[resto - 20];
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      texto += DECENAS[d] + (u > 0 ? ' Y ' + UNIDADES[u] : '');
    }
  }
  return texto;
}

/**
 * Convierte un importe numérico en letras en formato recibo de sueldo argentino
 * Ej: 3170918.44 -> "TRES MILLONES CIENTO SETENTA MIL NOVECIENTOS DIECIOCHO CON 44/100"
 */
export function numeroALetrasPesosArgentinos(monto: number): string {
  const limpio = Math.max(0, Number(monto || 0));
  const entero = Math.floor(limpio);
  const centavos = Math.round((limpio - entero) * 100);
  const centavosStr = String(centavos).padStart(2, '0');

  if (entero === 0) {
    return `CERO CON ${centavosStr}/100`;
  }

  const millones = Math.floor(entero / 1000000);
  const restoMillones = entero % 1000000;
  const miles = Math.floor(restoMillones / 1000);
  const unidades = restoMillones % 1000;

  const partes: string[] = [];

  if (millones === 1) {
    partes.push('UN MILLON');
  } else if (millones > 1) {
    partes.push(`${convertirGrupoTresDigitos(millones)} MILLONES`);
  }

  if (miles === 1) {
    partes.push('MIL');
  } else if (miles > 1) {
    partes.push(`${convertirGrupoTresDigitos(miles)} MIL`);
  }

  if (unidades > 0) {
    partes.push(convertirGrupoTresDigitos(unidades));
  }

  return `${partes.join(' ')} CON ${centavosStr}/100`;
}

export function formatearPeriodoMmYyyy(periodo: string): string {
  const clean = (periodo || '202610').replace(/\D/g, '');
  if (clean.length === 6) {
    return `${clean.slice(4, 6)}/${clean.slice(0, 4)}`;
  }
  return periodo;
}

export function formatearFechaArgentina(fechaIsoODmy: string): string {
  if (!fechaIsoODmy) return '07/11/2026';
  if (fechaIsoODmy.includes('/')) return fechaIsoODmy;
  const partes = fechaIsoODmy.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaIsoODmy;
}

export function imprimirReciboHaberesDobleEjemplar(params: {
  empleado: EmpleadoLegajo;
  empresa: EmpresaConfig;
  liquidacion: LiquidacionPeriodo;
  lugarPago?: string;
  codigoPostal?: string;
  bancoDepositoPrevisional?: string;
  periodoDepositoPrevisional?: string;
  fechaDepositoPrevisional?: string;
}): void {
  const { empleado, empresa, liquidacion } = params;

  let logoUrl = '/logogrow.png?v=2';
  try {
    const customLogo = localStorage.getItem('zonda_empresa_logo_dataurl_v1');
    if (customLogo) logoUrl = customLogo;
  } catch {
    // fallback
  }

  const totalHaberes = empleado.conceptosLiquidacion.reduce((acc, c) => acc + (c.remunerativo || 0), 0);
  const totalRetenciones = empleado.conceptosLiquidacion.reduce((acc, c) => acc + (c.descuento || 0), 0);
  const totalAdicionales = empleado.conceptosLiquidacion.reduce((acc, c) => acc + (c.noRemunerativo || 0), 0);
  const neto = totalHaberes + totalAdicionales - totalRetenciones;
  const netoLetras = numeroALetrasPesosArgentinos(neto);

  const periodoAbonado = formatearPeriodoMmYyyy(liquidacion.periodo);
  const descripcionPago = `${liquidacion.tipoLiquidacion.toUpperCase()} ${periodoAbonado.replace('/', ' ')}`;
  const fechaPagoStr = formatearFechaArgentina(liquidacion.fechaPago);
  const lugarPagoStr = params.lugarPago || 'SAN JUAN';
  const cpStr = params.codigoPostal || '5400';
  const bancoPrev = params.bancoDepositoPrevisional || empleado.banco || 'Banco Santander Río';
  const periodoPrev = params.periodoDepositoPrevisional || '09/2026';
  const fechaPrev = params.fechaDepositoPrevisional || '08/10/2026';

  const fmtMonto = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const renderEjemplarHtml = (tipoEjemplar: 'ORIGINAL' | 'DUPLICADO') => {
    const filasConceptos = empleado.conceptosLiquidacion
      .map((c) => {
        const habStr = c.remunerativo !== 0 ? fmtMonto(c.remunerativo) : '';
        const retStr = c.descuento !== 0 ? fmtMonto(c.descuento) : '';
        const adicStr = c.noRemunerativo !== 0 ? fmtMonto(c.noRemunerativo) : '';
        return `
          <tr>
            <td class="col-desc">${c.descripcion}</td>
            <td class="col-cod">${c.codigo}</td>
            <td class="col-unid">${c.unidades || ''}</td>
            <td class="col-num">${habStr}</td>
            <td class="col-num">${retStr}</td>
            <td class="col-num">${adicStr}</td>
          </tr>
        `;
      })
      .join('');

    const firmaLabel = tipoEjemplar === 'ORIGINAL' ? 'Firma del Empleado' : 'Firma del Empleador';

    return `
      <div class="recibo-card">
        <div class="top-caption">
          <div class="top-title">Recibo de haberes</div>
          <div class="top-page">Página 1 de 1</div>
        </div>

        <div class="outer-box">
          <!-- Cabecera Empleador -->
          <div class="emp-header">
            <div class="logo-box">
              <img src="${logoUrl}" alt="Logo" />
            </div>
            <div class="emp-info">
              <div class="emp-name">${empresa.razonSocial}</div>
              <div class="emp-row">
                <span><strong>Dirección</strong> : ${empresa.domicilioFiscal}</span>
                <span><strong>C.P.:</strong> ${cpStr}</span>
              </div>
              <div class="emp-row">
                <span><strong>C.U.I.T.</strong> : ${empresa.cuit}</span>
                <span class="ejemplar-tag">${tipoEjemplar}</span>
              </div>
            </div>
          </div>

          <!-- Grilla Período Abonado -->
          <table class="grid-table">
            <thead>
              <tr>
                <th style="width: 22%;">Periodo abonado</th>
                <th style="width: 32%;">Descripción del pago</th>
                <th style="width: 23%;">Fecha de pago</th>
                <th style="width: 23%;">Lugar de pago</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="center">${periodoAbonado}</td>
                <td class="center">${descripcionPago}</td>
                <td class="center">${fechaPagoStr}</td>
                <td class="center">${lugarPagoStr}</td>
              </tr>
            </tbody>
          </table>

          <!-- Grilla Legajo / Apellido y Nombre / CUIL -->
          <table class="grid-table" style="margin-top: 3px;">
            <thead>
              <tr>
                <th style="width: 18%;">Legajo</th>
                <th style="width: 54%;">Apellido y nombre del empleado</th>
                <th style="width: 28%;">C.U.I.L.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="center">${empleado.legajo}</td>
                <td>${empleado.nombreCompleto}</td>
                <td class="center">${empleado.cuil}</td>
              </tr>
            </tbody>
          </table>

          <!-- Sub-bloque Sueldo/Jornal, Categoría, Ingreso y Depósito Previsional -->
          <div class="meta-strip">
            <div class="meta-line">
              <span><strong>Sueldo / Jornal :</strong> ${fmtMonto(empleado.sueldoBasico)}</span>
              <span><strong>Categoría :</strong> ${empleado.categoria}</span>
              <span><strong>Ingreso :</strong> ${formatearFechaArgentina(empleado.fechaIngreso)}</span>
            </div>
            <div class="meta-line">
              <span><strong>Depósito Previsional:</strong> <strong>Banco</strong> ${bancoPrev}</span>
              <span><strong>Período:</strong> ${periodoPrev}</span>
              <span><strong>Fecha:</strong> ${fechaPrev}</span>
            </div>
          </div>

          <!-- Tabla Principal de Conceptos (Descripción | Cód. | Unid. | Haberes | Retenciones | Adicionales) -->
          <table class="conceptos-table">
            <thead>
              <tr>
                <th style="text-align: left; padding-left: 6px;">Descripción</th>
                <th style="width: 44px;">Cód.</th>
                <th style="width: 42px;">Unid.</th>
                <th style="width: 78px;">Haberes</th>
                <th style="width: 78px;">Retenciones</th>
                <th style="width: 78px;">Adicionales</th>
              </tr>
            </thead>
            <tbody>
              ${filasConceptos}
            </tbody>
          </table>

          <!-- Fila de Totales y Neto -->
          <div class="totales-bar">
            <div class="neto-box">
              <span><strong>Neto :</strong></span>
              <span class="neto-amount">${fmtMonto(neto)}</span>
            </div>
            <div class="sum-cols">
              <div class="sum-cell">${fmtMonto(totalHaberes)}</div>
              <div class="sum-cell">${fmtMonto(totalRetenciones)}</div>
              <div class="sum-cell">${fmtMonto(totalAdicionales)}</div>
            </div>
          </div>

          <!-- Pie Legal Ley 20.744 Art. 140 y Firma -->
          <div class="footer-legal">
            <div class="letras-row">
              <strong>Recibí conforme la suma de pesos:</strong> ${netoLetras}
            </div>
            <div class="deposito-row">
              <strong>Depositados en</strong> &nbsp;&nbsp; ${empleado.banco} &nbsp;&nbsp;&nbsp;&nbsp; CA / CBU: ${empleado.cbu}
            </div>
            <div class="firma-grid">
              <div class="leyenda-art140">
                En concepto de haberes correspondientes al período arriba indicado y según la presente liquidación, dejando constancia de haber recibido un duplicado de este recibo. Incluido aumento de futuros convenios, leyes y/o resoluciones.
              </div>
              <div class="firma-box">
                <div class="firma-line">........................................................</div>
                <div class="firma-label">${firmaLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const printWin = window.open('', '_blank', 'width=1240,height=860');
  if (!printWin) return;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recibo de Haberes Ley 20.744 - ${empleado.nombreCompleto} (${periodoAbonado})</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      padding: 10px;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #064e3b;
      color: #fff;
      padding: 8px 14px;
      margin-bottom: 12px;
      font-size: 12px;
      font-weight: 700;
    }
    .toolbar button {
      background: #fff;
      color: #064e3b;
      border: none;
      padding: 6px 14px;
      font-weight: 800;
      cursor: pointer;
      text-transform: uppercase;
      font-size: 11px;
    }
    .sheet-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      max-width: 1360px;
      margin: 0 auto;
    }
    .top-caption {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0 4px 4px 4px;
    }
    .top-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 15px;
      font-weight: 700;
      text-align: center;
      flex: 1;
    }
    .top-page {
      font-size: 10px;
    }
    .outer-box {
      border: 1.5px solid #222;
      border-radius: 10px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      min-height: 680px;
    }
    .emp-header {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 6px;
    }
    .logo-box {
      width: 54px;
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .logo-box img {
      max-width: 52px;
      max-height: 52px;
      object-fit: contain;
    }
    .emp-info {
      flex: 1;
      font-size: 10px;
      line-height: 1.35;
    }
    .emp-name {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .emp-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ejemplar-tag {
      font-family: Georgia, 'Times New Roman', serif;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }
    .grid-table th {
      background: #e5e7eb;
      border: 1px solid #111;
      padding: 3px 4px;
      font-weight: 700;
      text-align: center;
    }
    .grid-table td {
      border: 1px solid #111;
      padding: 3px 5px;
      font-size: 10px;
    }
    .center { text-align: center; }
    .meta-strip {
      padding: 5px 2px;
      font-size: 9.5px;
      line-height: 1.45;
    }
    .meta-line {
      display: flex;
      justify-content: space-between;
      gap: 6px;
    }
    .conceptos-table {
      width: 100%;
      border-collapse: collapse;
      flex: 1;
      border: 1.2px solid #111;
      font-size: 9.5px;
    }
    .conceptos-table thead th {
      background: #e5e7eb;
      border: 1px solid #111;
      padding: 4px 3px;
      font-weight: 700;
      text-align: center;
    }
    .conceptos-table tbody td {
      border-left: 1px solid #111;
      border-right: 1px solid #111;
      padding: 2.5px 4px;
      vertical-align: top;
      height: 18px;
    }
    .col-desc { text-align: left; }
    .col-cod { text-align: right; font-variant-numeric: tabular-nums; }
    .col-unid { text-align: center; font-variant-numeric: tabular-nums; }
    .col-num { text-align: right; font-variant-numeric: tabular-nums; }
    .totales-bar {
      display: flex;
      align-items: stretch;
      border-left: 1.2px solid #111;
      border-right: 1.2px solid #111;
      border-bottom: 1.2px solid #111;
    }
    .neto-box {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 14px 5px 8px;
      font-size: 11px;
      font-weight: 700;
    }
    .neto-amount {
      font-size: 12px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    .sum-cols {
      display: flex;
      width: 234px;
      background: #e5e7eb;
    }
    .sum-cell {
      width: 78px;
      border-left: 1px solid #111;
      padding: 5px 4px;
      text-align: right;
      font-weight: 700;
      font-size: 9.5px;
      font-variant-numeric: tabular-nums;
    }
    .footer-legal {
      padding-top: 6px;
      font-size: 8.5px;
      line-height: 1.35;
    }
    .letras-row {
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .deposito-row {
      margin-bottom: 12px;
    }
    .firma-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
    .leyenda-art140 {
      flex: 1;
      font-size: 8px;
      color: #222;
    }
    .firma-box {
      width: 170px;
      text-align: center;
    }
    .firma-line {
      letter-spacing: 1px;
      color: #333;
    }
    .firma-label {
      font-size: 10px;
      font-weight: 600;
      margin-top: 2px;
    }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <span>RECIBO DE HABERES OFICIAL LEY 20.744 ART. 140 (ORIGINAL Y DUPLICADO) — ${empleado.nombreCompleto}</span>
    <button onclick="window.print()">Imprimir / Guardar PDF (A4 Horizontal)</button>
  </div>
  <div class="sheet-grid">
    ${renderEjemplarHtml('ORIGINAL')}
    ${renderEjemplarHtml('DUPLICADO')}
  </div>
</body>
</html>`;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}
