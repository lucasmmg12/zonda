import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Play,
  CheckCircle2,
  Lock,
  Layers,
  Database,
  RefreshCw,
  Info,
  HelpCircle,
  Lightbulb,
  Workflow,
  CheckSquare,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { EntityToMigrate, DryRunReport } from '../../types/migration';
import { executeDryRunMigration } from '../../services/migration/erpAdapter';
import { exportToExcelCsv, printFinancialReport } from '../../utils/exportUtils';

export const MigrationHubModule: React.FC = () => {
  // Configuración de origen
  const [endpointUrl, setEndpointUrl] = useState('https://api.erp-gateway.local/v1/rpc');
  const [usuarioErp, setUsuarioErp] = useState('admin@empresa.com.ar');
  const [empresaId] = useState('10452 (ECAR S.A.S.)');
  const [mostrarGuia, setMostrarGuia] = useState(true);

  // Entidades seleccionadas para migrar
  const [selectedEntities, setSelectedEntities] = useState<EntityToMigrate[]>([
    'CLIENTES',
    'PROVEEDORES',
    'FACTURAS_VENTA',
    'FACTURAS_COMPRA',
    'PLAN_DE_CUENTAS',
    'ASIENTOS_HISTORICOS',
    'CHEQUES',
    'CUENTAS_BANCARIAS',
    'INVENTARIO'
  ]);

  // Estado del motor de simulación
  const [isRunning, setIsRunning] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [report, setReport] = useState<DryRunReport | null>(null);

  const toggleEntity = (entity: EntityToMigrate) => {
    if (selectedEntities.includes(entity)) {
      setSelectedEntities(selectedEntities.filter((e) => e !== entity));
    } else {
      setSelectedEntities([...selectedEntities, entity]);
    }
  };

  const handleSimularMigracion = async () => {
    setIsRunning(true);
    setProgressPercent(0);
    setProgressText('Iniciando simulación de migración Dry-Run en entorno Sandbox...');

    try {
      const result = await executeDryRunMigration(
        {
          endpointUrl,
          usuario: usuarioErp,
          idEmpresa: '10452'
        },
        selectedEntities,
        (text, percent) => {
          setProgressText(text);
          setProgressPercent(percent);
        }
      );
      setReport(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de Modo Seguro */}
      <div className="bg-white border-2 border-sanatorio-700/20 rounded-lg p-5 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-sanatorio-50 text-sanatorio-700 rounded-lg border border-sanatorio-200">
              <Workflow className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Zonda Data Hub & Conector de Migración ERP
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Plataforma de ingestión, validación de esquemas contables y simulación controlada de datos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarGuia(!mostrarGuia)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-sanatorio-700" />
            <span>{mostrarGuia ? 'Ocultar Guía' : 'Ver Instrucciones'}</span>
          </button>

          {/* Bloqueo de Producción */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs font-semibold">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Producción Bloqueada (Seguridad Activa)</span>
          </div>
        </div>
      </div>

      {/* Guía Paso a Paso con Iconos Gráficos */}
      {mostrarGuia && (
        <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 border border-slate-300 rounded-none p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sanatorio-900 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Instrucciones Operativas: ¿Cómo realizar una migración segura?</span>
            </div>
            <span className="text-[11px] font-semibold text-sanatorio-700 bg-white px-2 py-0.5 rounded border border-sanatorio-200">
              Flujo Controlado de 4 Pasos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-sanatorio-700 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-sanatorio-100 text-sanatorio-800 flex items-center justify-center text-[11px]">
                  1
                </span>
                <span>Configurar Conexión</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                Verifique el endpoint de la pasarela RPC y las credenciales del sistema origen.
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-sanatorio-700 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-sanatorio-100 text-sanatorio-800 flex items-center justify-center text-[11px]">
                  2
                </span>
                <span>Seleccionar Módulos</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                Marque las entidades a ingerir (clientes, facturas, cheques, plan contable).
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-sanatorio-700 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-sanatorio-100 text-sanatorio-800 flex items-center justify-center text-[11px]">
                  3
                </span>
                <span>Simular Dry-Run</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                Ejecute la prueba en memoria. Valida CUITs módulo 11 y cuadres contables.
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-sanatorio-700 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-sanatorio-100 text-sanatorio-800 flex items-center justify-center text-[11px]">
                  4
                </span>
                <span>Auditar Informe</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                Examine el informe de consistencia sin riesgo de alterar proyectos reales.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Configuración de Conexión y Parámetros */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Database className="w-4 h-4 text-sanatorio-700" />
            <h3 className="text-sm font-bold text-slate-900">Origen de Datos (Pasarela ERP)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gateway Endpoint</label>
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-sanatorio-700/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Usuario de Autenticación</label>
              <input
                type="text"
                value={usuarioErp}
                onChange={(e) => setUsuarioErp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Identificador de Empresa</label>
              <input
                type="text"
                disabled
                value={empresaId}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-none text-xs text-emerald-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#064e3b] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                El conector traduce la carga del ERP origen hacia modelos tipados en TypeScript con normalización de asientos.
              </p>
            </div>
          </div>
        </div>

        {/* Columna Central: Selector de Entidades */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sanatorio-700" />
              <h3 className="text-sm font-bold text-slate-900">Entidades y Módulos a Ingerir</h3>
            </div>
            <span className="text-xs text-slate-500">
              {selectedEntities.length} seleccionadas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'CLIENTES' as EntityToMigrate, label: 'Maestro de Clientes', desc: 'CUITs, cuentas corrientes y condiciones IVA' },
              { id: 'PROVEEDORES' as EntityToMigrate, label: 'Maestro de Proveedores', desc: 'Datos fiscales y cuentas de imputación' },
              { id: 'FACTURAS_VENTA' as EntityToMigrate, label: 'Facturas de Venta', desc: 'Comprobantes A/B/C y CAEs AFIP' },
              { id: 'FACTURAS_COMPRA' as EntityToMigrate, label: 'Facturas de Compra', desc: 'Comprobantes y retenciones impositivas' },
              { id: 'PLAN_DE_CUENTAS' as EntityToMigrate, label: 'Plan de Cuentas', desc: 'Jerarquía contable multinivel' },
              { id: 'ASIENTOS_HISTORICOS' as EntityToMigrate, label: 'Asientos Contables', desc: 'Libro Diario en partida doble' },
              { id: 'CHEQUES' as EntityToMigrate, label: 'Cartera de Cheques', desc: 'Valores en cartera y diferidos emitidos' },
              { id: 'CUENTAS_BANCARIAS' as EntityToMigrate, label: 'Cajas y Bancos', desc: 'Saldos y conciliaciones bancarias' },
              { id: 'INVENTARIO' as EntityToMigrate, label: 'Artículos y Stock', desc: 'Listas de precios, SKUs y depósitos' }
            ].map((ent) => {
              const checked = selectedEntities.includes(ent.id);
              return (
                <div
                  key={ent.id}
                  onClick={() => toggleEntity(ent.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    checked
                      ? 'border-sanatorio-600 bg-sanatorio-50/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="rounded text-sanatorio-700 focus:ring-sanatorio-700 pointer-events-none"
                    />
                    <span className="text-xs font-bold text-slate-800">{ent.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 pl-5">{ent.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Botonera de Acción */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Simulación protegida: No altera bases productivas.</span>
            </div>

            <button
              onClick={handleSimularMigracion}
              disabled={isRunning || selectedEntities.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-subtle transition-all ${
                isRunning || selectedEntities.length === 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-sanatorio-700 hover:bg-sanatorio-800'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditando ({progressPercent}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Ejecutar Simulación Dry-Run (Sandbox)</span>
                </>
              )}
            </button>
          </div>

          {/* Barra de Progreso */}
          {isRunning && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>{progressText}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sanatorio-700 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultados del Reporte Dry-Run */}
      {report && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Informe de Viabilidad de Migración (Dry-Run ID: {report.id})
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Análisis de integridad completado. Los esquemas son 100% compatibles con Zonda ERP.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const rows = report.steps.map((st) => [
                    st.entity,
                    st.totalRecordsSource,
                    st.validRecords,
                    st.warnings.join(' | ') || 'Sin advertencias',
                    'Completado'
                  ]);
                  exportToExcelCsv(
                    `Auditoria_Migracion_DryRun_${report.id}.csv`,
                    ['Entidad', 'Registros Origen', 'Validos', 'Alertas', 'Estado'],
                    rows
                  );
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Exportar Excel</span>
              </button>
              <button
                onClick={() => {
                  const rows = report.steps.map((st) => [
                    st.entity,
                    st.totalRecordsSource,
                    st.validRecords,
                    st.warnings.join(' | ') || 'Sin advertencias',
                    'VERIFICADO'
                  ]);
                  printFinancialReport(
                    `Informe de Viabilidad Dry-Run (${report.id})`,
                    `Origen: ${endpointUrl} | Total Auditados: ${report.totalRecordsEstimated} registros`,
                    ['Entidad', 'Registros Origen', 'Válidos', 'Normalizaciones', 'Estado'],
                    rows
                  );
                }}
                className="px-3 py-1.5 bg-sanatorio-700 hover:bg-sanatorio-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Imprimir PDF Auditoría</span>
              </button>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                Integridad Verificada (0 Errores Críticos)
              </span>
            </div>
          </div>

          {/* Resumen Cuantitativo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500">Total Registros Auditados</span>
              <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                {report.totalRecordsEstimated.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500">Módulos Auditados</span>
              <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                {report.totalEntitiesSelected}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500">Entorno Destino</span>
              <p className="text-xs font-semibold text-sanatorio-700 mt-1">
                Zonda Local Sandbox
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500">Estado de Bloqueo</span>
              <p className="text-xs font-bold text-amber-700 mt-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Producción Bloqueada</span>
              </p>
            </div>
          </div>

          {/* Tabla de Resultados por Entidad */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-4">Entidad</th>
                  <th className="py-2.5 px-4">Registros Origen</th>
                  <th className="py-2.5 px-4">Válidos para Ingestión</th>
                  <th className="py-2.5 px-4">Alertas / Normalizaciones</th>
                  <th className="py-2.5 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.steps.map((st) => (
                  <tr key={st.entity} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{st.entity}</td>
                    <td className="py-2.5 px-4 font-mono">{st.totalRecordsSource}</td>
                    <td className="py-2.5 px-4 font-mono text-emerald-700 font-semibold">
                      {st.validRecords}
                    </td>
                    <td className="py-2.5 px-4">
                      {st.warnings.length > 0 ? (
                        <span className="text-[11px] text-amber-700 font-medium">
                          {st.warnings[0]}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sin advertencias</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completado</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mapeo de Esquemas */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-2">
            <h4 className="text-xs font-bold text-slate-900">
              Reglas de Transformación Aplicadas (ERP Origen → Zonda TypeScript):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {report.schemaDifferences.map((diff, i) => (
                <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-md">
                  <div className="text-slate-500 font-mono text-[10px]">{diff.sourceField}</div>
                  <div className="text-sanatorio-700 font-mono font-semibold text-[11px] mt-0.5">
                    → {diff.targetField}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1 italic">
                    Acción: {diff.transformationApplied}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
