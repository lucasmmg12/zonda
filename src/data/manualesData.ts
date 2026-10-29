export interface PasoManual {
  numero: number;
  titulo: string;
  descripcion: string;
  accionClave?: string;
  impactoContableODb?: string;
}

export interface PreguntaFrecuenteManual {
  pregunta: string;
  respuesta: string;
}

export interface SeccionManual {
  id: string;
  codigo: string;
  titulo: string;
  subtitulo: string;
  moduloRelacionado: string;
  tablasSupabase: string[];
  resumenEjecutivo: string;
  funcionesPrincipales: string[];
  pasosOperativos: PasoManual[];
  reglasDeNegocioYValidaciones: string[];
  preguntasFrecuentes: PreguntaFrecuenteManual[];
  comandosOSnippets?: {
    titulo: string;
    codigo: string;
  }[];
}

export const MANUALES_ZONDA_ERP: SeccionManual[] = [
  {
    id: 'dashboard',
    codigo: 'MAN-01',
    titulo: 'Tablero de Control (Dashboard) & Auditoría Diaria',
    subtitulo: 'Monitoreo ejecutivo de KPIs financieros, flujo de caja y accesos rápidos operativos',
    moduloRelacionado: 'Tablero Principal',
    tablasSupabase: [
      'erp_comprobantes_venta',
      'erp_comprobantes_compra',
      'erp_cuentas_bancarias',
      'erp_cheques',
      'erp_asientos_contables'
    ],
    resumenEjecutivo:
      'El Tablero de Control centraliza en tiempo real los indicadores críticos de la empresa calculados directamente desde Supabase PostgreSQL: Facturación Neta Mensual, Compras Acumuladas, Cuentas por Cobrar, Cuentas por Pagar y Disponibilidades en Cajas y Bancos.',
    funcionesPrincipales: [
      'KPIs en vivo: Facturación del período, Gastos/Compras, Saldo Pendiente de Cobro (Clientes) y Saldo Pendiente de Pago (Proveedores).',
      'Gráfico comparativo de Ingresos vs. Egresos con filtro temporal (6 Meses, Trimestre, Año Completo).',
      'Evolución de liquidez en Cajas, Bancos y Billeteras Virtuales (Mercado Pago).',
      'Botones de Acción Directa para emitir Nueva Factura de Venta, Cargar Compra o navegar a cualquier módulo.',
      'Exportación del Resumen Ejecutivo en formato PDF o CSV (Excel).'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Verificar el estado de conexión con Supabase y Servicios Externos',
        descripcion:
          'En la barra superior (Header), confirme que el indicador muestre "SUPABASE DB: ONLINE" en color verde esmeralda. Allí también verá el estado de WS-AFIP (ARCA) y Mercado Pago.',
        accionClave: 'Haga clic en "SUPABASE DB: ONLINE" en cualquier momento para forzar una resincronización instantánea.',
        impactoContableODb: 'Refresca en memoria las 14 tablas productivas de Supabase.'
      },
      {
        numero: 2,
        titulo: 'Analizar brecha financiera (Cuentas a Cobrar vs. Cuentas a Pagar)',
        descripcion:
          'Revise las tarjetas superiores de "Facturas a Cobrar" y "Facturas a Pagar". Si desea ver el detalle nominal de quién debe o a quién se le adeuda, haga clic directamente sobre la tarjeta correspondiente.',
        accionClave: 'Click en tarjeta KPI -> Navegación automática a Clientes o Proveedores.',
        impactoContableODb: 'Consulta en vivo de saldos pendientes en erp_clientes y erp_proveedores.'
      },
      {
        numero: 3,
        titulo: 'Exportar el Reporte Gerencial del Día',
        descripcion:
          'Utilice el botón superior de exportación para descargar o imprimir en PDF el estado financiero consolidado para reuniones de directorio o auditoría.',
        accionClave: 'Botón "Exportar Resumen / Imprimir PDF".',
        impactoContableODb: 'Genera documento con membrete oficial y razón social de erp_empresa.'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'Todos los importes del Dashboard se expresan en Pesos Argentinos (ARS) con formato contable local.',
      'Las facturas anuladas o rechazadas no suman en los indicadores de facturación activa.',
      'El saldo de disponibilidades suma únicamente cuentas activas en erp_cuentas_bancarias.'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Por qué cambia automáticamente el gráfico de Ingresos al emitir una factura?',
        respuesta:
          'Porque el Tablero está suscripto al contexto reactivo ErpContext conectado a Supabase: cada factura emitida o cobro registrado recalcula los KPIs al instante.'
      }
    ]
  },
  {
    id: 'clientes',
    codigo: 'MAN-02',
    titulo: 'Clientes, Facturación Electrónica (ARCA CAE) y Cobranzas',
    subtitulo: 'Gestión de padrón de clientes, emisión de Facturas A/B/C con CAE oficial, cobros por QR/Link y Cuenta Corriente',
    moduloRelacionado: 'Clientes',
    tablasSupabase: [
      'erp_clientes',
      'erp_comprobantes_venta',
      'erp_cuentas_bancarias',
      'erp_cheques',
      'erp_asientos_contables',
      'erp_webhooks_log'
    ],
    resumenEjecutivo:
      'El módulo de Clientes administra el ciclo completo de ingresos (Order-to-Cash): alta de clientes con validación de CUIT, emisión de comprobantes electrónicos autorizados ante ARCA (ex-AFIP) con otorgamiento de CAE, generación de Links y QR de cobro con Mercado Pago, e imputación de recibos de cobranza.',
    funcionesPrincipales: [
      'Padrón de Clientes con alta rápida, condición frente al IVA y estado de Cuenta Corriente.',
      'Emisión de Facturas A, Facturas B, Facturas C, Notas de Crédito y Notas de Débito.',
      'Obtención automática de CAE (14 dígitos) y fecha de vencimiento vía Web Service ARCA (WSFEv1).',
      'Generación de Cobro Digital con Mercado Pago (Checkout Pro Link + QR Interoperable Transferencias 3.0).',
      'Registro de Cobranzas (Efectivo, Transferencia Bancaria, Cheque de Terceros o Mercado Pago) con impacto automático en Tesorería y Contabilidad.',
      'Descarga de Comprobantes en PDF y exportación de padrón/facturas a Excel (CSV).'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Dar de alta un Nuevo Cliente',
        descripcion:
          'Presione el botón "+ Nuevo Cliente", ingrese Razón Social, CUIT (formato XX-XXXXXXXX-X), Condición de IVA (Responsable Inscripto, Monotributo, Exento, Consumidor Final) y correo electrónico.',
        accionClave: 'Botón "+ Nuevo Cliente" -> Guardar en Supabase.',
        impactoContableODb: 'Inserta registro en public.erp_clientes con saldo inicial $0,00.'
      },
      {
        numero: 2,
        titulo: 'Emitir una Factura Electrónica con CAE de ARCA (ex-AFIP)',
        descripcion:
          'Haga clic en "+ Nueva Factura de Venta". Seleccione el Cliente, el Tipo de Comprobante (ej. Factura A o B), Punto de Venta (ej. 0001), agregue los ítems o conceptos con su alícuota de IVA (21%, 10.5% o 0%) y presione "Emitir y Autorizar CAE".',
        accionClave: 'Botón "Emitir Factura" en el modal de facturación.',
        impactoContableODb:
          '1) Invoca la Edge Function arca-wsfe para obtener el CAE. 2) Guarda la factura en erp_comprobantes_venta. 3) Incrementa el saldo deudor del cliente en erp_clientes. 4) Genera el asiento automático (Deudores por Ventas a Ventas + IVA Débito Fiscal) en erp_asientos_contables.'
      },
      {
        numero: 3,
        titulo: 'Cobrar una Factura con QR o Link de Mercado Pago',
        descripcion:
          'En el listado de comprobantes o desde la fila del cliente, haga clic en el ícono de Mercado Pago / QR. El sistema crea la preferencia de pago inyectando automáticamente la URL del Webhook de Zonda ERP.',
        accionClave: 'Botón "Cobrar con QR / Link MP" o "Registrar Cobro".',
        impactoContableODb:
          'Cuando el cliente paga (o al registrar el cobro), disminuye el saldo en erp_clientes, suma el dinero en erp_cuentas_bancarias, cambia el estado de la factura a "Pagada" y asienta Caja/Bancos a Deudores por Ventas.'
      },
      {
        numero: 4,
        titulo: 'Registrar un Cobro con Cheque de Terceros o Transferencia',
        descripcion:
          'Presione "Registrar Cobro", elija el cliente, ingrese el importe y seleccione el medio de cobro. Si elige "Cheque de Terceros", complete banco emisor y número de cheque para que ingrese automáticamente a la cartera de Tesorería.',
        accionClave: 'Modal Registrar Cobro -> Confirmar Recibo X.',
        impactoContableODb: 'Si es cheque, inserta además el valor en public.erp_cheques con estado "En Cartera".'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'A un cliente "Responsable Inscripto" corresponde emitirle Factura A; a "Consumidor Final", "Exento" o "Monotributo" corresponde Factura B.',
      'Todo comprobante autorizado recibe un CAE único de 14 dígitos y vencimiento a 10 días corridos.',
      'Cada venta y cada cobro genera su respectivo asiento contable balanceado (Debe = Haber) sin intervención manual.'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Puedo imprimir o enviar por correo la factura emitida?',
        respuesta:
          'Sí. Desde la tabla de comprobantes puede hacer clic en el botón de impresión/PDF para abrir el comprobante fiscal listo para imprimir o guardar como PDF con su CAE y código QR.'
      }
    ]
  },
  {
    id: 'proveedores',
    codigo: 'MAN-03',
    titulo: 'Proveedores, Compras, Retenciones y Órdenes de Pago',
    subtitulo: 'Administración de compras, devengamiento de gastos,IVA Crédito Fiscal y cancelación de pasivos',
    moduloRelacionado: 'Proveedores',
    tablasSupabase: [
      'erp_proveedores',
      'erp_comprobantes_compra',
      'erp_cuentas_bancarias',
      'erp_asientos_contables'
    ],
    resumenEjecutivo:
      'El módulo de Proveedores gestiona el circuito Procure-to-Pay: registro de proveedores de insumos, obras y servicios, carga de facturas de compra para cómputo de IVA Crédito Fiscal, seguimiento de vencimientos y emisión de Órdenes de Pago.',
    funcionesPrincipales: [
      'Alta y edición de Proveedores con categorización de rubro / cuenta de gasto e identificación CUIT.',
      'Carga de Facturas de Compra (A, B, C, Liquidaciones) discriminando Neto Gravado, IVA Crédito Fiscal y Total.',
      'Emisión de Órdenes de Pago seleccionando la cuenta bancaria o caja de salida de fondos.',
      'Actualización automática del saldo acreedor en la Cuenta Corriente del proveedor.',
      'Exportación a Excel (CSV) y reporte PDF de deuda a proveedores.'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Registrar un Nuevo Proveedor',
        descripcion:
          'Haga clic en "+ Nuevo Proveedor", complete Razón Social, CUIT, Condición IVA y Categoría (ej. Materiales de Construcción, Servicios Médicos, Honorarios, Energía).',
        accionClave: 'Botón "+ Nuevo Proveedor" -> Guardar.',
        impactoContableODb: 'Crea el registro en public.erp_proveedores.'
      },
      {
        numero: 2,
        titulo: 'Cargar un Comprobante de Compra',
        descripcion:
          'Presione "+ Nueva Compra / Gasto", seleccione el proveedor, ingrese el número de comprobante (ej. FA-A-0004-00098210), fecha, vencimiento e importe neto más IVA.',
        accionClave: 'Botón "Registrar Compra".',
        impactoContableODb:
          '1) Inserta en erp_comprobantes_compra. 2) Aumenta el saldo a pagar al proveedor en erp_proveedores. 3) Genera asiento contable: Insumos/Gastos + IVA Crédito Fiscal (Debe) a Proveedores (Haber).'
      },
      {
        numero: 3,
        titulo: 'Emitir una Orden de Pago a Proveedor',
        descripcion:
          'Presione "Emitir Orden de Pago" (o el botón "Pagar" en la fila del proveedor), indique el monto a cancelar y la cuenta de Tesorería desde la cual salen los fondos.',
        accionClave: 'Confirmar Orden de Pago.',
        impactoContableODb:
          '1) Descuenta el saldo adeudado en erp_proveedores. 2) Descuenta el saldo disponible en erp_cuentas_bancarias. 3) Registra el asiento contable: Proveedores (Debe) a Banco/Caja (Haber).'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'No se permite cargar facturas con importes negativos o sin proveedor asignado.',
      'Al saldar el total de una factura de compra, su estado pasa automáticamente de "Pendiente" a "Pagada".'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Dónde se refleja el IVA de las facturas de compra que cargo aquí?',
        respuesta:
          'Se imputa automáticamente en la cuenta contable "1.1.05 IVA Crédito Fiscal" dentro del Libro Diario y Balance de Sumas y Saldos.'
      }
    ]
  },
  {
    id: 'tesoreria',
    codigo: 'MAN-04',
    titulo: 'Tesorería, Cajas, Bancos, Cheques y Conciliación',
    subtitulo: 'Custodia de liquidez, cuentas corrientes bancarias, billeteras virtuales y cartera de cheques (eCheq / Físicos)',
    moduloRelacionado: 'Tesorería',
    tablasSupabase: [
      'erp_cuentas_bancarias',
      'erp_cheques',
      'erp_asientos_contables'
    ],
    resumenEjecutivo:
      'El módulo de Tesorería centraliza todas las disponibilidades líquidas de la empresa: Cajas en Pesos/Dólares, Cuentas Bancarias (CBU), Billeteras Virtuales (Mercado Pago CVU) y la Cartera de Cheques de Terceros y Propios.',
    funcionesPrincipales: [
      'Panel de Cuentas Bancarias y Cajas con saldo actualizado en vivo tras cada cobro, pago o Webhook de Mercado Pago.',
      'Alta de nuevas Cuentas Bancarias, Cajas Operativas o Billeteras Virtuales.',
      'Registro de Ingresos, Egresos y Transferencias entre cuentas propias.',
      'Administración integral de Cartera de Cheques: alta de cheques recibidos o emitidos y depósito bancario en 1 clic.',
      'Conciliación de movimientos y exportación de posición financiera a CSV y PDF.'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Crear una nueva Cuenta Bancaria o Caja',
        descripcion:
          'Haga clic en "+ Nueva Cuenta / Caja", defina el Nombre (ej. Banco Macro Cta. Cte.), Tipo (Banco, Caja o Billetera Virtual), Moneda (ARS/USD), CBU/Alias y Saldo Inicial.',
        accionClave: 'Botón "+ Nueva Cuenta / Caja".',
        impactoContableODb: 'Inserta la nueva entidad financiera en public.erp_cuentas_bancarias.'
      },
      {
        numero: 2,
        titulo: 'Registrar un Movimiento de Tesorería o Transferencia',
        descripcion:
          'Utilice el botón "Registrar Movimiento / Transferencia" para asentar un ingreso extraordinario, extracción por gastos bancarios o transferencia interna de Caja a Banco.',
        accionClave: 'Seleccionar Tipo (Ingreso / Egreso) y Cuenta -> Confirmar.',
        impactoContableODb: 'Actualiza el saldo en erp_cuentas_bancarias y genera el asiento en erp_asientos_contables.'
      },
      {
        numero: 3,
        titulo: 'Ingresar y Depositar un Cheque de Cartera',
        descripcion:
          'En la sección "Cartera de Cheques", puede registrar un nuevo cheque con "+ Nuevo Cheque". Cuando llega la fecha de cobro de un cheque "En Cartera", presione el botón "Depositar" en su fila.',
        accionClave: 'Botón "Depositar" junto al cheque en cartera.',
        impactoContableODb:
          'Cambia el estado del cheque a "Depositado" en erp_cheques, acredita el importe en la cuenta bancaria en erp_cuentas_bancarias y genera el asiento Banco a Valores a Depositar.'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'Un cheque ya "Depositado" o "Entregado" queda bloqueado para evitar doble depósito.',
      'Los cobros aprobados por el Webhook de Mercado Pago acreditan automáticamente la cuenta de Mercado Pago / Banco configurada.'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Qué ocurre cuando recibo un pago por Webhook de Mercado Pago?',
        respuesta:
          'La Edge Function mercadopago-webhook o el simulador suma automáticamente el importe líquido en la cuenta de Tesorería y registra el asiento contable sin necesidad de carga manual.'
      }
    ]
  },
  {
    id: 'contabilidad',
    codigo: 'MAN-05',
    titulo: 'Contabilidad General, Plan de Cuentas y Libros Legales',
    subtitulo: 'Partida doble estricta (Debe = Haber), Libro Diario, Libro Mayor y Balance de Sumas y Saldos',
    moduloRelacionado: 'Contabilidad',
    tablasSupabase: [
      'erp_plan_cuentas',
      'erp_asientos_contables'
    ],
    resumenEjecutivo:
      'El motor contable de Zonda ERP garantiza que toda operación comercial o financiera tenga su reflejo en el Libro Diario bajo el principio de Partida Doble, permitiendo además la registración de asientos manuales de ajuste, devengamiento de sueldos, amortizaciones y cierre de ejercicio.',
    funcionesPrincipales: [
      'Plan de Cuentas jerárquico (1. Activo, 2. Pasivo, 3. Patrimonio Neto, 4. Ingresos/Resultados Positivos, 5. Egresos/Resultados Negativos).',
      'Alta de nuevas Cuentas Contables imputables o rubros agrupadores.',
      'Libro Diario Cronológico con detalle de renglones (Cuenta, Debe, Haber) y trazabilidad del módulo de origen.',
      'Carga de Nuevo Asiento Manual con validación matemática estricta (Total Debe === Total Haber).',
      'Balance de Sumas y Saldos y Libro Mayor por cuenta con exportación a Excel (CSV) y PDF.'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Consultar el Libro Diario y Filtrar Asientos',
        descripcion:
          'En la pestaña "Libro Diario", visualice todos los asientos generados automáticamente por Ventas, Compras, Tesorería y Sueldos, o filtre por concepto/número.',
        accionClave: 'Pestaña "Libro Diario".',
        impactoContableODb: 'Lectura ordenada de public.erp_asientos_contables.'
      },
      {
        numero: 2,
        titulo: 'Registrar un Nuevo Asiento Contable Manual',
        descripcion:
          'Presione "+ Nuevo Asiento Manual", ingrese la fecha, descripción (ej. Devengamiento Honorarios / Ajuste Inflación) y agregue las partidas indicando Cuenta, Debe y Haber. El sistema solo habilitará el guardado cuando la diferencia entre Debe y Haber sea exactamente $0,00.',
        accionClave: 'Botón "+ Nuevo Asiento Manual" -> Guardar Asiento.',
        impactoContableODb:
          'Inserta el asiento en erp_asientos_contables y actualiza los saldos acumulados en erp_plan_cuentas.'
      },
      {
        numero: 3,
        titulo: 'Auditar el Plan de Cuentas y Sumas y Saldos',
        descripcion:
          'Cambie a la pestaña "Plan de Cuentas / Sumas y Saldos" para verificar el saldo actualizado de cada cuenta patrimonial y de resultado, o agregue una nueva cuenta con "+ Nueva Cuenta Contable".',
        accionClave: 'Pestaña "Plan de Cuentas" / Botón "Exportar PDF / CSV".',
        impactoContableODb: 'Sincronizado en tiempo real con public.erp_plan_cuentas.'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'Principio de Partida Doble Inquebrantable: ningún asiento puede guardarse si la suma del Debe difiere de la suma del Haber.',
      'Solo las cuentas marcadas como "Imputable = Sí" pueden recibir movimientos directos en asientos.'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Necesito cargar manualmente los asientos de las facturas de venta o compra?',
        respuesta:
          'No. Zonda ERP los genera y persiste automáticamente en Supabase en el mismo instante en que emite una factura, carga una compra, registra un cobro/pago o liquida sueldos.'
      }
    ]
  },
  {
    id: 'inventario',
    codigo: 'MAN-06',
    titulo: 'Inventario, Stock, Depósitos y Valuación de Costos',
    subtitulo: 'Catálogo de artículos e insumos, control de stock mínimo, ajustes de entrada/salida y margen bruto',
    moduloRelacionado: 'Inventario',
    tablasSupabase: [
      'erp_inventario'
    ],
    resumenEjecutivo:
      'El módulo de Inventario controla las existencias físicas en múltiples depósitos o centros operativos, alerta automáticamente sobre artículos en punto de reposición (Stock Crítico) y calcula la valuación total del inventario a costo de reposición y precio neto de venta.',
    funcionesPrincipales: [
      'Catálogo de Artículos con SKU/Código, Descripción, Rubro, Depósito, Stock Físico, Stock Comprometido y Stock Disponible.',
      'Indicadores semafóricos de reposición: alerta automática cuando el Stock Disponible es menor o igual al Stock Mínimo.',
      'Modal de Alta de Nuevo Artículo con cálculo de margen y alícuota de IVA (21%, 10.5%, 0%).',
      'Modal de Ajuste Rápido de Stock (Ingreso por Compra/Producción o Egreso por Consumo en Obra/Merma).',
      'Exportación completa del inventario valorizado a Excel (CSV) y PDF.'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Dar de alta un Nuevo Artículo o Insumo',
        descripcion:
          'Haga clic en "+ Nuevo Artículo", ingrese Código SKU (ej. INS-405), Descripción, Rubro, Depósito de guarda, Stock Inicial, Stock Mínimo de alerta, Costo de Reposición y Precio de Venta Neto.',
        accionClave: 'Botón "+ Nuevo Artículo" -> Guardar.',
        impactoContableODb: 'Inserta el producto en public.erp_inventario.'
      },
      {
        numero: 2,
        titulo: 'Realizar un Ajuste de Stock (Entrada o Salida)',
        descripcion:
          'En la fila del artículo (o mediante el botón "Ajustar Stock"), seleccione si es un Ingreso (+) o Egreso (-), indique la cantidad de unidades y el motivo (ej. Recepción Remito Proveedor / Consumo en Obra).',
        accionClave: 'Botón "Ajustar Stock" -> Confirmar.',
        impactoContableODb: 'Actualiza stock_fisico, disponible y el historial de movimientos en erp_inventario.'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'Stock Disponible = Stock Físico - Stock Comprometido.',
      'Cuando Stock Disponible <= Stock Mínimo, el artículo se marca automáticamente como "REPONER / CRÍTICO".'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Cómo obtengo la valuación total del inventario para el balance?',
        respuesta:
          'En la parte superior del módulo de Inventario encontrará el KPI "Valuación Total a Costo" calculado como la sumatoria de (Stock Físico × Costo Calculado) de todos los ítems.'
      }
    ]
  },
  {
    id: 'sueldos',
    codigo: 'MAN-07',
    titulo: 'Sueldos, Convenios Colectivos (CCT) y Libro Sueldos Digital ARCA (RG 3781)',
    subtitulo: 'Liquidación de haberes argentinos, recibos oficiales y exportación posicional TXT para ARCA F.931',
    moduloRelacionado: 'Sueldos y Haberes',
    tablasSupabase: [
      'erp_empleados',
      'erp_liquidaciones',
      'erp_asientos_contables'
    ],
    resumenEjecutivo:
      'El módulo de Sueldos y Cargas Sociales liquida haberes conforme a la legislación laboral argentina (Ley 20.744 y Convenios Colectivos UOCRA 76/75, Comercio 130/75, Sanidad FATSA 122/75 y Fuera de Convenio) y genera el archivo plano posicional oficial (.TXT) para subir al servicio "Libro de Sueldos Digital" de ARCA (ex-AFIP) para la declaración jurada F.931.',
    funcionesPrincipales: [
      'Padrón de Legajos con CUIL, CBU de 22 dígitos, Convenio Colectivo (CCT), Categoría, Antigüedad y Sueldo Básico.',
      'Cálculo automático de Conceptos Remunerativos (Básico, Antigüedad, Presentismo/Asistencia Perfecta, Adicionales CCT), No Remunerativos y Retenciones de Ley (Jubilación SIPA 11%, INSSJyP PAMI 3%, Obra Social 3%, Cuota Sindical).',
      'Ejecución de Nueva Liquidación Mensual/Quincenal/SAC con generación automática del asiento de devengamiento de sueldos y cargas sociales.',
      'Visor e impresión de Recibo de Haberes individual con firma y desglose legal.',
      'Generador y validador del archivo TXT oficial ARCA RG 3781 (Registros 01, 02, 03 y 04).'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Incorporar un Nuevo Legajo de Empleado',
        descripcion:
          'Presione "+ Nuevo Legajo", complete Nombre y Apellido, CUIL (11 dígitos), Convenio Colectivo (CCT 76/75 UOCRA, CCT 130/75 Comercio, CCT 122/75 Sanidad o Fuera de Convenio), Categoría, CBU bancario y Sueldo Básico.',
        accionClave: 'Botón "+ Nuevo Legajo" -> Guardar.',
        impactoContableODb:
          'Calcula automáticamente los conceptos homologados AFIP (110000, 120000, 810000, 810001, 810002) e inserta el legajo en public.erp_empleados.'
      },
      {
        numero: 2,
        titulo: 'Ejecutar una Nueva Liquidación del Período',
        descripcion:
          'Haga clic en "Ejecutar Liquidación Período", indique el período en formato AAAAMM (ej. 202611) y tipo (Mensual, 1ra Quincena, SAC).',
        accionClave: 'Confirmar Liquidación.',
        impactoContableODb:
          'Guarda el cierre en erp_liquidaciones y registra el asiento contable de Sueldos y Jornales + Cargas Sociales a Sueldos a Pagar y Cargas Sociales a Pagar en erp_asientos_contables.'
      },
      {
        numero: 3,
        titulo: 'Descargar el Archivo .TXT para Libro Sueldos Digital ARCA (F.931)',
        descripcion:
          'Vaya a la pestaña "Libro Sueldos Digital AFIP (RG 3781)", verifique la previsualización de los Registros 01 (Cabecera), 02 (Trabajador), 03 (Conceptos) y 04 (Bases Imponibles F.931) y presione "Descargar TXT Oficial AFIP".',
        accionClave: 'Botón "Descargar TXT Oficial AFIP".',
        impactoContableODb: 'Descarga el archivo posicional con codificación ANSI/UTF-8 y saltos CRLF listo para importar en el portal de ARCA.'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'El CUIL de cada trabajador y el CUIT empleador se validan a 11 posiciones numéricas exactas.',
      'El CBU bancario debe contar con 22 dígitos para superar la validación del Registro 02 de ARCA.',
      'Los importes en los Registros 03 y 04 se formatean automáticamente en centavos sin punto decimal, rellenos con ceros a la izquierda a 15 posiciones.'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Qué estructura tiene el archivo TXT que descarga el módulo de Sueldos?',
        respuesta:
          'Cumple estrictamente el diseño de registro de la Resolución General 3781 de ARCA (ex-AFIP): Registro 01 (Datos de la liquidación), Registro 02 (Datos del empleado y CBU), Registro 03 (Detalle de haberes y deducciones por código AFIP) y Registro 04 (Bases Imponibles 1 a 10 para el F.931).'
      }
    ]
  },
  {
    id: 'arca',
    codigo: 'MAN-08',
    titulo: 'Conexión ARCA (ex-AFIP) Web Services (WSAA & WSFEv1)',
    subtitulo: 'Guía paso a paso para generar certificados X.509 (.key / .csr / .crt) y autorizar CAE en Homologación y Producción',
    moduloRelacionado: 'Integraciones Oficiales',
    tablasSupabase: [
      'erp_integraciones_config',
      'erp_webhooks_log',
      'erp_comprobantes_venta'
    ],
    resumenEjecutivo:
      'Zonda ERP ya incluye la Supabase Edge Function puente (arca-wsfe) que se encarga de autenticar contra el WSAA (Web Service de Autenticación y Autorización) y solicitar el CAE ante el WSFEv1 de ARCA sin bloqueos de CORS. Para salir a producción solo necesitas subir tu archivo .crt y tu clave privada .key.',
    funcionesPrincipales: [
      'Soporte dual para Homologación (Testing) y Producción (Servidores reales de ARCA).',
      'Botón de "Cargar Certificado Homologación (1-Clic)" para probar todo el flujo inmediatamente sin esperar trámites.',
      'Puente Serverless preconfigurado en https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/arca-wsfe.',
      'Generador automático de los comandos OpenSSL exactos con el CUIT de tu empresa.'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Generar tu Clave Privada (.key) y Solicitud de Certificado (.csr)',
        descripcion:
          'Abrí una terminal en tu computadora y ejecutá los 2 comandos OpenSSL que figuran más abajo (también podés copiarlos desde el botón "¿Cómo obtener el Certificado .CRT?" dentro del modal de ARCA en el ERP).',
        accionClave: 'Ejecutar openssl genrsa y openssl req.',
        impactoContableODb: 'Genera localmente tu archivo privado .key (que subirás al ERP) y el archivo .csr (que subirás a la web de ARCA).'
      },
      {
        numero: 2,
        titulo: 'Subir el archivo .csr en el portal de ARCA con Clave Fiscal',
        descripcion:
          'Ingresá a https://auth.afip.gob.ar con Clave Fiscal Nivel 3. Para Homologación entrá a "WSASS - Autogestión Certificados Homologación"; para Producción entrá a "Administración de Certificados Digitales". Creá un alias, subí el archivo .csr y descargá el certificado firmado .crt.',
        accionClave: 'Descargar el archivo .crt emitido por ARCA.',
        impactoContableODb: 'En "Administrador de Relaciones", asociá el servicio "Facturación Electrónica (wsfe)" al alias creado.'
      },
      {
        numero: 3,
        titulo: 'Subir el .crt y .key en Zonda ERP',
        descripcion:
          'Hacé clic en el botón superior "WS-AFIP" de la barra de navegación, seleccioná el ambiente (Homologación o Producción), subí los archivos .crt y .key y presioná "Guardar en Supabase y Probar ARCA".',
        accionClave: 'Botón "Guardar en Supabase y Probar ARCA".',
        impactoContableODb: 'Persiste la configuración en public.erp_integraciones_config y registra el ping exitoso en public.erp_webhooks_log.'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'El Punto de Venta configurado en Zonda ERP debe estar dado de alta en ARCA bajo la modalidad "RECE para aplicativo y Web Services".',
      'Los certificados de ARCA tienen vigencia de 2 años y pueden renovarse subiendo un nuevo .crt en la misma ventana.'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Puedo probar la facturación con CAE ahora mismo antes de tramitar el certificado en ARCA?',
        respuesta:
          '¡Sí! Abrí el modal "WS-AFIP" en la barra superior, hacé clic en el botón "Cargar Certificado Homologación (1-Clic)" y luego en "Guardar en Supabase y Probar ARCA".'
      }
    ],
    comandosOSnippets: [
      {
        titulo: 'Comandos OpenSSL para generar Clave Privada (.key) y Solicitud (.csr)',
        codigo: `# 1. Generar Clave Privada RSA de 2048 bits:
openssl genrsa -out zonda_30718759087.key 2048

# 2. Generar Solicitud de Certificado (.CSR) para subir a ARCA:
openssl req -new -key zonda_30718759087.key -subj "/C=AR/O=SANATORIO ARGENTINO/CN=ARCA_30718759087_ZONDA/serialNumber=CUIT 30718759087" -out zonda_30718759087.csr`
      },
      {
        titulo: 'Endpoint de la Supabase Edge Function para ARCA WSFEv1',
        codigo: `https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/arca-wsfe`
      }
    ]
  },
  {
    id: 'mercadopago',
    codigo: 'MAN-09',
    titulo: 'Conexión Mercado Pago API, Checkout Pro, QR y Webhooks IPN',
    subtitulo: 'Guía paso a paso para vincular credenciales, pegar el Webhook y conciliar cobros automáticamente',
    moduloRelacionado: 'Integraciones Oficiales',
    tablasSupabase: [
      'erp_integraciones_config',
      'erp_webhooks_log',
      'erp_cuentas_bancarias',
      'erp_asientos_contables'
    ],
    resumenEjecutivo:
      'La pasarela de Mercado Pago está completamente integrada: al crear cualquier link o código QR de cobro desde Zonda ERP, se inyecta automáticamente la notification_url apuntando al Webhook en Supabase. Cuando entra un pago aprobado, el Webhook acredita Tesorería y genera el asiento contable sin intervención humana.',
    funcionesPrincipales: [
      'Generación de Preferencias Checkout Pro (/checkout/preferences) con external_reference vinculado al número de factura.',
      'Generación de código QR Interoperable EMVCo (Transferencias 3.0 y Billetera Mercado Pago).',
      'Receptor de Webhooks Serverless en https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-webhook.',
      'Simulador en vivo de disparo de Webhook ($25.000) para verificar el impacto en Tesorería y Contabilidad en 1 clic.'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Copiar Public Key y Access Token desde Mercado Pago Developers',
        descripcion:
          'Ingresá a https://www.mercadopago.com.ar/developers/panel/app, seleccioná tu aplicación (o creá una nueva), entrá a "Credenciales de producción" (o "Credenciales de prueba") y copiá tu Public Key y tu Access Token (comienzan con APP_USR-... o TEST-...).',
        accionClave: 'Copiar Public Key y Access Token.',
        impactoContableODb: 'Permite a Zonda ERP autenticar contra https://api.mercadopago.com.'
      },
      {
        numero: 2,
        titulo: 'Pegar la URL del Webhook en el panel de Mercado Pago',
        descripcion:
          'En el menú izquierdo de Mercado Pago Developers entrá a "Webhooks -> Configurar notificaciones". Pegá la URL del Webhook de Zonda ERP que figura abajo, marcá los eventos "Pagos (payment)" y "Órdenes comerciales (merchant_order)" y hacé clic en Guardar.',
        accionClave: 'Pegar https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-webhook.',
        impactoContableODb: 'Mercado Pago enviará un POST automático a Supabase cada vez que un cliente pague.'
      },
      {
        numero: 3,
        titulo: 'Guardar las claves en Zonda ERP y probar el Simulador de Webhook',
        descripcion:
          'Abrí el botón "MP: CONFIGURAR" en la barra superior de Zonda ERP, pegá el Public Key, Access Token y Webhook Secret y presioná "Guardar en Supabase y Verificar". Podés probar el circuito haciendo clic en "Simular Disparo Webhook MP ($25.000)".',
        accionClave: 'Botón "Guardar en Supabase y Verificar" / "Simular Disparo Webhook MP".',
        impactoContableODb:
          'Registra el evento en erp_webhooks_log, acredita la cuenta en erp_cuentas_bancarias y crea el asiento contable en erp_asientos_contables.'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'El Access Token debe comenzar obligatoriamente con "TEST-" (modo Sandbox) o "APP_USR-" (modo Producción).',
      'Toda notificación entrante queda registrada con fecha, hora, payload JSON y estado en la pestaña "Monitor de Webhooks".'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Necesito configurar el Webhook en cada factura que emito?',
        respuesta:
          'No. Zonda ERP ya inyecta automáticamente el campo notification_url con la URL del Webhook en cada preferencia de pago que genera.'
      }
    ],
    comandosOSnippets: [
      {
        titulo: 'URL del Webhook para pegar en Mercado Pago Developers',
        codigo: `https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-webhook`
      },
      {
        titulo: 'Eventos que debes tildar en Mercado Pago Developers -> Webhooks',
        codigo: `[x] Pagos (payment)
[x] Órdenes comerciales (merchant_order)`
      }
    ]
  },
  {
    id: 'supabase',
    codigo: 'MAN-10',
    titulo: 'Arquitectura de Base de Datos Supabase PostgreSQL & Edge Functions',
    subtitulo: 'Diccionario de las 14 tablas productivas, variables de entorno y comandos de despliegue Serverless',
    moduloRelacionado: 'Infraestructura & Base de Datos',
    tablasSupabase: [
      'erp_empresa',
      'erp_clientes',
      'erp_proveedores',
      'erp_comprobantes_venta',
      'erp_comprobantes_compra',
      'erp_cuentas_bancarias',
      'erp_cheques',
      'erp_plan_cuentas',
      'erp_asientos_contables',
      'erp_inventario',
      'erp_empleados',
      'erp_liquidaciones',
      'erp_integraciones_config',
      'erp_webhooks_log'
    ],
    resumenEjecutivo:
      'Zonda ERP opera sobre la instancia PostgreSQL de Supabase (Project Ref: dtjmckbrofevgfqbkzli). Cuenta con 14 tablas relacionales con políticas RLS activas y 2 Supabase Edge Functions en Deno/TypeScript para integraciones externas.',
    funcionesPrincipales: [
      'Persistencia transaccional en tiempo real desde todos los módulos del ERP.',
      'Sincronización bidireccional mediante el contexto central src/context/ErpContext.tsx.',
      'Auditoría completa de Webhooks e integraciones en erp_webhooks_log y erp_integraciones_config.',
      'Edge Functions listas para desplegar con Supabase CLI.'
    ],
    pasosOperativos: [
      {
        numero: 1,
        titulo: 'Verificar las Variables de Entorno (.env)',
        descripcion:
          'El archivo .env en la raíz del proyecto contiene las credenciales de conexión a Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) y las URLs de las Edge Functions de ARCA y Mercado Pago.',
        accionClave: 'Archivo .env configurado en la raíz del proyecto.',
        impactoContableODb: 'Conecta el cliente @supabase/supabase-js en src/lib/supabase.ts.'
      },
      {
        numero: 2,
        titulo: 'Publicar / Actualizar las Edge Functions en Supabase',
        descripcion:
          'Si realizás modificaciones en supabase/functions/mercadopago-webhook o supabase/functions/arca-wsfe, ejecutá los comandos de despliegue con Supabase CLI.',
        accionClave: 'npx supabase functions deploy',
        impactoContableODb: 'Actualiza los endpoints HTTPS públicos en la nube de Supabase.'
      }
    ],
    reglasDeNegocioYValidaciones: [
      'Nunca expongas SUPABASE_SERVICE_ROLE_KEY en variables con prefijo VITE_ en el navegador; solo se utiliza en scripts de servidor o dentro de las Edge Functions.',
      'La función mercadopago-webhook se despliega con --no-verify-jwt para permitir peticiones POST directas desde los servidores de Mercado Pago.'
    ],
    preguntasFrecuentes: [
      {
        pregunta: '¿Cómo fuerzo una recarga manual de todas las tablas de Supabase desde la interfaz?',
        respuesta:
          'Hacé clic sobre el botón verde "SUPABASE DB: ONLINE" en la esquina superior derecha del Header.'
      }
    ],
    comandosOSnippets: [
      {
        titulo: 'Comandos para desplegar las Edge Functions en tu proyecto Supabase',
        codigo: `npx supabase login --token <TU_SUPABASE_ACCESS_TOKEN>
npx supabase functions deploy mercadopago-webhook --project-ref dtjmckbrofevgfqbkzli --no-verify-jwt
npx supabase functions deploy arca-wsfe --project-ref dtjmckbrofevgfqbkzli --no-verify-jwt`
      }
    ]
  }
];

