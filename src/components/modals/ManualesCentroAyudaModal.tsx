import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Database,
  Copy,
  Printer,
  Search,
  ChevronRight,
  HelpCircle,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { MANUALES_ZONDA_ERP, SeccionManual } from '../../data/manualesData';
import { printFinancialReport } from '../../utils/exportUtils';

interface ManualesCentroAyudaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialManualId?: string;
}

export const ManualesCentroAyudaModal: React.FC<ManualesCentroAyudaModalProps> = ({
  isOpen,
  onClose,
  initialManualId = 'dashboard'
}) => {
  const [selectedId, setSelectedId] = useState<string>(initialManualId);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && initialManualId) {
      const exists = MANUALES_ZONDA_ERP.some((m) => m.id === initialManualId);
      setSelectedId(exists ? initialManualId : 'dashboard');
    }
  }, [isOpen, initialManualId]);

  if (!isOpen) return null;

  const q = searchTerm.trim().toLowerCase();
  const manualesFiltrados = q
    ? MANUALES_ZONDA_ERP.filter(
        (m) =>
          m.titulo.toLowerCase().includes(q) ||
          m.subtitulo.toLowerCase().includes(q) ||
          m.resumenEjecutivo.toLowerCase().includes(q) ||
          m.pasosOperativos.some(
            (p) => p.titulo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q)
          )
      )
    : MANUALES_ZONDA_ERP;

  const manualActivo: SeccionManual =
    MANUALES_ZONDA_ERP.find((m) => m.id === selectedId) || MANUALES_ZONDA_ERP[0];

  const handleImprimirManualActual = () => {
    const headers = ['Paso', 'Operación / Instructivo', 'Acción Clave en Sistema', 'Impacto Contable / Supabase'];
    const rows = manualActivo.pasosOperativos.map((p) => [
      `Paso ${p.numero}`,
      `${p.titulo}: ${p.descripcion}`,
      p.accionClave || '-',
      p.impactoContableODb || '-'
    ]);

    printFinancialReport(
      `${manualActivo.codigo} - ${manualActivo.titulo}`,
      `${manualActivo.subtitulo} | Tablas Supabase: ${manualActivo.tablasSupabase.join(', ')}`,
      headers,
      rows
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white border-2 border-slate-900 w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl rounded-lg overflow-hidden">
        {/* Cabecera */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Centro de Manuales Operativos e Instrucciones Técnicas — Zonda ERP
              </h2>
              <p className="text-[11px] text-slate-400">
                Guías paso a paso de cada módulo, contabilidad en partida doble, ARCA WSFEv1, Mercado Pago Webhooks y Supabase DB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImprimirManualActual}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 rounded transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Descargar PDF de este Manual</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo dividido: Sidebar de Manuales + Contenido Detallado */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Columna Izquierda: Índice de Manuales */}
          <div className="w-full md:w-80 bg-slate-50 border-r border-slate-300 flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar instrucción, módulo, CAE..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-900 rounded"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
              {manualesFiltrados.map((item) => {
                const isSelected = item.id === manualActivo.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left px-3.5 py-3 transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#064e3b] text-white'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded inline-block ${
                          isSelected
                            ? 'bg-emerald-900 text-emerald-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.codigo}
                      </span>
                      <p className="text-xs font-bold leading-snug mt-1">{item.titulo}</p>
                      <p
                        className={`text-[10px] line-clamp-1 ${
                          isSelected ? 'text-emerald-200' : 'text-slate-500'
                        }`}
                      >
                        {item.moduloRelacionado}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 mt-1 ${
                        isSelected ? 'text-emerald-300' : 'text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Contenido del Manual Seleccionado */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {/* Encabezado del Manual */}
            <div className="border-b border-slate-200 pb-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 bg-[#064e3b] text-white font-mono text-xs font-bold rounded">
                  {manualActivo.codigo} // MÓDULO: {manualActivo.moduloRelacionado.toUpperCase()}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-700" />
                  {manualActivo.tablasSupabase.map((tb) => (
                    <span
                      key={tb}
                      className="text-[10px] font-mono bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-semibold"
                    >
                      {tb}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">{manualActivo.titulo}</h3>
              <p className="text-xs text-slate-600">{manualActivo.subtitulo}</p>
            </div>

            {/* 1. Resumen Ejecutivo y Alcance */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Resumen Operativo y Alcance
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {manualActivo.resumenEjecutivo}
              </p>
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {manualActivo.funcionesPrincipales.map((fn, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{fn}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Instrucciones Paso a Paso */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>2. Instrucciones Paso a Paso</span>
              </h4>
              <div className="space-y-3">
                {manualActivo.pasosOperativos.map((paso) => (
                  <div
                    key={paso.numero}
                    className="border border-slate-300 rounded-lg p-4 bg-white shadow-sm space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#064e3b] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {paso.numero}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 uppercase">
                        {paso.titulo}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pl-8">
                      {paso.descripcion}
                    </p>
                    <div className="pl-8 pt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      {paso.accionClave && (
                        <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded">
                          <strong className="text-slate-900 block">Acción en Pantalla:</strong>
                          <span className="text-slate-700">{paso.accionClave}</span>
                        </div>
                      )}
                      {paso.impactoContableODb && (
                        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
                          <strong className="text-emerald-950 block">Impacto en Base de Datos / Contabilidad:</strong>
                          <span className="text-emerald-900">{paso.impactoContableODb}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Comandos o URLs Listas para Copiar (si aplica) */}
            {manualActivo.comandosOSnippets && manualActivo.comandosOSnippets.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#064e3b]" />
                  <span>3. URLs de Webhooks y Comandos Listos para Copiar</span>
                </h4>
                {manualActivo.comandosOSnippets.map((snip, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 text-slate-100 p-4 rounded-lg border border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">{snip.titulo}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(snip.codigo);
                          setCopiedIdx(idx);
                          setTimeout(() => setCopiedIdx(null), 2000);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1 border border-slate-600 rounded"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedIdx === idx ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 text-emerald-300 font-mono text-[11px] overflow-x-auto rounded border border-slate-800 select-all">
                      {snip.codigo}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Reglas de Negocio y Validaciones */}
            <div className="bg-amber-50/70 border border-amber-300 p-4 rounded-lg space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Reglas de Negocio y Controles de Auditoría</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-950 list-disc pl-5">
                {manualActivo.reglasDeNegocioYValidaciones.map((regla, idx) => (
                  <li key={idx}>{regla}</li>
                ))}
              </ul>
            </div>

            {/* 5. Preguntas Frecuentes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#064e3b]" />
                <span>Preguntas Frecuentes (FAQ)</span>
              </h4>
              <div className="space-y-2">
                {manualActivo.preguntasFrecuentes.map((faq, idx) => (
                  <div key={idx} className="border border-slate-200 p-3.5 rounded-lg bg-slate-50">
                    <p className="text-xs font-bold text-slate-900">{faq.pregunta}</p>
                    <p className="text-xs text-slate-700 mt-1">{faq.respuesta}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="bg-slate-50 border-t border-slate-300 px-5 py-3 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span>
            Documentación también disponible en la carpeta <code>docs/manuales/</code> y en{' '}
            <code>MANUAL_INTEGRAL_ZONDA_ERP.md</code>.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
          >
            Cerrar Manuales
          </button>
        </div>
      </div>
    </div>
  );
};
