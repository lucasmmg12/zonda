import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Cliente,
  Proveedor,
  ComprobanteVenta,
  ComprobanteCompra,
  CuentaBancaria,
  Cheque,
  CuentaContable,
  AsientoContable,
  ArticuloInventario,
  EmpresaConfig,
  EmpleadoLegajo,
  LiquidacionPeriodo,
  FacturaAdeudada,
  FacturaAdeudadaProveedor,
  ChequeAsociadoFactura,
  MovimientoTesoreria,
  MovimientoMayor,
  TipoComprobante,
  ConvenioColectivo
} from '../types/models';
import {
  mockClientes,
  mockProveedores,
  mockEmpresa,
  mockFacturasVenta,
  mockFacturasCompra,
  mockCuentasBancarias,
  mockCheques,
  mockPlanDeCuentas,
  mockAsientosContables,
  mockInventario,
  mockEmpleados,
  mockLiquidacionActual
} from '../services/mockData';
import type { ModuleKey } from '../components/layout/Sidebar';
import {
  type TenantEmpresa,
  type AutorizacionZondaCloud,
  type ClasificacionFiscalCompraArca,
  type ComprobantePendienteMisComprobantesArca,
  type TenantIsolatedDataSnapshot,
  loadTenantsList,
  saveTenantsList,
  loadActiveTenantId,
  saveActiveTenantId,
  loadTenantDataSnapshot,
  saveTenantDataSnapshot,
  pullRemoteTenantSnapshotFromSupabase,
  SYNC_BROADCAST_CHANNEL_NAME,
  broadcastZondaSyncEvent,
  type ZondaSyncBroadcastMessage
} from '../services/multiTenantZondaCloudService';

export interface EmpresaDatosExtra {
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
}

export interface LineaMedioPagoMixto {
  id?: string;
  medio: string;
  cuentaBancariaId?: string;
  importe: number;
  nroCheque?: string;
  bancoCheque?: string;
  fechaPagoCheque?: string;
  chequeCarteraId?: string;
  marcaTarjeta?: string;
  nroCuponTarjeta?: string;
}

export interface DesgloseRetencionesFiscales {
  retencionIIBB?: number;
  retencionGanancias?: number;
  retencionIVA?: number;
  retencionSUSS?: number;
  nroCertificado?: string;
}

export interface EventoSincronizacionViva {
  id: string;
  hora: string;
  moduloOrigen: string;
  evento: string;
  detalle: string;
  canalesImpactados: string[];
  estado: 'SINCRONIZADO' | 'RECIBIDO_CLOUD' | 'MULTI_PESTAÑA';
}

interface ErpContextValue {
  // Estado de Base de Datos Supabase & Sincronización Omnicanal
  dbStatus: 'sincronizando' | 'conectado' | 'error';
  lastSync: string;
  eventosSincronizacion: EventoSincronizacionViva[];
  registrarEventoSincronizacion: (ev: Omit<EventoSincronizacionViva, 'id' | 'hora'>) => void;
  forzarSincronizacionOmnicanal: () => Promise<void>;
  refreshAllFromDb: () => Promise<void>;

  // Navegación global
  activeModule: ModuleKey;
  setActiveModule: (mod: ModuleKey) => void;

  // Entidades principales
  empresa: EmpresaConfig;
  empresaExtra: EmpresaDatosExtra;
  clientes: Cliente[];
  proveedores: Proveedor[];
  facturasVenta: ComprobanteVenta[];
  facturasCompra: ComprobanteCompra[];
  cuentasBancarias: CuentaBancaria[];
  cheques: Cheque[];
  planDeCuentas: CuentaContable[];
  asientosContables: AsientoContable[];
  inventario: ArticuloInventario[];
  empleados: EmpleadoLegajo[];
  liquidacionActual: LiquidacionPeriodo;

  // Acciones Clientes y Ventas
  crearCliente: (nuevo: Omit<Cliente, 'id' | 'facturasAdeudadas' | 'movimientos' | 'saldo'>) => Promise<Cliente>;
  emitirFacturaVenta: (params: {
    clienteId: string;
    tipo: TipoComprobante;
    puntoVenta?: string;
    numero?: string;
    fechaEmision?: string;
    fechaVencimiento?: string;
    netoGravado: number;
    noGravado?: number;
    exento?: number;
    iva21?: number;
    iva105?: number;
    iva27?: number;
    percepcionIva?: number;
    percepcionIIBB?: number;
    impuestosInternos?: number;
    otrosTributos?: number;
    cae?: string;
    caeVencimiento?: string;
    descripcion: string;
    medioCobroPactado?: string;
    itemsInventarioVenta?: {
      articuloId: string;
      cantidad: number;
      precioUnitarioNeto: number;
      deposito?: string;
    }[];
    cancelacionAlContado?: {
      activa: boolean;
      cuentaBancariaId?: string;
      nroCheque?: string;
      lineasMediosCobro?: LineaMedioPagoMixto[];
      retencionesSufridas?: DesgloseRetencionesFiscales;
    };
  }) => Promise<void>;
  registrarCobroCliente: (params: {
    clienteId: string;
    monto: number;
    medioCobro: string;
    cuentaBancariaId?: string;
    nroCheque?: string;
    bancoCheque?: string;
    fechaPagoCheque?: string;
    nroCuponTarjeta?: string;
    marcaTarjeta?: string;
    facturaId?: string;
    facturaNro?: string;
    lineasMediosCobro?: LineaMedioPagoMixto[];
    retencionesSufridas?: DesgloseRetencionesFiscales;
  }) => Promise<void>;
  emitirNotaCreditoDebitoCliente: (params: {
    clienteId: string;
    tipo: 'Nota de Crédito A' | 'Nota de Crédito B' | 'Nota de Débito';
    facturaAsociadaId?: string;
    netoGravado: number;
    iva21?: number;
    descripcion: string;
    reingresarStockItems?: { articuloId: string; cantidad: number }[];
  }) => Promise<void>;

  // Acciones Proveedores y Compras
  crearProveedor: (nuevo: Omit<Proveedor, 'id' | 'facturasAdeudadas' | 'movimientos' | 'saldo'>) => Promise<Proveedor>;
  registrarFacturaCompra: (params: {
    proveedorId: string;
    tipo: 'Factura A' | 'Factura B' | 'Factura C' | 'Liquidación' | 'Nota de Débito';
    nroComprobante?: string;
    netoGravado: number;
    descripcion: string;
    cuentaGasto?: string;
    medioPagoPactado?: string;
    fechaVencimiento?: string;
    cantidadCuotas?: number;
    itemsInventarioAsociados?: {
      articuloAsociadoId: string;
      codigoProveedor: string;
      descripcionProveedor: string;
      cantidad: number;
      costoUnitarioNeto: number;
    }[];
    cancelacionAlContado?: {
      activa: boolean;
      cuentaBancariaId?: string;
      nroCheque?: string;
      lineasMediosPago?: LineaMedioPagoMixto[];
      retencionesPracticadas?: DesgloseRetencionesFiscales;
    };
  }) => Promise<void>;
  registrarPagoProveedor: (params: {
    proveedorId: string;
    monto: number;
    medioPago: string;
    cuentaBancariaId?: string;
    nroCheque?: string;
    facturaId?: string;
    facturaNro?: string;
    cantidadCuotas?: number;
    chequesEmitidos?: {
      numero: string;
      bancoEmisor: string;
      fechaPago: string;
      importe: number;
      tipo: 'Cheque Propio Diferido' | 'Cheque Terceros (Cartera)';
      chequeCarteraId?: string;
      cuotaNro?: number;
      totalCuotas?: number;
    }[];
    lineasMediosPago?: LineaMedioPagoMixto[];
    retencionesPracticadas?: DesgloseRetencionesFiscales;
  }) => Promise<void>;

  // Acciones Tesorería
  crearCuentaBancaria: (params: {
    nombre: string;
    banco: string;
    tipoCuenta: CuentaBancaria['tipoCuenta'];
    moneda?: 'ARS' | 'USD';
    cbu?: string;
    saldoInicial: number;
  }) => Promise<CuentaBancaria>;
  editarCuentaBancaria: (id: string, cambios: Partial<CuentaBancaria>) => Promise<void>;
  conciliarCuentaBancaria: (id: string) => Promise<void>;
  conciliarMovimientosCuenta: (cuentaId: string, movimientoIds: string[]) => Promise<void>;
  emitirNotaCreditoDebitoProveedor: (params: {
    proveedorId: string;
    tipo: 'Nota de Crédito A' | 'Nota de Crédito B' | 'Nota de Débito';
    facturaAsociadaId?: string;
    netoGravado: number;
    descripcion: string;
  }) => Promise<void>;
  depositarCheque: (chequeId: string, cuentaDestinoId?: string) => Promise<void>;
  registrarMovimientoTesoreria: (params: {
    cuentaId: string;
    tipo: string;
    clienteProveedor: string;
    descripcion: string;
    ingresos: number;
    egresos: number;
    nroCheque?: string;
  }) => Promise<void>;

  // Acciones Contabilidad
  actualizarCuentaContable: (codigo: string, cambios: Partial<CuentaContable>) => Promise<void>;
  agregarCuentaContable: (padreCodigo: string, nuevaCuenta: CuentaContable) => Promise<void>;
  registrarAsientoManual: (params: {
    fecha: string;
    concepto: string;
    cuentaDebeCodigo: string;
    cuentaHaberCodigo: string;
    monto: number;
    tipoOrigen?: AsientoContable['tipoOrigen'];
  }) => Promise<void>;

  // Acciones Inventario
  crearArticuloInventario: (params: {
    codigo: string;
    descripcion: string;
    tipo: string;
    um: string;
    categoria?: string;
    precioVentaNeto: number;
    costoCalculado: number;
    stockInicial: number;
    deposito?: string;
    proveedorId?: string;
    proveedorNombre?: string;
    proveedorCuit?: string;
    facturaId?: string;
    facturaNro?: string;
  }) => Promise<ArticuloInventario>;
  actualizarPreciosInventario: (porcentajeVariacion: number) => Promise<void>;
  registrarMovimientoStock: (params: {
    articuloId: string;
    tipoDoc: string;
    descripcion: string;
    cantidad: number;
    precio?: number;
    deposito?: string;
    proveedorId?: string;
    proveedorNombre?: string;
    proveedorCuit?: string;
    facturaId?: string;
    facturaNro?: string;
    destinoEgreso?: string;
    comprobanteEgreso?: string;
  }) => Promise<void>;

  // Acciones Sueldos
  crearEmpleadoLegajo: (params: {
    nombreCompleto: string;
    cuil: string;
    cct: ConvenioColectivo;
    categoria: string;
    sueldoBasico: number;
    banco?: string;
    conceptosLiquidacion?: EmpleadoLegajo['conceptosLiquidacion'];
  }) => Promise<EmpleadoLegajo>;
  actualizarEmpleadoLegajo: (
    empleadoId: string,
    cambios: Partial<EmpleadoLegajo>
  ) => Promise<void>;
  actualizarLiquidacionPeriodo: (params: {
    periodo: string;
    tipoLiquidacion: LiquidacionPeriodo['tipoLiquidacion'];
    fechaPago: string;
  }) => Promise<void>;

  // Acciones Configuración Empresa
  guardarConfiguracionEmpresa: (nuevaEmpresa: EmpresaConfig, extra: EmpresaDatosExtra) => Promise<void>;

  // Multi-Tenant (Aislamiento por CUIT/Empresa) & Zonda Cloud (Liquidación Impositiva ARCA Delegada)
  tenants: TenantEmpresa[];
  activeTenantId: string;
  activeTenant: TenantEmpresa;
  cambiarTenantActivo: (tenantId: string) => void;
  crearNuevoTenant: (params: {
    razonSocial: string;
    nombreFantasia: string;
    cuit: string;
    condicionIva: string;
    actividadPrincipalArca: string;
    jurisdiccionPrincipal: string;
    convenioMultilateral: boolean;
    autorizarZondaCloudInicial: boolean;
  }) => TenantEmpresa;
  actualizarAutorizacionZondaCloud: (
    tenantId: string,
    cambios: Partial<AutorizacionZondaCloud>,
    eventoAudit?: { actor: string; accion: string; detalle: string }
  ) => void;
  clasificacionesComprasArca: Record<string, ClasificacionFiscalCompraArca>;
  pendientesMisComprobantesArca: ComprobantePendienteMisComprobantesArca[];
  obtenerSnapshotDeTenant: (tenantId: string) => TenantIsolatedDataSnapshot;
  actualizarClasificacionFiscalCompraEnTenant: (
    tenantId: string,
    facturaCompraId: string,
    cambios: Partial<ClasificacionFiscalCompraArca>
  ) => void;
  incorporarComprobanteMisComprobantesArcaEnTenant: (
    tenantId: string,
    pendienteId: string
  ) => void;
  registrarComprobanteFiscalDesdeZondaCloud: (
    tenantId: string,
    params: {
      flujo: 'VENTA' | 'COMPRA';
      tipo: 'Factura A' | 'Factura B' | 'Factura C' | 'Nota de Débito';
      puntoVenta: string;
      numero: string;
      fecha: string;
      cuitContraparte: string;
      razonSocialContraparte: string;
      netoGravado: number;
      alicuotaIva: 21 | 10.5 | 0;
      percepcionIva: number;
      percepcionIibb: number;
      computabilidadIva?: ClasificacionFiscalCompraArca['computabilidadIva'];
      rubroF2002?: ClasificacionFiscalCompraArca['rubroF2002'];
      descripcion: string;
    }
  ) => void;
}

const ErpContext = createContext<ErpContextValue | null>(null);

// Función auxiliar recursiva para actualizar nodos del Plan de Cuentas
function updatePlanCuentasTree(
  nodes: CuentaContable[],
  targetCodigo: string,
  updater: (node: CuentaContable) => CuentaContable
): CuentaContable[] {
  return nodes.map((node) => {
    if (node.codigo === targetCodigo) {
      return updater(node);
    }
    if (node.hijos && node.hijos.length > 0) {
      return {
        ...node,
        hijos: updatePlanCuentasTree(node.hijos, targetCodigo, updater)
      };
    }
    return node;
  });
}

// Función auxiliar para encontrar una cuenta por código en el árbol
export function findCuentaInTree(nodes: CuentaContable[], codigo: string): CuentaContable | undefined {
  for (const n of nodes) {
    if (n.codigo === codigo) return n;
    if (n.hijos) {
      const found = findCuentaInTree(n.hijos, codigo);
      if (found) return found;
    }
  }
  return undefined;
}

// Función para aplanar cuentas imputables
export function flattenCuentasContables(nodes: CuentaContable[]): CuentaContable[] {
  const result: CuentaContable[] = [];
  for (const n of nodes) {
    if (n.codigo !== '99') {
      result.push(n);
    }
    if (n.hijos) {
      result.push(...flattenCuentasContables(n.hijos));
    }
  }
  return result;
}

const normalizarCuit = (cuit: string): string => (cuit || '').replace(/[^0-9]/g, '');

// Motor de reconciliación bidireccional Clientes <-> FacturasVenta y Proveedores <-> FacturasCompra
export function reconciliarRelacionesComprobantes(
  clientesRaw: Cliente[],
  proveedoresRaw: Proveedor[],
  ventasRaw: ComprobanteVenta[],
  comprasRaw: ComprobanteCompra[]
): {
  clientesReconciliados: Cliente[];
  proveedoresReconciliados: Proveedor[];
} {
  const cuitsClientesVistos = new Set<string>();
  const clientesList: Cliente[] = [];
  for (const c of clientesRaw) {
    const cuitNorm = normalizarCuit(c.cuit);
    if (cuitNorm && cuitNorm !== '00000000000' && cuitNorm !== '30000000000') {
      if (cuitsClientesVistos.has(cuitNorm)) continue;
      cuitsClientesVistos.add(cuitNorm);
    }
    clientesList.push({
      ...c,
      facturasAdeudadas: [...(c.facturasAdeudadas || [])],
      movimientos: [...(c.movimientos || [])]
    });
  }

  const cuitsProveedoresVistos = new Set<string>();
  const proveedoresList: Proveedor[] = [];
  for (const p of proveedoresRaw) {
    const cuitNorm = normalizarCuit(p.cuit);
    if (cuitNorm && cuitNorm !== '00000000000' && cuitNorm !== '30000000000') {
      if (cuitsProveedoresVistos.has(cuitNorm)) continue;
      cuitsProveedoresVistos.add(cuitNorm);
    }
    proveedoresList.push({
      ...p,
      facturasAdeudadas: [...(p.facturasAdeudadas || [])],
      movimientos: [...(p.movimientos || [])]
    });
  }

  // 1. Reconciliar Ventas -> Clientes
  for (const fv of ventasRaw) {
    if (fv.estado === 'Anulado') continue;
    const cuitFv = normalizarCuit(fv.clienteCuit);
    const nroCompleto = `${fv.puntoVenta}-${fv.numero}`;
    let cli = clientesList.find(
      (c) =>
        (cuitFv && normalizarCuit(c.cuit) === cuitFv) ||
        c.razonSocial.trim().toUpperCase() === fv.clienteNombre.trim().toUpperCase()
    );

    if (!cli) {
      cli = {
        id: `CLI-AUTO-${clientesList.length + 1}`,
        nombre: fv.clienteNombre.toUpperCase(),
        razonSocial: fv.clienteNombre.toUpperCase(),
        cuit: fv.clienteCuit,
        condicionIva: fv.condicionIva || 'Responsable Inscripto',
        domicilio: 'San Juan, Argentina',
        telefono: '264-4200000',
        email: 'administracion@cliente.com.ar',
        saldo: 0,
        activo: true,
        listaPrecios: 'Lista General',
        limiteCredito: 50000000,
        vendedor: 'Administración Central',
        facturasAdeudadas: [],
        movimientos: []
      };
      clientesList.push(cli);
    }

    const tieneMov = cli.movimientos.some(
      (m) => m.comprobante.includes(fv.numero) || m.comprobante.includes(nroCompleto)
    );
    const tieneAdeudada = cli.facturasAdeudadas.some(
      (f) => f.nroComprobante.includes(fv.numero) || f.nroComprobante === nroCompleto
    );

    if (!tieneMov) {
      const esNotaCredito = fv.tipo.toLowerCase().includes('crédito');
      const importeAbs = Math.abs(fv.total);
      const nuevoSaldo = esNotaCredito
        ? Math.max(0, Number((cli.saldo - importeAbs).toFixed(2)))
        : Number((cli.saldo + (tieneAdeudada ? 0 : importeAbs)).toFixed(2));

      if (!tieneAdeudada && !esNotaCredito) {
        cli.saldo = nuevoSaldo;
        cli.facturasAdeudadas.unshift({
          id: `FA-${fv.id}`,
          nroComprobante: nroCompleto,
          tipo: fv.tipo,
          fechaEmision: fv.fechaEmision,
          fechaPago: fv.fechaVencimiento || fv.fechaEmision,
          descripcion: `Comprobante Electrónico ${fv.tipo} ${nroCompleto} (CAE ${fv.cae || 'Homologado'})`,
          valorMe: 0,
          total: importeAbs,
          cobrado: 0,
          saldo: importeAbs,
          saldoAcumulado: cli.saldo
        });
      }

      cli.movimientos.push({
        id: `MOV-SYNC-${fv.id}`,
        fecha: fv.fechaEmision,
        comprobante: `${fv.tipo} ${nroCompleto}`,
        concepto: `Comprobante Fiscal Asociado (${fv.tipo} ${nroCompleto})`,
        debe: esNotaCredito ? 0 : importeAbs,
        haber: esNotaCredito ? importeAbs : 0,
        saldo: cli.saldo
      });
    }
  }

  // 2. Reconciliar Compras -> Proveedores
  for (const fc of comprasRaw) {
    const cuitFc = normalizarCuit(fc.proveedorCuit);
    let prv = proveedoresList.find(
      (p) =>
        (cuitFc && normalizarCuit(p.cuit) === cuitFc) ||
        p.razonSocial.trim().toUpperCase() === fc.proveedorNombre.trim().toUpperCase()
    );

    if (!prv) {
      prv = {
        id: `PRV-AUTO-${proveedoresList.length + 1}`,
        nombre: fc.proveedorNombre.toUpperCase(),
        razonSocial: fc.proveedorNombre.toUpperCase(),
        cuit: fc.proveedorCuit,
        condicionIva: 'Responsable Inscripto',
        domicilio: 'San Juan, Argentina',
        telefono: '264-4200000',
        email: 'proveedores@empresa.com.ar',
        saldo: 0,
        activo: true,
        cuentaGastoHabitual: fc.cuentaGasto || '5.1.01 Materiales e Insumos',
        condicionPago: '30 días FF',
        facturasAdeudadas: [],
        movimientos: []
      };
      proveedoresList.push(prv);
    }

    const tieneMov = prv.movimientos.some((m) => m.comprobante.includes(fc.numero));
    const tieneAdeudada = prv.facturasAdeudadas.some((f) => f.nroComprobante === fc.numero);

    if (!tieneAdeudada && fc.estadoPago === 'Pendiente') {
      if (!tieneMov) {
        prv.saldo = Number((prv.saldo + fc.total).toFixed(2));
      }
      prv.facturasAdeudadas.unshift({
        id: `FP-${fc.id}`,
        nroComprobante: fc.numero,
        tipo: fc.tipo,
        fechaEmision: fc.fechaComprobante,
        fechaPago: fc.fechaImputacion || fc.fechaComprobante,
        descripcion: fc.cuentaGasto || 'Comprobante de compra asociado',
        medioPagoPactado: fc.medioPagoPactado || 'Transferencia Bancaria Santander',
        cantidadCuotas: 1,
        cuotasPagadas: 0,
        chequesAsociados: [],
        valorMe: 0,
        total: fc.total,
        pagado: 0,
        saldo: fc.total,
        saldoAcumulado: prv.saldo
      });
    }

    if (!tieneMov) {
      prv.movimientos.push({
        id: `MP-SYNC-${fc.id}`,
        fecha: fc.fechaComprobante,
        comprobante: `${fc.tipo} ${fc.numero}`,
        concepto: `${fc.cuentaGasto || 'Factura de Compra'} [${fc.estadoPago === 'Pagado Total' ? 'PAGADO' : 'PENDIENTE DE PAGO'}]`,
        debe: 0,
        haber: fc.total,
        saldo: prv.saldo
      });
      if (fc.estadoPago === 'Pagado Total') {
        prv.movimientos.push({
          id: `MP-SYNC-PAG-${fc.id}`,
          fecha: fc.fechaImputacion || fc.fechaComprobante,
          comprobante: `OP Canc. ${fc.numero}`,
          concepto: `Cancelación de ${fc.tipo} ${fc.numero}`,
          debe: fc.total,
          haber: 0,
          saldo: prv.saldo
        });
      }
    }
  }

  for (const c of clientesList) {
    c.saldo = Number(c.facturasAdeudadas.reduce((acc, f) => acc + Math.max(0, f.saldo), 0).toFixed(2));
  }
  for (const p of proveedoresList) {
    p.saldo = Number(p.facturasAdeudadas.reduce((acc, f) => acc + Math.max(0, f.saldo), 0).toFixed(2));
  }

  return {
    clientesReconciliados: clientesList,
    proveedoresReconciliados: proveedoresList
  };
}

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialModule = (): ModuleKey => {
    const hash = window.location.hash.replace('#', '') as ModuleKey;
    const validModules: ModuleKey[] = [
      'tablero',
      'clientes',
      'proveedores',
      'tesoreria',
      'contabilidad',
      'inventario',
      'sueldos',
      'migracion',
      'configuracion',
      'usuarios',
      'zondacloud'
    ];
    if (validModules.includes(hash)) return hash;
    return 'tablero';
  };

  const [activeModule, setActiveModuleState] = useState<ModuleKey>(getInitialModule);
  const [dbStatus, setDbStatus] = useState<'sincronizando' | 'conectado' | 'error'>('sincronizando');
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString('es-AR'));
  const [eventosSincronizacion, setEventosSincronizacion] = useState<EventoSincronizacionViva[]>(() => [
    {
      id: 'SYNC-INIT-01',
      hora: new Date().toLocaleTimeString('es-AR'),
      moduloOrigen: 'Motor Omnicanal Zonda',
      evento: 'BUS DE SINCRONIZACIÓN MULTI-MÓDULO ACTIVO',
      detalle:
        'Clientes, Proveedores, Stock Kárdex, Tesorería Multi-Cuenta, Libro Diario, Zonda Cloud ARCA y Balance RT 54 enlazados en tiempo real.',
      canalesImpactados: ['Supabase DB', 'BroadcastChannel Multi-Pestaña', 'Zonda Cloud ARCA', 'RT 54 (22 Hojas)'],
      estado: 'SINCRONIZADO'
    }
  ]);

  const registrarEventoSincronizacion = useCallback(
    (ev: Omit<EventoSincronizacionViva, 'id' | 'hora'>) => {
      const horaActual = new Date().toLocaleTimeString('es-AR');
      setLastSync(horaActual);
      setEventosSincronizacion((prev) =>
        [
          {
            id: `SYNC-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            hora: horaActual,
            ...ev
          },
          ...prev
        ].slice(0, 35)
      );
    },
    []
  );

  // Estado Multi-Tenant (Aislamiento estricto por Empresa / CUIT)
  const [tenants, setTenants] = useState<TenantEmpresa[]>(() => loadTenantsList());
  const [activeTenantId, setActiveTenantIdState] = useState<string>(() => loadActiveTenantId());

  const initialTenantSnap = loadTenantDataSnapshot(loadActiveTenantId());
  const initialReconciliacion = reconciliarRelacionesComprobantes(
    initialTenantSnap.clientes,
    initialTenantSnap.proveedores,
    initialTenantSnap.facturasVenta,
    initialTenantSnap.facturasCompra
  );

  const [empresa, setEmpresa] = useState<EmpresaConfig>(initialTenantSnap.empresa);
  const [empresaExtra, setEmpresaExtra] = useState<EmpresaDatosExtra>(initialTenantSnap.empresaExtra);

  const [clientes, setClientes] = useState<Cliente[]>(initialReconciliacion.clientesReconciliados);
  const [proveedores, setProveedores] = useState<Proveedor[]>(initialReconciliacion.proveedoresReconciliados);
  const [facturasVenta, setFacturasVenta] = useState<ComprobanteVenta[]>(initialTenantSnap.facturasVenta);
  const [facturasCompra, setFacturasCompra] = useState<ComprobanteCompra[]>(initialTenantSnap.facturasCompra);
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>(initialTenantSnap.cuentasBancarias);
  const [cheques, setCheques] = useState<Cheque[]>(initialTenantSnap.cheques);
  const [planDeCuentas, setPlanDeCuentas] = useState<CuentaContable[]>(
    initialTenantSnap.planDeCuentas || mockPlanDeCuentas
  );
  const [asientosContables, setAsientosContables] = useState<AsientoContable[]>(initialTenantSnap.asientosContables);
  const [inventario, setInventario] = useState<ArticuloInventario[]>(initialTenantSnap.inventario);
  const [empleados, setEmpleados] = useState<EmpleadoLegajo[]>(initialTenantSnap.empleados);
  const [liquidacionActual, setLiquidacionActual] = useState<LiquidacionPeriodo>(mockLiquidacionActual);
  const [clasificacionesComprasArca, setClasificacionesComprasArca] = useState<
    Record<string, ClasificacionFiscalCompraArca>
  >(initialTenantSnap.clasificacionesComprasArca || {});
  const [pendientesMisComprobantesArca, setPendientesMisComprobantesArca] = useState<
    ComprobantePendienteMisComprobantesArca[]
  >(initialTenantSnap.pendientesMisComprobantesArca || []);

  const activeTenant =
    tenants.find((t) => t.tenantId === activeTenantId) || tenants[0];

  // Persistir automáticamente el snapshot aislado del Tenant activo ante cualquier cambio
  useEffect(() => {
    saveTenantDataSnapshot(activeTenantId, {
      empresa,
      empresaExtra,
      clientes,
      proveedores,
      facturasVenta,
      facturasCompra,
      cuentasBancarias,
      cheques,
      inventario,
      empleados,
      asientosContables,
      planDeCuentas,
      clasificacionesComprasArca,
      pendientesMisComprobantesArca
    });
  }, [
    activeTenantId,
    empresa,
    empresaExtra,
    clientes,
    proveedores,
    facturasVenta,
    facturasCompra,
    cuentasBancarias,
    cheques,
    inventario,
    empleados,
    asientosContables,
    planDeCuentas,
    clasificacionesComprasArca,
    pendientesMisComprobantesArca
  ]);

  const setActiveModule = (mod: ModuleKey) => {
    setActiveModuleState(mod);
    window.location.hash = mod;
  };

  const cambiarTenantActivo = (nuevoTenantId: string) => {
    if (nuevoTenantId === activeTenantId) return;
    // Guardar el estado actual del tenant saliente
    saveTenantDataSnapshot(activeTenantId, {
      empresa,
      empresaExtra,
      clientes,
      proveedores,
      facturasVenta,
      facturasCompra,
      cuentasBancarias,
      cheques,
      inventario,
      empleados,
      asientosContables,
      planDeCuentas,
      clasificacionesComprasArca,
      pendientesMisComprobantesArca
    });

    // Cargar el snapshot aislado del nuevo tenant
    const snap = loadTenantDataSnapshot(nuevoTenantId);
    const { clientesReconciliados, proveedoresReconciliados } = reconciliarRelacionesComprobantes(
      snap.clientes,
      snap.proveedores,
      snap.facturasVenta,
      snap.facturasCompra
    );
    setActiveTenantIdState(nuevoTenantId);
    saveActiveTenantId(nuevoTenantId);
    setEmpresa(snap.empresa);
    setEmpresaExtra(snap.empresaExtra);
    setClientes(clientesReconciliados);
    setProveedores(proveedoresReconciliados);
    setFacturasVenta(snap.facturasVenta);
    setFacturasCompra(snap.facturasCompra);
    setCuentasBancarias(snap.cuentasBancarias);
    setCheques(snap.cheques);
    setInventario(snap.inventario);
    setEmpleados(snap.empleados);
    setAsientosContables(snap.asientosContables);
    setPlanDeCuentas(snap.planDeCuentas || mockPlanDeCuentas);
    setClasificacionesComprasArca(snap.clasificacionesComprasArca || {});
    setPendientesMisComprobantesArca(snap.pendientesMisComprobantesArca || []);
    registrarEventoSincronizacion({
      moduloOrigen: 'Multi-Tenant RBAC',
      evento: `CAMBIO DE EMPRESA ACTIVA -> ${snap.empresa.razonSocial}`,
      detalle: `Se cargaron clientes, proveedores, stock, bancos, plan de cuentas y balances aislados de CUIT ${snap.empresa.cuit}.`,
      canalesImpactados: ['Padrón Clientes/Proveedores', 'Tesorería', 'Libro Diario', 'Zonda Cloud'],
      estado: 'SINCRONIZADO'
    });
  };

  const crearNuevoTenant = (params: {
    razonSocial: string;
    nombreFantasia: string;
    cuit: string;
    condicionIva: string;
    actividadPrincipalArca: string;
    jurisdiccionPrincipal: string;
    convenioMultilateral: boolean;
    autorizarZondaCloudInicial: boolean;
  }): TenantEmpresa => {
    const cleanId = `TENANT-${Date.now().toString().slice(-5)}`;
    const digitsCuit = params.cuit.replace(/\D/g, '') || '30000000007';
    const nuevoTenant: TenantEmpresa = {
      tenantId: cleanId,
      codigoCorto: params.nombreFantasia.slice(0, 8).toUpperCase(),
      razonSocial: params.razonSocial.toUpperCase(),
      nombreFantasia: params.nombreFantasia,
      cuit: params.cuit,
      condicionIva: params.condicionIva,
      actividadPrincipalArca: params.actividadPrincipalArca,
      jurisdiccionPrincipal: params.jurisdiccionPrincipal,
      convenioMultilateral: params.convenioMultilateral,
      usuariosInternos: [
        {
          id: `USR-${cleanId}-01`,
          nombre: `Administrador (${params.nombreFantasia})`,
          email: `admin@${params.nombreFantasia.toLowerCase().replace(/[^a-z0-9]/g, '') || 'empresa'}.com.ar`,
          rol: 'ADMINISTRADOR GENERAL',
          activo: true
        }
      ],
      autorizacionZondaCloud: {
        autorizado: params.autorizarZondaCloudInicial,
        tokenVinculacion: `ZCLOUD-ARCA-${digitsCuit}-${params.autorizarZondaCloudInicial ? 'OK' : 'PEND'}`,
        fechaAutorizacion: params.autorizarZondaCloudInicial
          ? new Date().toISOString().slice(0, 16).replace('T', ' ')
          : '-',
        autorizadoPorUsuarioErp: params.autorizarZondaCloudInicial
          ? `Administrador (${params.razonSocial})`
          : 'Pendiente de autorización en Zonda ERP',
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
        saldoTecnicoAnteriorIva: 0,
        saldoLibreDisponibilidadAnterior: 0,
        retencionesIvaSufridasMes: 0,
        alicuotaIibbPromedio: 3.0,
        bitacoraCloud: params.autorizarZondaCloudInicial
          ? [
              {
                id: `LOG-${Date.now()}`,
                fechaHora: new Date().toISOString().slice(0, 16).replace('T', ' '),
                actor: `Titular Zonda ERP (${params.razonSocial})`,
                accion: 'ALTA DE TENANT Y AUTORIZACIÓN ZONDA CLOUD',
                detalle: 'Empresa creada con aislamiento Multi-Tenant RLS y delegación activa hacia Zonda Cloud.'
              }
            ]
          : []
      }
    };

    const initialSnapshot: TenantIsolatedDataSnapshot = {
      empresa: {
        razonSocial: params.razonSocial.toUpperCase(),
        cuit: params.cuit,
        condicionIva: params.condicionIva,
        domicilioFiscal: 'Domicilio Fiscal Declarado en ARCA',
        inicioActividades: new Date().toISOString().slice(0, 10),
        ingresosBrutos: params.cuit,
        puntosVenta: [
          {
            numero: '0001',
            descripcion: 'Punto de Venta Electrónico ARCA WSFEv1',
            tipoEmision: 'Facturación Electrónica Web Service',
            activo: true
          }
        ]
      },
      empresaExtra: {
        nombre: params.nombreFantasia,
        localidad: 'SAN JUAN',
        codPostal: '5400',
        provincia: 'San Juan',
        pais: '12',
        telefono: '+542644000000',
        email: 'administracion@empresa.com.ar',
        cbu: '0720000000000000000000',
        convenioMultilateral: params.convenioMultilateral
      },
      clientes: [],
      proveedores: [],
      facturasVenta: [],
      facturasCompra: [],
      cuentasBancarias: [],
      cheques: [],
      inventario: [],
      empleados: [],
      asientosContables: [],
      clasificacionesComprasArca: {},
      pendientesMisComprobantesArca: []
    };

    saveTenantDataSnapshot(cleanId, initialSnapshot);
    const nuevaLista = [...tenants, nuevoTenant];
    setTenants(nuevaLista);
    saveTenantsList(nuevaLista);
    return nuevoTenant;
  };

  const actualizarAutorizacionZondaCloud = (
    tenantId: string,
    cambios: Partial<AutorizacionZondaCloud>,
    eventoAudit?: { actor: string; accion: string; detalle: string }
  ) => {
    const nuevaLista = tenants.map((t) => {
      if (t.tenantId !== tenantId) return t;
      const bitacoraActual = t.autorizacionZondaCloud.bitacoraCloud || [];
      const nuevaBitacora = eventoAudit
        ? [
            {
              id: `LOG-${Date.now()}-${Math.floor(Math.random() * 999)}`,
              fechaHora: new Date().toISOString().slice(0, 16).replace('T', ' '),
              actor: eventoAudit.actor,
              accion: eventoAudit.accion,
              detalle: eventoAudit.detalle
            },
            ...bitacoraActual
          ]
        : bitacoraActual;

      return {
        ...t,
        autorizacionZondaCloud: {
          ...t.autorizacionZondaCloud,
          ...cambios,
          permisos: cambios.permisos
            ? { ...t.autorizacionZondaCloud.permisos, ...cambios.permisos }
            : t.autorizacionZondaCloud.permisos,
          bitacoraCloud: nuevaBitacora
        }
      };
    });
    setTenants(nuevaLista);
    saveTenantsList(nuevaLista);
  };

  const obtenerSnapshotDeTenant = (tenantId: string): TenantIsolatedDataSnapshot => {
    if (tenantId === activeTenantId) {
      return {
        empresa,
        empresaExtra,
        clientes,
        proveedores,
        facturasVenta,
        facturasCompra,
        cuentasBancarias,
        cheques,
        inventario,
        empleados,
        asientosContables,
        planDeCuentas,
        clasificacionesComprasArca,
        pendientesMisComprobantesArca
      };
    }
    return loadTenantDataSnapshot(tenantId);
  };

  const actualizarClasificacionFiscalCompraEnTenant = (
    tenantId: string,
    facturaCompraId: string,
    cambios: Partial<ClasificacionFiscalCompraArca>
  ) => {
    const snap = obtenerSnapshotDeTenant(tenantId);
    const actual = snap.clasificacionesComprasArca[facturaCompraId] || {
      facturaCompraId,
      codigoComprobanteArca: '001',
      computabilidadIva: 'COMPUTABLE_100',
      rubroF2002: 'BIENES_DE_CAMBIO',
      percepcionIva: 0,
      percepcionIibb: 0,
      conciliadoMisComprobantesArca: true
    };
    const nuevasClasif = {
      ...snap.clasificacionesComprasArca,
      [facturaCompraId]: { ...actual, ...cambios }
    };

    if (tenantId === activeTenantId) {
      setClasificacionesComprasArca(nuevasClasif);
    } else {
      saveTenantDataSnapshot(tenantId, {
        ...snap,
        clasificacionesComprasArca: nuevasClasif
      });
    }
  };

  const incorporarComprobanteMisComprobantesArcaEnTenant = (
    tenantId: string,
    pendienteId: string
  ) => {
    const snap = obtenerSnapshotDeTenant(tenantId);
    const item = snap.pendientesMisComprobantesArca.find((p) => p.id === pendienteId);
    if (!item || item.incorporadoAlErp) return;

    const nuevosPendientes = snap.pendientesMisComprobantesArca.map((p) =>
      p.id === pendienteId ? { ...p, incorporadoAlErp: true } : p
    );

    const nextAsientoNum =
      snap.asientosContables.length > 0
        ? Math.max(...snap.asientosContables.map((a) => a.numero)) + 1
        : 4100;

    if (item.tipoFlujo === 'RECIBIDO_COMPRA') {
      const nuevaFcId = `FC-ARCA-${Date.now().toString().slice(-5)}`;
      const nroCompleto = `${item.puntoVenta}-${item.numero}`;
      const ivaTotal = Number((item.iva21 + item.iva105).toFixed(2));
      const nuevaFc: ComprobanteCompra = {
        id: nuevaFcId,
        tipo: item.tipoComprobante,
        numero: nroCompleto,
        proveedorNombre: item.razonSocialContraparte,
        proveedorCuit: item.cuitContraparte,
        fechaComprobante: item.fechaEmision,
        fechaImputacion: item.fechaEmision,
        cuentaGasto: '5.1.01 - Compras Conciliadas desde Mis Comprobantes ARCA',
        netoGravado: item.netoGravado,
        iva: ivaTotal,
        retencionIva: item.percepcionIva,
        retencionIIBB: item.percepcionIibb,
        total: item.total,
        estadoPago: 'Pendiente'
      };
      const nuevasCompras = [nuevaFc, ...snap.facturasCompra];
      const nuevasClasif: Record<string, ClasificacionFiscalCompraArca> = {
        ...snap.clasificacionesComprasArca,
        [nuevaFcId]: {
          facturaCompraId: nuevaFcId,
          codigoComprobanteArca: (item.codigoArca as any) || '001',
          computabilidadIva: 'COMPUTABLE_100',
          rubroF2002: 'BIENES_DE_CAMBIO',
          percepcionIva: item.percepcionIva,
          percepcionIibb: item.percepcionIibb,
          conciliadoMisComprobantesArca: true
        }
      };

      const { clientesReconciliados, proveedoresReconciliados } = reconciliarRelacionesComprobantes(
        snap.clientes,
        snap.proveedores,
        snap.facturasVenta,
        nuevasCompras
      );

      const nuevoAsiento: AsientoContable = {
        numero: nextAsientoNum,
        fecha: item.fechaEmision,
        concepto: `Compra ARCA ${item.tipoComprobante} ${nroCompleto} - ${item.razonSocialContraparte}`,
        tipoOrigen: 'Compras',
        renglones: [
          { cuentaCodigo: '5.1.01', cuentaNombre: 'Materiales e Insumos Operativos', debe: item.netoGravado, haber: 0 },
          {
            cuentaCodigo: '2.1.02',
            cuentaNombre: 'Cargas Fiscales e IVA Crédito Fiscal',
            debe: Number((ivaTotal + item.percepcionIva + item.percepcionIibb).toFixed(2)),
            haber: 0
          },
          { cuentaCodigo: '2.1.01', cuentaNombre: 'Proveedores Comerciales', debe: 0, haber: item.total }
        ],
        totalDebe: item.total,
        totalHaber: item.total
      };
      const nuevosAsientos = [nuevoAsiento, ...snap.asientosContables];

      if (tenantId === activeTenantId) {
        setFacturasCompra(nuevasCompras);
        setProveedores(proveedoresReconciliados);
        setClientes(clientesReconciliados);
        setAsientosContables(nuevosAsientos);
        setClasificacionesComprasArca(nuevasClasif);
        setPendientesMisComprobantesArca(nuevosPendientes);
      } else {
        saveTenantDataSnapshot(tenantId, {
          ...snap,
          clientes: clientesReconciliados,
          proveedores: proveedoresReconciliados,
          facturasCompra: nuevasCompras,
          asientosContables: nuevosAsientos,
          clasificacionesComprasArca: nuevasClasif,
          pendientesMisComprobantesArca: nuevosPendientes
        });
      }
    } else {
      const nuevaFvId = `FV-ARCA-${Date.now().toString().slice(-5)}`;
      const nroCompleto = `${item.puntoVenta}-${item.numero}`;
      const nuevaFv: ComprobanteVenta = {
        id: nuevaFvId,
        tipo: item.tipoComprobante,
        puntoVenta: item.puntoVenta,
        numero: item.numero,
        fechaEmision: item.fechaEmision,
        fechaVencimiento: item.fechaEmision,
        clienteNombre: item.razonSocialContraparte,
        clienteCuit: item.cuitContraparte,
        condicionIva: 'Responsable Inscripto',
        netoGravado: item.netoGravado,
        iva21: item.iva21,
        iva105: item.iva105,
        total: item.total,
        estado: 'Aprobado AFIP',
        cae: item.cae,
        caeVencimiento: item.fechaEmision
      };
      const nuevasVentas = [nuevaFv, ...snap.facturasVenta];
      const { clientesReconciliados, proveedoresReconciliados } = reconciliarRelacionesComprobantes(
        snap.clientes,
        snap.proveedores,
        nuevasVentas,
        snap.facturasCompra
      );

      const totalImpuestos = Number((item.total - item.netoGravado).toFixed(2));
      const nuevoAsiento: AsientoContable = {
        numero: nextAsientoNum,
        fecha: item.fechaEmision,
        concepto: `Venta ARCA ${item.tipoComprobante} ${nroCompleto} - ${item.razonSocialContraparte}`,
        tipoOrigen: 'Ventas',
        renglones: [
          { cuentaCodigo: '1.1.02', cuentaNombre: 'Créditos por Ventas (Clientes)', debe: item.total, haber: 0 },
          { cuentaCodigo: '4.1', cuentaNombre: 'Ingresos por Ventas', debe: 0, haber: item.netoGravado },
          { cuentaCodigo: '2.1.02', cuentaNombre: 'Cargas Fiscales e IVA Débito Fiscal', debe: 0, haber: totalImpuestos }
        ],
        totalDebe: item.total,
        totalHaber: item.total
      };
      const nuevosAsientos = [nuevoAsiento, ...snap.asientosContables];

      if (tenantId === activeTenantId) {
        setFacturasVenta(nuevasVentas);
        setClientes(clientesReconciliados);
        setProveedores(proveedoresReconciliados);
        setAsientosContables(nuevosAsientos);
        setPendientesMisComprobantesArca(nuevosPendientes);
      } else {
        saveTenantDataSnapshot(tenantId, {
          ...snap,
          clientes: clientesReconciliados,
          proveedores: proveedoresReconciliados,
          facturasVenta: nuevasVentas,
          asientosContables: nuevosAsientos,
          pendientesMisComprobantesArca: nuevosPendientes
        });
      }
    }

    actualizarAutorizacionZondaCloud(tenantId, {}, {
      actor: 'Zonda Cloud (Cruce Mis Comprobantes ARCA)',
      accion: `INCORPORACIÓN ${item.tipoFlujo === 'RECIBIDO_COMPRA' ? 'COMPRA' : 'VENTA'} ARCA + CUENTA CORRIENTE`,
      detalle: `Se incorporó ${item.tipoComprobante} ${item.puntoVenta}-${item.numero} (${item.razonSocialContraparte}) por $${item.total.toLocaleString('es-AR')} y se vinculó automáticamente a su Cuenta Corriente y Libro Diario.`
    });
  };

  const registrarComprobanteFiscalDesdeZondaCloud = (
    tenantId: string,
    params: {
      flujo: 'VENTA' | 'COMPRA';
      tipo: 'Factura A' | 'Factura B' | 'Factura C' | 'Nota de Débito';
      puntoVenta: string;
      numero: string;
      fecha: string;
      cuitContraparte: string;
      razonSocialContraparte: string;
      netoGravado: number;
      alicuotaIva: 21 | 10.5 | 0;
      percepcionIva: number;
      percepcionIibb: number;
      computabilidadIva?: ClasificacionFiscalCompraArca['computabilidadIva'];
      rubroF2002?: ClasificacionFiscalCompraArca['rubroF2002'];
      descripcion: string;
    }
  ) => {
    const snap = obtenerSnapshotDeTenant(tenantId);
    const iva21 = params.alicuotaIva === 21 ? Number((params.netoGravado * 0.21).toFixed(2)) : 0;
    const iva105 = params.alicuotaIva === 10.5 ? Number((params.netoGravado * 0.105).toFixed(2)) : 0;
    const total = Number(
      (params.netoGravado + iva21 + iva105 + params.percepcionIva + params.percepcionIibb).toFixed(2)
    );
    const nroCompleto = `${params.puntoVenta}-${params.numero}`;
    const nextAsientoNum =
      snap.asientosContables.length > 0
        ? Math.max(...snap.asientosContables.map((a) => a.numero)) + 1
        : 4100;

    if (params.flujo === 'VENTA') {
      const nuevaFv: ComprobanteVenta = {
        id: `FV-ZC-${Date.now().toString().slice(-5)}`,
        tipo: params.tipo,
        puntoVenta: params.puntoVenta,
        numero: params.numero,
        fechaEmision: params.fecha,
        fechaVencimiento: params.fecha,
        clienteNombre: params.razonSocialContraparte.toUpperCase(),
        clienteCuit: params.cuitContraparte,
        condicionIva: 'Responsable Inscripto',
        netoGravado: params.netoGravado,
        iva21: Number((iva21 + params.percepcionIva + params.percepcionIibb).toFixed(2)),
        iva105,
        total,
        estado: 'Aprobado AFIP',
        cae: `7645${Math.floor(1000000000 + Math.random() * 8999999999)}`,
        caeVencimiento: params.fecha
      };
      const nuevasVentas = [nuevaFv, ...snap.facturasVenta];
      const { clientesReconciliados, proveedoresReconciliados } = reconciliarRelacionesComprobantes(
        snap.clientes,
        snap.proveedores,
        nuevasVentas,
        snap.facturasCompra
      );

      const totalImpuestos = Number((total - params.netoGravado).toFixed(2));
      const nuevoAsiento: AsientoContable = {
        numero: nextAsientoNum,
        fecha: params.fecha,
        concepto: `Emisión Zonda Cloud ${params.tipo} ${nroCompleto} - ${params.razonSocialContraparte.toUpperCase()}`,
        tipoOrigen: 'Ventas',
        renglones: [
          { cuentaCodigo: '1.1.02', cuentaNombre: 'Créditos por Ventas (Clientes)', debe: total, haber: 0 },
          { cuentaCodigo: '4.1', cuentaNombre: 'Ingresos por Ventas', debe: 0, haber: params.netoGravado },
          { cuentaCodigo: '2.1.02', cuentaNombre: 'Cargas Fiscales, IVA y Percepciones', debe: 0, haber: totalImpuestos }
        ],
        totalDebe: total,
        totalHaber: total
      };
      const nuevosAsientos = [nuevoAsiento, ...snap.asientosContables];

      if (tenantId === activeTenantId) {
        setFacturasVenta(nuevasVentas);
        setClientes(clientesReconciliados);
        setProveedores(proveedoresReconciliados);
        setAsientosContables(nuevosAsientos);
      } else {
        saveTenantDataSnapshot(tenantId, {
          ...snap,
          clientes: clientesReconciliados,
          proveedores: proveedoresReconciliados,
          facturasVenta: nuevasVentas,
          asientosContables: nuevosAsientos
        });
      }
    } else {
      const nuevaFcId = `FC-ZC-${Date.now().toString().slice(-5)}`;
      const ivaTotal = Number((iva21 + iva105).toFixed(2));
      const nuevaFc: ComprobanteCompra = {
        id: nuevaFcId,
        tipo: params.tipo,
        numero: nroCompleto,
        proveedorNombre: params.razonSocialContraparte.toUpperCase(),
        proveedorCuit: params.cuitContraparte,
        fechaComprobante: params.fecha,
        fechaImputacion: params.fecha,
        cuentaGasto: params.descripcion || '5.1.01 - Compras y Servicios Imputados por Zonda Cloud',
        netoGravado: params.netoGravado,
        iva: ivaTotal,
        retencionIva: params.percepcionIva,
        retencionIIBB: params.percepcionIibb,
        total,
        estadoPago: 'Pendiente'
      };
      const nuevasCompras = [nuevaFc, ...snap.facturasCompra];
      const nuevasClasif: Record<string, ClasificacionFiscalCompraArca> = {
        ...snap.clasificacionesComprasArca,
        [nuevaFcId]: {
          facturaCompraId: nuevaFcId,
          codigoComprobanteArca: params.tipo === 'Factura A' ? '001' : params.tipo === 'Factura C' ? '011' : '006',
          computabilidadIva: params.computabilidadIva || 'COMPUTABLE_100',
          rubroF2002: params.rubroF2002 || 'BIENES_DE_CAMBIO',
          percepcionIva: params.percepcionIva,
          percepcionIibb: params.percepcionIibb,
          conciliadoMisComprobantesArca: true
        }
      };

      const { clientesReconciliados, proveedoresReconciliados } = reconciliarRelacionesComprobantes(
        snap.clientes,
        snap.proveedores,
        snap.facturasVenta,
        nuevasCompras
      );

      const nuevoAsiento: AsientoContable = {
        numero: nextAsientoNum,
        fecha: params.fecha,
        concepto: `Compra Zonda Cloud ${params.tipo} ${nroCompleto} - ${params.razonSocialContraparte.toUpperCase()}`,
        tipoOrigen: 'Compras',
        renglones: [
          { cuentaCodigo: '5.1.01', cuentaNombre: 'Materiales e Insumos Operativos', debe: params.netoGravado, haber: 0 },
          {
            cuentaCodigo: '2.1.02',
            cuentaNombre: 'Cargas Fiscales e IVA Crédito Fiscal',
            debe: Number((ivaTotal + params.percepcionIva + params.percepcionIibb).toFixed(2)),
            haber: 0
          },
          { cuentaCodigo: '2.1.01', cuentaNombre: 'Proveedores Comerciales', debe: 0, haber: total }
        ],
        totalDebe: total,
        totalHaber: total
      };
      const nuevosAsientos = [nuevoAsiento, ...snap.asientosContables];

      if (tenantId === activeTenantId) {
        setFacturasCompra(nuevasCompras);
        setProveedores(proveedoresReconciliados);
        setClientes(clientesReconciliados);
        setAsientosContables(nuevosAsientos);
        setClasificacionesComprasArca(nuevasClasif);
      } else {
        saveTenantDataSnapshot(tenantId, {
          ...snap,
          clientes: clientesReconciliados,
          proveedores: proveedoresReconciliados,
          facturasCompra: nuevasCompras,
          asientosContables: nuevosAsientos,
          clasificacionesComprasArca: nuevasClasif
        });
      }
    }

    actualizarAutorizacionZondaCloud(tenantId, {}, {
      actor: 'Zonda Cloud (Gestión Delegada ARCA)',
      accion: `ALTA DE ${params.flujo} FISCAL + ASOCIACIÓN CUENTA CORRIENTE`,
      detalle: `${params.tipo} ${params.puntoVenta}-${params.numero} (${params.razonSocialContraparte}) por $${total.toLocaleString('es-AR')} vinculada al Cliente/Proveedor y Libro Diario.`
    });
  };

  const recargarSnapshotEnMemoria = useCallback((tenantIdTarget: string) => {
    const snap = loadTenantDataSnapshot(tenantIdTarget);
    const { clientesReconciliados, proveedoresReconciliados } = reconciliarRelacionesComprobantes(
      snap.clientes,
      snap.proveedores,
      snap.facturasVenta,
      snap.facturasCompra
    );
    setEmpresa(snap.empresa);
    setEmpresaExtra(snap.empresaExtra);
    setClientes(clientesReconciliados);
    setProveedores(proveedoresReconciliados);
    setFacturasVenta(snap.facturasVenta);
    setFacturasCompra(snap.facturasCompra);
    setCuentasBancarias(snap.cuentasBancarias);
    setCheques(snap.cheques);
    setInventario(snap.inventario);
    setEmpleados(snap.empleados);
    setAsientosContables(snap.asientosContables);
    setPlanDeCuentas(snap.planDeCuentas || mockPlanDeCuentas);
    setClasificacionesComprasArca(snap.clasificacionesComprasArca || {});
    setPendientesMisComprobantesArca(snap.pendientesMisComprobantesArca || []);
    setDbStatus('conectado');
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  }, []);

  const refreshAllFromDb = useCallback(async () => {
    setDbStatus('sincronizando');
    if (activeTenantId !== 'TENANT-ECAR') {
      await pullRemoteTenantSnapshotFromSupabase(activeTenantId);
      recargarSnapshotEnMemoria(activeTenantId);
      return;
    }
    try {
      const [
        empRes,
        cliRes,
        prvRes,
        fvRes,
        fcRes,
        cbRes,
        chqRes,
        pcRes,
        acRes,
        invRes,
        emplRes,
        liqRes
      ] = await Promise.all([
        supabase.from('erp_empresa').select('*').eq('id', 'DEFAULT').maybeSingle(),
        supabase.from('erp_clientes').select('*').order('id'),
        supabase.from('erp_proveedores').select('*').order('id'),
        supabase.from('erp_comprobantes_venta').select('*').order('fecha_emision', { ascending: false }),
        supabase.from('erp_comprobantes_compra').select('*').order('fecha_comprobante', { ascending: false }),
        supabase.from('erp_cuentas_bancarias').select('*').order('id'),
        supabase.from('erp_cheques').select('*').order('id'),
        supabase.from('erp_plan_cuentas').select('*').eq('id', 'DEFAULT').maybeSingle(),
        supabase.from('erp_asientos_contables').select('*').order('numero', { ascending: false }),
        supabase.from('erp_inventario').select('*').order('codigo'),
        supabase.from('erp_empleados').select('*').order('legajo'),
        supabase.from('erp_liquidaciones').select('*').eq('id', 'ACTUAL').maybeSingle()
      ]);

      if (empRes.error) throw empRes.error;

      if (empRes.data) {
        setEmpresa({
          razonSocial: empRes.data.razon_social,
          cuit: empRes.data.cuit,
          domicilioFiscal: empRes.data.domicilio_fiscal,
          condicionIva: empRes.data.condicion_iva,
          ingresosBrutos: empRes.data.ingresos_brutos,
          inicioActividades: empRes.data.inicio_actividades,
          puntosVenta: empRes.data.puntos_venta || mockEmpresa.puntosVenta
        });
        if (empRes.data.datos_extra) {
          setEmpresaExtra((prev) => ({ ...prev, ...empRes.data.datos_extra }));
        }
      }

      const loadedClientes: Cliente[] =
        cliRes.data && cliRes.data.length > 0
          ? cliRes.data.map((r: any) => ({
              id: r.id,
              nombre: r.nombre,
              razonSocial: r.razon_social,
              cuit: r.cuit,
              condicionIva: r.condicion_iva,
              domicilio: r.domicilio,
              telefono: r.telefono,
              email: r.email,
              saldo: Number(r.saldo),
              activo: r.activo,
              listaPrecios: r.lista_precios,
              limiteCredito: Number(r.limite_credito),
              vendedor: r.vendedor,
              facturasAdeudadas: r.facturas_adeudadas || [],
              movimientos: r.movimientos || []
            }))
          : clientes;

      const loadedProveedores: Proveedor[] =
        prvRes.data && prvRes.data.length > 0
          ? prvRes.data.map((r: any) => ({
              id: r.id,
              nombre: r.nombre,
              razonSocial: r.razon_social,
              cuit: r.cuit,
              condicionIva: r.condicion_iva,
              domicilio: r.domicilio,
              telefono: r.telefono,
              email: r.email,
              saldo: Number(r.saldo),
              activo: r.activo,
              cuentaGastoHabitual: r.cuenta_gasto_habitual,
              condicionPago: r.condicion_pago,
              facturasAdeudadas: r.facturas_adeudadas || [],
              movimientos: r.movimientos || []
            }))
          : proveedores;

      const loadedVentas: ComprobanteVenta[] =
        fvRes.data && fvRes.data.length > 0
          ? fvRes.data.map((r: any) => ({
              id: r.id,
              tipo: r.tipo,
              puntoVenta: r.punto_venta,
              numero: r.numero,
              fechaEmision: r.fecha_emision,
              fechaVencimiento: r.fecha_vencimiento,
              clienteNombre: r.cliente_nombre,
              clienteCuit: r.cliente_cuit,
              condicionIva: r.condicion_iva,
              netoGravado: Number(r.neto_gravado),
              iva21: Number(r.iva21),
              iva105: Number(r.iva105),
              total: Number(r.total),
              estado: r.estado,
              cae: r.cae || undefined,
              caeVencimiento: r.cae_vencimiento || undefined
            }))
          : facturasVenta;

      const loadedCompras: ComprobanteCompra[] =
        fcRes.data && fcRes.data.length > 0
          ? fcRes.data.map((r: any) => ({
              id: r.id,
              tipo: r.tipo,
              numero: r.numero,
              proveedorNombre: r.proveedor_nombre,
              proveedorCuit: r.proveedor_cuit,
              fechaComprobante: r.fecha_comprobante,
              fechaImputacion: r.fecha_imputacion,
              cuentaGasto: r.cuenta_gasto,
              netoGravado: Number(r.neto_gravado),
              iva: Number(r.iva),
              retencionIva: Number(r.retencion_iva),
              retencionIIBB: Number(r.retencion_iibb),
              total: Number(r.total),
              estadoPago: r.estado_pago
            }))
          : facturasCompra;

      const { clientesReconciliados, proveedoresReconciliados } = reconciliarRelacionesComprobantes(
        loadedClientes,
        loadedProveedores,
        loadedVentas,
        loadedCompras
      );

      setClientes(clientesReconciliados);
      setProveedores(proveedoresReconciliados);
      setFacturasVenta(loadedVentas);
      setFacturasCompra(loadedCompras);

      if (cbRes.data && cbRes.data.length > 0) {
        setCuentasBancarias(
          cbRes.data.map((r: any) => ({
            id: r.id,
            nombre: r.nombre,
            banco: r.banco,
            tipoCuenta: r.tipo_cuenta,
            moneda: r.moneda,
            cbu: r.cbu || undefined,
            saldoActual: Number(r.saldo_actual),
            saldoConciliado: Number(r.saldo_conciliado),
            conectarDisponible: r.conectar_disponible,
            movimientos: r.movimientos || []
          }))
        );
      }

      if (chqRes.data && chqRes.data.length > 0) {
        setCheques(
          chqRes.data.map((r: any) => ({
            id: r.id,
            tipo: r.tipo,
            numero: r.numero,
            bancoEmisor: r.banco_emisor,
            librador: r.librador,
            cuitLibrador: r.cuit_librador,
            fechaEmision: r.fecha_emision,
            fechaPago: r.fecha_pago,
            importe: Number(r.importe),
            estado: r.estado
          }))
        );
      }

      if (pcRes.data && pcRes.data.nodos) {
        const nodosDb: CuentaContable[] = pcRes.data.nodos;
        const nodo51Mock = findCuentaInTree(mockPlanDeCuentas, '5.1');
        const nodo51Db = findCuentaInTree(nodosDb, '5.1');
        if (nodo51Mock?.hijos && nodo51Db && (!nodo51Db.hijos || nodo51Db.hijos.length === 0)) {
          const nodosEnriquecidos = updatePlanCuentasTree(nodosDb, '5.1', (c) => ({
            ...c,
            hijos: nodo51Mock.hijos
          }));
          setPlanDeCuentas(nodosEnriquecidos);
          supabase.from('erp_plan_cuentas').upsert({ id: 'DEFAULT', nodos: nodosEnriquecidos }).then(() => {});
        } else {
          setPlanDeCuentas(nodosDb);
        }
      }

      if (acRes.data && acRes.data.length > 0) {
        setAsientosContables(
          acRes.data.map((r: any) => ({
            numero: Number(r.numero),
            fecha: r.fecha,
            concepto: r.concepto,
            tipoOrigen: r.tipo_origen,
            renglones: r.renglones || [],
            totalDebe: Number(r.total_debe),
            totalHaber: Number(r.total_haber)
          }))
        );
      }

      if (invRes.data && invRes.data.length > 0) {
        const paraActualizarEnDb: ArticuloInventario[] = [];
        const inventarioNormalizado: ArticuloInventario[] = invRes.data.map((r: any) => {
          const mockMatch = mockInventario.find((m) => m.id === r.id || m.codigo === r.codigo);
          const rawMovs: any[] = Array.isArray(r.movimientos) ? r.movimientos : [];
          let requiereSync = false;

          // Si el artículo en DB tenía el único movimiento antiguo INI sin factura/proveedor, usar los movimientos enriquecidos
          let movsFinales = rawMovs;
          if (
            mockMatch &&
            mockMatch.movimientos &&
            (rawMovs.length === 0 ||
              (rawMovs.length === 1 && rawMovs[0]?.tipoDoc === 'INI' && !rawMovs[0]?.facturaNro))
          ) {
            movsFinales = mockMatch.movimientos;
            requiereSync = true;
          } else {
            movsFinales = rawMovs.map((m: any, idx: number) => {
              const cant = Number(m.cantidad || 0);
              const mockMov = mockMatch?.movimientos?.[idx];
              if (cant > 0 && (!m.proveedorNombre || !m.facturaNro || m.tipoDoc === 'INI')) {
                requiereSync = true;
                // Intentar extraer de la descripción si tiene formato "Factura Compra ... - PROVEEDOR"
                const descStr = String(m.descripcion || '');
                const matchFac = descStr.match(/(Factura\s+[ABC]\s+[0-9]{4}-[0-9]{5,8})/i);
                const matchPrv = descStr.split(/\s+[-—]\s+/)[1]?.split('(')[0]?.trim();
                const facturaResuelta =
                  m.facturaNro ||
                  (matchFac ? matchFac[1] : undefined) ||
                  mockMov?.facturaNro ||
                  'Factura A 0001-00004120';
                const proveedorResuelto =
                  m.proveedorNombre ||
                  matchPrv ||
                  mockMov?.proveedorNombre ||
                  'ALEJANDRO MIGUEL LUL...';
                return {
                  ...m,
                  tipoDoc: 'FAC',
                  proveedorId: m.proveedorId || mockMov?.proveedorId || 'PRV-01',
                  proveedorNombre: proveedorResuelto,
                  proveedorCuit: m.proveedorCuit || mockMov?.proveedorCuit || '20-24891230-4',
                  facturaId: m.facturaId || mockMov?.facturaId || 'FP-01',
                  facturaNro: facturaResuelta,
                  descripcion:
                    m.tipoDoc === 'INI'
                      ? `Ingreso por ${facturaResuelta} — ${proveedorResuelto}`
                      : m.descripcion
                };
              }
              if (cant < 0 && (!m.destinoEgreso || !m.comprobanteEgreso)) {
                return {
                  ...m,
                  destinoEgreso: m.destinoEgreso || mockMov?.destinoEgreso || 'Obra / Consumo Operativo',
                  comprobanteEgreso: m.comprobanteEgreso || mockMov?.comprobanteEgreso || `Remito ${m.tipoDoc || 'REM'}`
                };
              }
              return m;
            });
          }

          const itemNorm: ArticuloInventario = {
            id: r.id,
            codigo: r.codigo,
            sku: r.sku,
            descripcion: r.descripcion,
            tipo: r.tipo,
            um: r.um,
            categoria: r.categoria,
            unidadMedida: r.unidad_medida,
            disponible: Number(r.disponible),
            stockActual: Number(r.stock_actual),
            stockMinimo: Number(r.stock_minimo),
            costoCalculado: Number(r.costo_calculado),
            precioVentaNeto: Number(r.precio_venta_neto),
            alicuotaIva: Number(r.alicuota_iva) as 21 | 10.5 | 0,
            deposito: r.deposito,
            movimientos: movsFinales
          };

          if (requiereSync) {
            paraActualizarEnDb.push(itemNorm);
          }
          return itemNorm;
        });

        setInventario(inventarioNormalizado);

        if (paraActualizarEnDb.length > 0) {
          supabase
            .from('erp_inventario')
            .upsert(
              paraActualizarEnDb.map((i) => ({
                id: i.id,
                codigo: i.codigo,
                sku: i.sku,
                descripcion: i.descripcion,
                tipo: i.tipo,
                um: i.um,
                categoria: i.categoria,
                unidad_medida: i.unidadMedida,
                disponible: i.disponible,
                stock_actual: i.stockActual,
                stock_minimo: i.stockMinimo,
                costo_calculado: i.costoCalculado,
                precio_venta_neto: i.precioVentaNeto,
                alicuota_iva: i.alicuotaIva,
                deposito: i.deposito,
                movimientos: i.movimientos || [],
                updated_at: new Date().toISOString()
              }))
            )
            .then(() => {});
        }
      }

      if (emplRes.data && emplRes.data.length > 0) {
        setEmpleados(
          emplRes.data.map((r: any) => ({
            id: r.id,
            legajo: r.legajo,
            cuil: r.cuil,
            nombreCompleto: r.nombre_completo,
            cct: r.cct,
            categoria: r.categoria,
            fechaIngreso: r.fecha_ingreso,
            antiguedadAnios: Number(r.antiguedad_anios),
            banco: r.banco,
            cbu: r.cbu,
            modalidadContratacion: r.modalidad_contratacion,
            sueldoBasico: Number(r.sueldo_basico),
            activo: r.activo,
            conceptosLiquidacion: r.conceptos_liquidacion || []
          }))
        );
      }

      if (liqRes.data) {
        setLiquidacionActual({
          periodo: liqRes.data.periodo,
          tipoLiquidacion: liqRes.data.tipo_liquidacion,
          numeroLiquidacion: Number(liqRes.data.numero_liquidacion),
          fechaPago: liqRes.data.fecha_pago,
          totalBruto: Number(liqRes.data.total_bruto),
          totalRetenciones: Number(liqRes.data.total_retenciones),
          totalNeto: Number(liqRes.data.total_neto),
          totalContribucionesPatronales: Number(liqRes.data.total_contribuciones_patronales),
          empleadosCount: Number(liqRes.data.empleados_count)
        });
      }

      setDbStatus('conectado');
      setLastSync(new Date().toLocaleTimeString('es-AR'));
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err);
      setDbStatus('error');
    }
  }, [activeTenantId]);

  useEffect(() => {
    refreshAllFromDb();
  }, [refreshAllFromDb]);

  // Sincronización Omnicanal en Tiempo Real entre Pestañas (Zonda ERP <-> Zonda Cloud) y Supabase
  useEffect(() => {
    const handleStorageOrBroadcast = (tenantAffected?: string, actionLabel?: string) => {
      setTenants(loadTenantsList());
      if (!tenantAffected || tenantAffected === activeTenantId) {
        recargarSnapshotEnMemoria(activeTenantId);
      }
      if (actionLabel) {
        registrarEventoSincronizacion({
          moduloOrigen: 'Sincronización Multi-Pestaña / Cloud',
          evento: actionLabel,
          detalle: `Estado actualizado instantáneamente en todas las consolas abiertas (${
            tenantAffected || activeTenantId
          }).`,
          canalesImpactados: ['Zonda ERP', 'Zonda Cloud ARCA', 'Tesorería & Contabilidad'],
          estado: 'MULTI_PESTAÑA'
        });
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith('zonda_multitenant_')) {
        handleStorageOrBroadcast(undefined, 'Actualización recibida desde otra ventana activa');
      }
    };
    window.addEventListener('storage', onStorage);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(SYNC_BROADCAST_CHANNEL_NAME);
        bc.onmessage = (ev: MessageEvent<ZondaSyncBroadcastMessage>) => {
          if (ev.data) {
            handleStorageOrBroadcast(ev.data.tenantId, ev.data.actionLabel);
          }
        };
      }
    } catch {
      // ignore BroadcastChannel errors
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, [activeTenantId, recargarSnapshotEnMemoria, registrarEventoSincronizacion]);

  const forzarSincronizacionOmnicanal = useCallback(async () => {
    setDbStatus('sincronizando');
    await refreshAllFromDb();
    broadcastZondaSyncEvent({
      type: 'MANUAL_FULL_SYNC',
      tenantId: activeTenantId,
      actionLabel: `Sincronización Integral Forzada (${empresa.razonSocial})`
    });
    registrarEventoSincronizacion({
      moduloOrigen: 'Hub de Comunicaciones',
      evento: 'SINCRONIZACIÓN INTEGRAL VERIFICADA (100% EN LÍNEA)',
      detalle: `Reconciliación completa de Clientes (${clientes.length}), Proveedores (${proveedores.length}), Stock (${inventario.length} ítems), Cajas/Bancos (${cuentasBancarias.length}), Asientos (${asientosContables.length}) y Zonda Cloud ARCA.`,
      canalesImpactados: [
        'Supabase Cloud DB',
        '02-Clientes / 03-Proveedores',
        '04-Tesorería / 05-Contabilidad',
        '06-Stock Kárdex',
        '11-Zonda Cloud & RT 54'
      ],
      estado: 'SINCRONIZADO'
    });
  }, [
    refreshAllFromDb,
    activeTenantId,
    empresa.razonSocial,
    registrarEventoSincronizacion,
    clientes.length,
    proveedores.length,
    inventario.length,
    cuentasBancarias.length,
    asientosContables.length
  ]);

  // Helper para resolver la Cuenta de Tesorería según el nombre del Medio de Pago/Cobro
  const resolverCuentaTesoreriaPorMedio = (medio: string, cuentaExplicitaId?: string): string => {
    if (cuentaExplicitaId) return cuentaExplicitaId;
    const m = (medio || '').toLowerCase();
    if (m.includes('santander')) return 'CTA-02';
    if (m.includes('galicia')) return 'CTA-04';
    if (m.includes('tarjeta') || m.includes('posnet') || m.includes('visa') || m.includes('mercado pago')) return 'CTA-03';
    if (m.includes('cheque propio')) return 'CTA-05';
    return 'CTA-01';
  };

  // Helper interno para impactar un lote de movimientos en Tesorería (soporta Pagos/Cobros Mixtos sin colisión de estado)
  const registrarLoteMovimientosTesoreria = async (
    items: {
      cuentaId: string;
      tipo: string;
      clienteProveedor: string;
      descripcion: string;
      ingresos: number;
      egresos: number;
      nroCheque?: string;
    }[]
  ) => {
    if (!items || items.length === 0) return;
    const fechaStr = new Date().toISOString().split('T')[0].split('-').reverse().join('/');
    const cuentasModificadasMap = new Map<string, CuentaBancaria>();

    setCuentasBancarias((prev) => {
      const next = prev.map((c) => ({ ...c, movimientos: [...(c.movimientos || [])] }));
      items.forEach((params, idx) => {
        if (params.ingresos <= 0 && params.egresos <= 0) return;
        const target = next.find((c) => c.id === params.cuentaId) || next[0];
        if (!target) return;
        const nuevoSaldo = Number((target.saldoActual + params.ingresos - params.egresos).toFixed(2));
        const nuevoMov: MovimientoTesoreria = {
          id: `MOV-T${Date.now()}-${idx}-${Math.floor(Math.random() * 999)}`,
          fecha: fechaStr,
          clienteProveedor: params.clienteProveedor,
          tipo: params.tipo,
          nro: `0001-00000${Math.floor(100 + Math.random() * 899)}`,
          nroCheque: params.nroCheque || '',
          descripcion: params.descripcion,
          ingresos: params.ingresos,
          egresos: params.egresos,
          saldo: nuevoSaldo
        };
        target.saldoActual = nuevoSaldo;
        target.movimientos = [nuevoMov, ...(target.movimientos || [])];
        cuentasModificadasMap.set(target.id, target);
      });
      return next;
    });

    if (cuentasModificadasMap.size > 0) {
      await supabase.from('erp_cuentas_bancarias').upsert(
        Array.from(cuentasModificadasMap.values()).map((actualizada) => ({
          id: actualizada.id,
          nombre: actualizada.nombre,
          banco: actualizada.banco,
          tipo_cuenta: actualizada.tipoCuenta,
          moneda: actualizada.moneda,
          cbu: actualizada.cbu || null,
          saldo_actual: actualizada.saldoActual,
          saldo_conciliado: actualizada.saldoConciliado,
          conectar_disponible: !!actualizada.conectarDisponible,
          movimientos: actualizada.movimientos,
          updated_at: new Date().toISOString()
        }))
      );
    }
  };

  // Helper interno para impactar un asiento en el Plan de Cuentas y Asientos Contables
  const impactarAsientoContable = async (nuevoAsiento: AsientoContable, tipoDocMayor = 'ASI') => {
    setAsientosContables((prev) => [nuevoAsiento, ...prev]);

    const fechaFormateada = nuevoAsiento.fecha.includes('-')
      ? nuevoAsiento.fecha.split('-').reverse().join('/')
      : nuevoAsiento.fecha;

    let planActualizadoRef: CuentaContable[] = [];
    setPlanDeCuentas((prevPlan) => {
      let nuevoPlan = [...prevPlan];
      for (const renglon of nuevoAsiento.renglones) {
        nuevoPlan = updatePlanCuentasTree(nuevoPlan, renglon.cuentaCodigo, (cuenta) => {
          const prevDebito = cuenta.debito ?? 0;
          const prevCredito = cuenta.credito ?? 0;
          const prevSaldo = cuenta.saldoFinal ?? 0;
          const nuevoDebito = prevDebito + renglon.debe;
          const nuevoCredito = prevCredito + renglon.haber;
          const nuevoSaldo = prevSaldo + renglon.debe - renglon.haber;

          const nuevoMovMayor: MovimientoMayor = {
            id: `MM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            fecha: fechaFormateada,
            tipo: tipoDocMayor,
            nro: String(nuevoAsiento.numero).padStart(8, '0'),
            descripcion: nuevoAsiento.concepto,
            debito: renglon.debe,
            credito: renglon.haber,
            saldo: nuevoSaldo
          };

          return {
            ...cuenta,
            debito: nuevoDebito,
            credito: nuevoCredito,
            saldoFinal: nuevoSaldo,
            saldoDeudor: nuevoSaldo > 0 ? nuevoSaldo : 0,
            saldoAcreedor: nuevoSaldo < 0 ? Math.abs(nuevoSaldo) : 0,
            movimientosMayor: [nuevoMovMayor, ...(cuenta.movimientosMayor || [])]
          };
        });
      }

      nuevoPlan = nuevoPlan.map((n) => {
        if (n.codigo === '99') {
          return {
            ...n,
            debito: (n.debito ?? 0) + nuevoAsiento.totalDebe,
            credito: (n.credito ?? 0) + nuevoAsiento.totalHaber
          };
        }
        return n;
      });
      planActualizadoRef = nuevoPlan;
      return nuevoPlan;
    });

    await Promise.all([
      supabase.from('erp_asientos_contables').upsert({
        numero: nuevoAsiento.numero,
        fecha: nuevoAsiento.fecha,
        concepto: nuevoAsiento.concepto,
        tipo_origen: nuevoAsiento.tipoOrigen,
        renglones: nuevoAsiento.renglones,
        total_debe: nuevoAsiento.totalDebe,
        total_haber: nuevoAsiento.totalHaber
      }),
      supabase.from('erp_plan_cuentas').upsert({
        id: 'DEFAULT',
        nodos: planActualizadoRef.length > 0 ? planActualizadoRef : planDeCuentas,
        updated_at: new Date().toISOString()
      })
    ]);
    registrarEventoSincronizacion({
      moduloOrigen: `05 · Contabilidad (${nuevoAsiento.tipoOrigen})`,
      evento: `ASIENTO #${nuevoAsiento.numero} MAYORIZADO EN VIVO`,
      detalle: `${nuevoAsiento.concepto} — Total Debe = Haber: $${nuevoAsiento.totalDebe.toLocaleString('es-AR')}`,
      canalesImpactados: [
        'Libro Diario General',
        'Plan de Cuentas (Mayor)',
        '11 · Zonda Cloud ARCA',
        'Balance Oficial RT 54'
      ],
      estado: 'SINCRONIZADO'
    });
  };

  // ==========================================
  // 1. CLIENTES Y VENTAS
  // ==========================================
  const crearCliente = async (nuevoData: Omit<Cliente, 'id' | 'facturasAdeudadas' | 'movimientos' | 'saldo'>) => {
    const cuitNorm = normalizarCuit(nuevoData.cuit);
    const existente =
      cuitNorm && cuitNorm !== '00000000000' && cuitNorm !== '30000000000'
        ? clientes.find((c) => normalizarCuit(c.cuit) === cuitNorm)
        : undefined;
    if (existente) {
      const actualizado: Cliente = {
        ...existente,
        ...nuevoData,
        id: existente.id
      };
      setClientes((prev) => prev.map((c) => (c.id === existente.id ? actualizado : c)));
      return actualizado;
    }

    const nextNum = String(clientes.length + 1).padStart(3, '0');
    const nuevo: Cliente = {
      ...nuevoData,
      id: `CLI-${nextNum}-${Date.now().toString().slice(-3)}`,
      saldo: 0,
      facturasAdeudadas: [],
      movimientos: []
    };

    setClientes((prev) => [nuevo, ...prev]);

    await supabase.from('erp_clientes').upsert({
      id: nuevo.id,
      nombre: nuevo.nombre,
      razon_social: nuevo.razonSocial,
      cuit: nuevo.cuit,
      condicion_iva: nuevo.condicionIva,
      domicilio: nuevo.domicilio,
      telefono: nuevo.telefono,
      email: nuevo.email,
      saldo: nuevo.saldo,
      activo: nuevo.activo,
      lista_precios: nuevo.listaPrecios,
      limite_credito: nuevo.limiteCredito,
      vendedor: nuevo.vendedor,
      facturas_adeudadas: nuevo.facturasAdeudadas,
      movimientos: nuevo.movimientos
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
    return nuevo;
  };

  const emitirFacturaVenta = async (params: {
    clienteId: string;
    tipo: TipoComprobante;
    puntoVenta?: string;
    numero?: string;
    fechaEmision?: string;
    fechaVencimiento?: string;
    netoGravado: number;
    noGravado?: number;
    exento?: number;
    iva21?: number;
    iva105?: number;
    iva27?: number;
    percepcionIva?: number;
    percepcionIIBB?: number;
    impuestosInternos?: number;
    otrosTributos?: number;
    cae?: string;
    caeVencimiento?: string;
    descripcion: string;
    medioCobroPactado?: string;
    itemsInventarioVenta?: {
      articuloId: string;
      cantidad: number;
      precioUnitarioNeto: number;
      deposito?: string;
    }[];
    cancelacionAlContado?: {
      activa: boolean;
      lineasMediosCobro?: LineaMedioPagoMixto[];
      retencionesSufridas?: DesgloseRetencionesFiscales;
    };
  }) => {
    const cliente = clientes.find((c) => c.id === params.clienteId);
    if (!cliente) return;

    const ptoVta = params.puntoVenta || '0001';
    const nextNum = params.numero || String(415 + facturasVenta.length).padStart(8, '0');
    const nroComprobante = `${ptoVta}-${nextNum}`;
    const etiquetaComprobanteVenta = `${params.tipo} ${nroComprobante}`;

    const noGravado = Number((params.noGravado ?? 0).toFixed(2));
    const exento = Number((params.exento ?? 0).toFixed(2));
    const iva105 = Number((params.iva105 ?? 0).toFixed(2));
    const iva27 = Number((params.iva27 ?? 0).toFixed(2));
    const iva21 =
      params.iva21 !== undefined
        ? Number(params.iva21.toFixed(2))
        : iva105 === 0 && iva27 === 0
        ? Number((params.netoGravado * 0.21).toFixed(2))
        : 0;
    const percepcionIva = Number((params.percepcionIva ?? 0).toFixed(2));
    const percepcionIIBB = Number((params.percepcionIIBB ?? 0).toFixed(2));
    const impuestosInternos = Number((params.impuestosInternos ?? 0).toFixed(2));
    const otrosTributos = Number((params.otrosTributos ?? 0).toFixed(2));

    const totalImpuestos = Number(
      (iva21 + iva105 + iva27 + percepcionIva + percepcionIIBB + impuestosInternos + otrosTributos).toFixed(2)
    );
    const baseTotal = Number((params.netoGravado + noGravado + exento).toFixed(2));
    const total = Number((baseTotal + totalImpuestos).toFixed(2));

    const hoy = params.fechaEmision || new Date().toISOString().split('T')[0];
    const vto =
      params.fechaVencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const caeVto =
      params.caeVencimiento || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const caeGenerado = params.cae || `744${Math.floor(10000000000 + Math.random() * 89999999999)}`;

    // Descontar unidades en Inventario si la venta incluye artículos del depósito y calcular Costo de Mercadería Vendida (CMV)
    let costoTotalMercaderiaVendida = 0;
    if (params.itemsInventarioVenta && params.itemsInventarioVenta.length > 0) {
      let nuevoInv = [...inventario];
      const articulosModificados: ArticuloInventario[] = [];

      for (const itemVenta of params.itemsInventarioVenta) {
        if (!itemVenta.articuloId || itemVenta.cantidad <= 0) continue;
        const cantEgreso = -Math.abs(Number(itemVenta.cantidad));

        nuevoInv = nuevoInv.map((art) => {
          if (art.id !== itemVenta.articuloId) return art;
          const nuevoDisponible = Number((art.disponible + cantEgreso).toFixed(2));
          const nuevoStock = Number((art.stockActual + cantEgreso).toFixed(2));
          const precioVentaAplicado =
            itemVenta.precioUnitarioNeto > 0 ? Number(itemVenta.precioUnitarioNeto) : art.precioVentaNeto;
          const costoLineaCmv = Number((Math.abs(cantEgreso) * (art.costoCalculado || 0)).toFixed(2));
          costoTotalMercaderiaVendida = Number((costoTotalMercaderiaVendida + costoLineaCmv).toFixed(2));

          const nuevoMov = {
            id: `MOV-INV-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            fecha: hoy,
            deposito: itemVenta.deposito || 'Depósito Central',
            descripcion: `Salida por Venta ${etiquetaComprobanteVenta} — Cliente: ${cliente.razonSocial}`,
            tipoDoc: 'FAC',
            precio: precioVentaAplicado,
            cantidad: cantEgreso,
            destinoEgreso: `Cliente: ${cliente.razonSocial} (${cliente.cuit})`,
            comprobanteEgreso: etiquetaComprobanteVenta
          };

          const actualizado: ArticuloInventario = {
            ...art,
            disponible: nuevoDisponible,
            stockActual: nuevoStock,
            movimientos: [nuevoMov, ...(art.movimientos || [])]
          };
          articulosModificados.push(actualizado);
          return actualizado;
        });
      }

      setInventario(nuevoInv);

      if (articulosModificados.length > 0) {
        await supabase.from('erp_inventario').upsert(
          articulosModificados.map((i) => ({
            id: i.id,
            codigo: i.codigo,
            sku: i.sku,
            descripcion: i.descripcion,
            tipo: i.tipo,
            um: i.um,
            categoria: i.categoria,
            unidad_medida: i.unidadMedida,
            disponible: i.disponible,
            stock_actual: i.stockActual,
            stock_minimo: i.stockMinimo,
            costo_calculado: i.costoCalculado,
            precio_venta_neto: i.precioVentaNeto,
            alicuota_iva: i.alicuotaIva,
            deposito: i.deposito,
            movimientos: i.movimientos || [],
            updated_at: new Date().toISOString()
          }))
        );
      }
    }

    const esContado = !!params.cancelacionAlContado?.activa;
    const idFacAdeudada = `FAC-ADE-${Date.now()}-${Math.floor(Math.random() * 999)}`;

    const nuevaAdeudada: FacturaAdeudada = {
      id: idFacAdeudada,
      nroComprobante,
      tipo: params.tipo,
      fechaEmision: hoy,
      fechaPago: vto,
      descripcion: params.descripcion || 'Certificación de obras y provisión de materiales',
      medioCobroPactado: params.medioCobroPactado || 'Transferencia Bancaria Santander',
      valorMe: 0,
      total,
      cobrado: esContado ? total : 0,
      saldo: esContado ? 0 : total,
      saldoAcumulado: esContado ? cliente.saldo : cliente.saldo + total
    };

    const nuevoMovVenta = {
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      fecha: hoy,
      comprobante: `${params.tipo} ${nroComprobante}`,
      concepto: `${params.descripcion || 'Emisión de Comprobante Electrónico'}${
        esContado ? ' [CANCELACIÓN INMEDIATA AL CONTADO]' : ''
      }`,
      debe: total,
      haber: 0,
      saldo: cliente.saldo + total
    };

    const nroReciboContado = `0003-00000${Math.floor(415 + Math.random() * 500)}`;
    const lineasContado =
      esContado && params.cancelacionAlContado?.lineasMediosCobro && params.cancelacionAlContado.lineasMediosCobro.length > 0
        ? params.cancelacionAlContado.lineasMediosCobro
        : esContado
        ? [
            {
              medio: params.medioCobroPactado || 'Transferencia Bancaria Santander',
              cuentaBancariaId: resolverCuentaTesoreriaPorMedio(
                params.medioCobroPactado || 'Transferencia Bancaria Santander'
              ),
              importe: total
            }
          ]
        : [];

    const retContado = params.cancelacionAlContado?.retencionesSufridas || {};
    const totalRetContado = Number(
      (
        (retContado.retencionIIBB || 0) +
        (retContado.retencionGanancias || 0) +
        (retContado.retencionIVA || 0) +
        (retContado.retencionSUSS || 0)
      ).toFixed(2)
    );

    const resumenLineasContado = lineasContado
      .map((l) => `${l.medio}: $${Number(l.importe).toLocaleString('es-AR')}`)
      .concat(totalRetContado > 0 ? [`Retenciones: $${totalRetContado.toLocaleString('es-AR')}`] : [])
      .join(' + ');

    const movimientosNuevosCliente = esContado
      ? [
          ...cliente.movimientos,
          nuevoMovVenta,
          {
            id: `MOV-REC-CONT-${Date.now()}`,
            fecha: hoy,
            comprobante: `Recibo X ${nroReciboContado}`,
            concepto: `Cancelación al Contado (${resumenLineasContado}) [Imputado a: ${etiquetaComprobanteVenta}]`,
            debe: 0,
            haber: total,
            saldo: cliente.saldo
          }
        ]
      : [...cliente.movimientos, nuevoMovVenta];

    const clienteActualizado: Cliente = {
      ...cliente,
      saldo: esContado ? cliente.saldo : Number((cliente.saldo + total).toFixed(2)),
      facturasAdeudadas: esContado ? cliente.facturasAdeudadas : [nuevaAdeudada, ...cliente.facturasAdeudadas],
      movimientos: movimientosNuevosCliente
    };

    const nuevoComprobanteVenta: ComprobanteVenta = {
      id: `ZON-FV-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      tipo: params.tipo,
      puntoVenta: ptoVta,
      numero: nextNum,
      fechaEmision: hoy,
      fechaVencimiento: vto,
      clienteNombre: cliente.razonSocial,
      clienteCuit: cliente.cuit,
      condicionIva: cliente.condicionIva,
      netoGravado: baseTotal,
      iva21: Number((iva21 + iva27 + percepcionIva + percepcionIIBB + impuestosInternos + otrosTributos).toFixed(2)),
      iva105,
      total,
      estado: 'Aprobado AFIP',
      cae: caeGenerado,
      caeVencimiento: caeVto
    };

    setClientes((prev) => prev.map((c) => (c.id === cliente.id ? clienteActualizado : c)));
    setFacturasVenta((prev) => [nuevoComprobanteVenta, ...prev]);

    await Promise.all([
      supabase.from('erp_clientes').upsert({
        id: clienteActualizado.id,
        nombre: clienteActualizado.nombre,
        razon_social: clienteActualizado.razonSocial,
        cuit: clienteActualizado.cuit,
        condicion_iva: clienteActualizado.condicionIva,
        domicilio: clienteActualizado.domicilio,
        telefono: clienteActualizado.telefono,
        email: clienteActualizado.email,
        saldo: clienteActualizado.saldo,
        activo: clienteActualizado.activo,
        lista_precios: clienteActualizado.listaPrecios,
        limite_credito: clienteActualizado.limiteCredito,
        vendedor: clienteActualizado.vendedor,
        facturas_adeudadas: clienteActualizado.facturasAdeudadas,
        movimientos: clienteActualizado.movimientos,
        updated_at: new Date().toISOString()
      }),
      supabase.from('erp_comprobantes_venta').upsert({
        id: nuevoComprobanteVenta.id,
        tipo: nuevoComprobanteVenta.tipo,
        punto_venta: nuevoComprobanteVenta.puntoVenta,
        numero: nuevoComprobanteVenta.numero,
        fecha_emision: nuevoComprobanteVenta.fechaEmision,
        fecha_vencimiento: nuevoComprobanteVenta.fechaVencimiento,
        cliente_nombre: nuevoComprobanteVenta.clienteNombre,
        cliente_cuit: nuevoComprobanteVenta.clienteCuit,
        condicion_iva: nuevoComprobanteVenta.condicionIva,
        neto_gravado: nuevoComprobanteVenta.netoGravado,
        iva21: nuevoComprobanteVenta.iva21,
        iva105: nuevoComprobanteVenta.iva105,
        total: nuevoComprobanteVenta.total,
        estado: nuevoComprobanteVenta.estado,
        cae: nuevoComprobanteVenta.cae,
        cae_vencimiento: nuevoComprobanteVenta.caeVencimiento
      })
    ]);

    // Generar asiento contable automático con desglose de impuestos + Costo de Mercadería Vendida (CMV) si hubo egreso de stock
    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4093;
    const renglonesVenta: AsientoContable['renglones'] = [
      { cuentaCodigo: '1.1.02', cuentaNombre: 'Créditos por Ventas (Clientes)', debe: total, haber: 0 },
      { cuentaCodigo: '4.1', cuentaNombre: 'Ingresos por Ventas', debe: 0, haber: baseTotal },
      {
        cuentaCodigo: '2.1.02',
        cuentaNombre: 'Cargas Fiscales, IVA y Percepciones',
        debe: 0,
        haber: totalImpuestos
      }
    ];
    if (costoTotalMercaderiaVendida > 0) {
      renglonesVenta.push(
        {
          cuentaCodigo: '5.1',
          cuentaNombre: 'Costo de Mercaderías Vendidas (CMV)',
          debe: costoTotalMercaderiaVendida,
          haber: 0
        },
        {
          cuentaCodigo: '1.1.03',
          cuentaNombre: 'Bienes de Cambio (Inventario)',
          debe: 0,
          haber: costoTotalMercaderiaVendida
        }
      );
    }
    const sumaTotalAsiento = Number((total + costoTotalMercaderiaVendida).toFixed(2));
    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: hoy,
        concepto: `Emisión ${params.tipo} ${nroComprobante} - ${cliente.razonSocial}${
          costoTotalMercaderiaVendida > 0
            ? ` [Incluye CMV y Descarga de Stock $${costoTotalMercaderiaVendida.toLocaleString('es-AR')}]`
            : ''
        }`,
        tipoOrigen: 'Ventas',
        renglones: renglonesVenta,
        totalDebe: sumaTotalAsiento,
        totalHaber: sumaTotalAsiento
      },
      'FAC'
    );

    // Si se activó Cancelación Inmediata al Contado en 1 paso, impactar Tesorería, Cheques y Asiento de Cobranza simultáneamente
    if (esContado && lineasContado.length > 0) {
      await registrarLoteMovimientosTesoreria(
        lineasContado.map((l, idx) => ({
          cuentaId: resolverCuentaTesoreriaPorMedio(l.medio, l.cuentaBancariaId),
          tipo: 'REC',
          clienteProveedor: cliente.razonSocial,
          descripcion: `Recibo X Contado ${nroReciboContado} [${ idx + 1 }/${lineasContado.length}: ${l.medio}] [${etiquetaComprobanteVenta}]`,
          ingresos: Number(l.importe || 0),
          egresos: 0,
          nroCheque: l.nroCheque || l.nroCuponTarjeta
        }))
      );

      const chequesContado = lineasContado.filter(
        (l) => l.medio.toLowerCase().includes('cheque') || l.medio.toLowerCase().includes('e-cheq')
      );
      if (chequesContado.length > 0) {
        const nuevosChequesContado: Cheque[] = chequesContado.map((l, idx) => ({
          id: `CHQ-CONT-${Date.now()}-${idx}`,
          tipo: 'Cheque Terceros (Cartera)',
          numero: l.nroCheque || String(Math.floor(10000000 + Math.random() * 89999999)),
          bancoEmisor: l.bancoCheque || 'Banco San Juan',
          librador: cliente.razonSocial,
          cuitLibrador: cliente.cuit,
          fechaEmision: hoy,
          fechaPago:
            l.fechaPagoCheque || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          importe: Number(l.importe),
          estado: 'En Cartera',
          facturaId: idFacAdeudada,
          facturaNro: etiquetaComprobanteVenta
        }));
        setCheques((prev) => [...nuevosChequesContado, ...prev]);
        await supabase.from('erp_cheques').upsert(
          nuevosChequesContado.map((c) => ({
            id: c.id,
            tipo: c.tipo,
            numero: c.numero,
            banco_emisor: c.bancoEmisor,
            librador: c.librador,
            cuit_librador: c.cuitLibrador,
            fecha_emision: c.fechaEmision,
            fecha_pago: c.fechaPago,
            importe: c.importe,
            estado: c.estado
          }))
        );
      }

      const sumaCajaContado = Number(lineasContado.reduce((acc, l) => acc + Number(l.importe || 0), 0).toFixed(2));
      const totalReciboContado = Number((sumaCajaContado + totalRetContado).toFixed(2));
      const renglonesReciboContado: AsientoContable['renglones'] = [
        { cuentaCodigo: '1.1.01', cuentaNombre: 'Caja y Bancos', debe: sumaCajaContado, haber: 0 }
      ];
      if (totalRetContado > 0) {
        renglonesReciboContado.push({
          cuentaCodigo: '2.1.02',
          cuentaNombre: 'Cargas Fiscales, Retenciones Sufridas (IIBB/Ganancias/IVA/SUSS)',
          debe: totalRetContado,
          haber: 0
        });
      }
      renglonesReciboContado.push({
        cuentaCodigo: '1.1.02',
        cuentaNombre: 'Créditos por Ventas (Clientes)',
        debe: 0,
        haber: totalReciboContado
      });

      await impactarAsientoContable(
        {
          numero: nextAsientoNum + 1,
          fecha: hoy,
          concepto: `Cobranza al Contado Recibo X ${nroReciboContado} (${resumenLineasContado}) - ${cliente.razonSocial}`,
          tipoOrigen: 'Tesorería',
          renglones: renglonesReciboContado,
          totalDebe: totalReciboContado,
          totalHaber: totalReciboContado
        },
        'REC'
      );
    }
  };

  const registrarCobroCliente = async (params: {
    clienteId: string;
    monto: number;
    medioCobro: string;
    cuentaBancariaId?: string;
    nroCheque?: string;
    bancoCheque?: string;
    fechaPagoCheque?: string;
    nroCuponTarjeta?: string;
    marcaTarjeta?: string;
    facturaId?: string;
    facturaNro?: string;
    lineasMediosCobro?: LineaMedioPagoMixto[];
    retencionesSufridas?: DesgloseRetencionesFiscales;
  }) => {
    const cliente = clientes.find((c) => c.id === params.clienteId);
    if (!cliente) return;

    const hoy = new Date().toISOString().split('T')[0];
    const nroRecibo = `0003-00000${Math.floor(415 + Math.random() * 500)}`;

    const ret = params.retencionesSufridas || {};
    const totalRetenciones = Number(
      (
        (ret.retencionIIBB || 0) +
        (ret.retencionGanancias || 0) +
        (ret.retencionIVA || 0) +
        (ret.retencionSUSS || 0)
      ).toFixed(2)
    );

    const lineasActivas: LineaMedioPagoMixto[] =
      params.lineasMediosCobro && params.lineasMediosCobro.length > 0
        ? params.lineasMediosCobro.filter((l) => Number(l.importe) > 0)
        : [
            {
              medio: params.medioCobro,
              cuentaBancariaId: resolverCuentaTesoreriaPorMedio(params.medioCobro, params.cuentaBancariaId),
              importe: Math.max(0, Number((params.monto - totalRetenciones).toFixed(2))),
              nroCheque: params.nroCheque,
              bancoCheque: params.bancoCheque,
              fechaPagoCheque: params.fechaPagoCheque,
              marcaTarjeta: params.marcaTarjeta,
              nroCuponTarjeta: params.nroCuponTarjeta
            }
          ];

    const sumaMediosTesoreria = Number(
      lineasActivas.reduce((acc, l) => acc + Number(l.importe || 0), 0).toFixed(2)
    );
    const montoTotalCancelado = Number((sumaMediosTesoreria + totalRetenciones).toFixed(2)) || params.monto;
    const nuevoSaldoCliente = Math.max(0, Number((cliente.saldo - montoTotalCancelado).toFixed(2)));

    // Priorizar factura seleccionada si se indicó facturaId
    const facturaObjetivo =
      (params.facturaId && cliente.facturasAdeudadas.find((f) => f.id === params.facturaId)) ||
      cliente.facturasAdeudadas.find((f) => f.saldo > 0);
    const refComprobanteCobrado =
      params.facturaNro ||
      (facturaObjetivo ? `${facturaObjetivo.tipo} ${facturaObjetivo.nroComprobante}` : 'Cobro a Cuenta');

    const ordenFacturas = params.facturaId
      ? [
          ...cliente.facturasAdeudadas.filter((f) => f.id === params.facturaId),
          ...cliente.facturasAdeudadas.filter((f) => f.id !== params.facturaId)
        ]
      : cliente.facturasAdeudadas;

    let montoRestante = montoTotalCancelado;
    const mapActualizadas = new Map<string, FacturaAdeudada>();
    for (const f of ordenFacturas) {
      if (montoRestante <= 0 || f.saldo <= 0) {
        mapActualizadas.set(f.id, f);
        continue;
      }
      const imputado = Math.min(f.saldo, montoRestante);
      montoRestante = Number((montoRestante - imputado).toFixed(2));
      const nuevoSaldoFac = Number((f.saldo - imputado).toFixed(2));
      mapActualizadas.set(f.id, {
        ...f,
        cobrado: Number((f.cobrado + imputado).toFixed(2)),
        saldo: nuevoSaldoFac,
        saldoAcumulado: nuevoSaldoCliente
      });
    }

    const nuevasAdeudadas = cliente.facturasAdeudadas
      .map((f) => mapActualizadas.get(f.id) || f)
      .filter((f) => f.saldo > 0);

    const esMixto = lineasActivas.length > 1 || totalRetenciones > 0;
    const resumenMedios = lineasActivas
      .map((l) => {
        const extra = l.nroCheque
          ? ` (Cheque #${l.nroCheque} ${l.bancoCheque || ''})`
          : l.nroCuponTarjeta
          ? ` (${l.marcaTarjeta || 'Tarjeta'} Cupón #${l.nroCuponTarjeta})`
          : '';
        return `${l.medio}${extra}: $${Number(l.importe).toLocaleString('es-AR')}`;
      })
      .concat(
        totalRetenciones > 0
          ? [
              `Retenciones Sufridas${ret.nroCertificado ? ` Cert #${ret.nroCertificado}` : ''} (IIBB $${(
                ret.retencionIIBB || 0
              ).toLocaleString('es-AR')} / Gan. $${(ret.retencionGanancias || 0).toLocaleString(
                'es-AR'
              )} / IVA $${(ret.retencionIVA || 0).toLocaleString('es-AR')} / SUSS $${(
                ret.retencionSUSS || 0
              ).toLocaleString('es-AR')}): $${totalRetenciones.toLocaleString('es-AR')}`
            ]
          : []
      )
      .join(' + ');

    const clienteActualizado: Cliente = {
      ...cliente,
      saldo: nuevoSaldoCliente,
      facturasAdeudadas: nuevasAdeudadas,
      movimientos: [
        ...cliente.movimientos,
        {
          id: `MOV-${Date.now()}`,
          fecha: hoy,
          comprobante: `Recibo X ${nroRecibo}`,
          concepto: `${esMixto ? 'Cobro Mixto' : 'Cobro'} mediante ${resumenMedios} [Imputado a: ${refComprobanteCobrado}]`,
          debe: 0,
          haber: montoTotalCancelado,
          saldo: nuevoSaldoCliente
        }
      ]
    };

    setClientes((prev) => prev.map((c) => (c.id === cliente.id ? clienteActualizado : c)));

    await supabase.from('erp_clientes').upsert({
      id: clienteActualizado.id,
      nombre: clienteActualizado.nombre,
      razon_social: clienteActualizado.razonSocial,
      cuit: clienteActualizado.cuit,
      condicion_iva: clienteActualizado.condicionIva,
      domicilio: clienteActualizado.domicilio,
      telefono: clienteActualizado.telefono,
      email: clienteActualizado.email,
      saldo: clienteActualizado.saldo,
      activo: clienteActualizado.activo,
      lista_precios: clienteActualizado.listaPrecios,
      limite_credito: clienteActualizado.limiteCredito,
      vendedor: clienteActualizado.vendedor,
      facturas_adeudadas: clienteActualizado.facturasAdeudadas,
      movimientos: clienteActualizado.movimientos,
      updated_at: new Date().toISOString()
    });

    // Impactar todos los tramos del cobro en sus respectivas Cuentas de Tesorería (Cajas/Bancos/Tarjetas)
    await registrarLoteMovimientosTesoreria(
      lineasActivas.map((l, idx) => {
        const extra = l.nroCheque
          ? ` (Cheque #${l.nroCheque} ${l.bancoCheque || ''})`
          : l.nroCuponTarjeta
          ? ` (${l.marcaTarjeta || 'Tarjeta'} Cupón #${l.nroCuponTarjeta})`
          : '';
        return {
          cuentaId: resolverCuentaTesoreriaPorMedio(l.medio, l.cuentaBancariaId),
          tipo: 'REC',
          clienteProveedor: cliente.razonSocial,
          descripcion: `Recibo X ${nroRecibo}${
            lineasActivas.length > 1 ? ` [Tramo ${idx + 1}/${lineasActivas.length}]` : ''
          } (${l.medio}${extra}) [${refComprobanteCobrado}]`,
          ingresos: Number(l.importe || 0),
          egresos: 0,
          nroCheque: l.nroCheque || l.nroCuponTarjeta
        };
      })
    );

    // Si una o varias líneas son Cheque de Terceros o E-Cheq, agregarlas a Cartera de Cheques con trazabilidad a Factura y Cliente
    const lineasCheque = lineasActivas.filter(
      (l) => l.medio.toLowerCase().includes('cheque') || l.medio.toLowerCase().includes('e-cheq')
    );
    if (lineasCheque.length > 0) {
      const nuevosCheques: Cheque[] = lineasCheque.map((l, idx) => ({
        id: `CHQ-${Date.now()}-${idx}`,
        tipo: 'Cheque Terceros (Cartera)',
        numero: l.nroCheque || String(Math.floor(10000000 + Math.random() * 89999999)),
        bancoEmisor: l.bancoCheque || 'Banco San Juan',
        librador: cliente.razonSocial,
        cuitLibrador: cliente.cuit,
        fechaEmision: hoy,
        fechaPago:
          l.fechaPagoCheque || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        importe: Number(l.importe),
        estado: 'En Cartera',
        facturaId: facturaObjetivo?.id || params.facturaId,
        facturaNro: refComprobanteCobrado
      }));
      setCheques((prev) => [...nuevosCheques, ...prev]);
      await supabase.from('erp_cheques').upsert(
        nuevosCheques.map((nuevoCheque) => ({
          id: nuevoCheque.id,
          tipo: nuevoCheque.tipo,
          numero: nuevoCheque.numero,
          banco_emisor: nuevoCheque.bancoEmisor,
          librador: nuevoCheque.librador,
          cuit_librador: nuevoCheque.cuitLibrador,
          fecha_emision: nuevoCheque.fechaEmision,
          fecha_pago: nuevoCheque.fechaPago,
          importe: nuevoCheque.importe,
          estado: nuevoCheque.estado
        }))
      );
    }

    // Impactar Asiento Contable (con desglose de Caja/Bancos + Retenciones Sufridas contra Créditos por Ventas)
    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4094;
    const renglonesCobro: AsientoContable['renglones'] = [];
    if (sumaMediosTesoreria > 0) {
      renglonesCobro.push({
        cuentaCodigo: '1.1.01',
        cuentaNombre: 'Caja y Bancos',
        debe: sumaMediosTesoreria,
        haber: 0
      });
    }
    if (totalRetenciones > 0) {
      renglonesCobro.push({
        cuentaCodigo: '2.1.02',
        cuentaNombre: 'Cargas Fiscales, Retenciones Sufridas (IIBB/Ganancias/IVA/SUSS)',
        debe: totalRetenciones,
        haber: 0
      });
    }
    renglonesCobro.push({
      cuentaCodigo: '1.1.02',
      cuentaNombre: 'Créditos por Ventas (Clientes)',
      debe: 0,
      haber: montoTotalCancelado
    });

    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: hoy,
        concepto: `Cobranza Recibo X ${nroRecibo} (${resumenMedios}) - ${cliente.razonSocial}`,
        tipoOrigen: 'Tesorería',
        renglones: renglonesCobro,
        totalDebe: montoTotalCancelado,
        totalHaber: montoTotalCancelado
      },
      'REC'
    );
  };

  // ==========================================
  // 2. PROVEEDORES Y COMPRAS
  // ==========================================
  const crearProveedor = async (nuevoData: Omit<Proveedor, 'id' | 'facturasAdeudadas' | 'movimientos' | 'saldo'>) => {
    const cuitNorm = normalizarCuit(nuevoData.cuit);
    const existente =
      cuitNorm && cuitNorm !== '00000000000' && cuitNorm !== '30000000000'
        ? proveedores.find((p) => normalizarCuit(p.cuit) === cuitNorm)
        : undefined;
    if (existente) {
      const actualizado: Proveedor = {
        ...existente,
        ...nuevoData,
        id: existente.id
      };
      setProveedores((prev) => prev.map((p) => (p.id === existente.id ? actualizado : p)));
      return actualizado;
    }

    const nextNum = String(proveedores.length + 1).padStart(2, '0');
    const nuevo: Proveedor = {
      ...nuevoData,
      id: `PRV-${nextNum}-${Date.now().toString().slice(-3)}`,
      saldo: 0,
      facturasAdeudadas: [],
      movimientos: []
    };

    setProveedores((prev) => [nuevo, ...prev]);

    await supabase.from('erp_proveedores').upsert({
      id: nuevo.id,
      nombre: nuevo.nombre,
      razon_social: nuevo.razonSocial,
      cuit: nuevo.cuit,
      condicion_iva: nuevo.condicionIva,
      domicilio: nuevo.domicilio,
      telefono: nuevo.telefono,
      email: nuevo.email,
      saldo: nuevo.saldo,
      activo: nuevo.activo,
      cuenta_gasto_habitual: nuevo.cuentaGastoHabitual,
      condicion_pago: nuevo.condicionPago,
      facturas_adeudadas: nuevo.facturasAdeudadas,
      movimientos: nuevo.movimientos
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
    return nuevo;
  };

  const registrarFacturaCompra = async (params: {
    proveedorId: string;
    tipo: 'Factura A' | 'Factura B' | 'Factura C' | 'Liquidación' | 'Nota de Débito';
    nroComprobante?: string;
    netoGravado: number;
    descripcion: string;
    cuentaGasto?: string;
    medioPagoPactado?: string;
    fechaVencimiento?: string;
    cantidadCuotas?: number;
    itemsInventarioAsociados?: {
      articuloAsociadoId: string;
      codigoProveedor: string;
      descripcionProveedor: string;
      cantidad: number;
      costoUnitarioNeto: number;
    }[];
    cancelacionAlContado?: {
      activa: boolean;
      cuentaBancariaId?: string;
      nroCheque?: string;
      lineasMediosPago?: LineaMedioPagoMixto[];
      retencionesPracticadas?: DesgloseRetencionesFiscales;
    };
  }) => {
    const proveedor = proveedores.find((p) => p.id === params.proveedorId);
    if (!proveedor) return;

    const hoy = new Date().toISOString().split('T')[0];
    const vto = params.fechaVencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nroFact =
      params.nroComprobante && params.nroComprobante.trim().length > 0
        ? params.nroComprobante.trim()
        : `0001-000${Math.floor(10000 + Math.random() * 89999)}`;
    const idFacturaGenerada = `FP-${Date.now()}`;
    const etiquetaFacturaCompleta = `${params.tipo} ${nroFact}`;
    const iva = Number((params.netoGravado * 0.21).toFixed(2));
    const total = Number((params.netoGravado + iva).toFixed(2));
    const medioPactado = params.medioPagoPactado || 'Transferencia Bancaria Santander';
    const esContado = Boolean(params.cancelacionAlContado?.activa);
    const nroOpContado = `0001-00000${Math.floor(150 + Math.random() * 800)}`;

    const retContado = params.cancelacionAlContado?.retencionesPracticadas;
    const retIIBBContado = Number(retContado?.retencionIIBB || 0);
    const retGanContado = Number(retContado?.retencionGanancias || 0);
    const retIVAContado = Number(retContado?.retencionIVA || 0);
    const retSUSSContado = Number(retContado?.retencionSUSS || 0);
    const totalRetContado = Number((retIIBBContado + retGanContado + retIVAContado + retSUSSContado).toFixed(2));

    const lineasContado: LineaMedioPagoMixto[] =
      esContado &&
      params.cancelacionAlContado?.lineasMediosPago &&
      params.cancelacionAlContado.lineasMediosPago.filter((l) => Number(l.importe) > 0).length > 0
        ? params.cancelacionAlContado.lineasMediosPago.filter((l) => Number(l.importe) > 0)
        : esContado
        ? [
            {
              medio: medioPactado,
              importe: Math.max(0, Number((total - totalRetContado).toFixed(2))),
              cuentaBancariaId: params.cancelacionAlContado?.cuentaBancariaId,
              nroCheque: params.cancelacionAlContado?.nroCheque
            }
          ]
        : [];

    const resumenMediosContado = esContado
      ? [
          ...lineasContado.map((l) => `${l.medio} ($${Number(l.importe).toLocaleString('es-AR')})`),
          ...(totalRetContado > 0 ? [`Retenciones ($${totalRetContado.toLocaleString('es-AR')})`] : [])
        ].join(' + ')
      : medioPactado;

    // Impactar Stock y Precio de Costo en los productos de Inventario asociados (con trazabilidad obligatoria de Factura + Proveedor)
    if (params.itemsInventarioAsociados && params.itemsInventarioAsociados.length > 0) {
      let nuevoInv = [...inventario];
      const articulosParaUpsert: ArticuloInventario[] = [];

      for (const item of params.itemsInventarioAsociados) {
        if (!item.articuloAsociadoId || item.cantidad <= 0) continue;

        if (item.articuloAsociadoId === '__CREAR_NUEVO__') {
          const nuevoCodigo = String(nuevoInv.length + 1).padStart(6, '0');
          const nuevoArt: ArticuloInventario = {
            id: `INV-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            codigo: nuevoCodigo,
            sku: item.codigoProveedor || nuevoCodigo,
            descripcion: item.descripcionProveedor.toUpperCase(),
            tipo: 'P',
            um: '1',
            categoria: 'Materiales Incorporados por Factura',
            unidadMedida: 'Unidad',
            disponible: Number(item.cantidad),
            stockActual: Number(item.cantidad),
            stockMinimo: 1,
            costoCalculado: Number(item.costoUnitarioNeto),
            precioVentaNeto: Number((item.costoUnitarioNeto * 1.35).toFixed(2)),
            alicuotaIva: 21,
            deposito: 'Depósito Central San Juan',
            movimientos: [
              {
                id: `MOV-INV-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                fecha: hoy,
                deposito: 'Depósito Central',
                descripcion: `Ingreso por ${etiquetaFacturaCompleta} — ${proveedor.razonSocial}`,
                tipoDoc: 'FAC',
                precio: Number(item.costoUnitarioNeto),
                cantidad: Number(item.cantidad),
                proveedorId: proveedor.id,
                proveedorNombre: proveedor.razonSocial,
                proveedorCuit: proveedor.cuit,
                facturaId: idFacturaGenerada,
                facturaNro: etiquetaFacturaCompleta
              }
            ]
          };
          nuevoInv.push(nuevoArt);
          articulosParaUpsert.push(nuevoArt);
        } else {
          nuevoInv = nuevoInv.map((art) => {
            if (art.id !== item.articuloAsociadoId) return art;
            const nuevoStock = Number((art.stockActual + item.cantidad).toFixed(2));
            const nuevoDisponible = Number((art.disponible + item.cantidad).toFixed(2));
            const nuevoCosto = Number(item.costoUnitarioNeto.toFixed(2));
            const margenPrevio =
              art.costoCalculado > 0 ? art.precioVentaNeto / art.costoCalculado : 1;
            const nuevoPrecioVenta = Number((nuevoCosto * Math.max(1, margenPrevio)).toFixed(2));

            const nuevoMov = {
              id: `MOV-INV-${Date.now()}-${Math.floor(Math.random() * 999)}`,
              fecha: hoy,
              deposito: 'Depósito Central',
              descripcion: `Ingreso por ${etiquetaFacturaCompleta} — ${proveedor.razonSocial} (${item.descripcionProveedor})`,
              tipoDoc: 'FAC',
              precio: nuevoCosto,
              cantidad: Number(item.cantidad),
              proveedorId: proveedor.id,
              proveedorNombre: proveedor.razonSocial,
              proveedorCuit: proveedor.cuit,
              facturaId: idFacturaGenerada,
              facturaNro: etiquetaFacturaCompleta
            };

            const actualizado: ArticuloInventario = {
              ...art,
              disponible: nuevoDisponible,
              stockActual: nuevoStock,
              costoCalculado: nuevoCosto,
              precioVentaNeto: nuevoPrecioVenta,
              movimientos: [nuevoMov, ...(art.movimientos || [])]
            };
            articulosParaUpsert.push(actualizado);
            return actualizado;
          });
        }
      }

      setInventario(nuevoInv);

      if (articulosParaUpsert.length > 0) {
        await supabase.from('erp_inventario').upsert(
          articulosParaUpsert.map((i) => ({
            id: i.id,
            codigo: i.codigo,
            sku: i.sku,
            descripcion: i.descripcion,
            tipo: i.tipo,
            um: i.um,
            categoria: i.categoria,
            unidad_medida: i.unidadMedida,
            disponible: i.disponible,
            stock_actual: i.stockActual,
            stock_minimo: i.stockMinimo,
            costo_calculado: i.costoCalculado,
            precio_venta_neto: i.precioVentaNeto,
            alicuota_iva: i.alicuotaIva,
            deposito: i.deposito,
            movimientos: i.movimientos || [],
            updated_at: new Date().toISOString()
          }))
        );
      }
    }

    const nuevaFacturaAdeudada: FacturaAdeudadaProveedor = {
      id: idFacturaGenerada,
      nroComprobante: nroFact,
      tipo: params.tipo,
      fechaEmision: hoy,
      fechaPago: esContado ? hoy : vto,
      descripcion: params.descripcion || 'Provisión de materiales e insumos operativos',
      medioPagoPactado: esContado ? `${resumenMediosContado} (PAGADO CONTADO)` : medioPactado,
      cantidadCuotas: params.cantidadCuotas || 1,
      cuotasPagadas: esContado ? params.cantidadCuotas || 1 : 0,
      chequesAsociados: [],
      valorMe: 0,
      total,
      pagado: esContado ? total : 0,
      saldo: esContado ? 0 : total,
      saldoAcumulado: esContado ? proveedor.saldo : proveedor.saldo + total
    };

    const nuevosMovimientosPrv: Proveedor['movimientos'] = [
      ...proveedor.movimientos,
      {
        id: `MP-${Date.now()}`,
        fecha: hoy,
        comprobante: `${params.tipo} ${nroFact}`,
        concepto: `${params.descripcion || 'Registro de Factura de Compra'} [${
          esContado
            ? `CANCELADO AL CONTADO — OP ${nroOpContado} (${resumenMediosContado})`
            : `Medio previsto: ${medioPactado} · PENDIENTE DE PAGO`
        }]`,
        debe: 0,
        haber: total,
        saldo: Number((proveedor.saldo + total).toFixed(2))
      }
    ];

    if (esContado) {
      nuevosMovimientosPrv.push({
        id: `MP-${Date.now() + 1}`,
        fecha: hoy,
        comprobante: `OP ${nroOpContado}`,
        concepto: `Cancelación Al Contado (${resumenMediosContado}) [${params.tipo} ${nroFact}]`,
        debe: total,
        haber: 0,
        saldo: Number(proveedor.saldo.toFixed(2))
      });
    }

    const proveedorActualizado: Proveedor = {
      ...proveedor,
      saldo: esContado ? Number(proveedor.saldo.toFixed(2)) : Number((proveedor.saldo + total).toFixed(2)),
      facturasAdeudadas: esContado ? proveedor.facturasAdeudadas : [nuevaFacturaAdeudada, ...proveedor.facturasAdeudadas],
      movimientos: nuevosMovimientosPrv
    };

    const nuevoComprobanteCompra: ComprobanteCompra = {
      id: `ZON-FC-${Date.now()}`,
      tipo: params.tipo,
      numero: nroFact,
      proveedorNombre: proveedor.razonSocial,
      proveedorCuit: proveedor.cuit,
      fechaComprobante: hoy,
      fechaImputacion: hoy,
      cuentaGasto: params.cuentaGasto || proveedor.cuentaGastoHabitual,
      netoGravado: params.netoGravado,
      iva,
      retencionIva: retIVAContado,
      retencionIIBB: Number((retIIBBContado + retGanContado + retSUSSContado).toFixed(2)),
      total,
      estadoPago: esContado ? 'Pagado Total' : 'Pendiente',
      medioPagoPactado: esContado ? resumenMediosContado : medioPactado
    };

    setProveedores((prev) => prev.map((p) => (p.id === proveedor.id ? proveedorActualizado : p)));
    setFacturasCompra((prev) => [nuevoComprobanteCompra, ...prev]);

    await Promise.all([
      supabase.from('erp_proveedores').upsert({
        id: proveedorActualizado.id,
        nombre: proveedorActualizado.nombre,
        razon_social: proveedorActualizado.razonSocial,
        cuit: proveedorActualizado.cuit,
        condicion_iva: proveedorActualizado.condicionIva,
        domicilio: proveedorActualizado.domicilio,
        telefono: proveedorActualizado.telefono,
        email: proveedorActualizado.email,
        saldo: proveedorActualizado.saldo,
        activo: proveedorActualizado.activo,
        cuenta_gasto_habitual: proveedorActualizado.cuentaGastoHabitual,
        condicion_pago: proveedorActualizado.condicionPago,
        facturas_adeudadas: proveedorActualizado.facturasAdeudadas,
        movimientos: proveedorActualizado.movimientos,
        updated_at: new Date().toISOString()
      }),
      supabase.from('erp_comprobantes_compra').upsert({
        id: nuevoComprobanteCompra.id,
        tipo: nuevoComprobanteCompra.tipo,
        numero: nuevoComprobanteCompra.numero,
        proveedor_nombre: nuevoComprobanteCompra.proveedorNombre,
        proveedor_cuit: nuevoComprobanteCompra.proveedorCuit,
        fecha_comprobante: nuevoComprobanteCompra.fechaComprobante,
        fecha_imputacion: nuevoComprobanteCompra.fechaImputacion,
        cuenta_gasto: nuevoComprobanteCompra.cuentaGasto,
        neto_gravado: nuevoComprobanteCompra.netoGravado,
        iva: nuevoComprobanteCompra.iva,
        retencion_iva: nuevoComprobanteCompra.retencionIva,
        retencion_iibb: nuevoComprobanteCompra.retencionIIBB,
        total: nuevoComprobanteCompra.total,
        estado_pago: nuevoComprobanteCompra.estadoPago
      })
    ]);

    // Impactar Asiento Contable en la Cuenta del Plan de Cuentas seleccionada (Activando 1.1.03 Bienes de Cambio si hay artículos de stock)
    const rawCuentaGasto = params.cuentaGasto || proveedor.cuentaGastoHabitual || '5.1.01 Materiales e Insumos';
    const matchCodigo = rawCuentaGasto.match(/^([0-9]+(?:\.[0-9]+)+)\s+(.+)$/);
    const codigoImputacion = matchCodigo ? matchCodigo[1] : '5.1';
    const nombreImputacion = matchCodigo ? matchCodigo[2] : rawCuentaGasto;

    const netoBienesCambio = Number(
      (params.itemsInventarioAsociados || [])
        .filter((it) => it.articuloAsociadoId && it.cantidad > 0)
        .reduce((acc, it) => acc + it.cantidad * it.costoUnitarioNeto, 0)
        .toFixed(2)
    );
    const montoStockActivado = Math.min(params.netoGravado, netoBienesCambio);
    const montoGastoRestante = Math.max(0, Number((params.netoGravado - montoStockActivado).toFixed(2)));

    const renglonesCompra: AsientoContable['renglones'] = [];
    if (montoStockActivado > 0) {
      renglonesCompra.push({
        cuentaCodigo: '1.1.03',
        cuentaNombre: 'Bienes de Cambio (Inventario)',
        debe: montoStockActivado,
        haber: 0
      });
    }
    if (montoGastoRestante > 0 || renglonesCompra.length === 0) {
      renglonesCompra.push({
        cuentaCodigo: codigoImputacion,
        cuentaNombre: nombreImputacion,
        debe: montoStockActivado > 0 ? montoGastoRestante : params.netoGravado,
        haber: 0
      });
    }
    renglonesCompra.push(
      { cuentaCodigo: '2.1.02', cuentaNombre: 'Cargas Fiscales e IVA', debe: iva, haber: 0 },
      { cuentaCodigo: '2.1.01', cuentaNombre: 'Proveedores Comerciales', debe: 0, haber: total }
    );

    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4095;
    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: hoy,
        concepto: `Compra ${params.tipo} ${nroFact}${esContado ? ' [AL CONTADO]' : ''} - ${proveedor.razonSocial} (${
          montoStockActivado > 0 ? '1.1.03 Bienes de Cambio + ' : ''
        }${rawCuentaGasto})`,
        tipoOrigen: 'Compras',
        renglones: renglonesCompra,
        totalDebe: total,
        totalHaber: total
      },
      'COM'
    );

    // Si es Compra Al Contado en 1 paso: impactar Tesorería, Cheques y Asiento de Orden de Pago simultáneamente
    if (esContado) {
      await registrarLoteMovimientosTesoreria(
        lineasContado.map((l, idx) => ({
          cuentaId: resolverCuentaTesoreriaPorMedio(l.medio, l.cuentaBancariaId),
          tipo: 'PAG',
          clienteProveedor: proveedor.razonSocial,
          descripcion: `Orden de Pago Contado ${nroOpContado}${
            lineasContado.length > 1 ? ` [Tramo ${idx + 1}/${lineasContado.length}]` : ''
          } (${l.medio}) [${params.tipo} ${nroFact}]`,
          ingresos: 0,
          egresos: Number(l.importe || 0),
          nroCheque: l.nroCheque
        }))
      );

      const lineasChequeContado = lineasContado.filter(
        (l) => l.medio.toLowerCase().includes('cheque') || l.medio.toLowerCase().includes('e-cheq')
      );
      if (lineasChequeContado.length > 0) {
        const nuevosChequesContado: Cheque[] = lineasChequeContado.map((l, idx) => ({
          id: l.chequeCarteraId || `CHQ-CONT-${Date.now()}-${idx}`,
          tipo: l.chequeCarteraId ? 'Cheque Terceros (Cartera)' : 'Cheque Propio Diferido',
          numero: l.nroCheque || `0000${Math.floor(5000 + Math.random() * 4000)}`,
          bancoEmisor: l.bancoCheque || 'Banco Santander',
          librador: empresa.razonSocial,
          cuitLibrador: empresa.cuit,
          fechaEmision: hoy,
          fechaPago:
            l.fechaPagoCheque || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          importe: Number(l.importe),
          estado: 'Entregado a Proveedor',
          proveedorId: proveedor.id,
          proveedorNombre: proveedor.razonSocial,
          facturaId: idFacturaGenerada,
          facturaNro: `${params.tipo} ${nroFact}`
        }));
        setCheques((prev) => [...nuevosChequesContado, ...prev]);
      }

      const sumaTesoreriaContado = Number(
        lineasContado.reduce((acc, l) => acc + Number(l.importe || 0), 0).toFixed(2)
      );
      const renglonesOpContado: AsientoContable['renglones'] = [
        { cuentaCodigo: '2.1.01', cuentaNombre: 'Proveedores Comerciales', debe: total, haber: 0 }
      ];
      if (sumaTesoreriaContado > 0) {
        renglonesOpContado.push({
          cuentaCodigo: '1.1.01',
          cuentaNombre: 'Caja y Bancos',
          debe: 0,
          haber: sumaTesoreriaContado
        });
      }
      if (totalRetContado > 0) {
        renglonesOpContado.push({
          cuentaCodigo: '2.1.02',
          cuentaNombre: 'Cargas Fiscales, Retenciones Practicadas a Proveedor (ARCA/IIBB)',
          debe: 0,
          haber: totalRetContado
        });
      }

      await impactarAsientoContable(
        {
          numero: nextAsientoNum + 1,
          fecha: hoy,
          concepto: `OP Contado ${nroOpContado} (${resumenMediosContado}) - ${params.tipo} ${nroFact} - ${proveedor.razonSocial}`,
          tipoOrigen: 'Tesorería',
          renglones: renglonesOpContado,
          totalDebe: total,
          totalHaber: total
        },
        'PAG'
      );
    }
  };

  const registrarPagoProveedor = async (params: {
    proveedorId: string;
    monto: number;
    medioPago: string;
    cuentaBancariaId?: string;
    nroCheque?: string;
    facturaId?: string;
    facturaNro?: string;
    cantidadCuotas?: number;
    chequesEmitidos?: {
      numero: string;
      bancoEmisor: string;
      fechaPago: string;
      importe: number;
      tipo: 'Cheque Propio Diferido' | 'Cheque Terceros (Cartera)';
      chequeCarteraId?: string;
      cuotaNro?: number;
      totalCuotas?: number;
    }[];
    lineasMediosPago?: LineaMedioPagoMixto[];
    retencionesPracticadas?: DesgloseRetencionesFiscales;
  }) => {
    const proveedor = proveedores.find((p) => p.id === params.proveedorId);
    if (!proveedor) return;

    const hoy = new Date().toISOString().split('T')[0];
    const nroOp = `0001-00000${Math.floor(150 + Math.random() * 800)}`;

    // Calcular Retenciones Practicadas al Proveedor (IIBB, Ganancias RG 830, IVA, SUSS)
    const ret = params.retencionesPracticadas;
    const retIIBB = Number(ret?.retencionIIBB || 0);
    const retGan = Number(ret?.retencionGanancias || 0);
    const retIVA = Number(ret?.retencionIVA || 0);
    const retSUSS = Number(ret?.retencionSUSS || 0);
    const totalRetenciones = Number((retIIBB + retGan + retIVA + retSUSS).toFixed(2));

    // Normalizar tramos de pago (soporta Pago Simple, Multi-Cheque o Pago Mixto Multi-Medio)
    const lineasActivas: LineaMedioPagoMixto[] =
      params.lineasMediosPago && params.lineasMediosPago.filter((l) => Number(l.importe) > 0).length > 0
        ? params.lineasMediosPago.filter((l) => Number(l.importe) > 0)
        : [
            {
              medio: params.medioPago,
              importe: Math.max(0, Number((params.monto - totalRetenciones).toFixed(2))),
              cuentaBancariaId: params.cuentaBancariaId,
              nroCheque: params.nroCheque
            }
          ];

    const sumaMediosTesoreria = Number(
      lineasActivas.reduce((acc, l) => acc + Number(l.importe || 0), 0).toFixed(2)
    );
    const montoTotalCancelado =
      params.lineasMediosPago && params.lineasMediosPago.length > 0
        ? Number((sumaMediosTesoreria + totalRetenciones).toFixed(2))
        : Number(params.monto.toFixed(2));

    const nuevoSaldoPrv = Math.max(0, Number((proveedor.saldo - montoTotalCancelado).toFixed(2)));

    // Identificar la factura objetivo (si se indicó facturaId, o la primera con saldo > 0)
    const facturaObjetivo =
      (params.facturaId && proveedor.facturasAdeudadas.find((f) => f.id === params.facturaId)) ||
      proveedor.facturasAdeudadas.find((f) => f.saldo > 0);

    const facturaRefId = facturaObjetivo?.id || params.facturaId || `FP-${Date.now()}`;
    const facturaRefNro =
      params.facturaNro ||
      (facturaObjetivo ? `${facturaObjetivo.tipo} ${facturaObjetivo.nroComprobante}` : 'Pago a Cuenta');

    // Construir lista de cheques asociados (tanto de params.chequesEmitidos como de tramos de cheque en lineasMediosPago)
    const chequesDeLineasMixtas =
      params.lineasMediosPago && params.lineasMediosPago.length > 0
        ? lineasActivas
            .filter(
              (l) => l.medio.toLowerCase().includes('cheque') || l.medio.toLowerCase().includes('e-cheq')
            )
            .map((l, idx) => ({
              numero: l.nroCheque || `0000${Math.floor(5100 + Math.random() * 4000)}`,
              bancoEmisor: l.bancoCheque || 'Banco Santander',
              fechaPago:
                l.fechaPagoCheque || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              importe: Number(l.importe),
              tipo: (l.chequeCarteraId || l.medio.toLowerCase().includes('terceros') || l.medio.toLowerCase().includes('endos')
                ? 'Cheque Terceros (Cartera)'
                : 'Cheque Propio Diferido') as 'Cheque Propio Diferido' | 'Cheque Terceros (Cartera)',
              chequeCarteraId: l.chequeCarteraId,
              cuotaNro: idx + 1,
              totalCuotas: params.cantidadCuotas || 1
            }))
        : [];

    const listaChequesInput =
      params.chequesEmitidos && params.chequesEmitidos.length > 0
        ? params.chequesEmitidos
        : chequesDeLineasMixtas.length > 0
        ? chequesDeLineasMixtas
        : params.medioPago.toLowerCase().includes('cheque')
        ? [
            {
              numero: params.nroCheque || `0000${Math.floor(4922 + Math.random() * 1000)}`,
              bancoEmisor: 'Banco Santander',
              fechaPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              importe: sumaMediosTesoreria,
              tipo: 'Cheque Propio Diferido' as const,
              cuotaNro: 1,
              totalCuotas: params.cantidadCuotas || 1
            }
          ]
        : [];

    const chequesAsociadosNuevos: ChequeAsociadoFactura[] = listaChequesInput.map((ch, idx) => ({
      id: ch.chequeCarteraId || `CHQ-${Date.now()}-${idx}`,
      numero: ch.numero,
      bancoEmisor: ch.bancoEmisor,
      fechaEmision: hoy,
      fechaPago: ch.fechaPago,
      importe: Number(ch.importe),
      tipo: ch.tipo || 'Cheque Propio Diferido',
      estado: 'Entregado a Proveedor',
      cuotaNro: ch.cuotaNro || idx + 1,
      totalCuotas: ch.totalCuotas || params.cantidadCuotas || listaChequesInput.length,
      facturaId: facturaRefId,
      facturaNro: facturaRefNro,
      proveedorId: proveedor.id,
      proveedorNombre: proveedor.razonSocial
    }));

    let montoRestante = montoTotalCancelado;

    // Primero imputar a la factura seleccionada (si existe) y luego al resto en orden
    const ordenFacturas = params.facturaId
      ? [
          ...proveedor.facturasAdeudadas.filter((f) => f.id === params.facturaId),
          ...proveedor.facturasAdeudadas.filter((f) => f.id !== params.facturaId)
        ]
      : proveedor.facturasAdeudadas;

    const mapActualizadas = new Map<string, FacturaAdeudadaProveedor>();

    for (const f of ordenFacturas) {
      if (montoRestante <= 0 || f.saldo <= 0) {
        mapActualizadas.set(f.id, f);
        continue;
      }
      const imputado = Math.min(f.saldo, montoRestante);
      montoRestante = Number((montoRestante - imputado).toFixed(2));
      const nuevoSaldoFac = Number((f.saldo - imputado).toFixed(2));
      const esFacturaPrincipal = f.id === facturaRefId;

      const totalCuotasFac =
        (esFacturaPrincipal && params.cantidadCuotas) ||
        f.cantidadCuotas ||
        (chequesAsociadosNuevos.length > 1 ? chequesAsociadosNuevos.length : 1);

      const cuotasYaPagadas =
        (f.cuotasPagadas || 0) + (esFacturaPrincipal ? Math.max(1, chequesAsociadosNuevos.length) : 1);

      const chequesDeEstaFactura = esFacturaPrincipal
        ? [...(f.chequesAsociados || []), ...chequesAsociadosNuevos]
        : f.chequesAsociados || [];

      mapActualizadas.set(f.id, {
        ...f,
        pagado: Number((f.pagado + imputado).toFixed(2)),
        saldo: nuevoSaldoFac,
        saldoAcumulado: nuevoSaldoPrv,
        cantidadCuotas: totalCuotasFac,
        cuotasPagadas: Math.min(totalCuotasFac, cuotasYaPagadas),
        chequesAsociados: chequesDeEstaFactura
      });
    }

    // Mantener facturas con saldo > 0 O facturas que tengan cheques diferidos asociados en seguimiento
    const nuevasAdeudadas = proveedor.facturasAdeudadas
      .map((f) => mapActualizadas.get(f.id) || f)
      .filter((f) => f.saldo > 0 || (f.chequesAsociados && f.chequesAsociados.length > 0));

    const resumenMediosPago = [
      ...lineasActivas.map((l) => `${l.medio} ($${Number(l.importe).toLocaleString('es-AR')})`),
      ...(totalRetenciones > 0
        ? [
            `Retenciones ($${totalRetenciones.toLocaleString('es-AR')}${
              ret?.nroCertificado ? ` Cert #${ret.nroCertificado}` : ''
            })`
          ]
        : [])
    ].join(' + ');

    const detalleChequesTexto =
      chequesAsociadosNuevos.length > 0
        ? ` [Factura: ${facturaRefNro} · ${chequesAsociadosNuevos.length} Cheque(s): ${chequesAsociadosNuevos
            .map((c) => `#${c.numero} (${c.bancoEmisor}) Vto ${c.fechaPago} $${c.importe.toLocaleString('es-AR')}`)
            .join(' | ')}]`
        : ` [Factura: ${facturaRefNro}]`;

    const proveedorActualizado: Proveedor = {
      ...proveedor,
      saldo: nuevoSaldoPrv,
      facturasAdeudadas: nuevasAdeudadas,
      movimientos: [
        ...proveedor.movimientos,
        {
          id: `MP-${Date.now()}`,
          fecha: hoy,
          comprobante: `OP ${nroOp}`,
          concepto: `Orden de Pago (${resumenMediosPago})${detalleChequesTexto}`,
          debe: montoTotalCancelado,
          haber: 0,
          saldo: nuevoSaldoPrv
        }
      ]
    };

    setProveedores((prev) => prev.map((p) => (p.id === proveedor.id ? proveedorActualizado : p)));

    // Sincronizar estadoPago = 'Pagado Total' y Retenciones Practicadas en facturasCompra (conectado con Zonda Cloud ARCA)
    const nrosCancelados = new Set<string>();
    for (const [, fUpd] of mapActualizadas.entries()) {
      if (fUpd.saldo <= 0) {
        nrosCancelados.add(fUpd.nroComprobante);
      }
    }
    const nroFacPrincipal = facturaObjetivo?.nroComprobante;
    if (nrosCancelados.size > 0 || (totalRetenciones > 0 && nroFacPrincipal)) {
      setFacturasCompra((prev) =>
        prev.map((fc) => {
          const esCancelada = nrosCancelados.has(fc.numero);
          const esObj = nroFacPrincipal && fc.numero === nroFacPrincipal;
          if (!esCancelada && !esObj) return fc;
          return {
            ...fc,
            estadoPago: esCancelada ? 'Pagado Total' : fc.estadoPago,
            retencionIva: esObj ? Number((fc.retencionIva + retIVA).toFixed(2)) : fc.retencionIva,
            retencionIIBB: esObj
              ? Number((fc.retencionIIBB + retIIBB + retGan + retSUSS).toFixed(2))
              : fc.retencionIIBB
          };
        })
      );
      for (const nroCanc of nrosCancelados) {
        supabase
          .from('erp_comprobantes_compra')
          .update({ estado_pago: 'Pagado Total' })
          .eq('numero', nroCanc)
          .then(() => {});
      }
    }

    await supabase.from('erp_proveedores').upsert({
      id: proveedorActualizado.id,
      nombre: proveedorActualizado.nombre,
      razon_social: proveedorActualizado.razonSocial,
      cuit: proveedorActualizado.cuit,
      condicion_iva: proveedorActualizado.condicionIva,
      domicilio: proveedorActualizado.domicilio,
      telefono: proveedorActualizado.telefono,
      email: proveedorActualizado.email,
      saldo: proveedorActualizado.saldo,
      activo: proveedorActualizado.activo,
      cuenta_gasto_habitual: proveedorActualizado.cuentaGastoHabitual,
      condicion_pago: proveedorActualizado.condicionPago,
      facturas_adeudadas: proveedorActualizado.facturasAdeudadas,
      movimientos: proveedorActualizado.movimientos,
      updated_at: new Date().toISOString()
    });

    // Impactar todos los tramos del Pago Mixto en sus respectivas Cuentas de Tesorería (Cajas/Bancos/Tarjetas/Cheques)
    await registrarLoteMovimientosTesoreria(
      lineasActivas.map((l, idx) => ({
        cuentaId: resolverCuentaTesoreriaPorMedio(l.medio, l.cuentaBancariaId),
        tipo: 'PAG',
        clienteProveedor: proveedor.razonSocial,
        descripcion: `Orden de Pago ${nroOp}${
          lineasActivas.length > 1 ? ` [Tramo ${idx + 1}/${lineasActivas.length}]` : ''
        } (${l.medio})${detalleChequesTexto}`,
        ingresos: 0,
        egresos: Number(l.importe || 0),
        nroCheque:
          l.nroCheque ||
          (chequesAsociadosNuevos.length > 0 && l.medio.toLowerCase().includes('cheque')
            ? chequesAsociadosNuevos.map((c) => c.numero).join(', ')
            : undefined)
      }))
    );

    // Si hay 1 o varios cheques emitidos/endosados, guardarlos todos en erp_cheques y vincularlos a factura + proveedor
    if (chequesAsociadosNuevos.length > 0) {
      const nuevosChequesErp: Cheque[] = chequesAsociadosNuevos.map((ch) => {
        const chqPrevioEnCartera = cheques.find((c) => c.id === ch.id || c.numero === ch.numero);
        const esPropio = ch.tipo === 'Cheque Propio Diferido';
        return {
          id: ch.id,
          tipo: ch.tipo,
          numero: ch.numero,
          bancoEmisor: ch.bancoEmisor,
          librador: esPropio ? empresa.razonSocial : chqPrevioEnCartera?.librador || proveedor.razonSocial,
          cuitLibrador: esPropio ? empresa.cuit : chqPrevioEnCartera?.cuitLibrador || proveedor.cuit,
          fechaEmision: chqPrevioEnCartera?.fechaEmision || ch.fechaEmision,
          fechaPago: ch.fechaPago,
          importe: ch.importe,
          estado: 'Entregado a Proveedor',
          proveedorId: proveedor.id,
          proveedorNombre: proveedor.razonSocial,
          facturaId: ch.facturaId,
          facturaNro: ch.facturaNro,
          cuotaNro: ch.cuotaNro,
          totalCuotas: ch.totalCuotas
        };
      });

      setCheques((prev) => {
        const idsActualizados = new Set(nuevosChequesErp.map((c) => c.id));
        return [...nuevosChequesErp, ...prev.filter((c) => !idsActualizados.has(c.id))];
      });

      await supabase.from('erp_cheques').upsert(
        nuevosChequesErp.map((nuevoCheque) => ({
          id: nuevoCheque.id,
          tipo: nuevoCheque.tipo,
          numero: nuevoCheque.numero,
          banco_emisor: nuevoCheque.bancoEmisor,
          librador: nuevoCheque.librador,
          cuit_librador: nuevoCheque.cuitLibrador,
          fecha_emision: nuevoCheque.fechaEmision,
          fecha_pago: nuevoCheque.fechaPago,
          importe: nuevoCheque.importe,
          estado: nuevoCheque.estado
        }))
      );
    }

    // Impactar Asiento Contable (con desglose de Proveedores Comerciales a Caja/Bancos + Retenciones Practicadas)
    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4096;
    const renglonesPago: AsientoContable['renglones'] = [
      { cuentaCodigo: '2.1.01', cuentaNombre: 'Proveedores Comerciales', debe: montoTotalCancelado, haber: 0 }
    ];
    if (sumaMediosTesoreria > 0) {
      renglonesPago.push({
        cuentaCodigo: '1.1.01',
        cuentaNombre: 'Caja y Bancos',
        debe: 0,
        haber: sumaMediosTesoreria
      });
    }
    if (totalRetenciones > 0) {
      renglonesPago.push({
        cuentaCodigo: '2.1.02',
        cuentaNombre: 'Cargas Fiscales, Retenciones Practicadas a Proveedor (ARCA/IIBB)',
        debe: 0,
        haber: totalRetenciones
      });
    }

    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: hoy,
        concepto: `Orden de Pago ${nroOp} (${resumenMediosPago}) - ${proveedor.razonSocial}`,
        tipoOrigen: 'Tesorería',
        renglones: renglonesPago,
        totalDebe: montoTotalCancelado,
        totalHaber: montoTotalCancelado
      },
      'PAG'
    );
  };

  // ==========================================
  // 3. TESORERÍA
  // ==========================================
  const crearCuentaBancaria = async (params: {
    nombre: string;
    banco: string;
    tipoCuenta: CuentaBancaria['tipoCuenta'];
    moneda?: 'ARS' | 'USD';
    cbu?: string;
    saldoInicial: number;
  }) => {
    const nueva: CuentaBancaria = {
      id: `CTA-0${cuentasBancarias.length + 1}-${Date.now().toString().slice(-2)}`,
      nombre: params.nombre,
      banco: params.banco,
      tipoCuenta: params.tipoCuenta,
      moneda: params.moneda || 'ARS',
      cbu: params.cbu,
      saldoActual: params.saldoInicial,
      saldoConciliado: params.saldoInicial,
      conectarDisponible: params.tipoCuenta === 'Cuenta Corriente',
      movimientos: []
    };

    setCuentasBancarias((prev) => [...prev, nueva]);

    await supabase.from('erp_cuentas_bancarias').upsert({
      id: nueva.id,
      nombre: nueva.nombre,
      banco: nueva.banco,
      tipo_cuenta: nueva.tipoCuenta,
      moneda: nueva.moneda,
      cbu: nueva.cbu || null,
      saldo_actual: nueva.saldoActual,
      saldo_conciliado: nueva.saldoConciliado,
      conectar_disponible: !!nueva.conectarDisponible,
      movimientos: nueva.movimientos
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
    return nueva;
  };

  const editarCuentaBancaria = async (id: string, cambios: Partial<CuentaBancaria>) => {
    const cuenta = cuentasBancarias.find((c) => c.id === id);
    if (!cuenta) return;
    const actualizada = { ...cuenta, ...cambios };
    setCuentasBancarias((prev) => prev.map((c) => (c.id === id ? actualizada : c)));

    await supabase.from('erp_cuentas_bancarias').upsert({
      id: actualizada.id,
      nombre: actualizada.nombre,
      banco: actualizada.banco,
      tipo_cuenta: actualizada.tipoCuenta,
      moneda: actualizada.moneda,
      cbu: actualizada.cbu || null,
      saldo_actual: actualizada.saldoActual,
      saldo_conciliado: actualizada.saldoConciliado,
      conectar_disponible: !!actualizada.conectarDisponible,
      movimientos: actualizada.movimientos || [],
      updated_at: new Date().toISOString()
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  const conciliarCuentaBancaria = async (id: string) => {
    const cuenta = cuentasBancarias.find((c) => c.id === id);
    if (!cuenta) return;
    const hoy = new Date().toISOString().split('T')[0];
    const movsConc = (cuenta.movimientos || []).map((m) => ({
      ...m,
      conciliado: true,
      conciliadoFecha: m.conciliadoFecha || hoy
    }));
    await editarCuentaBancaria(id, { saldoConciliado: cuenta.saldoActual, movimientos: movsConc });
  };

  const conciliarMovimientosCuenta = async (cuentaId: string, movimientoIds: string[]) => {
    const cuenta = cuentasBancarias.find((c) => c.id === cuentaId);
    if (!cuenta) return;
    const hoy = new Date().toISOString().split('T')[0];
    const idSet = new Set(movimientoIds);
    const movsActualizados = (cuenta.movimientos || []).map((m) =>
      idSet.has(m.id) ? { ...m, conciliado: true, conciliadoFecha: hoy } : m
    );
    const saldoConciliado = Number(
      movsActualizados
        .filter((m) => m.conciliado)
        .reduce((acc, m) => acc + (m.ingresos || 0) - (m.egresos || 0), 0)
        .toFixed(2)
    );
    await editarCuentaBancaria(cuentaId, {
      movimientos: movsActualizados,
      saldoConciliado
    });
  };

  const emitirNotaCreditoDebitoCliente = async (params: {
    clienteId: string;
    tipo: 'Nota de Crédito A' | 'Nota de Crédito B' | 'Nota de Débito';
    facturaAsociadaId?: string;
    netoGravado: number;
    iva21?: number;
    descripcion: string;
    reingresarStockItems?: { articuloId: string; cantidad: number }[];
  }) => {
    const cliente = clientes.find((c) => c.id === params.clienteId);
    if (!cliente) return;

    const esNc = params.tipo.startsWith('Nota de Crédito');
    const hoy = new Date().toISOString().split('T')[0];
    const ptoVta = '0001';
    const nextNum = String(415 + facturasVenta.length).padStart(8, '0');
    const nroComprobante = `${ptoVta}-${nextNum}`;
    const neto = Number(params.netoGravado.toFixed(2));
    const iva21 = params.iva21 !== undefined ? Number(params.iva21.toFixed(2)) : Number((neto * 0.21).toFixed(2));
    const total = Number((neto + iva21).toFixed(2));

    const facAsociada = params.facturaAsociadaId
      ? cliente.facturasAdeudadas.find((f) => f.id === params.facturaAsociadaId)
      : undefined;

    // Reingresar stock si es Nota de Crédito con devolución de mercadería
    if (esNc && params.reingresarStockItems && params.reingresarStockItems.length > 0) {
      for (const item of params.reingresarStockItems) {
        if (item.articuloId && item.cantidad > 0) {
          await registrarMovimientoStock({
            articuloId: item.articuloId,
            tipoDoc: 'NC',
            cantidad: item.cantidad,
            descripcion: `Devolución s/ ${params.tipo} ${nroComprobante}`
          });
        }
      }
    }

    let nuevoSaldoCliente = cliente.saldo;
    let nuevasAdeudadas = [...cliente.facturasAdeudadas];

    if (esNc) {
      nuevoSaldoCliente = Number(Math.max(0, cliente.saldo - total).toFixed(2));
      if (facAsociada) {
        nuevasAdeudadas = nuevasAdeudadas
          .map((f) => {
            if (f.id !== facAsociada.id) return f;
            const aplicado = Math.min(f.saldo, total);
            const saldoRestante = Number((f.saldo - aplicado).toFixed(2));
            return {
              ...f,
              cobrado: Number((f.cobrado + aplicado).toFixed(2)),
              saldo: saldoRestante
            };
          })
          .filter((f) => f.saldo > 0.01);
      }
    } else {
      nuevoSaldoCliente = Number((cliente.saldo + total).toFixed(2));
      nuevasAdeudadas = [
        {
          id: `ND-ADE-${Date.now()}`,
          nroComprobante,
          tipo: params.tipo,
          fechaEmision: hoy,
          fechaPago: hoy,
          descripcion: params.descripcion || `Nota de Débito s/ ${facAsociada?.nroComprobante || 'Cta Cte'}`,
          valorMe: 0,
          total,
          cobrado: 0,
          saldo: total,
          saldoAcumulado: nuevoSaldoCliente,
          comprobanteAsociadoId: facAsociada?.id,
          comprobanteAsociadoNro: facAsociada?.nroComprobante
        },
        ...nuevasAdeudadas
      ];
    }

    const clienteActualizado: Cliente = {
      ...cliente,
      saldo: nuevoSaldoCliente,
      facturasAdeudadas: nuevasAdeudadas,
      movimientos: [
        ...cliente.movimientos,
        {
          id: `MOV-NCND-${Date.now()}`,
          fecha: hoy,
          comprobante: `${params.tipo} ${nroComprobante}`,
          concepto: `${params.descripcion}${facAsociada ? ` (Asoc. ${facAsociada.nroComprobante})` : ''}`,
          debe: esNc ? 0 : total,
          haber: esNc ? total : 0,
          saldo: nuevoSaldoCliente
        }
      ]
    };

    const nuevoCompVenta: ComprobanteVenta = {
      id: `ZON-NCND-${Date.now()}`,
      tipo: params.tipo,
      puntoVenta: ptoVta,
      numero: nextNum,
      fechaEmision: hoy,
      fechaVencimiento: hoy,
      clienteNombre: cliente.razonSocial,
      clienteCuit: cliente.cuit,
      condicionIva: cliente.condicionIva,
      netoGravado: neto,
      iva21,
      iva105: 0,
      total,
      estado: 'Aprobado AFIP',
      cae: `744${Math.floor(10000000000 + Math.random() * 89999999999)}`,
      comprobanteAsociadoId: facAsociada?.id,
      comprobanteAsociadoNro: facAsociada?.nroComprobante
    };

    setClientes((prev) => prev.map((c) => (c.id === cliente.id ? clienteActualizado : c)));
    setFacturasVenta((prev) => [nuevoCompVenta, ...prev]);

    const asNro = asientosContables.length + 1;
    const asientoNcNd: AsientoContable = {
      numero: asNro,
      fecha: hoy,
      concepto: `${params.tipo} ${nroComprobante} - ${cliente.razonSocial}`,
      tipoOrigen: 'Ventas',
      totalDebe: total,
      totalHaber: total,
      renglones: esNc
        ? [
            { cuentaCodigo: '411101', cuentaNombre: '411101 - Ventas (Reversión NC)', debe: neto, haber: 0 },
            { cuentaCodigo: '214101', cuentaNombre: '214101 - IVA Débito Fiscal (Reversión NC)', debe: iva21, haber: 0 },
            { cuentaCodigo: '113100', cuentaNombre: '113100 - Deudores Por Ventas', debe: 0, haber: total }
          ]
        : [
            { cuentaCodigo: '113100', cuentaNombre: '113100 - Deudores Por Ventas', debe: total, haber: 0 },
            { cuentaCodigo: '411101', cuentaNombre: '411101 - Ventas / Intereses ND', debe: 0, haber: neto },
            { cuentaCodigo: '214101', cuentaNombre: '214101 - IVA Débito Fiscal', debe: 0, haber: iva21 }
          ]
    };

    setAsientosContables((prev) => [asientoNcNd, ...prev]);
    await supabase.from('erp_clientes').upsert({
      id: clienteActualizado.id,
      nombre: clienteActualizado.nombre,
      razon_social: clienteActualizado.razonSocial,
      cuit: clienteActualizado.cuit,
      condicion_iva: clienteActualizado.condicionIva,
      domicilio: clienteActualizado.domicilio,
      telefono: clienteActualizado.telefono,
      email: clienteActualizado.email,
      saldo: clienteActualizado.saldo,
      activo: clienteActualizado.activo,
      lista_precios: clienteActualizado.listaPrecios,
      limite_credito: clienteActualizado.limiteCredito,
      vendedor: clienteActualizado.vendedor,
      facturas_adeudadas: clienteActualizado.facturasAdeudadas,
      movimientos: clienteActualizado.movimientos,
      updated_at: new Date().toISOString()
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  const emitirNotaCreditoDebitoProveedor = async (params: {
    proveedorId: string;
    tipo: 'Nota de Crédito A' | 'Nota de Crédito B' | 'Nota de Débito';
    facturaAsociadaId?: string;
    netoGravado: number;
    descripcion: string;
  }) => {
    const proveedor = proveedores.find((p) => p.id === params.proveedorId);
    if (!proveedor) return;

    const esNc = params.tipo.startsWith('Nota de Crédito');
    const hoy = new Date().toISOString().split('T')[0];
    const nroFact = `0001-000${Math.floor(10000 + Math.random() * 89999)}`;
    const neto = Number(params.netoGravado.toFixed(2));
    const iva = Number((neto * 0.21).toFixed(2));
    const total = Number((neto + iva).toFixed(2));

    const facAsociada = params.facturaAsociadaId
      ? proveedor.facturasAdeudadas.find((f) => f.id === params.facturaAsociadaId)
      : undefined;

    let nuevoSaldoProv = proveedor.saldo;
    let nuevasAdeudadas = [...proveedor.facturasAdeudadas];

    if (esNc) {
      nuevoSaldoProv = Number(Math.max(0, proveedor.saldo - total).toFixed(2));
      if (facAsociada) {
        nuevasAdeudadas = nuevasAdeudadas
          .map((f) => {
            if (f.id !== facAsociada.id) return f;
            const aplicado = Math.min(f.saldo, total);
            return {
              ...f,
              pagado: Number((f.pagado + aplicado).toFixed(2)),
              saldo: Number((f.saldo - aplicado).toFixed(2))
            };
          })
          .filter((f) => f.saldo > 0.01);
      }
    } else {
      nuevoSaldoProv = Number((proveedor.saldo + total).toFixed(2));
      nuevasAdeudadas = [
        {
          id: `FP-ND-${Date.now()}`,
          nroComprobante: nroFact,
          tipo: params.tipo,
          fechaEmision: hoy,
          fechaPago: hoy,
          descripcion: params.descripcion || 'Nota de Débito Proveedor',
          valorMe: 0,
          total,
          pagado: 0,
          saldo: total,
          saldoAcumulado: nuevoSaldoProv
        },
        ...nuevasAdeudadas
      ];
    }

    const provActualizado: Proveedor = {
      ...proveedor,
      saldo: nuevoSaldoProv,
      facturasAdeudadas: nuevasAdeudadas,
      movimientos: [
        ...proveedor.movimientos,
        {
          id: `MOV-P-NCND-${Date.now()}`,
          fecha: hoy,
          comprobante: `${params.tipo} ${nroFact}`,
          concepto: `${params.descripcion}${facAsociada ? ` (Asoc. ${facAsociada.nroComprobante})` : ''}`,
          debe: esNc ? total : 0,
          haber: esNc ? 0 : total,
          saldo: nuevoSaldoProv
        }
      ]
    };

    const nuevaFc: ComprobanteCompra = {
      id: `FC-NCND-${Date.now()}`,
      tipo: params.tipo,
      numero: nroFact,
      proveedorNombre: proveedor.razonSocial,
      proveedorCuit: proveedor.cuit,
      fechaComprobante: hoy,
      fechaImputacion: hoy,
      cuentaGasto: proveedor.cuentaGastoHabitual || '511101 - Compras / Gastos',
      netoGravado: neto,
      iva,
      retencionIva: 0,
      retencionIIBB: 0,
      total,
      estadoPago: esNc ? 'Pagado Total' : 'Pendiente',
      comprobanteAsociadoId: facAsociada?.id,
      comprobanteAsociadoNro: facAsociada?.nroComprobante
    };

    setProveedores((prev) => prev.map((p) => (p.id === proveedor.id ? provActualizado : p)));
    setFacturasCompra((prev) => [nuevaFc, ...prev]);

    const asNro = asientosContables.length + 1;
    const asientoProv: AsientoContable = {
      numero: asNro,
      fecha: hoy,
      concepto: `${params.tipo} ${nroFact} - ${proveedor.razonSocial}`,
      tipoOrigen: 'Compras',
      totalDebe: total,
      totalHaber: total,
      renglones: esNc
        ? [
            { cuentaCodigo: '211100', cuentaNombre: '211100 - Proveedores en Cta Cte', debe: total, haber: 0 },
            { cuentaCodigo: '511101', cuentaNombre: '511101 - Compras (Reversión NC)', debe: 0, haber: neto },
            { cuentaCodigo: '114102', cuentaNombre: '114102 - IVA Crédito Fiscal (Reversión NC)', debe: 0, haber: iva }
          ]
        : [
            { cuentaCodigo: '511101', cuentaNombre: '511101 - Gastos / Intereses ND', debe: neto, haber: 0 },
            { cuentaCodigo: '114102', cuentaNombre: '114102 - IVA Crédito Fiscal', debe: iva, haber: 0 },
            { cuentaCodigo: '211100', cuentaNombre: '211100 - Proveedores en Cta Cte', debe: 0, haber: total }
          ]
    };

    setAsientosContables((prev) => [asientoProv, ...prev]);
    await supabase.from('erp_proveedores').upsert({
      id: provActualizado.id,
      nombre: provActualizado.nombre,
      razon_social: provActualizado.razonSocial,
      cuit: provActualizado.cuit,
      condicion_iva: provActualizado.condicionIva,
      domicilio: provActualizado.domicilio,
      telefono: provActualizado.telefono,
      email: provActualizado.email,
      saldo: provActualizado.saldo,
      activo: provActualizado.activo,
      cuenta_gasto_habitual: provActualizado.cuentaGastoHabitual,
      condicion_pago: provActualizado.condicionPago,
      facturas_adeudadas: provActualizado.facturasAdeudadas,
      movimientos: provActualizado.movimientos,
      updated_at: new Date().toISOString()
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  const registrarMovimientoTesoreria = async (params: {
    cuentaId: string;
    tipo: string;
    clienteProveedor: string;
    descripcion: string;
    ingresos: number;
    egresos: number;
    nroCheque?: string;
  }) => {
    const cuenta = cuentasBancarias.find((c) => c.id === params.cuentaId) || cuentasBancarias[0];
    if (!cuenta) return;

    const nuevoSaldo = Number((cuenta.saldoActual + params.ingresos - params.egresos).toFixed(2));
    const fechaStr = new Date().toISOString().split('T')[0].split('-').reverse().join('/');
    const nuevoMov: MovimientoTesoreria = {
      id: `MOV-T${Date.now()}`,
      fecha: fechaStr,
      clienteProveedor: params.clienteProveedor,
      tipo: params.tipo,
      nro: `0001-00000${Math.floor(100 + Math.random() * 899)}`,
      nroCheque: params.nroCheque || '',
      descripcion: params.descripcion,
      ingresos: params.ingresos,
      egresos: params.egresos,
      saldo: nuevoSaldo
    };

    const actualizada: CuentaBancaria = {
      ...cuenta,
      saldoActual: nuevoSaldo,
      movimientos: [nuevoMov, ...(cuenta.movimientos || [])]
    };

    setCuentasBancarias((prev) => prev.map((c) => (c.id === cuenta.id ? actualizada : c)));

    await supabase.from('erp_cuentas_bancarias').upsert({
      id: actualizada.id,
      nombre: actualizada.nombre,
      banco: actualizada.banco,
      tipo_cuenta: actualizada.tipoCuenta,
      moneda: actualizada.moneda,
      cbu: actualizada.cbu || null,
      saldo_actual: actualizada.saldoActual,
      saldo_conciliado: actualizada.saldoConciliado,
      conectar_disponible: !!actualizada.conectarDisponible,
      movimientos: actualizada.movimientos,
      updated_at: new Date().toISOString()
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  const depositarCheque = async (chequeId: string, cuentaDestinoId?: string) => {
    const cheque = cheques.find((c) => c.id === chequeId);
    if (!cheque || cheque.estado === 'Depositado') return;

    const targetCuenta =
      cuentasBancarias.find((c) => c.id === cuentaDestinoId) ||
      cuentasBancarias.find((c) => c.tipoCuenta === 'Cuenta Corriente') ||
      cuentasBancarias[0];

    const chequeActualizado: Cheque = {
      ...cheque,
      estado: 'Depositado'
    };

    setCheques((prev) => prev.map((c) => (c.id === chequeId ? chequeActualizado : c)));

    await supabase.from('erp_cheques').upsert({
      id: chequeActualizado.id,
      tipo: chequeActualizado.tipo,
      numero: chequeActualizado.numero,
      banco_emisor: chequeActualizado.bancoEmisor,
      librador: chequeActualizado.librador,
      cuit_librador: chequeActualizado.cuitLibrador,
      fecha_emision: chequeActualizado.fechaEmision,
      fecha_pago: chequeActualizado.fechaPago,
      importe: chequeActualizado.importe,
      estado: chequeActualizado.estado,
      updated_at: new Date().toISOString()
    });

    if (targetCuenta) {
      await registrarMovimientoTesoreria({
        cuentaId: targetCuenta.id,
        tipo: 'DEP',
        clienteProveedor: cheque.librador,
        descripcion: `Depósito Cheque #${cheque.numero} (${cheque.bancoEmisor})`,
        ingresos: cheque.importe,
        egresos: 0,
        nroCheque: cheque.numero
      });
    }

    const hoy = new Date().toISOString().split('T')[0];
    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4100;

    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: hoy,
        concepto: `Depósito Bancario Cheque #${cheque.numero} - ${cheque.librador}`,
        tipoOrigen: 'Tesorería',
        renglones: [
          {
            cuentaCodigo: '1.1.01',
            cuentaNombre: targetCuenta ? targetCuenta.nombre : 'Caja y Bancos',
            debe: cheque.importe,
            haber: 0
          },
          {
            cuentaCodigo: '1.1.01.03',
            cuentaNombre: 'Valores a Depositar (Cartera)',
            debe: 0,
            haber: cheque.importe
          }
        ],
        totalDebe: cheque.importe,
        totalHaber: cheque.importe
      },
      'DEP'
    );
  };

  // ==========================================
  // 4. CONTABILIDAD
  // ==========================================
  const actualizarCuentaContable = async (codigo: string, cambios: Partial<CuentaContable>) => {
    const nuevoPlan = updatePlanCuentasTree(planDeCuentas, codigo, (c) => ({
      ...c,
      ...cambios
    }));
    setPlanDeCuentas(nuevoPlan);

    await supabase.from('erp_plan_cuentas').upsert({
      id: 'DEFAULT',
      nodos: nuevoPlan,
      updated_at: new Date().toISOString()
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  const agregarCuentaContable = async (padreCodigo: string, nuevaCuenta: CuentaContable) => {
    const nuevoPlan = updatePlanCuentasTree(planDeCuentas, padreCodigo, (padre) => ({
      ...padre,
      hijos: [...(padre.hijos || []), nuevaCuenta]
    }));
    setPlanDeCuentas(nuevoPlan);

    await supabase.from('erp_plan_cuentas').upsert({
      id: 'DEFAULT',
      nodos: nuevoPlan,
      updated_at: new Date().toISOString()
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  const registrarAsientoManual = async (params: {
    fecha: string;
    concepto: string;
    cuentaDebeCodigo: string;
    cuentaHaberCodigo: string;
    monto: number;
    tipoOrigen?: AsientoContable['tipoOrigen'];
  }) => {
    const cuentaDebe = findCuentaInTree(planDeCuentas, params.cuentaDebeCodigo);
    const cuentaHaber = findCuentaInTree(planDeCuentas, params.cuentaHaberCodigo);

    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4097;

    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: params.fecha,
        concepto: params.concepto,
        tipoOrigen: params.tipoOrigen || 'Manual',
        renglones: [
          {
            cuentaCodigo: params.cuentaDebeCodigo,
            cuentaNombre: cuentaDebe?.nombre || 'Cuenta Deudora',
            debe: params.monto,
            haber: 0
          },
          {
            cuentaCodigo: params.cuentaHaberCodigo,
            cuentaNombre: cuentaHaber?.nombre || 'Cuenta Acreedora',
            debe: 0,
            haber: params.monto
          }
        ],
        totalDebe: params.monto,
        totalHaber: params.monto
      },
      'MAN'
    );
  };

  // ==========================================
  // 5. INVENTARIO
  // ==========================================
  const crearArticuloInventario = async (params: {
    codigo: string;
    descripcion: string;
    tipo: string;
    um: string;
    categoria?: string;
    precioVentaNeto: number;
    costoCalculado: number;
    stockInicial: number;
    deposito?: string;
    proveedorId?: string;
    proveedorNombre?: string;
    proveedorCuit?: string;
    facturaId?: string;
    facturaNro?: string;
  }) => {
    const hoy = new Date().toISOString().split('T')[0];
    const prvRef = proveedores.find((p) => p.id === params.proveedorId) || proveedores[0];
    const nombrePrv = params.proveedorNombre || prvRef?.razonSocial || 'ALEJANDRO MIGUEL LUL...';
    const cuitPrv = params.proveedorCuit || prvRef?.cuit || '20-24891230-4';
    const idPrv = params.proveedorId || prvRef?.id || 'PRV-01';
    const facNro = params.facturaNro || 'Factura A 0001-00004120';
    const facId = params.facturaId || `FP-${Date.now()}`;

    const nuevo: ArticuloInventario = {
      id: `INV-${Date.now()}`,
      codigo: params.codigo || `00000${inventario.length + 1}`,
      sku: params.codigo || `00000${inventario.length + 1}`,
      descripcion: params.descripcion.toUpperCase(),
      tipo: params.tipo,
      um: params.um,
      categoria: params.categoria || 'Materiales Generales',
      unidadMedida: params.um === '1' ? 'Unidad' : params.um,
      disponible: params.stockInicial,
      stockActual: params.stockInicial,
      stockMinimo: 1,
      costoCalculado: params.costoCalculado,
      precioVentaNeto: params.precioVentaNeto,
      alicuotaIva: 21,
      deposito: params.deposito || 'Depósito Central San Juan',
      movimientos:
        params.stockInicial > 0
          ? [
              {
                id: `MOV-INV-${Date.now()}`,
                fecha: hoy,
                deposito: params.deposito || 'Depósito Central',
                descripcion: `Ingreso por ${facNro} — ${nombrePrv}`,
                tipoDoc: 'FAC',
                precio: params.costoCalculado,
                cantidad: params.stockInicial,
                proveedorId: idPrv,
                proveedorNombre: nombrePrv,
                proveedorCuit: cuitPrv,
                facturaId: facId,
                facturaNro: facNro
              }
            ]
          : []
    };

    setInventario((prev) => [...prev, nuevo]);

    await supabase.from('erp_inventario').upsert({
      id: nuevo.id,
      codigo: nuevo.codigo,
      sku: nuevo.sku,
      descripcion: nuevo.descripcion,
      tipo: nuevo.tipo,
      um: nuevo.um,
      categoria: nuevo.categoria,
      unidad_medida: nuevo.unidadMedida,
      disponible: nuevo.disponible,
      stock_actual: nuevo.stockActual,
      stock_minimo: nuevo.stockMinimo,
      costo_calculado: nuevo.costoCalculado,
      precio_venta_neto: nuevo.precioVentaNeto,
      alicuota_iva: nuevo.alicuotaIva,
      deposito: nuevo.deposito,
      movimientos: nuevo.movimientos
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
    return nuevo;
  };

  const actualizarPreciosInventario = async (porcentajeVariacion: number) => {
    const factor = 1 + porcentajeVariacion / 100;
    const actualizado = inventario.map((a) => ({
      ...a,
      precioVentaNeto: Number((a.precioVentaNeto * factor).toFixed(2)),
      costoCalculado: Number((a.costoCalculado * factor).toFixed(2))
    }));
    setInventario(actualizado);

    await supabase.from('erp_inventario').upsert(
      actualizado.map((i) => ({
        id: i.id,
        codigo: i.codigo,
        sku: i.sku,
        descripcion: i.descripcion,
        tipo: i.tipo,
        um: i.um,
        categoria: i.categoria,
        unidad_medida: i.unidadMedida,
        disponible: i.disponible,
        stock_actual: i.stockActual,
        stock_minimo: i.stockMinimo,
        costo_calculado: i.costoCalculado,
        precio_venta_neto: i.precioVentaNeto,
        alicuota_iva: i.alicuotaIva,
        deposito: i.deposito,
        movimientos: i.movimientos || [],
        updated_at: new Date().toISOString()
      }))
    );
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  const registrarMovimientoStock = async (params: {
    articuloId: string;
    tipoDoc: string;
    descripcion: string;
    cantidad: number;
    precio?: number;
    deposito?: string;
    proveedorId?: string;
    proveedorNombre?: string;
    proveedorCuit?: string;
    facturaId?: string;
    facturaNro?: string;
    destinoEgreso?: string;
    comprobanteEgreso?: string;
  }) => {
    const art = inventario.find((a) => a.id === params.articuloId);
    if (!art) return;

    const hoy = new Date().toISOString().split('T')[0];
    const nuevoDisponible = Number((art.disponible + params.cantidad).toFixed(2));
    const precioFinal = params.precio && params.precio > 0 ? Number(params.precio) : art.costoCalculado;

    const nuevoMov = {
      id: `MOV-INV-${Date.now()}`,
      fecha: hoy,
      deposito: params.deposito || 'Depósito Central',
      descripcion: params.descripcion,
      tipoDoc: params.cantidad > 0 ? 'FAC' : params.tipoDoc,
      precio: precioFinal,
      cantidad: params.cantidad,
      proveedorId: params.proveedorId,
      proveedorNombre: params.proveedorNombre,
      proveedorCuit: params.proveedorCuit,
      facturaId: params.facturaId,
      facturaNro: params.facturaNro,
      destinoEgreso: params.destinoEgreso,
      comprobanteEgreso: params.comprobanteEgreso
    };

    const nuevoCosto = params.cantidad > 0 && params.precio && params.precio > 0 ? Number(params.precio) : art.costoCalculado;
    const margenPrevio = art.costoCalculado > 0 ? art.precioVentaNeto / art.costoCalculado : 1;
    const nuevoPrecioVenta =
      params.cantidad > 0 && params.precio && params.precio > 0
        ? Number((nuevoCosto * Math.max(1, margenPrevio)).toFixed(2))
        : art.precioVentaNeto;

    const actualizado: ArticuloInventario = {
      ...art,
      disponible: nuevoDisponible,
      stockActual: nuevoDisponible,
      costoCalculado: nuevoCosto,
      precioVentaNeto: nuevoPrecioVenta,
      movimientos: [nuevoMov, ...(art.movimientos || [])]
    };

    setInventario((prev) => prev.map((a) => (a.id === art.id ? actualizado : a)));

    await supabase.from('erp_inventario').upsert({
      id: actualizado.id,
      codigo: actualizado.codigo,
      sku: actualizado.sku,
      descripcion: actualizado.descripcion,
      tipo: actualizado.tipo,
      um: actualizado.um,
      categoria: actualizado.categoria,
      unidad_medida: actualizado.unidadMedida,
      disponible: actualizado.disponible,
      stock_actual: actualizado.stockActual,
      stock_minimo: actualizado.stockMinimo,
      costo_calculado: actualizado.costoCalculado,
      precio_venta_neto: actualizado.precioVentaNeto,
      alicuota_iva: actualizado.alicuotaIva,
      deposito: actualizado.deposito,
      movimientos: actualizado.movimientos,
      updated_at: new Date().toISOString()
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  // ==========================================
  // 6. SUELDOS Y CARGAS SOCIALES
  // ==========================================
  const crearEmpleadoLegajo = async (params: {
    nombreCompleto: string;
    cuil: string;
    cct: ConvenioColectivo;
    categoria: string;
    sueldoBasico: number;
    banco?: string;
    conceptosLiquidacion?: EmpleadoLegajo['conceptosLiquidacion'];
  }) => {
    const nuevoLegajoNum = String(100 + empleados.length + 1);
    const adicionalPresentismo =
      params.cct.includes('UOCRA')
        ? params.sueldoBasico * 0.2
        : params.cct.includes('Comercio')
        ? Number((params.sueldoBasico * 0.0833).toFixed(2))
        : params.sueldoBasico * 0.15;

    const totalRem = params.sueldoBasico + adicionalPresentismo;
    const jubilacion = Number((totalRem * 0.11).toFixed(2));
    const pami = Number((totalRem * 0.03).toFixed(2));
    const obraSocial = Number((totalRem * 0.03).toFixed(2));
    const sindicato = Number((totalRem * 0.02).toFixed(2));

    const nuevo: EmpleadoLegajo = {
      id: `EMP-${nuevoLegajoNum}-${Date.now().toString().slice(-2)}`,
      legajo: nuevoLegajoNum,
      cuil: params.cuil,
      nombreCompleto: params.nombreCompleto.toUpperCase(),
      cct: params.cct,
      categoria: params.categoria || 'Operario Calificado',
      fechaIngreso: new Date().toLocaleDateString('es-AR'),
      antiguedadAnios: 1,
      banco: params.banco || 'Banco Santander Río',
      cbu: '07201123400000' + Math.floor(10000000 + Math.random() * 90000000),
      modalidadContratacion: 'Tiempo Indeterminado',
      sueldoBasico: params.sueldoBasico,
      activo: true,
      conceptosLiquidacion: params.conceptosLiquidacion || [
        {
          codigo: '100',
          codigoAfipLsd: '110000',
          descripcion: 'SUELDO BÁSICO DE CONVENIO',
          unidades: '30 días',
          tipo: 'Remunerativo',
          remunerativo: params.sueldoBasico,
          noRemunerativo: 0,
          descuento: 0
        },
        {
          codigo: '240',
          codigoAfipLsd: '130000',
          descripcion: 'ADICIONAL PRESENTISMO / OBJETIVOS',
          unidades: 'Convenio',
          tipo: 'Remunerativo',
          remunerativo: adicionalPresentismo,
          noRemunerativo: 0,
          descuento: 0
        },
        {
          codigo: '20000',
          codigoAfipLsd: '810000',
          descripcion: 'JUBILACIÓN 11% (SIPA LEY 24.241)',
          unidades: '11%',
          tipo: 'Descuento',
          remunerativo: 0,
          noRemunerativo: 0,
          descuento: jubilacion
        },
        {
          codigo: '20001',
          codigoAfipLsd: '810001',
          descripcion: 'LEY 19.032 3% (INSSJyP)',
          unidades: '3%',
          tipo: 'Descuento',
          remunerativo: 0,
          noRemunerativo: 0,
          descuento: pami
        },
        {
          codigo: '20002',
          codigoAfipLsd: '810002',
          descripcion: 'OBRA SOCIAL 3%',
          unidades: '3%',
          tipo: 'Descuento',
          remunerativo: 0,
          noRemunerativo: 0,
          descuento: obraSocial
        },
        {
          codigo: '20004',
          codigoAfipLsd: '820000',
          descripcion: 'APORTE SOLIDARIO / SINDICAL CCT',
          unidades: '2%',
          tipo: 'Descuento',
          remunerativo: 0,
          noRemunerativo: 0,
          descuento: sindicato
        }
      ]
    };

    const nuevaNomina = [...empleados, nuevo];
    setEmpleados(nuevaNomina);

    // Recalcular totales de la liquidación actual
    const totBruto = nuevaNomina.reduce(
      (acc, e) => acc + e.conceptosLiquidacion.reduce((s, c) => s + c.remunerativo + c.noRemunerativo, 0),
      0
    );
    const totRet = nuevaNomina.reduce(
      (acc, e) => acc + e.conceptosLiquidacion.reduce((s, c) => s + c.descuento, 0),
      0
    );
    const nuevaLiq: LiquidacionPeriodo = {
      ...liquidacionActual,
      totalBruto: Number(totBruto.toFixed(2)),
      totalRetenciones: Number(totRet.toFixed(2)),
      totalNeto: Number((totBruto - totRet).toFixed(2)),
      totalContribucionesPatronales: Number((totBruto * 0.24).toFixed(2)),
      empleadosCount: nuevaNomina.length
    };
    setLiquidacionActual(nuevaLiq);

    await Promise.all([
      supabase.from('erp_empleados').upsert({
        id: nuevo.id,
        legajo: nuevo.legajo,
        cuil: nuevo.cuil,
        nombre_completo: nuevo.nombreCompleto,
        cct: nuevo.cct,
        categoria: nuevo.categoria,
        fecha_ingreso: nuevo.fechaIngreso,
        antiguedad_anios: nuevo.antiguedadAnios,
        banco: nuevo.banco,
        cbu: nuevo.cbu,
        modalidad_contratacion: nuevo.modalidadContratacion,
        sueldo_basico: nuevo.sueldoBasico,
        activo: nuevo.activo,
        conceptos_liquidacion: nuevo.conceptosLiquidacion
      }),
      supabase.from('erp_liquidaciones').upsert({
        id: 'ACTUAL',
        periodo: nuevaLiq.periodo,
        tipo_liquidacion: nuevaLiq.tipoLiquidacion,
        numero_liquidacion: nuevaLiq.numeroLiquidacion,
        fecha_pago: nuevaLiq.fechaPago,
        total_bruto: nuevaLiq.totalBruto,
        total_retenciones: nuevaLiq.totalRetenciones,
        total_neto: nuevaLiq.totalNeto,
        total_contribuciones_patronales: nuevaLiq.totalContribucionesPatronales,
        empleados_count: nuevaLiq.empleadosCount,
        updated_at: new Date().toISOString()
      })
    ]);
    setLastSync(new Date().toLocaleTimeString('es-AR'));
    return nuevo;
  };

  const actualizarEmpleadoLegajo = async (
    empleadoId: string,
    cambios: Partial<EmpleadoLegajo>
  ) => {
    const actual = empleados.find((e) => e.id === empleadoId);
    if (!actual) return;

    const actualizado: EmpleadoLegajo = {
      ...actual,
      ...cambios
    };

    const nuevaNomina = empleados.map((e) => (e.id === empleadoId ? actualizado : e));
    setEmpleados(nuevaNomina);

    const totBruto = nuevaNomina.reduce(
      (acc, e) => acc + e.conceptosLiquidacion.reduce((s, c) => s + (c.remunerativo || 0) + (c.noRemunerativo || 0), 0),
      0
    );
    const totRet = nuevaNomina.reduce(
      (acc, e) => acc + e.conceptosLiquidacion.reduce((s, c) => s + (c.descuento || 0), 0),
      0
    );
    const nuevaLiq: LiquidacionPeriodo = {
      ...liquidacionActual,
      totalBruto: Number(totBruto.toFixed(2)),
      totalRetenciones: Number(totRet.toFixed(2)),
      totalNeto: Number((totBruto - totRet).toFixed(2)),
      totalContribucionesPatronales: Number((Math.max(0, totBruto) * 0.24).toFixed(2)),
      empleadosCount: nuevaNomina.length
    };
    setLiquidacionActual(nuevaLiq);

    try {
      await Promise.all([
        supabase.from('erp_empleados').upsert({
          id: actualizado.id,
          legajo: actualizado.legajo,
          cuil: actualizado.cuil,
          nombre_completo: actualizado.nombreCompleto,
          cct: actualizado.cct,
          categoria: actualizado.categoria,
          fecha_ingreso: actualizado.fechaIngreso,
          antiguedad_anios: actualizado.antiguedadAnios,
          banco: actualizado.banco,
          cbu: actualizado.cbu,
          modalidad_contratacion: actualizado.modalidadContratacion,
          sueldo_basico: actualizado.sueldoBasico,
          activo: actualizado.activo,
          conceptos_liquidacion: actualizado.conceptosLiquidacion
        }),
        supabase.from('erp_liquidaciones').upsert({
          id: 'ACTUAL',
          periodo: nuevaLiq.periodo,
          tipo_liquidacion: nuevaLiq.tipoLiquidacion,
          numero_liquidacion: nuevaLiq.numeroLiquidacion,
          fecha_pago: nuevaLiq.fechaPago,
          total_bruto: nuevaLiq.totalBruto,
          total_retenciones: nuevaLiq.totalRetenciones,
          total_neto: nuevaLiq.totalNeto,
          total_contribuciones_patronales: nuevaLiq.totalContribucionesPatronales,
          empleados_count: nuevaLiq.empleadosCount,
          updated_at: new Date().toISOString()
        })
      ]);
      setLastSync(new Date().toLocaleTimeString('es-AR'));
    } catch {
      // ignore network error
    }
  };

  const actualizarLiquidacionPeriodo = async (params: {
    periodo: string;
    tipoLiquidacion: LiquidacionPeriodo['tipoLiquidacion'];
    fechaPago: string;
  }) => {
    const totBruto = empleados.reduce(
      (acc, e) => acc + e.conceptosLiquidacion.reduce((s, c) => s + c.remunerativo + c.noRemunerativo, 0),
      0
    );
    const totRet = empleados.reduce(
      (acc, e) => acc + e.conceptosLiquidacion.reduce((s, c) => s + c.descuento, 0),
      0
    );

    const nuevaLiq: LiquidacionPeriodo = {
      periodo: params.periodo,
      tipoLiquidacion: params.tipoLiquidacion,
      numeroLiquidacion: liquidacionActual.numeroLiquidacion + 1,
      fechaPago: params.fechaPago,
      totalBruto: Number(totBruto.toFixed(2)),
      totalRetenciones: Number(totRet.toFixed(2)),
      totalNeto: Number((totBruto - totRet).toFixed(2)),
      totalContribucionesPatronales: Number((totBruto * 0.24).toFixed(2)),
      empleadosCount: empleados.length
    };

    setLiquidacionActual(nuevaLiq);

    await supabase.from('erp_liquidaciones').upsert({
      id: 'ACTUAL',
      periodo: nuevaLiq.periodo,
      tipo_liquidacion: nuevaLiq.tipoLiquidacion,
      numero_liquidacion: nuevaLiq.numeroLiquidacion,
      fecha_pago: nuevaLiq.fechaPago,
      total_bruto: nuevaLiq.totalBruto,
      total_retenciones: nuevaLiq.totalRetenciones,
      total_neto: nuevaLiq.totalNeto,
      total_contribuciones_patronales: nuevaLiq.totalContribucionesPatronales,
      empleados_count: nuevaLiq.empleadosCount,
      updated_at: new Date().toISOString()
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  // ==========================================
  // 7. CONFIGURACIÓN EMPRESA
  // ==========================================
  const guardarConfiguracionEmpresa = async (nuevaEmpresa: EmpresaConfig, extra: EmpresaDatosExtra) => {
    setEmpresa(nuevaEmpresa);
    setEmpresaExtra(extra);

    await supabase.from('erp_empresa').upsert({
      id: 'DEFAULT',
      razon_social: nuevaEmpresa.razonSocial,
      cuit: nuevaEmpresa.cuit,
      domicilio_fiscal: nuevaEmpresa.domicilioFiscal,
      condicion_iva: nuevaEmpresa.condicionIva,
      ingresos_brutos: nuevaEmpresa.ingresosBrutos,
      inicio_actividades: nuevaEmpresa.inicioActividades,
      puntos_venta: nuevaEmpresa.puntosVenta,
      datos_extra: extra,
      updated_at: new Date().toISOString()
    });
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

    return (
      <ErpContext.Provider
        value={{
          dbStatus,
          lastSync,
          eventosSincronizacion,
          registrarEventoSincronizacion,
          forzarSincronizacionOmnicanal,
          refreshAllFromDb,
          activeModule,
        setActiveModule,
        empresa,
        empresaExtra,
        clientes,
        proveedores,
        facturasVenta,
        facturasCompra,
        cuentasBancarias,
        cheques,
        planDeCuentas,
        asientosContables,
        inventario,
        empleados,
        liquidacionActual,
        crearCliente,
        emitirFacturaVenta,
        emitirNotaCreditoDebitoCliente,
        registrarCobroCliente,
        crearProveedor,
        registrarFacturaCompra,
        emitirNotaCreditoDebitoProveedor,
        registrarPagoProveedor,
        crearCuentaBancaria,
        editarCuentaBancaria,
        conciliarCuentaBancaria,
        conciliarMovimientosCuenta,
        depositarCheque,
        registrarMovimientoTesoreria,
        actualizarCuentaContable,
        agregarCuentaContable,
        registrarAsientoManual,
        crearArticuloInventario,
        actualizarPreciosInventario,
        registrarMovimientoStock,
        crearEmpleadoLegajo,
        actualizarEmpleadoLegajo,
        actualizarLiquidacionPeriodo,
        guardarConfiguracionEmpresa,
        tenants,
        activeTenantId,
        activeTenant,
        cambiarTenantActivo,
        crearNuevoTenant,
        actualizarAutorizacionZondaCloud,
        clasificacionesComprasArca,
        pendientesMisComprobantesArca,
        obtenerSnapshotDeTenant,
        actualizarClasificacionFiscalCompraEnTenant,
        incorporarComprobanteMisComprobantesArcaEnTenant,
        registrarComprobanteFiscalDesdeZondaCloud
      }}
    >
      {children}
    </ErpContext.Provider>
  );
};

export function useErp() {
  const ctx = useContext(ErpContext);
  if (!ctx) {
    throw new Error('useErp debe usarse dentro de un ErpProvider');
  }
  return ctx;
}

