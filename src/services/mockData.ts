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
  LiquidacionPeriodo
} from '../types/models';

export const mockClientes: Cliente[] = [
  {
    id: 'CLI-001',
    nombre: 'Consumidor Final',
    razonSocial: 'Consumidor Final',
    cuit: '00-00000000-0',
    condicionIva: 'Consumidor Final',
    domicilio: 'Venta Mostrador',
    telefono: '-',
    email: 'contacto@ventas.local',
    saldo: 0.00,
    activo: true,
    listaPrecios: 'Lista Minorista Estándar',
    limiteCredito: 0,
    vendedor: 'Ventas Mostrador',
    facturasAdeudadas: [],
    movimientos: [
      { id: 'MOV-01', fecha: '2026-10-26', comprobante: 'Factura B 0002-00000129', concepto: 'Venta de Materiales', debe: 423500.00, haber: 0, saldo: 423500.00 },
      { id: 'MOV-02', fecha: '2026-10-26', comprobante: 'Recibo X 0003-00000412', concepto: 'Cobro en Efectivo Caja', debe: 0, haber: 423500.00, saldo: 0.00 }
    ]
  },
  {
    id: 'CLI-002',
    nombre: 'VALDIVIESO GROUP S. R. L.',
    razonSocial: 'VALDIVIESO GROUP S. R. L.',
    cuit: '30-71458921-0',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Av. Libertador San Martín 1840 Este, San Juan',
    telefono: '+54 264 421-9981',
    email: 'administracion@valdiviesogroup.com.ar',
    saldo: 1850400.00,
    activo: true,
    listaPrecios: 'Lista Corporativa Obras A',
    limiteCredito: 5000000.00,
    vendedor: 'Ing. Lucas Marinero',
    facturasAdeudadas: [
      {
        id: 'FAC-ADE-01',
        nroComprobante: '0001-00000398',
        tipo: 'Factura A',
        fechaEmision: '2026-09-28',
        fechaPago: '2026-10-28',
        descripcion: 'Materiales Red de Gas Polietileno 110mm',
        valorMe: 0.00,
        total: 1850400.00,
        cobrado: 0.00,
        saldo: 1850400.00,
        saldoAcumulado: 1850400.00
      }
    ],
    movimientos: [
      { id: 'MOV-10', fecha: '2026-09-28', comprobante: 'Factura A 0001-00000398', concepto: 'Venta de Materiales Red Gas', debe: 1850400.00, haber: 0, saldo: 1850400.00 }
    ]
  },
  {
    id: 'CLI-003',
    nombre: 'CONSTRUCTORA CUYANA S.R.L.',
    razonSocial: 'CONSTRUCTORA CUYANA S.R.L.',
    cuit: '30-68912443-4',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Mendoza 450 Sur, Rawson, San Juan',
    telefono: '+54 264 428-1120',
    email: 'finanzas@constructoracuyana.com.ar',
    saldo: 5868500.00,
    activo: true,
    listaPrecios: 'Lista Mayorista Especial',
    limiteCredito: 15000000.00,
    vendedor: 'Ing. Lucas Marinero',
    facturasAdeudadas: [
      {
        id: 'FAC-ADE-02',
        nroComprobante: '0001-00000412',
        tipo: 'Factura A',
        fechaEmision: '2026-10-24',
        fechaPago: '2026-11-23',
        descripcion: 'Certificado de Avance de Obra Red Hidráulica',
        valorMe: 0.00,
        total: 5868500.00,
        cobrado: 0.00,
        saldo: 5868500.00,
        saldoAcumulado: 5868500.00
      }
    ],
    movimientos: [
      { id: 'MOV-20', fecha: '2026-10-24', comprobante: 'Factura A 0001-00000412', concepto: 'Certificado Obra Red Hidráulica', debe: 5868500.00, haber: 0, saldo: 5868500.00 }
    ]
  },
  {
    id: 'CLI-004',
    nombre: 'HIDRÁULICA Y SERVICIOS SAN JUAN S.A.',
    razonSocial: 'HIDRÁULICA Y SERVICIOS SAN JUAN S.A.',
    cuit: '30-71124598-1',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Ruta 40 Km 12, Pocito, San Juan',
    telefono: '+54 264 492-3300',
    email: 'pagos@hidraulicasanjuan.com',
    saldo: 3872000.00,
    activo: true,
    listaPrecios: 'Lista Corporativa Obras A',
    limiteCredito: 8000000.00,
    vendedor: 'Área Técnica',
    facturasAdeudadas: [
      {
        id: 'FAC-ADE-03',
        nroComprobante: '0001-00000413',
        tipo: 'Factura A',
        fechaEmision: '2026-10-25',
        fechaPago: '2026-11-24',
        descripcion: 'Adaptadores Brida y Accesorios Electrofusión',
        valorMe: 0.00,
        total: 3872000.00,
        cobrado: 0.00,
        saldo: 3872000.00,
        saldoAcumulado: 3872000.00
      }
    ],
    movimientos: [
      { id: 'MOV-30', fecha: '2026-10-25', comprobante: 'Factura A 0001-00000413', concepto: 'Accesorios Electrofusión', debe: 3872000.00, haber: 0, saldo: 3872000.00 }
    ]
  },
  {
    id: 'CLI-005',
    nombre: 'TRANSPORTES RAWSON S.A.',
    razonSocial: 'TRANSPORTES RAWSON S.A.',
    cuit: '30-65981240-5',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Calle 5 y Lemos, Rawson',
    telefono: '+54 264 428-9000',
    email: 'logistica@transportesrawson.com',
    saldo: 0.00,
    activo: false,
    listaPrecios: 'Lista Minorista Estándar',
    limiteCredito: 1000000.00,
    vendedor: 'Ventas Mostrador',
    facturasAdeudadas: [],
    movimientos: []
  }
];

export const mockProveedores: Proveedor[] = [
  {
    id: 'PRV-01',
    nombre: 'ALEJANDRO MIGUEL LUL...',
    razonSocial: 'ALEJANDRO MIGUEL LUL...',
    cuit: '20-24891230-4',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'San Juan',
    telefono: '+54 264 421-0010',
    email: 'alejandro.lul@proveedores.com',
    saldo: 69685.60,
    activo: true,
    cuentaGastoHabitual: '5.1.01 Costo de Materiales',
    condicionPago: 'Cuenta Corriente 30 Días',
    facturasAdeudadas: [
      { id: 'FP-01', nroComprobante: '0001-00004120', tipo: 'Factura A', fechaEmision: '2026-09-15', fechaPago: '2026-10-15', descripcion: 'Repuestos Varios e Insumos Hidráulicos', valorMe: 0, total: 69685.60, pagado: 0, saldo: 69685.60, saldoAcumulado: 69685.60 }
    ],
    movimientos: [
      { id: 'MP-01', fecha: '2026-09-15', comprobante: 'Factura A 0001-00004120', concepto: 'Repuestos Varios', debe: 0, haber: 69685.60, saldo: 69685.60 }
    ]
  },
  { id: 'PRV-02', nombre: 'ALESSI MARTIN ESTEBA...', razonSocial: 'ALESSI MARTIN ESTEBA...', cuit: '20-28941209-1', condicionIva: 'Monotributo', domicilio: 'Rivadavia, San Juan', telefono: '-', email: 'alessi@martin.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.01 Servicios Profesionales', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-03', nombre: 'ALFONSO NICOLAS LOPE...', razonSocial: 'ALFONSO NICOLAS LOPE...', cuit: '20-31849102-5', condicionIva: 'Responsable Inscripto', domicilio: 'Santa Lucía, San Juan', telefono: '-', email: 'alfonso.lopez@gmail.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.03 Fletes', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-04', nombre: 'ALL ONLINE SOLUTIONS ...', razonSocial: 'ALL ONLINE SOLUTIONS ...', cuit: '30-71490123-9', condicionIva: 'Responsable Inscripto', domicilio: 'CABA, Buenos Aires', telefono: '-', email: 'billing@allonline.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.04 Software y Sistemas', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-05', nombre: 'AUTOMACH SRL', razonSocial: 'AUTOMACH SRL', cuit: '30-68912049-2', condicionIva: 'Responsable Inscripto', domicilio: 'Pocito, San Juan', telefono: '-', email: 'ventas@automach.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.02 Mantenimiento Maquinarias', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-06', nombre: 'CAMAQ KAUR S. A. S.', razonSocial: 'CAMAQ KAUR S. A. S.', cuit: '30-71891240-3', condicionIva: 'Responsable Inscripto', domicilio: 'Capital, San Juan', telefono: '-', email: 'administracion@camaq.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Materiales', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-07', nombre: 'CONSEJO PROFESIONAL ...', razonSocial: 'CONSEJO PROFESIONAL ...', cuit: '30-54912048-1', condicionIva: 'Exento', domicilio: 'San Juan', telefono: '-', email: 'tesoreria@cpcesj.org.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.05 Matrículas y Tasas', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-08', nombre: 'CUYO MATERIALES SRL', razonSocial: 'CUYO MATERIALES SRL', cuit: '30-70912401-4', condicionIva: 'Responsable Inscripto', domicilio: 'Chimbas, San Juan', telefono: '-', email: 'cuyomateriales@speedy.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Materiales', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-09', nombre: 'DAGFAL SRL', razonSocial: 'DAGFAL SRL', cuit: '30-65819203-8', condicionIva: 'Responsable Inscripto', domicilio: 'Rawson, San Juan', telefono: '-', email: 'dagfal@dagfal.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Materiales Eléctricos', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  {
    id: 'PRV-10',
    nombre: 'DECOM SA',
    razonSocial: 'DECOM SA',
    cuit: '30-68192834-0',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Mendoza, Argentina',
    telefono: '+54 261 498-1120',
    email: 'cuentas@decomsa.com.ar',
    saldo: 57112.01,
    activo: true,
    cuentaGastoHabitual: '5.1.01 Insumos de Hormigón',
    condicionPago: 'Cuenta Corriente',
    facturasAdeudadas: [
      { id: 'FP-10', nroComprobante: '0003-00019283', tipo: 'Factura A', fechaEmision: '2026-09-20', fechaPago: '2026-10-20', descripcion: 'Aditivos para Hormigón y Curadores', valorMe: 0, total: 57112.01, pagado: 0, saldo: 57112.01, saldoAcumulado: 57112.01 }
    ],
    movimientos: [
      { id: 'MP-10', fecha: '2026-09-20', comprobante: 'Factura A 0003-00019283', concepto: 'Aditivos Hormigón', debe: 0, haber: 57112.01, saldo: 57112.01 }
    ]
  },
  { id: 'PRV-11', nombre: 'ECAR S. A. S.', razonSocial: 'ECAR S. A. S.', cuit: '30-71875908-7', condicionIva: 'Responsable Inscripto', domicilio: 'Villa Krause, San Juan', telefono: '-', email: 'administracion@ecarconstrucciones.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.00 Operaciones Internas', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-12', nombre: 'EDUARDO JOSE PADILLA', razonSocial: 'EDUARDO JOSE PADILLA', cuit: '20-18491209-4', condicionIva: 'Responsable Inscripto', domicilio: 'Capital, San Juan', telefono: '-', email: 'padilla@abogados.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.01 Honorarios Legales', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-13', nombre: 'ELECTROFULL S. A. S.', razonSocial: 'ELECTROFULL S. A. S.', cuit: '30-71890123-4', condicionIva: 'Responsable Inscripto', domicilio: 'Rivadavia, San Juan', telefono: '-', email: 'ventas@electrofull.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Materiales', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  {
    id: 'PRV-14',
    nombre: 'ESTACION CENTRAL S.A.S.',
    razonSocial: 'ESTACION CENTRAL S.A.S.',
    cuit: '30-71689124-1',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Lateral de Circunvalación 890 Sur',
    telefono: '+54 264 423-8899',
    email: 'estacioncentral@combustibles.com.ar',
    saldo: 6423500.00,
    activo: true,
    cuentaGastoHabitual: '5.1.05 Combustibles y Lubricantes Flota',
    condicionPago: 'Cuenta Corriente Quincenal',
    facturasAdeudadas: [
      { id: 'FP-14', nroComprobante: '0008-00041289', tipo: 'Factura A', fechaEmision: '2026-10-10', fechaPago: '2026-10-25', descripcion: 'Combustible Diesel Grado 3 Flota de Obras', valorMe: 0, total: 6423500.00, pagado: 0, saldo: 6423500.00, saldoAcumulado: 6423500.00 }
    ],
    movimientos: [
      { id: 'MP-14', fecha: '2026-10-10', comprobante: 'Factura A 0008-00041289', concepto: 'Combustible Diesel Grado 3', debe: 0, haber: 6423500.00, saldo: 6423500.00 }
    ]
  },
  { id: 'PRV-15', nombre: 'FEDEMI S.R.L.', razonSocial: 'FEDEMI S.R.L.', cuit: '30-67891204-1', condicionIva: 'Responsable Inscripto', domicilio: 'San Juan', telefono: '-', email: 'fedemi@srl.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Insumos', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-16', nombre: 'FUTURO SA', razonSocial: 'FUTURO SA', cuit: '30-70891234-9', condicionIva: 'Responsable Inscripto', domicilio: 'San Juan', telefono: '-', email: 'futuro@futurosa.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.02 Seguros y ART', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  {
    id: 'PRV-17',
    nombre: 'GOMALAR SRL',
    razonSocial: 'GOMALAR SRL',
    cuit: '30-69012384-5',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Santa Lucía, San Juan',
    telefono: '+54 264 425-4433',
    email: 'gomalar@gomalar.com.ar',
    saldo: 26500.00,
    activo: true,
    cuentaGastoHabitual: '5.1.04 Neumáticos y Gomaría',
    condicionPago: 'Cuenta Corriente',
    facturasAdeudadas: [
      { id: 'FP-17', nroComprobante: '0002-00008912', tipo: 'Factura A', fechaEmision: '2026-09-28', fechaPago: '2026-10-28', descripcion: 'Reparación de cubiertas Camión volcador', valorMe: 0, total: 26500.00, pagado: 0, saldo: 26500.00, saldoAcumulado: 26500.00 }
    ],
    movimientos: [
      { id: 'MP-17', fecha: '2026-09-28', comprobante: 'Factura A 0002-00008912', concepto: 'Cubiertas Camión', debe: 0, haber: 26500.00, saldo: 26500.00 }
    ]
  },
  { id: 'PRV-18', nombre: 'IFRIMEN SRL', razonSocial: 'IFRIMEN SRL', cuit: '30-68124901-2', condicionIva: 'Responsable Inscripto', domicilio: 'San Juan', telefono: '-', email: 'ifrimen@ifrimen.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Materiales', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-19', nombre: 'INDUSTRIAS HORMAT S. ...', razonSocial: 'INDUSTRIAS HORMAT S. A. S.', cuit: '30-71891234-8', condicionIva: 'Responsable Inscripto', domicilio: 'San Juan', telefono: '-', email: 'hormat@hormat.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Premoldeados Hormigón', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-20', nombre: 'INTEGRA S. A. S.', razonSocial: 'INTEGRA S. A. S.', cuit: '30-71901234-5', condicionIva: 'Responsable Inscripto', domicilio: 'San Juan', telefono: '-', email: 'integra@integra.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Materiales', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  {
    id: 'PRV-21',
    nombre: 'ITAL VINIL SAN LUIS SOCI...',
    razonSocial: 'ITAL VINIL SAN LUIS SOCIEDAD ANONIMA',
    cuit: '30-58912401-2',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Parque Industrial San Luis',
    telefono: '+54 266 442-9900',
    email: 'cobranzas@italvinil.com.ar',
    saldo: -7843634.60,
    activo: true,
    cuentaGastoHabitual: '5.1.01 Tuberías PVC y PEAD',
    condicionPago: 'Cuenta Corriente Anticipada',
    facturasAdeudadas: [],
    movimientos: [
      { id: 'MP-21', fecha: '2026-09-10', comprobante: 'Anticipo OP 0001-00000049', concepto: 'Anticipo Compra Tuberías PEAD 110', debe: 7843634.60, haber: 0, saldo: -7843634.60 }
    ]
  },
  { id: 'PRV-22', nombre: 'JEREMIAS ORTIZ', razonSocial: 'JEREMIAS ORTIZ', cuit: '20-33891240-1', condicionIva: 'Monotributo', domicilio: 'San Juan', telefono: '-', email: 'jeremias@ortiz.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.03 Mano de Obra', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-23', nombre: 'JORGE ERNESTO MIADOS...', razonSocial: 'JORGE ERNESTO MIADOSQUI', cuit: '20-14891204-9', condicionIva: 'Responsable Inscripto', domicilio: 'San Juan', telefono: '-', email: 'miadosqui@sanatorio.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.01 Servicios Médicos y Consultoría', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  {
    id: 'PRV-24',
    nombre: 'JUAN CARLOS ROJO',
    razonSocial: 'JUAN CARLOS ROJO',
    cuit: '20-12891240-8',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'San Juan',
    telefono: '+54 264 422-9011',
    email: 'rojo@transportes.com.ar',
    saldo: 80799.99,
    activo: true,
    cuentaGastoHabitual: '5.1.03 Fletes y Movimiento de Suelos',
    condicionPago: 'Cuenta Corriente',
    facturasAdeudadas: [
      { id: 'FP-24', nroComprobante: '0004-00001289', tipo: 'Factura A', fechaEmision: '2026-10-02', fechaPago: '2026-10-31', descripcion: 'Servicio de Fletes Obra Rawson', valorMe: 0, total: 80799.99, pagado: 0, saldo: 80799.99, saldoAcumulado: 80799.99 }
    ],
    movimientos: [
      { id: 'MP-24', fecha: '2026-10-02', comprobante: 'Factura A 0004-00001289', concepto: 'Fletes Obra Rawson', debe: 0, haber: 80799.99, saldo: 80799.99 }
    ]
  },
  {
    id: 'PRV-25',
    nombre: 'LUCAS MAXIMILIANO MA...',
    razonSocial: 'LUCAS MAXIMILIANO MARINERO',
    cuit: '20-33718912-4',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Boulevard Sarmiento 550, Villa Krause, San Juan',
    telefono: '+54 264 500-1122',
    email: 'lucasmmarinero@gmail.com',
    saldo: 2500000.00,
    activo: true,
    cuentaGastoHabitual: '5.2.01 Honorarios Dirección Técnica de Obra',
    condicionPago: 'Cuenta Corriente Mensual',
    facturasAdeudadas: [
      { id: 'FP-25', nroComprobante: '0001-00000021', tipo: 'Factura A', fechaEmision: '2026-10-01', fechaPago: '2026-10-31', descripcion: 'Dirección Técnica y Conducción de Obra Mes de Septiembre', valorMe: 0, total: 2500000.00, pagado: 0, saldo: 2500000.00, saldoAcumulado: 2500000.00 }
    ],
    movimientos: [
      { id: 'MP-25', fecha: '2026-10-01', comprobante: 'Factura A 0001-00000021', concepto: 'Dirección Técnica Obra', debe: 0, haber: 2500000.00, saldo: 2500000.00 }
    ]
  },
  { id: 'PRV-26', nombre: 'LUJAN ERICA ESPINOSA', razonSocial: 'LUJAN ERICA ESPINOSA', cuit: '27-31891240-5', condicionIva: 'Monotributo', domicilio: 'San Juan', telefono: '-', email: 'lujan.espinosa@gmail.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.01 Servicios Administrativos', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-27', nombre: 'MAQBULON SAN BENITO...', razonSocial: 'MAQBULON SAN BENITO...', cuit: '30-71891049-1', condicionIva: 'Responsable Inscripto', domicilio: 'San Juan', telefono: '-', email: 'maqbulon@bulonera.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Bulonería y Fijaciones', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  {
    id: 'PRV-28',
    nombre: 'MAQUINARIA E INSUMOS...',
    razonSocial: 'MAQUINARIA E INSUMOS SAN JUAN S.A.',
    cuit: '30-70981240-2',
    condicionIva: 'Responsable Inscripto',
    domicilio: 'Lateral Ruta 40 Sur 1900',
    telefono: '+54 264 424-7700',
    email: 'repuestos@maquinaria.com.ar',
    saldo: 253422.40,
    activo: true,
    cuentaGastoHabitual: '5.1.02 Repuestos y Mantenimiento Viales',
    condicionPago: 'Cuenta Corriente',
    facturasAdeudadas: [
      { id: 'FP-28', nroComprobante: '0005-00018902', tipo: 'Factura A', fechaEmision: '2026-10-05', fechaPago: '2026-11-05', descripcion: 'Filtros y Mangueras Hidráulicas Retroexcavadora', valorMe: 0, total: 253422.40, pagado: 0, saldo: 253422.40, saldoAcumulado: 253422.40 }
    ],
    movimientos: [
      { id: 'MP-28', fecha: '2026-10-05', comprobante: 'Factura A 0005-00018902', concepto: 'Filtros y Mangueras Retroexcavadora', debe: 0, haber: 253422.40, saldo: 253422.40 }
    ]
  },
  { id: 'PRV-29', nombre: 'MATRIGAS SRL', razonSocial: 'MATRIGAS SRL', cuit: '30-69812049-8', condicionIva: 'Responsable Inscripto', domicilio: 'San Juan', telefono: '-', email: 'matrigas@matrigas.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Accesorios Gas', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-30', nombre: 'MAURICIO GASPAR AGU...', razonSocial: 'MAURICIO GASPAR AGUIRRE', cuit: '20-30891240-9', condicionIva: 'Monotributo', domicilio: 'San Juan', telefono: '-', email: 'mauricio.aguirre@gmail.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.03 Instalaciones Especiales', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-31', nombre: 'MAXICON S.R.L.', razonSocial: 'MAXICON S.R.L.', cuit: '30-71012349-1', condicionIva: 'Responsable Inscripto', domicilio: 'Rawson, San Juan', telefono: '-', email: 'ventas@maxicon.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Materiales', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-32', nombre: 'MENDOZA HORMIGONES S.A.', razonSocial: 'MENDOZA HORMIGONES S.A.', cuit: '30-66781290-3', condicionIva: 'Responsable Inscripto', domicilio: 'Mendoza', telefono: '-', email: 'administracion@mendozahormigones.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Hormigón Elaborado', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-33', nombre: 'METALURGICA ANDINA S.A.', razonSocial: 'METALURGICA ANDINA S.A.', cuit: '30-58912830-4', condicionIva: 'Responsable Inscripto', domicilio: 'Chimbas, San Juan', telefono: '-', email: 'ventas@metalurgicaandina.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Estructuras Metálicas', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-34', nombre: 'MINERA DEL SAN JUAN S.R.L.', razonSocial: 'MINERA DEL SAN JUAN S.R.L.', cuit: '30-71489102-6', condicionIva: 'Responsable Inscripto', domicilio: 'San Juan', telefono: '-', email: 'info@minerasanjuan.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Áridos y Grava', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-35', nombre: 'MUEBLES Y EQUIPAMIENTOS CUYO', razonSocial: 'MUEBLES Y EQUIPAMIENTOS CUYO S.A.', cuit: '30-69123849-0', condicionIva: 'Responsable Inscripto', domicilio: 'Capital, San Juan', telefono: '-', email: 'contacto@equipamientoscuyo.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.04 Mobiliario de Obra', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-36', nombre: 'NEUMATICOS SAN JUAN', razonSocial: 'NEUMATICOS SAN JUAN S.R.L.', cuit: '30-64912048-5', condicionIva: 'Responsable Inscripto', domicilio: 'Lateral Circunvalación Sur', telefono: '-', email: 'ventas@neumaticossanjuan.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.04 Neumáticos Viales', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-37', nombre: 'OBRA SANITARIA SOCIEDAD DEL ESTADO', razonSocial: 'O.S.S.E. SAN JUAN', cuit: '30-67129038-2', condicionIva: 'Exento', domicilio: 'Capital, San Juan', telefono: '-', email: 'facturacion@osse.gob.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.03 Servicios Públicos', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-38', nombre: 'OXIGENO Y GASES CUYO S.A.', razonSocial: 'OXIGENO Y GASES CUYO S.A.', cuit: '30-59128301-4', condicionIva: 'Responsable Inscripto', domicilio: 'Santa Lucía, San Juan', telefono: '-', email: 'oxigenocuyo@gases.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Gases Industriales y Soldadura', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-39', nombre: 'PINTURERIAS DEL CENTRO', razonSocial: 'PINTURERIAS DEL CENTRO S.A.', cuit: '30-68192039-1', condicionIva: 'Responsable Inscripto', domicilio: 'Capital, San Juan', telefono: '-', email: 'san_juan@delcentro.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Pinturas y Revestimientos', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-40', nombre: 'PLASTICOS CUYANOS S.A.', razonSocial: 'PLASTICOS CUYANOS S.A.', cuit: '30-70192834-7', condicionIva: 'Responsable Inscripto', domicilio: 'Pocito, San Juan', telefono: '-', email: 'ventas@plasticoscuyanos.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Geomembranas y Plásticos', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-41', nombre: 'RIESGO Y SEGURIDAD INDUSTRIAL', razonSocial: 'RIESGO Y SEGURIDAD INDUSTRIAL S.R.L.', cuit: '30-71289104-9', condicionIva: 'Responsable Inscripto', domicilio: 'Rivadavia, San Juan', telefono: '-', email: 'seguridad@riesgo.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.02 Elementos de Protección Personal', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-42', nombre: 'SANATORIO ARGENTINO SERVICIOS', razonSocial: 'SANATORIO ARGENTINO SERVICIOS EXTERNOS S.A.', cuit: '30-54128940-1', condicionIva: 'Responsable Inscripto', domicilio: 'San Luis 432 Oeste, San Juan', telefono: '+54 264 429-0000', email: 'medicina.laboral@sanatorioargentino.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.01 Medicina Laboral y Chequeos', condicionPago: 'Cuenta Corriente', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-43', nombre: 'SAN JUAN DISTRIBUCIONES S.R.L.', razonSocial: 'SAN JUAN DISTRIBUCIONES S.R.L.', cuit: '30-70981290-4', condicionIva: 'Responsable Inscripto', domicilio: 'Capital, San Juan', telefono: '-', email: 'distribuciones@sjdist.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.01 Artículos de Limpieza y Bazar', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-44', nombre: 'SERVICIOS DE INGENIERIA SAN JUAN', razonSocial: 'SERVICIOS DE INGENIERIA SAN JUAN S.A.', cuit: '30-71829014-2', condicionIva: 'Responsable Inscripto', domicilio: 'Rivadavia, San Juan', telefono: '-', email: 'proyectos@ingenieriasj.com', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.01 Ensayos y Control de Calidad', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-45', nombre: 'SINDICATO DE LA CONSTRUCCION', razonSocial: 'UOCRA DELEGACION SAN JUAN', cuit: '30-52918204-7', condicionIva: 'Exento', domicilio: 'Capital, San Juan', telefono: '-', email: 'aportes@uocrasanjuan.org.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.05 Aportes Sindicales', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-46', nombre: 'TECNO REDES CUYO', razonSocial: 'TECNO REDES CUYO S.R.L.', cuit: '30-71902834-8', condicionIva: 'Responsable Inscripto', domicilio: 'Capital, San Juan', telefono: '-', email: 'soporte@tecnoredes.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.04 Conectividad e Internet', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-47', nombre: 'VIALIDAD PROVINCIAL SAN JUAN', razonSocial: 'DIRECCION PROVINCIAL DE VIALIDAD', cuit: '30-60912480-1', condicionIva: 'Exento', domicilio: 'San Juan', telefono: '-', email: 'tasas@vialidad.sanjuan.gov.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.2.05 Canon y Permisos de Tránsito', condicionPago: 'Contado', facturasAdeudadas: [], movimientos: [] },
  { id: 'PRV-48', nombre: 'YPF DIRECTO SAN JUAN', razonSocial: 'YPF DIRECTO DISTRIBUIDOR OFICIAL S.A.', cuit: '30-54910283-9', condicionIva: 'Responsable Inscripto', domicilio: 'Ruta 20 Km 4, San Juan', telefono: '+54 264 425-9988', email: 'agro@ypfsanjuan.com.ar', saldo: 0.00, activo: true, cuentaGastoHabitual: '5.1.05 Combustibles a Granel', condicionPago: '30 Días', facturasAdeudadas: [], movimientos: [] }
];

export const mockEmpresa: EmpresaConfig = {
  razonSocial: 'ECAR S. A. S. (Zonda Core)',
  cuit: '30-71875908-7',
  domicilioFiscal: 'Boulevard Sarmiento 550, Villa Krause, San Juan',
  condicionIva: 'Responsable Inscripto',
  ingresosBrutos: '30718759087-09',
  inicioActividades: '01/03/2021',
  puntosVenta: [
    { numero: '0001', descripcion: 'Facturación Electrónica Sede Central', tipoEmision: 'Facturación Electrónica Web Service', activo: true },
    { numero: '0002', descripcion: 'Punto de Venta Sucursal Rawson', tipoEmision: 'Facturación Electrónica Web Service', activo: true },
    { numero: '0003', descripcion: 'Recibos y Cobranzas Móviles', tipoEmision: 'Facturación Electrónica Web Service', activo: true }
  ]
};

export const mockFacturasVenta: ComprobanteVenta[] = [
  {
    id: 'ZON-FV-10492',
    tipo: 'Factura A',
    puntoVenta: '0001',
    numero: '00000412',
    fechaEmision: '2026-10-24',
    fechaVencimiento: '2026-11-23',
    clienteNombre: 'CONSTRUCTORA CUYANA S.R.L.',
    clienteCuit: '30-68912443-4',
    condicionIva: 'Responsable Inscripto',
    netoGravado: 4850000.00,
    iva21: 1018500.00,
    iva105: 0,
    total: 5868500.00,
    estado: 'Aprobado AFIP',
    cae: '74429812409123',
    caeVencimiento: '2026-11-03'
  },
  {
    id: 'ZON-FV-10493',
    tipo: 'Factura A',
    puntoVenta: '0001',
    numero: '00000413',
    fechaEmision: '2026-10-25',
    fechaVencimiento: '2026-11-24',
    clienteNombre: 'HIDRÁULICA Y SERVICIOS SAN JUAN S.A.',
    clienteCuit: '30-71124598-1',
    condicionIva: 'Responsable Inscripto',
    netoGravado: 3200000.00,
    iva21: 672000.00,
    iva105: 0,
    total: 3872000.00,
    estado: 'Aprobado AFIP',
    cae: '74431289547120',
    caeVencimiento: '2026-11-04'
  },
  {
    id: 'ZON-FV-10494',
    tipo: 'Factura B',
    puntoVenta: '0002',
    numero: '00000129',
    fechaEmision: '2026-10-26',
    fechaVencimiento: '2026-10-26',
    clienteNombre: 'Consumidor Final',
    clienteCuit: '00-00000000-0',
    condicionIva: 'Consumidor Final',
    netoGravado: 350000.00,
    iva21: 73500.00,
    iva105: 0,
    total: 423500.00,
    estado: 'Aprobado AFIP',
    cae: '74438901234911',
    caeVencimiento: '2026-11-05'
  },
  {
    id: 'ZON-FV-10495',
    tipo: 'Factura A',
    puntoVenta: '0001',
    numero: '00000414',
    fechaEmision: '2026-10-27',
    fechaVencimiento: '2026-11-26',
    clienteNombre: 'PROVINCIA OBRAS & VIALIDAD S.E.',
    clienteCuit: '30-54678129-9',
    condicionIva: 'Responsable Inscripto',
    netoGravado: 9400000.00,
    iva21: 1974000.00,
    iva105: 0,
    total: 11374000.00,
    estado: 'Pendiente'
  }
];

export const mockFacturasCompra: ComprobanteCompra[] = [
  {
    id: 'ZON-FC-5012',
    tipo: 'Factura A',
    numero: '0004-00018942',
    proveedorNombre: 'HOLCIM ARGENTINA S.A.',
    proveedorCuit: '30-50054231-8',
    fechaComprobante: '2026-10-18',
    fechaImputacion: '2026-10-18',
    cuentaGasto: '5.1.01 Costo de Materiales e Insumos',
    netoGravado: 8450000.00,
    iva: 1774500.00,
    retencionIva: 169000.00,
    retencionIIBB: 126750.00,
    total: 9928750.00,
    estadoPago: 'Pagado Total'
  },
  {
    id: 'ZON-FC-5013',
    tipo: 'Factura A',
    numero: '0012-00004510',
    proveedorNombre: 'TUBERÍAS Y POLIETILENO CUYO S.A.',
    proveedorCuit: '30-70891234-5',
    fechaComprobante: '2026-10-22',
    fechaImputacion: '2026-10-22',
    cuentaGasto: '5.1.02 Materiales de Red PEAD',
    netoGravado: 6120000.00,
    iva: 1285200.00,
    retencionIva: 0,
    retencionIIBB: 91800.00,
    total: 7313400.00,
    estadoPago: 'Pendiente'
  },
  {
    id: 'ZON-FC-5014',
    tipo: 'Factura A',
    numero: '0001-00000912',
    proveedorNombre: 'ENERGÍA SAN JUAN S.A.',
    proveedorCuit: '30-67123984-2',
    fechaComprobante: '2026-10-24',
    fechaImputacion: '2026-10-24',
    cuentaGasto: '5.2.03 Servicios Públicos y Energía',
    netoGravado: 890000.00,
    iva: 240300.00,
    retencionIva: 0,
    retencionIIBB: 13350.00,
    total: 1143650.00,
    estadoPago: 'Pagado Total'
  }
];

export const mockCuentasBancarias: CuentaBancaria[] = [
  {
    id: 'CTA-01',
    nombre: 'CAJA en $',
    banco: 'Caja Fiduciaria',
    tipoCuenta: 'Caja Física',
    moneda: 'ARS',
    saldoActual: -1248683.00,
    saldoConciliado: 0.00,
    conectarDisponible: false,
    movimientos: [
      { id: 'MOV-T01', fecha: '02/09/2026', clienteProveedor: 'LUJAN ERICA ESPINOSA', tipo: 'PAG', nro: '0001-00000051', nroCheque: '', descripcion: '', ingresos: 0.00, egresos: 1570000.00, saldo: -1570000.00 },
      { id: 'MOV-T02', fecha: '04/09/2026', clienteProveedor: 'INDUSTRIAS HORMAT S. A. S.', tipo: 'PAG', nro: '0001-00000052', nroCheque: '', descripcion: '', ingresos: 0.00, egresos: 22500.00, saldo: -1592500.00 },
      { id: 'MOV-T03', fecha: '15/09/2026', clienteProveedor: 'JORGE ERNESTO MIADOSQUI', tipo: 'PAG', nro: '0001-00000017', nroCheque: '', descripcion: '', ingresos: 0.00, egresos: 146183.00, saldo: -1738683.00 },
      { id: 'MOV-T04', fecha: '30/09/2026', clienteProveedor: '', tipo: 'EXE', nro: '1', nroCheque: '', descripcion: 'Extraccion Efectivo', ingresos: 490000.00, egresos: 0.00, saldo: -1248683.00 }
    ]
  },
  {
    id: 'CTA-02',
    nombre: 'Banco Santander',
    banco: 'Banco Santander Río',
    tipoCuenta: 'Cuenta Corriente',
    moneda: 'ARS',
    cbu: '0720194820000001894211',
    saldoActual: -564639.84,
    saldoConciliado: 0.00,
    conectarDisponible: true,
    movimientos: [
      { id: 'MOV-T10', fecha: '10/09/2026', clienteProveedor: 'AFIP DGI', tipo: 'DEB', nro: 'DEB-99120', nroCheque: '', descripcion: 'Débito Impuesto Créditos y Débitos', ingresos: 0.00, egresos: 64639.84, saldo: -564639.84 }
    ]
  },
  {
    id: 'CTA-03',
    nombre: 'Tarjeta de crédito',
    banco: 'Visa Corporativa',
    tipoCuenta: 'Tarjeta',
    moneda: 'ARS',
    saldoActual: 0.00,
    saldoConciliado: 0.00,
    conectarDisponible: false,
    movimientos: []
  },
  {
    id: 'CTA-04',
    nombre: 'Banco Galicia',
    banco: 'Banco Galicia',
    tipoCuenta: 'Cuenta Corriente',
    moneda: 'ARS',
    cbu: '0070112340000049281729',
    saldoActual: -63480709.29,
    saldoConciliado: 0.00,
    conectarDisponible: true,
    movimientos: [
      { id: 'MOV-T20', fecha: '28/09/2026', clienteProveedor: 'PROVINCIA OBRAS S.E.', tipo: 'PAG', nro: '0001-00004120', nroCheque: '', descripcion: 'Pago Proveedor Materiales Obra', ingresos: 0.00, egresos: 12450000.00, saldo: -63480709.29 }
    ]
  },
  {
    id: 'CTA-05',
    nombre: 'Cheques emitidos no debitados',
    banco: 'Valores Propios a Vencer',
    tipoCuenta: 'Cheques',
    moneda: 'ARS',
    saldoActual: -36262371.57,
    saldoConciliado: 0.00,
    conectarDisponible: true,
    movimientos: [
      { id: 'MOV-T30', fecha: '18/10/2026', clienteProveedor: 'HOLCIM ARGENTINA S.A.', tipo: 'CHQ', nro: '00004921', nroCheque: '00004921', descripcion: 'Cheque Diferido Vto 25/11', ingresos: 0.00, egresos: 3950000.00, saldo: -36262371.57 }
    ]
  }
];

export const mockCheques: Cheque[] = [
  {
    id: 'CHQ-001',
    tipo: 'Cheque Terceros (Cartera)',
    numero: '48910231',
    bancoEmisor: 'Banco San Juan',
    librador: 'CONSTRUCTORA CUYANA S.R.L.',
    cuitLibrador: '30-68912443-4',
    fechaEmision: '2026-10-15',
    fechaPago: '2026-11-15',
    importe: 2850000.00,
    estado: 'En Cartera'
  },
  {
    id: 'CHQ-002',
    tipo: 'Cheque Terceros (Cartera)',
    numero: '89123049',
    bancoEmisor: 'Banco Macro',
    librador: 'VALLE FÉRTIL SERVICIOS',
    cuitLibrador: '30-71458921-0',
    fechaEmision: '2026-10-20',
    fechaPago: '2026-11-20',
    importe: 1420000.00,
    estado: 'En Cartera'
  },
  {
    id: 'CHQ-003',
    tipo: 'Cheque Propio Diferido',
    numero: '00004921',
    bancoEmisor: 'Banco Santander',
    librador: 'ECAR S.A.S.',
    cuitLibrador: '30-71875908-7',
    fechaEmision: '2026-10-18',
    fechaPago: '2026-11-25',
    importe: 3950000.00,
    estado: 'Entregado a Proveedor'
  }
];

export const mockPlanDeCuentas: CuentaContable[] = [
  {
    codigo: '1',
    nombre: 'Activo',
    nivel: 1,
    tipo: 'Activo',
    imputable: false,
    saldoInicio: 0.00,
    debito: 116453653.99,
    credito: 83346349.00,
    saldoFinal: 33107304.99,
    saldoDeudor: 33107304.99,
    saldoAcreedor: 0,
    admiteAsientoManual: false,
    saldoHabitual: 'Deudor',
    tipoCuenta: 'Activo Total',
    tituloSumasSaldos: '1 ACTIVO',
    hijos: [
      {
        codigo: '1.1',
        nombre: 'Activo Corriente',
        nivel: 2,
        tipo: 'Activo',
        imputable: false,
        saldoInicio: 0.00,
        debito: 95420100.00,
        credito: 70120300.00,
        saldoFinal: 25299800.00,
        saldoDeudor: 25299800.00,
        saldoAcreedor: 0,
        hijos: [
          {
            codigo: '1.1.01',
            nombre: 'Caja y Bancos',
            nivel: 3,
            tipo: 'Activo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 45120000.00,
            credito: 38250000.00,
            saldoFinal: 6870000.00,
            saldoDeudor: 6870000.00,
            saldoAcreedor: 0,
            admiteAsientoManual: true,
            saldoHabitual: 'Deudor',
            tipoCuenta: 'Disponibilidades',
            tituloSumasSaldos: '1.1 ACTIVO CORRIENTE',
            movimientosMayor: [
              { id: 'MM-01', fecha: '01/10/2026', tipo: 'INI', nro: '0001-00000001', descripcion: 'Asiento de Apertura de Ejercicio', debito: 2500000.00, credito: 0, saldo: 2500000.00 },
              { id: 'MM-02', fecha: '10/10/2026', tipo: 'REC', nro: '0001-00000412', descripcion: 'Cobranza Constructora Cuyana Factura A', debito: 5868500.00, credito: 0, saldo: 8368500.00 },
              { id: 'MM-03', fecha: '15/10/2026', tipo: 'PAG', nro: '0001-00000189', descripcion: 'Pago Factura Compra Estacion Central SAS', debito: 0, credito: 6423500.00, saldo: 1945000.00 },
              { id: 'MM-04', fecha: '22/10/2026', tipo: 'DEP', nro: '0002-00008910', descripcion: 'Depósito en Efectivo Recaudación en Santander', debito: 4925000.00, credito: 0, saldo: 6870000.00 }
            ]
          },
          {
            codigo: '1.1.02',
            nombre: 'Créditos por Ventas (Clientes)',
            nivel: 3,
            tipo: 'Activo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 38500000.00,
            credito: 25400000.00,
            saldoFinal: 13100000.00,
            saldoDeudor: 13100000.00,
            saldoAcreedor: 0,
            admiteAsientoManual: true,
            saldoHabitual: 'Deudor',
            tipoCuenta: 'Créditos Operativos',
            tituloSumasSaldos: '1.1 ACTIVO CORRIENTE'
          },
          {
            codigo: '1.1.03',
            nombre: 'Bienes de Cambio (Inventario)',
            nivel: 3,
            tipo: 'Activo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 11800100.00,
            credito: 6470300.00,
            saldoFinal: 5329800.00,
            saldoDeudor: 5329800.00,
            saldoAcreedor: 0,
            admiteAsientoManual: true,
            saldoHabitual: 'Deudor',
            tipoCuenta: 'Inventario de Materiales',
            tituloSumasSaldos: '1.1 ACTIVO CORRIENTE'
          }
        ]
      },
      {
        codigo: '1.2',
        nombre: 'Activo No Corriente',
        nivel: 2,
        tipo: 'Activo',
        imputable: false,
        saldoInicio: 0.00,
        debito: 21033553.99,
        credito: 13226049.00,
        saldoFinal: 7807504.99,
        saldoDeudor: 7807504.99,
        saldoAcreedor: 0,
        hijos: [
          {
            codigo: '1.2.01',
            nombre: 'Bienes de Uso y Maquinarias',
            nivel: 3,
            tipo: 'Activo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 21033553.99,
            credito: 13226049.00,
            saldoFinal: 7807504.99,
            saldoDeudor: 7807504.99,
            saldoAcreedor: 0
          }
        ]
      }
    ]
  },
  {
    codigo: '2',
    nombre: 'Pasivo',
    nivel: 1,
    tipo: 'Pasivo',
    imputable: false,
    saldoInicio: 0.00,
    debito: 152317105.39,
    credito: 191769846.10,
    saldoFinal: -39452740.71,
    saldoDeudor: 0,
    saldoAcreedor: 39452740.71,
    admiteAsientoManual: false,
    saldoHabitual: 'Acreedor',
    tipoCuenta: 'Pasivo Total',
    tituloSumasSaldos: '2 PASIVO',
    hijos: [
      {
        codigo: '2.1',
        nombre: 'Pasivo Corriente',
        nivel: 2,
        tipo: 'Pasivo',
        imputable: false,
        saldoInicio: 0.00,
        debito: 152317105.39,
        credito: 191769846.10,
        saldoFinal: -39452740.71,
        saldoDeudor: 0,
        saldoAcreedor: 39452740.71,
        hijos: [
          {
            codigo: '2.1.01',
            nombre: 'Proveedores Comerciales',
            nivel: 3,
            tipo: 'Pasivo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 98450000.00,
            credito: 125680000.00,
            saldoFinal: -27230000.00,
            saldoDeudor: 0,
            saldoAcreedor: 27230000.00
          },
          {
            codigo: '2.1.02',
            nombre: 'Cargas Fiscales e IVA',
            nivel: 3,
            tipo: 'Pasivo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 32417105.39,
            credito: 42589846.10,
            saldoFinal: -10172740.71,
            saldoDeudor: 0,
            saldoAcreedor: 10172740.71
          },
          {
            codigo: '2.1.03',
            nombre: 'Deudas Bancarias y Préstamos',
            nivel: 3,
            tipo: 'Pasivo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 21450000.00,
            credito: 23500000.00,
            saldoFinal: -2050000.00,
            saldoDeudor: 0,
            saldoAcreedor: 2050000.00
          }
        ]
      }
    ]
  },
  {
    codigo: '3',
    nombre: 'Patrimonio Neto',
    nivel: 1,
    tipo: 'Patrimonio Neto',
    imputable: false,
    saldoInicio: 0.00,
    debito: 0.00,
    credito: 0.00,
    saldoFinal: 0.00,
    saldoDeudor: 0,
    saldoAcreedor: 0,
    admiteAsientoManual: false,
    saldoHabitual: 'Acreedor',
    tipoCuenta: 'Patrimonio',
    tituloSumasSaldos: '3 PATRIMONIO NETO',
    hijos: [
      {
        codigo: '3.1',
        nombre: 'Capital Social Suscripto',
        nivel: 2,
        tipo: 'Patrimonio Neto',
        imputable: true,
        saldoInicio: 0.00,
        debito: 0.00,
        credito: 0.00,
        saldoFinal: 0.00,
        saldoDeudor: 0,
        saldoAcreedor: 0
      }
    ]
  },
  {
    codigo: '4',
    nombre: 'Resultados',
    nivel: 1,
    tipo: 'Resultados',
    imputable: false,
    saldoInicio: 0.00,
    debito: 20859879.93,
    credito: 14514444.17,
    saldoFinal: 6345435.76,
    saldoDeudor: 6345435.76,
    saldoAcreedor: 0,
    admiteAsientoManual: false,
    saldoHabitual: 'Deudor',
    tipoCuenta: 'Resultados del Ejercicio',
    tituloSumasSaldos: '4 RESULTADOS',
    hijos: [
      {
        codigo: '4.1',
        nombre: 'Ingresos por Ventas',
        nivel: 2,
        tipo: 'Resultado Positivo',
        imputable: true,
        saldoInicio: 0.00,
        debito: 0.00,
        credito: 14514444.17,
        saldoFinal: -14514444.17,
        saldoDeudor: 0,
        saldoAcreedor: 14514444.17
      },
      {
        codigo: '5.1',
        nombre: 'Costos y Gastos Operativos',
        nivel: 2,
        tipo: 'Resultado Negativo',
        imputable: true,
        saldoInicio: 0.00,
        debito: 20859879.93,
        credito: 0.00,
        saldoFinal: 20859879.93,
        saldoDeudor: 20859879.93,
        saldoAcreedor: 0,
        hijos: [
          {
            codigo: '5.1.01',
            nombre: 'Materiales e Insumos',
            nivel: 3,
            tipo: 'Resultado Negativo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 8450000.00,
            credito: 0.00,
            saldoFinal: 8450000.00,
            saldoDeudor: 8450000.00,
            saldoAcreedor: 0,
            admiteAsientoManual: true,
            saldoHabitual: 'Deudor',
            tipoCuenta: 'Costos Directos de Obra'
          },
          {
            codigo: '5.1.02',
            nombre: 'Combustibles y Lubricantes',
            nivel: 3,
            tipo: 'Resultado Negativo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 2950000.00,
            credito: 0.00,
            saldoFinal: 2950000.00,
            saldoDeudor: 2950000.00,
            saldoAcreedor: 0,
            admiteAsientoManual: true,
            saldoHabitual: 'Deudor',
            tipoCuenta: 'Costos Operativos de Flota'
          },
          {
            codigo: '5.1.03',
            nombre: 'Materiales de Red PEAD',
            nivel: 3,
            tipo: 'Resultado Negativo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 6120000.00,
            credito: 0.00,
            saldoFinal: 6120000.00,
            saldoDeudor: 6120000.00,
            saldoAcreedor: 0,
            admiteAsientoManual: true,
            saldoHabitual: 'Deudor',
            tipoCuenta: 'Costos Directos de Obra'
          },
          {
            codigo: '5.2.01',
            nombre: 'Servicios Públicos y Energía',
            nivel: 3,
            tipo: 'Resultado Negativo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 890000.00,
            credito: 0.00,
            saldoFinal: 890000.00,
            saldoDeudor: 890000.00,
            saldoAcreedor: 0,
            admiteAsientoManual: true,
            saldoHabitual: 'Deudor',
            tipoCuenta: 'Gastos de Estructura'
          },
          {
            codigo: '5.2.02',
            nombre: 'Alquiler de Maquinaria y Equipos',
            nivel: 3,
            tipo: 'Resultado Negativo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 1650000.00,
            credito: 0.00,
            saldoFinal: 1650000.00,
            saldoDeudor: 1650000.00,
            saldoAcreedor: 0,
            admiteAsientoManual: true,
            saldoHabitual: 'Deudor',
            tipoCuenta: 'Costos Directos de Obra'
          },
          {
            codigo: '5.2.03',
            nombre: 'Honorarios y Servicios Técnicos',
            nivel: 3,
            tipo: 'Resultado Negativo',
            imputable: true,
            saldoInicio: 0.00,
            debito: 799879.93,
            credito: 0.00,
            saldoFinal: 799879.93,
            saldoDeudor: 799879.93,
            saldoAcreedor: 0,
            admiteAsientoManual: true,
            saldoHabitual: 'Deudor',
            tipoCuenta: 'Gastos Administrativos'
          }
        ]
      }
    ]
  },
  {
    codigo: '99',
    nombre: 'Totales',
    nivel: 1,
    tipo: 'Totales',
    imputable: false,
    saldoInicio: 0.00,
    debito: 289630639.22,
    credito: 289630639.22,
    saldoFinal: 0.00,
    saldoDeudor: 0,
    saldoAcreedor: 0,
    admiteAsientoManual: false,
    saldoHabitual: 'Deudor',
    tipoCuenta: 'Balance General Cuadrado',
    tituloSumasSaldos: 'TOTALES'
  }
];

export const mockAsientosContables: AsientoContable[] = [
  {
    numero: 4091,
    fecha: '2026-10-24',
    concepto: 'Emisión Factura A 0001-00000412 - CONSTRUCTORA CUYANA',
    tipoOrigen: 'Ventas',
    renglones: [
      { cuentaCodigo: '1.1.05', cuentaNombre: 'Deudores por Ventas (Clientes)', debe: 5868500.00, haber: 0 },
      { cuentaCodigo: '4.1.01', cuentaNombre: 'Ventas de Obras y Servicios de Red', debe: 0, haber: 4850000.00 },
      { cuentaCodigo: '2.1.03', cuentaNombre: 'IVA Débito Fiscal', debe: 0, haber: 1018500.00 }
    ],
    totalDebe: 5868500.00,
    totalHaber: 5868500.00
  },
  {
    numero: 4092,
    fecha: '2026-10-22',
    concepto: 'Recepción Factura A 0012-00004510 - TUBERÍAS Y POLIETILENO CUYO',
    tipoOrigen: 'Compras',
    renglones: [
      { cuentaCodigo: '5.1.02', cuentaNombre: 'Materiales de Red PEAD', debe: 6120000.00, haber: 0 },
      { cuentaCodigo: '1.1.06', cuentaNombre: 'IVA Crédito Fiscal', debe: 1285200.00, haber: 0 },
      { cuentaCodigo: '2.1.01', cuentaNombre: 'Proveedores Comerciales', debe: 0, haber: 7313400.00 },
      { cuentaCodigo: '2.1.04', cuentaNombre: 'Retenciones IIBB a Depositar', debe: 0, haber: 91800.00 }
    ],
    totalDebe: 7405200.00,
    totalHaber: 7405200.00
  }
];

export const mockInventario: ArticuloInventario[] = [
  {
    id: 'INV-005',
    codigo: '000005',
    sku: '000005',
    descripcion: 'ADAPTADOR BRIDA PEAD 090 MM',
    tipo: 'P',
    um: '1',
    categoria: 'Accesorios PEAD',
    unidadMedida: 'Unidad',
    disponible: 3.00,
    stockActual: 3.00,
    stockMinimo: 1.00,
    costoCalculado: 16284.30,
    precioVentaNeto: 16284.30,
    alicuotaIva: 21,
    deposito: 'Depósito Central San Juan',
    movimientos: [
      { id: 'MOV-INV-01', fecha: '2026-10-12', deposito: 'Depósito Central', descripcion: 'Factura Compra A 0001-00004120 - ALEJANDRO LUL', tipoDoc: 'FAC', precio: 16284.30, cantidad: 5.00 },
      { id: 'MOV-INV-02', fecha: '2026-10-18', deposito: 'Depósito Central', descripcion: 'Remito Salida R-0001-00000189 - Obra Rawson', tipoDoc: 'REM', precio: 16284.30, cantidad: -2.00 }
    ]
  },
  {
    id: 'INV-006',
    codigo: '000006',
    sku: '000006',
    descripcion: 'BRIDA + ADAPTADOR A PEGAR 75',
    tipo: 'P',
    um: '1',
    categoria: 'Accesorios PVC',
    unidadMedida: 'Unidad',
    disponible: 1.00,
    stockActual: 1.00,
    stockMinimo: 1.00,
    costoCalculado: 8165.325,
    precioVentaNeto: 8165.325,
    alicuotaIva: 21,
    deposito: 'Depósito Central San Juan',
    movimientos: [
      { id: 'MOV-INV-03', fecha: '2026-09-28', deposito: 'Depósito Central', descripcion: 'Factura Compra A 0003-00019283 - DECOM SA', tipoDoc: 'FAC', precio: 8165.325, cantidad: 1.00 }
    ]
  },
  {
    id: 'INV-003',
    codigo: '000003',
    sku: '000003',
    descripcion: 'CAL ALBORS',
    tipo: 'P',
    um: '1',
    categoria: 'Materiales Básicos',
    unidadMedida: 'Bolsa',
    disponible: 5.00,
    stockActual: 5.00,
    stockMinimo: 2.00,
    costoCalculado: 3900.00,
    precioVentaNeto: 3900.00,
    alicuotaIva: 21,
    deposito: 'Depósito Central San Juan',
    movimientos: [
      { id: 'MOV-INV-04', fecha: '2026-10-02', deposito: 'Depósito Central', descripcion: 'Factura Compra A 0004-00001289 - JUAN CARLOS ROJO', tipoDoc: 'FAC', precio: 3900.00, cantidad: 10.00 },
      { id: 'MOV-INV-05', fecha: '2026-10-15', deposito: 'Depósito Central', descripcion: 'Consumo Directo Mantenimiento Interno', tipoDoc: 'AJU', precio: 3900.00, cantidad: -5.00 }
    ]
  },
  {
    id: 'INV-002',
    codigo: '000002',
    sku: '000002',
    descripcion: 'CEMENTO X 25 KG HOLCIM',
    tipo: 'P',
    um: '1',
    categoria: 'Materiales Básicos',
    unidadMedida: 'Bolsa',
    disponible: 50.00,
    stockActual: 50.00,
    stockMinimo: 20.00,
    costoCalculado: 4627.93,
    precioVentaNeto: 4627.93,
    alicuotaIva: 21,
    deposito: 'Depósito Central San Juan',
    movimientos: [
      { id: 'MOV-INV-06', fecha: '2026-09-15', deposito: 'Depósito Central', descripcion: 'Factura Compra A 0008-00041289 - ESTACION CENTRAL', tipoDoc: 'FAC', precio: 4627.93, cantidad: 100.00 },
      { id: 'MOV-INV-07', fecha: '2026-10-05', deposito: 'Depósito Central', descripcion: 'Despacho Obra Barrio Rivadavia', tipoDoc: 'REM', precio: 4627.93, cantidad: -50.00 }
    ]
  },
  {
    id: 'INV-001',
    codigo: '000001',
    sku: '000001',
    descripcion: 'MATERIAL BASE',
    tipo: 'P',
    um: '1',
    categoria: 'Insumos Generales',
    unidadMedida: 'Unidad',
    disponible: 1.00,
    stockActual: 1.00,
    stockMinimo: 1.00,
    costoCalculado: 1.00,
    precioVentaNeto: 1.00,
    alicuotaIva: 21,
    deposito: 'Depósito Central San Juan',
    movimientos: [
      { id: 'MOV-INV-08', fecha: '2026-01-01', deposito: 'Depósito Central', descripcion: 'Carga de Inventario Inicial Apertura de Ejercicio', tipoDoc: 'INI', precio: 1.00, cantidad: 1.00 }
    ]
  }
];

export const mockEmpleados: EmpleadoLegajo[] = [
  {
    id: 'EMP-101',
    legajo: '980',
    cuil: '20-37298023-1',
    nombreCompleto: 'MARINERO , LUCAS MAXIMILIANO',
    cct: 'CCT 122/75 (Sanidad - Clínicas y Sanatorios)',
    categoria: 'ADMINISTRATIVO DE 1°',
    fechaIngreso: '02/02/2026',
    antiguedadAnios: 1,
    banco: 'Banco Supervielle Societe Generale SA',
    cbu: '0270084520000049281721',
    modalidadContratacion: 'Tiempo Indeterminado (CCT 122/75)',
    sueldoBasico: 1161824.99,
    activo: true,
    conceptosLiquidacion: [
      { codigo: '100', codigoAfipLsd: '110000', descripcion: 'SUELDO', unidades: '', tipo: 'Remunerativo', remunerativo: 1161824.99, noRemunerativo: 0, descuento: 0 },
      { codigo: '240', codigoAfipLsd: '130000', descripcion: 'ADIC CUMPLIMIENTO DE OBJETIVOS', unidades: '', tipo: 'Remunerativo', remunerativo: 2323792.60, noRemunerativo: 0, descuento: 0 },
      { codigo: '19001', codigoAfipLsd: '190000', descripcion: 'Excepcionalidad cláusula 4', unidades: '', tipo: 'Remunerativo', remunerativo: -1219966.16, noRemunerativo: 0, descuento: 0 },
      { codigo: '20000', codigoAfipLsd: '810000', descripcion: 'JUBILACION 11%', unidades: '', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 249221.66 },
      { codigo: '20001', codigoAfipLsd: '810001', descripcion: 'LEY 19.032 3%', unidades: '', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 67969.54 },
      { codigo: '20002', codigoAfipLsd: '810002', descripcion: 'OBRA SOCIAL 3%', unidades: '', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 104568.53 },
      { codigo: '20004', codigoAfipLsd: '820000', descripcion: 'APORTE SOLIDARIO CCT 1%', unidades: '', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 34856.18 },
      { codigo: '20006', codigoAfipLsd: '820001', descripcion: 'SEGURO DE VIDA', unidades: '', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 4.00 },
      { codigo: '40206', codigoAfipLsd: '990000', descripcion: 'Refrigerio y lavado', unidades: '', tipo: 'No Remunerativo', remunerativo: 0, noRemunerativo: 51920.76, descuento: 0 },
      { codigo: '40525', codigoAfipLsd: '990000', descripcion: 'Excepcionalidad cláusula 4 no rem', unidades: '', tipo: 'No Remunerativo', remunerativo: 0, noRemunerativo: 1219966.16, descuento: 0 },
      { codigo: '40526', codigoAfipLsd: '990000', descripcion: 'Asig. No rem. Paritaria', unidades: '', tipo: 'No Remunerativo', remunerativo: 0, noRemunerativo: 90000.00, descuento: 0 }
    ]
  },
  {
    id: 'EMP-102',
    legajo: '102',
    cuil: '27-35891204-8',
    nombreCompleto: 'MARIANA INÉS GÓMEZ',
    cct: 'CCT 130/75 (Comercio y Servicios)',
    categoria: 'Administrativo B - Cuentas por Cobrar',
    fechaIngreso: '15/09/2022',
    antiguedadAnios: 4,
    banco: 'Banco Galicia',
    cbu: '0070112340000088192014',
    modalidadContratacion: 'Tiempo Indeterminado',
    sueldoBasico: 520000.00,
    activo: true,
    conceptosLiquidacion: [
      { codigo: '101', codigoAfipLsd: '110000', descripcion: 'Sueldo Básico Administrativo B', unidades: '30 días', tipo: 'Remunerativo', remunerativo: 520000.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '102', codigoAfipLsd: '120000', descripcion: 'Antigüedad (4% acumulado)', unidades: '4 años', tipo: 'Remunerativo', remunerativo: 20800.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '103', codigoAfipLsd: '130000', descripcion: 'Asistencia y Puntualidad (Art. 40 CCT 130/75)', unidades: '8.33%', tipo: 'Remunerativo', remunerativo: 45048.60, noRemunerativo: 0, descuento: 0 },
      { codigo: '201', codigoAfipLsd: '990000', descripcion: 'Incremento No Remunerativo FAECYS', unidades: 'Fijo', tipo: 'No Remunerativo', remunerativo: 0, noRemunerativo: 60000.00, descuento: 0 },
      { codigo: '301', codigoAfipLsd: '810000', descripcion: 'Aporte Jubilatorio SIPA 11%', unidades: '11%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 64443.35 },
      { codigo: '302', codigoAfipLsd: '810001', descripcion: 'Aporte INSSJyP 3%', unidades: '3%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 17575.46 },
      { codigo: '303', codigoAfipLsd: '810002', descripcion: 'Aporte Obra Social OSECAC 3%', unidades: '3%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 17575.46 },
      { codigo: '304', codigoAfipLsd: '820000', descripcion: 'Cuota Sindical SEC', unidades: '2%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 11716.97 }
    ]
  },
  {
    id: 'EMP-103',
    legajo: '103',
    cuil: '20-28914029-3',
    nombreCompleto: 'DR. GONZALO MORALES',
    cct: 'CCT 122/75 (Sanidad - Clínicas y Sanatorios)',
    categoria: 'Médico Clínico de Guardia Sanatorial',
    fechaIngreso: '01/06/2018',
    antiguedadAnios: 8,
    banco: 'Banco San Juan',
    cbu: '0450112340000099120481',
    modalidadContratacion: 'Tiempo Indeterminado Sanidad',
    sueldoBasico: 980000.00,
    activo: true,
    conceptosLiquidacion: [
      { codigo: '101', codigoAfipLsd: '110000', descripcion: 'Sueldo Básico Profesional Médico', unidades: '30 días', tipo: 'Remunerativo', remunerativo: 980000.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '102', codigoAfipLsd: '120000', descripcion: 'Antigüedad Profesional (8 años)', unidades: '16%', tipo: 'Remunerativo', remunerativo: 156800.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '103', codigoAfipLsd: '120001', descripcion: 'Adicional Título Universitario Habilitante', unidades: '20%', tipo: 'Remunerativo', remunerativo: 196000.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '104', codigoAfipLsd: '130000', descripcion: 'Módulo Guardias Críticas / Cuidados Especiales', unidades: 'Fijo', tipo: 'Remunerativo', remunerativo: 180000.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '201', codigoAfipLsd: '990000', descripcion: 'Asignación No Remunerativa FATSA Sanidad', unidades: 'Acuerdo', tipo: 'No Remunerativo', remunerativo: 0, noRemunerativo: 100000.00, descuento: 0 },
      { codigo: '301', codigoAfipLsd: '810000', descripcion: 'Aporte SIPA 11%', unidades: '11%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 166408.00 },
      { codigo: '302', codigoAfipLsd: '810001', descripcion: 'Aporte INSSJyP 3%', unidades: '3%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 45384.00 },
      { codigo: '303', codigoAfipLsd: '810002', descripcion: 'Obra Social del Personal de Sanidad (OSPSA)', unidades: '3%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 45384.00 },
      { codigo: '304', codigoAfipLsd: '820000', descripcion: 'Aporte Sindical ATSA San Juan', unidades: '2%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 30256.00 },
      { codigo: '305', codigoAfipLsd: '830000', descripcion: 'Retención Impuesto a las Ganancias 4ta Categoría', unidades: 'AFIP', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 84200.00 }
    ]
  },
  {
    id: 'EMP-104',
    legajo: '104',
    cuil: '20-31849102-1',
    nombreCompleto: 'ROBERTO CARLOS ALBARRACÍN',
    cct: 'CCT 76/75 (UOCRA - Construcción)',
    categoria: 'Ayudante de Cuadrilla de Redes',
    fechaIngreso: '10/01/2023',
    antiguedadAnios: 3,
    banco: 'Banco Santander Río',
    cbu: '0720112340000077890123',
    modalidadContratacion: 'Tiempo Indeterminado (CCT 76/75)',
    sueldoBasico: 420000.00,
    activo: true,
    conceptosLiquidacion: [
      { codigo: '101', codigoAfipLsd: '110000', descripcion: 'Sueldo Básico Ayudante', unidades: '30 días', tipo: 'Remunerativo', remunerativo: 420000.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '102', codigoAfipLsd: '130000', descripcion: 'Asistencia Perfecta (20%)', unidades: '20%', tipo: 'Remunerativo', remunerativo: 84000.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '103', codigoAfipLsd: '130001', descripcion: 'Horas Extras 50% (12 hs en Obra)', unidades: '12 hs', tipo: 'Remunerativo', remunerativo: 47250.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '201', codigoAfipLsd: '990000', descripcion: 'Suma No Remunerativa UOCRA', unidades: 'Fijo', tipo: 'No Remunerativo', remunerativo: 0, noRemunerativo: 60000.00, descuento: 0 },
      { codigo: '301', codigoAfipLsd: '810000', descripcion: 'SIPA 11%', unidades: '11%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 60637.50 },
      { codigo: '302', codigoAfipLsd: '810001', descripcion: 'INSSJyP 3%', unidades: '3%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 16537.50 },
      { codigo: '303', codigoAfipLsd: '810002', descripcion: 'OSPECON 3%', unidades: '3%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 16537.50 },
      { codigo: '304', codigoAfipLsd: '820000', descripcion: 'Cuota Sindical UOCRA', unidades: '2.5%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 13781.25 }
    ]
  },
  {
    id: 'EMP-105',
    legajo: '105',
    cuil: '20-25891204-9',
    nombreCompleto: 'ING. FEDERICO CARRIZO',
    cct: 'Fuera de Convenio (Dirección)',
    categoria: 'Director Técnico de Obras y Proyectos',
    fechaIngreso: '01/02/2019',
    antiguedadAnios: 7,
    banco: 'Banco Santander Río',
    cbu: '0720112340000011289045',
    modalidadContratacion: 'Personal Fuera de Convenio',
    sueldoBasico: 1850000.00,
    activo: true,
    conceptosLiquidacion: [
      { codigo: '101', codigoAfipLsd: '110000', descripcion: 'Sueldo Básico de Dirección', unidades: '30 días', tipo: 'Remunerativo', remunerativo: 1850000.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '102', codigoAfipLsd: '120000', descripcion: 'Adicional Responsabilidad y Cargo Jerárquico', unidades: 'Fijo', tipo: 'Remunerativo', remunerativo: 370000.00, noRemunerativo: 0, descuento: 0 },
      { codigo: '301', codigoAfipLsd: '810000', descripcion: 'Aporte Jubilatorio SIPA (Tope Legal AFIP)', unidades: '11%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 244200.00 },
      { codigo: '302', codigoAfipLsd: '810001', descripcion: 'Aporte INSSJyP 3%', unidades: '3%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 66600.00 },
      { codigo: '303', codigoAfipLsd: '810002', descripcion: 'Aporte Obra Social / Prepaga OSDE', unidades: '3%', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 66600.00 },
      { codigo: '305', codigoAfipLsd: '830000', descripcion: 'Retención Impuesto a las Ganancias 4ta Categoría', unidades: 'AFIP', tipo: 'Descuento', remunerativo: 0, noRemunerativo: 0, descuento: 210000.00 }
    ]
  }
];

export const mockLiquidacionActual: LiquidacionPeriodo = {
  periodo: '202610',
  tipoLiquidacion: 'Mensual',
  numeroLiquidacion: 1,
  fechaPago: '2026-11-04',
  totalBruto: 6014898.60,
  totalRetenciones: 1254617.99,
  totalNeto: 4760280.61,
  totalContribucionesPatronales: 1443575.66,
  empleadosCount: 5
};

