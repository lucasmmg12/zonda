import React, { useState } from 'react';
import {
  Clock,
  Landmark,
  ArrowUpRight,
  FileText,
  BookOpenCheck,
  ArrowRight,
  Compass,
  Terminal
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import { exportToExcelCsv, printFinancialReport } from '../../utils/exportUtils';

export const DashboardModule: React.FC = () => {
  const {
    facturasVenta,
    facturasCompra,
    cuentasBancarias,
    cheques,
    setActiveModule
  } = useErp();

  const [mostrarGuia, setMostrarGuia] = useState(false);

  const totalVentas = facturasVenta.reduce((acc, f) => acc + f.total, 0);
  const totalCompras = facturasCompra.reduce((acc, f) => acc + f.total, 0);
  const totalLiquidez = cuentasBancarias.reduce((acc, c) => acc + c.saldoActual, 0);
  const chequesEnCartera = cheques
    .filter((c) => c.estado === 'En Cartera')
    .reduce((acc, c) => acc + c.importe, 0);

  // Datos para gráfico de barras semestral (OCT refleja las ventas y compras en vivo de Supabase)
  const mesesFinancieros = [
    { mes: 'MAY', ingresos: 18.2, gastos: 14.1 },
    { mes: 'JUN', ingresos: 22.4, gastos: 17.8 },
    { mes: 'JUL', ingresos: 19.8, gastos: 16.2 },
    { mes: 'AGO', ingresos: 26.5, gastos: 21.0 },
    { mes: 'SEP', ingresos: 24.1, gastos: 19.4 },
    {
      mes: 'OCT',
      ingresos: Number((totalVentas / 1000000).toFixed(2)),
      gastos: Number((totalCompras / 1000000).toFixed(2))
    }
  ];

  const handleDescargarReporteAuditoria = () => {
    exportToExcelCsv(
      `Reporte_Auditoria_Ejecutiva_${new Date().toISOString().split('T')[0]}`,
      ['Indicador / Entidad', 'Categoría', 'Moneda', 'Importe ($ ARS)', 'Estado'],
      [
        ['Facturación Ventas del Período', 'Ingresos Operativos', 'ARS', totalVentas.toFixed(2), 'Auditado AFIP'],
        ['Compras y Gastos Registrados', 'Egresos Operativos', 'ARS', totalCompras.toFixed(2), 'Imputado'],
        ['Disponibilidad Cajas y Bancos', 'Tesorería', 'ARS', totalLiquidez.toFixed(2), 'Conciliado'],
        ['Valores y Cheques en Cartera', 'Custodia', 'ARS', chequesEnCartera.toFixed(2), 'En Cartera'],
        ...cuentasBancarias.map((c) => [c.nombre, c.tipoCuenta, c.moneda, c.saldoActual.toFixed(2), 'Activo'])
      ]
    );
  };

  const handleImprimirResumen = () => {
    printFinancialReport(
      'Reporte Ejecutivo de Auditoría Financiera',
      'Consolidado de Facturación AFIP, Compras, Tesorería y Valores en Custodia (Base de Datos Supabase)',
      ['Indicador / Cuenta', 'Categoría', 'Moneda', 'Saldo / Total'],
      [
        ['Facturación Total Ventas', 'Ventas AFIP', 'ARS', `$${totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
        ['Compras y Gastos del Período', 'Proveedores', 'ARS', `$${totalCompras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
        ['Valores en Custodia (Cheques)', 'Cartera', 'ARS', `$${chequesEnCartera.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`],
        ...cuentasBancarias.map((c) => [
          c.nombre,
          c.tipoCuenta,
          c.moneda,
          `$${c.saldoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        ])
      ]
    );
  };

  return (
    <div className="space-y-5">
      {/* Hero Banner Estilo Grow Labs Suite */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#0f293a] to-[#0f4c45] p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-teal-200 text-[11px] font-semibold">
            ● Centro de Control Financiero · Zonda Core
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Panel Ejecutivo de Gestión
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Supervisá facturación ARCA, compras, liquidez bancaria, stock y contabilidad en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveModule('clientes')}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-colors"
          >
            + Nueva Venta
          </button>
          <button
            onClick={handleDescargarReporteAuditoria}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold transition-colors"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span>{mostrarGuia ? 'Ocultar Guía' : 'Protocolo Diario'}</span>
          </button>
        </div>
      </div>

      {/* Guía Operativa Opcional */}
      {mostrarGuia && (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#064e3b] via-[#065f46] to-[#064e3b] border border-[#047857] p-4 text-white space-y-3 shadow-sm">
          {/* Gráfico transparente contable detrás del protocolo */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full text-emerald-200 opacity-[0.08]"
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
          >
            <line x1="0" y1="50" x2="1000" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
            <line x1="0" y1="100" x2="1000" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
            <line x1="0" y1="150" x2="1000" y2="150" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
            <path
              d="M0 170 Q 180 120, 320 140 T 650 80 T 1000 35"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
            <text x="740" y="185" fill="currentColor" fontSize="26" fontWeight="800" letterSpacing="4">
              ∑ DEBE = ∑ HABER
            </text>
          </svg>

          <div className="relative z-10 flex items-center justify-between pb-2 border-b border-emerald-500/30">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-200">
              <Terminal className="w-4 h-4 text-emerald-300" />
              <span>PROTOCOLO DE AUDITORÍA DIARIA // 4 ETAPAS SECUENCIALES</span>
            </div>
            <span className="text-[10px] text-emerald-100 border border-emerald-400/40 px-2 py-0.5 bg-emerald-950/30 font-semibold">
              ESTÁNDAR GROW LABS // QOAG
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Paso 1 */}
            <div
              onClick={() => setActiveModule('clientes')}
              className="p-3 bg-[#053e2f]/85 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-300 hover:bg-[#047857]/60 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-bold">[PASO 01]</span>
                <FileText className="w-4 h-4 text-emerald-300/80" />
              </div>
              <h4 className="text-xs font-bold text-white mt-1.5 uppercase">AUDITORÍA AFIP</h4>
              <p className="text-[11px] text-emerald-100/90 mt-1 leading-snug">
                Verifique que ningún comprobante emitido quede en estado "Pendiente" y confirme el CAE asignado.
              </p>
              <div className="mt-3 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] font-bold text-emerald-300 uppercase">
                <span>EJECUTAR REVISIÓN</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Paso 2 */}
            <div
              onClick={() => setActiveModule('tesoreria')}
              className="p-3 bg-[#053e2f]/85 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-300 hover:bg-[#047857]/60 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-bold">[PASO 02]</span>
                <Landmark className="w-4 h-4 text-emerald-300/80" />
              </div>
              <h4 className="text-xs font-bold text-white mt-1.5 uppercase">CONCILIACIÓN BANCOS</h4>
              <p className="text-[11px] text-emerald-100/90 mt-1 leading-snug">
                Cruce los saldos reales de cuentas corrientes contra los extractos de Banco Santander y Galicia.
              </p>
              <div className="mt-3 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] font-bold text-emerald-300 uppercase">
                <span>CRUZAR EXTRACTOS</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Paso 3 */}
            <div
              onClick={() => setActiveModule('tesoreria')}
              className="p-3 bg-[#053e2f]/85 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-300 hover:bg-[#047857]/60 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-bold">[PASO 03]</span>
                <Clock className="w-4 h-4 text-emerald-300/80" />
              </div>
              <h4 className="text-xs font-bold text-white mt-1.5 uppercase">CARTERA DE CHEQUES</h4>
              <p className="text-[11px] text-emerald-100/90 mt-1 leading-snug">
                Revise los cheques físicos con fecha de cobro próxima y programe depósitos o endosos a proveedores.
              </p>
              <div className="mt-3 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] font-bold text-emerald-300 uppercase">
                <span>CUSTODIA DE VALORES</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Paso 4 */}
            <div
              onClick={() => setActiveModule('contabilidad')}
              className="p-3 bg-[#053e2f]/85 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-300 hover:bg-[#047857]/60 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-bold">[PASO 04]</span>
                <BookOpenCheck className="w-4 h-4 text-emerald-300/80" />
              </div>
              <h4 className="text-xs font-bold text-white mt-1.5 uppercase">CUADRE PARTIDA DOBLE</h4>
              <p className="text-[11px] text-emerald-100/90 mt-1 leading-snug">
                Inspeccione el Libro Diario para validar que cada asiento mantenga balance matemático exacto: Debe = Haber.
              </p>
              <div className="mt-3 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] font-bold text-emerald-300 uppercase">
                <span>REVISAR ASIENTOS</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas KPIs Limpias Estilo Grow Labs Suite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Ventas */}
        <div
          onClick={() => setActiveModule('clientes')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-teal-300 cursor-pointer transition-all flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ventas Facturadas</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ${totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="text-slate-400">{facturasVenta.length} comprobantes</span>
            <span className="text-teal-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> AFIP / ARCA
            </span>
          </div>
        </div>

        {/* KPI: Compras */}
        <div
          onClick={() => setActiveModule('proveedores')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-teal-300 cursor-pointer transition-all flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Compras Registradas</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <BookOpenCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ${totalCompras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="text-slate-400">{facturasCompra.length} comprobantes</span>
            <span className="text-slate-600 font-semibold">Imputado 100%</span>
          </div>
        </div>

        {/* KPI: Liquidez en Bancos */}
        <div
          onClick={() => setActiveModule('tesoreria')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-teal-300 cursor-pointer transition-all flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Disponibilidad Bancaria</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ${totalLiquidez.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="text-slate-400">{cuentasBancarias.length} cuentas activas</span>
            <span className="text-sky-600 font-semibold">Tesorería</span>
          </div>
        </div>

        {/* KPI: Cheques en Cartera */}
        <div
          onClick={() => setActiveModule('tesoreria')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-teal-300 cursor-pointer transition-all flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cartera de Cheques</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ${chequesEnCartera.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
              {cheques.filter((c) => c.estado === 'En Cartera').length} en custodia
            </span>
            <span className="text-slate-400">Valores</span>
          </div>
        </div>
      </div>

      {/* Gráfico y Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Flujo Operativo — Ingresos vs. Egresos
              </h3>
              <p className="text-[11px] text-slate-400">Evolución mensual en millones ARS</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-zonda-700"></span>
                <span className="font-bold text-slate-800">INGRESOS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-300"></span>
                <span className="font-bold text-slate-600">EGRESOS</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-3 rounded-xl bg-slate-50/80 border border-slate-100">
            {mesesFinancieros.map((item, idx) => {
              const maxScale = Math.max(30, item.ingresos * 1.15, item.gastos * 1.15);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-48">
                    {/* Barra Ingresos */}
                    <div
                      className="w-1/2 rounded-t-md bg-teal-600 hover:bg-teal-700 transition-all relative group"
                      style={{ height: `${Math.min(100, (item.ingresos / maxScale) * 100)}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold rounded-md py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        ${item.ingresos}M
                      </span>
                    </div>
                    {/* Barra Gastos */}
                    <div
                      className="w-1/2 rounded-t-md bg-slate-300 hover:bg-slate-400 transition-all relative group"
                      style={{ height: `${Math.min(100, (item.gastos / maxScale) * 100)}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold rounded-md py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        ${item.gastos}M
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">{item.mes}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Facturación Octubre: <strong className="text-slate-900">${(totalVentas / 1000000).toFixed(2)}M ARS</strong>
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={handleImprimirResumen}
                className="text-slate-600 font-semibold hover:text-slate-900 cursor-pointer"
              >
                Imprimir PDF →
              </button>
              <button
                onClick={handleDescargarReporteAuditoria}
                className="text-teal-600 font-semibold hover:text-teal-700 cursor-pointer"
              >
                Descargar Excel →
              </button>
            </div>
          </div>
        </div>

        {/* Panel Lateral de Cuentas */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cajas y Bancos</h3>
                <p className="text-[11px] text-slate-400">Saldos conciliados en tiempo real</p>
              </div>
              <button
                onClick={() => setActiveModule('tesoreria')}
                className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
              >
                Ver todo ↗
              </button>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {cuentasBancarias.map((cuenta) => (
                <div
                  key={cuenta.id}
                  onClick={() => setActiveModule('tesoreria')}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-teal-300 hover:bg-white transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{cuenta.nombre}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-600 font-semibold">
                      {cuenta.moneda}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      ${cuenta.saldoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold">
                      Conciliado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Disponible</span>
            <span className="text-sm font-extrabold text-slate-900">
              ${totalLiquidez.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
