import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  ArrowUpRight,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  Lightbulb,
  FileText,
  BookOpenCheck,
  ArrowRight,
  Compass,
  Terminal,
  Activity
} from 'lucide-react';
import { mockFacturasVenta, mockFacturasCompra, mockCuentasBancarias, mockCheques } from '../../services/mockData';

export const DashboardModule: React.FC = () => {
  const [mostrarGuia, setMostrarGuia] = useState(true);

  const totalVentas = mockFacturasVenta.reduce((acc, f) => acc + f.total, 0);
  const totalCompras = mockFacturasCompra.reduce((acc, f) => acc + f.total, 0);
  const totalLiquidez = mockCuentasBancarias.reduce((acc, c) => acc + c.saldoActual, 0);
  const chequesEnCartera = mockCheques
    .filter((c) => c.estado === 'En Cartera')
    .reduce((acc, c) => acc + c.importe, 0);

  // Datos para gráfico de barras semestral
  const mesesFinancieros = [
    { mes: 'MAY', ingresos: 18.2, gastos: 14.1 },
    { mes: 'JUN', ingresos: 22.4, gastos: 17.8 },
    { mes: 'JUL', ingresos: 19.8, gastos: 16.2 },
    { mes: 'AGO', ingresos: 26.5, gastos: 21.0 },
    { mes: 'SEP', ingresos: 24.1, gastos: 19.4 },
    { mes: 'OCT', ingresos: 21.5, gastos: 18.3 }
  ];

  return (
    <div className="space-y-4">
      {/* Banner Superior Estilo Consola de Ingeniería */}
      <div className="bg-white border border-slate-300 p-4 border-l-4 border-l-zonda-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-zonda-700 bg-zonda-50 px-2 py-0.5 border border-zonda-200">
              SYS // TABLERO EJECUTIVO
            </span>
            <span className="font-mono text-xs text-slate-500 font-semibold">
              PERÍODO: 2026.10 // OCTUBRE
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1 font-mono uppercase">
            CONSOLA DE CONTROL CONTABLE Y AUDITORÍA FINANCIERA
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-slate-900 text-white font-mono text-[11px] font-bold uppercase transition-colors border border-black shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>{mostrarGuia ? '[ - ] OCULTAR GUÍA' : '[ + ] VER INSTRUCCIONES'}</span>
          </button>

          <div className="text-right hidden sm:block font-mono">
            <p className="text-[10px] text-slate-400 uppercase">ÚLTIMA CONCILIACIÓN</p>
            <p className="text-xs font-bold text-slate-800">10:45:00 UTC-3 // 100% CUADRADO</p>
          </div>
        </div>
      </div>

      {/* Guía Operativa con Bordes Rectos y Numeración Técnica */}
      {mostrarGuia && (
        <div className="bg-black border border-slate-800 p-4 text-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-emerald-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>PROTOCOLO DE AUDITORÍA DIARIA // 4 ETAPAS SECUENCIALES</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 border border-[#064e3b] px-2 py-0.5 bg-[#064e3b]/20">
              ESTÁNDAR GROW LABS // QOAG
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Paso 1 */}
            <div className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-600 transition-colors">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-emerald-400 font-bold">[PASO 01]</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-xs font-bold text-white mt-1.5 font-mono uppercase">AUDITORÍA AFIP</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Verifique que ningún comprobante emitido quede en estado "Pendiente" y confirme el CAE asignado.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase">
                <span>EJECUTAR REVISIÓN</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Paso 2 */}
            <div className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-600 transition-colors">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-emerald-400 font-bold">[PASO 02]</span>
                <Landmark className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-xs font-bold text-white mt-1.5 font-mono uppercase">CONCILIACIÓN BANCOS</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Cruce los saldos reales de cuentas corrientes contra los extractos de Banco Santander y Galicia.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase">
                <span>CRUZAR EXTRACTOS</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Paso 3 */}
            <div className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-600 transition-colors">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-emerald-400 font-bold">[PASO 03]</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-xs font-bold text-white mt-1.5 font-mono uppercase">CARTERA DE CHEQUES</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Revise los cheques físicos con fecha de cobro próxima y programe depósitos o endosos a proveedores.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase">
                <span>CUSTODIA DE VALORES</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Paso 4 */}
            <div className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-600 transition-colors">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-emerald-400 font-bold">[PASO 04]</span>
                <BookOpenCheck className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-xs font-bold text-white mt-1.5 font-mono uppercase">CUADRE PARTIDA DOBLE</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Inspeccione el Libro Diario para validar que cada asiento mantenga balance matemático exacto: Debe = Haber.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase">
                <span>REVISAR ASIENTOS</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas KPIs Superiores con Bordes Rectos y Acentos Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI: Ventas */}
        <div className="bg-white border border-slate-300 border-t-4 border-t-emerald-600 p-4">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 uppercase">
            <span>[METRIC // 01]</span>
            <span className="text-emerald-700 font-bold">FACTURADO AFIP</span>
          </div>
          <div className="mt-2">
            <span className="text-xs text-slate-500 font-mono">VENTAS NETAS:</span>
            <p className="text-2xl font-mono font-bold text-slate-900 tracking-tight">
              ${totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-mono font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.8% VS. MES ANTERIOR</span>
            </div>
          </div>
        </div>

        {/* KPI: Compras */}
        <div className="bg-white border border-slate-300 border-t-4 border-t-rose-600 p-4">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 uppercase">
            <span>[METRIC // 02]</span>
            <span className="text-rose-700 font-bold">EGRESOS & GASTOS</span>
          </div>
          <div className="mt-2">
            <span className="text-xs text-slate-500 font-mono">COMPRAS REGISTRADAS:</span>
            <p className="text-2xl font-mono font-bold text-slate-900 tracking-tight">
              ${totalCompras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 font-mono">
              <span>IMPUTACIÓN: 100% C. COSTO</span>
            </div>
          </div>
        </div>

        {/* KPI: Liquidez en Bancos */}
        <div className="bg-white border border-slate-300 border-t-4 border-t-zonda-700 p-4">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 uppercase">
            <span>[METRIC // 03]</span>
            <span className="text-zonda-700 font-bold">DISPONIBILIDAD BANCARIA</span>
          </div>
          <div className="mt-2">
            <span className="text-xs text-slate-500 font-mono">SALDO CONCILIADO:</span>
            <p className="text-2xl font-mono font-bold text-slate-900 tracking-tight">
              ${totalLiquidez.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zonda-700 font-mono font-semibold">
              <span>SANTANDER + GALICIA + CAJA</span>
            </div>
          </div>
        </div>

        {/* KPI: Cheques en Cartera */}
        <div className="bg-white border border-slate-300 border-t-4 border-t-amber-500 p-4">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 uppercase">
            <span>[METRIC // 04]</span>
            <span className="text-amber-700 font-bold">VALORES EN CUSTODIA</span>
          </div>
          <div className="mt-2">
            <span className="text-xs text-slate-500 font-mono">CARTERA DE CHEQUES:</span>
            <p className="text-2xl font-mono font-bold text-slate-900 tracking-tight">
              ${chequesEnCartera.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-800 font-mono font-semibold">
              <span>{mockCheques.filter((c) => c.estado === 'En Cartera').length} CHEQUES FÍSICOS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico y Balances con Aspecto de Terminal Financiera */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Gráfico Estilo Osciloscopio Financiero */}
        <div className="lg:col-span-2 bg-white border border-slate-300 p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div>
              <div className="font-mono text-[10px] text-zonda-700 font-bold uppercase">
                [ANÁLISIS TEMPORAL]
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
            {mesesFinancieros.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-48">
                  {/* Barra Ingresos */}
                  <div
                    className="w-1/2 bg-zonda-700 hover:bg-slate-900 transition-all relative group"
                    style={{ height: `${(item.ingresos / 30) * 100}%` }}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[10px] py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-700">
                      ${item.ingresos}M
                    </span>
                  </div>
                  {/* Barra Gastos */}
                  <div
                    className="w-1/2 bg-slate-300 hover:bg-slate-500 transition-all relative group"
                    style={{ height: `${(item.gastos / 30) * 100}%` }}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[10px] py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-700">
                      ${item.gastos}M
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-700">{item.mes}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>PROMEDIO MENSUAL: <strong className="text-slate-900">$22.08M ARS</strong></span>
            <span className="text-zonda-700 font-bold hover:underline cursor-pointer uppercase">
              DESCARGAR REPORTE AUDITORÍA →
            </span>
          </div>
        </div>

        {/* Panel Lateral de Cuentas */}
        <div className="bg-white border border-slate-300 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 font-mono uppercase">
                [SALDOS // CAJAS Y BANCOS]
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                LIVE
              </span>
            </div>

            <div className="space-y-2">
              {mockCuentasBancarias.map((cuenta) => (
                <div key={cuenta.id} className="p-3 bg-slate-50 border border-slate-200 hover:border-slate-400 transition-colors">
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
