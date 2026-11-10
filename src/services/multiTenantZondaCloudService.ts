import { supabase } from '../lib/supabase';
import type {
  EmpresaConfig,
  Cliente,
  Proveedor,
  ComprobanteVenta,
  ComprobanteCompra,
  CuentaBancaria,
  Cheque,
  ArticuloInventario,
  EmpleadoLegajo,
  AsientoContable,
  CuentaContable
} from '../types/models';
import {
  mockEmpresa,
  mockClientes,
  mockProveedores,
  mockFacturasVenta,
  mockFacturasCompra,
  mockCuentasBancarias,
  mockCheques,
  mockInventario,
  mockEmpleados,
  mockAsientosContables,
  mockPlanDeCuentas
} from './mockData';

export interface PermisosZondaCloud {
  gestionarVentasArca: boolean;
  gestionarComprasArca: boolean;
  cruzarMisComprobantesArca: boolean;
  liquidarIvaDigitalF2002: boolean;
  liquidarRetencionesSireSicore: boolean;
  liquidarIibbSifere: boolean;
}

export interface EventoAuditoriaZondaCloud {
  id: string;
  fechaHora: string;
  actor: string;
  accion: string;
  detalle: string;
}

export interface AutorizacionZondaCloud {
  autorizado: boolean;
  tokenVinculacion: string;
  fechaAutorizacion: string;
  autorizadoPorUsuarioErp: string;
  estudioContableNombre: string;
  estudioContableCuit: string;
  permisos: PermisosZondaCloud;
  porcentajeProrrateoIvaArt13: number; // % de crédito fiscal computable para compras sujetas a prorrateo (Art. 13 Ley IVA)
  saldoTecnicoAnteriorIva: number;
  saldoLibreDisponibilidadAnterior: number;
  retencionesIvaSufridasMes: number;
  alicuotaIibbPromedio: number;
  estadoUltimaLiquidacion?: {
    periodo: string;
    fechaPresentacion: string;
    saldoPagarIva: number;
    saldoPagarIibb: number;
    nroTransaccionArca: string;
  };
  bitacoraCloud: EventoAuditoriaZondaCloud[];
}

export interface ClasificacionFiscalCompraArca {
  facturaCompraId: string;
  codigoComprobanteArca: '001' | '002' | '003' | '006' | '011' | '051' | '201';
  computabilidadIva: 'COMPUTABLE_100' | 'PRORRATEO_ART_13' | 'NO_COMPUTABLE';
  rubroF2002: 'BIENES_DE_CAMBIO' | 'BIENES_DE_USO' | 'SERVICIOS_Y_GASTOS';
  percepcionIva: number;
  percepcionIibb: number;
  conciliadoMisComprobantesArca: boolean;
}

export interface ComprobantePendienteMisComprobantesArca {
  id: string;
  tipoFlujo: 'RECIBIDO_COMPRA' | 'EMITIDO_VENTA';
  fechaEmision: string;
  tipoComprobante: 'Factura A' | 'Factura B' | 'Factura C' | 'Nota de Débito';
  codigoArca: string;
  puntoVenta: string;
  numero: string;
  cuitContraparte: string;
  razonSocialContraparte: string;
  netoGravado: number;
  iva21: number;
  iva105: number;
  percepcionIva: number;
  percepcionIibb: number;
  total: number;
  cae: string;
  incorporadoAlErp: boolean;
}

export interface UsuarioInternoTenant {
  id: string;
  nombre: string;
  email: string;
  rol:
    | 'ADMINISTRADOR GENERAL'
    | 'CONTADOR / AUDITORÍA'
    | 'TESORERÍA Y FINANZAS'
    | 'FACTURACIÓN Y VENTAS'
    | 'RECURSOS HUMANOS';
  activo: boolean;
}

export interface TenantIsolatedDataSnapshot {
  empresa: EmpresaConfig;
  empresaExtra: {
    nombre: string;
    localidad: string;
    codPostal: string;
    provincia: string;
    pais: string;
    telefono: string;
    email: string;
    cbu: string;
    convenioMultilateral: boolean;
    logoAncho?: string;
    logoAltura?: string;
    logoArchivo?: string;
  };
  clientes: Cliente[];
  proveedores: Proveedor[];
  facturasVenta: ComprobanteVenta[];
  facturasCompra: ComprobanteCompra[];
  cuentasBancarias: CuentaBancaria[];
  cheques: Cheque[];
  inventario: ArticuloInventario[];
  empleados: EmpleadoLegajo[];
  asientosContables: AsientoContable[];
  planDeCuentas?: CuentaContable[];
  clasificacionesComprasArca: Record<string, ClasificacionFiscalCompraArca>;
  pendientesMisComprobantesArca: ComprobantePendienteMisComprobantesArca[];
}

export interface TenantEmpresa {
  tenantId: string;
  codigoCorto: string;
  razonSocial: string;
  nombreFantasia: string;
  cuit: string;
  condicionIva: string;
  actividadPrincipalArca: string;
  jurisdiccionPrincipal: string;
  convenioMultilateral: boolean;
  usuariosInternos: UsuarioInternoTenant[];
  autorizacionZondaCloud: AutorizacionZondaCloud;
}

const STORAGE_KEY_TENANTS_LIST = 'zonda_multitenant_list_v1';
const STORAGE_KEY_ACTIVE_TENANT = 'zonda_multitenant_active_id_v1';
const STORAGE_PREFIX_TENANT_DATA = 'zonda_multitenant_data_v1_';

export const DEFAULT_TENANTS: TenantEmpresa[] = [
  {
    tenantId: 'TENANT-ECAR',
    codigoCorto: 'ECAR-SJ',
    razonSocial: 'ECAR S. A. S. (Zonda Core)',
    nombreFantasia: 'ECAR Construcciones & Obras',
    cuit: '30-71875908-7',
    condicionIva: 'Responsable Inscripto',
    actividadPrincipalArca: '421000 - Construcción, reforma y reparación de obras de infraestructura',
    jurisdiccionPrincipal: '918 - San Juan (DGR)',
    convenioMultilateral: false,
    usuariosInternos: [
      {
        id: 'USR-ECAR-01',
        nombre: 'Ing. Roberto Quiroga',
        email: 'administracion@ecarconstrucciones.com',
        rol: 'ADMINISTRADOR GENERAL',
        activo: true
      },
      {
        id: 'USR-ECAR-02',
        nombre: 'Cra. Valeria Sánchez',
        email: 'contaduria@ecarconstrucciones.com',
        rol: 'CONTADOR / AUDITORÍA',
        activo: true
      },
      {
        id: 'USR-ECAR-03',
        nombre: 'Téc. Lucas Marinero',
        email: 'obras@ecarconstrucciones.com',
        rol: 'FACTURACIÓN Y VENTAS',
        activo: true
      }
    ],
    autorizacionZondaCloud: {
      autorizado: true,
      tokenVinculacion: 'ZCLOUD-ARCA-30718759087-OK',
      fechaAutorizacion: '2026-10-01 09:30',
      autorizadoPorUsuarioErp: 'Ing. Roberto Quiroga (Admin General ECAR)',
      estudioContableNombre: 'Zonda Cloud Hub Tributario & Auditoría ARCA',
      estudioContableCuit: '30-71654321-8',
      permisos: {
        gestionarVentasArca: true,
        gestionarComprasArca: true,
        cruzarMisComprobantesArca: true,
        liquidarIvaDigitalF2002: true,
        liquidarRetencionesSireSicore: true,
        liquidarIibbSifere: true
      },
      porcentajeProrrateoIvaArt13: 100,
      saldoTecnicoAnteriorIva: 185000,
      saldoLibreDisponibilidadAnterior: 92400,
      retencionesIvaSufridasMes: 145000,
      alicuotaIibbPromedio: 3.0,
      estadoUltimaLiquidacion: {
        periodo: '2026-09',
        fechaPresentacion: '2026-10-18',
        saldoPagarIva: 642800,
        saldoPagarIibb: 294000,
        nroTransaccionArca: 'ARCA-F2002-99481203'
      },
      bitacoraCloud: [
        {
          id: 'LOG-ZC-1',
          fechaHora: '2026-11-02 10:15',
          actor: 'Zonda Cloud (Estudio Contable)',
          accion: 'CRUCE MIS COMPROBANTES ARCA',
          detalle: 'Se verificaron comprobantes electrónicos emitidos y recibidos del período 2026-10/11.'
        },
        {
          id: 'LOG-ZC-2',
          fechaHora: '2026-10-18 17:40',
          actor: 'Zonda Cloud (Estudio Contable)',
          accion: 'PRESENTACIÓN LIBRO IVA DIGITAL RG 4597',
          detalle: 'Generación de los 4 archivos TXT y cierre de Posición F.2002.'
        }
      ]
    }
  },
  {
    tenantId: 'TENANT-SANATORIO',
    codigoCorto: 'SAN-ARG',
    razonSocial: 'SANATORIO ARGENTINO S.R.L.',
    nombreFantasia: 'Sanatorio Argentino — Salud & Alta Complejidad',
    cuit: '30-60992686-0',
    condicionIva: 'Responsable Inscripto',
    actividadPrincipalArca: '861010 - Servicios de internación y clínicas de alta complejidad',
    jurisdiccionPrincipal: '918 - San Juan (DGR)',
    convenioMultilateral: false,
    usuariosInternos: [
      {
        id: 'USR-SAN-01',
        nombre: 'Dirección Médica & Administración',
        email: 'direccion@sanatorioargentino.com.ar',
        rol: 'ADMINISTRADOR GENERAL',
        activo: true
      },
      {
        id: 'USR-SAN-02',
        nombre: 'Auditoría de Liquidaciones OS',
        email: 'facturacion@sanatorioargentino.com.ar',
        rol: 'FACTURACIÓN Y VENTAS',
        activo: true
      },
      {
        id: 'USR-SAN-03',
        nombre: 'Jefatura RRHH Sanidad CCT 122/75',
        email: 'rrhh@sanatorioargentino.com.ar',
        rol: 'RECURSOS HUMANOS',
        activo: true
      }
    ],
    autorizacionZondaCloud: {
      autorizado: true,
      tokenVinculacion: 'ZCLOUD-ARCA-30609926860-OK',
      fechaAutorizacion: '2026-10-05 11:00',
      autorizadoPorUsuarioErp: 'Dirección Administrativa (Sanatorio Argentino)',
      estudioContableNombre: 'Zonda Cloud Hub Tributario & Auditoría ARCA',
      estudioContableCuit: '30-71654321-8',
      permisos: {
        gestionarVentasArca: true,
        gestionarComprasArca: true,
        cruzarMisComprobantesArca: true,
        liquidarIvaDigitalF2002: true,
        liquidarRetencionesSireSicore: true,
        liquidarIibbSifere: true
      },
      porcentajeProrrateoIvaArt13: 68,
      saldoTecnicoAnteriorIva: 420000,
      saldoLibreDisponibilidadAnterior: 310000,
      retencionesIvaSufridasMes: 275000,
      alicuotaIibbPromedio: 1.5,
      bitacoraCloud: [
        {
          id: 'LOG-SAN-1',
          fechaHora: '2026-11-03 14:20',
          actor: 'Zonda Cloud (Estudio Contable)',
          accion: 'PRORRATEO CRÉDITO FISCAL ART. 13 LEY IVA',
          detalle: 'Ajuste de coeficiente de prorrateo de IVA Compras para insumos médicos y clínicas (68% computable).'
        }
      ]
    }
  },
  {
    tenantId: 'TENANT-ANDINA',
    codigoCorto: 'DIST-AND',
    razonSocial: 'DISTRIBUIDORA MAYORISTA ANDINA S.A.',
    nombreFantasia: 'Andina Insumos & Logística Cuyo',
    cuit: '30-71548921-9',
    condicionIva: 'Responsable Inscripto',
    actividadPrincipalArca: '466330 - Venta al por mayor de materiales e insumos industriales',
    jurisdiccionPrincipal: '913 - Mendoza / 918 - San Juan (Convenio Multilateral SIFERE)',
    convenioMultilateral: true,
    usuariosInternos: [
      {
        id: 'USR-AND-01',
        nombre: 'Martín Echegaray (Gerencia)',
        email: 'gerencia@andinamayorista.com.ar',
        rol: 'ADMINISTRADOR GENERAL',
        activo: true
      },
      {
        id: 'USR-AND-02',
        nombre: 'Sofía Benítez (Depósito & Ventas)',
        email: 'ventas@andinamayorista.com.ar',
        rol: 'FACTURACIÓN Y VENTAS',
        activo: true
      }
    ],
    autorizacionZondaCloud: {
      autorizado: false,
      tokenVinculacion: 'ZCLOUD-PEND-30715489219',
      fechaAutorizacion: '-',
      autorizadoPorUsuarioErp: 'Pendiente de autorización por el titular del ERP',
      estudioContableNombre: 'Zonda Cloud Hub Tributario & Auditoría ARCA',
      estudioContableCuit: '30-71654321-8',
      permisos: {
        gestionarVentasArca: true,
        gestionarComprasArca: true,
        cruzarMisComprobantesArca: true,
        liquidarIvaDigitalF2002: true,
        liquidarRetencionesSireSicore: true,
        liquidarIibbSifere: true
      },
      porcentajeProrrateoIvaArt13: 100,
      saldoTecnicoAnteriorIva: 95000,
      saldoLibreDisponibilidadAnterior: 120000,
      retencionesIvaSufridasMes: 88000,
      alicuotaIibbPromedio: 3.5,
      bitacoraCloud: []
    }
  }
];

function buildInitialSanatorioSnapshot(): TenantIsolatedDataSnapshot {
  const emp: EmpresaConfig = {
    razonSocial: 'SANATORIO ARGENTINO S.R.L.',
    cuit: '30-60992686-0',
    condicionIva: 'Responsable Inscripto',
    domicilioFiscal: 'San Luis 432 Oeste, Capital, San Juan',
    inicioActividades: '1988-05-12',
    ingresosBrutos: '918-609926-0',
    puntosVenta: [
      {
        numero: '0005',
        descripcion: 'Facturación Prestaciones Médicas e Internación (ARCA WSFE)',
        tipoEmision: 'Facturación Electrónica Web Service',
        activo: true
      }
    ]
  };

  const clientesSanatorio: Cliente[] = [
    {
      id: 'CLI-SAN-01',
      nombre: 'OBRA SOCIAL PROVINCIA (OSP SAN JUAN)',
      razonSocial: 'DIRECCIÓN OBRA SOCIAL PROVINCIA DE SAN JUAN',
      cuit: '30-99902341-5',
      condicionIva: 'Exento',
      email: 'liquidaciones@ospsanjuan.gob.ar',
      telefono: '264-4304500',
      domicilio: 'Av. Libertador Gral. San Martín 750 Oeste, San Juan',
      listaPrecios: 'Nomenclador Sanatorial Alta Complejidad',
      limiteCredito: 120000000,
      vendedor: 'Convenios Prestacionales',
      activo: true,
      saldo: 14850000,
      facturasAdeudadas: [
        {
          id: 'FAC-SAN-101',
          nroComprobante: '0005-00018420',
          tipo: 'Factura B',
          fechaEmision: '2026-10-15',
          fechaPago: '2026-11-15',
          descripcion: 'Facturación Prestaciones Médicas e Internación UTI — Capitas Octubre',
          valorMe: 0,
          total: 14850000,
          cobrado: 0,
          saldo: 14850000,
          saldoAcumulado: 14850000,
          medioCobroPactado: 'Transferencia Bancaria Santander'
        }
      ],
      movimientos: [
        {
          id: 'MOV-SAN-1',
          fecha: '2026-10-15',
          comprobante: '0005-00018420',
          concepto: 'Prestaciones Médicas e Internación UTI',
          debe: 14850000,
          haber: 0,
          saldo: 14850000
        }
      ]
    },
    {
      id: 'CLI-SAN-02',
      nombre: 'OSDE FILIAL SAN JUAN',
      razonSocial: 'ORGANIZACIÓN DE SERVICIOS DIRECTOS EMPRESARIOS (OSDE)',
      cuit: '30-54674125-3',
      condicionIva: 'Responsable Inscripto',
      email: 'prestadores.sanjuan@osde.com.ar',
      telefono: '264-4298000',
      domicilio: 'Av. Ignacio de la Roza 245 Oeste, San Juan',
      listaPrecios: 'Medicina Prepaga Convenio A',
      limiteCredito: 85000000,
      vendedor: 'Auditoría Médica',
      activo: true,
      saldo: 9945000,
      facturasAdeudadas: [
        {
          id: 'FAC-SAN-102',
          nroComprobante: '0005-00018421',
          tipo: 'Factura A',
          fechaEmision: '2026-10-22',
          fechaPago: '2026-11-22',
          descripcion: 'Prácticas Quirúrgicas, Diagnóstico por Imágenes e Internación (IVA 10.5%)',
          valorMe: 0,
          total: 9945000,
          cobrado: 0,
          saldo: 9945000,
          saldoAcumulado: 9945000,
          medioCobroPactado: 'Transferencia Bancaria Santander'
        }
      ],
      movimientos: [
        {
          id: 'MOV-SAN-2',
          fecha: '2026-10-22',
          comprobante: '0005-00018421',
          concepto: 'Prácticas Quirúrgicas y Diagnóstico (IVA 10.5%)',
          debe: 9945000,
          haber: 0,
          saldo: 9945000
        }
      ]
    }
  ];

  const proveedoresSanatorio: Proveedor[] = [
    {
      id: 'PRV-SAN-01',
      nombre: 'DROGUERÍA SUIZO ARGENTINA S.A.',
      razonSocial: 'DROGUERÍA SUIZO ARGENTINA S.A.',
      cuit: '30-51698421-7',
      condicionIva: 'Responsable Inscripto',
      email: 'cobranzas.cuyo@suizoargentina.com',
      telefono: '0800-555-7849',
      domicilio: 'Ruta Nacional 40 Km 12, Mendoza',
      cuentaGastoHabitual: '5.1.01 - Insumos Farmacéuticos y Descartables',
      condicionPago: '30 días Fecha Factura',
      activo: true,
      saldo: 4840000,
      facturasAdeudadas: [
        {
          id: 'FC-SAN-201',
          nroComprobante: '0012-00459102',
          tipo: 'Factura A',
          fechaEmision: '2026-10-18',
          fechaPago: '2026-11-18',
          descripcion: 'Provisión de Sueros, Antibióticos EV y Material Descartable Quirófano',
          valorMe: 0,
          total: 4840000,
          pagado: 0,
          saldo: 4840000,
          saldoAcumulado: 4840000
        }
      ],
      movimientos: []
    },
    {
      id: 'PRV-SAN-02',
      nombre: 'AIR LIQUIDE ARGENTINA S.A.',
      razonSocial: 'AIR LIQUIDE ARGENTINA S.A. (OXÍGENO MEDICINAL)',
      cuit: '30-50089124-9',
      condicionIva: 'Responsable Inscripto',
      email: 'facturacion.medicinal@airliquide.com',
      telefono: '011-4708-2000',
      domicilio: 'Parque Industrial Chimbas, San Juan',
      cuentaGastoHabitual: '5.1.02 - Gases Medicinales y Oxigenoterapia',
      condicionPago: '30 días Fecha Factura',
      activo: true,
      saldo: 2662000,
      facturasAdeudadas: [
        {
          id: 'FC-SAN-202',
          nroComprobante: '0008-00112940',
          tipo: 'Factura A',
          fechaEmision: '2026-10-25',
          fechaPago: '2026-11-25',
          descripcion: 'Recarga Tanque Criogénico Oxígeno Medicinal Líquido UTI',
          valorMe: 0,
          total: 2662000,
          pagado: 0,
          saldo: 2662000,
          saldoAcumulado: 2662000
        }
      ],
      movimientos: []
    }
  ];

  const facturasVentaSanatorio: ComprobanteVenta[] = [
    {
      id: 'FV-SAN-01',
      puntoVenta: '0005',
      numero: '00018421',
      tipo: 'Factura A',
      fechaEmision: '2026-10-22',
      fechaVencimiento: '2026-11-22',
      clienteNombre: 'ORGANIZACIÓN DE SERVICIOS DIRECTOS EMPRESARIOS (OSDE)',
      clienteCuit: '30-54674125-3',
      condicionIva: 'Responsable Inscripto',
      netoGravado: 9000000,
      iva21: 0,
      iva105: 945000,
      total: 9945000,
      cae: '76449102837461',
      caeVencimiento: '2026-11-01',
      estado: 'Pendiente'
    },
    {
      id: 'FV-SAN-02',
      puntoVenta: '0005',
      numero: '00018420',
      tipo: 'Factura B',
      fechaEmision: '2026-10-15',
      fechaVencimiento: '2026-11-15',
      clienteNombre: 'DIRECCIÓN OBRA SOCIAL PROVINCIA DE SAN JUAN',
      clienteCuit: '30-99902341-5',
      condicionIva: 'Exento',
      netoGravado: 14850000,
      iva21: 0,
      iva105: 0,
      total: 14850000,
      cae: '76441928374650',
      caeVencimiento: '2026-10-25',
      estado: 'Pendiente'
    }
  ];

  const facturasCompraSanatorio: ComprobanteCompra[] = [
    {
      id: 'FC-SAN-201',
      numero: '0012-00459102',
      tipo: 'Factura A',
      fechaComprobante: '2026-10-18',
      fechaImputacion: '2026-10-18',
      proveedorNombre: 'DROGUERÍA SUIZO ARGENTINA S.A.',
      proveedorCuit: '30-51698421-7',
      cuentaGasto: '5.1.01 - Insumos Farmacéuticos y Descartables',
      netoGravado: 4000000,
      iva: 840000,
      retencionIva: 0,
      retencionIIBB: 0,
      total: 4840000,
      estadoPago: 'Pendiente'
    },
    {
      id: 'FC-SAN-202',
      numero: '0008-00112940',
      tipo: 'Factura A',
      fechaComprobante: '2026-10-25',
      fechaImputacion: '2026-10-25',
      proveedorNombre: 'AIR LIQUIDE ARGENTINA S.A. (OXÍGENO MEDICINAL)',
      proveedorCuit: '30-50089124-9',
      cuentaGasto: '5.1.02 - Gases Medicinales y Oxigenoterapia',
      netoGravado: 2200000,
      iva: 462000,
      retencionIva: 0,
      retencionIIBB: 0,
      total: 2662000,
      estadoPago: 'Pendiente'
    }
  ];

  const inventarioSanatorio: ArticuloInventario[] = [
    {
      id: 'MED-001',
      codigo: 'MED-001',
      sku: 'MED-001',
      descripcion: 'SUERO FISIOLÓGICO SOLUCIÓN CLORURO DE SODIO 0.9% X 500ML (BAXTER)',
      tipo: 'P',
      um: '1',
      unidadMedida: 'Unidad',
      categoria: 'Farmacia Hospitalaria',
      deposito: 'Depósito Central',
      precioVentaNeto: 4200,
      costoCalculado: 2850,
      disponible: 420,
      stockActual: 420,
      stockMinimo: 100,
      alicuotaIva: 21,
      movimientos: [
        {
          id: 'MOV-MED-1',
          fecha: '2026-10-18',
          deposito: 'Depósito Central',
          descripcion: 'Compra de Insumos Hospitalarios según Factura A 0012-00459102',
          tipoDoc: 'FAC',
          precio: 2850,
          cantidad: 420,
          proveedorId: 'PRV-SAN-01',
          proveedorNombre: 'DROGUERÍA SUIZO ARGENTINA S.A.',
          proveedorCuit: '30-51698421-7',
          facturaId: 'FC-SAN-201',
          facturaNro: '0012-00459102'
        }
      ]
    },
    {
      id: 'MED-002',
      codigo: 'MED-002',
      sku: 'MED-002',
      descripcion: 'KIT DESCARTABLE CIRUGÍA ALTA COMPLEJIDAD ESTÉRIL',
      tipo: 'P',
      um: '1',
      unidadMedida: 'Unidad',
      categoria: 'Quirófano Central',
      deposito: 'Depósito Central',
      precioVentaNeto: 68500,
      costoCalculado: 45000,
      disponible: 35,
      stockActual: 35,
      stockMinimo: 15,
      alicuotaIva: 21,
      movimientos: [
        {
          id: 'MOV-MED-2',
          fecha: '2026-10-18',
          deposito: 'Depósito Central',
          descripcion: 'Ingreso por Compra Droguería Suizo Argentina Factura A 0012-00459102',
          tipoDoc: 'FAC',
          precio: 45000,
          cantidad: 35,
          proveedorId: 'PRV-SAN-01',
          proveedorNombre: 'DROGUERÍA SUIZO ARGENTINA S.A.',
          proveedorCuit: '30-51698421-7',
          facturaId: 'FC-SAN-201',
          facturaNro: '0012-00459102'
        }
      ]
    }
  ];

  return {
    empresa: emp,
    empresaExtra: {
      nombre: 'SANATORIO ARGENTINO S.R.L.',
      localidad: 'SAN JUAN CAPITAL',
      codPostal: '5400',
      provincia: 'San Juan',
      pais: '12',
      telefono: '+542644225000',
      email: 'administracion@sanatorioargentino.com.ar',
      cbu: '0720194820000009988771',
      convenioMultilateral: false
    },
    clientes: clientesSanatorio,
    proveedores: proveedoresSanatorio,
    facturasVenta: facturasVentaSanatorio,
    facturasCompra: facturasCompraSanatorio,
    cuentasBancarias: mockCuentasBancarias.map((cb) => ({
      ...cb,
      nombre: cb.nombre.replace('ECAR', 'Sanatorio Argentino')
    })),
    cheques: [],
    inventario: inventarioSanatorio,
    empleados: mockEmpleados.filter((e) => e.cct.includes('122/75') || e.cct.includes('Fuera de Convenio')),
    asientosContables: mockAsientosContables.slice(0, 2),
    planDeCuentas: JSON.parse(JSON.stringify(mockPlanDeCuentas)),
    clasificacionesComprasArca: {
      'FC-SAN-201': {
        facturaCompraId: 'FC-SAN-201',
        codigoComprobanteArca: '001',
        computabilidadIva: 'PRORRATEO_ART_13',
        rubroF2002: 'BIENES_DE_CAMBIO',
        percepcionIva: 120000,
        percepcionIibb: 60000,
        conciliadoMisComprobantesArca: true
      },
      'FC-SAN-202': {
        facturaCompraId: 'FC-SAN-202',
        codigoComprobanteArca: '001',
        computabilidadIva: 'PRORRATEO_ART_13',
        rubroF2002: 'BIENES_DE_CAMBIO',
        percepcionIva: 66000,
        percepcionIibb: 33000,
        conciliadoMisComprobantesArca: true
      }
    },
    pendientesMisComprobantesArca: [
      {
        id: 'ARCA-PEND-SAN-1',
        tipoFlujo: 'RECIBIDO_COMPRA',
        fechaEmision: '2026-10-29',
        tipoComprobante: 'Factura A',
        codigoArca: '001',
        puntoVenta: '0004',
        numero: '00089310',
        cuitContraparte: '30-51698421-7',
        razonSocialContraparte: 'DROGUERÍA SUIZO ARGENTINA S.A.',
        netoGravado: 1500000,
        iva21: 315000,
        iva105: 0,
        percepcionIva: 45000,
        percepcionIibb: 22500,
        total: 1882500,
        cae: '76459812039481',
        incorporadoAlErp: false
      }
    ]
  };
}

function buildInitialEcarSnapshot(): TenantIsolatedDataSnapshot {
  const clasificaciones: Record<string, ClasificacionFiscalCompraArca> = {};
  mockFacturasCompra.forEach((fc) => {
    clasificaciones[fc.id] = {
      facturaCompraId: fc.id,
      codigoComprobanteArca: fc.tipo === 'Factura A' ? '001' : fc.tipo === 'Factura C' ? '011' : '006',
      computabilidadIva: 'COMPUTABLE_100',
      rubroF2002: 'BIENES_DE_CAMBIO',
      percepcionIva: fc.retencionIva || 0,
      percepcionIibb: fc.retencionIIBB || 0,
      conciliadoMisComprobantesArca: true
    };
  });

  return {
    empresa: mockEmpresa,
    empresaExtra: {
      nombre: 'ECAR S. A. S.',
      localidad: 'VILLA KRAUSE',
      codPostal: '5425',
      provincia: 'San Juan',
      pais: '12',
      telefono: '+542644693547',
      email: 'administracion@ecarconstrucciones.com',
      cbu: '0720194820000001894211',
      convenioMultilateral: false
    },
    clientes: mockClientes,
    proveedores: mockProveedores,
    facturasVenta: mockFacturasVenta,
    facturasCompra: mockFacturasCompra,
    cuentasBancarias: mockCuentasBancarias,
    cheques: mockCheques,
    inventario: mockInventario,
    empleados: mockEmpleados,
    asientosContables: mockAsientosContables,
    planDeCuentas: JSON.parse(JSON.stringify(mockPlanDeCuentas)),
    clasificacionesComprasArca: clasificaciones,
    pendientesMisComprobantesArca: [
      {
        id: 'ARCA-PEND-ECAR-1',
        tipoFlujo: 'RECIBIDO_COMPRA',
        fechaEmision: '2026-10-28',
        tipoComprobante: 'Factura A',
        codigoArca: '001',
        puntoVenta: '0015',
        numero: '00239104',
        cuitContraparte: '30-50001234-5',
        razonSocialContraparte: 'HOLCIM ARGENTINA S.A. (PLANTA MENDOZA)',
        netoGravado: 3200000,
        iva21: 672000,
        iva105: 0,
        percepcionIva: 96000,
        percepcionIibb: 48000,
        total: 4016000,
        cae: '76440091827364',
        incorporadoAlErp: false
      },
      {
        id: 'ARCA-PEND-ECAR-2',
        tipoFlujo: 'EMITIDO_VENTA',
        fechaEmision: '2026-10-30',
        tipoComprobante: 'Factura A',
        codigoArca: '001',
        puntoVenta: '0002',
        numero: '00000412',
        cuitContraparte: '30-99900112-8',
        razonSocialContraparte: 'OSSE - OBRAS SANITARIAS SOCIEDAD DEL ESTADO',
        netoGravado: 4500000,
        iva21: 945000,
        iva105: 0,
        percepcionIva: 0,
        percepcionIibb: 0,
        total: 5445000,
        cae: '76451122334455',
        incorporadoAlErp: false
      }
    ]
  };
}

function buildInitialAndinaSnapshot(): TenantIsolatedDataSnapshot {
  const emp: EmpresaConfig = {
    razonSocial: 'DISTRIBUIDORA MAYORISTA ANDINA S.A.',
    cuit: '30-71548921-9',
    condicionIva: 'Responsable Inscripto',
    domicilioFiscal: 'Carril Rodríguez Peña 2140, Godoy Cruz, Mendoza',
    inicioActividades: '2017-03-01',
    ingresosBrutos: '913-715489-2',
    puntosVenta: [
      {
        numero: '0003',
        descripcion: 'Centro Logístico Cuyo — Facturación Mayorista',
        tipoEmision: 'Facturación Electrónica Web Service',
        activo: true
      }
    ]
  };

  return {
    empresa: emp,
    empresaExtra: {
      nombre: 'DISTRIBUIDORA ANDINA S.A.',
      localidad: 'GODOY CRUZ',
      codPostal: '5501',
      provincia: 'Mendoza',
      pais: '12',
      telefono: '+542614901122',
      email: 'fiscal@andinamayorista.com.ar',
      cbu: '0170089420000005544332',
      convenioMultilateral: true
    },
    clientes: [
      {
        id: 'CLI-AND-01',
        nombre: 'FERRETERÍA INDUSTRIAL DEL OESTE S.R.L.',
        razonSocial: 'FERRETERÍA INDUSTRIAL DEL OESTE S.R.L.',
        cuit: '30-70981234-6',
        condicionIva: 'Responsable Inscripto',
        email: 'compras@ferreteriaoeste.com.ar',
        telefono: '261-4259900',
        domicilio: 'San Martín 1420, Luján de Cuyo, Mendoza',
        listaPrecios: 'Mayorista Gremio',
        limiteCredito: 35000000,
        vendedor: 'Zona Cuyo Norte',
        activo: true,
        saldo: 6050000,
        facturasAdeudadas: [
          {
            id: 'FAC-AND-01',
            nroComprobante: '0003-00009120',
            tipo: 'Factura A',
            fechaEmision: '2026-10-20',
            fechaPago: '2026-11-20',
            descripcion: 'Provisión Mayorista de Tuberías PEAD y Válvulas Esféricas',
            valorMe: 0,
            total: 6050000,
            cobrado: 0,
            saldo: 6050000,
            saldoAcumulado: 6050000,
            medioCobroPactado: 'Cheque de Terceros'
          }
        ],
        movimientos: []
      }
    ],
    proveedores: [
      {
        id: 'PRV-AND-01',
        nombre: 'ACINDAR INDUSTRIA ARGENTINA DE ACEROS S.A.',
        razonSocial: 'ACINDAR INDUSTRIA ARGENTINA DE ACEROS S.A.',
        cuit: '30-50119922-1',
        condicionIva: 'Responsable Inscripto',
        email: 'facturacion@acindar.com.ar',
        telefono: '011-4014-2000',
        domicilio: 'Ruta Prov. 21 Km 247, Villa Constitución, Santa Fe',
        cuentaGastoHabitual: '1.1.04 - Mercaderías de Reventa',
        condicionPago: '30 días Fecha Factura',
        activo: true,
        saldo: 3720000,
        facturasAdeudadas: [],
        movimientos: []
      }
    ],
    facturasVenta: [
      {
        id: 'FV-AND-01',
        puntoVenta: '0003',
        numero: '00009120',
        tipo: 'Factura A',
        fechaEmision: '2026-10-20',
        fechaVencimiento: '2026-11-20',
        clienteNombre: 'FERRETERÍA INDUSTRIAL DEL OESTE S.R.L.',
        clienteCuit: '30-70981234-6',
        condicionIva: 'Responsable Inscripto',
        netoGravado: 5000000,
        iva21: 1050000,
        iva105: 0,
        total: 6050000,
        cae: '76448877665544',
        caeVencimiento: '2026-10-30',
        estado: 'Pendiente'
      }
    ],
    facturasCompra: [
      {
        id: 'FC-AND-01',
        numero: '0040-00881230',
        tipo: 'Factura A',
        fechaComprobante: '2026-10-14',
        fechaImputacion: '2026-10-14',
        proveedorNombre: 'ACINDAR INDUSTRIA ARGENTINA DE ACEROS S.A.',
        proveedorCuit: '30-50119922-1',
        cuentaGasto: '1.1.04 - Mercaderías de Reventa',
        netoGravado: 3000000,
        iva: 630000,
        retencionIva: 0,
        retencionIIBB: 90000,
        total: 3720000,
        estadoPago: 'Pendiente'
      }
    ],
    cuentasBancarias: mockCuentasBancarias.slice(0, 2),
    cheques: [],
    inventario: mockInventario.slice(0, 3),
    empleados: mockEmpleados.slice(0, 2),
    asientosContables: mockAsientosContables.slice(0, 1),
    planDeCuentas: JSON.parse(JSON.stringify(mockPlanDeCuentas)),
    clasificacionesComprasArca: {
      'FC-AND-01': {
        facturaCompraId: 'FC-AND-01',
        codigoComprobanteArca: '001',
        computabilidadIva: 'COMPUTABLE_100',
        rubroF2002: 'BIENES_DE_CAMBIO',
        percepcionIva: 90000,
        percepcionIibb: 90000,
        conciliadoMisComprobantesArca: true
      }
    },
    pendientesMisComprobantesArca: []
  };
}

export const SYNC_BROADCAST_CHANNEL_NAME = 'zonda_erp_realtime_sync_channel_v1';

export interface ZondaSyncBroadcastMessage {
  type: 'TENANT_SNAPSHOT_UPDATED' | 'TENANTS_LIST_UPDATED' | 'ACTIVE_TENANT_CHANGED' | 'MANUAL_FULL_SYNC';
  tenantId?: string;
  actor?: string;
  actionLabel?: string;
  timestamp: string;
}

export function broadcastZondaSyncEvent(msg: Omit<ZondaSyncBroadcastMessage, 'timestamp'>): void {
  const payload: ZondaSyncBroadcastMessage = {
    ...msg,
    timestamp: new Date().toLocaleTimeString('es-AR')
  };
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(SYNC_BROADCAST_CHANNEL_NAME);
      ch.postMessage(payload);
      ch.close();
    }
  } catch {
    // ignore BroadcastChannel errors
  }
  try {
    window.dispatchEvent(new CustomEvent('zonda_local_sync_event', { detail: payload }));
  } catch {
    // ignore event errors
  }
}

export function loadTenantsList(): TenantEmpresa[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TENANTS_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_TENANTS;
}

export function saveTenantsList(tenants: TenantEmpresa[], broadcast = true): void {
  try {
    localStorage.setItem(STORAGE_KEY_TENANTS_LIST, JSON.stringify(tenants));
    if (broadcast) {
      broadcastZondaSyncEvent({
        type: 'TENANTS_LIST_UPDATED',
        actionLabel: 'Actualización de Padrón Multi-Tenant / Permisos Zonda Cloud'
      });
    }
    void supabase
      .from('erp_integraciones_config')
      .upsert(
        {
          id: 'MULTITENANT_LIST',
          afip_config: { tenants, updated_at: new Date().toISOString() },
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .then(() => {});
  } catch {
    // ignore storage errors
  }
}

export function loadActiveTenantId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_TENANT);
    if (saved) return saved;
  } catch {
    // ignore
  }
  return 'TENANT-ECAR';
}

export function saveActiveTenantId(tenantId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_TENANT, tenantId);
    broadcastZondaSyncEvent({
      type: 'ACTIVE_TENANT_CHANGED',
      tenantId,
      actionLabel: `Cambio de Empresa Activa (${tenantId})`
    });
  } catch {
    // ignore
  }
}

export function loadTenantDataSnapshot(tenantId: string): TenantIsolatedDataSnapshot {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX_TENANT_DATA}${tenantId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.planDeCuentas) {
        parsed.planDeCuentas = JSON.parse(JSON.stringify(mockPlanDeCuentas));
      }
      return parsed;
    }
  } catch {
    // ignore
  }

  let initial: TenantIsolatedDataSnapshot;
  if (tenantId === 'TENANT-SANATORIO') {
    initial = buildInitialSanatorioSnapshot();
  } else if (tenantId === 'TENANT-ANDINA') {
    initial = buildInitialAndinaSnapshot();
  } else {
    initial = buildInitialEcarSnapshot();
  }
  saveTenantDataSnapshot(tenantId, initial, false);
  return initial;
}

export function saveTenantDataSnapshot(
  tenantId: string,
  snapshot: TenantIsolatedDataSnapshot,
  broadcast = true
): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX_TENANT_DATA}${tenantId}`, JSON.stringify(snapshot));
    if (broadcast) {
      broadcastZondaSyncEvent({
        type: 'TENANT_SNAPSHOT_UPDATED',
        tenantId,
        actionLabel: `Sincronización Omnicanal Tenant ${tenantId}`
      });
    }
    void supabase
      .from('erp_integraciones_config')
      .upsert(
        {
          id: `TENANT_SNAP_${tenantId}`,
          afip_config: {
            tenantId,
            snapshot,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .then(() => {});
  } catch {
    // ignore
  }
}

export async function pullRemoteTenantSnapshotFromSupabase(
  tenantId: string
): Promise<TenantIsolatedDataSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('erp_integraciones_config')
      .select('afip_config')
      .eq('id', `TENANT_SNAP_${tenantId}`)
      .maybeSingle();
    if (!error && data?.afip_config && (data.afip_config as any).snapshot) {
      const remoteSnap = (data.afip_config as any).snapshot as TenantIsolatedDataSnapshot;
      localStorage.setItem(`${STORAGE_PREFIX_TENANT_DATA}${tenantId}`, JSON.stringify(remoteSnap));
      return remoteSnap;
    }
  } catch {
    // ignore network errors
  }
  return null;
}

