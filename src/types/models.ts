export type TipoComprobante = 'Factura A' | 'Factura B' | 'Factura C' | 'Factura M' | 'Nota de Crédito A' | 'Nota de Crédito B' | 'Recibo' | 'Presupuesto';

export type EstadoComprobante = 'Emitido' | 'Aprobado AFIP' | 'Pendiente' | 'Anulado' | 'Borrador';

export interface FacturaAdeudada {
  id: string;
  nroComprobante: string;
  tipo: TipoComprobante;
  fechaEmision: string;
  fechaPago: string;
  descripcion: string;
  valorMe: number;
  total: number;
  cobrado: number;
  saldo: number;
  saldoAcumulado: number;
}

export interface CuentaClienteMovimiento {
  id: string;
  fecha: string;
  comprobante: string;
  concepto: string;
  debe: number;
  haber: number;
  saldo: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  razonSocial: string;
  cuit: string;
  condicionIva: 'Responsable Inscripto' | 'Consumidor Final' | 'Monotributo' | 'Exento';
  domicilio: string;
  telefono: string;
  email: string;
  saldo: number;
  activo: boolean;
  listaPrecios: string;
  limiteCredito: number;
  vendedor: string;
  facturasAdeudadas: FacturaAdeudada[];
  movimientos: CuentaClienteMovimiento[];
}

export interface FacturaAdeudadaProveedor {
  id: string;
  nroComprobante: string;
  tipo: string;
  fechaEmision: string;
  fechaPago: string;
  descripcion: string;
  valorMe: number;
  total: number;
  pagado: number;
  saldo: number;
  saldoAcumulado: number;
}

export interface CuentaProveedorMovimiento {
  id: string;
  fecha: string;
  comprobante: string;
  concepto: string;
  debe: number;
  haber: number;
  saldo: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  razonSocial: string;
  cuit: string;
  condicionIva: string;
  domicilio: string;
  telefono: string;
  email: string;
  saldo: number;
  activo: boolean;
  cuentaGastoHabitual: string;
  condicionPago: string;
  facturasAdeudadas: FacturaAdeudadaProveedor[];
  movimientos: CuentaProveedorMovimiento[];
}

export interface ComprobanteVenta {
  id: string;
  tipo: TipoComprobante;
  puntoVenta: string;
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  clienteNombre: string;
  clienteCuit: string;
  condicionIva: 'Responsable Inscripto' | 'Consumidor Final' | 'Monotributo' | 'Exento';
  netoGravado: number;
  iva21: number;
  iva105: number;
  total: number;
  estado: EstadoComprobante;
  cae?: string;
  caeVencimiento?: string;
}

export interface ComprobanteCompra {
  id: string;
  tipo: 'Factura A' | 'Factura B' | 'Factura C' | 'Liquidación' | 'Nota de Débito';
  numero: string;
  proveedorNombre: string;
  proveedorCuit: string;
  fechaComprobante: string;
  fechaImputacion: string;
  cuentaGasto: string;
  netoGravado: number;
  iva: number;
  retencionIva: number;
  retencionIIBB: number;
  total: number;
  estadoPago: 'Pendiente' | 'Pagado Parcial' | 'Pagado Total';
}

export interface MovimientoTesoreria {
  id: string;
  fecha: string;
  clienteProveedor: string;
  tipo: string; // e.g. PAG, EXE, REC, DEP
  nro: string;
  nroCheque?: string;
  descripcion: string;
  ingresos: number;
  egresos: number;
  saldo: number;
}

export interface CuentaBancaria {
  id: string;
  nombre: string;
  banco: string;
  tipoCuenta: 'Cuenta Corriente' | 'Caja de Ahorro' | 'Caja Física' | 'Tarjeta' | 'Cheques';
  moneda: 'ARS' | 'USD';
  cbu?: string;
  saldoActual: number;
  saldoConciliado: number;
  conectarDisponible?: boolean;
  movimientos?: MovimientoTesoreria[];
}

export interface Cheque {
  id: string;
  tipo: 'Cheque Terceros (Cartera)' | 'Cheque Propio Diferido';
  numero: string;
  bancoEmisor: string;
  librador: string;
  cuitLibrador: string;
  fechaEmision: string;
  fechaPago: string;
  importe: number;
  estado: 'En Cartera' | 'Depositado' | 'Cobrado' | 'Entregado a Proveedor' | 'Rechazado';
}

export interface MovimientoMayor {
  id: string;
  fecha: string;
  tipo: string;
  nro: string;
  descripcion: string;
  debito: number;
  credito: number;
  saldo: number;
}

export interface CuentaContable {
  codigo: string;
  nombre: string;
  nivel: number;
  tipo: string;
  imputable: boolean;
  saldoInicio?: number;
  debito?: number;
  credito?: number;
  saldoFinal?: number;
  saldoDeudor: number;
  saldoAcreedor: number;
  admiteAsientoManual?: boolean;
  saldoHabitual?: 'Deudor' | 'Acreedor';
  tipoCuenta?: string;
  tituloSumasSaldos?: string;
  hijos?: CuentaContable[];
  movimientosMayor?: MovimientoMayor[];
}

export interface AsientoContable {
  numero: number;
  fecha: string;
  concepto: string;
  tipoOrigen: 'Ventas' | 'Compras' | 'Tesorería' | 'Manual' | 'Cierre';
  renglones: {
    cuentaCodigo: string;
    cuentaNombre: string;
    debe: number;
    haber: number;
  }[];
  totalDebe: number;
  totalHaber: number;
}

export interface MovimientoInventario {
  id: string;
  fecha: string;
  deposito: string;
  descripcion: string;
  tipoDoc: string;
  precio: number;
  cantidad: number;
}

export interface ArticuloInventario {
  id: string;
  codigo: string;
  sku: string;
  descripcion: string;
  tipo: string;
  um: string;
  categoria: string;
  unidadMedida: string;
  disponible: number;
  stockActual: number;
  stockMinimo: number;
  costoCalculado: number;
  precioVentaNeto: number;
  alicuotaIva: 21 | 10.5 | 0;
  deposito: string;
  movimientos?: MovimientoInventario[];
}

export interface EmpresaConfig {
  razonSocial: string;
  cuit: string;
  domicilioFiscal: string;
  condicionIva: string;
  ingresosBrutos: string;
  inicioActividades: string;
  puntosVenta: {
    numero: string;
    descripcion: string;
    tipoEmision: 'Facturación Electrónica Web Service' | 'Factura en Línea';
    activo: boolean;
  }[];
}

// ==========================================
// CONFIGURACIÓN DE CONEXIONES Y WEB SERVICES
// ==========================================

export type AfipAmbiente = 'homologacion' | 'produccion';

export interface AfipWsConfig {
  cuit: string;
  ambiente: AfipAmbiente;
  puntoVentaPredeterminado: string;
  modoConexion?: 'delegacion_representante' | 'certificado_propio';
  cuitRepresentanteSaaS?: string; // CUIT de Grow Labs que actúa como Representante WSFE (Estilo Dux Software)
  razonSocialRepresentanteSaaS?: string;
  sistemaPuntoVentaAfip?:
    | 'RECE para aplicativos y Web Services (Resp. Inscripto)'
    | 'Factura Electrónica - Monotributo - Web Services';
  delegacionConfirmadaPorCliente?: boolean;
  certificadoCrt: string; // Certificado Digital X.509 (.crt / .pem)
  clavePrivadaKey: string; // Clave privada RSA (.key)
  endpointUrl?: string; // URL de la Edge Function puente ARCA WSAA/WSFE
  estadoConexion: 'desconectado' | 'pendiente_certificados' | 'conectado' | 'error';
  tokenTicket?: {
    token: string;
    sign: string;
    generationTime: string;
    expirationTime: string;
  };
  ultimoPing?: string;
  ultimoMensaje?: string;
}

export type MercadoPagoModo = 'sandbox' | 'produccion';

export interface MercadoPagoConfig {
  modo: MercadoPagoModo;
  publicKey: string;
  accessToken: string;
  webhookSecret?: string;
  webhookUrl?: string; // URL de recepción de notificaciones Webhook/IPN en Supabase
  integradorId?: string;
  cuentaBancariaDestinoId?: string; // Caja / Cuenta interna del ERP donde impactan los cobros (Estilo Dux)
  sucursalExternalId?: string; // External Store ID en Mercado Pago
  cajaPosExternalId?: string; // External POS ID (QR Mostrador)
  pointDeviceId?: string; // Terminal Lector Mercado Pago Point Smart
  estadoConexion: 'desconectado' | 'pendiente_token' | 'conectado' | 'error';
  nombreComercio?: string;
  emailCuenta?: string;
  ultimoPing?: string;
  ultimoMensaje?: string;
}

export interface WebhookLogEntry {
  id: string;
  origen: 'MERCADOPAGO' | 'ARCA' | 'ARCA_WSFE';
  evento: string;
  referenciaExterna: string;
  monto: number;
  estado: string;
  payload?: any;
  respuesta?: any;
  createdAt: string;
}

// ==========================================
// MÓDULO DE SUELDOS & LIBRO SUELDOS DIGITAL (AFIP RG 3781)
// ==========================================

export type ConvenioColectivo =
  | 'CCT 76/75 (UOCRA - Construcción)'
  | 'CCT 130/75 (Comercio y Servicios)'
  | 'CCT 122/75 (Sanidad - Clínicas y Sanatorios)'
  | 'Fuera de Convenio (Dirección)';

export interface ConceptoRecibo {
  codigo: string;
  codigoAfipLsd: string; // Código de concepto AFIP LSD (e.g. 110000, 120000, 810000)
  descripcion: string;
  unidades?: string;
  tipo: 'Remunerativo' | 'No Remunerativo' | 'Descuento' | 'Aporte Patronal';
  remunerativo: number;
  noRemunerativo: number;
  descuento: number;
}

export interface EmpleadoLegajo {
  id: string;
  legajo: string;
  cuil: string;
  nombreCompleto: string;
  cct: ConvenioColectivo;
  categoria: string;
  fechaIngreso: string;
  antiguedadAnios: number;
  banco: string;
  cbu: string;
  modalidadContratacion: string;
  sueldoBasico: number;
  activo: boolean;
  conceptosLiquidacion: ConceptoRecibo[];
}

export interface LiquidacionPeriodo {
  periodo: string; // e.g. "202610"
  tipoLiquidacion: 'Mensual' | '1ra Quincena' | '2da Quincena' | 'SAC 1' | 'SAC 2' | 'Vacaciones';
  numeroLiquidacion: number;
  fechaPago: string;
  totalBruto: number;
  totalRetenciones: number;
  totalNeto: number;
  totalContribucionesPatronales: number;
  empleadosCount: number;
}
