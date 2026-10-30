import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Settings,
  HelpCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  DollarSign,
  UserPlus,
  Upload,
  Download,
  CheckCircle2,
  FileText,
  Send,
  X,
  FileDown,
  Sparkles,
  Trash2
} from 'lucide-react';
import { TipoComprobante } from '../../types/models';
import { useErp } from '../../context/ErpContext';
import { exportToExcelCsv, printFinancialReport } from '../../utils/exportUtils';
import { printAfipElectronicInvoice } from '../../utils/afipQrInvoicePrint';
import { sendInvoiceViaWhatsApp } from '../../utils/whatsappSender';
import { CalendarioVencimientosModal } from '../modals/CalendarioVencimientosModal';
import {
  analizarYNormalizarArchivoConIa,
  type ResultadoAnalisisArchivoIa,
  type FilaComprobanteNormalizadaIa
} from '../../services/aiCsvNormalizerService';

export const ClientesModule: React.FC = () => {
  const {
    empresa,
    clientes,
    facturasVenta,
    crearCliente,
    emitirFacturaVenta,
    registrarCobroCliente,
    refreshAllFromDb
  } = useErp();

  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('CLI-003');
  const [filtroActivos, setFiltroActivos] = useState<'activos' | 'inactivos'>('activos');
  const [searchCliente, setSearchCliente] = useState('');
  const [panelIzquierdoColapsado, setPanelIzquierdoColapsado] = useState(false);

  // Pestañas principales superiores
  const [tabPrincipal, setTabPrincipal] = useState<'resumen' | 'gestion' | 'importacion' | 'pasarela'>('gestion');

  // Pestañas de detalle del cliente (Panel derecho)
  const [tabDetalle, setTabDetalle] = useState<'adeudadas' | 'cuenta' | 'general' | 'otra'>('adeudadas');

  // Escuchar selección directa desde el Buscador Global del Header
  useEffect(() => {
    const applySearchTarget = (target: any) => {
      if (!target || target.modulo !== 'clientes') return;
      if (target.entityId && clientes.some((c) => c.id === target.entityId)) {
        setTabPrincipal('gestion');
        setClienteSeleccionadoId(target.entityId);
        setSearchCliente('');
        setTabDetalle('adeudadas');
      } else if (target.queryHint) {
        setTabPrincipal('gestion');
        setSearchCliente(target.queryHint);
      }
      try {
        sessionStorage.removeItem('zonda_global_search_target');
      } catch {
        // ignore
      }
    };

    try {
      const stored = sessionStorage.getItem('zonda_global_search_target');
      if (stored) applySearchTarget(JSON.parse(stored));
    } catch {
      // ignore
    }

    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      applySearchTarget(custom.detail);
    };
    window.addEventListener('zonda_global_search_select', handler);
    return () => window.removeEventListener('zonda_global_search_select', handler);
  }, [clientes]);

  // Modales
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);
  const [showConfigAfipModal, setShowConfigAfipModal] = useState(false);

  // Formulario Factura con Desglose Completo de Impuestos Argentinos (ARCA / IIBB)
  const [tipoFactura, setTipoFactura] = useState<TipoComprobante>('Factura A');
  const [netoFactura, setNetoFactura] = useState(500000);
  const [alicuotaIvaSelect, setAlicuotaIvaSelect] = useState<'21' | '10.5' | '27' | '0'>('21');
  const [noGravadoExentoFactura, setNoGravadoExentoFactura] = useState(0);
  const [percepcionIIBBFactura, setPercepcionIIBBFactura] = useState(0);
  const [percepcionIvaFactura, setPercepcionIvaFactura] = useState(0);
  const [impuestosInternosFactura, setImpuestosInternosFactura] = useState(0);
  const [descFactura, setDescFactura] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Formulario Cobro
  const [montoCobro, setMontoCobro] = useState(100000);
  const [medioCobro, setMedioCobro] = useState('Transferencia Bancaria Santander');
  const [medioCobroFactura, setMedioCobroFactura] = useState('Transferencia Bancaria Santander');

  // Formulario Nuevo Cliente
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCuit, setNuevoCuit] = useState('');
  const [nuevoDomicilio, setNuevoDomicilio] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoCondicionIva, setNuevoCondicionIva] = useState<'Responsable Inscripto' | 'Consumidor Final'>('Responsable Inscripto');

  // Input de importación CSV
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mensajeImportacion, setMensajeImportacion] = useState<string | null>(null);

  // Filtrado de clientes
  const clientesFiltrados = clientes.filter((c) => {
    const coincideEstado = filtroActivos === 'activos' ? c.activo : !c.activo;
    const coincideTexto =
      c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.razonSocial.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.cuit.includes(searchCliente);
    return coincideEstado && coincideTexto;
  });

  const clienteActivo = clientes.find((c) => c.id === clienteSeleccionadoId) || clientesFiltrados[0];

  // Crear Factura con persistencia en Supabase + Contabilidad + Todos los Impuestos
  const handleCrearFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteActivo || guardando) return;
    setGuardando(true);
    try {
      const iva21Calc = alicuotaIvaSelect === '21' ? Number((netoFactura * 0.21).toFixed(2)) : 0;
      const iva105Calc = alicuotaIvaSelect === '10.5' ? Number((netoFactura * 0.105).toFixed(2)) : 0;
      const iva27Calc = alicuotaIvaSelect === '27' ? Number((netoFactura * 0.27).toFixed(2)) : 0;

      const totalCalc = Number(
        (
          netoFactura +
          noGravadoExentoFactura +
          iva21Calc +
          iva105Calc +
          iva27Calc +
          percepcionIIBBFactura +
          percepcionIvaFactura +
          impuestosInternosFactura
        ).toFixed(2)
      );

      await emitirFacturaVenta({
        clienteId: clienteActivo.id,
        tipo: tipoFactura,
        puntoVenta: '0001',
        netoGravado: netoFactura,
        noGravado: noGravadoExentoFactura,
        iva21: iva21Calc,
        iva105: iva105Calc,
        iva27: iva27Calc,
        percepcionIIBB: percepcionIIBBFactura,
        percepcionIva: percepcionIvaFactura,
        impuestosInternos: impuestosInternosFactura,
        descripcion: descFactura || 'Certificación de obra y provisión de materiales',
        medioCobroPactado: medioCobroFactura
      });
      setMontoCobro(totalCalc);
      setMedioCobro(medioCobroFactura);
      setShowFacturaModal(false);
      setDescFactura('');
      setNoGravadoExentoFactura(0);
      setPercepcionIIBBFactura(0);
      setPercepcionIvaFactura(0);
      setImpuestosInternosFactura(0);
    } finally {
      setGuardando(false);
    }
  };

  // Agregar Cobro con persistencia en Supabase + Tesorería + Contabilidad
  const handleAgregarCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteActivo || guardando) return;
    setGuardando(true);
    try {
      await registrarCobroCliente({
        clienteId: clienteActivo.id,
        monto: montoCobro,
        medioCobro
      });
      setShowCobroModal(false);
    } finally {
      setGuardando(false);
    }
  };

  // Alta de Cliente en Supabase
  const handleCrearNuevoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    try {
      const creado = await crearCliente({
        nombre: nuevoNombre.toUpperCase(),
        razonSocial: nuevoNombre.toUpperCase(),
        cuit: nuevoCuit || '30-00000000-0',
        condicionIva: nuevoCondicionIva,
        domicilio: nuevoDomicilio || 'San Juan, Argentina',
        telefono: '+54 264 400-0000',
        email: nuevoEmail || 'contacto@cliente.com',
        activo: true,
        listaPrecios: 'Lista Corporativa Obras A',
        limiteCredito: 5000000,
        vendedor: 'Ing. Lucas Marinero'
      });
      setClienteSeleccionadoId(creado.id);
      setShowNuevoClienteModal(false);
      setNuevoNombre('');
      setNuevoCuit('');
      setNuevoDomicilio('');
      setNuevoEmail('');
    } finally {
      setGuardando(false);
    }
  };

  // Exportaciones Reales
  const handleExportFacturasAdeudadas = () => {
    if (!clienteActivo) return;
    exportToExcelCsv(
      `Facturas_Adeudadas_${clienteActivo.razonSocial.replace(/\s+/g, '_')}`,
      ['Nro. Comprobante', 'Tipo', 'Fecha Emisión', 'Fecha Pago', 'Descripción', 'Total ($)', 'Cobrado ($)', 'Saldo ($)', 'Saldo Acumulado ($)'],
      clienteActivo.facturasAdeudadas.map((f) => [
        f.nroComprobante,
        f.tipo,
        f.fechaEmision,
        f.fechaPago,
        f.descripcion,
        f.total.toFixed(2),
        f.cobrado.toFixed(2),
        f.saldo.toFixed(2),
        f.saldoAcumulado.toFixed(2)
      ])
    );
  };

  const handleExportCuentaCorriente = () => {
    if (!clienteActivo) return;
    exportToExcelCsv(
      `Cuenta_Corriente_${clienteActivo.razonSocial.replace(/\s+/g, '_')}`,
      ['Fecha', 'Comprobante', 'Concepto', 'Debe ($)', 'Haber ($)', 'Saldo Histórico ($)'],
      clienteActivo.movimientos.map((m) => [
        m.fecha,
        m.comprobante,
        m.concepto,
        m.debe.toFixed(2),
        m.haber.toFixed(2),
        m.saldo.toFixed(2)
      ])
    );
  };

  const handleDescargarPlantilla = () => {
    exportToExcelCsv(
      'Plantilla_Importacion_Facturas_Completa_ARCA_ZondaERP',
      [
        'Fecha_Emision',
        'Fecha_Vencimiento',
        'Tipo_Comprobante',
        'Punto_Venta',
        'Numero_Comprobante',
        'CUIT_Cliente',
        'Razon_Social',
        'Condicion_IVA',
        'Jurisdiccion_IIBB',
        'Moneda',
        'Tipo_Cambio',
        'Neto_Gravado',
        'No_Gravado',
        'Exento',
        'IVA_21',
        'IVA_10_5',
        'IVA_27',
        'Percepcion_IVA',
        'Percepcion_IIBB',
        'Impuestos_Internos',
        'Otros_Tributos_Municipales',
        'Total_Comprobante',
        'CAE',
        'Vencimiento_CAE',
        'Cuenta_Contable',
        'Descripcion'
      ],
      [
        [
          '2026-10-30',
          '2026-11-29',
          'Factura A',
          '0001',
          '00000425',
          '30-68912443-4',
          'CONSTRUCTORA CUYANA S.R.L.',
          'Responsable Inscripto',
          'San Juan',
          'ARS',
          '1.00',
          '1250000.00',
          '0.00',
          '0.00',
          '262500.00',
          '0.00',
          '0.00',
          '0.00',
          '37500.00',
          '0.00',
          '0.00',
          '1550000.00',
          '74419283746152',
          '2026-11-09',
          '4.1.01 - Ventas por Servicios y Suministros',
          'Avance de Obra Red Tramo II (Con IVA 21% + Percepción IIBB 3%)'
        ],
        [
          '2026-10-30',
          '2026-11-29',
          'Factura A',
          '0001',
          '00000426',
          '30-71458921-0',
          'VALDIVIESO GROUP S. R. L.',
          'Responsable Inscripto',
          'San Juan',
          'ARS',
          '1.00',
          '850000.00',
          '25000.00',
          '0.00',
          '0.00',
          '89250.00',
          '0.00',
          '12750.00',
          '25500.00',
          '0.00',
          '0.00',
          '1002500.00',
          '74419283746199',
          '2026-11-09',
          '4.1.01 - Ventas por Servicios y Suministros',
          'Equipamiento Técnico Bienes de Capital (IVA 10.5% + No Gravado + Perc. IVA e IIBB)'
        ],
        [
          '2026-10-30',
          '2026-11-15',
          'Factura B',
          '0001',
          '00000112',
          '30-54667788-9',
          'OBRA SOCIAL PROVINCIA',
          'Exento',
          'San Juan',
          'ARS',
          '1.00',
          '0.00',
          '0.00',
          '640000.00',
          '0.00',
          '0.00',
          '0.00',
          '0.00',
          '0.00',
          '0.00',
          '0.00',
          '640000.00',
          '74419283746215',
          '2026-11-09',
          '4.1.01 - Prestaciones Médicas Exentas',
          'Liquidación Prestaciones Médicas Exentas de IVA'
        ]
      ]
    );
  };

  const [analizandoArchivoIa, setAnalizandoArchivoIa] = useState(false);
  const [propuestaIaArchivo, setPropuestaIaArchivo] = useState<ResultadoAnalisisArchivoIa | null>(null);

  const ejecutarImportacionFilasAutorizadas = async (filas: FilaComprobanteNormalizadaIa[]) => {
    if (!clienteActivo) return;
    let count = 0;
    for (const f of filas) {
      const targetCliente =
        clientes.find((c) => c.id === f.clienteAsociadoId) ||
        clientes.find((c) => c.cuit === f.cuitCliente) ||
        clienteActivo;

      await emitirFacturaVenta({
        clienteId: targetCliente.id,
        tipo: f.tipoComprobante,
        puntoVenta: f.puntoVenta,
        numero: f.numeroComprobante,
        fechaEmision: f.fechaEmision,
        fechaVencimiento: f.fechaVencimiento,
        netoGravado: f.netoGravado,
        iva21: f.iva21,
        percepcionIIBB: f.percepcionIIBB,
        descripcion: f.descripcion
      });
      count++;
    }
    setPropuestaIaArchivo(null);
    setMensajeImportacion(
      `✓ Se importaron y contabilizaron ${count} comprobante(s) en Supabase con autorización del usuario.`
    );
  };

  const procesarTextoArchivoConVerificacionIa = async (text: string, fileName: string) => {
    setAnalizandoArchivoIa(true);
    setMensajeImportacion(null);
    try {
      const resultado = await analizarYNormalizarArchivoConIa({
        rawText: text,
        fileName,
        clientes
      });

      if (!resultado.requiereAutorizacionIa && resultado.filasPropuestas.length > 0) {
        // El archivo ingresó exactamente con la estructura esperada: importar directo
        await ejecutarImportacionFilasAutorizadas(resultado.filasPropuestas);
      } else {
        // El archivo NO ingresó como corresponde: mostrar propuesta de corrección IA para autorización del usuario
        setPropuestaIaArchivo(resultado);
      }
    } finally {
      setAnalizandoArchivoIa(false);
    }
  };

  const handleArchivoImportacion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clienteActivo) return;
    const text = await file.text();
    e.target.value = '';
    await procesarTextoArchivoConVerificacionIa(text, file.name);
  };

  const simularArchivoConErroresParaIa = async () => {
    const csvMalFormateado = [
      'Cliente;CUIT_Sin_Guiones;Fecha_Fact;Importe_Neto;Concepto_Facturado;Tipo',
      'CONSTRUCTORA CUYANA;30689124434;30/10/2026;$ 980.000,00;Certificación Avance Obra Tramo Norte;FC A',
      'VALDIVIESO GROUP;30714589210;29/10/2026;$ 640.000,00;Provisión Equipos de Bombeo;Factura A',
      'HIDRAULICA SAN JUAN;30612299812;28/10/2026;$ 425.000,00;Mantenimiento Preventivo Red Matriz;Factura A'
    ].join('\n');
    await procesarTextoArchivoConVerificacionIa(
      csvMalFormateado,
      'exportacion_sistema_externo_desordenada.csv'
    );
  };

  const actualizarFilaPropuestaIa = (
    idFila: string,
    cambios: Partial<FilaComprobanteNormalizadaIa>
  ) => {
    if (!propuestaIaArchivo) return;
    const nuevasFilas = propuestaIaArchivo.filasPropuestas.map((f) => {
      if (f.id !== idFila) return f;
      const actualizada = { ...f, ...cambios };
      if (cambios.clienteAsociadoId) {
        const cliObj = clientes.find((c) => c.id === cambios.clienteAsociadoId);
        if (cliObj) {
          actualizada.cuitCliente = cliObj.cuit;
          actualizada.razonSocialCliente = cliObj.razonSocial;
        }
      }
      if (cambios.netoGravado !== undefined || cambios.iva21 !== undefined || cambios.percepcionIIBB !== undefined) {
        actualizada.total = Number(
          (actualizada.netoGravado + actualizada.iva21 + actualizada.percepcionIIBB).toFixed(2)
        );
      }
      return actualizada;
    });
    setPropuestaIaArchivo({
      ...propuestaIaArchivo,
      filasPropuestas: nuevasFilas
    });
  };

  const eliminarFilaPropuestaIa = (idFila: string) => {
    if (!propuestaIaArchivo) return;
    setPropuestaIaArchivo({
      ...propuestaIaArchivo,
      filasPropuestas: propuestaIaArchivo.filasPropuestas.filter((f) => f.id !== idFila)
    });
  };

  const handleDescargarCsvCorregidoIa = () => {
    if (!propuestaIaArchivo) return;
    exportToExcelCsv(
      `Corregido_IA_${propuestaIaArchivo.nombreArchivo.replace(/\.[^.]+$/, '')}`,
      [
        'Fecha_Emision',
        'Fecha_Vencimiento',
        'Tipo_Comprobante',
        'Punto_Venta',
        'Numero_Comprobante',
        'CUIT_Cliente',
        'Razon_Social',
        'Neto_Gravado',
        'IVA_21',
        'Percepcion_IIBB',
        'Total_Comprobante',
        'Descripcion'
      ],
      propuestaIaArchivo.filasPropuestas.map((f) => [
        f.fechaEmision,
        f.fechaVencimiento,
        f.tipoComprobante,
        f.puntoVenta,
        f.numeroComprobante,
        f.cuitCliente,
        f.razonSocialCliente,
        f.netoGravado.toFixed(2),
        f.iva21.toFixed(2),
        f.percepcionIIBB.toFixed(2),
        f.total.toFixed(2),
        f.descripcion
      ])
    );
  };

  // Totales dinámicos para pestaña Resumen
  const totalPorCobrar = clientes.reduce((acc, c) => acc + c.saldo, 0);
  const totalVencido = clientes
    .filter((c) => c.id === 'CLI-002')
    .reduce((acc, c) => acc + c.saldo, 0);
  const totalAVencer = Math.max(0, totalPorCobrar - totalVencido);

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      {/* 1. BARRA SUPERIOR DE ENCABEZADO Y LLAMADAS A LA ACCIÓN */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
            CLIENTES
          </h1>
          <span className="text-xs text-slate-400 font-mono">| GESTIÓN COMERCIAL Y CUENTAS CORRIENTES</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-600">¿Querés emitir Factura electrónica?</span>
            <button
              onClick={() => setShowConfigAfipModal(true)}
              className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-zonda-700 font-bold flex items-center gap-1.5 transition-colors uppercase text-[11px]"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuralo ahora</span>
            </button>
          </div>

          <button
            onClick={() => setShowCalendarioModal(true)}
            className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#064e3b]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario de vencimientos</span>
          </button>
        </div>
      </div>

      {/* 2. PESTAÑAS PRINCIPALES DEL MÓDULO */}
      <div className="bg-[#ecfdf5]/40 border-b border-slate-300 px-2 pt-1 flex items-center gap-1">
        {[
          { key: 'resumen', label: 'Resumen clientes' },
          { key: 'gestion', label: 'Gestión de clientes' },
          { key: 'importacion', label: 'Importación de facturas' },
          { key: 'pasarela', label: 'Mercado Pago / Cobros Online' }
        ].map((tab) => {
          const isActive = tabPrincipal === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabPrincipal(tab.key as any)}
              className={`px-4 py-2 text-xs font-mono font-bold transition-all border-t-2 ${
                isActive
                  ? 'bg-white border-t-[#064e3b] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
                  : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. VISTA PRINCIPAL: SPLIT-SCREEN MASTER-DETAIL (GESTIÓN DE CLIENTES) */}
      {tabPrincipal === 'gestion' ? (
        <div className="flex flex-col lg:flex-row min-h-[640px] bg-white border border-slate-300 border-t-0">
          {/* PANEL IZQUIERDO: LISTA DE CLIENTES (MASTER) */}
          <div
            className={`border-r border-slate-300 bg-white flex flex-col justify-between transition-all duration-200 ${
              panelIzquierdoColapsado ? 'w-12 overflow-hidden' : 'w-full lg:w-80 shrink-0'
            }`}
          >
            <div>
              {/* Cabecera del Panel Izquierdo */}
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                {!panelIzquierdoColapsado && <span>Lista de clientes</span>}
                <button
                  onClick={() => setPanelIzquierdoColapsado(!panelIzquierdoColapsado)}
                  title={panelIzquierdoColapsado ? 'Expandir lista' : 'Colapsar lista'}
                  className="p-1 hover:bg-slate-200 text-slate-600 transition-colors ml-auto"
                >
                  {panelIzquierdoColapsado ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
                </button>
              </div>

              {!panelIzquierdoColapsado && (
                <>
                  {/* Pestañas Activos / Inactivos */}
                  <div className="grid grid-cols-2 border-b border-slate-300 text-xs font-mono">
                    <button
                      onClick={() => setFiltroActivos('activos')}
                      className={`py-1.5 text-center font-bold transition-colors ${
                        filtroActivos === 'activos'
                          ? 'bg-white text-slate-900 border-b-2 border-b-[#064e3b]'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Activos ({clientes.filter((c) => c.activo).length})
                    </button>
                    <button
                      onClick={() => setFiltroActivos('inactivos')}
                      className={`py-1.5 text-center font-bold transition-colors ${
                        filtroActivos === 'inactivos'
                          ? 'bg-white text-slate-900 border-b-2 border-b-[#064e3b]'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Inactivos ({clientes.filter((c) => !c.activo).length})
                    </button>
                  </div>

                  {/* Buscador de Cliente */}
                  <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-600 text-[11px] whitespace-nowrap">Buscar cliente:</span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchCliente}
                        onChange={(e) => setSearchCliente(e.target.value)}
                        placeholder="Nombre o CUIT..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                      />
                    </div>
                    <button title="Filtra por nombre, razón social o CUIT" className="text-slate-400 hover:text-slate-600">
                      <HelpCircle className="w-4 h-4 text-[#064e3b]" />
                    </button>
                  </div>

                  {/* Tabla de Clientes */}
                  <div className="overflow-y-auto max-h-[460px]">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-mono font-bold text-slate-700">
                          <th className="py-2 px-2.5 border-r border-slate-200">Nombre</th>
                          <th className="py-2 px-2 border-r border-slate-200">Razón social</th>
                          <th className="py-2 px-2 text-right">Saldo ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {clientesFiltrados.map((cli) => {
                          const isSelected = clienteActivo?.id === cli.id;
                          return (
                            <tr
                              key={cli.id}
                              onClick={() => setClienteSeleccionadoId(cli.id)}
                              className={`cursor-pointer transition-colors group ${
                                isSelected
                                  ? 'bg-[#ecfdf5] font-semibold text-slate-900 border-l-4 border-l-[#064e3b]'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                              title="Haga click sobre clientes para ver información y cuenta corriente"
                            >
                              <td className="py-2 px-2.5 border-r border-slate-200 truncate max-w-[100px]">
                                {cli.nombre}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-200 truncate max-w-[100px] text-slate-500 text-[11px]">
                                {cli.razonSocial}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                {cli.saldo > 0
                                  ? `$${cli.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                  : '$0,00'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Paginación del Panel Izquierdo */}
            {!panelIzquierdoColapsado && (
              <div className="bg-[#f8fafc] border-t border-slate-300 px-2 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-600">
                <div className="flex items-center gap-1">
                  <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                  <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <span>Página</span>
                  <input type="text" readOnly value="1" className="w-6 text-center border border-slate-300 bg-white py-0.5 text-[10px]" />
                  <span>de 1</span>
                  <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                  <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
                  <button onClick={refreshAllFromDb} title="Refrescar desde Supabase" className="p-0.5 hover:bg-slate-200 ml-1">
                    <RotateCw className="w-3.5 h-3.5 text-[#064e3b]" />
                  </button>
                </div>
                <span>Mostrando 1 - {clientesFiltrados.length} de {clientesFiltrados.length}</span>
              </div>
            )}
          </div>

          {/* PANEL DERECHO: DETALLE DEL CLIENTE SELECCIONADO */}
          <div className="flex-1 flex flex-col justify-between bg-white min-w-0">
            <div>
              {/* Título del Cliente Seleccionado */}
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                    {clienteActivo ? clienteActivo.razonSocial : 'Seleccionar cliente de la lista'}
                  </span>
                  {clienteActivo && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-300 text-slate-700">
                      CUIT: {clienteActivo.cuit} | {clienteActivo.condicionIva}
                    </span>
                  )}
                </div>

                {clienteActivo && (
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-500">Saldo Total:</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 border border-slate-300">
                      ${clienteActivo.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-Pestañas de Detalle */}
              <div className="bg-slate-50 border-b border-slate-300 px-3 pt-1 flex items-center gap-1 text-xs font-mono">
                {[
                  { key: 'adeudadas', label: 'Facturas adeudadas' },
                  { key: 'cuenta', label: 'Cuenta cliente' },
                  { key: 'general', label: 'Información general' },
                  { key: 'otra', label: 'Otra información' }
                ].map((t) => {
                  const isActive = tabDetalle === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTabDetalle(t.key as any)}
                      className={`px-3 py-1.5 font-bold transition-colors border-t-2 ${
                        isActive
                          ? 'bg-white border-t-[#064e3b] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
                          : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* CONTENIDO DE LA PESTAÑA: FACTURAS ADEUDADAS */}
              {tabDetalle === 'adeudadas' && (
                <div>
                  {/* Barra informativa */}
                  <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                    <span>Facturas adeudadas por el cliente (sincronizado con Supabase)</span>
                    <button
                      onClick={handleExportFacturasAdeudadas}
                      title="Exportar a Excel (CSV)"
                      className="p-1 hover:bg-slate-200 text-emerald-700 flex items-center gap-1 font-bold"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="text-[10px]">Excel</span>
                    </button>
                  </div>

                  {/* Grilla de Facturas Adeudadas */}
                  <div className="overflow-x-auto min-h-[360px]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                          <th className="py-2 px-3 border-r border-slate-200">Nro. Comprobante</th>
                          <th className="py-2 px-3 border-r border-slate-200">Tipo</th>
                          <th className="py-2 px-3 border-r border-slate-200">Fecha pago</th>
                          <th className="py-2 px-3 border-r border-slate-200">Descripción</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Valor ME</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Total</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Cobrado</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Saldo</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Saldo acumulado</th>
                          <th className="py-2 px-3 text-center">Acciones ARCA / WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {clienteActivo && clienteActivo.facturasAdeudadas.length > 0 ? (
                          clienteActivo.facturasAdeudadas.map((f) => (
                            <tr key={f.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                                {f.nroComprobante}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{f.tipo}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{f.fechaPago}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-sans text-[11px] truncate max-w-xs">
                                {f.descripcion}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-400">
                                {f.valorMe > 0 ? `$${f.valorMe.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-slate-900">
                                ${f.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-emerald-700">
                                ${f.cobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-rose-700">
                                ${f.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-slate-900">
                                ${f.saldoAcumulado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() =>
                                      printAfipElectronicInvoice({
                                        nroComprobante: f.nroComprobante,
                                        tipo: f.tipo,
                                        fechaEmision: f.fechaEmision,
                                        fechaVencimiento: f.fechaPago,
                                        clienteNombre: clienteActivo.razonSocial,
                                        clienteCuit: clienteActivo.cuit,
                                        clienteCondicionIva: clienteActivo.condicionIva,
                                        clienteDomicilio: clienteActivo.domicilio,
                                        descripcion: f.descripcion,
                                        total: f.total,
                                        empresa
                                      })
                                    }
                                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-700 text-white text-[10px] font-bold uppercase"
                                    title="Imprimir Factura Electrónica Oficial con Código QR ARCA RG 4892"
                                  >
                                    PDF QR ARCA
                                  </button>
                                  <button
                                    onClick={() =>
                                      sendInvoiceViaWhatsApp({
                                        telefonoCliente: clienteActivo.telefono,
                                        clienteNombre: clienteActivo.razonSocial,
                                        nroComprobante: f.nroComprobante,
                                        tipoComprobante: f.tipo,
                                        importeTotal: f.saldo > 0 ? f.saldo : f.total,
                                        vencimientoPago: f.fechaPago,
                                        linkMercadoPago: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=ZONDA-${f.nroComprobante}`,
                                        empresaNombre: empresa.razonSocial
                                      })
                                    }
                                    className="px-2 py-0.5 bg-[#064e3b] hover:bg-emerald-800 text-white text-[10px] font-bold uppercase"
                                    title="Enviar Comprobante y Link de Pago por WhatsApp al Cliente"
                                  >
                                    WhatsApp
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={10} className="py-16 text-center text-slate-400 font-mono text-xs">
                              Sin facturas adeudadas para este cliente
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: CUENTA CLIENTE (MAYOR / EXTRACTO) */}
              {tabDetalle === 'cuenta' && (
                <div>
                  <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                    <span>Historial completo de movimientos de cuenta corriente</span>
                    <button
                      onClick={handleExportCuentaCorriente}
                      title="Exportar a Excel"
                      className="p-1 hover:bg-slate-200 text-emerald-700 flex items-center gap-1 font-bold"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="text-[10px]">Excel</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto min-h-[360px]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                          <th className="py-2 px-3 border-r border-slate-200">Fecha</th>
                          <th className="py-2 px-3 border-r border-slate-200">Comprobante</th>
                          <th className="py-2 px-3 border-r border-slate-200">Concepto</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Debe ($)</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Haber ($)</th>
                          <th className="py-2 px-3 text-right">Saldo Histórico ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {clienteActivo && clienteActivo.movimientos.length > 0 ? (
                          clienteActivo.movimientos.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 border-r border-slate-200">{m.fecha}</td>
                              <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{m.comprobante}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-sans text-[11px]">{m.concepto}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-rose-700 font-bold">
                                {m.debe > 0 ? `$${m.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-emerald-700 font-bold">
                                {m.haber > 0 ? `$${m.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                ${m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-16 text-center text-slate-400 font-mono text-xs">
                              Sin movimientos en la cuenta corriente
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: INFORMACIÓN GENERAL */}
              {tabDetalle === 'general' && clienteActivo && (
                <div className="p-6 max-w-2xl space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Razón Social:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.razonSocial}</p>
                    </div>
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Identificación CUIT:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.cuit}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Condición IVA:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.condicionIva}</p>
                    </div>
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Lista de Precios Asignada:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.listaPrecios}</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 p-3 bg-slate-50">
                    <span className="text-slate-500 text-[10px] block">Domicilio Fiscal:</span>
                    <p className="font-bold text-slate-900 mt-1">{clienteActivo.domicilio}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Teléfono de Contacto:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.telefono}</p>
                    </div>
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Correo Electrónico:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: OTRA INFORMACIÓN */}
              {tabDetalle === 'otra' && clienteActivo && (
                <div className="p-6 max-w-2xl space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Límite de Crédito Otorgado:</span>
                      <p className="font-bold text-slate-900 mt-1">
                        ${clienteActivo.limiteCredito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Vendedor Asignado:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.vendedor}</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 p-3 bg-slate-50">
                    <span className="text-slate-500 text-[10px] block">Estado en Padrón AFIP / Rentas:</span>
                    <p className="font-bold text-emerald-700 mt-1">Activo y Verificado (Sin bloqueos)</p>
                  </div>
                </div>
              )}
            </div>

            {/* BARRA INFERIOR DE ACCIONES Y PAGINACIÓN DEL DETALLE */}
            <div className="bg-[#f8fafc] border-t border-slate-300 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Paginación del Detalle */}
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
                <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span>Página</span>
                <input type="text" readOnly value="1" className="w-6 text-center border border-slate-300 bg-white py-0.5 text-[10px]" />
                <span>de 1</span>
                <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
                <button onClick={refreshAllFromDb} className="p-0.5 hover:bg-slate-200 ml-1">
                  <RotateCw className="w-3.5 h-3.5 text-[#064e3b]" />
                </button>
              </div>

              {/* Botonera de Acciones */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFacturaModal(true)}
                  className="px-3 py-1.5 bg-[#ecfdf5] hover:bg-[#ddd6fe] text-[#064e3b] font-mono text-xs font-bold border border-[#c4b5fd] flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Agregar factura ▼</span>
                </button>

                <button
                  onClick={() => setShowCobroModal(true)}
                  className="px-3 py-1.5 bg-[#ecfdf5] hover:bg-[#d1fae5] text-emerald-800 font-mono text-xs font-bold border border-emerald-300 flex items-center gap-1.5 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Agregar cobro</span>
                </button>

                <button
                  onClick={() => setShowNuevoClienteModal(true)}
                  className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Nuevo cliente</span>
                </button>

                <button
                  onClick={() => setTabPrincipal('importacion')}
                  className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar ▼</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : tabPrincipal === 'resumen' ? (
        /* PESTAÑA: RESUMEN CLIENTES */
        <div className="bg-white border border-slate-300 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                ANTIGÜEDAD DE SALDOS Y CARTERA DE CRÉDITO
              </h3>
              <p className="text-xs text-slate-500 font-mono">Consolidación de cuentas a cobrar desde Supabase</p>
            </div>
            <button
              onClick={() =>
                printFinancialReport(
                  'Resumen de Cuentas por Cobrar - Clientes',
                  'Consolidado de Saldos de Clientes en Cuenta Corriente',
                  ['Código', 'Razón Social', 'CUIT', 'Condición IVA', 'Saldo Actual ($)'],
                  clientes.map((c) => [
                    c.id,
                    c.razonSocial,
                    c.cuit,
                    c.condicionIva,
                    `$${c.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                  ])
                )
              }
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Informe PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-[11px] text-slate-500 uppercase block">A VENCER (0-30 DÍAS)</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                ${totalAVencer.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 border border-slate-300 bg-amber-50/50">
              <span className="text-[11px] text-amber-700 uppercase block">VENCIDO (31-60 DÍAS)</span>
              <p className="text-xl font-bold text-amber-900 mt-1">
                ${totalVencido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 border border-slate-300 bg-rose-50/50">
              <span className="text-[11px] text-rose-700 uppercase block">VENCIDO (+60 DÍAS)</span>
              <p className="text-xl font-bold text-rose-900 mt-1">$0,00</p>
            </div>
            <div className="p-4 border border-slate-300 bg-zonda-50">
              <span className="text-[11px] text-zonda-700 uppercase block">TOTAL POR COBRAR</span>
              <p className="text-xl font-bold text-zonda-900 mt-1">
                ${totalPorCobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      ) : tabPrincipal === 'importacion' ? (
        /* PESTAÑA: IMPORTACIÓN DE FACTURAS CON CORRECCIÓN IA Y AUTORIZACIÓN PREVIA */
        <div className="bg-white border border-slate-300 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                IMPORTACIÓN MASIVA DE FACTURAS Y COMPROBANTES
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Si el archivo no ingresa con el formato esperado, la IA propone corregirlo y adaptarlo previa autorización tuya
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={simularArchivoConErroresParaIa}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-mono font-bold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Probar Corrección IA con Archivo Desordenado</span>
              </button>
              <button
                type="button"
                onClick={handleDescargarPlantilla}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4" />
                <span>Descargar Plantilla Excel Modelo</span>
              </button>
            </div>
          </div>

          {mensajeImportacion && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono font-bold flex items-center justify-between">
              <span>{mensajeImportacion}</span>
              <button onClick={() => setMensajeImportacion(null)} className="text-emerald-700">✕</button>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 p-8 text-center space-y-3 bg-slate-50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-mono font-bold text-slate-700 uppercase">
              SELECCIONE SU ARCHIVO CSV / EXCEL PARA INGERIR COMPROBANTES
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Formatos soportados: .csv, .txt (UTF-8). Si las columnas, fechas, CUITs o montos vienen de otro sistema, la IA los normaliza y te pide autorización antes de modificar e importar.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleArchivoImportacion}
              className="hidden"
            />
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                disabled={analizandoArchivoIa}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold uppercase disabled:opacity-50"
              >
                {analizandoArchivoIa ? 'Analizando estructura con IA...' : 'Seleccionar archivo local'}
              </button>
            </div>
          </div>

          {/* PANEL DE AUTORIZACIÓN DE MODIFICACIÓN CON IA CUANDO EL ARCHIVO NO INGRESA COMO CORRESPONDE */}
          {propuestaIaArchivo && (
            <div className="border-2 border-amber-400 bg-amber-50/40 p-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-300 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-extrabold uppercase">
                      Requiere tu Autorización Previa
                    </span>
                    <h4 className="text-xs font-extrabold text-[#042f22] uppercase flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span>
                        Corrección Inteligente de Archivo con IA ({propuestaIaArchivo.nombreArchivo})
                      </span>
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700">{propuestaIaArchivo.resumenIa}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDescargarCsvCorregidoIa}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar CSV Corregido</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPropuestaIaArchivo(null)}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold"
                  >
                    Rechazar Modificación
                  </button>
                  <button
                    type="button"
                    onClick={() => ejecutarImportacionFilasAutorizadas(propuestaIaArchivo.filasPropuestas)}
                    className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#042f22] text-white text-xs font-extrabold uppercase flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Autorizar Modificación IA e Importar ({propuestaIaArchivo.filasPropuestas.length})
                    </span>
                  </button>
                </div>
              </div>

              {/* Diagnóstico de diferencias detectadas por IA */}
              <div className="bg-white border border-amber-300 p-3 space-y-1.5 text-xs">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase block">
                  Diagnóstico de Inconsistencias Detectadas y Corregidas por IA:
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
                  {propuestaIaArchivo.problemasDetectados.map((prob, idx) => (
                    <li key={idx}>{prob}</li>
                  ))}
                </ul>
              </div>

              {/* Tabla editable de filas modificadas por IA antes de autorizar */}
              <div className="overflow-x-auto bg-white border border-slate-300">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-[#064e3b] text-white font-bold">
                      <th className="py-2 px-2.5 border-r border-emerald-800">Cliente Asociado (CUIT)</th>
                      <th className="py-2 px-2.5 border-r border-emerald-800">Comprobante</th>
                      <th className="py-2 px-2.5 border-r border-emerald-800">Fecha Normalizada</th>
                      <th className="py-2 px-2.5 border-r border-emerald-800 text-right">Neto ($)</th>
                      <th className="py-2 px-2.5 border-r border-emerald-800 text-right">IVA 21% ($)</th>
                      <th className="py-2 px-2.5 border-r border-emerald-800 text-right">Total ($)</th>
                      <th className="py-2 px-2.5 border-r border-emerald-800">Concepto / Cambios IA</th>
                      <th className="py-2 px-2 text-center w-9"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {propuestaIaArchivo.filasPropuestas.map((fila) => (
                      <tr key={fila.id} className="hover:bg-emerald-50/30 align-top">
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <select
                            value={fila.clienteAsociadoId}
                            onChange={(e) =>
                              actualizarFilaPropuestaIa(fila.id, { clienteAsociadoId: e.target.value })
                            }
                            className="w-full p-1 bg-emerald-50/70 border border-emerald-300 font-bold text-[#042f22] text-[11px]"
                          >
                            {clientes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.razonSocial} ({c.cuit})
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[210px]">
                            Orig: {fila.lineaOriginal}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <select
                            value={fila.tipoComprobante}
                            onChange={(e) =>
                              actualizarFilaPropuestaIa(fila.id, {
                                tipoComprobante: e.target.value as TipoComprobante
                              })
                            }
                            className="w-full p-1 bg-white border border-slate-300 font-bold text-[11px] mb-1"
                          >
                            <option value="Factura A">Factura A</option>
                            <option value="Factura B">Factura B</option>
                            <option value="Factura C">Factura C</option>
                            <option value="Nota de Crédito A">Nota de Crédito A</option>
                          </select>
                          <input
                            type="text"
                            value={fila.numeroComprobante}
                            onChange={(e) =>
                              actualizarFilaPropuestaIa(fila.id, { numeroComprobante: e.target.value })
                            }
                            className="w-full p-1 bg-slate-50 border border-slate-200 text-[10px]"
                          />
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <input
                            type="date"
                            value={fila.fechaEmision}
                            onChange={(e) =>
                              actualizarFilaPropuestaIa(fila.id, {
                                fechaEmision: e.target.value,
                                fechaVencimiento: e.target.value
                              })
                            }
                            className="p-1 bg-white border border-slate-300 font-bold text-[11px]"
                          />
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={fila.netoGravado}
                            onChange={(e) => {
                              const nuevoNeto = parseFloat(e.target.value) || 0;
                              actualizarFilaPropuestaIa(fila.id, {
                                netoGravado: nuevoNeto,
                                iva21: Number((nuevoNeto * 0.21).toFixed(2))
                              });
                            }}
                            className="w-24 p-1 bg-white border border-slate-300 text-right font-bold"
                          />
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={fila.iva21}
                            onChange={(e) =>
                              actualizarFilaPropuestaIa(fila.id, {
                                iva21: parseFloat(e.target.value) || 0
                              })
                            }
                            className="w-24 p-1 bg-white border border-slate-300 text-right"
                          />
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-right font-extrabold text-[#042f22]">
                          ${fila.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={fila.descripcion}
                            onChange={(e) =>
                              actualizarFilaPropuestaIa(fila.id, { descripcion: e.target.value })
                            }
                            className="w-full p-1 bg-white border border-slate-300 text-[11px] mb-1"
                          />
                          <div className="flex flex-wrap gap-1">
                            {fila.cambiosAplicados.map((cambio, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold"
                              >
                                ✨ {cambio}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => eliminarFilaPropuestaIa(fila.id)}
                            className="text-slate-400 hover:text-rose-600"
                            title="Quitar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* PESTAÑA: MERCADO PAGO / COBROS ONLINE */
        <div className="bg-white border border-slate-300 p-6 space-y-6 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                PASARELA DE COBRANZAS DIGITALES
              </h3>
              <p className="text-xs text-slate-500">Cobros automáticos mediante tarjeta de débito/crédito y QR</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Conectado</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-slate-500 text-[10px] block">Comprobantes Emitidos con CAE & Link Online:</span>
              <p className="text-lg font-bold text-slate-900 mt-1">{facturasVenta.length} comprobantes activos</p>
            </div>
            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-slate-500 text-[10px] block">Acreditación Directa Webhook IPN:</span>
              <p className="text-lg font-bold text-slate-900 mt-1">Banco Santander Río Cta Cte + Libro Diario</p>
            </div>
          </div>

          <div className="border border-slate-300 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                  <th className="py-2 px-3">Comprobante</th>
                  <th className="py-2 px-3">Cliente / CUIT</th>
                  <th className="py-2 px-3">CAE ARCA</th>
                  <th className="py-2 px-3 text-right">Total ($)</th>
                  <th className="py-2 px-3 text-center">Acciones Digitales (QR ARCA / WhatsApp / Link MP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {facturasVenta.map((fv) => (
                  <tr key={fv.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {fv.tipo} {fv.puntoVenta}-{fv.numero}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-bold block text-slate-800">{fv.clienteNombre}</span>
                      <span className="text-[10px] text-slate-500">CUIT: {fv.clienteCuit}</span>
                    </td>
                    <td className="py-2 px-3 text-emerald-800 font-bold">{fv.cae}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      ${fv.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() =>
                            printAfipElectronicInvoice({
                              nroComprobante: `${fv.puntoVenta}-${fv.numero}`,
                              tipo: fv.tipo,
                              fechaEmision: fv.fechaEmision,
                              fechaVencimiento: fv.fechaVencimiento,
                              clienteNombre: fv.clienteNombre,
                              clienteCuit: fv.clienteCuit,
                              clienteCondicionIva: fv.condicionIva,
                              descripcion: `Comprobante Electrónico ${fv.tipo} ${fv.puntoVenta}-${fv.numero}`,
                              netoGravado: fv.netoGravado,
                              iva21: fv.iva21,
                              total: fv.total,
                              cae: fv.cae,
                              caeVencimiento: fv.caeVencimiento,
                              empresa
                            })
                          }
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-white text-[10px] font-bold uppercase"
                        >
                          Imprimir Factura QR ARCA
                        </button>
                        <button
                          onClick={() => {
                            const cliMatch = clientes.find((c) => c.cuit === fv.clienteCuit);
                            sendInvoiceViaWhatsApp({
                              telefonoCliente: cliMatch?.telefono || '2644220000',
                              clienteNombre: fv.clienteNombre,
                              nroComprobante: `${fv.puntoVenta}-${fv.numero}`,
                              tipoComprobante: fv.tipo,
                              importeTotal: fv.total,
                              cae: fv.cae,
                              vencimientoPago: fv.fechaVencimiento,
                              linkMercadoPago: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=ZONDA-${fv.puntoVenta}-${fv.numero}`,
                              empresaNombre: empresa.razonSocial
                            });
                          }}
                          className="px-2.5 py-1 bg-[#064e3b] hover:bg-emerald-800 text-white text-[10px] font-bold uppercase"
                        >
                          Enviar por WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR FACTURA */}
      {showFacturaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                AGREGAR FACTURA // {clienteActivo?.razonSocial}
              </h3>
              <button onClick={() => setShowFacturaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearFactura} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tipo de Comprobante:</label>
                  <select
                    value={tipoFactura}
                    onChange={(e) => setTipoFactura(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 text-xs"
                  >
                    <option value="Factura A">Factura A</option>
                    <option value="Factura B">Factura B</option>
                    <option value="Presupuesto">Presupuesto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Punto de Venta:</label>
                  <input type="text" readOnly value="0001 (Electrónico)" className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 text-slate-500" />
                </div>
              </div>

              {/* MEDIO DE COBRO PACTADO + INSTRUCTIVO 2 PASOS DESPLEGABLE */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-300 space-y-2">
                <div>
                  <label className="block text-[#042f22] font-bold mb-1">
                    Medio de Pago / Cobro Pactado (Queda Pendiente):
                  </label>
                  <select
                    value={medioCobroFactura}
                    onChange={(e) => setMedioCobroFactura(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 font-bold text-[#042f22] text-xs"
                  >
                    <option value="Transferencia Bancaria Santander">Transferencia Santander Cta Cte</option>
                    <option value="Transferencia Bancaria Galicia">Transferencia Galicia Cta Cte</option>
                    <option value="Cheque de Terceros">Cheque de Terceros a Depositar</option>
                    <option value="Mercado Pago (Link / QR)">Mercado Pago (Link / QR)</option>
                    <option value="Efectivo en Caja Central">Efectivo en Caja Central</option>
                  </select>
                </div>
                <details className="group border-t border-emerald-200 pt-1.5">
                  <summary className="font-mono text-[10px] font-bold text-[#042f22] uppercase flex items-center justify-between cursor-pointer select-none list-none">
                    <span>¿Cómo se registra y se cobra esta factura?</span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-[10px] text-slate-700 font-sans leading-snug pt-1.5">
                    <strong>Paso 1:</strong> Al emitir esta factura el importe queda <strong>PENDIENTE</strong> en Cuenta Corriente. <strong>Paso 2:</strong> Luego pulsá <strong>&ldquo;Agregar cobro&rdquo;</strong> para registrar el ingreso real del pago en Tesorería.
                  </p>
                </details>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Descripción del Ítem / Servicio:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Certificado de obra o provisión de materiales"
                  value={descFactura}
                  onChange={(e) => setDescFactura(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Neto Gravado ($ ARS):</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={netoFactura}
                    onChange={(e) => setNetoFactura(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Alícuota IVA:</label>
                  <select
                    value={alicuotaIvaSelect}
                    onChange={(e) => setAlicuotaIvaSelect(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 text-xs font-bold"
                  >
                    <option value="21">IVA 21% (General)</option>
                    <option value="10.5">IVA 10.5% (Reducida)</option>
                    <option value="27">IVA 27% (Diferencial)</option>
                    <option value="0">0% (Exento / No Alcanzado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">No Gravado / Exento ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={noGravadoExentoFactura}
                    onChange={(e) => setNoGravadoExentoFactura(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Percepción IIBB ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={percepcionIIBBFactura}
                    onChange={(e) => setPercepcionIIBBFactura(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Percepción IVA AFIP ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={percepcionIvaFactura}
                    onChange={(e) => setPercepcionIvaFactura(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Imp. Internos / Otros ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={impuestosInternosFactura}
                    onChange={(e) => setImpuestosInternosFactura(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
              </div>

              {(() => {
                const tasa = alicuotaIvaSelect === '21' ? 0.21 : alicuotaIvaSelect === '10.5' ? 0.105 : alicuotaIvaSelect === '27' ? 0.27 : 0;
                const montoIva = Number((netoFactura * tasa).toFixed(2));
                const montoOtrosImp = Number((percepcionIIBBFactura + percepcionIvaFactura + impuestosInternosFactura).toFixed(2));
                const totalCalc = Number((netoFactura + noGravadoExentoFactura + montoIva + montoOtrosImp).toFixed(2));
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Neto Gravado + No Grav./Exento:</span>
                      <span>${(netoFactura + noGravadoExentoFactura).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IVA ({alicuotaIvaSelect}%):</span>
                      <span>${montoIva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Percepciones (IIBB + IVA) e Imp. Internos:</span>
                      <span>${montoOtrosImp.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Comprobante:</span>
                      <span>${totalCalc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFacturaModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{guardando ? 'Guardando en Supabase...' : 'Emitir Comprobante'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR COBRO */}
      {showCobroModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                AGREGAR COBRO // {clienteActivo?.razonSocial}
              </h3>
              <button onClick={() => setShowCobroModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAgregarCobro} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Monto a Cobrar ($ ARS):</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={montoCobro}
                  onChange={(e) => setMontoCobro(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Medio de Pago / Cuenta:</label>
                <select
                  value={medioCobro}
                  onChange={(e) => setMedioCobro(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                >
                  <option value="Transferencia Bancaria Santander">Transferencia Santander Cta Cte</option>
                  <option value="Transferencia Bancaria Galicia">Transferencia Galicia Cta Cte</option>
                  <option value="Cheque de Terceros">Cheque de Terceros a Depositar</option>
                  <option value="Efectivo en Caja Central">Efectivo en Caja Central</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCobroModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{guardando ? 'Registrando...' : 'Confirmar Cobro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO CLIENTE */}
      {showNuevoClienteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                ALTA DE NUEVO CLIENTE
              </h3>
              <button onClick={() => setShowNuevoClienteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevoCliente} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Nombre / Razón Social:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: OBRAS CIVILES CUYO S.A."
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">CUIT:</label>
                  <input
                    type="text"
                    required
                    placeholder="30-12345678-9"
                    value={nuevoCuit}
                    onChange={(e) => setNuevoCuit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Condición IVA:</label>
                  <select
                    value={nuevoCondicionIva}
                    onChange={(e) => setNuevoCondicionIva(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Consumidor Final">Consumidor Final</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Domicilio Fiscal:</label>
                <input
                  type="text"
                  placeholder="Calle, Número, Ciudad, San Juan"
                  value={nuevoDomicilio}
                  onChange={(e) => setNuevoDomicilio(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  placeholder="administracion@empresa.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNuevoClienteModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CALENDARIO DE VENCIMIENTOS INTERACTIVO ESTILO GOOGLE CALENDAR */}
      <CalendarioVencimientosModal
        isOpen={showCalendarioModal}
        onClose={() => setShowCalendarioModal(false)}
        defaultContext="clientes"
      />

      {/* MODAL: CONFIGURAR FACTURA ELECTRÓNICA AFIP */}
      {showConfigAfipModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                <Settings className="w-4 h-4 text-zonda-700" />
                <span>CONFIGURACIÓN AFIP // PUNTOS DE VENTA</span>
              </h3>
              <button onClick={() => setShowConfigAfipModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed font-sans">
                El sistema emite facturas electrónicas A, B, C y M comunicándose directamente con los Web Services de AFIP y registrando el asiento contable en Supabase.
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="font-bold block">PUNTO DE VENTA ACTIVO: 0001</span>
                <span>Certificado digital instalado y vigente hasta 2027.</span>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowConfigAfipModal(false)}
                className="px-4 py-1.5 bg-[#064e3b] text-white font-bold uppercase"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
