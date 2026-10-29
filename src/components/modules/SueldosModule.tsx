import React, { useState } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle2,
  DollarSign,
  Plus,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  X,
  FileCode2,
  Printer
} from 'lucide-react';
import type { ConvenioColectivo, LiquidacionPeriodo } from '../../types/models';
import { generarTxtLibroSueldosDigital, type ResultadoGeneracionLsd } from '../../services/afip/libroSueldosDigital';
import { useErp } from '../../context/ErpContext';
import { exportToExcelCsv, printFinancialReport } from '../../utils/exportUtils';

export const SueldosModule: React.FC = () => {
  const {
    empleados,
    liquidacionActual,
    empresa,
    crearEmpleadoLegajo,
    actualizarLiquidacionPeriodo,
    refreshAllFromDb
  } = useErp();

  const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState<string>('EMP-101');
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [filtroCct, setFiltroCct] = useState<string>('TODOS');

  // Pestañas principales
  const [tabPrincipal, setTabPrincipal] = useState<'recibo' | 'nomina' | 'cct' | 'afip_lsd'>('recibo');

  // Modales
  const [showNuevaLiquidacionModal, setShowNuevaLiquidacionModal] = useState(false);
  const [showNuevoLegajoModal, setShowNuevoLegajoModal] = useState(false);
  const [showF931Modal, setShowF931Modal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);
  const [copiadoLsd, setCopiadoLsd] = useState(false);

  // Formulario nuevo empleado
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCuil, setNuevoCuil] = useState('');
  const [nuevoCct, setNuevoCct] = useState<ConvenioColectivo>('CCT 76/75 (UOCRA - Construcción)');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevoBasico, setNuevoBasico] = useState(600000);

  // Formulario nueva liquidación
  const [formPeriodo, setFormPeriodo] = useState(liquidacionActual.periodo);
  const [formTipoLiq, setFormTipoLiq] = useState<LiquidacionPeriodo['tipoLiquidacion']>(liquidacionActual.tipoLiquidacion);
  const [formFechaPago, setFormFechaPago] = useState(liquidacionActual.fechaPago);

  // Filtrado de empleados
  const empleadosFiltrados = empleados.filter((e) => {
    const coincideTexto =
      e.nombreCompleto.toLowerCase().includes(searchEmpleado.toLowerCase()) ||
      e.cuil.includes(searchEmpleado) ||
      e.legajo.includes(searchEmpleado);
    const coincideCct = filtroCct === 'TODOS' || e.cct === filtroCct;
    return coincideTexto && coincideCct;
  });

  const empleadoActivo = empleados.find((e) => e.id === empleadoSeleccionadoId) || empleadosFiltrados[0];

  // Cálculo de totales del empleado activo
  const totalRemunerativo = empleadoActivo
    ? empleadoActivo.conceptosLiquidacion.reduce((acc, c) => acc + (c.remunerativo || 0), 0)
    : 0;
  const totalNoRemunerativo = empleadoActivo
    ? empleadoActivo.conceptosLiquidacion.reduce((acc, c) => acc + (c.noRemunerativo || 0), 0)
    : 0;
  const totalDescuentos = empleadoActivo
    ? empleadoActivo.conceptosLiquidacion.reduce((acc, c) => acc + (c.descuento || 0), 0)
    : 0;
  const netoCobrar = totalRemunerativo + totalNoRemunerativo - totalDescuentos;

  // Generación oficial del archivo AFIP LSD (RG 3781)
  const lsdResultado: ResultadoGeneracionLsd = generarTxtLibroSueldosDigital(
    empresa.cuit,
    empleados,
    liquidacionActual
  );

  // Descarga física del archivo TXT para AFIP
  const handleDescargarTxtLsd = () => {
    const blob = new Blob([lsdResultado.contenidoTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = lsdResultado.nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopiarTxtLsd = () => {
    navigator.clipboard.writeText(lsdResultado.contenidoTxt);
    setCopiadoLsd(true);
    setTimeout(() => setCopiadoLsd(false), 2500);
  };

  // Alta de Legajo en Supabase + Recálculo Liquidación
  const handleCrearLegajo = async (e: React.FormEvent) => {
    e.preventDefault();
    const creado = await crearEmpleadoLegajo({
      nombreCompleto: nuevoNombre.toUpperCase(),
      cuil: nuevoCuil,
      cct: nuevoCct,
      categoria: nuevaCategoria || 'Operario de Planta',
      sueldoBasico: nuevoBasico
    });

    setEmpleadoSeleccionadoId(creado.id);
    setShowNuevoLegajoModal(false);
    setNuevoNombre('');
    setNuevoCuil('');
    setNuevaCategoria('');
  };

  // Apertura y devengamiento de nueva liquidación en Supabase + Asiento Contable
  const handleGuardarLiquidacion = async (e: React.FormEvent) => {
    e.preventDefault();
    await actualizarLiquidacionPeriodo({
      periodo: formPeriodo,
      tipoLiquidacion: formTipoLiq,
      fechaPago: formFechaPago
    });
    setShowNuevaLiquidacionModal(false);
  };

  // Imprimir Recibo Oficial PDF
  const handleImprimirReciboPdf = () => {
    if (!empleadoActivo) return;
    printFinancialReport(
      `RECIBO DE HABERES LEY 20.744 - LEGAJO #${empleadoActivo.legajo}`,
      `Trabajador: ${empleadoActivo.nombreCompleto} | CUIL: ${empleadoActivo.cuil} | CCT: ${empleadoActivo.cct} | Período: ${liquidacionActual.periodo} | Neto a Cobrar: $${netoCobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      ['Código', 'Concepto / AFIP LSD', 'Unidades', 'Remunerativo ($)', 'No Remun. ($)', 'Descuentos ($)'],
      empleadoActivo.conceptosLiquidacion.map((c) => [
        c.codigo,
        `${c.descripcion} (LSD ${c.codigoAfipLsd})`,
        c.unidades || '-',
        c.remunerativo > 0 ? `$${c.remunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-',
        c.noRemunerativo > 0 ? `$${c.noRemunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-',
        c.descuento > 0 ? `$${c.descuento.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'
      ])
    );
  };

  // Exportar Nómina a Excel
  const handleExportarNominaExcel = () => {
    exportToExcelCsv(
      `Nomina_Personal_${liquidacionActual.periodo}`,
      empleados.map((e) => {
        const rem = e.conceptosLiquidacion.reduce((a, c) => a + (c.remunerativo || 0), 0);
        const noRem = e.conceptosLiquidacion.reduce((a, c) => a + (c.noRemunerativo || 0), 0);
        const desc = e.conceptosLiquidacion.reduce((a, c) => a + (c.descuento || 0), 0);
        return {
          Legajo: e.legajo,
          NombreCompleto: e.nombreCompleto,
          CUIL: e.cuil,
          CCT: e.cct,
          Categoria: e.categoria,
          SueldoBasico: e.sueldoBasico,
          TotalRemunerativo: rem,
          TotalNoRemunerativo: noRem,
          TotalDescuentos: desc,
          NetoBolsillo: rem + noRem - desc
        };
      })
    );
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      {/* 1. BARRA SUPERIOR DE ENCABEZADO Y LLAMADA AL CALENDARIO */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
            Liquidación de Sueldos y Cargas Sociales
          </h1>
          <span className="text-xs text-slate-500 font-medium">
            | CCT UOCRA, COMERCIO, SANIDAD & LIBRO SUELDOS DIGITAL (SUPABASE DB)
          </span>
        </div>

        <button
          onClick={() => setShowCalendarioModal(true)}
          className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#4c1d95]"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendario de vencimientos</span>
        </button>
      </div>

      {/* 2. PESTAÑAS PRINCIPALES DEL MÓDULO */}
      <div className="bg-[#ede9fe]/40 border-b border-slate-300 px-2 pt-1 flex flex-wrap items-center gap-1">
        {[
          { key: 'recibo', label: 'Liquidación y Recibos de Sueldo' },
          { key: 'nomina', label: 'Nómina de Legajos' },
          { key: 'cct', label: 'Convenios CCT y Fórmulas' },
          { key: 'afip_lsd', label: 'Libro Sueldos Digital AFIP (TXT RG 3781)' }
        ].map((tab) => {
          const isActive = tabPrincipal === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabPrincipal(tab.key as 'recibo' | 'nomina' | 'cct' | 'afip_lsd')}
              className={`px-3.5 py-2 text-xs font-bold transition-all border-t-2 ${
                isActive
                  ? 'bg-white border-t-[#4c1d95] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
                  : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. VISTA 1: RECIBO DE SUELDO & MASTER-DETAIL */}
      {tabPrincipal === 'recibo' && (
        <div className="flex flex-col lg:flex-row min-h-[660px] bg-white border border-slate-300 border-t-0">
          {/* PANEL IZQUIERDO: LISTA DE LEGAJOS (MASTER) */}
          <div className="w-full lg:w-80 border-r border-slate-300 bg-white flex flex-col justify-between shrink-0">
            <div>
              {/* Header del Panel Izquierdo */}
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Nómina de Personal</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Período: {liquidacionActual.periodo.slice(0, 4)}/{liquidacionActual.periodo.slice(4)}
                </span>
              </div>

              {/* Filtro por Convenio */}
              <div className="p-2 border-b border-slate-200 bg-slate-50 space-y-2">
                <input
                  type="text"
                  value={searchEmpleado}
                  onChange={(e) => setSearchEmpleado(e.target.value)}
                  placeholder="Buscar por legajo, nombre o CUIL"
                  className="w-full px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />

                <select
                  value={filtroCct}
                  onChange={(e) => setFiltroCct(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 text-[11px]"
                >
                  <option value="TODOS">Todos los Convenios (CCT)</option>
                  <option value="CCT 76/75 (UOCRA - Construcción)">CCT 76/75 (UOCRA)</option>
                  <option value="CCT 130/75 (Comercio y Servicios)">CCT 130/75 (Comercio)</option>
                  <option value="CCT 122/75 (Sanidad - Clínicas y Sanatorios)">CCT 122/75 (Sanidad)</option>
                  <option value="Fuera de Convenio (Dirección)">Fuera de Convenio</option>
                </select>
              </div>

              {/* Tabla de Empleados */}
              <div className="overflow-y-auto max-h-[460px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="py-2 px-2.5 border-r border-slate-200">Legajo</th>
                      <th className="py-2 px-2 border-r border-slate-200">Trabajador</th>
                      <th className="py-2 px-2 text-right">Neto ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {empleadosFiltrados.map((emp) => {
                      const isSelected = empleadoActivo?.id === emp.id;
                      const empRem = emp.conceptosLiquidacion.reduce((a, c) => a + (c.remunerativo || 0), 0);
                      const empNoRem = emp.conceptosLiquidacion.reduce((a, c) => a + (c.noRemunerativo || 0), 0);
                      const empDesc = emp.conceptosLiquidacion.reduce((a, c) => a + (c.descuento || 0), 0);
                      const empNeto = empRem + empNoRem - empDesc;

                      return (
                        <tr
                          key={emp.id}
                          onClick={() => setEmpleadoSeleccionadoId(emp.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#ede9fe] font-bold text-slate-900 border-l-4 border-l-[#4c1d95]'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <td className="py-2 px-2.5 border-r border-slate-200 font-bold tabular-nums">{emp.legajo}</td>
                          <td className="py-2 px-2 border-r border-slate-200 truncate max-w-[130px]">
                            <span className="block truncate font-semibold">{emp.nombreCompleto}</span>
                            <span className="text-[10px] text-slate-500 font-normal block truncate">{emp.cct}</span>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900 whitespace-nowrap tabular-nums">
                            ${empNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación del Panel Izquierdo */}
            <div className="bg-[#f8fafc] border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-1">
                <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span>Pág.</span>
                <input type="text" readOnly value="1" className="w-6 text-center border border-slate-300 bg-white py-0.5 text-[10px]" />
                <span>de 1</span>
                <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
                <button onClick={() => refreshAllFromDb()} className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5" /></button>
              </div>
              <span className="font-medium">Total: {empleadosFiltrados.length} legajos</span>
            </div>
          </div>

          {/* PANEL DERECHO: RECIBO OFICIAL DE HABERES (LEY 20.744) */}
          <div className="flex-1 flex flex-col justify-between bg-white min-w-0">
            <div>
              {/* Encabezado del Recibo */}
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    RECIBO OFICIAL DE SUELDOS (LEY 20.744 ART. 140)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                    HOMOLOGADO AFIP
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleImprimirReciboPdf}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir PDF</span>
                  </button>

                  <button
                    onClick={() => setTabPrincipal('afip_lsd')}
                    className="px-2.5 py-1 bg-[#4c1d95] hover:bg-[#3b0764] text-white text-xs font-bold border border-[#4c1d95] flex items-center gap-1 transition-colors"
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>Ver TXT LSD AFIP</span>
                  </button>
                </div>
              </div>

              {/* Ficha Laboral del Recibo */}
              {empleadoActivo && (
                <div className="p-4 border-b border-slate-300 bg-slate-50/50 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="border border-slate-200 bg-white p-2">
                      <span className="text-slate-500 text-[10px] block font-medium">Empleador:</span>
                      <p className="font-bold text-slate-900">{empresa.razonSocial}</p>
                      <p className="text-[11px] text-slate-600">CUIT: {empresa.cuit}</p>
                    </div>

                    <div className="border border-slate-200 bg-white p-2">
                      <span className="text-slate-500 text-[10px] block font-medium">Trabajador:</span>
                      <p className="font-bold text-slate-900">{empleadoActivo.nombreCompleto}</p>
                      <p className="text-[11px] text-slate-600">CUIL: {empleadoActivo.cuil} | Legajo: {empleadoActivo.legajo}</p>
                    </div>

                    <div className="border border-slate-200 bg-white p-2">
                      <span className="text-slate-500 text-[10px] block font-medium">Convenio y Categoría:</span>
                      <p className="font-bold text-slate-900 truncate" title={empleadoActivo.cct}>{empleadoActivo.cct}</p>
                      <p className="text-[11px] text-slate-600 truncate">{empleadoActivo.categoria}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="border border-slate-200 bg-white p-1.5">
                      <span className="text-slate-500 block text-[10px] font-medium">Período Liquidado:</span>
                      <span className="font-bold text-slate-900">{liquidacionActual.periodo} - {liquidacionActual.tipoLiquidacion}</span>
                    </div>
                    <div className="border border-slate-200 bg-white p-1.5">
                      <span className="text-slate-500 block text-[10px] font-medium">Fecha de Pago:</span>
                      <span className="font-bold text-slate-900">{liquidacionActual.fechaPago}</span>
                    </div>
                    <div className="border border-slate-200 bg-white p-1.5">
                      <span className="text-slate-500 block text-[10px] font-medium">Ingreso / Antigüedad:</span>
                      <span className="font-bold text-slate-900">{empleadoActivo.fechaIngreso} ({empleadoActivo.antiguedadAnios} años)</span>
                    </div>
                    <div className="border border-slate-200 bg-white p-1.5">
                      <span className="text-slate-500 block text-[10px] font-medium">Banco y CBU:</span>
                      <span className="font-bold text-slate-900 truncate block" title={empleadoActivo.cbu}>{empleadoActivo.banco}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grilla de Conceptos del Recibo de Sueldo */}
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="py-2 px-2.5 border-r border-slate-200 w-16 text-center">Código</th>
                      <th className="py-2 px-3 border-r border-slate-200">Concepto / AFIP LSD</th>
                      <th className="py-2 px-2.5 border-r border-slate-200 text-center w-24">Unidades</th>
                      <th className="py-2 px-3 border-r border-slate-200 text-right w-32">Remunerativo</th>
                      <th className="py-2 px-3 border-r border-slate-200 text-right w-32">No Remun.</th>
                      <th className="py-2 px-3 text-right w-32">Descuentos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {empleadoActivo &&
                      empleadoActivo.conceptosLiquidacion.map((c) => (
                        <tr key={c.codigo} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-center text-slate-500 font-bold tabular-nums">
                            {c.codigo}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-200">
                            <span className="font-semibold text-slate-900">{c.descripcion}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">Cod. AFIP LSD: {c.codigoAfipLsd}</span>
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-center text-slate-600">
                            {c.unidades || '-'}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-200 text-right font-semibold tabular-nums">
                            {c.remunerativo > 0
                              ? `$${c.remunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-200 text-right text-emerald-700 font-semibold tabular-nums">
                            {c.noRemunerativo > 0
                              ? `$${c.noRemunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right text-rose-700 font-semibold tabular-nums">
                            {c.descuento > 0
                              ? `$${c.descuento.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Totales del Recibo */}
              <div className="bg-[#f8fafc] border-t-2 border-slate-300 p-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center sm:text-right border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-medium">Total Remunerativo:</span>
                    <span className="font-bold text-slate-900 text-sm tabular-nums">
                      ${totalRemunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-medium">Total No Remunerativo:</span>
                    <span className="font-bold text-emerald-700 text-sm tabular-nums">
                      ${totalNoRemunerativo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-medium">Total Retenciones (17%+):</span>
                    <span className="font-bold text-rose-700 text-sm tabular-nums">
                      ${totalDescuentos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-[#ede9fe] border-2 border-[#4c1d95] p-2 text-right">
                    <span className="text-[#4c1d95] text-[10px] font-bold block uppercase tracking-wider">
                      Neto a Cobrar
                    </span>
                    <span className="font-extrabold text-[#4c1d95] text-lg tabular-nums">
                      ${netoCobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
                  <span>
                    Son pesos: <strong className="uppercase">Neto bancarizado acreditado en cuenta sueldos</strong>
                  </span>
                  <span className="font-medium">Firma del Empleador: ____________________________</span>
                </div>
              </div>
            </div>

            {/* BOTONERA INFERIOR DEL MÓDULO */}
            <div className="bg-[#ede9fe]/30 border-t border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNuevaLiquidacionModal(true)}
                  className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Nueva liquidación ▼</span>
                </button>

                <button
                  onClick={() => setShowNuevoLegajoModal(true)}
                  className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo legajo (Alta AFIP)</span>
                </button>

                <button
                  onClick={() => setShowF931Modal(true)}
                  className="px-3.5 py-1.5 bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#4c1d95] text-xs font-bold border border-[#c4b5fd] flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cargas Sociales F.931</span>
                </button>
              </div>

              <button
                onClick={handleDescargarTxtLsd}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold border border-emerald-800 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generar TXT Libro Sueldos Digital AFIP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. VISTA 2: LIBRO SUELDOS DIGITAL AFIP (TXT OFICIAL RG 3781) */}
      {tabPrincipal === 'afip_lsd' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 text-xs space-y-5">
          <div className="bg-slate-50 border border-slate-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileCode2 className="w-5 h-5 text-[#4c1d95]" />
                <span>Generador Oficial de Archivo TXT para AFIP - Libro Sueldos Digital (RG 3781)</span>
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Este archivo contiene la estructura posicional oficial exigida por AFIP con los registros <strong>01 (Cabecera)</strong>, <strong>02 (Trabajador)</strong>, <strong>03 (Conceptos Homologados)</strong> y <strong>04 (Bases Imponibles F.931)</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopiarTxtLsd}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiadoLsd ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoLsd ? '¡Copiado!' : 'Copiar TXT'}</span>
              </button>

              <button
                onClick={handleDescargarTxtLsd}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Descargar {lsdResultado.nombreArchivo}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="border border-slate-200 p-3 bg-white">
              <span className="text-slate-500 text-[10px] block font-medium">Nombre de Archivo:</span>
              <p className="font-bold text-slate-900 truncate font-mono text-[11px]">{lsdResultado.nombreArchivo}</p>
            </div>
            <div className="border border-slate-200 p-3 bg-white">
              <span className="text-slate-500 text-[10px] block font-medium">Registros Generados:</span>
              <p className="font-bold text-slate-900 tabular-nums">{lsdResultado.totalRegistros} líneas posicionales</p>
            </div>
            <div className="border border-slate-200 p-3 bg-white">
              <span className="text-slate-500 text-[10px] block font-medium">Masa Salarial Bruta:</span>
              <p className="font-bold text-emerald-700 tabular-nums">${lsdResultado.totalBruto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border border-slate-200 p-3 bg-white">
              <span className="text-slate-500 text-[10px] block font-medium">Estado Validación RG 3781:</span>
              <p className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Estructura 100% Válida</span>
              </p>
            </div>
          </div>

          <div>
            <div className="bg-[#1e1b4b] text-slate-300 px-4 py-2 flex items-center justify-between text-[11px] font-bold">
              <span className="tracking-wide">PREVISUALIZACIÓN DE ARCHIVO PLANO POSICIONAL (AFIP LSD)</span>
              <span className="text-slate-400 font-normal">Formato UTF-8 / CRLF</span>
            </div>
            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800 select-all">
              {lsdResultado.contenidoTxt}
            </pre>
          </div>
        </div>
      )}

      {/* 5. VISTA 3: NÓMINA DE LEGAJOS */}
      {tabPrincipal === 'nomina' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 text-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Ficha Maestra de Empleados y Categorías de Convenio</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportarNominaExcel}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Nómina Excel</span>
              </button>
              <button
                onClick={() => setShowNuevoLegajoModal(true)}
                className="px-3.5 py-1.5 bg-[#4c1d95] text-white font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Alta de Legajo</span>
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="py-2 px-3 border-r border-slate-200">Legajo</th>
                <th className="py-2 px-3 border-r border-slate-200">Nombre Completo</th>
                <th className="py-2 px-3 border-r border-slate-200">CUIL</th>
                <th className="py-2 px-3 border-r border-slate-200">Convenio Colectivo</th>
                <th className="py-2 px-3 border-r border-slate-200">Categoría</th>
                <th className="py-2 px-3 border-r border-slate-200">Ingreso</th>
                <th className="py-2 px-3 border-r border-slate-200 text-right">Sueldo Básico</th>
                <th className="py-2 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {empleados.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 border-r border-slate-200 font-bold tabular-nums">{emp.legajo}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{emp.nombreCompleto}</td>
                  <td className="py-2 px-3 border-r border-slate-200">{emp.cuil}</td>
                  <td className="py-2 px-3 border-r border-slate-200">{emp.cct}</td>
                  <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{emp.categoria}</td>
                  <td className="py-2 px-3 border-r border-slate-200">{emp.fechaIngreso}</td>
                  <td className="py-2 px-3 border-r border-slate-200 text-right font-bold tabular-nums">
                    ${emp.sueldoBasico.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px]">Activo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. VISTA 4: CONVENIOS CCT Y FÓRMULAS */}
      {tabPrincipal === 'cct' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 text-xs space-y-4 max-w-4xl">
          <h3 className="font-bold text-slate-900 text-sm">Convenios Colectivos Parametrizados en el Motor de Zonda ERP</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 p-4 bg-slate-50 space-y-2">
              <span className="px-2 py-0.5 bg-[#4c1d95] text-white font-bold text-[10px]">CONSTRUCCIÓN</span>
              <h4 className="font-bold text-slate-900 text-xs">CCT 76/75 - UOCRA</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Régimen laboral de la industria de la construcción. Incluye Adicional de Asistencia Perfecta (20% sobre básico), Zona Desfavorable, Fondo de Cese Laboral (FOCER) Ley 22.250 en sustitución del preaviso y despido.
              </p>
            </div>

            <div className="border border-slate-200 p-4 bg-slate-50 space-y-2">
              <span className="px-2 py-0.5 bg-[#4c1d95] text-white font-bold text-[10px]">COMERCIO</span>
              <h4 className="font-bold text-slate-900 text-xs">CCT 130/75 - FAECYS / SEC</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Empleados mercantiles y administrativos. Incluye Presentismo Art. 40 (8.33% / una doceava parte), Antigüedad escalonada al 1% anual acumulativo y acuerdos paritarios de sumas no remunerativas.
              </p>
            </div>

            <div className="border border-slate-200 p-4 bg-slate-50 space-y-2">
              <span className="px-2 py-0.5 bg-[#4c1d95] text-white font-bold text-[10px]">SANIDAD</span>
              <h4 className="font-bold text-slate-900 text-xs">CCT 122/75 - FATSA / ATSA</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Personal médico, de enfermería y técnico en Clínicas y Sanatorios (Sanatorio Argentino). Contempla Módulos de Guardias Críticas, Adicional por Título Universitario, Tareas Riesgosas y Antigüedad al 2% anual.
              </p>
            </div>

            <div className="border border-slate-200 p-4 bg-slate-50 space-y-2">
              <span className="px-2 py-0.5 bg-slate-700 text-white font-bold text-[10px]">JERÁRQUICOS</span>
              <h4 className="font-bold text-slate-900 text-xs">Fuera de Convenio - Ley 20.744</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cargos directivos y de supervisión general. Aplica topes de retención de aportes jubilatorios SIPA fijados por ANSES/AFIP y cálculo automatizado de retención de Impuesto a las Ganancias de 4ta Categoría.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA LIQUIDACIÓN */}
      {showNuevaLiquidacionModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-md shadow-2xl text-xs">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-bold">
              <span className="tracking-tight">APERTURA DE NUEVA LIQUIDACIÓN (SUPABASE DB)</span>
              <button onClick={() => setShowNuevaLiquidacionModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleGuardarLiquidacion} className="p-4 space-y-3">
              <div>
                <label className="text-slate-600 block text-[11px] mb-1 font-medium">Período (AAAAMM):</label>
                <input
                  type="text"
                  required
                  value={formPeriodo}
                  onChange={(e) => setFormPeriodo(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 focus:outline-none focus:border-[#4c1d95] tabular-nums"
                />
              </div>

              <div>
                <label className="text-slate-600 block text-[11px] mb-1 font-medium">Tipo de Liquidación:</label>
                <select
                  value={formTipoLiq}
                  onChange={(e) => setFormTipoLiq(e.target.value as LiquidacionPeriodo['tipoLiquidacion'])}
                  className="w-full px-2 py-1.5 border border-slate-300 bg-white"
                >
                  <option value="Mensual">Mensual Ordinaria</option>
                  <option value="1ra Quincena">1ra Quincena (Jornalizados CCT 76/75)</option>
                  <option value="2da Quincena">2da Quincena (Jornalizados CCT 76/75)</option>
                  <option value="SAC 1">SAC 1er Semestre (Aguinaldo)</option>
                  <option value="SAC 2">SAC 2do Semestre (Aguinaldo)</option>
                  <option value="Vacaciones">Vacaciones Anuales</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block text-[11px] mb-1 font-medium">Fecha de Pago Bancario:</label>
                <input
                  type="date"
                  value={formFechaPago}
                  onChange={(e) => setFormFechaPago(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNuevaLiquidacionModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4c1d95] text-white font-bold"
                >
                  Calcular Nómina y Devengar Asiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO LEGAJO */}
      {showNuevoLegajoModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-lg shadow-2xl text-xs">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-bold">
              <span className="tracking-tight">ALTA DE LEGAJO / TRABAJADOR (SUPABASE DB)</span>
              <button onClick={() => setShowNuevoLegajoModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCrearLegajo} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1 font-medium">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="ej: MATIAS CARLOS HERRERA"
                    className="w-full px-2 py-1.5 border border-slate-300 uppercase focus:outline-none focus:border-[#4c1d95]"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1 font-medium">CUIL (11 dígitos):</label>
                  <input
                    type="text"
                    required
                    value={nuevoCuil}
                    onChange={(e) => setNuevoCuil(e.target.value)}
                    placeholder="20-35891204-9"
                    className="w-full px-2 py-1.5 border border-slate-300 focus:outline-none focus:border-[#4c1d95] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1 font-medium">Convenio Colectivo (CCT):</label>
                  <select
                    value={nuevoCct}
                    onChange={(e) => setNuevoCct(e.target.value as ConvenioColectivo)}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-white"
                  >
                    <option value="CCT 76/75 (UOCRA - Construcción)">CCT 76/75 (UOCRA)</option>
                    <option value="CCT 130/75 (Comercio y Servicios)">CCT 130/75 (Comercio)</option>
                    <option value="CCT 122/75 (Sanidad - Clínicas y Sanatorios)">CCT 122/75 (Sanidad)</option>
                    <option value="Fuera de Convenio (Dirección)">Fuera de Convenio</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1 font-medium">Categoría Laboral:</label>
                  <input
                    type="text"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    placeholder="ej: Oficial Electricista"
                    className="w-full px-2 py-1.5 border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 block text-[11px] mb-1 font-medium">Sueldo Básico de Convenio ($):</label>
                <input
                  type="number"
                  required
                  value={nuevoBasico}
                  onChange={(e) => setNuevoBasico(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-300 tabular-nums"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNuevoLegajoModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4c1d95] text-white font-bold"
                >
                  Guardar y Dar de Alta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CARGAS SOCIALES F.931 */}
      {showF931Modal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-xl shadow-2xl text-xs">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-bold">
              <span className="tracking-tight">DECLARACIÓN JURADA CARGAS SOCIALES F.931 AFIP</span>
              <button onClick={() => setShowF931Modal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="border border-slate-200 p-2.5 bg-slate-50">
                  <span className="text-slate-500 block font-medium">Total Aportes Trabajadores (Retenciones):</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5 tabular-nums">
                    ${liquidacionActual.totalRetenciones.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="border border-slate-200 p-2.5 bg-slate-50">
                  <span className="text-slate-500 block font-medium">Total Contribuciones Patronales:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5 tabular-nums">
                    ${liquidacionActual.totalContribucionesPatronales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 p-3 bg-white space-y-1.5 text-[11px]">
                <h4 className="font-bold text-slate-900">Desglose de Obligaciones de Seguridad Social:</h4>
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span>SIPA (Jubilación 10.77% + PAMI 1.58%):</span>
                  <span className="font-bold text-slate-900 tabular-nums">$635.420,00</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span>Asignaciones Familiares + FNE (5.64%):</span>
                  <span className="font-bold text-slate-900 tabular-nums">$290.150,00</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span>Régimen Nacional de Obras Sociales (6.00%):</span>
                  <span className="font-bold text-slate-900 tabular-nums">$308.700,00</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Aseguradora de Riesgos del Trabajo (ART) + Seguro Vida:</span>
                  <span className="font-bold text-slate-900 tabular-nums">$209.305,66</span>
                </div>
              </div>

              <div className="bg-[#ede9fe] border border-[#c4b5fd] p-3 flex justify-between items-center text-sm font-bold text-[#4c1d95]">
                <span>TOTAL A PAGAR VEP AFIP F.931:</span>
                <span className="tabular-nums">
                  ${(liquidacionActual.totalRetenciones + liquidacionActual.totalContribucionesPatronales).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CALENDARIO DE VENCIMIENTOS SUELDOS */}
      {showCalendarioModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-md shadow-2xl text-xs font-mono">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-bold">
              <span>CALENDARIO DE VENCIMIENTOS LABORALES Y AFIP</span>
              <button onClick={() => setShowCalendarioModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">05/11/2026 // 4to Día Hábil</span>
                  <span className="text-[11px] text-slate-500">Acreditación Bancaria de Haberes (Ley 20.744)</span>
                </div>
                <span className="font-bold text-emerald-700">${liquidacionActual.totalNeto.toLocaleString('es-AR')}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-900 block">12/11/2026 // Presentación F.931 y LSD</span>
                  <span className="text-[11px] text-amber-800">Vencimiento CUIT terminación 9 - AFIP</span>
                </div>
                <span className="font-bold text-amber-900">
                  ${(liquidacionActual.totalRetenciones + liquidacionActual.totalContribucionesPatronales).toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
