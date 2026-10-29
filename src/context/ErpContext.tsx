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

interface ErpContextValue {
  // Estado de Base de Datos Supabase
  dbStatus: 'sincronizando' | 'conectado' | 'error';
  lastSync: string;
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
    netoGravado: number;
    descripcion: string;
  }) => Promise<void>;
  registrarCobroCliente: (params: {
    clienteId: string;
    monto: number;
    medioCobro: string;
    cuentaBancariaId?: string;
    nroCheque?: string;
    bancoCheque?: string;
  }) => Promise<void>;

  // Acciones Proveedores y Compras
  crearProveedor: (nuevo: Omit<Proveedor, 'id' | 'facturasAdeudadas' | 'movimientos' | 'saldo'>) => Promise<Proveedor>;
  registrarFacturaCompra: (params: {
    proveedorId: string;
    tipo: 'Factura A' | 'Factura B' | 'Factura C' | 'Liquidación' | 'Nota de Débito';
    netoGravado: number;
    descripcion: string;
    cuentaGasto?: string;
  }) => Promise<void>;
  registrarPagoProveedor: (params: {
    proveedorId: string;
    monto: number;
    medioPago: string;
    cuentaBancariaId?: string;
    nroCheque?: string;
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
  }) => Promise<ArticuloInventario>;
  actualizarPreciosInventario: (porcentajeVariacion: number) => Promise<void>;
  registrarMovimientoStock: (params: {
    articuloId: string;
    tipoDoc: string;
    descripcion: string;
    cantidad: number;
    precio?: number;
    deposito?: string;
  }) => Promise<void>;

  // Acciones Sueldos
  crearEmpleadoLegajo: (params: {
    nombreCompleto: string;
    cuil: string;
    cct: ConvenioColectivo;
    categoria: string;
    sueldoBasico: number;
    banco?: string;
  }) => Promise<EmpleadoLegajo>;
  actualizarLiquidacionPeriodo: (params: {
    periodo: string;
    tipoLiquidacion: LiquidacionPeriodo['tipoLiquidacion'];
    fechaPago: string;
  }) => Promise<void>;

  // Acciones Configuración Empresa
  guardarConfiguracionEmpresa: (nuevaEmpresa: EmpresaConfig, extra: EmpresaDatosExtra) => Promise<void>;
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
      'configuracion'
    ];
    if (validModules.includes(hash)) return hash;
    return 'tablero';
  };

  const [activeModule, setActiveModuleState] = useState<ModuleKey>(getInitialModule);
  const [dbStatus, setDbStatus] = useState<'sincronizando' | 'conectado' | 'error'>('sincronizando');
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString('es-AR'));

  const [empresa, setEmpresa] = useState<EmpresaConfig>(mockEmpresa);
  const [empresaExtra, setEmpresaExtra] = useState<EmpresaDatosExtra>({
    nombre: 'ECAR S. A. S.',
    localidad: 'VILLA KRAUSE',
    codPostal: '5425',
    provincia: 'San Juan',
    pais: '12',
    telefono: '+542644693547',
    email: 'administracion@ecarconstrucciones.com',
    cbu: '0720194820000001894211',
    convenioMultilateral: false
  });

  const [clientes, setClientes] = useState<Cliente[]>(mockClientes);
  const [proveedores, setProveedores] = useState<Proveedor[]>(mockProveedores);
  const [facturasVenta, setFacturasVenta] = useState<ComprobanteVenta[]>(mockFacturasVenta);
  const [facturasCompra, setFacturasCompra] = useState<ComprobanteCompra[]>(mockFacturasCompra);
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>(mockCuentasBancarias);
  const [cheques, setCheques] = useState<Cheque[]>(mockCheques);
  const [planDeCuentas, setPlanDeCuentas] = useState<CuentaContable[]>(mockPlanDeCuentas);
  const [asientosContables, setAsientosContables] = useState<AsientoContable[]>(mockAsientosContables);
  const [inventario, setInventario] = useState<ArticuloInventario[]>(mockInventario);
  const [empleados, setEmpleados] = useState<EmpleadoLegajo[]>(mockEmpleados);
  const [liquidacionActual, setLiquidacionActual] = useState<LiquidacionPeriodo>(mockLiquidacionActual);

  const setActiveModule = (mod: ModuleKey) => {
    setActiveModuleState(mod);
    window.location.hash = mod;
  };

  const refreshAllFromDb = useCallback(async () => {
    setDbStatus('sincronizando');
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

      if (cliRes.data && cliRes.data.length > 0) {
        setClientes(
          cliRes.data.map((r: any) => ({
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
        );
      }

      if (prvRes.data && prvRes.data.length > 0) {
        setProveedores(
          prvRes.data.map((r: any) => ({
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
        );
      }

      if (fvRes.data && fvRes.data.length > 0) {
        setFacturasVenta(
          fvRes.data.map((r: any) => ({
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
        );
      }

      if (fcRes.data && fcRes.data.length > 0) {
        setFacturasCompra(
          fcRes.data.map((r: any) => ({
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
        );
      }

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
        setPlanDeCuentas(pcRes.data.nodos);
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
        setInventario(
          invRes.data.map((r: any) => ({
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
            movimientos: r.movimientos || []
          }))
        );
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
  }, []);

  useEffect(() => {
    refreshAllFromDb();
  }, [refreshAllFromDb]);

  // Helper interno para impactar un asiento en el Plan de Cuentas y Asientos Contables
  const impactarAsientoContable = async (nuevoAsiento: AsientoContable, tipoDocMayor = 'ASI') => {
    setAsientosContables((prev) => [nuevoAsiento, ...prev]);

    let nuevoPlan = [...planDeCuentas];
    const fechaFormateada = nuevoAsiento.fecha.includes('-')
      ? nuevoAsiento.fecha.split('-').reverse().join('/')
      : nuevoAsiento.fecha;

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

    // Actualizar fila de Totales ('99')
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

    setPlanDeCuentas(nuevoPlan);

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
        nodos: nuevoPlan,
        updated_at: new Date().toISOString()
      })
    ]);
    setLastSync(new Date().toLocaleTimeString('es-AR'));
  };

  // ==========================================
  // 1. CLIENTES Y VENTAS
  // ==========================================
  const crearCliente = async (nuevoData: Omit<Cliente, 'id' | 'facturasAdeudadas' | 'movimientos' | 'saldo'>) => {
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
    netoGravado: number;
    descripcion: string;
  }) => {
    const cliente = clientes.find((c) => c.id === params.clienteId);
    if (!cliente) return;

    const ptoVta = params.puntoVenta || '0001';
    const nextNum = String(415 + facturasVenta.length).padStart(8, '0');
    const nroComprobante = `${ptoVta}-${nextNum}`;
    const iva21 = Number((params.netoGravado * 0.21).toFixed(2));
    const total = Number((params.netoGravado + iva21).toFixed(2));
    const hoy = new Date().toISOString().split('T')[0];
    const vto = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const caeVto = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const caeGenerado = `744${Math.floor(10000000000 + Math.random() * 89999999999)}`;

    const nuevaAdeudada: FacturaAdeudada = {
      id: `FAC-ADE-${Date.now()}`,
      nroComprobante,
      tipo: params.tipo,
      fechaEmision: hoy,
      fechaPago: vto,
      descripcion: params.descripcion || 'Certificación de obras y provisión de materiales',
      valorMe: 0,
      total,
      cobrado: 0,
      saldo: total,
      saldoAcumulado: cliente.saldo + total
    };

    const nuevoMov = {
      id: `MOV-${Date.now()}`,
      fecha: hoy,
      comprobante: `${params.tipo} ${nroComprobante}`,
      concepto: params.descripcion || 'Emisión de Comprobante Electrónico',
      debe: total,
      haber: 0,
      saldo: cliente.saldo + total
    };

    const clienteActualizado: Cliente = {
      ...cliente,
      saldo: cliente.saldo + total,
      facturasAdeudadas: [nuevaAdeudada, ...cliente.facturasAdeudadas],
      movimientos: [...cliente.movimientos, nuevoMov]
    };

    const nuevoComprobanteVenta: ComprobanteVenta = {
      id: `ZON-FV-${Date.now()}`,
      tipo: params.tipo,
      puntoVenta: ptoVta,
      numero: nextNum,
      fechaEmision: hoy,
      fechaVencimiento: vto,
      clienteNombre: cliente.razonSocial,
      clienteCuit: cliente.cuit,
      condicionIva: cliente.condicionIva,
      netoGravado: params.netoGravado,
      iva21,
      iva105: 0,
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

    // Generar asiento contable automático
    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4093;
    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: hoy,
        concepto: `Emisión ${params.tipo} ${nroComprobante} - ${cliente.razonSocial}`,
        tipoOrigen: 'Ventas',
        renglones: [
          { cuentaCodigo: '1.1.02', cuentaNombre: 'Créditos por Ventas (Clientes)', debe: total, haber: 0 },
          { cuentaCodigo: '4.1', cuentaNombre: 'Ingresos por Ventas', debe: 0, haber: params.netoGravado },
          { cuentaCodigo: '2.1.02', cuentaNombre: 'Cargas Fiscales e IVA', debe: 0, haber: iva21 }
        ],
        totalDebe: total,
        totalHaber: total
      },
      'FAC'
    );
  };

  const registrarCobroCliente = async (params: {
    clienteId: string;
    monto: number;
    medioCobro: string;
    cuentaBancariaId?: string;
    nroCheque?: string;
    bancoCheque?: string;
  }) => {
    const cliente = clientes.find((c) => c.id === params.clienteId);
    if (!cliente) return;

    const hoy = new Date().toISOString().split('T')[0];
    const nroRecibo = `0003-00000${Math.floor(415 + Math.random() * 500)}`;
    const nuevoSaldoCliente = Math.max(0, Number((cliente.saldo - params.monto).toFixed(2)));

    // Imputar el cobro a las facturas adeudadas más antiguas
    let montoRestante = params.monto;
    const nuevasAdeudadas = cliente.facturasAdeudadas
      .map((f) => {
        if (montoRestante <= 0 || f.saldo <= 0) return f;
        const imputado = Math.min(f.saldo, montoRestante);
        montoRestante = Number((montoRestante - imputado).toFixed(2));
        const nuevoSaldoFac = Number((f.saldo - imputado).toFixed(2));
        return {
          ...f,
          cobrado: Number((f.cobrado + imputado).toFixed(2)),
          saldo: nuevoSaldoFac,
          saldoAcumulado: nuevoSaldoCliente
        };
      })
      .filter((f) => f.saldo > 0);

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
          concepto: `Cobro mediante ${params.medioCobro}`,
          debe: 0,
          haber: params.monto,
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

    // Impactar en Tesorería (Cajas/Bancos)
    const targetCuentaId =
      params.cuentaBancariaId ||
      (params.medioCobro.toLowerCase().includes('santander')
        ? 'CTA-02'
        : params.medioCobro.toLowerCase().includes('galicia')
        ? 'CTA-04'
        : 'CTA-01');

    await registrarMovimientoTesoreria({
      cuentaId: targetCuentaId,
      tipo: 'REC',
      clienteProveedor: cliente.razonSocial,
      descripcion: `Recibo X ${nroRecibo} (${params.medioCobro})`,
      ingresos: params.monto,
      egresos: 0,
      nroCheque: params.nroCheque
    });

    // Si es Cheque de Terceros, agregarlo a Cartera de Cheques
    if (params.medioCobro.toLowerCase().includes('cheque')) {
      const nuevoCheque: Cheque = {
        id: `CHQ-${Date.now()}`,
        tipo: 'Cheque Terceros (Cartera)',
        numero: params.nroCheque || String(Math.floor(10000000 + Math.random() * 89999999)),
        bancoEmisor: params.bancoCheque || 'Banco San Juan',
        librador: cliente.razonSocial,
        cuitLibrador: cliente.cuit,
        fechaEmision: hoy,
        fechaPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        importe: params.monto,
        estado: 'En Cartera'
      };
      setCheques((prev) => [nuevoCheque, ...prev]);
      await supabase.from('erp_cheques').upsert({
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
      });
    }

    // Impactar Asiento Contable
    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4094;
    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: hoy,
        concepto: `Cobranza Recibo X ${nroRecibo} - ${cliente.razonSocial}`,
        tipoOrigen: 'Tesorería',
        renglones: [
          { cuentaCodigo: '1.1.01', cuentaNombre: 'Caja y Bancos', debe: params.monto, haber: 0 },
          { cuentaCodigo: '1.1.02', cuentaNombre: 'Créditos por Ventas (Clientes)', debe: 0, haber: params.monto }
        ],
        totalDebe: params.monto,
        totalHaber: params.monto
      },
      'REC'
    );
  };

  // ==========================================
  // 2. PROVEEDORES Y COMPRAS
  // ==========================================
  const crearProveedor = async (nuevoData: Omit<Proveedor, 'id' | 'facturasAdeudadas' | 'movimientos' | 'saldo'>) => {
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
    netoGravado: number;
    descripcion: string;
    cuentaGasto?: string;
  }) => {
    const proveedor = proveedores.find((p) => p.id === params.proveedorId);
    if (!proveedor) return;

    const hoy = new Date().toISOString().split('T')[0];
    const vto = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nroFact = `0001-000${Math.floor(10000 + Math.random() * 89999)}`;
    const iva = Number((params.netoGravado * 0.21).toFixed(2));
    const total = Number((params.netoGravado + iva).toFixed(2));

    const nuevaFacturaAdeudada: FacturaAdeudadaProveedor = {
      id: `FP-${Date.now()}`,
      nroComprobante: nroFact,
      tipo: params.tipo,
      fechaEmision: hoy,
      fechaPago: vto,
      descripcion: params.descripcion || 'Provisión de materiales e insumos operativos',
      valorMe: 0,
      total,
      pagado: 0,
      saldo: total,
      saldoAcumulado: proveedor.saldo + total
    };

    const proveedorActualizado: Proveedor = {
      ...proveedor,
      saldo: Number((proveedor.saldo + total).toFixed(2)),
      facturasAdeudadas: [nuevaFacturaAdeudada, ...proveedor.facturasAdeudadas],
      movimientos: [
        ...proveedor.movimientos,
        {
          id: `MP-${Date.now()}`,
          fecha: hoy,
          comprobante: `${params.tipo} ${nroFact}`,
          concepto: params.descripcion || 'Registro de Factura de Compra',
          debe: 0,
          haber: total,
          saldo: Number((proveedor.saldo + total).toFixed(2))
        }
      ]
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
      retencionIva: 0,
      retencionIIBB: 0,
      total,
      estadoPago: 'Pendiente'
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

    // Impactar Asiento Contable
    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4095;
    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: hoy,
        concepto: `Compra ${params.tipo} ${nroFact} - ${proveedor.razonSocial}`,
        tipoOrigen: 'Compras',
        renglones: [
          { cuentaCodigo: '5.1', cuentaNombre: 'Costos y Gastos Operativos', debe: params.netoGravado, haber: 0 },
          { cuentaCodigo: '2.1.02', cuentaNombre: 'Cargas Fiscales e IVA', debe: iva, haber: 0 },
          { cuentaCodigo: '2.1.01', cuentaNombre: 'Proveedores Comerciales', debe: 0, haber: total }
        ],
        totalDebe: total,
        totalHaber: total
      },
      'COM'
    );
  };

  const registrarPagoProveedor = async (params: {
    proveedorId: string;
    monto: number;
    medioPago: string;
    cuentaBancariaId?: string;
    nroCheque?: string;
  }) => {
    const proveedor = proveedores.find((p) => p.id === params.proveedorId);
    if (!proveedor) return;

    const hoy = new Date().toISOString().split('T')[0];
    const nroOp = `0001-00000${Math.floor(150 + Math.random() * 800)}`;
    const nuevoSaldoPrv = Math.max(0, Number((proveedor.saldo - params.monto).toFixed(2)));

    let montoRestante = params.monto;
    const nuevasAdeudadas = proveedor.facturasAdeudadas
      .map((f) => {
        if (montoRestante <= 0 || f.saldo <= 0) return f;
        const imputado = Math.min(f.saldo, montoRestante);
        montoRestante = Number((montoRestante - imputado).toFixed(2));
        const nuevoSaldoFac = Number((f.saldo - imputado).toFixed(2));
        return {
          ...f,
          pagado: Number((f.pagado + imputado).toFixed(2)),
          saldo: nuevoSaldoFac,
          saldoAcumulado: nuevoSaldoPrv
        };
      })
      .filter((f) => f.saldo > 0);

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
          concepto: `Orden de Pago mediante ${params.medioPago}`,
          debe: params.monto,
          haber: 0,
          saldo: nuevoSaldoPrv
        }
      ]
    };

    setProveedores((prev) => prev.map((p) => (p.id === proveedor.id ? proveedorActualizado : p)));

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

    // Impactar en Tesorería
    const targetCuentaId =
      params.cuentaBancariaId ||
      (params.medioPago.toLowerCase().includes('santander')
        ? 'CTA-02'
        : params.medioPago.toLowerCase().includes('galicia')
        ? 'CTA-04'
        : params.medioPago.toLowerCase().includes('cheque')
        ? 'CTA-05'
        : 'CTA-01');

    await registrarMovimientoTesoreria({
      cuentaId: targetCuentaId,
      tipo: 'PAG',
      clienteProveedor: proveedor.razonSocial,
      descripcion: `Orden de Pago ${nroOp} (${params.medioPago})`,
      ingresos: 0,
      egresos: params.monto,
      nroCheque: params.nroCheque
    });

    // Si es Cheque Propio Diferido, agregarlo a erp_cheques
    if (params.medioPago.toLowerCase().includes('cheque')) {
      const nuevoCheque: Cheque = {
        id: `CHQ-${Date.now()}`,
        tipo: 'Cheque Propio Diferido',
        numero: params.nroCheque || `0000${Math.floor(4922 + Math.random() * 1000)}`,
        bancoEmisor: 'Banco Santander',
        librador: empresa.razonSocial,
        cuitLibrador: empresa.cuit,
        fechaEmision: hoy,
        fechaPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        importe: params.monto,
        estado: 'Entregado a Proveedor'
      };
      setCheques((prev) => [nuevoCheque, ...prev]);
      await supabase.from('erp_cheques').upsert({
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
      });
    }

    // Impactar Asiento Contable
    const nextAsientoNum =
      asientosContables.length > 0 ? Math.max(...asientosContables.map((a) => a.numero)) + 1 : 4096;
    await impactarAsientoContable(
      {
        numero: nextAsientoNum,
        fecha: hoy,
        concepto: `Orden de Pago ${nroOp} - ${proveedor.razonSocial}`,
        tipoOrigen: 'Tesorería',
        renglones: [
          { cuentaCodigo: '2.1.01', cuentaNombre: 'Proveedores Comerciales', debe: params.monto, haber: 0 },
          { cuentaCodigo: '1.1.01', cuentaNombre: 'Caja y Bancos', debe: 0, haber: params.monto }
        ],
        totalDebe: params.monto,
        totalHaber: params.monto
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
    await editarCuentaBancaria(id, { saldoConciliado: cuenta.saldoActual });
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
  }) => {
    const hoy = new Date().toISOString().split('T')[0];
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
      movimientos: [
        {
          id: `MOV-INV-${Date.now()}`,
          fecha: hoy,
          deposito: params.deposito || 'Depósito Central',
          descripcion: 'Alta de Stock Inicial de Artículo',
          tipoDoc: 'INI',
          precio: params.costoCalculado,
          cantidad: params.stockInicial
        }
      ]
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
  }) => {
    const art = inventario.find((a) => a.id === params.articuloId);
    if (!art) return;

    const hoy = new Date().toISOString().split('T')[0];
    const nuevoDisponible = Number((art.disponible + params.cantidad).toFixed(2));
    const nuevoMov = {
      id: `MOV-INV-${Date.now()}`,
      fecha: hoy,
      deposito: params.deposito || 'Depósito Central',
      descripcion: params.descripcion,
      tipoDoc: params.tipoDoc,
      precio: params.precio ?? art.costoCalculado,
      cantidad: params.cantidad
    };

    const actualizado: ArticuloInventario = {
      ...art,
      disponible: nuevoDisponible,
      stockActual: nuevoDisponible,
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
      conceptosLiquidacion: [
        {
          codigo: '101',
          codigoAfipLsd: '110000',
          descripcion: 'Sueldo Básico de Convenio',
          unidades: '30 días',
          tipo: 'Remunerativo',
          remunerativo: params.sueldoBasico,
          noRemunerativo: 0,
          descuento: 0
        },
        {
          codigo: '102',
          codigoAfipLsd: '130000',
          descripcion: 'Adicional Presentismo / Asistencia Perfecta',
          unidades: 'Convenio',
          tipo: 'Remunerativo',
          remunerativo: adicionalPresentismo,
          noRemunerativo: 0,
          descuento: 0
        },
        {
          codigo: '301',
          codigoAfipLsd: '810000',
          descripcion: 'Jubilación SIPA (Ley 24.241)',
          unidades: '11%',
          tipo: 'Descuento',
          remunerativo: 0,
          noRemunerativo: 0,
          descuento: jubilacion
        },
        {
          codigo: '302',
          codigoAfipLsd: '810001',
          descripcion: 'INSSJyP Ley 19.032 (PAMI)',
          unidades: '3%',
          tipo: 'Descuento',
          remunerativo: 0,
          noRemunerativo: 0,
          descuento: pami
        },
        {
          codigo: '303',
          codigoAfipLsd: '810002',
          descripcion: 'Aporte Obra Social Sindical',
          unidades: '3%',
          tipo: 'Descuento',
          remunerativo: 0,
          noRemunerativo: 0,
          descuento: obraSocial
        },
        {
          codigo: '304',
          codigoAfipLsd: '820000',
          descripcion: 'Cuota Sindical CCT',
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
        registrarCobroCliente,
        crearProveedor,
        registrarFacturaCompra,
        registrarPagoProveedor,
        crearCuentaBancaria,
        editarCuentaBancaria,
        conciliarCuentaBancaria,
        registrarMovimientoTesoreria,
        actualizarCuentaContable,
        agregarCuentaContable,
        registrarAsientoManual,
        crearArticuloInventario,
        actualizarPreciosInventario,
        registrarMovimientoStock,
        crearEmpleadoLegajo,
        actualizarLiquidacionPeriodo,
        guardarConfiguracionEmpresa
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

