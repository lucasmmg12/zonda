import type { ConceptoRecibo, ConvenioColectivo } from '../types/models';

export interface CampoManualCct {
  id: string;
  label: string;
  tipoInput: 'monto' | 'porcentaje' | 'unidades' | 'boolean';
  valorDefault: number;
  unidadLabel?: string;
  ayuda?: string;
}

export interface CategoriaEscalaCct {
  nombre: string;
  basicoSugerido: number;
}

export interface DefinicionConvenioCct {
  id: ConvenioColectivo;
  codigoCorto: string;
  nombre: string;
  sindicato: string;
  obraSocialDefault: string;
  ultimaParitaria: string;
  resolucionHomologatoria: string;
  alicuotaSindicatoPct: number;
  alicuotaSolidarioPct: number;
  seguroVidaFijo: number;
  antiguedadPctAnual: number;
  presentismoPctDefault: number;
  categorias: CategoriaEscalaCct[];
  camposManuales: CampoManualCct[];
}

export const CATALOGO_CONVENIOS_CCT: DefinicionConvenioCct[] = [
  {
    id: 'CCT 122/75 (Sanidad - Clínicas y Sanatorios)',
    codigoCorto: 'CCT 122/75',
    nombre: 'CCT 122/75 — Sanidad (Clínicas, Sanatorios y Hospitales Privados)',
    sindicato: 'FATSA / ATSA',
    obraSocialDefault: 'OSPSA (Obra Social del Personal de la Sanidad)',
    ultimaParitaria: 'Octubre 2026 — Paritaria Nacional FATSA-CONFECLISA (+11,8% + Cláusula 4)',
    resolucionHomologatoria: 'Res. ST N° 1842/2026',
    alicuotaSindicatoPct: 2,
    alicuotaSolidarioPct: 1,
    seguroVidaFijo: 4.0,
    antiguedadPctAnual: 2,
    presentismoPctDefault: 10,
    categorias: [
      { nombre: 'ADMINISTRATIVO DE 1°', basicoSugerido: 1161824.99 },
      { nombre: 'ENFERMERO/A PROFESIONAL DE PISO Y UTI', basicoSugerido: 1285400.0 },
      { nombre: 'MÉDICO/A DE GUARDIA Y ESPECIALISTA', basicoSugerido: 1650000.0 },
      { nombre: 'TÉCNICO RADIÓLOGO / LABORATORIO', basicoSugerido: 1210500.0 },
      { nombre: 'AUXILIAR DE SANIDAD / CAMILLERO', basicoSugerido: 1045200.0 },
      { nombre: 'MUCAMA / MAESTRANZA CLÍNICA', basicoSugerido: 985000.0 }
    ],
    camposManuales: [
      {
        id: 'adicObjetivos',
        label: 'Adic. Cumplimiento de Objetivos ($)',
        tipoInput: 'monto',
        valorDefault: 2323792.6,
        unidadLabel: '$',
        ayuda: 'Adicional remunerativo por objetivos o productividad clínica (Cód. 240)'
      },
      {
        id: 'excepcionalidadClausula4',
        label: 'Excepcionalidad Cláusula 4 (Pasa a No Rem.) ($)',
        tipoInput: 'monto',
        valorDefault: 1219966.16,
        unidadLabel: '$',
        ayuda: 'Deduce en Haberes (Cód. 19001) y acredita en Adicionales No Remunerativos (Cód. 40525)'
      },
      {
        id: 'refrigerioLavado',
        label: 'Refrigerio y Lavado de Uniforme ($)',
        tipoInput: 'monto',
        valorDefault: 51920.76,
        unidadLabel: '$',
        ayuda: 'Adicional No Remunerativo Art. Convenio FATSA (Cód. 40206)'
      },
      {
        id: 'asigNoRemParitaria',
        label: 'Asignación No Remunerativa Acuerdo Paritario ($)',
        tipoInput: 'monto',
        valorDefault: 90000.0,
        unidadLabel: '$',
        ayuda: 'Suma fija no remunerativa paritaria vigente (Cód. 40526)'
      },
      {
        id: 'aporteSolidarioPct',
        label: 'Aporte Solidario CCT (%)',
        tipoInput: 'porcentaje',
        valorDefault: 1,
        unidadLabel: '%',
        ayuda: 'Retención sindical solidaria sobre haberes remunerativos (Cód. 20004)'
      },
      {
        id: 'seguroVidaMonto',
        label: 'Seguro de Vida Obligatorio ($)',
        tipoInput: 'monto',
        valorDefault: 4.0,
        unidadLabel: '$',
        ayuda: 'Retención fija seguro colectivo de vida (Cód. 20006)'
      }
    ]
  },
  {
    id: 'CCT 76/75 (UOCRA - Construcción)',
    codigoCorto: 'CCT 76/75',
    nombre: 'CCT 76/75 — UOCRA (Industria de la Construcción y Obras)',
    sindicato: 'UOCRA',
    obraSocialDefault: 'OSPECON (Obra Social del Personal de la Construcción)',
    ultimaParitaria: 'Octubre 2026 — Acuerdo UOCRA-CAMARCO Zona A / Cuyo (+9,5%)',
    resolucionHomologatoria: 'Res. ST N° 1790/2026',
    alicuotaSindicatoPct: 2.5,
    alicuotaSolidarioPct: 1.5,
    seguroVidaFijo: 1500.0,
    antiguedadPctAnual: 1,
    presentismoPctDefault: 20,
    categorias: [
      { nombre: 'OFICIAL ESPECIALIZADO ELECTRICISTA DE RED', basicoSugerido: 890000.0 },
      { nombre: 'OFICIAL ALBAÑIL / ARMADOR', basicoSugerido: 760000.0 },
      { nombre: 'MEDIO OFICIAL DE OBRA', basicoSugerido: 685000.0 },
      { nombre: 'AYUDANTE / SERENO DE OBRA', basicoSugerido: 625000.0 }
    ],
    camposManuales: [
      {
        id: 'asistenciaPerfectaPct',
        label: 'Asistencia Perfecta Art. 52 (%)',
        tipoInput: 'porcentaje',
        valorDefault: 20,
        unidadLabel: '%',
        ayuda: '20% sobre el sueldo básico por asistencia perfecta quincenal/mensual (Cód. 102)'
      },
      {
        id: 'zonaDesfavorablePct',
        label: 'Adicional Zona Cuyo / Red (%)',
        tipoInput: 'porcentaje',
        valorDefault: 10,
        unidadLabel: '%',
        ayuda: 'Adicional remunerativo de zona o riesgo eléctrico/altura (Cód. 103)'
      },
      {
        id: 'horasExtras50Monto',
        label: 'Horas Extras al 50% / Premios de Obra ($)',
        tipoInput: 'monto',
        valorDefault: 0,
        unidadLabel: '$',
        ayuda: 'Importe remunerativo por horas suplementarias o avance de obra (Cód. 150)'
      },
      {
        id: 'acuerdoNoRemUocra',
        label: 'Suma No Remunerativa Paritaria UOCRA ($)',
        tipoInput: 'monto',
        valorDefault: 95000.0,
        unidadLabel: '$',
        ayuda: 'Asignación extraordinaria no remunerativa acuerdo CAMARCO (Cód. 40526)'
      },
      {
        id: 'focerDescuento',
        label: 'Fondo Cese Laboral / FOCER ($)',
        tipoInput: 'monto',
        valorDefault: 12000.0,
        unidadLabel: '$',
        ayuda: 'Aporte Fondo de Investigación y Capacitación / Seguro UOCRA (Cód. 20005)'
      }
    ]
  },
  {
    id: 'CCT 130/75 (Comercio y Servicios)',
    codigoCorto: 'CCT 130/75',
    nombre: 'CCT 130/75 — Empleados de Comercio y Servicios (FAECYS)',
    sindicato: 'SEC / FAECYS',
    obraSocialDefault: 'OSECAC (Obra Social de los Empleados de Comercio)',
    ultimaParitaria: 'Octubre 2026 — Paritaria FAECYS-CAC-CAME (+8,0% + No Rem.)',
    resolucionHomologatoria: 'Res. ST N° 1815/2026',
    alicuotaSindicatoPct: 2,
    alicuotaSolidarioPct: 0.5,
    seguroVidaFijo: 850.0,
    antiguedadPctAnual: 1,
    presentismoPctDefault: 8.33,
    categorias: [
      { nombre: 'ADMINISTRATIVO B — CAJERO Y FACTURACIÓN', basicoSugerido: 910000.0 },
      { nombre: 'ADMINISTRATIVO A — INICIAL', basicoSugerido: 885000.0 },
      { nombre: 'VENDEDOR B — COMERCIAL', basicoSugerido: 925000.0 },
      { nombre: 'MAESTRANZA Y DEPÓSITO A', basicoSugerido: 865000.0 }
    ],
    camposManuales: [
      {
        id: 'presentismoArt40Pct',
        label: 'Presentismo Art. 40 CCT 130/75 (%)',
        tipoInput: 'porcentaje',
        valorDefault: 8.33,
        unidadLabel: '%',
        ayuda: 'Doceava parte (8,33%) sobre remuneraciones del mes (Cód. 102)'
      },
      {
        id: 'adicionalFallaCaja',
        label: 'Adicional Falla de Caja / Comisiones ($)',
        tipoInput: 'monto',
        valorDefault: 38500.0,
        unidadLabel: '$',
        ayuda: 'Adicional remunerativo para cajeros o comisiones por ventas (Cód. 240)'
      },
      {
        id: 'acuerdoNoRemComercio',
        label: 'Incremento No Remunerativo FAECYS ($)',
        tipoInput: 'monto',
        valorDefault: 115000.0,
        unidadLabel: '$',
        ayuda: 'Suma no remunerativa paritaria mercantil vigente (Cód. 40525)'
      },
      {
        id: 'aporteOsecacFijo',
        label: 'Aporte Adicional OSECAC Art. 100 ($)',
        tipoInput: 'monto',
        valorDefault: 5500.0,
        unidadLabel: '$',
        ayuda: 'Aporte solidario obra social OSECAC (Cód. 20006)'
      }
    ]
  },
  {
    id: 'CCT 108/75 (Sanidad - Diagnóstico y Consultorios)',
    codigoCorto: 'CCT 108/75',
    nombre: 'CCT 108/75 — Sanidad (Institutos Médicos sin Internación y Laboratorios)',
    sindicato: 'FATSA / ATSA',
    obraSocialDefault: 'OSPSA (Obra Social del Personal de la Sanidad)',
    ultimaParitaria: 'Octubre 2026 — Paritaria FATSA-CADIME-CEDIM (+11,5%)',
    resolucionHomologatoria: 'Res. ST N° 1849/2026',
    alicuotaSindicatoPct: 2,
    alicuotaSolidarioPct: 1,
    seguroVidaFijo: 4.0,
    antiguedadPctAnual: 2,
    presentismoPctDefault: 10,
    categorias: [
      { nombre: 'TÉCNICO EN DIAGNÓSTICO POR IMÁGENES / ECOGRAFÍA', basicoSugerido: 1140000.0 },
      { nombre: 'RECEPCIONISTA ADM. DE CONSULTORIOS EXTERNOS', basicoSugerido: 1025000.0 },
      { nombre: 'BIOQUÍMICO / EXTRACCIONISTA DE LABORATORIO', basicoSugerido: 1180000.0 }
    ],
    camposManuales: [
      {
        id: 'adicObjetivos',
        label: 'Adicional Productividad / Guardias Diagnóstico ($)',
        tipoInput: 'monto',
        valorDefault: 280000.0,
        unidadLabel: '$',
        ayuda: 'Adicional remunerativo por prestaciones y turnos (Cód. 240)'
      },
      {
        id: 'refrigerioLavado',
        label: 'Sala Maternal / Refrigerio y Lavado ($)',
        tipoInput: 'monto',
        valorDefault: 48500.0,
        unidadLabel: '$',
        ayuda: 'Beneficio no remunerativo de convenio (Cód. 40206)'
      },
      {
        id: 'asigNoRemParitaria',
        label: 'Asignación No Remunerativa FATSA ($)',
        tipoInput: 'monto',
        valorDefault: 85000.0,
        unidadLabel: '$',
        ayuda: 'Suma no remunerativa paritaria (Cód. 40526)'
      }
    ]
  },
  {
    id: 'CCT 260/75 (UOM - Metalúrgicos)',
    codigoCorto: 'CCT 260/75',
    nombre: 'CCT 260/75 — UOM (Unión Obrera Metalúrgica - Talleres y Montaje)',
    sindicato: 'UOMRA',
    obraSocialDefault: 'OSUOMRA (Obra Social de la Unión Obrera Metalúrgica)',
    ultimaParitaria: 'Octubre 2026 — Paritaria UOM-ADIMRA Rama 17 (+9,2%)',
    resolucionHomologatoria: 'Res. ST N° 1765/2026',
    alicuotaSindicatoPct: 2.5,
    alicuotaSolidarioPct: 2,
    seguroVidaFijo: 2850.0,
    antiguedadPctAnual: 1,
    presentismoPctDefault: 10,
    categorias: [
      { nombre: 'OFICIAL MÚLTIPLE METALÚRGICO / SOLDADOR', basicoSugerido: 980000.0 },
      { nombre: 'OPERARIO CALIFICADO DE PLANTA', basicoSugerido: 845000.0 },
      { nombre: 'ADMINISTRATIVO TÉCNICO INDUSTRIAL', basicoSugerido: 920000.0 }
    ],
    camposManuales: [
      {
        id: 'adicObjetivos',
        label: 'Premio Producción / Título Técnico ($)',
        tipoInput: 'monto',
        valorDefault: 145000.0,
        unidadLabel: '$',
        ayuda: 'Adicional remunerativo planta industrial (Cód. 240)'
      },
      {
        id: 'asigNoRemParitaria',
        label: 'Gratificación Extraordinaria No Rem. UOM ($)',
        tipoInput: 'monto',
        valorDefault: 90000.0,
        unidadLabel: '$',
        ayuda: 'Suma no remunerativa acuerdo ADIMRA (Cód. 40526)'
      },
      {
        id: 'seguroVidaMonto',
        label: 'Seguro de Vida y Sepelio UOM Art. 55 ($)',
        tipoInput: 'monto',
        valorDefault: 2850.0,
        unidadLabel: '$',
        ayuda: 'Retención obligatoria seguro colectivo UOM (Cód. 20006)'
      }
    ]
  },
  {
    id: 'CCT 40/89 (Camioneros y Logística)',
    codigoCorto: 'CCT 40/89',
    nombre: 'CCT 40/89 — Camioneros, Transporte de Cargas y Logística (FEDCAM)',
    sindicato: 'FEDCAM / Sindicato de Choferes',
    obraSocialDefault: 'OSCHOCA (Obra Social de Choferes de Camiones)',
    ultimaParitaria: 'Octubre 2026 — Paritaria FEDCAM-FADEEAC (+10,5%)',
    resolucionHomologatoria: 'Res. ST N° 1802/2026',
    alicuotaSindicatoPct: 3,
    alicuotaSolidarioPct: 1.5,
    seguroVidaFijo: 1200.0,
    antiguedadPctAnual: 1,
    presentismoPctDefault: 10,
    categorias: [
      { nombre: 'CONDUCTOR DE PRIMERA CATEGORÍA / EQUIPOS PESADOS', basicoSugerido: 1120000.0 },
      { nombre: 'CHOFER DE REPARTO Y DISTRIBUCIÓN URBANA', basicoSugerido: 995000.0 },
      { nombre: 'ENCARGADO DE DEPÓSITO Y LOGÍSTICA', basicoSugerido: 960000.0 }
    ],
    camposManuales: [
      {
        id: 'adicObjetivos',
        label: 'Horas Extraordinarias / Kilómetros Recorridos ($)',
        tipoInput: 'monto',
        valorDefault: 265000.0,
        unidadLabel: '$',
        ayuda: 'Adicional remunerativo por km y permanencia (Cód. 240)'
      },
      {
        id: 'refrigerioLavado',
        label: 'Viáticos y Comida No Remunerativos Item 4.1.12 ($)',
        tipoInput: 'monto',
        valorDefault: 185000.0,
        unidadLabel: '$',
        ayuda: 'Viáticos especiales no remunerativos CCT 40/89 (Cód. 40206)'
      },
      {
        id: 'asigNoRemParitaria',
        label: 'Bono / Asignación No Remunerativa Transporte ($)',
        tipoInput: 'monto',
        valorDefault: 75000.0,
        unidadLabel: '$',
        ayuda: 'Adicional no remunerativo paritario (Cód. 40526)'
      }
    ]
  },
  {
    id: 'Fuera de Convenio (Dirección)',
    codigoCorto: 'LEY 20.744',
    nombre: 'Fuera de Convenio — Personal Jerárquico, Dirección y Profesionales (LCT 20.744)',
    sindicato: 'Sin afiliación sindical (Régimen General LCT)',
    obraSocialDefault: 'Obra Social de Dirección / Prepaga Corporativa (OSDE / Swiss Medical)',
    ultimaParitaria: 'Octubre 2026 — Actualización Ejecutiva Trimestral IPC',
    resolucionHomologatoria: 'Ley de Contrato de Trabajo N° 20.744',
    alicuotaSindicatoPct: 0,
    alicuotaSolidarioPct: 0,
    seguroVidaFijo: 4.0,
    antiguedadPctAnual: 1,
    presentismoPctDefault: 0,
    categorias: [
      { nombre: 'DIRECTOR TÉCNICO Y GERENTE OPERATIVO', basicoSugerido: 1850000.0 },
      { nombre: 'JEFE DE ADMINISTRACIÓN Y FINANZAS', basicoSugerido: 1520000.0 },
      { nombre: 'COORDINADOR MÉDICO / AUDITOR SENIOR', basicoSugerido: 1680000.0 }
    ],
    camposManuales: [
      {
        id: 'adicObjetivos',
        label: 'Adicional Cumplimiento de Objetivos / Bono Ejecutivo ($)',
        tipoInput: 'monto',
        valorDefault: 450000.0,
        unidadLabel: '$',
        ayuda: 'Adicional remunerativo por cumplimiento de metas (Cód. 240)'
      },
      {
        id: 'refrigerioLavado',
        label: 'Reintegro Gastos de Movilidad / Representación ($)',
        tipoInput: 'monto',
        valorDefault: 120000.0,
        unidadLabel: '$',
        ayuda: 'Concepto no remunerativo Art. 106 LCT (Cód. 40206)'
      },
      {
        id: 'retencionGanancias',
        label: 'Retención Impuesto a las Ganancias 4ta Cat. ($)',
        tipoInput: 'monto',
        valorDefault: 0,
        unidadLabel: '$',
        ayuda: 'Retención RG AFIP 4003 si supera el mínimo no imponible (Cód. 20010)'
      }
    ]
  }
];

export function obtenerDefinicionCct(cctId: string): DefinicionConvenioCct {
  return (
    CATALOGO_CONVENIOS_CCT.find((c) => c.id === cctId || cctId.includes(c.codigoCorto)) ||
    CATALOGO_CONVENIOS_CCT[0]
  );
}

/**
 * Recalcula automáticamente todos los conceptos del recibo (Haberes, Retenciones de ley y Adicionales No Remunerativos)
 * a partir del Sueldo Básico, Antigüedad, el CCT seleccionado y las casillas manuales completadas por el usuario.
 */
export function calcularConceptosReciboSegunCct(params: {
  cctId: string;
  sueldoBasico: number;
  antiguedadAnios: number;
  diasTrabajados?: number;
  valoresManuales: Record<string, number>;
}): ConceptoRecibo[] {
  const def = obtenerDefinicionCct(params.cctId);
  const dias = params.diasTrabajados || 30;
  const basicoProporcional = Number(((params.sueldoBasico / 30) * dias).toFixed(2));
  const m = params.valoresManuales;

  const conceptos: ConceptoRecibo[] = [];

  // 1. Sueldo Básico (Cód. 100)
  conceptos.push({
    codigo: '100',
    codigoAfipLsd: '110000',
    descripcion: 'SUELDO',
    unidades: dias === 30 ? '' : `${dias}`,
    tipo: 'Remunerativo',
    remunerativo: basicoProporcional,
    noRemunerativo: 0,
    descuento: 0
  });

  // 2. Conceptos Remunerativos específicos de cada CCT y casillas manuales
  if (def.codigoCorto === 'CCT 122/75' || def.codigoCorto === 'CCT 108/75') {
    const adicObj = Number((m.adicObjetivos ?? 0).toFixed(2));
    if (adicObj > 0) {
      conceptos.push({
        codigo: '240',
        codigoAfipLsd: '130000',
        descripcion: 'ADIC CUMPLIMIENTO DE OBJETIVOS',
        unidades: '',
        tipo: 'Remunerativo',
        remunerativo: adicObj,
        noRemunerativo: 0,
        descuento: 0
      });
    }

    const excepClausula4 = Number((m.excepcionalidadClausula4 ?? 0).toFixed(2));
    if (excepClausula4 > 0) {
      // Tal como en el recibo oficial de Sanatorio Argentino (Imagen 2):
      // descuenta en la columna Haberes con signo negativo (-1,219,966.16) y suma en Adicionales No Remunerativos (40525)
      conceptos.push({
        codigo: '19001',
        codigoAfipLsd: '190000',
        descripcion: 'Excepcionalidad cláusula 4',
        unidades: '',
        tipo: 'Remunerativo',
        remunerativo: -excepClausula4,
        noRemunerativo: 0,
        descuento: 0
      });
    }
  } else if (def.codigoCorto === 'CCT 76/75') {
    const asistPct = m.asistenciaPerfectaPct ?? 20;
    if (asistPct > 0) {
      const montoAsist = Number(((basicoProporcional * asistPct) / 100).toFixed(2));
      conceptos.push({
        codigo: '102',
        codigoAfipLsd: '130000',
        descripcion: `ADICIONAL ASISTENCIA PERFECTA (${asistPct}%)`,
        unidades: `${asistPct}%`,
        tipo: 'Remunerativo',
        remunerativo: montoAsist,
        noRemunerativo: 0,
        descuento: 0
      });
    }
    const zonaPct = m.zonaDesfavorablePct ?? 10;
    if (zonaPct > 0) {
      const montoZona = Number(((basicoProporcional * zonaPct) / 100).toFixed(2));
      conceptos.push({
        codigo: '103',
        codigoAfipLsd: '120000',
        descripcion: `ADICIONAL ZONA DESFAVORABLE (${zonaPct}%)`,
        unidades: `${zonaPct}%`,
        tipo: 'Remunerativo',
        remunerativo: montoZona,
        noRemunerativo: 0,
        descuento: 0
      });
    }
    const hsExtras = Number((m.horasExtras50Monto ?? 0).toFixed(2));
    if (hsExtras > 0) {
      conceptos.push({
        codigo: '150',
        codigoAfipLsd: '140000',
        descripcion: 'HORAS EXTRAS / PREMIOS DE OBRA',
        unidades: '',
        tipo: 'Remunerativo',
        remunerativo: hsExtras,
        noRemunerativo: 0,
        descuento: 0
      });
    }
  } else if (def.codigoCorto === 'CCT 130/75') {
    const antAnios = Math.max(0, params.antiguedadAnios || 1);
    const montoAnt = Number(((basicoProporcional * antAnios * def.antiguedadPctAnual) / 100).toFixed(2));
    if (montoAnt > 0) {
      conceptos.push({
        codigo: '101',
        codigoAfipLsd: '120000',
        descripcion: `ANTIGÜEDAD (${antAnios} AÑOS - ${antAnios}%)`,
        unidades: `${antAnios}%`,
        tipo: 'Remunerativo',
        remunerativo: montoAnt,
        noRemunerativo: 0,
        descuento: 0
      });
    }
    const presPct = m.presentismoArt40Pct ?? 8.33;
    if (presPct > 0) {
      const montoPres = Number((((basicoProporcional + montoAnt) * presPct) / 100).toFixed(2));
      conceptos.push({
        codigo: '102',
        codigoAfipLsd: '130000',
        descripcion: 'PRESENTISMO ART. 40 CCT 130/75',
        unidades: `${presPct}%`,
        tipo: 'Remunerativo',
        remunerativo: montoPres,
        noRemunerativo: 0,
        descuento: 0
      });
    }
    const fallaCaja = Number((m.adicionalFallaCaja ?? 0).toFixed(2));
    if (fallaCaja > 0) {
      conceptos.push({
        codigo: '240',
        codigoAfipLsd: '130000',
        descripcion: 'ADICIONAL FALLA DE CAJA / COMISIONES',
        unidades: '',
        tipo: 'Remunerativo',
        remunerativo: fallaCaja,
        noRemunerativo: 0,
        descuento: 0
      });
    }
  } else {
    const adicObj = Number((m.adicObjetivos ?? 0).toFixed(2));
    if (adicObj > 0) {
      conceptos.push({
        codigo: '240',
        codigoAfipLsd: '130000',
        descripcion: 'ADIC CUMPLIMIENTO DE OBJETIVOS',
        unidades: '',
        tipo: 'Remunerativo',
        remunerativo: adicObj,
        noRemunerativo: 0,
        descuento: 0
      });
    }
  }

  // Base Remunerativa Imponible para Retenciones de Ley (Jubilación 11%, Ley 19.032 3%, Obra Social 3%)
  // Nota: si hay Excepcionalidad cláusula 4 (Sanidad), las retenciones sobre conceptos no remunerativos con aporte de OS/Sindicato se calculan sobre la base bruta o remunerativa según corresponda.
  const subtotalHaberesRemunerativos = Math.max(
    0,
    Number(conceptos.reduce((acc, c) => acc + (c.remunerativo || 0), 0).toFixed(2))
  );
  const baseCalculoObraSocialYSindicato =
    def.codigoCorto === 'CCT 122/75' && (m.excepcionalidadClausula4 ?? 0) > 0
      ? subtotalHaberesRemunerativos + Number(m.excepcionalidadClausula4 || 0)
      : subtotalHaberesRemunerativos;

  // 3. Retenciones de Ley (Jubilación 11%, Ley 19.032 3%, Obra Social 3%, Sindicato / Solidario, Seguro de Vida)
  const jub11 = Number((subtotalHaberesRemunerativos * 0.11).toFixed(2));
  const ley19032 = Number((subtotalHaberesRemunerativos * 0.03).toFixed(2));
  const obraSocial3 = Number((baseCalculoObraSocialYSindicato * 0.03).toFixed(2));

  conceptos.push(
    {
      codigo: '20000',
      codigoAfipLsd: '810000',
      descripcion: 'JUBILACION 11%',
      unidades: '',
      tipo: 'Descuento',
      remunerativo: 0,
      noRemunerativo: 0,
      descuento: jub11
    },
    {
      codigo: '20001',
      codigoAfipLsd: '810001',
      descripcion: 'LEY 19.032 3%',
      unidades: '',
      tipo: 'Descuento',
      remunerativo: 0,
      noRemunerativo: 0,
      descuento: ley19032
    },
    {
      codigo: '20002',
      codigoAfipLsd: '810002',
      descripcion: 'OBRA SOCIAL 3%',
      unidades: '',
      tipo: 'Descuento',
      remunerativo: 0,
      noRemunerativo: 0,
      descuento: obraSocial3
    }
  );

  const solidarioPct = m.aporteSolidarioPct ?? def.alicuotaSolidarioPct;
  if (solidarioPct > 0) {
    const montoSolidario = Number(((baseCalculoObraSocialYSindicato * solidarioPct) / 100).toFixed(2));
    conceptos.push({
      codigo: '20004',
      codigoAfipLsd: '820000',
      descripcion: `APORTE SOLIDARIO CCT ${solidarioPct}%`,
      unidades: '',
      tipo: 'Descuento',
      remunerativo: 0,
      noRemunerativo: 0,
      descuento: montoSolidario
    });
  } else if (def.alicuotaSindicatoPct > 0) {
    const montoSind = Number(((subtotalHaberesRemunerativos * def.alicuotaSindicatoPct) / 100).toFixed(2));
    conceptos.push({
      codigo: '20004',
      codigoAfipLsd: '820000',
      descripcion: `CUOTA SINDICAL ${def.sindicato} (${def.alicuotaSindicatoPct}%)`,
      unidades: '',
      tipo: 'Descuento',
      remunerativo: 0,
      noRemunerativo: 0,
      descuento: montoSind
    });
  }

  const seguroVida = Number((m.seguroVidaMonto ?? m.aporteOsecacFijo ?? def.seguroVidaFijo).toFixed(2));
  if (seguroVida > 0) {
    conceptos.push({
      codigo: '20006',
      codigoAfipLsd: '820001',
      descripcion: 'SEGURO DE VIDA',
      unidades: '',
      tipo: 'Descuento',
      remunerativo: 0,
      noRemunerativo: 0,
      descuento: seguroVida
    });
  }

  const focer = Number((m.focerDescuento ?? 0).toFixed(2));
  if (focer > 0) {
    conceptos.push({
      codigo: '20005',
      codigoAfipLsd: '820002',
      descripcion: 'FONDO DE CESE LABORAL (FOCER)',
      unidades: '',
      tipo: 'Descuento',
      remunerativo: 0,
      noRemunerativo: 0,
      descuento: focer
    });
  }

  const retGanancias = Number((m.retencionGanancias ?? 0).toFixed(2));
  if (retGanancias > 0) {
    conceptos.push({
      codigo: '20010',
      codigoAfipLsd: '810008',
      descripcion: 'RETENCION IMP. A LAS GANANCIAS 4TA CAT.',
      unidades: '',
      tipo: 'Descuento',
      remunerativo: 0,
      noRemunerativo: 0,
      descuento: retGanancias
    });
  }

  // 4. Adicionales / Conceptos No Remunerativos (Columna derecha "Adicionales")
  const refrig = Number((m.refrigerioLavado ?? 0).toFixed(2));
  if (refrig > 0) {
    conceptos.push({
      codigo: '40206',
      codigoAfipLsd: '990000',
      descripcion: 'Refrigerio y lavado',
      unidades: '',
      tipo: 'No Remunerativo',
      remunerativo: 0,
      noRemunerativo: refrig,
      descuento: 0
    });
  }

  const excepNoRem = Number((m.excepcionalidadClausula4 ?? m.acuerdoNoRemComercio ?? 0).toFixed(2));
  if (excepNoRem > 0) {
    conceptos.push({
      codigo: '40525',
      codigoAfipLsd: '990000',
      descripcion:
        def.codigoCorto === 'CCT 122/75'
          ? 'Excepcionalidad cláusula 4 no rem'
          : 'Acuerdo Paritario No Remunerativo',
      unidades: '',
      tipo: 'No Remunerativo',
      remunerativo: 0,
      noRemunerativo: excepNoRem,
      descuento: 0
    });
  }

  const asigNoRem = Number((m.asigNoRemParitaria ?? m.acuerdoNoRemUocra ?? 0).toFixed(2));
  if (asigNoRem > 0) {
    conceptos.push({
      codigo: '40526',
      codigoAfipLsd: '990000',
      descripcion: 'Asig. No rem. Paritaria',
      unidades: '',
      tipo: 'No Remunerativo',
      remunerativo: 0,
      noRemunerativo: asigNoRem,
      descuento: 0
    });
  }

  return conceptos;
}
