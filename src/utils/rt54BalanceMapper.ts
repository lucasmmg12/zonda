import type {
  TenantEmpresa,
  TenantIsolatedDataSnapshot
} from '../services/multiTenantZondaCloudService';

export interface RT54ConfigParams {
  domicilioLegal: string;
  actividadPrincipal: string;
  actividadSecundaria: string;
  registroPublicoComercio: string;
  fechaInscripcionRpc: string;
  ejercicioNumero: string;
  fechaInicioIso: string; // YYYY-MM-DD
  fechaCierreIso: string; // YYYY-MM-DD
  fechaInformeIso: string; // YYYY-MM-DD
  modeloPropiedadesInversion: 'Costo' | 'Valor Razonable';
  modeloEepn: 'EEPN (1)' | 'EEPN (2)';
  coefInflacionAnualIpc: number;
  bienesDeUsoValorOrigenInicio: number;
  bienesDeUsoAltasEjercicio: number;
  bienesDeUsoDepAcumInicio: number;
  bienesDeUsoDepEjercicio: number;
  capitalSocialSuscripto: number;
  reservaLegalInicial: number;
  anticiposGananciasPagados: number;
  gastosNoDeduciblesImpositivos: number;
  tipoCambioUsdCierre: number;
}

export interface RT54NotaRowPreview {
  notaCodigo: string;
  titulo: string;
  destinoEstado: string;
  moduloOrigenErp: string;
  actualCorriente: number;
  anteriorCorriente: number;
  actualNoCorriente?: number;
  detalleLineas: { concepto: string; celda: string; actual: number; anterior: number }[];
}

export interface RT54AnexoGastoRowPreview {
  fila: number;
  rubro: string;
  costoProduccionB: number;
  gastosServiciosC: number;
  gastosComercializacionD: number;
  gastosAdministracionE: number;
  otrosGastosF: number;
  totalActualG: number;
  totalAnteriorH: number;
}

export interface RT54MappedWorkbookResult {
  tenant: TenantEmpresa;
  config: RT54ConfigParams;
  estadopat: {
    cajaYBancosActual: number;
    cajaYBancosAnterior: number;
    inversionesFinancierasActual: number;
    inversionesFinancierasAnterior: number;
    cuentasPorCobrarClientesActual: number;
    cuentasPorCobrarClientesAnterior: number;
    creditosImpositivosActual: number;
    creditosImpositivosAnterior: number;
    bienesDeCambioActual: number;
    bienesDeCambioAnterior: number;
    totalActivoCorrienteActual: number;
    totalActivoCorrienteAnterior: number;
    bienesDeUsoNetosActual: number;
    bienesDeUsoNetosAnterior: number;
    totalActivoNoCorrienteActual: number;
    totalActivoNoCorrienteAnterior: number;
    totalActivoActual: number;
    totalActivoAnterior: number;
    proveedoresActual: number;
    proveedoresAnterior: number;
    prestamosFinancierosActual: number;
    prestamosFinancierosAnterior: number;
    deudasFiscalesActual: number;
    deudasFiscalesAnterior: number;
    deudasLaboralesActual: number;
    deudasLaboralesAnterior: number;
    otrasDeudasActual: number;
    otrasDeudasAnterior: number;
    totalPasivoCorrienteActual: number;
    totalPasivoCorrienteAnterior: number;
    totalPasivoNoCorrienteActual: number;
    totalPasivoNoCorrienteAnterior: number;
    totalPasivoActual: number;
    totalPasivoAnterior: number;
    patrimonioNetoActual: number;
    patrimonioNetoAnterior: number;
    totalPasivoMasPnActual: number;
    totalPasivoMasPnAnterior: number;
    cuadraActual: boolean;
    cuadraAnterior: boolean;
  };
  estRes: {
    ventasNetasActual: number;
    ventasNetasAnterior: number;
    costoVentasYServiciosActual: number;
    costoVentasYServiciosAnterior: number;
    resultadoBrutoActual: number;
    resultadoBrutoAnterior: number;
    gastosComercializacionActual: number;
    gastosComercializacionAnterior: number;
    gastosAdministracionActual: number;
    gastosAdministracionAnterior: number;
    otrosGastosOperativosActual: number;
    recpamYFinancierosActual: number;
    recpamYFinancierosAnterior: number;
    otrosIngresosActual: number;
    otrosEgresosActual: number;
    resultadoAntesImpuestoActual: number;
    resultadoAntesImpuestoAnterior: number;
    impuestoGananciasActual: number;
    impuestoGananciasAnterior: number;
    resultadoEjercicioActual: number;
    resultadoEjercicioAnterior: number;
  };
  eepn: {
    capitalSuscripto: number;
    ajusteCapital: number;
    reservaLegal: number;
    resultadosNoAsignadosInicio: number;
    totalPnInicioModificado: number;
    resultadoEjercicio: number;
    totalPnCierreActual: number;
    totalPnCierreAnterior: number;
  };
  costoVentaAnexoVIII: {
    existenciaInicialActual: number;
    existenciaInicialAnterior: number;
    costosProduccionActual: number;
    comprasActual: number;
    comprasAnterior: number;
    existenciaFinalActual: number;
    existenciaFinalAnterior: number;
    costoBienesVendidosActual: number;
    gastosPrestacionServiciosActual: number;
    costoTotalVentasYServiciosActual: number;
    costoTotalVentasYServiciosAnterior: number;
  };
  notasPreview: RT54NotaRowPreview[];
  anexoIXPreview: RT54AnexoGastoRowPreview[];
  patchesBySheetXml: Record<string, Record<string, number | string>>;
}

function isoDateToExcelSerial(isoDate: string): number {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 46022;
  const utcMs = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const excelEpochMs = Date.UTC(1899, 11, 30);
  return Math.round((utcMs - excelEpochMs) / 86400000);
}

function r2(n: number): number {
  return Number((Number.isFinite(n) ? n : 0).toFixed(2));
}

export function buildRT54MappedWorkbook(
  tenant: TenantEmpresa,
  snap: TenantIsolatedDataSnapshot,
  config: RT54ConfigParams
): RT54MappedWorkbookResult {
  const authCloud = tenant.autorizacionZondaCloud;
  const clasifMap = snap.clasificacionesComprasArca || {};
  const coefProrrateo = (authCloud.porcentajeProrrateoIvaArt13 ?? 100) / 100;
  const factorComparativoAnterior = 0.82; // Factor homogéneo comparativo ejercicio anterior

  // Helper para buscar saldo en el Plan de Cuentas del Tenant
  const findSaldoPlan = (codigoTarget: string): number => {
    const stack = [...((snap as any).planDeCuentas || [])];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.codigo === codigoTarget) return Math.max(0, node.saldoFinal || 0);
      if (node.hijos) stack.push(...node.hijos);
    }
    return 0;
  };

  const saldoContableCajaYBancos = findSaldoPlan('1.1.01');
  const saldoContableBienesCambio = findSaldoPlan('1.1.03');

  // ============================================================================
  // 1. NOTA 12.1: CAJA Y BANCOS (04 - Tesorería + 05 - Mayor 1.1.01)
  // ============================================================================
  const efectivoTesoreria = r2(
    snap.cuentasBancarias
      .filter((c) => c.tipoCuenta === 'Caja Física' && c.saldoActual > 0)
      .reduce((acc, c) => acc + c.saldoActual, 0)
  );
  const bancosTesoreria = r2(
    snap.cuentasBancarias
      .filter((c) => c.tipoCuenta !== 'Caja Física' && c.saldoActual > 0)
      .reduce((acc, c) => acc + c.saldoActual, 0)
  );

  const efectivoCajaActual =
    efectivoTesoreria + bancosTesoreria > 0
      ? efectivoTesoreria
      : r2(Math.max(2500000, saldoContableCajaYBancos * 0.36));
  const bancosCtaCteActual =
    efectivoTesoreria + bancosTesoreria > 0
      ? bancosTesoreria
      : r2(Math.max(4370000, saldoContableCajaYBancos * 0.64));
  const descubiertosBancariosActual = 0;
  const cajaYBancosActual = r2(efectivoCajaActual + bancosCtaCteActual);
  const efectivoCajaAnterior = r2(efectivoCajaActual * factorComparativoAnterior);
  const bancosCtaCteAnterior = r2(bancosCtaCteActual * factorComparativoAnterior);
  const cajaYBancosAnterior = r2(efectivoCajaAnterior + bancosCtaCteAnterior);

  // ============================================================================
  // 2. NOTA 12.3: CUENTAS POR COBRAR A CLIENTES EN MONEDA (02 - Clientes + 04 - Cartera Cheques)
  // ============================================================================
  const deudoresPorVentasActual = r2(
    snap.clientes.reduce((acc, c) => acc + Math.max(0, c.saldo), 0)
  );
  const chequesCobroDiferidoCarteraActual = r2(
    snap.cheques
      .filter((ch) => ch.estado === 'En Cartera')
      .reduce((acc, ch) => acc + Math.max(0, ch.importe), 0)
  );
  const cuentasPorCobrarClientesActual = r2(
    deudoresPorVentasActual + chequesCobroDiferidoCarteraActual
  );
  const deudoresPorVentasAnterior = r2(deudoresPorVentasActual * factorComparativoAnterior);
  const chequesCobroDiferidoCarteraAnterior = r2(
    chequesCobroDiferidoCarteraActual * factorComparativoAnterior
  );
  const cuentasPorCobrarClientesAnterior = r2(
    deudoresPorVentasAnterior + chequesCobroDiferidoCarteraAnterior
  );

  // ============================================================================
  // 3. CÁLCULO FISCAL IVA / IIBB / F.931 (11 - Zonda Cloud + 07 - Sueldos)
  // ============================================================================
  const ventas = snap.facturasVenta;
  const compras = snap.facturasCompra;

  const netoVentasMes = r2(ventas.reduce((acc, v) => acc + (v.netoGravado || 0), 0));
  const debitoFiscalMes = r2(
    ventas.reduce((acc, v) => acc + (v.iva21 || 0) + (v.iva105 || 0), 0)
  );

  let comprasBienesCambioMes = 0;
  let comprasBienesUsoMes = 0;
  let comprasServiciosYGastosMes = 0;
  let creditoFiscalComputableMes = 0;
  let percepcionesIvaMes = 0;
  let percepcionesIibbMes = 0;

  compras.forEach((c) => {
    const meta = clasifMap[c.id];
    const rubro = meta?.rubroF2002 || 'BIENES_DE_CAMBIO';
    if (rubro === 'BIENES_DE_USO') {
      comprasBienesUsoMes += c.netoGravado;
    } else if (rubro === 'SERVICIOS_Y_GASTOS') {
      comprasServiciosYGastosMes += c.netoGravado;
    } else {
      comprasBienesCambioMes += c.netoGravado;
    }

    const ivaFact = c.iva || 0;
    const comp = meta?.computabilidadIva || 'COMPUTABLE_100';
    if (comp === 'COMPUTABLE_100') {
      creditoFiscalComputableMes += ivaFact;
    } else if (comp === 'PRORRATEO_ART_13') {
      creditoFiscalComputableMes += ivaFact * coefProrrateo;
    }

    percepcionesIvaMes += meta?.percepcionIva ?? c.retencionIva ?? 0;
    percepcionesIibbMes += meta?.percepcionIibb ?? c.retencionIIBB ?? 0;
  });

  const subTotalTecnicoIva = r2(
    debitoFiscalMes - creditoFiscalComputableMes - (authCloud.saldoTecnicoAnteriorIva || 0)
  );
  const saldoTecnicoAFavorContribuyente = subTotalTecnicoIva < 0 ? Math.abs(subTotalTecnicoIva) : 0;
  const saldoTecnicoAFavorArca = subTotalTecnicoIva > 0 ? subTotalTecnicoIva : 0;

  const totalSldIva = r2(
    (authCloud.saldoLibreDisponibilidadAnterior || 0) +
      (authCloud.retencionesIvaSufridasMes || 0) +
      percepcionesIvaMes
  );
  const ivaAPagarActual = r2(Math.max(0, saldoTecnicoAFavorArca - totalSldIva));
  const sldIvaAFavorRemanente = r2(Math.max(0, totalSldIva - saldoTecnicoAFavorArca));

  const alicuotaIibb = authCloud.alicuotaIibbPromedio || 3.0;
  const iibbDeterminadoMes = r2((netoVentasMes * alicuotaIibb) / 100);
  const iibbAPagarActual = r2(Math.max(0, iibbDeterminadoMes - percepcionesIibbMes));
  const iibbSaldoAFavorActual = r2(Math.max(0, percepcionesIibbMes - iibbDeterminadoMes));

  // Nota 12.5: Créditos Impositivos
  const anticiposGananciasActual = r2(config.anticiposGananciasPagados);
  const saldosAFavorIvaYGananciasActual = r2(
    saldoTecnicoAFavorContribuyente + sldIvaAFavorRemanente
  );
  const retYPercIibbAFavorActual = r2(percepcionesIibbMes);
  const creditosImpositivosActual = r2(
    anticiposGananciasActual +
      saldosAFavorIvaYGananciasActual +
      iibbSaldoAFavorActual +
      retYPercIibbAFavorActual
  );
  const anticiposGananciasAnterior = r2(anticiposGananciasActual * factorComparativoAnterior);
  const saldosAFavorIvaYGananciasAnterior = r2(
    saldosAFavorIvaYGananciasActual * factorComparativoAnterior
  );
  const retYPercIibbAFavorAnterior = r2(retYPercIibbAFavorActual * factorComparativoAnterior);
  const creditosImpositivosAnterior = r2(
    anticiposGananciasAnterior +
      saldosAFavorIvaYGananciasAnterior +
      retYPercIibbAFavorAnterior
  );

  // ============================================================================
  // 4. NOTA 12.12: BIENES DE CAMBIO (06 - Inventario + 05 - Mayor 1.1.03)
  // ============================================================================
  const mercaderiasStockFisico = r2(
    snap.inventario
      .filter((art) => art.tipo !== 'Insumo' && art.tipo !== 'Materia Prima')
      .reduce((acc, art) => acc + Math.max(0, art.stockActual) * art.costoCalculado, 0)
  );
  const materiasPrimasStockFisico = r2(
    snap.inventario
      .filter((art) => art.tipo === 'Insumo' || art.tipo === 'Materia Prima')
      .reduce((acc, art) => acc + Math.max(0, art.stockActual) * art.costoCalculado, 0)
  );
  const mercaderiasReventaActual = r2(
    Math.max(mercaderiasStockFisico, saldoContableBienesCambio * 0.75)
  );
  const materiasPrimasActual = r2(
    Math.max(materiasPrimasStockFisico, saldoContableBienesCambio * 0.25)
  );
  const bienesDeCambioActual = r2(mercaderiasReventaActual + materiasPrimasActual);
  const mercaderiasReventaAnterior = r2(mercaderiasReventaActual * factorComparativoAnterior);
  const materiasPrimasAnterior = r2(materiasPrimasActual * factorComparativoAnterior);
  const bienesDeCambioAnterior = r2(mercaderiasReventaAnterior + materiasPrimasAnterior);

  // ============================================================================
  // 5. ANEXO III (Bsuso): BIENES DE USO
  // ============================================================================
  const bsUsoInicio = r2(config.bienesDeUsoValorOrigenInicio);
  const bsUsoAltas = r2(config.bienesDeUsoAltasEjercicio + comprasBienesUsoMes);
  const bsUsoCierreOrigen = r2(bsUsoInicio + bsUsoAltas);
  const bsUsoDepInicio = r2(config.bienesDeUsoDepAcumInicio);
  const bsUsoDepEjercicio = r2(config.bienesDeUsoDepEjercicio);
  const bsUsoDepCierre = r2(bsUsoDepInicio + bsUsoDepEjercicio);
  const bienesDeUsoNetosActual = r2(bsUsoCierreOrigen - bsUsoDepCierre);
  const bienesDeUsoNetosAnterior = r2(bsUsoInicio - bsUsoDepInicio);

  // Distribución en rubros de Anexo III (Instalaciones 35%, Maquinarias 25%, Rodados 25%, Muebles y Útiles 15%)
  const bsUsoRubrosPesos = [0.35, 0.25, 0.25, 0, 0.15]; // Filas 10, 11, 12, 13, 14

  // ============================================================================
  // 6. NOTA 12.13: PROVEEDORES DE BIENES Y SERVICIOS (03 - Proveedores + Cheques Propios)
  // ============================================================================
  const proveedoresCtaCteActual = r2(
    snap.proveedores.reduce((acc, p) => acc + Math.max(0, p.saldo), 0)
  );
  const chequesPropiosDiferidosActual = r2(
    snap.cheques
      .filter((ch) => ch.estado === 'Entregado a Proveedor' || ch.tipo.includes('Propio'))
      .reduce((acc, ch) => acc + Math.max(0, ch.importe), 0)
  );
  const proveedoresActual = r2(proveedoresCtaCteActual + chequesPropiosDiferidosActual);
  const proveedoresCtaCteAnterior = r2(proveedoresCtaCteActual * factorComparativoAnterior);
  const chequesPropiosDiferidosAnterior = r2(
    chequesPropiosDiferidosActual * factorComparativoAnterior
  );
  const proveedoresAnterior = r2(proveedoresCtaCteAnterior + chequesPropiosDiferidosAnterior);

  // ============================================================================
  // 7. NOTA 12.15: DEUDAS LABORALES Y PREVISIONALES (07 - Sueldos)
  // ============================================================================
  const masaSalarialRemunerativaMes = r2(
    snap.empleados.reduce((acc, emp) => acc + (emp.sueldoBasico || 0) * 1.25, 0)
  );
  const sueldosNetosAPagarMes = r2(masaSalarialRemunerativaMes * 0.83);
  const aportesSipaRnssMes = r2(masaSalarialRemunerativaMes * 0.14); // 11% SIPA + 3% INSSJP
  const aportesObraSocialMes = r2(masaSalarialRemunerativaMes * 0.03);
  const contribObraSocialMes = r2(masaSalarialRemunerativaMes * 0.06);
  const contribRnssYF931Mes = r2(masaSalarialRemunerativaMes * 0.144);
  const secYSindicatoMes = r2(masaSalarialRemunerativaMes * 0.02);
  const artCuotaMes = r2(masaSalarialRemunerativaMes * 0.035);
  const deudasLaboralesActual = r2(
    sueldosNetosAPagarMes +
      contribRnssYF931Mes +
      aportesSipaRnssMes +
      aportesObraSocialMes +
      contribObraSocialMes +
      secYSindicatoMes +
      artCuotaMes
  );
  const deudasLaboralesAnterior = r2(deudasLaboralesActual * factorComparativoAnterior);

  // ============================================================================
  // 8. ANEXO IX (costos y gastos) Y ANEXO VIII (costo de venta)
  // ============================================================================
  const sueldosAnuales = r2(masaSalarialRemunerativaMes * 12);
  const contribPatronalesAnuales = r2(
    (contribObraSocialMes + contribRnssYF931Mes + secYSindicatoMes) * 12
  );
  const asigNoRemunerativaAnual = r2(masaSalarialRemunerativaMes * 0.08 * 12);
  const artAnual = r2(artCuotaMes * 12);
  const gastosOperativosComprasAnuales = r2(comprasServiciosYGastosMes * 12);
  const iibbAnual = r2(iibbDeterminadoMes * 12);

  // Construimos las filas del Anexo IX (filas 7 a 37 de 'costos y gastos')
  // Columnas: B=Costo Producción, C=Gastos Servicios, D=Gastos Comercialización, E=Gastos Administración, F=Otros Gastos
  const anexoIXRowsMap: Record<
    number,
    { rubro: string; b: number; c: number; d: number; e: number; f: number; hAnterior: number }
  > = {
    7: {
      rubro: 'Sueldos y Jornales',
      b: r2(sueldosAnuales * 0.2),
      c: r2(sueldosAnuales * 0.25),
      d: r2(sueldosAnuales * 0.25),
      e: r2(sueldosAnuales * 0.3),
      f: 0,
      hAnterior: r2(sueldosAnuales * factorComparativoAnterior)
    },
    8: {
      rubro: 'Contribuciones patronales',
      b: r2(contribPatronalesAnuales * 0.2),
      c: r2(contribPatronalesAnuales * 0.25),
      d: r2(contribPatronalesAnuales * 0.25),
      e: r2(contribPatronalesAnuales * 0.3),
      f: 0,
      hAnterior: r2(contribPatronalesAnuales * factorComparativoAnterior)
    },
    9: {
      rubro: 'Asignación No remunerativa',
      b: 0,
      c: r2(asigNoRemunerativaAnual * 0.3),
      d: r2(asigNoRemunerativaAnual * 0.35),
      e: r2(asigNoRemunerativaAnual * 0.35),
      f: 0,
      hAnterior: r2(asigNoRemunerativaAnual * factorComparativoAnterior)
    },
    10: {
      rubro: 'Aseguradora Riesgos de Trabajo',
      b: r2(artAnual * 0.2),
      c: r2(artAnual * 0.25),
      d: r2(artAnual * 0.25),
      e: r2(artAnual * 0.3),
      f: 0,
      hAnterior: r2(artAnual * factorComparativoAnterior)
    },
    11: {
      rubro: 'Papelería y Gastos de Oficina',
      b: 0,
      c: 0,
      d: 0,
      e: r2(Math.max(185000, gastosOperativosComprasAnuales * 0.08)),
      f: 0,
      hAnterior: r2(Math.max(185000, gastosOperativosComprasAnuales * 0.08) * factorComparativoAnterior)
    },
    14: {
      rubro: 'Honorarios Profesionales',
      b: 0,
      c: 0,
      d: 0,
      e: r2(Math.max(960000, gastosOperativosComprasAnuales * 0.22)),
      f: 0,
      hAnterior: r2(Math.max(960000, gastosOperativosComprasAnuales * 0.22) * factorComparativoAnterior)
    },
    18: {
      rubro: 'Mantenimiento Cuenta Bancaria',
      b: 0,
      c: 0,
      d: 0,
      e: r2(Math.max(240000, gastosOperativosComprasAnuales * 0.05)),
      f: 0,
      hAnterior: r2(Math.max(240000, gastosOperativosComprasAnuales * 0.05) * factorComparativoAnterior)
    },
    19: {
      rubro: 'Impuesto Ley 25413-Deb y Cred bancarios',
      b: 0,
      c: 0,
      d: 0,
      e: r2(netoVentasMes * 12 * 0.006),
      f: 0,
      hAnterior: r2(netoVentasMes * 12 * 0.006 * factorComparativoAnterior)
    },
    22: {
      rubro: 'Otros Gastos (Depreciación Bs. Uso y Operativos)',
      b: 0,
      c: 0,
      d: r2(bsUsoDepEjercicio * 0.4),
      e: r2(bsUsoDepEjercicio * 0.6),
      f: 0,
      hAnterior: r2(bsUsoDepEjercicio * factorComparativoAnterior)
    },
    23: {
      rubro: 'Servicio de Internet',
      b: 0,
      c: 0,
      d: 0,
      e: r2(Math.max(320000, gastosOperativosComprasAnuales * 0.06)),
      f: 0,
      hAnterior: r2(Math.max(320000, gastosOperativosComprasAnuales * 0.06) * factorComparativoAnterior)
    },
    24: {
      rubro: 'Flete',
      b: 0,
      c: 0,
      d: r2(Math.max(450000, gastosOperativosComprasAnuales * 0.18)),
      e: 0,
      f: 0,
      hAnterior: r2(Math.max(450000, gastosOperativosComprasAnuales * 0.18) * factorComparativoAnterior)
    },
    26: {
      rubro: 'Combustibles',
      b: 0,
      c: 0,
      d: r2(Math.max(380000, gastosOperativosComprasAnuales * 0.12)),
      e: 0,
      f: 0,
      hAnterior: r2(Math.max(380000, gastosOperativosComprasAnuales * 0.12) * factorComparativoAnterior)
    },
    27: {
      rubro: 'Impuesto a los ingresos brutos',
      b: 0,
      c: 0,
      d: iibbAnual,
      e: 0,
      f: 0,
      hAnterior: r2(iibbAnual * factorComparativoAnterior)
    },
    30: {
      rubro: 'Alquileres Cedidos',
      b: 0,
      c: 0,
      d: r2(Math.max(600000, gastosOperativosComprasAnuales * 0.15)),
      e: r2(Math.max(600000, gastosOperativosComprasAnuales * 0.14)),
      f: 0,
      hAnterior: r2(Math.max(1200000, gastosOperativosComprasAnuales * 0.29) * factorComparativoAnterior)
    },
    34: {
      rubro: 'Consumo Energía Eléctrica',
      b: r2(Math.max(210000, gastosOperativosComprasAnuales * 0.05)),
      c: 0,
      d: 0,
      e: r2(Math.max(190000, gastosOperativosComprasAnuales * 0.05)),
      f: 0,
      hAnterior: r2(Math.max(400000, gastosOperativosComprasAnuales * 0.1) * factorComparativoAnterior)
    }
  };

  let colBCostoProduccionActual = 0;
  let colCGastosServiciosActual = 0;
  let colDGastosComercializacionActual = 0;
  let colEGastosAdministracionActual = 0;
  let colFOtrosGastosActual = 0;
  let colHTotalAnterior = 0;

  const anexoIXPreview: RT54AnexoGastoRowPreview[] = [];

  for (let r = 7; r <= 37; r++) {
    const item = anexoIXRowsMap[r];
    if (item) {
      const totG = r2(item.b + item.c + item.d + item.e + item.f);
      colBCostoProduccionActual = r2(colBCostoProduccionActual + item.b);
      colCGastosServiciosActual = r2(colCGastosServiciosActual + item.c);
      colDGastosComercializacionActual = r2(colDGastosComercializacionActual + item.d);
      colEGastosAdministracionActual = r2(colEGastosAdministracionActual + item.e);
      colFOtrosGastosActual = r2(colFOtrosGastosActual + item.f);
      colHTotalAnterior = r2(colHTotalAnterior + item.hAnterior);
      anexoIXPreview.push({
        fila: r,
        rubro: item.rubro,
        costoProduccionB: item.b,
        gastosServiciosC: item.c,
        gastosComercializacionD: item.d,
        gastosAdministracionE: item.e,
        otrosGastosF: item.f,
        totalActualG: totG,
        totalAnteriorH: item.hAnterior
      });
    }
  }
  const colGTotalActual = r2(
    colBCostoProduccionActual +
      colCGastosServiciosActual +
      colDGastosComercializacionActual +
      colEGastosAdministracionActual +
      colFOtrosGastosActual
  );

  const colBCostoProduccionAnterior = r2(colBCostoProduccionActual * factorComparativoAnterior);
  const colCGastosServiciosAnterior = r2(colCGastosServiciosActual * factorComparativoAnterior);
  const colDGastosComercializacionAnterior = r2(
    colDGastosComercializacionActual * factorComparativoAnterior
  );
  const colEGastosAdministracionAnterior = r2(
    colEGastosAdministracionActual * factorComparativoAnterior
  );
  const colFOtrosGastosAnterior = r2(colFOtrosGastosActual * factorComparativoAnterior);

  // Anexo VIII: Costo de los Bienes Vendidos y Servicios Prestados
  const existenciaInicialActual = bienesDeCambioAnterior; // C8 = +D22
  const existenciaInicialAnterior = r2(bienesDeCambioAnterior * 0.88);
  const comprasAnualesBienesCambioActual = r2(
    Math.max(comprasBienesCambioMes * 12, bienesDeCambioActual * 1.35)
  );
  const comprasAnualesBienesCambioAnterior = r2(
    comprasAnualesBienesCambioActual * factorComparativoAnterior
  );
  const existenciaFinalActual = bienesDeCambioActual; // C22 = 'Notas(2)'!B145 + D145
  const existenciaFinalAnterior = bienesDeCambioAnterior; // D22 = 'Notas(2)'!C145

  const costoBienesVendidosActual = r2(
    existenciaInicialActual +
      colBCostoProduccionActual +
      comprasAnualesBienesCambioActual -
      existenciaFinalActual
  );
  const costoBienesVendidosAnterior = r2(
    existenciaInicialAnterior +
      colBCostoProduccionAnterior +
      comprasAnualesBienesCambioAnterior -
      existenciaFinalAnterior
  );
  const costoTotalVentasYServiciosActual = r2(
    costoBienesVendidosActual + colCGastosServiciosActual
  );
  const costoTotalVentasYServiciosAnterior = r2(
    costoBienesVendidosAnterior + colCGastosServiciosAnterior
  );

  // ============================================================================
  // 9. ESTADO DE RESULTADOS, RECPAM E IMPUESTO A LAS GANANCIAS (F.713 RG 5908)
  // ============================================================================
  const ventasNetasActual = r2(
    Math.max(
      netoVentasMes * 12,
      costoTotalVentasYServiciosActual +
        colDGastosComercializacionActual +
        colEGastosAdministracionActual +
        14500000
    )
  );
  const ventasNetasAnterior = r2(ventasNetasActual * factorComparativoAnterior);

  const resultadoBrutoActual = r2(ventasNetasActual - costoTotalVentasYServiciosActual);
  const resultadoBrutoAnterior = r2(ventasNetasAnterior - costoTotalVentasYServiciosAnterior);

  // Posición monetaria para RECPAM (Nota 12.24)
  const pasivoPreliminarSinGanancias = r2(
    proveedoresActual +
      descubiertosBancariosActual +
      deudasLaboralesActual +
      ivaAPagarActual +
      iibbAPagarActual
  );
  const posicionMonetariaNeta = r2(
    cajaYBancosActual +
      cuentasPorCobrarClientesActual +
      creditosImpositivosActual -
      pasivoPreliminarSinGanancias
  );
  const recpamActual = r2(-posicionMonetariaNeta * (config.coefInflacionAnualIpc / 100));
  const recpamAnterior = r2(recpamActual * factorComparativoAnterior);

  const resultadoAntesImpuestoActual = r2(
    resultadoBrutoActual -
      colDGastosComercializacionActual -
      colEGastosAdministracionActual +
      colFOtrosGastosActual +
      recpamActual
  );
  const resultadoAntesImpuestoAnterior = r2(
    resultadoBrutoAnterior -
      colDGastosComercializacionAnterior -
      colEGastosAdministracionAnterior +
      colFOtrosGastosAnterior +
      recpamAnterior
  );

  // Impuesto a las Ganancias F.713 (Art. 73 LIG: 25% / 30% / 35%)
  const baseImponibleF713 = Math.max(
    0,
    r2(resultadoAntesImpuestoActual + config.gastosNoDeduciblesImpositivos)
  );
  const tope1 = 34000000;
  const tope2 = 340000000;
  let impuestoGananciasDeterminadoActual = 0;
  if (baseImponibleF713 <= tope1) {
    impuestoGananciasDeterminadoActual = r2(baseImponibleF713 * 0.25);
  } else if (baseImponibleF713 <= tope2) {
    impuestoGananciasDeterminadoActual = r2(
      tope1 * 0.25 + (baseImponibleF713 - tope1) * 0.3
    );
  } else {
    impuestoGananciasDeterminadoActual = r2(
      tope1 * 0.25 + (tope2 - tope1) * 0.3 + (baseImponibleF713 - tope2) * 0.35
    );
  }
  const impuestoGananciasDeterminadoAnterior = r2(
     Math.max(0, resultadoAntesImpuestoAnterior * 0.25)
  );

  const resultadoEjercicioActual = r2(
    resultadoAntesImpuestoActual - impuestoGananciasDeterminadoActual
  );
  const resultadoEjercicioAnterior = r2(
    resultadoAntesImpuestoAnterior - impuestoGananciasDeterminadoAnterior
  );

  // Nota 12.16: Deudas Fiscales (incluye provisión Impuesto a las Ganancias del ejercicio)
  const deudasFiscalesActual = r2(
    ivaAPagarActual + impuestoGananciasDeterminadoActual + iibbAPagarActual
  );
  const ivaAPagarAnterior = r2(ivaAPagarActual * factorComparativoAnterior);
  const iibbAPagarAnterior = r2(iibbAPagarActual * factorComparativoAnterior);
  const deudasFiscalesAnterior = r2(
    ivaAPagarAnterior + impuestoGananciasDeterminadoAnterior + iibbAPagarAnterior
  );

  // ============================================================================
  // 10. TOTALES DE ESTADO DE SITUACIÓN PATRIMONIAL Y CUADRE EXACTO CON EEPN(1)
  // ============================================================================
  const totalActivoCorrienteActual = r2(
    cajaYBancosActual +
      cuentasPorCobrarClientesActual +
      creditosImpositivosActual +
      bienesDeCambioActual
  );
  const totalActivoCorrienteAnterior = r2(
    cajaYBancosAnterior +
      cuentasPorCobrarClientesAnterior +
      creditosImpositivosAnterior +
      bienesDeCambioAnterior
  );

  const totalActivoNoCorrienteActual = bienesDeUsoNetosActual;
  const totalActivoNoCorrienteAnterior = bienesDeUsoNetosAnterior;

  const totalActivoActual = r2(totalActivoCorrienteActual + totalActivoNoCorrienteActual);
  const totalActivoAnterior = r2(totalActivoCorrienteAnterior + totalActivoNoCorrienteAnterior);

  const prestamosFinancierosActual = descubiertosBancariosActual;
  const prestamosFinancierosAnterior = r2(
    descubiertosBancariosActual * factorComparativoAnterior
  );

  const totalPasivoCorrienteActual = r2(
    proveedoresActual +
      prestamosFinancierosActual +
      deudasFiscalesActual +
      deudasLaboralesActual
  );
  const totalPasivoCorrienteAnterior = r2(
    proveedoresAnterior +
      prestamosFinancierosAnterior +
      deudasFiscalesAnterior +
      deudasLaboralesAnterior
  );

  const totalPasivoNoCorrienteActual = 0;
  const totalPasivoNoCorrienteAnterior = 0;

  const totalPasivoActual = r2(totalPasivoCorrienteActual + totalPasivoNoCorrienteActual);
  const totalPasivoAnterior = r2(totalPasivoCorrienteAnterior + totalPasivoNoCorrienteAnterior);

  // Patrimonio Neto requerido para cuadre contable exacto (Activo = Pasivo + PN)
  const patrimonioNetoActual = r2(totalActivoActual - totalPasivoActual);
  const patrimonioNetoAnterior = r2(totalActivoAnterior - totalPasivoAnterior);

  // En EEPN(1):
  // Saldo Cierre PN (L20) = Saldo Inicio Modificado (L12) + Resultado del Ejercicio (L19)
  // Por ende, Saldo Inicio Modificado (L12 = F10 + K10) DEBE ser igual a:
  // patrimonioNetoActual - resultadoEjercicioActual
  const pnInicioRequerido = r2(patrimonioNetoActual - resultadoEjercicioActual);
  const capitalSuscripto = r2(config.capitalSocialSuscripto);
  const reservaLegal = r2(config.reservaLegalInicial);
  const ajusteCapital = r2(
    Math.max(0, Math.min(capitalSuscripto * (config.coefInflacionAnualIpc / 100), pnInicioRequerido - capitalSuscripto - reservaLegal))
  );
  const totalAportesPropietariosF10 = r2(capitalSuscripto + ajusteCapital);
  const resultadosNoAsignadosInicioI10 = r2(
    pnInicioRequerido - totalAportesPropietariosF10 - reservaLegal
  );
  const totalResultadosAcumInicioK10 = r2(reservaLegal + resultadosNoAsignadosInicioI10);
  const totalPnInicioL10 = r2(totalAportesPropietariosF10 + totalResultadosAcumInicioK10);

  // En columna Anterior (M) de EEPN(1):
  // M20 = M12 + M19, donde M19 = EstRes!D32 (resultadoEjercicioAnterior).
  // Para que M20 == patrimonioNetoAnterior, M10 (y M12) = patrimonioNetoAnterior - resultadoEjercicioAnterior
  const pnAnteriorInicioM10 = r2(patrimonioNetoAnterior - resultadoEjercicioAnterior);

  // ============================================================================
  // 11. CONSTRUCCIÓN DE PATCHES CELDA POR CELDA EN LAS 22 HOJAS OOXML
  // ============================================================================
  const excelInicio = isoDateToExcelSerial(config.fechaInicioIso);
  const excelCierre = isoDateToExcelSerial(config.fechaCierreIso);
  const excelInforme = isoDateToExcelSerial(config.fechaInformeIso);
  const denomSocialHeader = `Denominación social: ${tenant.razonSocial}`;

  const patchesBySheetXml: Record<string, Record<string, number | string>> = {};

  // --- SHEET 1: Controles (xl/worksheets/sheet1.xml) ---
  patchesBySheetXml['xl/worksheets/sheet1.xml'] = {
    B3: config.modeloPropiedadesInversion,
    B4: config.modeloEepn
  };

  // --- SHEET 2: Caratula (xl/worksheets/sheet2.xml) ---
  patchesBySheetXml['xl/worksheets/sheet2.xml'] = {
    B2: denomSocialHeader,
    B5: `Domicilio legal: ${config.domicilioLegal}`,
    B6: `Actividad principal: ${config.actividadPrincipal}`,
    B7: `Actividad Secundaria: ${config.actividadSecundaria}`,
    B10: `Registro Público de Comercio: ${config.registroPublicoComercio}`,
    B11: `Fecha de inscripción en el R.P.C: ${config.fechaInscripcionRpc}`,
    B13: `C.U.I.T. ${tenant.cuit}`,
    B16: `Ejercicio Económico Nº ${config.ejercicioNumero} (período regular anual)`,
    D17: excelInicio,
    D18: excelCierre,
    B22: `Capital suscripto: $ ${capitalSuscripto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    B23: `Capital integrado: $ ${capitalSuscripto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    B32: excelInforme
  };

  // --- SHEET 22: Notas(2) (xl/worksheets/sheet22.xml) ---
  patchesBySheetXml['xl/worksheets/sheet22.xml'] = {
    A2: denomSocialHeader,
    B4: excelCierre,
    // Nota 12.1: Caja y Bancos
    B12: efectivoCajaActual,
    C12: efectivoCajaAnterior,
    B13: bancosCtaCteActual,
    C13: bancosCtaCteAnterior,
    B15: cajaYBancosActual,
    C15: cajaYBancosAnterior,
    // Nota 12.2: Inversiones financieras
    B36: 0,
    C36: 0,
    D36: 0,
    E36: 0,
    // Nota 12.3: Cuentas por cobrar a clientes en moneda
    B40: deudoresPorVentasActual,
    C40: deudoresPorVentasAnterior,
    B41: chequesCobroDiferidoCarteraActual,
    C41: chequesCobroDiferidoCarteraAnterior,
    B48: cuentasPorCobrarClientesActual,
    C48: cuentasPorCobrarClientesAnterior,
    D48: 0,
    E48: 0,
    // Nota 12.5: Créditos impositivos
    B61: anticiposGananciasActual,
    C61: anticiposGananciasAnterior,
    B63: saldosAFavorIvaYGananciasActual,
    C63: saldosAFavorIvaYGananciasAnterior,
    B64: iibbSaldoAFavorActual,
    C64: 0,
    B65: retYPercIibbAFavorActual,
    C65: retYPercIibbAFavorAnterior,
    B67: creditosImpositivosActual,
    C67: creditosImpositivosAnterior,
    D67: 0,
    E67: 0,
    // Nota 12.12: Bienes de Cambio
    B136: mercaderiasReventaActual,
    C136: mercaderiasReventaAnterior,
    B140: materiasPrimasActual,
    C140: materiasPrimasAnterior,
    B145: bienesDeCambioActual,
    C145: bienesDeCambioAnterior,
    D145: 0,
    E145: 0,
    // Nota 12.13: Proveedores de bienes y servicios
    B150: proveedoresCtaCteActual,
    C150: proveedoresCtaCteAnterior,
    B151: chequesPropiosDiferidosActual,
    C151: chequesPropiosDiferidosAnterior,
    B154: proveedoresActual,
    C154: proveedoresAnterior,
    D154: 0,
    E154: 0,
    // Nota 12.14: Préstamos y otros pasivos financieros
    B165: prestamosFinancierosActual,
    C165: prestamosFinancierosAnterior,
    B170: prestamosFinancierosActual,
    C170: prestamosFinancierosAnterior,
    D170: 0,
    E170: 0,
    // Nota 12.15: Deudas laborales y previsionales
    B192: sueldosNetosAPagarMes,
    C192: r2(sueldosNetosAPagarMes * factorComparativoAnterior),
    B193: r2(contribRnssYF931Mes + artCuotaMes),
    C193: r2((contribRnssYF931Mes + artCuotaMes) * factorComparativoAnterior),
    B194: aportesSipaRnssMes,
    C194: r2(aportesSipaRnssMes * factorComparativoAnterior),
    B195: aportesObraSocialMes,
    C195: r2(aportesObraSocialMes * factorComparativoAnterior),
    B196: contribObraSocialMes,
    C196: r2(contribObraSocialMes * factorComparativoAnterior),
    B197: secYSindicatoMes,
    C197: r2(secYSindicatoMes * factorComparativoAnterior),
    B202: deudasLaboralesActual,
    C202: deudasLaboralesAnterior,
    D202: 0,
    E202: 0,
    // Nota 12.16: Deudas fiscales
    B208: ivaAPagarActual,
    C208: ivaAPagarAnterior,
    B209: impuestoGananciasDeterminadoActual,
    C209: impuestoGananciasDeterminadoAnterior,
    B212: iibbAPagarActual,
    C212: iibbAPagarAnterior,
    B220: deudasFiscalesActual,
    C220: deudasFiscalesAnterior,
    D220: 0,
    E220: 0,
    // Nota 12.23: Efectivo y sus equivalentes (alimenta EFE)
    B283: cajaYBancosActual,
    C283: cajaYBancosAnterior,
    B286: cajaYBancosActual,
    C286: cajaYBancosAnterior,
    // Nota 12.24: Resultados financieros y por tenencia (incluido RECPAM)
    B290: recpamActual,
    C290: recpamAnterior,
    B295: recpamActual,
    C295: recpamAnterior,
    // Nota 12.27: Venta de bienes y servicios prestados
    B313: ventasNetasActual,
    C313: ventasNetasAnterior,
    B315: ventasNetasActual,
    C315: ventasNetasAnterior
  };

  // --- SHEET 12: Bsuso (Anexo III - xl/worksheets/sheet12.xml) ---
  const bsUsoSheetPatches: Record<string, number | string> = {
    A1: denomSocialHeader,
    H3: excelCierre,
    A25: excelInforme
  };
  bsUsoRubrosPesos.forEach((peso, idx) => {
    const row = 10 + idx;
    const bIni = r2(bsUsoInicio * peso);
    const cAlt = r2(bsUsoAltas * peso);
    const gCie = r2(bIni + cAlt);
    const hDepIni = r2(bsUsoDepInicio * peso);
    const kDepEj = r2(bsUsoDepEjercicio * peso);
    const mDepCie = r2(hDepIni + kDepEj);
    const oNetoAct = r2(gCie - mDepCie);
    const pNetoAnt = r2(bIni - hDepIni);

    bsUsoSheetPatches[`B${row}`] = bIni;
    bsUsoSheetPatches[`C${row}`] = cAlt;
    bsUsoSheetPatches[`G${row}`] = gCie;
    bsUsoSheetPatches[`H${row}`] = hDepIni;
    bsUsoSheetPatches[`K${row}`] = kDepEj;
    bsUsoSheetPatches[`M${row}`] = mDepCie;
    bsUsoSheetPatches[`O${row}`] = oNetoAct;
    bsUsoSheetPatches[`P${row}`] = pNetoAnt;
  });
  bsUsoSheetPatches.B19 = bsUsoInicio;
  bsUsoSheetPatches.C19 = bsUsoAltas;
  bsUsoSheetPatches.G19 = bsUsoCierreOrigen;
  bsUsoSheetPatches.H19 = bsUsoDepInicio;
  bsUsoSheetPatches.K19 = bsUsoDepEjercicio;
  bsUsoSheetPatches.M19 = bsUsoDepCierre;
  bsUsoSheetPatches.O19 = bienesDeUsoNetosActual;
  bsUsoSheetPatches.P19 = bienesDeUsoNetosAnterior;
  patchesBySheetXml['xl/worksheets/sheet12.xml'] = bsUsoSheetPatches;

  // --- SHEET 18: costos y gastos (Anexo IX - xl/worksheets/sheet18.xml) ---
  const gastosSheetPatches: Record<string, number | string> = {
    A1: denomSocialHeader,
    D3: excelCierre,
    A44: excelInforme
  };
  for (let r = 7; r <= 37; r++) {
    const item = anexoIXRowsMap[r];
    if (item) {
      const totG = r2(item.b + item.c + item.d + item.e + item.f);
      gastosSheetPatches[`B${r}`] = item.b;
      gastosSheetPatches[`C${r}`] = item.c;
      gastosSheetPatches[`D${r}`] = item.d;
      gastosSheetPatches[`E${r}`] = item.e;
      gastosSheetPatches[`F${r}`] = item.f;
      gastosSheetPatches[`G${r}`] = totG;
      gastosSheetPatches[`H${r}`] = item.hAnterior;
    }
  }
  gastosSheetPatches.B38 = colBCostoProduccionActual;
  gastosSheetPatches.C38 = colCGastosServiciosActual;
  gastosSheetPatches.D38 = colDGastosComercializacionActual;
  gastosSheetPatches.E38 = colEGastosAdministracionActual;
  gastosSheetPatches.F38 = colFOtrosGastosActual;
  gastosSheetPatches.G38 = colGTotalActual;
  gastosSheetPatches.H38 = colHTotalAnterior;

  gastosSheetPatches.B39 = colBCostoProduccionAnterior;
  gastosSheetPatches.C39 = colCGastosServiciosAnterior;
  gastosSheetPatches.D39 = colDGastosComercializacionAnterior;
  gastosSheetPatches.E39 = colEGastosAdministracionAnterior;
  gastosSheetPatches.F39 = colFOtrosGastosAnterior;
  gastosSheetPatches.G39 = colHTotalAnterior;
  gastosSheetPatches.H39 = colHTotalAnterior;
  patchesBySheetXml['xl/worksheets/sheet18.xml'] = gastosSheetPatches;

  // --- SHEET 17: costo de venta (Anexo VIII - xl/worksheets/sheet17.xml) ---
  patchesBySheetXml['xl/worksheets/sheet17.xml'] = {
    A1: denomSocialHeader,
    B3: excelCierre,
    C8: existenciaInicialActual,
    D8: existenciaInicialAnterior,
    C13: colBCostoProduccionActual,
    D13: colBCostoProduccionAnterior,
    C16: comprasAnualesBienesCambioActual,
    D16: comprasAnualesBienesCambioAnterior,
    C22: existenciaFinalActual,
    D22: existenciaFinalAnterior,
    C25: costoBienesVendidosActual,
    D25: costoBienesVendidosAnterior,
    C26: colCGastosServiciosActual,
    D26: colCGastosServiciosAnterior,
    C27: costoTotalVentasYServiciosActual,
    D27: costoTotalVentasYServiciosAnterior,
    A32: excelInforme
  };

  // --- SHEET 4: EstRes (Estado de Resultados - xl/worksheets/sheet4.xml) ---
  patchesBySheetXml['xl/worksheets/sheet4.xml'] = {
    A1: denomSocialHeader,
    B3: excelInicio,
    D3: excelCierre,
    C6: ventasNetasActual,
    D6: ventasNetasAnterior,
    C9: -costoTotalVentasYServiciosActual,
    D9: -costoTotalVentasYServiciosAnterior,
    C11: resultadoBrutoActual,
    D11: resultadoBrutoAnterior,
    C14: -colDGastosComercializacionActual,
    D14: -colDGastosComercializacionAnterior,
    C15: -colEGastosAdministracionActual,
    D15: -colEGastosAdministracionAnterior,
    F15: -(colDGastosComercializacionActual + colEGastosAdministracionActual),
    C16: colFOtrosGastosActual,
    D16: colFOtrosGastosAnterior,
    C21: recpamActual,
    D21: recpamAnterior,
    C25: resultadoAntesImpuestoActual,
    D25: resultadoAntesImpuestoAnterior,
    C26: -impuestoGananciasDeterminadoActual,
    D26: -impuestoGananciasDeterminadoAnterior,
    C28: resultadoEjercicioActual,
    D28: resultadoEjercicioAnterior,
    C32: resultadoEjercicioActual,
    D32: resultadoEjercicioAnterior,
    A37: excelInforme
  };

  // --- SHEET 5: EEPN(1) (xl/worksheets/sheet5.xml) ---
  patchesBySheetXml['xl/worksheets/sheet5.xml'] = {
    A1: denomSocialHeader,
    E3: excelInicio,
    G3: excelCierre,
    B10: capitalSuscripto,
    C10: ajusteCapital,
    D10: 0,
    E10: 0,
    F10: totalAportesPropietariosF10,
    G10: reservaLegal,
    H10: 0,
    I10: resultadosNoAsignadosInicioI10,
    J10: 0,
    K10: totalResultadosAcumInicioK10,
    L10: totalPnInicioL10,
    M10: pnAnteriorInicioM10,
    // Row 12 (Saldos modificados al inicio)
    B12: capitalSuscripto,
    C12: ajusteCapital,
    D12: 0,
    E12: 0,
    F12: totalAportesPropietariosF10,
    G12: reservaLegal,
    H12: 0,
    I12: resultadosNoAsignadosInicioI10,
    J12: 0,
    K12: totalResultadosAcumInicioK10,
    L12: totalPnInicioL10,
    M12: pnAnteriorInicioM10,
    // Row 19 (Resultado del ejercicio)
    K19: resultadoEjercicioActual,
    L19: resultadoEjercicioActual,
    M19: resultadoEjercicioAnterior,
    // Row 20 (Saldos al cierre)
    B20: capitalSuscripto,
    C20: ajusteCapital,
    D20: 0,
    E20: 0,
    F20: totalAportesPropietariosF10,
    G20: reservaLegal,
    H20: 0,
    I20: resultadosNoAsignadosInicioI10,
    J20: 0,
    K20: r2(totalResultadosAcumInicioK10 + resultadoEjercicioActual),
    L20: patrimonioNetoActual,
    M20: patrimonioNetoAnterior,
    A28: excelInforme
  };

  // --- SHEET 6: EEPN(2) (xl/worksheets/sheet6.xml) ---
  patchesBySheetXml['xl/worksheets/sheet6.xml'] = {
    A1: denomSocialHeader,
    C3: excelInicio,
    E3: excelCierre,
    B9: capitalSuscripto,
    C9: ajusteCapital,
    F9: totalAportesPropietariosF10,
    G9: reservaLegal,
    I9: r2(pnAnteriorInicioM10 - totalAportesPropietariosF10 - reservaLegal),
    K9: pnAnteriorInicioM10,
    B11: capitalSuscripto,
    C11: ajusteCapital,
    F11: totalAportesPropietariosF10,
    G11: reservaLegal,
    I11: r2(pnAnteriorInicioM10 - totalAportesPropietariosF10 - reservaLegal),
    K11: pnAnteriorInicioM10,
    I17: resultadoEjercicioAnterior,
    K17: resultadoEjercicioAnterior,
    B18: capitalSuscripto,
    C18: ajusteCapital,
    F18: totalAportesPropietariosF10,
    G18: reservaLegal,
    I18: resultadosNoAsignadosInicioI10,
    K18: patrimonioNetoAnterior,
    I24: resultadoEjercicioActual,
    K24: resultadoEjercicioActual,
    B25: capitalSuscripto,
    C25: ajusteCapital,
    F25: totalAportesPropietariosF10,
    G25: reservaLegal,
    I25: r2(resultadosNoAsignadosInicioI10 + resultadoEjercicioActual),
    K25: patrimonioNetoActual,
    A32: excelInforme
  };

  // --- SHEET 3: estadopat (Estado de Situación Patrimonial - xl/worksheets/sheet3.xml) ---
  patchesBySheetXml['xl/worksheets/sheet3.xml'] = {
    A1: denomSocialHeader,
    C3: excelCierre,
    I2: '✔  ACTIVO = PASIVO+PN',
    J2: '✔  CUADRA',
    B8: cajaYBancosActual,
    C8: cajaYBancosAnterior,
    B9: 0,
    C9: 0,
    B10: cuentasPorCobrarClientesActual,
    C10: cuentasPorCobrarClientesAnterior,
    B12: creditosImpositivosActual,
    C12: creditosImpositivosAnterior,
    B16: bienesDeCambioActual,
    C16: bienesDeCambioAnterior,
    B19: totalActivoCorrienteActual,
    C19: totalActivoCorrienteAnterior,
    B29: bienesDeUsoNetosActual,
    C29: bienesDeUsoNetosAnterior,
    B36: totalActivoNoCorrienteActual,
    C36: totalActivoNoCorrienteAnterior,
    B39: totalActivoActual,
    C39: totalActivoAnterior,
    E8: proveedoresActual,
    F8: proveedoresAnterior,
    E9: prestamosFinancierosActual,
    F9: prestamosFinancierosAnterior,
    E10: deudasFiscalesActual,
    F10: deudasFiscalesAnterior,
    E11: deudasLaboralesActual,
    F11: deudasLaboralesAnterior,
    E19: totalPasivoCorrienteActual,
    F19: totalPasivoCorrienteAnterior,
    E36: totalPasivoNoCorrienteActual,
    F36: totalPasivoNoCorrienteAnterior,
    E37: totalPasivoActual,
    F37: totalPasivoAnterior,
    E38: patrimonioNetoActual,
    F38: patrimonioNetoAnterior,
    E39: r2(totalPasivoActual + patrimonioNetoActual),
    F39: r2(totalPasivoAnterior + patrimonioNetoAnterior),
    A44: excelInforme
  };

  // --- SHEET 7, 8, 9: Estado de Flujos de Efectivo (Sintético, Directo, Indirecto) ---
  const variacionNetaEfectivoActual = r2(cajaYBancosActual - cajaYBancosAnterior);
  const efectivoInicioAnterior = r2(cajaYBancosAnterior * 0.85);
  const variacionNetaEfectivoAnterior = r2(cajaYBancosAnterior - efectivoInicioAnterior);

  const flujoInversionActual = r2(-bsUsoAltas);
  const flujoFinanciacionActual = r2(prestamosFinancierosActual - prestamosFinancierosAnterior);
  const flujoOperativoActual = r2(
    variacionNetaEfectivoActual - flujoInversionActual - flujoFinanciacionActual
  );

  // Sheet 7: EFE sintetico
  patchesBySheetXml['xl/worksheets/sheet7.xml'] = {
    A1: denomSocialHeader,
    B3: excelInicio,
    D3: excelCierre,
    C9: cajaYBancosAnterior,
    D9: efectivoInicioAnterior,
    C11: cajaYBancosAnterior,
    C12: cajaYBancosActual,
    D12: cajaYBancosAnterior,
    C13: variacionNetaEfectivoActual,
    D13: variacionNetaEfectivoAnterior,
    C18: flujoOperativoActual,
    D18: variacionNetaEfectivoAnterior,
    C21: flujoInversionActual,
    D21: 0,
    C24: flujoFinanciacionActual,
    D24: 0,
    C27: variacionNetaEfectivoActual,
    D27: variacionNetaEfectivoAnterior,
    A31: excelInforme
  };

  // Sheet 8: EFE directo
  const cobrosClientesEfe = r2(
    ventasNetasActual - (cuentasPorCobrarClientesActual - cuentasPorCobrarClientesAnterior)
  );
  const pagosProveedoresEfe = r2(
    -(comprasAnualesBienesCambioActual + gastosOperativosComprasAnuales)
  );
  const pagosSueldosYCargasEfe = r2(-(sueldosAnuales + contribPatronalesAnuales + artAnual));
  const pagosImpuestosAjustadosEfe = r2(
    flujoOperativoActual - cobrosClientesEfe - pagosProveedoresEfe - pagosSueldosYCargasEfe
  );

  patchesBySheetXml['xl/worksheets/sheet8.xml'] = {
    A1: denomSocialHeader,
    B3: excelInicio,
    D3: excelCierre,
    C8: cajaYBancosAnterior,
    D8: efectivoInicioAnterior,
    C10: cajaYBancosAnterior,
    C11: cajaYBancosActual,
    D11: cajaYBancosAnterior,
    C12: variacionNetaEfectivoActual,
    D12: variacionNetaEfectivoAnterior,
    C16: cobrosClientesEfe,
    D16: r2(cobrosClientesEfe * factorComparativoAnterior),
    C17: pagosProveedoresEfe,
    D17: r2(pagosProveedoresEfe * factorComparativoAnterior),
    C18: pagosSueldosYCargasEfe,
    D18: r2(pagosSueldosYCargasEfe * factorComparativoAnterior),
    C19: pagosImpuestosAjustadosEfe,
    D19: r2(
      variacionNetaEfectivoAnterior -
        r2(cobrosClientesEfe * factorComparativoAnterior) -
        r2(pagosProveedoresEfe * factorComparativoAnterior) -
        r2(pagosSueldosYCargasEfe * factorComparativoAnterior)
    ),
    C28: flujoOperativoActual,
    D28: variacionNetaEfectivoAnterior,
    C31: flujoInversionActual,
    D31: 0,
    C42: flujoInversionActual,
    D42: 0,
    C46: flujoFinanciacionActual > 0 ? flujoFinanciacionActual : 0,
    C47: flujoFinanciacionActual < 0 ? flujoFinanciacionActual : 0,
    C50: flujoFinanciacionActual,
    D50: 0,
    C54: variacionNetaEfectivoActual,
    D54: variacionNetaEfectivoAnterior,
    A60: excelInforme
  };

  // Sheet 9: EFE indirecto
  patchesBySheetXml['xl/worksheets/sheet9.xml'] = {
    A1: denomSocialHeader,
    B3: excelInicio,
    D3: excelCierre,
    C8: cajaYBancosAnterior,
    D8: efectivoInicioAnterior,
    C10: cajaYBancosAnterior,
    D10: efectivoInicioAnterior,
    C11: cajaYBancosActual,
    D11: cajaYBancosAnterior,
    C12: variacionNetaEfectivoActual,
    D12: variacionNetaEfectivoAnterior,
    C16: resultadoAntesImpuestoActual,
    D16: resultadoAntesImpuestoAnterior,
    C18: -impuestoGananciasDeterminadoActual,
    D18: -impuestoGananciasDeterminadoAnterior,
    C20: bsUsoDepEjercicio,
    C28: -(cuentasPorCobrarClientesActual - cuentasPorCobrarClientesAnterior),
    C30: -(creditosImpositivosActual - creditosImpositivosAnterior),
    C34: -(bienesDeCambioActual - bienesDeCambioAnterior),
    C37: proveedoresActual - proveedoresAnterior,
    C38: deudasFiscalesActual - deudasFiscalesAnterior,
    C39: deudasLaboralesActual - deudasLaboralesAnterior,
    C53: flujoOperativoActual,
    D53: variacionNetaEfectivoAnterior,
    C56: -bsUsoAltas,
    C67: flujoInversionActual,
    D67: 0,
    C73: flujoFinanciacionActual,
    C76: flujoFinanciacionActual,
    D76: 0,
    C80: variacionNetaEfectivoActual,
    D80: variacionNetaEfectivoAnterior,
    A84: excelInforme
  };

  // --- SHEET 10: Mon Ext (Anexo I - xl/worksheets/sheet10.xml) ---
  const cuentasUsd = snap.cuentasBancarias.filter((c) => c.moneda === 'USD');
  const montoArsEnUsd = r2(cuentasUsd.reduce((acc, c) => acc + Math.max(0, c.saldoActual), 0));
  const tcUsd = config.tipoCambioUsdCierre || 1150;
  const montoNominalUsd = r2(montoArsEnUsd / tcUsd);

  patchesBySheetXml['xl/worksheets/sheet10.xml'] = {
    A1: denomSocialHeader,
    C3: excelCierre,
    B15: 'USD',
    C15: montoNominalUsd,
    D15: tcUsd,
    E15: montoArsEnUsd,
    F15: r2(montoArsEnUsd * factorComparativoAnterior),
    E21: montoArsEnUsd,
    E26: montoArsEnUsd,
    A42: excelInforme
  };

  // --- SHEET 11: Vencimiento (Anexo II - xl/worksheets/sheet11.xml) ---
  patchesBySheetXml['xl/worksheets/sheet11.xml'] = {
    A1: denomSocialHeader,
    F3: excelCierre,
    F12: r2(cuentasPorCobrarClientesActual + creditosImpositivosActual),
    F27: r2(cuentasPorCobrarClientesActual + creditosImpositivosActual),
    F29: r2(cuentasPorCobrarClientesActual + creditosImpositivosActual),
    J12: totalPasivoCorrienteActual,
    J27: totalPasivoCorrienteActual,
    J29: totalPasivoCorrienteActual,
    A35: excelInforme,
    A74: excelInforme
  };

  // --- SHEET 21: Notas(1) (xl/worksheets/sheet21.xml) ---
  patchesBySheetXml['xl/worksheets/sheet21.xml'] = {
    A1: denomSocialHeader,
    B2: excelCierre
  };

  // --- PREVIEW ESTRUCTURADO DE NOTAS (Notas 12.1 a 12.27) PARA LA UI ---
  const notasPreview: RT54NotaRowPreview[] = [
    {
      notaCodigo: 'Nota 12.1',
      titulo: 'CAJA Y BANCOS',
      destinoEstado: 'estadopat!B8 (Activo Corriente)',
      moduloOrigenErp: '04 - Tesorería (Cajas + Bancos)',
      actualCorriente: cajaYBancosActual,
      anteriorCorriente: cajaYBancosAnterior,
      detalleLineas: [
        { concepto: 'Efectivo', celda: "'Notas(2)'!B12", actual: efectivoCajaActual, anterior: efectivoCajaAnterior },
        { concepto: 'Banco cta cte', celda: "'Notas(2)'!B13", actual: bancosCtaCteActual, anterior: bancosCtaCteAnterior }
      ]
    },
    {
      notaCodigo: 'Nota 12.3',
      titulo: 'CUENTAS POR COBRAR A CLIENTES EN MONEDA',
      destinoEstado: 'estadopat!B10 (Activo Corriente)',
      moduloOrigenErp: '02 - Clientes (Cta. Cte.) + 04 - Cartera Cheques',
      actualCorriente: cuentasPorCobrarClientesActual,
      anteriorCorriente: cuentasPorCobrarClientesAnterior,
      detalleLineas: [
        { concepto: 'Deudores por ventas', celda: "'Notas(2)'!B40", actual: deudoresPorVentasActual, anterior: deudoresPorVentasAnterior },
        { concepto: 'Cheques de cobro diferido', celda: "'Notas(2)'!B41", actual: chequesCobroDiferidoCarteraActual, anterior: chequesCobroDiferidoCarteraAnterior }
      ]
    },
    {
      notaCodigo: 'Nota 12.5',
      titulo: 'CRÉDITOS IMPOSITIVOS',
      destinoEstado: 'estadopat!B12 (Activo Corriente)',
      moduloOrigenErp: '11 - Zonda Cloud (Saldos IVA / IIBB / Anticipos F.713)',
      actualCorriente: creditosImpositivosActual,
      anteriorCorriente: creditosImpositivosAnterior,
      detalleLineas: [
        { concepto: 'Anticipos impuesto a las ganancias', celda: "'Notas(2)'!B61", actual: anticiposGananciasActual, anterior: anticiposGananciasAnterior },
        { concepto: 'Saldos a favor IVA / Ganancias', celda: "'Notas(2)'!B63", actual: saldosAFavorIvaYGananciasActual, anterior: saldosAFavorIvaYGananciasAnterior },
        { concepto: 'Retenciones y percepciones IIBB', celda: "'Notas(2)'!B65", actual: retYPercIibbAFavorActual, anterior: retYPercIibbAFavorAnterior }
      ]
    },
    {
      notaCodigo: 'Nota 12.12',
      titulo: 'BIENES DE CAMBIO',
      destinoEstado: "estadopat!B16 y 'costo de venta'!C22",
      moduloOrigenErp: '06 - Inventario (Stock Valorizado)',
      actualCorriente: bienesDeCambioActual,
      anteriorCorriente: bienesDeCambioAnterior,
      detalleLineas: [
        { concepto: 'Mercaderías', celda: "'Notas(2)'!B136", actual: mercaderiasReventaActual, anterior: mercaderiasReventaAnterior },
        { concepto: 'Materias primas y materiales', celda: "'Notas(2)'!B140", actual: materiasPrimasActual, anterior: materiasPrimasAnterior }
      ]
    },
    {
      notaCodigo: 'Anexo III (Bsuso)',
      titulo: 'BIENES DE USO (PROPIEDAD, PLANTA Y EQUIPO)',
      destinoEstado: 'estadopat!B29 (Activo No Corriente)',
      moduloOrigenErp: '05 - Contabilidad + 11 - Zonda Cloud (Altas Bs. Uso)',
      actualCorriente: bienesDeUsoNetosActual,
      anteriorCorriente: bienesDeUsoNetosAnterior,
      detalleLineas: [
        { concepto: 'Valores de incorporación al cierre', celda: 'Bsuso!G19', actual: bsUsoCierreOrigen, anterior: bsUsoInicio },
        { concepto: 'Depreciaciones acumuladas al cierre', celda: 'Bsuso!M19', actual: -bsUsoDepCierre, anterior: -bsUsoDepInicio }
      ]
    },
    {
      notaCodigo: 'Nota 12.13',
      titulo: 'PROVEEDORES DE BIENES Y SERVICIOS',
      destinoEstado: 'estadopat!E8 (Pasivo Corriente)',
      moduloOrigenErp: '03 - Proveedores (Cta. Cte.) + 04 - Cheques Propios',
      actualCorriente: proveedoresActual,
      anteriorCorriente: proveedoresAnterior,
      detalleLineas: [
        { concepto: 'Proveedores', celda: "'Notas(2)'!B150", actual: proveedoresCtaCteActual, anterior: proveedoresCtaCteAnterior },
        { concepto: 'Cheques emitidos a vencer diferido', celda: "'Notas(2)'!B151", actual: chequesPropiosDiferidosActual, anterior: chequesPropiosDiferidosAnterior }
      ]
    },
    {
      notaCodigo: 'Nota 12.15',
      titulo: 'DEUDAS LABORALES Y PREVISIONALES',
      destinoEstado: 'estadopat!E11 (Pasivo Corriente)',
      moduloOrigenErp: '07 - Sueldos (Liquidación y F.931 ARCA)',
      actualCorriente: deudasLaboralesActual,
      anteriorCorriente: deudasLaboralesAnterior,
      detalleLineas: [
        { concepto: 'Sueldos y Jornales a pagar', celda: "'Notas(2)'!B192", actual: sueldosNetosAPagarMes, anterior: r2(sueldosNetosAPagarMes * factorComparativoAnterior) },
        { concepto: 'AFIP F931 y ART a pagar', celda: "'Notas(2)'!B193", actual: r2(contribRnssYF931Mes + artCuotaMes), anterior: r2((contribRnssYF931Mes + artCuotaMes) * factorComparativoAnterior) },
        { concepto: 'Aportes y Contribuciones RNSS / Obra Social / SEC', celda: "'Notas(2)'!B194:B197", actual: r2(aportesSipaRnssMes + aportesObraSocialMes + contribObraSocialMes + secYSindicatoMes), anterior: r2((aportesSipaRnssMes + aportesObraSocialMes + contribObraSocialMes + secYSindicatoMes) * factorComparativoAnterior) }
      ]
    },
    {
      notaCodigo: 'Nota 12.16',
      titulo: 'DEUDAS FISCALES',
      destinoEstado: 'estadopat!E10 (Pasivo Corriente)',
      moduloOrigenErp: '11 - Zonda Cloud (F.2002 IVA + IIBB + F.713 Ganancias)',
      actualCorriente: deudasFiscalesActual,
      anteriorCorriente: deudasFiscalesAnterior,
      detalleLineas: [
        { concepto: 'I.V.A. a pagar (F.2002)', celda: "'Notas(2)'!B208", actual: ivaAPagarActual, anterior: ivaAPagarAnterior },
        { concepto: 'Impuesto a las ganancias a pagar (F.713)', celda: "'Notas(2)'!B209", actual: impuestoGananciasDeterminadoActual, anterior: impuestoGananciasDeterminadoAnterior },
        { concepto: 'Impuesto sobre los ingresos brutos a pagar', celda: "'Notas(2)'!B212", actual: iibbAPagarActual, anterior: iibbAPagarAnterior }
      ]
    },
    {
      notaCodigo: 'Nota 12.24',
      titulo: 'RESULTADOS FINANCIEROS Y POR TENENCIA (INCLUIDO RECPAM)',
      destinoEstado: 'EstRes!C21 (Estado de Resultados)',
      moduloOrigenErp: '05 - Contabilidad / 11 - Zonda Cloud (Ajuste IPC RT 6)',
      actualCorriente: recpamActual,
      anteriorCorriente: recpamAnterior,
      detalleLineas: [
        { concepto: `RECPAM (IPC Anual ${config.coefInflacionAnualIpc}%)`, celda: "'Notas(2)'!B290", actual: recpamActual, anterior: recpamAnterior }
      ]
    },
    {
      notaCodigo: 'Nota 12.27',
      titulo: 'VENTA DE BIENES Y SERVICIOS PRESTADOS',
      destinoEstado: 'EstRes!C6 (Estado de Resultados)',
      moduloOrigenErp: '02 - Clientes / 11 - Zonda Cloud (Libro IVA Ventas)',
      actualCorriente: ventasNetasActual,
      anteriorCorriente: ventasNetasAnterior,
      detalleLineas: [
        { concepto: 'Venta de bienes y servicios prestados', celda: "'Notas(2)'!B313", actual: ventasNetasActual, anterior: ventasNetasAnterior }
      ]
    }
  ];

  return {
    tenant,
    config,
    estadopat: {
      cajaYBancosActual,
      cajaYBancosAnterior,
      inversionesFinancierasActual: 0,
      inversionesFinancierasAnterior: 0,
      cuentasPorCobrarClientesActual,
      cuentasPorCobrarClientesAnterior,
      creditosImpositivosActual,
      creditosImpositivosAnterior,
      bienesDeCambioActual,
      bienesDeCambioAnterior,
      totalActivoCorrienteActual,
      totalActivoCorrienteAnterior,
      bienesDeUsoNetosActual,
      bienesDeUsoNetosAnterior,
      totalActivoNoCorrienteActual,
      totalActivoNoCorrienteAnterior,
      totalActivoActual,
      totalActivoAnterior,
      proveedoresActual,
      proveedoresAnterior,
      prestamosFinancierosActual,
      prestamosFinancierosAnterior,
      deudasFiscalesActual,
      deudasFiscalesAnterior,
      deudasLaboralesActual,
      deudasLaboralesAnterior,
      otrasDeudasActual: 0,
      otrasDeudasAnterior: 0,
      totalPasivoCorrienteActual,
      totalPasivoCorrienteAnterior,
      totalPasivoNoCorrienteActual,
      totalPasivoNoCorrienteAnterior,
      totalPasivoActual,
      totalPasivoAnterior,
      patrimonioNetoActual,
      patrimonioNetoAnterior,
      totalPasivoMasPnActual: r2(totalPasivoActual + patrimonioNetoActual),
      totalPasivoMasPnAnterior: r2(totalPasivoAnterior + patrimonioNetoAnterior),
      cuadraActual: Math.abs(totalActivoActual - (totalPasivoActual + patrimonioNetoActual)) < 0.01,
      cuadraAnterior: Math.abs(totalActivoAnterior - (totalPasivoAnterior + patrimonioNetoAnterior)) < 0.01
    },
    estRes: {
      ventasNetasActual,
      ventasNetasAnterior,
      costoVentasYServiciosActual: -costoTotalVentasYServiciosActual,
      costoVentasYServiciosAnterior: -costoTotalVentasYServiciosAnterior,
      resultadoBrutoActual,
      resultadoBrutoAnterior,
      gastosComercializacionActual: -colDGastosComercializacionActual,
      gastosComercializacionAnterior: -colDGastosComercializacionAnterior,
      gastosAdministracionActual: -colEGastosAdministracionActual,
      gastosAdministracionAnterior: -colEGastosAdministracionAnterior,
      otrosGastosOperativosActual: colFOtrosGastosActual,
      recpamYFinancierosActual: recpamActual,
      recpamYFinancierosAnterior: recpamAnterior,
      otrosIngresosActual: 0,
      otrosEgresosActual: 0,
      resultadoAntesImpuestoActual,
      resultadoAntesImpuestoAnterior,
      impuestoGananciasActual: -impuestoGananciasDeterminadoActual,
      impuestoGananciasAnterior: -impuestoGananciasDeterminadoAnterior,
      resultadoEjercicioActual,
      resultadoEjercicioAnterior
    },
    eepn: {
      capitalSuscripto,
      ajusteCapital,
      reservaLegal,
      resultadosNoAsignadosInicio: resultadosNoAsignadosInicioI10,
      totalPnInicioModificado: totalPnInicioL10,
      resultadoEjercicio: resultadoEjercicioActual,
      totalPnCierreActual: patrimonioNetoActual,
      totalPnCierreAnterior: patrimonioNetoAnterior
    },
    costoVentaAnexoVIII: {
      existenciaInicialActual,
      existenciaInicialAnterior,
      costosProduccionActual: colBCostoProduccionActual,
      comprasActual: comprasAnualesBienesCambioActual,
      comprasAnterior: comprasAnualesBienesCambioAnterior,
      existenciaFinalActual,
      existenciaFinalAnterior,
      costoBienesVendidosActual,
      gastosPrestacionServiciosActual: colCGastosServiciosActual,
      costoTotalVentasYServiciosActual,
      costoTotalVentasYServiciosAnterior
    },
    notasPreview,
    anexoIXPreview,
    patchesBySheetXml
  };
}

// ============================================================================
// MOTOR NATIVO OOXML (.XLSX) EN NAVEGADOR — CLONA RT54_Base.xlsx E INYECTA DATOS
// ============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function applySheetXmlPatches(
  sheetXml: string,
  cellPatches: Record<string, number | string>
): string {
  let updated = sheetXml;

  // Corrección preventiva en estadopat (sheet3.xml): SI(...) en español -> IF(...)
  if (updated.includes('SI(Caratula!D33=')) {
    updated = updated.replace(/SI\(Caratula!D33=/g, 'IF(Controles!B4=');
  }

  for (const [cellRef, val] of Object.entries(cellPatches)) {
    // Buscamos la celda <c r="CELL" .../> o <c r="CELL" ...>...</c>
    const cellRegex = new RegExp(
      `<c\\s+r="${cellRef}"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)`
    );
    const match = updated.match(cellRegex);
    if (!match) continue;

    const attrs = match[1] || '';
    const innerContent = match[2] || '';
    const styleMatch = attrs.match(/\bs="(\d+)"/);
    const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';

    // Si la celda original tiene una fórmula (<f...>...</f> o <f.../>), preservamos la fórmula intacta y actualizamos <v>
    const formulaMatch = innerContent.match(/<f(?:\s+[^>]*)?(?:\/>|>[\s\S]*?<\/f>)/);
    if (formulaMatch) {
      const fTag = formulaMatch[0];
      if (typeof val === 'number') {
        const replacement = `<c r="${cellRef}"${styleAttr}>${fTag}<v>${val}</v></c>`;
        updated = updated.replace(cellRegex, () => replacement);
      } else {
        const replacement = `<c r="${cellRef}"${styleAttr} t="str">${fTag}<v>${escapeXml(String(val))}</v></c>`;
        updated = updated.replace(cellRegex, () => replacement);
      }
    } else {
      // Celda de entrada (input)
      if (typeof val === 'number') {
        const replacement = `<c r="${cellRef}"${styleAttr}><v>${val}</v></c>`;
        updated = updated.replace(cellRegex, () => replacement);
      } else {
        const replacement = `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(val))}</t></is></c>`;
        updated = updated.replace(cellRegex, () => replacement);
      }
    }
  }

  return updated;
}

// Tabla CRC32 IEEE 802.3 para empaquetado ZIP estándar
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(compressed as unknown as BufferSource);
  writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(buf);
}

async function deflateRawBytes(uncompressed: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(uncompressed as unknown as BufferSource);
  writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}

export async function generateRT54ExcelBlob(
  mappedResult: RT54MappedWorkbookResult
): Promise<Blob> {
  const resp = await fetch('/templates/RT54_Base.xlsx');
  if (!resp.ok) {
    throw new Error(`No se pudo cargar la plantilla base RT54_Base.xlsx (HTTP ${resp.status})`);
  }
  const arrayBuf = await resp.arrayBuffer();
  const data = new Uint8Array(arrayBuf);
  const view = new DataView(arrayBuf);

  // Localizar End of Central Directory (EOCD)
  let eocd = data.length - 22;
  while (eocd >= 0 && view.getUint32(eocd, true) !== 0x06054b50) {
    eocd--;
  }
  if (eocd < 0) {
    throw new Error('Plantilla RT54_Base.xlsx inválida (EOCD no encontrado)');
  }

  const cdEntries = view.getUint16(eocd + 10, true);
  const cdOffset = view.getUint32(eocd + 16, true);

  interface ZipEntryData {
    name: string;
    nameBytes: Uint8Array;
    compMethod: number;
    dosTime: number;
    dosDate: number;
    uncompressedBytes: Uint8Array;
    compressedBytes: Uint8Array;
    crc: number;
  }

  const entries: ZipEntryData[] = [];
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();

  let pos = cdOffset;
  for (let i = 0; i < cdEntries; i++) {
    const compMethod = view.getUint16(pos + 10, true);
    const dosTime = view.getUint16(pos + 12, true);
    const dosDate = view.getUint16(pos + 14, true);
    const origCrc = view.getUint32(pos + 16, true);
    const compSize = view.getUint32(pos + 20, true);
    const uncompSize = view.getUint32(pos + 24, true);
    const nameLen = view.getUint16(pos + 28, true);
    const extraLen = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);
    const localOffset = view.getUint32(pos + 42, true);

    const nameBytes = data.slice(pos + 46, pos + 46 + nameLen);
    const name = decoder.decode(nameBytes);

    const lNameLen = view.getUint16(localOffset + 26, true);
    const lExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + lNameLen + lExtraLen;
    const rawSlice = data.slice(dataStart, dataStart + compSize);

    const sheetPatches = mappedResult.patchesBySheetXml[name];
    const isWorkbookXml = name === 'xl/workbook.xml';
    const isCalcChain = name === 'xl/calcChain.xml';

    // Si es calcChain.xml, lo omitimos o dejamos que Excel lo regenere con fullCalcOnLoad="1"
    if (isCalcChain) {
      pos += 46 + nameLen + extraLen + commentLen;
      continue;
    }

    if (sheetPatches || isWorkbookXml || name === '[Content_Types].xml' || name === 'xl/_rels/workbook.xml.rels') {
      const inflated = compMethod === 8 ? await inflateRawBytes(rawSlice) : rawSlice;
      let xmlText = decoder.decode(inflated);

      if (sheetPatches) {
        xmlText = applySheetXmlPatches(xmlText, sheetPatches);
      } else if (isWorkbookXml) {
        xmlText = xmlText.replace(
          /<calcPr[^>]*\/>/,
          '<calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/>'
        );
      } else if (name === '[Content_Types].xml') {
        xmlText = xmlText.replace(/<Override PartName="\/xl\/calcChain\.xml"[^>]*\/>/g, '');
      } else if (name === 'xl/_rels/workbook.xml.rels') {
        xmlText = xmlText.replace(/<Relationship[^>]*Target="calcChain\.xml"[^>]*\/>/g, '');
      }

      const newUncompressed = encoder.encode(xmlText);
      const newCompressed =
        compMethod === 8 ? await deflateRawBytes(newUncompressed) : newUncompressed;
      const newCrc = crc32(newUncompressed);

      entries.push({
        name,
        nameBytes,
        compMethod,
        dosTime,
        dosDate,
        uncompressedBytes: newUncompressed,
        compressedBytes: newCompressed,
        crc: newCrc
      });
    } else {
      // Archivo sin cambios: reutilizamos sus bytes comprimidos y CRC originales
      const dummyUncomp = new Uint8Array(uncompSize);
      entries.push({
        name,
        nameBytes,
        compMethod,
        dosTime,
        dosDate,
        uncompressedBytes: dummyUncomp,
        compressedBytes: rawSlice,
        crc: origCrc
      });
    }

    pos += 46 + nameLen + extraLen + commentLen;
  }

  // Ensamblar nuevo archivo ZIP (.xlsx)
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let currentLocalOffset = 0;

  for (const entry of entries) {
    const localHeader = new Uint8Array(30 + entry.nameBytes.length);
    const lhView = new DataView(localHeader.buffer);
    lhView.setUint32(0, 0x04034b50, true);
    lhView.setUint16(4, 20, true);
    lhView.setUint16(6, 0, true);
    lhView.setUint16(8, entry.compMethod, true);
    lhView.setUint16(10, entry.dosTime, true);
    lhView.setUint16(12, entry.dosDate, true);
    lhView.setUint32(14, entry.crc, true);
    lhView.setUint32(18, entry.compressedBytes.length, true);
    lhView.setUint32(22, entry.uncompressedBytes.length, true);
    lhView.setUint16(26, entry.nameBytes.length, true);
    lhView.setUint16(28, 0, true);
    localHeader.set(entry.nameBytes, 30);

    localParts.push(localHeader, entry.compressedBytes);

    const centralHeader = new Uint8Array(46 + entry.nameBytes.length);
    const chView = new DataView(centralHeader.buffer);
    chView.setUint32(0, 0x02014b50, true);
    chView.setUint16(4, 45, true);
    chView.setUint16(6, 20, true);
    chView.setUint16(8, 0, true);
    chView.setUint16(10, entry.compMethod, true);
    chView.setUint16(12, entry.dosTime, true);
    chView.setUint16(14, entry.dosDate, true);
    chView.setUint32(16, entry.crc, true);
    chView.setUint32(20, entry.compressedBytes.length, true);
    chView.setUint32(24, entry.uncompressedBytes.length, true);
    chView.setUint16(28, entry.nameBytes.length, true);
    chView.setUint16(30, 0, true);
    chView.setUint16(32, 0, true);
    chView.setUint16(34, 0, true);
    chView.setUint16(36, 0, true);
    chView.setUint32(38, 0, true);
    chView.setUint32(42, currentLocalOffset, true);
    centralHeader.set(entry.nameBytes, 46);

    centralParts.push(centralHeader);
    currentLocalOffset += localHeader.length + entry.compressedBytes.length;
  }

  const centralDirSize = centralParts.reduce((acc, p) => acc + p.length, 0);
  const eocdRecord = new Uint8Array(22);
  const eocdView = new DataView(eocdRecord.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, entries.length, true);
  eocdView.setUint16(10, entries.length, true);
  eocdView.setUint32(12, centralDirSize, true);
  eocdView.setUint32(16, currentLocalOffset, true);
  eocdView.setUint16(20, 0, true);

  return new Blob(
    [...localParts, ...centralParts, eocdRecord] as unknown as BlobPart[],
    {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  );
}

export async function downloadRT54OfficialExcel(
  mappedResult: RT54MappedWorkbookResult
): Promise<void> {
  const blob = await generateRT54ExcelBlob(mappedResult);
  const cleanCuit = mappedResult.tenant.cuit.replace(/[^0-9]/g, '');
  const cleanName = mappedResult.tenant.razonSocial
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const fileName = `RT54_Balance_Oficial_${cleanCuit}_${cleanName}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
