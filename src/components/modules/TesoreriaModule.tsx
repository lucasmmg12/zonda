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
  Landmark,
  CreditCard,
  Coins,
  CheckCircle2,
  X,
  ChevronUp,
  ChevronDown,
  ArrowRightLeft,
  FileText,
  DollarSign,
  Download,
  Link2,
  Eye
} from 'lucide-react';
import { CuentaBancaria, MovimientoTesoreria } from '../../types/models';
import { mockCuentasBancarias } from '../../services/mockData';

export const TesoreriaModule: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>(mockCuentasBancarias);
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState<string>('CTA-01'); // CAJA en $ seleccionada por defecto
  const [periodoGrafico, setPeriodoGrafico] = useState<'mensual' | 'trimestral' | 'anual'>('mensual');
  const [graficoColapsado, setGraficoColapsado] = useState(false);

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

  // Formulario Pago
  const [pagoProveedor, setPagoProveedor] = useState('');
  const [pagoMonto, setPagoMonto] = useState<number>(50000);
  const [pagoConcepto, setPagoConcepto] = useState('');

  // Formulario Movimiento Interno
  const [tipoMovInterno, setTipoMovInterno] = useState<'Extracción Efectivo' | 'Depósito Bancario' | 'Canje de Cheque'>('Extracción Efectivo');
  const [montoMovInterno, setMontoMovInterno] = useState<number>(100000);

  const cuentaActiva = cuentas.find((c) => c.id === cuentaSeleccionadaId) || cuentas[0];

  // Datos del gráfico mensual para los últimos 12 meses (como en la imagen: Nov, Dic, Ene, Feb, Mar, Abr, May, Jun, Jul, Ago, Sep, Oct)
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
    { mes: 'Oct', ingresos: 120000, egresos: 85000, saldo: -1213683 }
  ];

  // Agregar Pago
  const handleCrearPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaActiva) return;

    const nuevoSaldo = cuentaActiva.saldoActual - pagoMonto;
    const nuevoMov: MovimientoTesoreria = {
      id: `MOV-T${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0].split('-').reverse().join('/'),
      clienteProveedor: pagoProveedor || 'PROVEEDOR VARIOS',
      tipo: 'PAG',
      nro: `0001-00000${Math.floor(10 + Math.random() * 90)}`,
      descripcion: pagoConcepto || 'Pago registrado',
      ingresos: 0,
      egresos: pagoMonto,
      saldo: nuevoSaldo
    };

    setCuentas((prev) =>
      prev.map((c) => {
        if (c.id === cuentaActiva.id) {
          return {
            ...c,
            saldoActual: nuevoSaldo,
            movimientos: [nuevoMov, ...(c.movimientos || [])]
          };
        }
        return c;
      })
    );

    setShowPagoModal(false);
    setPagoProveedor('');
    setPagoConcepto('');
  };

  // Agregar Movimiento Interno (Extracción / Depósito)
  const handleCrearMovInterno = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaActiva) return;

    const esIngreso = tipoMovInterno === 'Depósito Bancario' || tipoMovInterno === 'Extracción Efectivo';
    const nuevoSaldo = esIngreso ? cuentaActiva.saldoActual + montoMovInterno : cuentaActiva.saldoActual - montoMovInterno;

    const nuevoMov: MovimientoTesoreria = {
      id: `MOV-T${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0].split('-').reverse().join('/'),
      clienteProveedor: '',
      tipo: 'EXE',
      nro: String(Math.floor(1 + Math.random() * 99)),
      descripcion: tipoMovInterno,
      ingresos: esIngreso ? montoMovInterno : 0,
      egresos: !esIngreso ? montoMovInterno : 0,
      saldo: nuevoSaldo
    };

    setCuentas((prev) =>
      prev.map((c) => {
        if (c.id === cuentaActiva.id) {
          return {
            ...c,
            saldoActual: nuevoSaldo,
            movimientos: [nuevoMov, ...(c.movimientos || [])]
          };
        }
        return c;
      })
    );

    setShowMovimientoInternoModal(false);
  };

  // Crear Cuenta
  const handleCrearCuenta = (e: React.FormEvent) => {
    e.preventDefault();
    const nueva: CuentaBancaria = {
      id: `CTA-0${cuentas.length + 1}`,
      nombre: nuevoNombreCuenta || 'Nueva Cuenta Bancaria',
      banco: nuevoTipoCuenta === 'Cuenta Corriente' ? 'Banco Operativo' : 'Caja Fiduciaria',
      tipoCuenta: nuevoTipoCuenta,
      moneda: 'ARS',
      saldoActual: nuevoSaldoInicial,
      saldoConciliado: 0,
      conectarDisponible: nuevoTipoCuenta === 'Cuenta Corriente',
      movimientos: []
    };

    setCuentas([...cuentas, nueva]);
    setCuentaSeleccionadaId(nueva.id);
    setShowAgregarCuentaModal(false);
    setNuevoNombreCuenta('');
    setNuevoSaldoInicial(0);
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      {/* 1. BARRA SUPERIOR DE ENCABEZADO */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
            Tesorería
          </h1>
          <span className="text-xs text-slate-400 font-mono">| CAJAS, BANCOS, CHEQUES Y CONCILIACIONES</span>
        </div>

        <button
          onClick={() => setShowCalendarioModal(true)}
          className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#4c1d95]"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendario de vencimientos</span>
        </button>
      </div>

      {/* 2. LAYOUT SPLIT-SCREEN MASTER-DETAIL DE TESORERÍA */}
      <div className="flex flex-col lg:flex-row min-h-[660px] bg-white border border-slate-300 border-t-0">
        {/* PANEL IZQUIERDO: LISTA DE CAJAS/BANCOS */}
        <div className="w-full lg:w-80 shrink-0 border-r border-slate-300 bg-white flex flex-col justify-between">
          <div>
            {/* Cabecera del Panel Izquierdo */}
            <div className="bg-[#ede9fe]/60 border-b border-slate-300 px-3 py-2 flex items-center justify-between text-xs font-mono font-bold text-slate-900">
              <div className="flex items-center gap-1.5">
                <span>Lista de Cajas/Bancos</span>
                <HelpCircle className="w-3.5 h-3.5 text-[#4c1d95]" />
              </div>
            </div>

            {/* Lista de Tarjetas de Cuentas */}
            <div className="divide-y divide-slate-200 overflow-y-auto max-h-[580px]">
              {cuentas.map((c) => {
                const isSelected = cuentaActiva?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setCuentaSeleccionadaId(c.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#f3f0ff] border-l-4 border-l-[#4c1d95]'
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-slate-900 text-xs font-mono">{c.nombre}</h3>
                    </div>

                    <div className="mt-1.5 font-mono text-[11px] space-y-0.5">
                      <div className="text-slate-700">
                        <span>Saldo: </span>
                        <strong className={c.saldoActual < 0 ? 'text-slate-900' : 'text-slate-900'}>
                          ${c.saldoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <div className="text-slate-500">
                        <span>Saldo conciliado: </span>
                        <span>${c.saldoConciliado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Botones de la Tarjeta */}
                    <div className="mt-2.5 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEditarModal(true);
                          }}
                          className="px-2.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-mono font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConciliarModal(true);
                          }}
                          className="px-2.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-mono font-semibold"
                        >
                          Conciliar
                        </button>
                      </div>

                      {c.conectarDisponible && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Conexión directa a extractos API de ${c.nombre} activada.`);
                            }}
                            className="px-2 py-0.5 bg-[#15803d] hover:bg-[#166534] text-white text-[10px] font-mono font-bold flex items-center gap-1"
                          >
                            <span>Conectar</span>
                          </button>
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botón inferior: Agregar Cuenta */}
          <div className="p-2 border-t border-slate-300 bg-[#f8fafc]">
            <button
              onClick={() => setShowAgregarCuentaModal(true)}
              className="w-full py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 border border-[#4c1d95] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar cuenta</span>
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: DETALLE, GRÁFICO 12 MESES Y MOVIMIENTOS */}
        <div className="flex-1 flex flex-col justify-between bg-white min-w-0">
          <div>
            {/* SECCIÓN SUPERIOR: GRÁFICO 12 MESES + WIDGET REPORTES */}
            <div className="border-b border-slate-300">
              {/* Barra de Título Superior del Gráfico */}
              <div className="bg-[#ede9fe]/60 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <span>Saldo / Ingresos / Egresos {cuentaActiva?.nombre}</span>
                  <HelpCircle className="w-3.5 h-3.5 text-[#4c1d95]" />
                </div>
                <button
                  onClick={() => setGraficoColapsado(!graficoColapsado)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  {graficoColapsado ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>

              {!graficoColapsado && (
                <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white">
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
                              {/* Barra Ingresos */}
                              {m.ingresos > 0 && (
                                <div
                                  className="w-2.5 bg-[#22c55e] transition-all"
                                  style={{ height: `${(m.ingresos / 2000000) * 100}%` }}
                                  title={`Ingresos ${m.mes}: $${m.ingresos}`}
                                ></div>
                              )}
                              {/* Barra Egresos */}
                              {m.egresos > 0 && (
                                <div
                                  className="w-2.5 bg-[#f59e0b] transition-all"
                                  style={{ height: `${(m.egresos / 2000000) * 100}%` }}
                                  title={`Egresos ${m.mes}: $${m.egresos}`}
                                ></div>
                              )}
                              {/* Punto de Línea de Saldo */}
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
                      {['mensual', 'trimestral', 'anual'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriodoGrafico(p as any)}
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
                          className="block text-left text-slate-700 hover:text-[#4c1d95] hover:underline"
                        >
                          Reporte de cheques en cartera
                        </button>
                        <button
                          onClick={() => setShowReporteModal('Reporte de cheques emitidos diferidos')}
                          className="block text-left text-slate-700 hover:text-[#4c1d95] hover:underline"
                        >
                          Reporte de cheques emitidos diferidos
                        </button>
                        <button
                          onClick={() => setShowReporteModal('Reporte de seguimiento de cheques')}
                          className="block text-left text-slate-700 hover:text-[#4c1d95] hover:underline"
                        >
                          Reporte de seguimiento de cheques
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-400">
                      AUDITORÍA GROW LABS
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN INFERIOR: MOVIMIENTOS DE LA CUENTA */}
            <div>
              {/* Barra de Título de Movimientos */}
              <div className="bg-[#ede9fe]/60 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs font-mono font-bold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <span>Movimientos {cuentaActiva?.nombre}</span>
                  <HelpCircle className="w-3.5 h-3.5 text-[#4c1d95]" />
                </div>
                <button title="Exportar a Excel" className="p-1 hover:bg-slate-200 text-emerald-700">
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>

              {/* Grilla de Movimientos (Exacta a la imagen) */}
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="py-2 px-3 border-r border-slate-200">Fecha</th>
                      <th className="py-2 px-3 border-r border-slate-200">Cliente/Proveedor</th>
                      <th className="py-2 px-3 border-r border-slate-200">Tipo</th>
                      <th className="py-2 px-3 border-r border-slate-200">Nro</th>
                      <th className="py-2 px-3 border-r border-slate-200">Nro Cheque</th>
                      <th className="py-2 px-3 border-r border-slate-200">Descripción</th>
                      <th className="py-2 px-3 border-r border-slate-200 text-right">Ingresos</th>
                      <th className="py-2 px-3 border-r border-slate-200 text-right">Egresos</th>
                      <th className="py-2 px-3 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cuentaActiva?.movimientos && cuentaActiva.movimientos.length > 0 ? (
                      cuentaActiva.movimientos.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 border-r border-slate-200">{m.fecha}</td>
                          <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900 font-sans text-[11px]">
                            {m.clienteProveedor || '-'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{m.tipo}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{m.nro}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-400">{m.nroCheque || '-'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-sans text-[11px]">
                            {m.descripcion || '-'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-emerald-700">
                            {m.ingresos > 0 ? m.ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-rose-700">
                            {m.egresos > 0 ? m.egresos.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-slate-400 font-mono text-xs">
                          Sin movimientos registrados para esta cuenta
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. BARRA INFERIOR DE ACCIONES Y PAGINACIÓN */}
          <div className="bg-[#f8fafc] border-t border-slate-300 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Paginación */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
              <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
              <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span>Página</span>
              <input type="text" readOnly value="1" className="w-6 text-center border border-slate-300 bg-white py-0.5 text-[10px]" />
              <span>de 1</span>
              <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
              <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
              <button className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5" /></button>
            </div>

            {/* Botonera de Acciones (Pagos, Cobranzas, Depósitos/Extracciones/Canjes) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPagoModal(true)}
                className="px-3 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Pagos ▼</span>
              </button>

              <button
                onClick={() => setShowCobroModal(true)}
                className="px-3 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Cobranzas ▼</span>
              </button>

              <button
                onClick={() => setShowMovimientoInternoModal(true)}
                className="px-3 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Depósitos / Extracciones / Canjes ▼</span>
              </button>
            </div>

            {/* Contador de registros a la derecha */}
            <div className="text-[11px] font-mono text-slate-500">
              Mostrando 1 - {cuentaActiva?.movimientos?.length || 0} de {cuentaActiva?.movimientos?.length || 0}
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
                <label className="block text-slate-600 font-bold mb-1">Proveedor / Beneficiario:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: INDUSTRIAS HORMAT S.A.S."
                  value={pagoProveedor}
                  onChange={(e) => setPagoProveedor(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 uppercase"
                />
              </div>

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
                  className="px-4 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-bold uppercase"
                >
                  Confirmar Pago
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
                  onChange={(e) => setTipoMovInterno(e.target.value as any)}
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
                  className="px-4 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-bold uppercase"
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
                AGREGAR CUENTA / CAJA BANCARIA
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
                  onChange={(e) => setNuevoTipoCuenta(e.target.value as any)}
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
                  className="px-4 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-bold uppercase"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONCILIAR */}
      {showConciliarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                CONCILIACIÓN // {cuentaActiva?.nombre}
              </h3>
              <button onClick={() => setShowConciliarModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Saldo en Libro Mayor:</span>
                <strong className="text-base text-slate-900 font-bold">
                  ${cuentaActiva?.saldoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="font-bold block">Extracto Bancario:</span>
                <span>Todos los movimientos del período Septiembre - Octubre 2026 han sido contrastados.</span>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowConciliarModal(false)}
                className="px-4 py-1.5 bg-[#4c1d95] text-white font-bold uppercase"
              >
                Cerrar Conciliación
              </button>
            </div>
          </div>
        </div>
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

            <div className="space-y-2">
              <p className="text-slate-600">Generando reporte de auditoría de cheques para el período en curso:</p>
              <div className="border border-slate-200 p-3 bg-slate-50 space-y-1">
                <div className="flex justify-between">
                  <span>Cheques en Cartera:</span>
                  <span className="font-bold text-slate-900">2 valores ($4.270.000,00)</span>
                </div>
                <div className="flex justify-between">
                  <span>Cheques Emitidos Diferidos:</span>
                  <span className="font-bold text-slate-900">1 valor ($3.950.000,00)</span>
                </div>
                <div className="flex justify-between">
                  <span>Estado de Compensación:</span>
                  <span className="font-bold text-emerald-700">100% al día</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
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

      {/* MODAL: CALENDARIO DE VENCIMIENTOS */}
      {showCalendarioModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4c1d95]" />
                <span>CALENDARIO DE VENCIMIENTOS // TESORERÍA</span>
              </h3>
              <button onClick={() => setShowCalendarioModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-amber-50 border border-amber-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-900 block">15/11/2026 // EN 19 DÍAS</span>
                  <p className="text-[11px] text-amber-800">Cheque Banco San Juan N° 48910231 (En Cartera)</p>
                </div>
                <span className="font-bold text-amber-900">$2.850.000,00</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">20/11/2026 // EN 24 DÍAS</span>
                  <p className="text-[11px] text-slate-600">Cheque Banco Macro N° 89123049 (En Cartera)</p>
                </div>
                <span className="font-bold text-slate-900">$1.420.000,00</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">25/11/2026 // EN 29 DÍAS</span>
                  <p className="text-[11px] text-slate-600">Cheque Propio Diferido N° 00004921 a HOLCIM</p>
                </div>
                <span className="font-bold text-slate-900">$3.950.000,00</span>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowCalendarioModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
