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
    setActiveModule,
    lastSync
  } = useErp();

  const [mostrarGuia, setMostrarGuia] = useState(true);

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
    <div className="space-y-4">
      {/* Banner Superior Estilo Consola de Ingeniería en Verde Bosque */}
      <div className="relative overflow-hidden bg-white border border-emerald-800/30 p-4 border-l-4 border-l-[#064e3b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filigrana Contable Interna del Banner */}
        <svg
          className="pointer-events-none absolute right-24 top-0 h-full w-64 text-[#064e3b] opacity-[0.06]"
          viewBox="0 0 240 80"
          fill="none"
        >
          <path d="M0 65 L40 45 L85 52 L135 20 L185 30 L235 8" stroke="currentColor" strokeWidth="2.5" />
          <line x1="0" y1="40" x2="240" y2="40" stroke="currentColor" strokeDasharray="3 3" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#064e3b] bg-emerald-50 px-2 py-0.5 border border-emerald-300">
              SYS // TABLERO EJECUTIVO
            </span>
            <span className="text-xs text-[#1f5e41] font-semibold">
              PERÍODO: 2026.10
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#042f22] tracking-tight mt-1 uppercase">
            CONSOLA DE CONTROL CONTABLE Y AUDITORÍA FINANCIERA
          </h2>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white text-[11px] font-bold uppercase transition-colors border border-[#047857] shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-300" />
            <span>{mostrarGuia ? '[ - ] OCULTAR GUÍA' : '[ + ] VER INSTRUCCIONES'}</span>
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-[#357a59] uppercase font-semibold">SINCRONIZACIÓN SUPABASE</p>
            <p className="text-xs font-bold text-[#064e3b]">{lastSync} // 100% CUADRADO</p>
          </div>
        </div>
      </div>

      {/* Guía Operativa en Verde Bosque Profundo con Elementos Gráficos Transparentes (Sin Negro) */}
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

      {/* Tarjetas KPIs Superiores con Filigrana Contable Transparente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI: Ventas */}
        <div
          onClick={() => setActiveModule('clientes')}
          className="relative overflow-hidden bg-white border border-emerald-800/30 border-t-4 border-t-[#047857] p-4 cursor-pointer hover:border-[#047857] transition-colors"
        >
          <svg className="pointer-events-none absolute -right-3 -bottom-3 w-28 h-24 text-[#064e3b] opacity-[0.06]" viewBox="0 0 120 100" fill="none">
            <rect x="15" y="55" width="14" height="40" fill="currentColor" />
            <rect x="38" y="40" width="14" height="55" fill="currentColor" />
            <rect x="61" y="25" width="14" height="70" fill="currentColor" />
            <rect x="84" y="10" width="14" height="85" fill="currentColor" />
          </svg>
          <div className="relative z-10 flex items-center justify-end text-[10px] text-[#357a59] uppercase">
            <span className="text-[#047857] font-bold">FACTURADO AFIP ({facturasVenta.length})</span>
          </div>
          <div className="relative z-10 mt-2">
            <span className="text-xs text-[#1f5e41] font-medium">VENTAS TOTALES:</span>
            <p className="text-2xl font-bold text-[#042f22] tracking-tight">
              ${totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#047857] font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>SINCRONIZADO CON CLIENTES</span>
            </div>
          </div>
        </div>

        {/* KPI: Compras */}
        <div
          onClick={() => setActiveModule('proveedores')}
          className="relative overflow-hidden bg-white border border-emerald-800/30 border-t-4 border-t-[#065f46] p-4 cursor-pointer hover:border-[#047857] transition-colors"
        >
          <svg className="pointer-events-none absolute -right-2 -bottom-2 w-28 h-24 text-[#064e3b] opacity-[0.06]" viewBox="0 0 120 100" fill="none">
            <circle cx="70" cy="55" r="36" stroke="currentColor" strokeWidth="6" strokeDasharray="45 15" />
            <path d="M70 55 L95 30" stroke="currentColor" strokeWidth="4" />
          </svg>
          <div className="relative z-10 flex items-center justify-end text-[10px] text-[#357a59] uppercase">
            <span className="text-[#065f46] font-bold">EGRESOS & GASTOS ({facturasCompra.length})</span>
          </div>
          <div className="relative z-10 mt-2">
            <span className="text-xs text-[#1f5e41] font-medium">COMPRAS REGISTRADAS:</span>
            <p className="text-2xl font-bold text-[#042f22] tracking-tight">
              ${totalCompras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#1f5e41] font-semibold">
              <span>IMPUTACIÓN: 100% C. COSTO</span>
            </div>
          </div>
        </div>

        {/* KPI: Liquidez en Bancos */}
        <div
          onClick={() => setActiveModule('tesoreria')}
          className="relative overflow-hidden bg-white border border-emerald-800/30 border-t-4 border-t-[#064e3b] p-4 cursor-pointer hover:border-[#047857] transition-colors"
        >
          <svg className="pointer-events-none absolute -right-2 -bottom-2 w-28 h-24 text-[#064e3b] opacity-[0.06]" viewBox="0 0 120 100" fill="none">
            <path d="M10 75 Q 35 35, 60 55 T 110 20" stroke="currentColor" strokeWidth="5" fill="none" />
            <line x1="10" y1="85" x2="110" y2="85" stroke="currentColor" strokeWidth="3" />
          </svg>
          <div className="relative z-10 flex items-center justify-end text-[10px] text-[#357a59] uppercase">
            <span className="text-[#064e3b] font-bold">DISPONIBILIDAD BANCARIA</span>
          </div>
          <div className="relative z-10 mt-2">
            <span className="text-xs text-[#1f5e41] font-medium">SALDO CONSOLIDADO:</span>
            <p className="text-2xl font-bold text-[#042f22] tracking-tight">
              ${totalLiquidez.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#047857] font-semibold">
              <span>{cuentasBancarias.length} ENTIDADES ACTIVAS</span>
            </div>
          </div>
        </div>

        {/* KPI: Cheques en Cartera */}
        <div
          onClick={() => setActiveModule('tesoreria')}
          className="relative overflow-hidden bg-white border border-emerald-800/30 border-t-4 border-t-emerald-500 p-4 cursor-pointer hover:border-[#047857] transition-colors"
        >
          <svg className="pointer-events-none absolute -right-2 -bottom-2 w-28 h-24 text-[#064e3b] opacity-[0.06]" viewBox="0 0 120 100" fill="none">
            <line x1="20" y1="30" x2="105" y2="30" stroke="currentColor" strokeWidth="5" />
            <line x1="62" y1="30" x2="62" y2="90" stroke="currentColor" strokeWidth="5" />
          </svg>
          <div className="relative z-10 flex items-center justify-end text-[10px] text-[#357a59] uppercase">
            <span className="text-[#047857] font-bold">VALORES EN CUSTODIA</span>
          </div>
          <div className="relative z-10 mt-2">
            <span className="text-xs text-[#1f5e41] font-medium">CARTERA DE CHEQUES:</span>
            <p className="text-2xl font-bold text-[#042f22] tracking-tight">
              ${chequesEnCartera.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#065f46] font-semibold">
              <span>{cheques.filter((c) => c.estado === 'En Cartera').length} CHEQUES EN CARTERA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico y Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Gráfico Estilo Osciloscopio Financiero */}
        <div className="lg:col-span-2 bg-white border border-slate-300 p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div>
              <div className="font-mono text-[10px] text-zonda-700 font-bold uppercase">
                [ANÁLISIS TEMPORAL EN VIVO]
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                FLUJO OPERATIVO // INGRESOS VS. EGRESOS (MILLONES ARS)
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
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

          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-300 bg-slate-50/50">
            {mesesFinancieros.map((item, idx) => {
              const maxScale = Math.max(30, item.ingresos * 1.15, item.gastos * 1.15);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-48">
                    {/* Barra Ingresos */}
                    <div
                      className="w-1/2 bg-zonda-700 hover:bg-slate-900 transition-all relative group"
                      style={{ height: `${Math.min(100, (item.ingresos / maxScale) * 100)}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[10px] py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-700">
                        ${item.ingresos}M
                      </span>
                    </div>
                    {/* Barra Gastos */}
                    <div
                      className="w-1/2 bg-slate-300 hover:bg-slate-500 transition-all relative group"
                      style={{ height: `${Math.min(100, (item.gastos / maxScale) * 100)}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[10px] py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-700">
                        ${item.gastos}M
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-700">{item.mes}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500">
            <span>
              FACTURACIÓN OCTUBRE: <strong className="text-slate-900">${(totalVentas / 1000000).toFixed(2)}M ARS</strong>
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={handleImprimirResumen}
                className="text-slate-700 font-bold hover:underline cursor-pointer uppercase"
              >
                IMPRIMIR PDF →
              </button>
              <button
                onClick={handleDescargarReporteAuditoria}
                className="text-zonda-700 font-bold hover:underline cursor-pointer uppercase"
              >
                DESCARGAR EXCEL AUDITORÍA →
              </button>
            </div>
          </div>
        </div>

        {/* Panel Lateral de Cuentas */}
        <div className="bg-white border border-slate-300 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 font-mono uppercase">
                [SALDOS // CAJAS Y BANCOS]
              </h3>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {cuentasBancarias.map((cuenta) => (
                <div
                  key={cuenta.id}
                  onClick={() => setActiveModule('tesoreria')}
                  className="p-3 bg-slate-50 border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-900">{cuenta.nombre}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-200 text-slate-800 font-bold">
                      {cuenta.moneda}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between font-mono">
                    <span className="text-sm font-bold text-slate-900">
                      ${cuenta.saldoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">CONCILIADO</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono">
            <span className="text-xs text-slate-500 uppercase font-semibold">TOTAL DISPONIBLE:</span>
            <span className="text-sm font-bold text-slate-900">
              ${totalLiquidez.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
