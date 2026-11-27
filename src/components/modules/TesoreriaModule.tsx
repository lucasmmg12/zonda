import React, { useState } from 'react';
import {
  Calendar,
  HelpCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  Plus,
  CheckCircle2,
  X,
  ChevronUp,
  ChevronDown,
  ArrowRightLeft,
  FileText,
  DollarSign,
  Download
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import { exportToExcelCsv, printFinancialReport } from '../../utils/exportUtils';
import { CalendarioVencimientosModal } from '../modals/CalendarioVencimientosModal';
import { ConciliacionBancariaModal } from '../modals/ConciliacionBancariaModal';

export const TesoreriaModule: React.FC = () => {
  const {
    clientes,
    proveedores,
    cuentasBancarias,
    cheques,
    crearCuentaBancaria,
    editarCuentaBancaria,
    conciliarCuentaBancaria,
    depositarCheque,
    registrarCobroCliente,
    registrarPagoProveedor,
    registrarMovimientoTesoreria,
    refreshAllFromDb
  } = useErp();

  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState<string>('CTA-01');
  const [periodoGrafico, setPeriodoGrafico] = useState<'mensual' | 'trimestral' | 'anual'>('mensual');
  const [graficoColapsado, setGraficoColapsado] = useState(true);

  // Modales
  const [showAgregarCuentaModal, setShowAgregarCuentaModal] = useState(false);
  const [showConciliarModal, setShowConciliarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [showMovimientoInternoModal, setShowMovimientoInternoModal] = useState(false);
  const [showReporteModal, setShowReporteModal] = useState<string | null>(null);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);

  // Formulario nueva cuenta
  const [nuevoNombreCuenta, setNuevoNombreCuenta] = useState('');
  const [nuevoTipoCuenta, setNuevoTipoCuenta] = useState<'Caja Física' | 'Cuenta Corriente' | 'Tarjeta' | 'Cheques'>('Cuenta Corriente');
  const [nuevoSaldoInicial, setNuevoSaldoInicial] = useState<number>(0);

  // Formulario Editar Cuenta
  const [editNombreCuenta, setEditNombreCuenta] = useState('');
  const [editBancoCuenta, setEditBancoCuenta] = useState('');
  const [editCbuCuenta, setEditCbuCuenta] = useState('');

  // Formulario Pago (Vinculado a Proveedores + Facturas Adeudadas)
  const [pagoProveedorId, setPagoProveedorId] = useState<string>('');
  const [pagoFacturaId, setPagoFacturaId] = useState<string>('');
  const [pagoProveedor, setPagoProveedor] = useState('');
  const [pagoMonto, setPagoMonto] = useState<number>(50000);
  const [pagoConcepto, setPagoConcepto] = useState('');

  // Formulario Cobranza (Vinculado a Clientes + Facturas Adeudadas)
  const [cobroClienteId, setCobroClienteId] = useState<string>('');
  const [cobroFacturaId, setCobroFacturaId] = useState<string>('');
  const [cobroCliente, setCobroCliente] = useState('');
  const [cobroMonto, setCobroMonto] = useState<number>(120000);
  const [cobroConcepto, setCobroConcepto] = useState('');

  // Formulario Movimiento Interno
  const [tipoMovInterno, setTipoMovInterno] = useState<'Extracción Efectivo' | 'Depósito Bancario' | 'Canje de Cheque'>('Extracción Efectivo');
  const [montoMovInterno, setMontoMovInterno] = useState<number>(100000);

  const cuentaActiva = cuentasBancarias.find((c) => c.id === cuentaSeleccionadaId) || cuentasBancarias[0];

  const mesesGrafico = [
    { mes: 'Nov', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'Dic', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'Ene', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'Feb', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'Mar', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'Abr', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'May', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'Jun', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'Jul', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'Ago', ingresos: 0, egresos: 0, saldo: 0 },
    { mes: 'Sep', ingresos: 490000, egresos: 1738683, saldo: -1248683 },
    { mes: 'Oct', ingresos: 120000, egresos: 85000, saldo: cuentaActiva?.saldoActual || -1213683 }
  ];

  // Agregar Pago en Supabase + Proveedores (Cuenta Corriente + Factura) + Contabilidad
  const handleCrearPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaActiva) return;

    const prvSel = proveedores.find((p) => p.id === pagoProveedorId);
    if (prvSel) {
      const facSel = prvSel.facturasAdeudadas.find((f) => f.id === pagoFacturaId);
      await registrarPagoProveedor({
        proveedorId: prvSel.id,
        monto: pagoMonto,
        medioPago: cuentaActiva.nombre,
        cuentaBancariaId: cuentaActiva.id,
        facturaId: facSel?.id,
        facturaNro: facSel ? `${facSel.tipo} ${facSel.nroComprobante}` : pagoConcepto || undefined
      });
    } else {
      await registrarMovimientoTesoreria({
        cuentaId: cuentaActiva.id,
        tipo: 'PAG',
        clienteProveedor: pagoProveedor || 'PROVEEDOR VARIOS',
        descripcion: pagoConcepto || 'Pago de tesorería registrado',
        ingresos: 0,
        egresos: pagoMonto
      });
    }

    setShowPagoModal(false);
    setPagoProveedorId('');
    setPagoFacturaId('');
    setPagoProveedor('');
    setPagoConcepto('');
  };

  // Agregar Cobranza en Supabase + Clientes (Cuenta Corriente + Factura) + Contabilidad
  const handleCrearCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaActiva) return;

    const cliSel = clientes.find((c) => c.id === cobroClienteId);
    if (cliSel) {
      const facSel = cliSel.facturasAdeudadas.find((f) => f.id === cobroFacturaId);
      await registrarCobroCliente({
        clienteId: cliSel.id,
        monto: cobroMonto,
        medioCobro: cuentaActiva.nombre,
        cuentaBancariaId: cuentaActiva.id,
        facturaId: facSel?.id,
        facturaNro: facSel ? `${facSel.tipo} ${facSel.nroComprobante}` : cobroConcepto || undefined
      });
    } else {
      await registrarMovimientoTesoreria({
        cuentaId: cuentaActiva.id,
        tipo: 'COB',
        clienteProveedor: cobroCliente || 'CLIENTE VARIOS',
        descripcion: cobroConcepto || 'Cobranza de tesorería registrada',
        ingresos: cobroMonto,
        egresos: 0
      });
    }

    setShowCobroModal(false);
    setCobroClienteId('');
    setCobroFacturaId('');
    setCobroCliente('');
    setCobroConcepto('');
  };

  // Agregar Movimiento Interno (Extracción / Depósito)
  const handleCrearMovInterno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaActiva) return;

    const esIngreso = tipoMovInterno === 'Depósito Bancario' || tipoMovInterno === 'Extracción Efectivo';

    await registrarMovimientoTesoreria({
      cuentaId: cuentaActiva.id,
      tipo: 'EXE',
      clienteProveedor: 'MOVIMIENTO INTERNO',
      descripcion: tipoMovInterno,
      ingresos: esIngreso ? montoMovInterno : 0,
      egresos: !esIngreso ? montoMovInterno : 0
    });

    setShowMovimientoInternoModal(false);
  };

  // Crear Cuenta en Supabase
  const handleCrearCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    const nueva = await crearCuentaBancaria({
      nombre: nuevoNombreCuenta || 'Nueva Cuenta Bancaria',
      banco: nuevoTipoCuenta === 'Cuenta Corriente' ? 'Banco Operativo' : 'Caja Fiduciaria',
      tipoCuenta: nuevoTipoCuenta,
      moneda: 'ARS',
      saldoInicial: nuevoSaldoInicial
    });

    setCuentaSeleccionadaId(nueva.id);
    setShowAgregarCuentaModal(false);
    setNuevoNombreCuenta('');
    setNuevoSaldoInicial(0);
  };

  // Abrir Modal Editar Cuenta
  const handleAbrirEditar = (c: typeof cuentaActiva) => {
    if (!c) return;
    setCuentaSeleccionadaId(c.id);
    setEditNombreCuenta(c.nombre);
    setEditBancoCuenta(c.banco);
    setEditCbuCuenta(c.cbu || '');
    setShowEditarModal(true);
  };

  // Guardar Edición Cuenta
  const handleGuardarEdicionCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaActiva) return;
    await editarCuentaBancaria(cuentaActiva.id, {
      nombre: editNombreCuenta,
      banco: editBancoCuenta,
      cbu: editCbuCuenta || undefined
    });
    setShowEditarModal(false);
  };

  // Conciliar Cuenta en Supabase
  const handleConfirmarConciliacion = async () => {
    if (!cuentaActiva) return;
    await conciliarCuentaBancaria(cuentaActiva.id);
    setShowConciliarModal(false);
  };

  // Exportar Movimientos a Excel
  const handleExportarMovimientosExcel = () => {
    if (!cuentaActiva) return;
    exportToExcelCsv(
      `Movimientos_${cuentaActiva.nombre.replace(/\s+/g, '_')}`,
      (cuentaActiva.movimientos || []).map((m) => ({
        Cuenta: cuentaActiva.nombre,
        Fecha: m.fecha,
        Tercero: m.clienteProveedor,
        Tipo: m.tipo,
        Numero: m.nro,
        Cheque: m.nroCheque || '-',
        Descripcion: m.descripcion,
        Ingresos: m.ingresos,
        Egresos: m.egresos,
        Saldo: m.saldo
      }))
    );
  };

  // Exportar PDF de Cheques
  const handleDescargarReporteChequesPdf = () => {
    printFinancialReport(
      showReporteModal || 'REPORTE DE CHEQUES Y VALORES',
      `Auditoría de Cartera de Valores - ${new Date().toLocaleDateString('es-AR')}`,
      ['Nro. Cheque', 'Banco', 'Librador / Destino', 'Emisión', 'Cobro', 'Estado', 'Monto ($)'],
      cheques.map((ch) => [
        ch.numero,
        ch.bancoEmisor,
        ch.librador,
        ch.fechaEmision,
        ch.fechaPago,
        ch.estado,
        `$${ch.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
      ])
    );
  };

  const chequesEnCartera = cheques.filter((c) => c.estado === 'En Cartera');
  const chequesEmitidos = cheques.filter((c) => c.tipo === 'Cheque Propio Diferido');
  const totalCartera = chequesEnCartera.reduce((acc, c) => acc + c.importe, 0);
  const totalEmitidos = chequesEmitidos.reduce((acc, c) => acc + c.importe, 0);

  return (
    <div className="space-y-4 text-slate-800 font-sans">
      {/* 1. CABECERA LIMPIA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Tesorería y Bancos</h1>
          <p className="text-xs text-slate-500">
            Saldos disponibles, conciliación bancaria y movimientos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setGraficoColapsado(!graficoColapsado)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>{graficoColapsado ? 'Ver gráfico y cheques' : 'Ocultar gráfico'}</span>
            {graficoColapsado ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowAgregarCuentaModal(true)}
            className="px-4 py-2 rounded-xl bg-[#3563e9] hover:bg-[#2952cc] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>

      {/* 2. VISTA PRINCIPAL LIMPIA */}
      <div className="flex flex-col lg:flex-row min-h-[600px] bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* PANEL IZQUIERDO: CUENTAS */}
        <div className="w-full lg:w-80 shrink-0 border-r border-slate-200/80 bg-white flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Cajas y Cuentas</span>
              <span className="text-[11px] text-slate-400">{cuentasBancarias.length} activas</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[540px]">
              {cuentasBancarias.map((c) => {
                const isSelected = cuentaActiva?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setCuentaSeleccionadaId(c.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#eff3fd]/70 border-l-4 border-l-[#3563e9]'
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 text-xs truncate">{c.nombre}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-semibold">
                        {c.moneda}
                      </span>
                    </div>

                    <div className="mt-1.5 text-base font-extrabold tabular-nums">
                      <span className={c.saldoActual < 0 ? 'text-rose-600' : 'text-slate-900'}>
                        ${c.saldoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConciliarModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold"
                        >
                          Conciliar extracto
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAbrirEditar(c);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-medium"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: DETALLE Y MOVIMIENTOS */}
        <div className="flex-1 flex flex-col justify-between bg-white min-w-0">
          <div>
            {/* GRÁFICO DESPLEGABLE BAJO DEMANDA ("MENOS ES MÁS") */}
            {!graficoColapsado && (
              <div className="border-b border-slate-100 bg-slate-50/40">
                <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Centro: Gráfico Últimos 12 Meses */}
                  <div className="lg:col-span-3 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-800">Últimos 12 meses</span>
                      </div>

                      {/* Leyenda del Gráfico */}
                      <div className="flex items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-2 bg-[#22c55e]"></span>
                          <span>Total ingresos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-2 bg-[#f59e0b]"></span>
                          <span>Total egresos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-600 inline-block"></span>
                          <span>Saldo</span>
                        </div>
                      </div>
                    </div>

                    {/* Área Gráfica de Barras y Línea de Saldo */}
                    <div className="h-44 border border-slate-200 bg-[#fafafa] relative p-3 flex items-end justify-between gap-2">
                      {/* Eje Y sutil */}
                      <div className="absolute left-1 top-2 bottom-2 flex flex-col justify-between text-[9px] font-mono text-slate-400">
                        <span>$3M</span>
                        <span>$0M</span>
                        <span>-$2M</span>
                      </div>

                      <div className="flex-1 flex items-end justify-between pl-6 pr-2 h-full">
                        {mesesGrafico.map((m, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <div className="w-full flex items-end justify-center gap-1 h-32">
                              {m.ingresos > 0 && (
                                <div
                                  className="w-2.5 bg-[#22c55e] transition-all"
                                  style={{ height: `${Math.min(100, (m.ingresos / 2000000) * 100)}%` }}
                                  title={`Ingresos ${m.mes}: $${m.ingresos}`}
                                ></div>
                              )}
                              {m.egresos > 0 && (
                                <div
                                  className="w-2.5 bg-[#f59e0b] transition-all"
                                  style={{ height: `${Math.min(100, (m.egresos / 2000000) * 100)}%` }}
                                  title={`Egresos ${m.mes}: $${m.egresos}`}
                                ></div>
                              )}
                              <div
                                className="w-1.5 h-1.5 rounded-full bg-slate-600 -mb-1 z-10"
                                title={`Saldo ${m.mes}: $${m.saldo}`}
                              ></div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{m.mes}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Filtros de período */}
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      {(['mensual', 'trimestral', 'anual'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriodoGrafico(p)}
                          className={`px-3 py-0.5 border text-xs capitalize transition-colors ${
                            periodoGrafico === p
                              ? 'bg-white border-slate-400 font-bold text-slate-900 shadow-sm'
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Derecha: Widget Reportes */}
                  <div className="border border-slate-200 p-3 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-xs font-mono font-bold text-slate-900">
                        <span>Reportes</span>
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      </div>

                      <div className="mt-3 space-y-2 text-xs font-mono">
                        <button
                          onClick={() => setShowReporteModal('Reporte de cheques en cartera')}
                          className="block text-left text-slate-700 hover:text-[#064e3b] hover:underline"
                        >
                          Reporte de cheques en cartera ({chequesEnCartera.length})
                        </button>
                        <button
                          onClick={() => setShowReporteModal('Reporte de cheques emitidos diferidos')}
                          className="block text-left text-slate-700 hover:text-[#064e3b] hover:underline"
                        >
                          Reporte de cheques emitidos diferidos ({chequesEmitidos.length})
                        </button>
                        <button
                          onClick={() => setShowReporteModal('Reporte de seguimiento de cheques')}
                          className="block text-left text-slate-700 hover:text-[#064e3b] hover:underline"
                        >
                          Reporte de seguimiento de cheques ({cheques.length})
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-400">
                      AUDITORÍA GROW LABS
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN PRINCIPAL: MOVIMIENTOS DE LA CUENTA (5 Columnas Limpias) */}
            <div>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Movimientos — {cuentaActiva?.nombre}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ingresos, egresos y saldo conciliado en tiempo real
                  </p>
                </div>
                <button
                  onClick={handleExportarMovimientosExcel}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
              </div>

              <div className="overflow-x-auto min-h-[360px]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-5">Fecha</th>
                      <th className="py-3 px-3">Concepto / Contraparte</th>
                      <th className="py-3 px-3 text-right">Ingresos</th>
                      <th className="py-3 px-3 text-right">Egresos</th>
                      <th className="py-3 px-5 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cuentaActiva?.movimientos && cuentaActiva.movimientos.length > 0 ? (
                      cuentaActiva.movimientos.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-5 text-slate-500 tabular-nums whitespace-nowrap">
                            {m.fecha}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">
                              {m.clienteProveedor || m.descripcion || '-'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {m.tipo} #{m.nro} {m.descripcion ? `· ${m.descripcion}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-emerald-600 tabular-nums">
                            {m.ingresos > 0
                              ? `+$${m.ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-rose-600 tabular-nums">
                            {m.egresos > 0
                              ? `-$${m.egresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                          <td className="py-3 px-5 text-right font-bold text-slate-900 tabular-nums">
                            ${m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-400 text-xs">
                          Aún no hay movimientos registrados en esta cuenta.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. BARRA INFERIOR DE ACCIONES LIMPIA */}
          <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {cuentaActiva?.movimientos?.length || 0} movimiento(s)
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCobroModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Registrar Ingreso</span>
              </button>

              <button
                onClick={() => setShowPagoModal(true)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>Registrar Pago</span>
              </button>

              <button
                onClick={() => setShowMovimientoInternoModal(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transferir / Canje</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: PAGOS */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                REGISTRAR PAGO // {cuentaActiva?.nombre}
              </h3>
              <button onClick={() => setShowPagoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearPago} className="space-y-4">
              <div>
                <label className="block text-[#042f22] font-bold mb-1">
                  1. Seleccionar Proveedor (Sincroniza Cuenta Corriente y Factura):
                </label>
                <select
                  value={pagoProveedorId}
                  onChange={(e) => {
                    const idPrv = e.target.value;
                    setPagoProveedorId(idPrv);
                    setPagoFacturaId('');
                    const prvObj = proveedores.find((p) => p.id === idPrv);
                    if (prvObj) {
                      setPagoProveedor(prvObj.razonSocial);
                      const primeraFac = prvObj.facturasAdeudadas.find((f) => f.saldo > 0);
                      if (primeraFac) {
                        setPagoFacturaId(primeraFac.id);
                        setPagoMonto(primeraFac.saldo);
                        setPagoConcepto(`Cancelación ${primeraFac.tipo} ${primeraFac.nroComprobante}`);
                      } else if (prvObj.saldo > 0) {
                        setPagoMonto(prvObj.saldo);
                      }
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-400 font-bold text-[#042f22]"
                >
                  <option value="">-- Otro Beneficiario / Gasto Eventual --</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.razonSocial} (CUIT: {p.cuit} · Saldo: ${p.saldo.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              {pagoProveedorId ? (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    2. Factura Adeudada del Proveedor a Cancelar:
                  </label>
                  <select
                    value={pagoFacturaId}
                    onChange={(e) => {
                      const idFac = e.target.value;
                      setPagoFacturaId(idFac);
                      const prvObj = proveedores.find((p) => p.id === pagoProveedorId);
                      const facObj = prvObj?.facturasAdeudadas.find((f) => f.id === idFac);
                      if (facObj && facObj.saldo > 0) {
                        setPagoMonto(facObj.saldo);
                        setPagoConcepto(`Cancelación ${facObj.tipo} ${facObj.nroComprobante}`);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 font-bold text-slate-900"
                  >
                    <option value="">-- Imputación Automática (Más antigua) --</option>
                    {proveedores
                      .find((p) => p.id === pagoProveedorId)
                      ?.facturasAdeudadas.filter((f) => f.saldo > 0)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.tipo} {f.nroComprobante} — Saldo: ${f.saldo.toLocaleString('es-AR')}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Beneficiario Eventual:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: VIÁTICOS OBRA / SERVICIO EVENTUAL"
                    value={pagoProveedor}
                    onChange={(e) => setPagoProveedor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 uppercase"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-bold mb-1">Monto de Egreso ($ ARS):</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Concepto / Referencia:</label>
                <input
                  type="text"
                  placeholder="Ej: Cancelación Factura A 0001-00000052"
                  value={pagoConcepto}
                  onChange={(e) => setPagoConcepto(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPagoModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COBRANZAS */}
      {showCobroModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                REGISTRAR COBRANZA // {cuentaActiva?.nombre}
              </h3>
              <button onClick={() => setShowCobroModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearCobro} className="space-y-4">
              <div>
                <label className="block text-[#042f22] font-bold mb-1">
                  1. Seleccionar Cliente (Sincroniza Cuenta Corriente y Factura):
                </label>
                <select
                  value={cobroClienteId}
                  onChange={(e) => {
                    const idCli = e.target.value;
                    setCobroClienteId(idCli);
                    setCobroFacturaId('');
                    const cliObj = clientes.find((c) => c.id === idCli);
                    if (cliObj) {
                      setCobroCliente(cliObj.razonSocial);
                      const primeraFac = cliObj.facturasAdeudadas.find((f) => f.saldo > 0);
                      if (primeraFac) {
                        setCobroFacturaId(primeraFac.id);
                        setCobroMonto(primeraFac.saldo);
                        setCobroConcepto(`Cobro ${primeraFac.tipo} ${primeraFac.nroComprobante}`);
                      } else if (cliObj.saldo > 0) {
                        setCobroMonto(cliObj.saldo);
                      }
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-400 font-bold text-[#042f22]"
                >
                  <option value="">-- Otro Pagador / Ingreso Eventual --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razonSocial} (CUIT: {c.cuit} · Saldo: ${c.saldo.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              {cobroClienteId ? (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    2. Factura Adeudada del Cliente a Cobrar:
                  </label>
                  <select
                    value={cobroFacturaId}
                    onChange={(e) => {
                      const idFac = e.target.value;
                      setCobroFacturaId(idFac);
                      const cliObj = clientes.find((c) => c.id === cobroClienteId);
                      const facObj = cliObj?.facturasAdeudadas.find((f) => f.id === idFac);
                      if (facObj && facObj.saldo > 0) {
                        setCobroMonto(facObj.saldo);
                        setCobroConcepto(`Cobro ${facObj.tipo} ${facObj.nroComprobante}`);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 font-bold text-slate-900"
                  >
                    <option value="">-- Imputación Automática (Más antigua) --</option>
                    {clientes
                      .find((c) => c.id === cobroClienteId)
                      ?.facturasAdeudadas.filter((f) => f.saldo > 0)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.tipo} {f.nroComprobante} — Saldo: ${f.saldo.toLocaleString('es-AR')}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Pagador Eventual:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: REINTEGRO / INGRESO EXTRAORDINARIO"
                    value={cobroCliente}
                    onChange={(e) => setCobroCliente(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 uppercase"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-bold mb-1">Monto de Ingreso ($ ARS):</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={cobroMonto}
                  onChange={(e) => setCobroMonto(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Concepto / Recibo:</label>
                <input
                  type="text"
                  placeholder="Ej: Cobro Certificado de Obra #4"
                  value={cobroConcepto}
                  onChange={(e) => setCobroConcepto(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
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
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar Cobranza</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CUENTA */}
      {showEditarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                EDITAR CUENTA // {cuentaActiva?.id}
              </h3>
              <button onClick={() => setShowEditarModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionCuenta} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Nombre de la Cuenta / Caja:</label>
                <input
                  type="text"
                  required
                  value={editNombreCuenta}
                  onChange={(e) => setEditNombreCuenta(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Entidad Bancaria / Responsable:</label>
                <input
                  type="text"
                  required
                  value={editBancoCuenta}
                  onChange={(e) => setEditBancoCuenta(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">CBU / Alias (Opcional):</label>
                <input
                  type="text"
                  value={editCbuCuenta}
                  onChange={(e) => setEditCbuCuenta(e.target.value)}
                  placeholder="0720000720000001293840"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditarModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVIMIENTOS INTERNOS (DEPÓSITOS / EXTRACCIONES / CANJES) */}
      {showMovimientoInternoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                MOVIMIENTO INTERNO DE FONDOS
              </h3>
              <button onClick={() => setShowMovimientoInternoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearMovInterno} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Tipo de Operación:</label>
                <select
                  value={tipoMovInterno}
                  onChange={(e) => setTipoMovInterno(e.target.value as 'Extracción Efectivo' | 'Depósito Bancario' | 'Canje de Cheque')}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                >
                  <option value="Extracción Efectivo">Extracción en Efectivo de Banco a Caja</option>
                  <option value="Depósito Bancario">Depósito en Efectivo de Caja a Banco</option>
                  <option value="Canje de Cheque">Canje de Cheque por Efectivo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Monto a Transferir ($ ARS):</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={montoMovInterno}
                  onChange={(e) => setMontoMovInterno(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovimientoInternoModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase"
                >
                  Asentar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR CUENTA */}
      {showAgregarCuentaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                AGREGAR CUENTA / CAJA BANCARIA (SUPABASE DB)
              </h3>
              <button onClick={() => setShowAgregarCuentaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearCuenta} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Nombre Identificatorio:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Banco Macro Cta Cte"
                  value={nuevoNombreCuenta}
                  onChange={(e) => setNuevoNombreCuenta(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Tipo de Cuenta:</label>
                <select
                  value={nuevoTipoCuenta}
                  onChange={(e) => setNuevoTipoCuenta(e.target.value as 'Caja Física' | 'Cuenta Corriente' | 'Tarjeta' | 'Cheques')}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                >
                  <option value="Cuenta Corriente">Cuenta Corriente Bancaria</option>
                  <option value="Caja Física">Caja Física / Efectivo</option>
                  <option value="Tarjeta">Tarjeta Corporativa</option>
                  <option value="Cheques">Cartera de Valores</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Saldo Inicial ($ ARS):</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoSaldoInicial}
                  onChange={(e) => setNuevoSaldoInicial(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAgregarCuentaModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONCILIAR POR EXTRACTO CSV */}
      {showConciliarModal && cuentaActiva && (
        <ConciliacionBancariaModal
          isOpen={showConciliarModal}
          onClose={() => setShowConciliarModal(false)}
          cuenta={cuentaActiva}
        />
      )}

      {/* MODAL: REPORTES DE CHEQUES */}
      {showReporteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                {showReporteModal}
              </h3>
              <button onClick={() => setShowReporteModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="border border-slate-200 p-3 bg-slate-50 space-y-1">
                <div className="flex justify-between">
                  <span>Cheques en Cartera:</span>
                  <span className="font-bold text-slate-900">
                    {chequesEnCartera.length} valores (${totalCartera.toLocaleString('es-AR', { minimumFractionDigits: 2 })})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cheques Emitidos Diferidos:</span>
                  <span className="font-bold text-slate-900">
                    {chequesEmitidos.length} valores (${totalEmitidos.toLocaleString('es-AR', { minimumFractionDigits: 2 })})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estado de Compensación:</span>
                  <span className="font-bold text-emerald-700">100% Sincronizado en Supabase</span>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 divide-y divide-slate-200">
                {cheques.map((ch) => (
                  <div key={ch.id} className="p-2.5 flex justify-between items-center bg-white hover:bg-slate-50">
                    <div>
                      <span className="font-bold text-slate-900">#{ch.numero} - {ch.bancoEmisor}</span>
                      <p className="text-[10px] text-slate-500">{ch.librador} | Cobro: {ch.fechaPago}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="font-bold text-slate-900 block">${ch.importe.toLocaleString('es-AR')}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 border font-bold ${
                            ch.estado === 'Depositado'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : ch.estado === 'En Cartera'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {ch.estado}
                        </span>
                        {ch.estado === 'En Cartera' && (
                          <button
                            onClick={async () => {
                              await depositarCheque(ch.id, cuentaSeleccionadaId);
                            }}
                            className="px-2 py-0.5 bg-[#064e3b] hover:bg-emerald-800 text-white text-[10px] font-bold uppercase"
                            title="Depositar Cheque en la Cuenta Bancaria Activa"
                          >
                            Depositar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleDescargarReporteChequesPdf}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PDF</span>
              </button>
              <button
                onClick={() => setShowReporteModal(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CALENDARIO DE VENCIMIENTOS INTERACTIVO ESTILO GOOGLE CALENDAR */}
      <CalendarioVencimientosModal
        isOpen={showCalendarioModal}
        onClose={() => setShowCalendarioModal(false)}
        defaultContext="tesoreria"
      />
    </div>
  );
};
