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
  Folder,
  FolderOpen,
  ChevronDown,
  BarChart3,
  DollarSign,
  Plus,
  Upload,
  X,
  Lock,
  Download
} from 'lucide-react';
import { CuentaContable, MovimientoMayor } from '../../types/models';
import { mockPlanDeCuentas } from '../../services/mockData';

export const ContabilidadModule: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaContable[]>(mockPlanDeCuentas);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaContable | null>(null);

  // Estados de expansión de carpetas
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('01/01/2026');
  const [fechaHasta, setFechaHasta] = useState('31/10/2026');
  const [mostrarAjusteInflacion, setMostrarAjusteInflacion] = useState(true);

  // Formulario de Cuenta
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formAdmiteManual, setFormAdmiteManual] = useState('Si');
  const [formSaldoHabitual, setFormSaldoHabitual] = useState('Deudor');
  const [formTipoCuenta, setFormTipoCuenta] = useState('');
  const [formTituloSumas, setFormTituloSumas] = useState('');

  // Modales
  const [showAsientoModal, setShowAsientoModal] = useState(false);
  const [showCierresModal, setShowCierresModal] = useState(false);
  const [showReportesModal, setShowReportesModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);
  const [showNuevoPlanModal, setShowNuevoPlanModal] = useState(false);

  // Formulario Asiento
  const [asientoConcepto, setAsientoConcepto] = useState('');
  const [asientoMonto, setAsientoMonto] = useState(150000);

  const toggleNode = (codigo: string) => {
    setExpandedNodes((prev) => ({ ...prev, [codigo]: !prev[codigo] }));
  };

  const handleSelectCuenta = (c: CuentaContable) => {
    setCuentaSeleccionada(c);
    setFormCodigo(c.codigo);
    setFormDescripcion(c.nombre);
    setFormAdmiteManual(c.admiteAsientoManual ? 'Si' : 'No');
    setFormSaldoHabitual(c.saldoHabitual || 'Deudor');
    setFormTipoCuenta(c.tipoCuenta || c.tipo);
    setFormTituloSumas(c.tituloSumasSaldos || `${c.codigo} ${c.nombre.toUpperCase()}`);
  };

  const handleGuardarCuenta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaSeleccionada) return;

    setCuentas((prev) =>
      prev.map((c) => {
        if (c.codigo === cuentaSeleccionada.codigo) {
          return {
            ...c,
            nombre: formDescripcion,
            admiteAsientoManual: formAdmiteManual === 'Si',
            saldoHabitual: formSaldoHabitual as any,
            tipoCuenta: formTipoCuenta,
            tituloSumasSaldos: formTituloSumas
          };
        }
        return c;
      })
    );
    alert(`Cuenta ${formCodigo} actualizada con éxito.`);
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
                ? 'bg-[#ede9fe] font-bold text-slate-900 border-l-4 border-l-[#4c1d95]'
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
              {c.codigo.length > 2 ? c.codigo.replace(/\./g, '') : ''}
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
          className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#4c1d95]"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendario de vencimientos</span>
        </button>
      </div>

      {/* 2. PESTAÑAS PRINCIPALES DEL MÓDULO */}
      <div className="bg-[#ede9fe]/40 border-b border-slate-300 px-2 pt-1 flex items-center gap-1">
        <button className="px-4 py-2 text-xs font-mono font-bold transition-all border-t-2 bg-white border-t-[#4c1d95] text-slate-900 border-x border-slate-300 -mb-[1px] z-10">
          Panel de cuentas
        </button>
      </div>

      {/* 3. VISTA PRINCIPAL: SPLIT-SCREEN MASTER-DETAIL */}
      <div className="flex flex-col lg:flex-row min-h-[660px] bg-white border border-slate-300 border-t-0">
        {/* PANEL IZQUIERDO: SUMAS Y SALDOS / PLAN DE CUENTAS */}
        <div className="w-full lg:w-1/2 border-r border-slate-300 bg-white flex flex-col justify-between">
          <div>
            {/* Header del Panel Izquierdo */}
            <div className="bg-[#f3f0ff] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
              <span>Sumas y saldos</span>
              <button title="Ayuda sumas y saldos" className="text-[#4c1d95] hover:text-[#3b0764]">
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
                onClick={() => alert('Recalculando sumas y saldos del ejercicio contable...')}
                className="px-3.5 py-1 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold transition-colors border border-[#4c1d95]"
              >
                Recalcular
              </button>

              <button
                onClick={() => setShowReportesModal(true)}
                className="px-3 py-1 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold flex items-center gap-1 transition-colors border border-[#4c1d95]"
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
                    <th className="py-2 px-2 border-r border-slate-200 text-center">Nro. cu...</th>
                    <th className="py-2 px-2 border-r border-slate-200 text-right">Saldo inicio</th>
                    <th className="py-2 px-2 border-r border-slate-200 text-right">Débito</th>
                    <th className="py-2 px-2 border-r border-slate-200 text-right">Crédito</th>
                    <th className="py-2 px-2 text-right">Saldo final</th>
                  </tr>
                </thead>
                <tbody>{renderTreeRows(cuentas)}</tbody>
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
                onClick={() => alert('Descargando archivo estructurado de Plan de Cuentas vigente en formato Excel...')}
                className="text-sanatorio-700 hover:underline text-[11px]"
              >
                Descargar plan de cuentas actual
              </button>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-[11px]">
              <span>Mostrar Asientos de Ajuste por Inflación:</span>
              <input
                type="checkbox"
                checked={mostrarAjusteInflacion}
                onChange={(e) => setMostrarAjusteInflacion(e.target.checked)}
                className="accent-[#4c1d95] w-3.5 h-3.5"
              />
            </label>
          </div>
        </div>

        {/* PANEL DERECHO: SELECCIÓN DE CUENTA & LIBRO MAYOR */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between bg-white min-w-0">
          <div>
            {/* SECCIÓN SUPERIOR: FORMULARIO DE CUENTA */}
            <div className="border-b border-slate-300">
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-4 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                <span>Seleccionar cuenta del plan de cuentas</span>
                <span className="text-slate-500 font-bold cursor-pointer">^</span>
              </div>

              <form onSubmit={handleGuardarCuenta} className="p-3 space-y-2 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-600 text-[11px] w-28 shrink-0">Código cuenta:</label>
                    <input
                      type="text"
                      value={formCodigo}
                      onChange={(e) => setFormCodigo(e.target.value)}
                      placeholder=""
                      className="px-2 py-1 bg-white border border-slate-300 text-xs w-full max-w-[140px] focus:outline-none focus:border-[#4c1d95]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-600 text-[11px] w-28 shrink-0">Descripción:</label>
                  <input
                    type="text"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder=""
                    className="px-2 py-1 bg-white border border-slate-300 text-xs flex-1 focus:outline-none focus:border-[#4c1d95]"
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
                    placeholder="Ingrese el tipo de cuenta"
                    className="px-2 py-1 bg-white border border-slate-300 text-xs flex-1 focus:outline-none focus:border-[#4c1d95]"
                  />
                  <HelpCircle className="w-4 h-4 text-[#4c1d95] shrink-0" />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-600 text-[11px] w-28 shrink-0">Título sumas y saldos:</label>
                  <input
                    type="text"
                    value={formTituloSumas}
                    onChange={(e) => setFormTituloSumas(e.target.value)}
                    placeholder="Ingrese el título de Sumas y saldos"
                    className="px-2 py-1 bg-white border border-slate-300 text-xs flex-1 focus:outline-none focus:border-[#4c1d95]"
                  />
                </div>

                {/* Botones de acción del formulario */}
                <div className="pt-2 flex justify-end items-center gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => alert('Menú de Títulos y Agrupaciones Contables activo.')}
                    className="px-3 py-1 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold transition-colors border border-[#4c1d95] flex items-center gap-1"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Títulos ▼</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert('Menú de Operaciones sobre Cuentas activo.')}
                    className="px-3 py-1 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold transition-colors border border-[#4c1d95]"
                  >
                    <span>Cuentas ▼</span>
                  </button>

                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold transition-colors border border-[#4c1d95]"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>

            {/* SECCIÓN INFERIOR: MAYOR (LIBRO MAYOR DE LA CUENTA SELECCIONADA) */}
            <div>
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-4 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                <div className="flex items-center gap-1.5">
                  <span>Mayor (click en los comprobantes para visualizarlos o editarlos)</span>
                  <HelpCircle className="w-3.5 h-3.5 text-[#4c1d95]" />
                </div>
                <button title="Exportar a Excel" className="p-0.5 hover:bg-slate-200 text-emerald-700">
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>

              {/* Grilla del Libro Mayor */}
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="py-2 px-2.5 border-r border-slate-200">Fecha</th>
                      <th className="py-2 px-2 border-r border-slate-200 text-center">Ti..</th>
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
                          <td className="py-2 px-2.5 border-r border-slate-200 text-right font-medium">
                            {m.debito > 0 ? `$${m.debito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-200 text-right font-medium">
                            {m.credito > 0 ? `$${m.credito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                            ${m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="h-8 border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="border-r border-slate-100 px-2.5">&nbsp;</td>
                          <td className="border-r border-slate-100 px-2"></td>
                          <td className="border-r border-slate-100 px-2.5"></td>
                          <td className="border-r border-slate-100 px-2.5"></td>
                          <td className="border-r border-slate-100 px-2.5"></td>
                          <td className="border-r border-slate-100 px-2.5"></td>
                          <td className="px-2.5"></td>
                        </tr>
                      ))
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
                  <button className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5 text-[#4c1d95]" /></button>
                </div>
                <span>
                  {cuentaSeleccionada && cuentaSeleccionada.movimientosMayor && cuentaSeleccionada.movimientosMayor.length > 0
                    ? `Mostrando 1 - ${cuentaSeleccionada.movimientosMayor.length} de ${cuentaSeleccionada.movimientosMayor.length}`
                    : 'Sin datos para mostrar'}
                </span>
              </div>
            </div>
          </div>

          {/* BOTONERA INFERIOR (Nuevo asiento a diario, Importar asientos, Cierres contables) */}
          <div className="bg-[#ede9fe]/30 border-t border-slate-300 px-4 py-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAsientoModal(true)}
              className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Nuevo asiento a diario</span>
            </button>

            <button
              onClick={() => alert('Asistente de importación masiva de asientos de diario activo.')}
              className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Importar asientos</span>
            </button>

            <button
              onClick={() => setShowCierresModal(true)}
              className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Cierres contables ▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: NUEVO ASIENTO A DIARIO */}
      {showAsientoModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-lg shadow-2xl">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>NUEVO ASIENTO A DIARIO</span>
              <button onClick={() => setShowAsientoModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Asiento '${asientoConcepto}' registrado por $${asientoMonto.toLocaleString('es-AR')}.`);
                setShowAsientoModal(false);
              }}
              className="p-4 space-y-3 font-mono text-xs"
            >
              <div>
                <label className="text-slate-600 block text-[11px] mb-1">Concepto / Glosa:</label>
                <input
                  type="text"
                  required
                  value={asientoConcepto}
                  onChange={(e) => setAsientoConcepto(e.target.value)}
                  placeholder="ej: Devengamiento de Sueldos y Cargas Sociales Mes"
                  className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1">Monto Asiento ($):</label>
                  <input
                    type="number"
                    required
                    value={asientoMonto}
                    onChange={(e) => setAsientoMonto(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1">Fecha Contable:</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
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
                  className="px-4 py-1.5 bg-[#4c1d95] text-white hover:bg-[#3b0764] font-bold"
                >
                  Registrar Asiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CIERRES CONTABLES */}
      {showCierresModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-md shadow-2xl">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>CIERRES Y REFUNDICIONES CONTABLES</span>
              <button onClick={() => setShowCierresModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs text-slate-700">
              <p className="text-[11px] leading-relaxed">
                Seleccione el procedimiento de cierre o refundición patrimonial a ejecutar:
              </p>
              <button
                onClick={() => { alert('Generando asiento de refundición de cuentas de resultado...'); setShowCierresModal(false); }}
                className="w-full text-left p-2.5 border border-slate-200 hover:bg-[#ede9fe] transition-colors"
              >
                <span className="font-bold text-slate-900 block">1. Refundición de Cuentas de Resultado</span>
                <span className="text-[10px] text-slate-500">Cancela ingresos y gastos contra Resultado del Ejercicio.</span>
              </button>
              <button
                onClick={() => { alert('Generando asiento de cierre formal de cuentas patrimoniales...'); setShowCierresModal(false); }}
                className="w-full text-left p-2.5 border border-slate-200 hover:bg-[#ede9fe] transition-colors"
              >
                <span className="font-bold text-slate-900 block">2. Cierre Formal de Cuentas Patrimoniales</span>
                <span className="text-[10px] text-slate-500">Invierte débitos y créditos para saldo final cero de ejercicio.</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORTES CONTABLES */}
      {showReportesModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-lg shadow-2xl">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>REPORTES Y ESTADOS CONTABLES OFICIALES</span>
              <button onClick={() => setShowReportesModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2 font-mono text-xs">
              <button
                onClick={() => { alert('Descargando Balance General de 8 Columnas...'); setShowReportesModal(false); }}
                className="w-full text-left p-3 border border-slate-200 hover:bg-[#ede9fe] transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">1. Balance General de 8 Columnas</p>
                  <p className="text-[11px] text-slate-500">Sumas y saldos, balance patrimonial y estado de resultados integrado.</p>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
              </button>

              <button
                onClick={() => { alert('Generando Libro Diario General Foliado...'); setShowReportesModal(false); }}
                className="w-full text-left p-3 border border-slate-200 hover:bg-[#ede9fe] transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">2. Libro Diario General Foliado (Ley 19.550)</p>
                  <p className="text-[11px] text-slate-500">Asientos cronológicos foliados con balanceo de debe y haber.</p>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CALENDARIO DE VENCIMIENTOS */}
      {showCalendarioModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-md shadow-2xl">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>CALENDARIO DE VENCIMIENTOS - CONTABILIDAD</span>
              <button onClick={() => setShowCalendarioModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs text-slate-700">
              <div className="border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Cierre de Ejercicio Económico Anual</span>
                  <span className="text-[11px] text-slate-500">Fecha límite: 31 de Diciembre de 2026</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                  Programado
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PLAN DE CUENTAS */}
      {showNuevoPlanModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#15803d] w-full max-w-md shadow-2xl">
            <div className="bg-[#15803d] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>NUEVO PLAN DE CUENTAS</span>
              <button onClick={() => setShowNuevoPlanModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs text-slate-700">
              <p className="text-[11px] leading-relaxed">
                Puede inicializar un nuevo plan de cuentas estándar para empresas de ingeniería o importar un modelo preconfigurado de Grow Labs.
              </p>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNuevoPlanModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => { alert('Plan de cuentas estándar cargado correctamente.'); setShowNuevoPlanModal(false); }}
                  className="px-4 py-1.5 bg-[#15803d] text-white hover:bg-[#166534] font-bold"
                >
                  Cargar Modelo Estándar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
