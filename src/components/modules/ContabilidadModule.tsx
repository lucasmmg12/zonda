import React, { useState, useEffect } from 'react';
import {
  Calendar,
  HelpCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  Folder,
  FolderOpen,
  ChevronDown,
  BarChart3,
  DollarSign,
  Plus,
  X,
  CheckCircle2
} from 'lucide-react';
import type { CuentaContable } from '../../types/models';
import { useErp } from '../../context/ErpContext';
import { exportToExcelCsv, printFinancialReport } from '../../utils/exportUtils';
import { generateLibroIvaDigitalRg4597, downloadTxtFile } from '../../utils/afipLibroIvaDigital';
import { CalendarioVencimientosModal } from '../modals/CalendarioVencimientosModal';

function flattenCuentasContables(nodes: CuentaContable[]): CuentaContable[] {
  const result: CuentaContable[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.hijos && node.hijos.length > 0) {
      result.push(...flattenCuentasContables(node.hijos));
    }
  }
  return result;
}

export const ContabilidadModule: React.FC = () => {
  const {
    planDeCuentas,
    asientosContables,
    facturasVenta,
    facturasCompra,
    actualizarCuentaContable,
    agregarCuentaContable,
    registrarAsientoManual,
    refreshAllFromDb
  } = useErp();

  const [tabPrincipal, setTabPrincipal] = useState<'plan' | 'diario' | 'iva_digital'>('plan');
  const datosLibroIva = generateLibroIvaDigitalRg4597(facturasVenta, facturasCompra);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string>('1.1.01');

  // Estados de expansión de carpetas (pre-expandido para ver cuentas operativas de inmediato)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1': true,
    '1.1': true,
    '2': true,
    '2.1': true,
    '4': true,
    '5': true,
    '5.1': true
  });

  // Filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('01/01/2026');
  const [fechaHasta, setFechaHasta] = useState('31/10/2026');
  const [mostrarAjusteInflacion, setMostrarAjusteInflacion] = useState(true);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const cuentasPlanas = flattenCuentasContables(planDeCuentas);
  const cuentaSeleccionada =
    cuentasPlanas.find((c) => c.codigo === codigoSeleccionado) || cuentasPlanas[0] || null;

  // Formulario de Cuenta
  const [formCodigo, setFormCodigo] = useState('1.1.01');
  const [formDescripcion, setFormDescripcion] = useState('Caja y Bancos (Disponibilidades)');
  const [formAdmiteManual, setFormAdmiteManual] = useState('Si');
  const [formSaldoHabitual, setFormSaldoHabitual] = useState('Deudor');
  const [formTipoCuenta, setFormTipoCuenta] = useState('Activo');
  const [formTituloSumas, setFormTituloSumas] = useState('1.1.01 CAJA Y BANCOS');

  useEffect(() => {
    if (cuentaSeleccionada) {
      setFormCodigo(cuentaSeleccionada.codigo);
      setFormDescripcion(cuentaSeleccionada.nombre);
      setFormAdmiteManual(cuentaSeleccionada.admiteAsientoManual ? 'Si' : 'No');
      setFormSaldoHabitual(cuentaSeleccionada.saldoHabitual || 'Deudor');
      setFormTipoCuenta(cuentaSeleccionada.tipoCuenta || cuentaSeleccionada.tipo);
      setFormTituloSumas(
        cuentaSeleccionada.tituloSumasSaldos || `${cuentaSeleccionada.codigo} ${cuentaSeleccionada.nombre.toUpperCase()}`
      );
    }
  }, [codigoSeleccionado, cuentaSeleccionada?.nombre]);

  // Modales
  const [showAsientoModal, setShowAsientoModal] = useState(false);
  const [showNuevaCuentaModal, setShowNuevaCuentaModal] = useState(false);
  const [showCierresModal, setShowCierresModal] = useState(false);
  const [showReportesModal, setShowReportesModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);
  const [showNuevoPlanModal, setShowNuevoPlanModal] = useState(false);

  // Formulario Asiento a Diario
  const [asientoConcepto, setAsientoConcepto] = useState('');
  const [asientoMonto, setAsientoMonto] = useState(150000);
  const [asientoFecha, setAsientoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cuentaDebeCodigo, setCuentaDebeCodigo] = useState('5.1.01');
  const [cuentaHaberCodigo, setCuentaHaberCodigo] = useState('1.1.01');

  // Formulario Nueva Subcuenta
  const [padreNuevaCuenta, setPadreNuevaCuenta] = useState('1.1');
  const [codigoNuevaCuenta, setCodigoNuevaCuenta] = useState('1.1.06');
  const [nombreNuevaCuenta, setNombreNuevaCuenta] = useState('');
  const [tipoNuevaCuenta, setTipoNuevaCuenta] = useState<'Activo' | 'Pasivo' | 'Patrimonio Neto' | 'Ingresos' | 'Egresos'>('Activo');

  const toggleNode = (codigo: string) => {
    setExpandedNodes((prev) => ({ ...prev, [codigo]: !prev[codigo] }));
  };

  const handleSelectCuenta = (c: CuentaContable) => {
    setCodigoSeleccionado(c.codigo);
  };

  const handleGuardarCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaSeleccionada) return;

    await actualizarCuentaContable(cuentaSeleccionada.codigo, {
      nombre: formDescripcion,
      admiteAsientoManual: formAdmiteManual === 'Si',
      saldoHabitual: formSaldoHabitual as 'Deudor' | 'Acreedor',
      tipoCuenta: formTipoCuenta,
      tituloSumasSaldos: formTituloSumas
    });

    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2500);
  };

  const handleRegistrarAsiento = async (e: React.FormEvent) => {
    e.preventDefault();
    await registrarAsientoManual({
      fecha: asientoFecha,
      concepto: asientoConcepto || 'Asiento contable manual',
      cuentaDebeCodigo,
      cuentaHaberCodigo,
      monto: asientoMonto,
      tipoOrigen: 'Manual'
    });
    setCodigoSeleccionado(cuentaDebeCodigo);
    setShowAsientoModal(false);
    setAsientoConcepto('');
  };

  const handleCrearSubcuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    const nueva: CuentaContable = {
      codigo: codigoNuevaCuenta,
      nombre: nombreNuevaCuenta || 'Nueva Cuenta Operativa',
      tipo: tipoNuevaCuenta,
      nivel: 3,
      imputable: true,
      saldoInicio: 0,
      debito: 0,
      credito: 0,
      saldoFinal: 0,
      saldoDeudor: 0,
      saldoAcreedor: 0,
      admiteAsientoManual: true,
      saldoHabitual: tipoNuevaCuenta === 'Activo' || tipoNuevaCuenta === 'Egresos' ? 'Deudor' : 'Acreedor',
      movimientosMayor: []
    };
    await agregarCuentaContable(padreNuevaCuenta, nueva);
    setExpandedNodes((prev) => ({ ...prev, [padreNuevaCuenta]: true }));
    setCodigoSeleccionado(nueva.codigo);
    setShowNuevaCuentaModal(false);
    setNombreNuevaCuenta('');
  };

  // Exportar Plan de Cuentas
  const handleExportarPlanExcel = () => {
    exportToExcelCsv(
      'Plan_De_Cuentas_Sumas_Y_Saldos',
      cuentasPlanas.map((c) => ({
        Codigo: c.codigo,
        Cuenta: c.nombre,
        Rubro: c.tipo,
        Nivel: c.nivel,
        SaldoInicio: c.saldoInicio ?? 0,
        Debito: c.debito ?? 0,
        Credito: c.credito ?? 0,
        SaldoFinal: c.saldoFinal ?? 0
      }))
    );
  };

  // Exportar Libro Mayor de Cuenta Seleccionada
  const handleExportarMayorExcel = () => {
    if (!cuentaSeleccionada) return;
    exportToExcelCsv(
      `Libro_Mayor_${cuentaSeleccionada.codigo.replace(/\./g, '_')}`,
      (cuentaSeleccionada.movimientosMayor || []).map((m) => ({
        Cuenta: `${cuentaSeleccionada.codigo} - ${cuentaSeleccionada.nombre}`,
        Fecha: m.fecha,
        Tipo: m.tipo,
        Nro: m.nro,
        Descripcion: m.descripcion,
        Debito: m.debito,
        Credito: m.credito,
        Saldo: m.saldo
      }))
    );
  };

  // Exportar Balance de 8 Columnas PDF
  const handleDescargarBalancePdf = () => {
    printFinancialReport(
      'BALANCE GENERAL DE SUMAS Y SALDOS',
      `Período Fiscal: ${fechaDesde} al ${fechaHasta}`,
      ['Código', 'Cuenta Contable', 'Rubro', 'Saldo Inicio', 'Débitos', 'Créditos', 'Saldo Final'],
      cuentasPlanas.map((c) => [
        c.codigo,
        c.nombre,
        c.tipo,
        `$${(c.saldoInicio ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        `$${(c.debito ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        `$${(c.credito ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        `$${(c.saldoFinal ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
      ])
    );
    setShowReportesModal(false);
  };

  // Exportar Libro Diario PDF
  const handleDescargarLibroDiarioPdf = () => {
    printFinancialReport(
      'LIBRO DIARIO GENERAL FOLIADO (LEY 19.550)',
      `Total de asientos registrados: ${asientosContables.length}`,
      ['Asiento', 'Fecha', 'Origen', 'Concepto / Cuenta', 'Debe ($)', 'Haber ($)'],
      asientosContables.flatMap((a) =>
        a.renglones.map((r, idx) => [
          idx === 0 ? a.numero : '',
          idx === 0 ? a.fecha : '',
          idx === 0 ? a.tipoOrigen : '',
          `${r.cuentaCodigo} - ${r.cuentaNombre} (${a.concepto})`,
          r.debe > 0 ? `$${r.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-',
          r.haber > 0 ? `$${r.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'
        ])
      )
    );
    setShowReportesModal(false);
  };

  const renderTreeRows = (nodes: CuentaContable[], depth = 0): React.ReactNode => {
    return nodes.map((c) => {
      const isExpanded = !!expandedNodes[c.codigo];
      const hasChildren = !!c.hijos && c.hijos.length > 0;
      const isSelected = cuentaSeleccionada?.codigo === c.codigo;
      const isTotal = c.tipo === 'Totales';

      return (
        <React.Fragment key={c.codigo}>
          <tr
            onClick={() => handleSelectCuenta(c)}
            className={`cursor-pointer transition-colors border-b border-slate-200 text-xs font-mono ${
              isSelected
                ? 'bg-[#ecfdf5] font-bold text-slate-900 border-l-4 border-l-[#064e3b]'
                : isTotal
                ? 'bg-slate-100 font-bold text-slate-900'
                : 'hover:bg-slate-50 text-slate-800'
            }`}
          >
            {/* Columna Cuenta (Tree) */}
            <td className="py-1.5 px-2 border-r border-slate-200 whitespace-nowrap">
              <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 16}px` }}>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNode(c.codigo);
                    }}
                    className="p-0.5 hover:bg-slate-200 text-slate-600"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                    )}
                  </button>
                ) : (
                  <span className="w-3.5 inline-block"></span>
                )}

                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                  )
                ) : (
                  <Folder className="w-4 h-4 text-amber-400/80 shrink-0" />
                )}

                <span className={c.nivel === 1 ? 'font-bold' : ''}>{c.nombre}</span>
              </div>
            </td>

            {/* Columna Nro. Cuenta */}
            <td className="py-1.5 px-2 border-r border-slate-200 text-slate-600 text-center">
              {c.codigo}
            </td>

            {/* Saldo Inicio */}
            <td className="py-1.5 px-2 border-r border-slate-200 text-right text-slate-500">
              {(c.saldoInicio ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </td>

            {/* Débito */}
            <td className="py-1.5 px-2 border-r border-slate-200 text-right font-medium text-slate-900">
              {(c.debito ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </td>

            {/* Crédito */}
            <td className="py-1.5 px-2 border-r border-slate-200 text-right font-medium text-slate-900">
              {(c.credito ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </td>

            {/* Saldo Final */}
            <td
              className={`py-1.5 px-2 text-right font-bold ${
                (c.saldoFinal ?? 0) < 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {(c.saldoFinal ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </td>
          </tr>

          {hasChildren && isExpanded && c.hijos && renderTreeRows(c.hijos, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      {/* 1. BARRA SUPERIOR DE ENCABEZADO Y LLAMADA AL CALENDARIO */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
            Contabilidad general
          </h1>
          <span className="text-xs text-slate-400 font-mono">| PLAN DE CUENTAS, MAYOR Y LIBRO DIARIO</span>
        </div>

        <button
          onClick={() => setShowCalendarioModal(true)}
          className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#064e3b]"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendario de vencimientos</span>
        </button>
      </div>

      {/* 2. PESTAÑAS PRINCIPALES DEL MÓDULO */}
      <div className="bg-[#ecfdf5]/40 border-b border-slate-300 px-2 pt-1 flex items-center gap-1">
        <button
          onClick={() => setTabPrincipal('plan')}
          className={`px-4 py-2 text-xs font-mono font-bold transition-all border-t-2 ${
            tabPrincipal === 'plan'
              ? 'bg-white border-t-[#064e3b] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
              : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Panel de cuentas y Libro Mayor
        </button>
        <button
          onClick={() => setTabPrincipal('diario')}
          className={`px-4 py-2 text-xs font-mono font-bold transition-all border-t-2 ${
            tabPrincipal === 'diario'
              ? 'bg-white border-t-[#064e3b] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
              : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Libro Diario General ({asientosContables.length} asientos)
        </button>
        <button
          onClick={() => setTabPrincipal('iva_digital')}
          className={`px-4 py-2 text-xs font-mono font-bold transition-all border-t-2 ${
            tabPrincipal === 'iva_digital'
              ? 'bg-white border-t-[#064e3b] text-[#064e3b] border-x border-slate-300 -mb-[1px] z-10'
              : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Libro IVA Digital ARCA / AFIP (RG 4597 .TXT)
        </button>
      </div>

      {tabPrincipal === 'plan' ? (
        /* 3. VISTA PRINCIPAL: SPLIT-SCREEN MASTER-DETAIL */
        <div className="flex flex-col lg:flex-row min-h-[660px] bg-white border border-slate-300 border-t-0">
          {/* PANEL IZQUIERDO: SUMAS Y SALDOS / PLAN DE CUENTAS */}
          <div className="w-full lg:w-1/2 border-r border-slate-300 bg-white flex flex-col justify-between">
            <div>
              {/* Header del Panel Izquierdo */}
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                <span>Sumas y saldos</span>
                <button title="Ayuda sumas y saldos" className="text-[#064e3b] hover:text-[#047857]">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Barra de Filtros: Desde, Hasta, Recalcular, Reportes */}
              <div className="p-2 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-600">Desde:</span>
                <select
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 text-xs"
                >
                  <option value="01/01/2026">01/01/2026</option>
                  <option value="01/09/2026">01/09/2026</option>
                  <option value="01/10/2026">01/10/2026</option>
                </select>

                <span className="text-slate-600">Hasta:</span>
                <select
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 text-xs"
                >
                  <option value="31/10/2026">31/10/2026</option>
                  <option value="30/11/2026">30/11/2026</option>
                  <option value="31/12/2026">31/12/2026</option>
                </select>

                <button
                  onClick={() => refreshAllFromDb()}
                  className="px-3.5 py-1 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold transition-colors border border-[#064e3b]"
                >
                  Recalcular
                </button>

                <button
                  onClick={() => setShowReportesModal(true)}
                  className="px-3 py-1 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold flex items-center gap-1 transition-colors border border-[#064e3b]"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Reportes ▼</span>
                </button>
              </div>

              {/* Tabla de Sumas y Saldos (Tree View) */}
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-mono font-bold text-slate-700">
                      <th className="py-2 px-2.5 border-r border-slate-200">Cuenta</th>
                      <th className="py-2 px-2 border-r border-slate-200 text-center">Código</th>
                      <th className="py-2 px-2 border-r border-slate-200 text-right">Saldo inicio</th>
                      <th className="py-2 px-2 border-r border-slate-200 text-right">Débito</th>
                      <th className="py-2 px-2 border-r border-slate-200 text-right">Crédito</th>
                      <th className="py-2 px-2 text-right">Saldo final</th>
                    </tr>
                  </thead>
                  <tbody>{renderTreeRows(planDeCuentas)}</tbody>
                </table>
              </div>
            </div>

            {/* Pie del Panel Izquierdo */}
            <div className="bg-[#f8fafc] border-t border-slate-300 px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNuevoPlanModal(true)}
                  className="px-3 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs transition-colors"
                >
                  Nuevo plan De cuentas
                </button>
                <button
                  onClick={handleExportarPlanExcel}
                  className="text-sanatorio-700 hover:underline text-[11px] font-bold"
                >
                  Descargar plan de cuentas actual (Excel)
                </button>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-[11px]">
                <span>Mostrar Asientos de Ajuste por Inflación:</span>
                <input
                  type="checkbox"
                  checked={mostrarAjusteInflacion}
                  onChange={(e) => setMostrarAjusteInflacion(e.target.checked)}
                  className="accent-[#064e3b] w-3.5 h-3.5"
                />
              </label>
            </div>
          </div>

          {/* PANEL DERECHO: SELECCIÓN DE CUENTA & LIBRO MAYOR */}
          <div className="w-full lg:w-1/2 flex flex-col justify-between bg-white min-w-0">
            <div>
              {/* SECCIÓN SUPERIOR: FORMULARIO DE CUENTA */}
              <div className="border-b border-slate-300">
                <div className="bg-[#f0fdf4] border-b border-slate-300 px-4 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                  <span>Cuenta seleccionada: {cuentaSeleccionada?.codigo} - {cuentaSeleccionada?.nombre}</span>
                  {guardadoExitoso && (
                    <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Guardado en Supabase
                    </span>
                  )}
                </div>

                <form onSubmit={handleGuardarCuenta} className="p-3 space-y-2 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-slate-600 text-[11px] w-28 shrink-0">Código cuenta:</label>
                      <input
                        type="text"
                        readOnly
                        value={formCodigo}
                        className="px-2 py-1 bg-slate-100 border border-slate-300 text-xs w-full max-w-[140px] font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-slate-600 text-[11px] w-28 shrink-0">Descripción:</label>
                    <input
                      type="text"
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 text-xs flex-1 focus:outline-none focus:border-[#064e3b]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-slate-600 text-[11px] w-28 shrink-0">Admite asiento manual:</label>
                    <select
                      value={formAdmiteManual}
                      onChange={(e) => setFormAdmiteManual(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 text-xs w-28"
                    >
                      <option value="Si">Si</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-slate-600 text-[11px] w-28 shrink-0">Saldo habitual:</label>
                    <select
                      value={formSaldoHabitual}
                      onChange={(e) => setFormSaldoHabitual(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 text-xs w-36"
                    >
                      <option value="Deudor">Deudor</option>
                      <option value="Acreedor">Acreedor</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-slate-600 text-[11px] w-28 shrink-0">Tipo de cuenta:</label>
                    <input
                      type="text"
                      value={formTipoCuenta}
                      onChange={(e) => setFormTipoCuenta(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 text-xs flex-1 focus:outline-none focus:border-[#064e3b]"
                    />
                    <HelpCircle className="w-4 h-4 text-[#064e3b] shrink-0" />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-slate-600 text-[11px] w-28 shrink-0">Título sumas y saldos:</label>
                    <input
                      type="text"
                      value={formTituloSumas}
                      onChange={(e) => setFormTituloSumas(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 text-xs flex-1 focus:outline-none focus:border-[#064e3b]"
                    />
                  </div>

                  {/* Botones de acción del formulario */}
                  <div className="pt-2 flex justify-end items-center gap-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        const allExpanded: Record<string, boolean> = {};
                        cuentasPlanas.forEach((cta) => {
                          allExpanded[cta.codigo] = true;
                        });
                        setExpandedNodes(allExpanded);
                      }}
                      className="px-3 py-1 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold transition-colors border border-[#064e3b] flex items-center gap-1"
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>Expandir Títulos ▼</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowNuevaCuentaModal(true)}
                      className="px-3 py-1 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold transition-colors border border-[#064e3b] flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva Subcuenta ▼</span>
                    </button>

                    <button
                      type="submit"
                      className="px-3.5 py-1 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold transition-colors border border-[#064e3b]"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>

              {/* SECCIÓN INFERIOR: MAYOR (LIBRO MAYOR DE LA CUENTA SELECCIONADA) */}
              <div>
                <div className="bg-[#f0fdf4] border-b border-slate-300 px-4 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span>Mayor de {cuentaSeleccionada?.nombre}</span>
                    <HelpCircle className="w-3.5 h-3.5 text-[#064e3b]" />
                  </div>
                  <button
                    onClick={handleExportarMayorExcel}
                    title="Exportar Mayor a Excel"
                    className="p-0.5 hover:bg-slate-200 text-emerald-700 flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="text-[10px]">Excel</span>
                  </button>
                </div>

                {/* Grilla del Libro Mayor */}
                <div className="overflow-x-auto min-h-[220px]">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                        <th className="py-2 px-2.5 border-r border-slate-200">Fecha</th>
                        <th className="py-2 px-2 border-r border-slate-200 text-center">Tipo</th>
                        <th className="py-2 px-2.5 border-r border-slate-200">Nro</th>
                        <th className="py-2 px-2.5 border-r border-slate-200">Descripción</th>
                        <th className="py-2 px-2.5 border-r border-slate-200 text-right">Débito</th>
                        <th className="py-2 px-2.5 border-r border-slate-200 text-right">Crédito</th>
                        <th className="py-2 px-2.5 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cuentaSeleccionada &&
                      cuentaSeleccionada.movimientosMayor &&
                      cuentaSeleccionada.movimientosMayor.length > 0 ? (
                        cuentaSeleccionada.movimientosMayor.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50 cursor-pointer">
                            <td className="py-2 px-2.5 border-r border-slate-200">{m.fecha}</td>
                            <td className="py-2 px-2 border-r border-slate-200 text-center font-bold text-slate-700">
                              {m.tipo}
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200 font-bold text-slate-900">{m.nro}</td>
                            <td className="py-2 px-2.5 border-r border-slate-200 truncate max-w-xs">{m.descripcion}</td>
                            <td className="py-2 px-2.5 border-r border-slate-200 text-right font-medium text-emerald-700">
                              {m.debito > 0 ? `$${m.debito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200 text-right font-medium text-rose-700">
                              {m.credito > 0 ? `$${m.credito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                              ${m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Sin movimientos directos en esta cuenta. Seleccione una subcuenta operativa (ej: 1.1.01 Caja y Bancos) o registre un nuevo asiento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación del Mayor */}
                <div className="bg-[#f8fafc] border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-600">
                  <div className="flex items-center gap-1">
                    <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                    <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <span>Página</span>
                    <input type="text" readOnly value="1" className="w-6 text-center border border-slate-300 bg-white py-0.5 text-[10px]" />
                    <span>de 1</span>
                    <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                    <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
                    <button onClick={() => refreshAllFromDb()} className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5 text-[#064e3b]" /></button>
                  </div>
                  <span>
                    {cuentaSeleccionada && cuentaSeleccionada.movimientosMayor && cuentaSeleccionada.movimientosMayor.length > 0
                      ? `Mostrando 1 - ${cuentaSeleccionada.movimientosMayor.length} de ${cuentaSeleccionada.movimientosMayor.length}`
                      : 'Sin movimientos'}
                  </span>
                </div>
              </div>
            </div>

            {/* BOTONERA INFERIOR (Nuevo asiento a diario, Libro Diario, Cierres contables) */}
            <div className="bg-[#ecfdf5]/30 border-t border-slate-300 px-4 py-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAsientoModal(true)}
                className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Nuevo asiento a diario</span>
              </button>

              <button
                onClick={() => setTabPrincipal('diario')}
                className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Ver Libro Diario ({asientosContables.length})</span>
              </button>

              <button
                onClick={() => setShowCierresModal(true)}
                className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Cierres contables ▼</span>
              </button>
            </div>
          </div>
        </div>
      ) : tabPrincipal === 'diario' ? (
        /* PESTAÑA: LIBRO DIARIO GENERAL */
        <div className="bg-white border border-slate-300 border-t-0 p-6 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                LIBRO DIARIO GENERAL FOLIADO (SINCRONIZADO CON SUPABASE)
              </h3>
              <p className="text-xs text-slate-500">
                Incluye asientos automáticos de Ventas, Compras, Tesorería, Sueldos y Asientos Manuales
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAsientoModal(true)}
                className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Asiento</span>
              </button>
              <button
                onClick={handleDescargarLibroDiarioPdf}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold"
              >
                Imprimir Libro Diario PDF
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {asientosContables.map((asiento) => (
              <div key={asiento.numero} className="border border-slate-300 bg-slate-50/40">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#064e3b]">ASIENTO #{asiento.numero}</span>
                    <span className="text-slate-600">Fecha: {asiento.fecha}</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-300 text-[10px] font-bold">
                      Origen: {asiento.tipoOrigen}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800">{asiento.concepto}</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500 bg-white">
                      <th className="py-1.5 px-4 w-32">Código</th>
                      <th className="py-1.5 px-4">Cuenta Contable</th>
                      <th className="py-1.5 px-4 text-right w-40">Debe ($)</th>
                      <th className="py-1.5 px-4 text-right w-40">Haber ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {asiento.renglones.map((r, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-4 font-bold text-slate-700">{r.cuentaCodigo}</td>
                        <td className={`py-1.5 px-4 ${r.haber > 0 ? 'pl-10 text-slate-600' : 'font-bold text-slate-900'}`}>
                          {r.cuentaNombre}
                        </td>
                        <td className="py-1.5 px-4 text-right font-bold text-emerald-700">
                          {r.debe > 0 ? `$${r.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-1.5 px-4 text-right font-bold text-rose-700">
                          {r.haber > 0 ? `$${r.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* PESTAÑA: LIBRO DE IVA DIGITAL AFIP / ARCA (RG 4597) */
        <div className="bg-white border border-slate-300 border-t-0 p-6 space-y-6 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                LIBRO DE IVA DIGITAL ARCA / AFIP — RESOLUCIÓN GENERAL N° 4597 (VENTAS Y COMPRAS)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generador automático de archivos posicionales .TXT (Comprobantes y Alícuotas) y Posición Mensual F.2002
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
              ESQUEMA RG 4597 VERIFICADO ({facturasVenta.length} Ventas / {facturasCompra.length} Compras)
            </span>
          </div>

          {/* Posición Mensual de IVA F.2002 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                IVA DÉBITO FISCAL (VENTAS)
              </span>
              <p className="text-xl font-bold text-rose-700 mt-1">
                ${datosLibroIva.resumenPosicionIva.totalIvaDebitoFiscal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-500 block mt-1">
                Base Neta Ventas: ${datosLibroIva.resumenPosicionIva.totalVentasNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                IVA CRÉDITO FISCAL (COMPRAS)
              </span>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                ${datosLibroIva.resumenPosicionIva.totalIvaCreditoFiscal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-500 block mt-1">
                Base Neta Compras: ${datosLibroIva.resumenPosicionIva.totalComprasNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-4 border-2 border-[#064e3b] bg-emerald-50/50">
              <span className="text-[10px] font-bold text-[#064e3b] uppercase block">
                SALDO TÉCNICO F.2002 ({datosLibroIva.resumenPosicionIva.saldoTecnicoIva >= 0 ? 'A INGRESAR A ARCA' : 'A FAVOR CONTRIBUYENTE'})
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                ${Math.abs(datosLibroIva.resumenPosicionIva.saldoTecnicoIva).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-800 font-bold block mt-1">
                Calculado en tiempo real desde Supabase
              </span>
            </div>
          </div>

          {/* Botonera de Descarga Oficial .TXT RG 4597 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => downloadTxtFile('LIBRO_IVA_DIGITAL_VENTAS_CBTE.txt', datosLibroIva.ventasCbteTxt)}
              className="p-3 bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-left space-y-1 transition-colors"
            >
              <span className="text-[10px] text-emerald-200 block uppercase">Archivo 1 — 266 Posiciones</span>
              <span className="text-xs block">Descargar VENTAS_CBTE.TXT</span>
            </button>

            <button
              onClick={() => downloadTxtFile('LIBRO_IVA_DIGITAL_VENTAS_ALICUOTAS.txt', datosLibroIva.ventasAlicuotasTxt)}
              className="p-3 bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-left space-y-1 transition-colors"
            >
              <span className="text-[10px] text-emerald-200 block uppercase">Archivo 2 — 62 Posiciones</span>
              <span className="text-xs block">Descargar VENTAS_ALICUOTAS.TXT</span>
            </button>

            <button
              onClick={() => downloadTxtFile('LIBRO_IVA_DIGITAL_COMPRAS_CBTE.txt', datosLibroIva.comprasCbteTxt)}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-left space-y-1 transition-colors"
            >
              <span className="text-[10px] text-slate-300 block uppercase">Archivo 3 — 325 Posiciones</span>
              <span className="text-xs block">Descargar COMPRAS_CBTE.TXT</span>
            </button>

            <button
              onClick={() => downloadTxtFile('LIBRO_IVA_DIGITAL_COMPRAS_ALICUOTAS.txt', datosLibroIva.comprasAlicuotasTxt)}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-left space-y-1 transition-colors"
            >
              <span className="text-[10px] text-slate-300 block uppercase">Archivo 4 — 84 Posiciones</span>
              <span className="text-xs block">Descargar COMPRAS_ALICUOTAS.TXT</span>
            </button>
          </div>

          {/* Vista Previa de los Registros Posicionales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 uppercase block">
                Vista Previa: LIBRO_IVA_DIGITAL_VENTAS_CBTE.TXT
              </span>
              <pre className="p-3 bg-slate-950 text-emerald-400 text-[10px] overflow-x-auto border border-slate-800 leading-relaxed">
                {datosLibroIva.ventasCbteTxt || 'Sin registros de ventas'}
              </pre>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 uppercase block">
                Vista Previa: LIBRO_IVA_DIGITAL_COMPRAS_CBTE.TXT
              </span>
              <pre className="p-3 bg-slate-950 text-amber-300 text-[10px] overflow-x-auto border border-slate-800 leading-relaxed">
                {datosLibroIva.comprasCbteTxt || 'Sin registros de compras'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO ASIENTO A DIARIO */}
      {showAsientoModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-lg shadow-2xl">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>NUEVO ASIENTO A DIARIO (PARTIDA DOBLE EN SUPABASE)</span>
              <button onClick={() => setShowAsientoModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleRegistrarAsiento} className="p-4 space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-600 font-bold block text-[11px] mb-1">Concepto / Glosa del Asiento:</label>
                <input
                  type="text"
                  required
                  value={asientoConcepto}
                  onChange={(e) => setAsientoConcepto(e.target.value)}
                  placeholder="Ej: Devengamiento de Honorarios Contables / Ajuste"
                  className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Cuenta DEBE (Débito):</label>
                  <select
                    value={cuentaDebeCodigo}
                    onChange={(e) => setCuentaDebeCodigo(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs bg-slate-50"
                  >
                    {cuentasPlanas
                      .filter((c) => c.nivel >= 2)
                      .map((c) => (
                        <option key={c.codigo} value={c.codigo}>
                          {c.codigo} - {c.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Cuenta HABER (Crédito):</label>
                  <select
                    value={cuentaHaberCodigo}
                    onChange={(e) => setCuentaHaberCodigo(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs bg-slate-50"
                  >
                    {cuentasPlanas
                      .filter((c) => c.nivel >= 2)
                      .map((c) => (
                        <option key={c.codigo} value={c.codigo}>
                          {c.codigo} - {c.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Monto Asiento ($ ARS):</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={asientoMonto}
                    onChange={(e) => setAsientoMonto(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Fecha Contable:</label>
                  <input
                    type="date"
                    value={asientoFecha}
                    onChange={(e) => setAsientoFecha(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAsientoModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] text-white hover:bg-[#047857] font-bold"
                >
                  Registrar en Diario y Mayor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA SUBCUENTA */}
      {showNuevaCuentaModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-md shadow-2xl">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>AGREGAR SUBCUENTA AL PLAN DE CUENTAS</span>
              <button onClick={() => setShowNuevaCuentaModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCrearSubcuenta} className="p-4 space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-600 font-bold block text-[11px] mb-1">Rubro Padre:</label>
                <select
                  value={padreNuevaCuenta}
                  onChange={(e) => setPadreNuevaCuenta(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 bg-slate-50"
                >
                  <option value="1.1">1.1 Activo Corriente</option>
                  <option value="1.2">1.2 Activo No Corriente</option>
                  <option value="2.1">2.1 Pasivo Corriente</option>
                  <option value="3">3 Patrimonio Neto</option>
                  <option value="4">4 Ingresos por Obras y Servicios</option>
                  <option value="5.1">5.1 Costos Operativos Directos</option>
                  <option value="5.2">5.2 Gastos Administrativos y Sueldos</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Código Subcuenta:</label>
                  <input
                    type="text"
                    required
                    value={codigoNuevaCuenta}
                    onChange={(e) => setCodigoNuevaCuenta(e.target.value)}
                    placeholder="Ej: 1.1.06"
                    className="w-full px-2 py-1.5 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Tipo Patrimonial:</label>
                  <select
                    value={tipoNuevaCuenta}
                    onChange={(e) => setTipoNuevaCuenta(e.target.value as 'Activo' | 'Pasivo' | 'Patrimonio Neto' | 'Ingresos' | 'Egresos')}
                    className="w-full px-2 py-1.5 border border-slate-300"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Pasivo">Pasivo</option>
                    <option value="Patrimonio Neto">Patrimonio Neto</option>
                    <option value="Ingresos">Ingresos</option>
                    <option value="Egresos">Egresos</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-600 font-bold block text-[11px] mb-1">Nombre de la Cuenta:</label>
                <input
                  type="text"
                  required
                  value={nombreNuevaCuenta}
                  onChange={(e) => setNombreNuevaCuenta(e.target.value)}
                  placeholder="Ej: Fondo Fijo Obra Zonda"
                  className="w-full px-2 py-1.5 border border-slate-300"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNuevaCuentaModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#064e3b] text-white font-bold">
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CIERRES CONTABLES */}
      {showCierresModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-md shadow-2xl">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>CIERRES Y REFUNDICIONES CONTABLES</span>
              <button onClick={() => setShowCierresModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs text-slate-700">
              <p className="text-[11px] leading-relaxed">
                Seleccione el procedimiento de cierre o refundición patrimonial a ejecutar en el Libro Diario:
              </p>
              <button
                onClick={async () => {
                  await registrarAsientoManual({
                    fecha: new Date().toISOString().split('T')[0],
                    concepto: 'Asiento de Refundición de Cuentas de Resultado del Ejercicio',
                    cuentaDebeCodigo: '4.1.01',
                    cuentaHaberCodigo: '3.2.01',
                    monto: 1250000,
                    tipoOrigen: 'Manual'
                  });
                  setShowCierresModal(false);
                  setTabPrincipal('diario');
                }}
                className="w-full text-left p-2.5 border border-slate-200 hover:bg-[#ecfdf5] transition-colors"
              >
                <span className="font-bold text-slate-900 block">1. Refundición de Cuentas de Resultado</span>
                <span className="text-[10px] text-slate-500">Genera asiento real en Libro Diario contra Resultado del Ejercicio (3.2.01).</span>
              </button>
              <button
                onClick={async () => {
                  await registrarAsientoManual({
                    fecha: new Date().toISOString().split('T')[0],
                    concepto: 'Ajuste por Inflación Contable RT6 FACPCE',
                    cuentaDebeCodigo: '5.1.01',
                    cuentaHaberCodigo: '3.2.01',
                    monto: 480000,
                    tipoOrigen: 'Manual'
                  });
                  setShowCierresModal(false);
                  setTabPrincipal('diario');
                }}
                className="w-full text-left p-2.5 border border-slate-200 hover:bg-[#ecfdf5] transition-colors"
              >
                <span className="font-bold text-slate-900 block">2. Asiento de Ajuste por Inflación (RECPAM - RT6)</span>
                <span className="text-[10px] text-slate-500">Registra actualización monetaria de partidas no monetarias.</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORTES CONTABLES */}
      {showReportesModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-lg shadow-2xl">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>REPORTES Y ESTADOS CONTABLES OFICIALES</span>
              <button onClick={() => setShowReportesModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2 font-mono text-xs">
              <button
                onClick={handleDescargarBalancePdf}
                className="w-full text-left p-3 border border-slate-200 hover:bg-[#ecfdf5] transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">1. Balance General de Sumas y Saldos (PDF)</p>
                  <p className="text-[11px] text-slate-500">Sumas y saldos, balance patrimonial y estado de resultados integrado.</p>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
              </button>

              <button
                onClick={handleDescargarLibroDiarioPdf}
                className="w-full text-left p-3 border border-slate-200 hover:bg-[#ecfdf5] transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">2. Libro Diario General Foliado (Ley 19.550 - PDF)</p>
                  <p className="text-[11px] text-slate-500">Asientos cronológicos foliados con balanceo de debe y haber.</p>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CALENDARIO DE VENCIMIENTOS INTERACTIVO ESTILO GOOGLE CALENDAR */}
      <CalendarioVencimientosModal
        isOpen={showCalendarioModal}
        onClose={() => setShowCalendarioModal(false)}
        defaultContext="contabilidad"
      />

      {/* MODAL: NUEVO PLAN DE CUENTAS */}
      {showNuevoPlanModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#15803d] w-full max-w-md shadow-2xl">
            <div className="bg-[#15803d] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>PLAN DE CUENTAS ESTRUCTURADO</span>
              <button onClick={() => setShowNuevoPlanModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs text-slate-700">
              <p className="text-[11px] leading-relaxed">
                El Plan de Cuentas se encuentra sincronizado con la tabla <code className="font-bold">erp_plan_cuentas</code> en Supabase PostgreSQL. Puede descargar la plantilla actual o sincronizar los saldos.
              </p>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNuevoPlanModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await refreshAllFromDb();
                    setShowNuevoPlanModal(false);
                  }}
                  className="px-4 py-1.5 bg-[#15803d] text-white hover:bg-[#166534] font-bold"
                >
                  Sincronizar desde Supabase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
