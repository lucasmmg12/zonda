import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  BarChart3,
  Upload,
  ArrowUpDown,
  Boxes,
  X,
  Tag,
  Warehouse,
  CheckCircle2,
  Download
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import { exportToExcelCsv, printFinancialReport } from '../../utils/exportUtils';

export const InventarioModule: React.FC = () => {
  const {
    inventario,
    crearArticuloInventario,
    actualizarPreciosInventario,
    registrarMovimientoStock,
    refreshAllFromDb
  } = useErp();

  const [articuloSeleccionadoId, setArticuloSeleccionadoId] = useState<string | null>('INV-001');
  const [search, setSearch] = useState('');

  // Pestañas principales superiores
  const [tabPrincipal, setTabPrincipal] = useState<'items' | 'configuracion' | 'listas'>('items');

  // Pestañas de detalle (Panel derecho)
  const [tabDetalle, setTabDetalle] = useState<'movimientos' | 'general'>('movimientos');

  // Escuchar selección directa desde el Buscador Global del Header
  useEffect(() => {
    const applySearchTarget = (target: any) => {
      if (!target || target.modulo !== 'inventario') return;
      if (target.entityId && inventario.some((i) => i.id === target.entityId)) {
        setTabPrincipal('items');
        setArticuloSeleccionadoId(target.entityId);
        setSearch('');
        setTabDetalle('movimientos');
      } else if (target.queryHint) {
        setTabPrincipal('items');
        setSearch(target.queryHint);
      }
      try {
        sessionStorage.removeItem('zonda_global_search_target');
      } catch {
        // ignore
      }
    };

    try {
      const stored = sessionStorage.getItem('zonda_global_search_target');
      if (stored) applySearchTarget(JSON.parse(stored));
    } catch {
      // ignore
    }

    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      applySearchTarget(custom.detail);
    };
    window.addEventListener('zonda_global_search_select', handler);
    return () => window.removeEventListener('zonda_global_search_select', handler);
  }, [inventario]);

  // Modales
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showMovimientoStockModal, setShowMovimientoStockModal] = useState(false);
  const [showPreciosModal, setShowPreciosModal] = useState(false);
  const [showReportesModal, setShowReportesModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);

  // Formulario Nuevo Artículo
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('P');
  const [nuevaUm, setNuevaUm] = useState('1');
  const [nuevoPrecioVenta, setNuevoPrecioVenta] = useState(1000);
  const [nuevoCosto, setNuevoCosto] = useState(800);
  const [nuevoStock, setNuevoStock] = useState(10);

  // Formulario Movimiento de Stock
  const [tipoMovStock, setTipoMovStock] = useState<'REM' | 'FAC' | 'AJU'>('REM');
  const [descMovStock, setDescMovStock] = useState('');
  const [cantMovStock, setCantMovStock] = useState(5);

  // Formulario Ajuste Precios
  const [porcentajeAumento, setPorcentajeAumento] = useState(15);

  // Configuración de Inventario
  const [metodoValuacion, setMetodoValuacion] = useState('Costo Promedio Ponderado (CPP)');
  const [depositoPredeterminado, setDepositoPredeterminado] = useState('Depósito Central San Juan');
  const [permitirStockNegativo, setPermitirStockNegativo] = useState(true);
  const [configGuardada, setConfigGuardada] = useState(false);

  // Listas de precios
  const [coefListaMinorista, setCoefListaMinorista] = useState(1.25);
  const [coefListaCorporativa, setCoefListaCorporativa] = useState(1.0);
  const [coefListaMayorista, setCoefListaMayorista] = useState(0.92);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtrado de artículos
  const articulosFiltrados = inventario.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.codigo.toLowerCase().includes(q) ||
      a.descripcion.toLowerCase().includes(q) ||
      a.categoria.toLowerCase().includes(q)
    );
  });

  const articuloActivo =
    inventario.find((a) => a.id === articuloSeleccionadoId) || articulosFiltrados[0];

  // Manejo de creación de artículo en Supabase
  const handleCrearArticulo = async (e: React.FormEvent) => {
    e.preventDefault();
    const creado = await crearArticuloInventario({
      codigo: nuevoCodigo || `00000${inventario.length + 1}`,
      descripcion: nuevaDescripcion.toUpperCase(),
      tipo: nuevoTipo,
      um: nuevaUm,
      categoria: 'Materiales Generales',
      precioVentaNeto: nuevoPrecioVenta,
      costoCalculado: nuevoCosto,
      stockInicial: nuevoStock,
      deposito: depositoPredeterminado
    });

    setArticuloSeleccionadoId(creado.id);
    setShowAgregarModal(false);
    setNuevoCodigo('');
    setNuevaDescripcion('');
  };

  // Registrar movimiento de stock en Supabase
  const handleRegistrarMovimientoStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articuloActivo) return;

    await registrarMovimientoStock({
      articuloId: articuloActivo.id,
      tipoDoc: tipoMovStock,
      descripcion: descMovStock || 'Ajuste / Remito de Stock',
      cantidad: cantMovStock,
      precio: articuloActivo.costoCalculado,
      deposito: articuloActivo.deposito
    });

    setShowMovimientoStockModal(false);
    setDescMovStock('');
  };

  // Manejo de actualización porcentual de precios en Supabase
  const handleActualizarPrecios = async (e: React.FormEvent) => {
    e.preventDefault();
    await actualizarPreciosInventario(porcentajeAumento);
    setShowPreciosModal(false);
  };

  // Importación CSV de Artículos
  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[;,]/).map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols[0] && cols[1]) {
        await crearArticuloInventario({
          codigo: cols[0],
          descripcion: cols[1],
          tipo: 'P',
          um: '1',
          precioVentaNeto: parseFloat(cols[2]) || 1500,
          costoCalculado: parseFloat(cols[3]) || 1000,
          stockInicial: parseFloat(cols[4]) || 10
        });
      }
    }
    e.target.value = '';
  };

  // Exportar Artículos a Excel
  const handleExportarInventarioExcel = () => {
    exportToExcelCsv(
      'Catalogo_Inventario_Stock',
      articulosFiltrados.map((a) => ({
        Codigo: a.codigo,
        Descripcion: a.descripcion,
        Tipo: a.tipo,
        UM: a.um,
        Categoria: a.categoria,
        PrecioVentaNeto: a.precioVentaNeto,
        CostoCalculado: a.costoCalculado,
        Disponible: a.disponible,
        Deposito: a.deposito
      }))
    );
  };

  // Exportar Valuación de Inventario en PDF
  const handleDescargarValuacionPdf = () => {
    const valuacionTotal = inventario.reduce(
      (acc, a) => acc + Math.max(0, a.disponible) * a.costoCalculado,
      0
    );
    printFinancialReport(
      'EXISTENCIAS FÍSICAS Y VALUACIÓN CONTABLE DE INVENTARIO',
      `Método: ${metodoValuacion} | Valuación Total Activos de Cambio: $${valuacionTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      ['Código', 'Descripción', 'Depósito', 'Disponible', 'Costo Unit. ($)', 'Precio Venta ($)'],
      inventario.map((a) => [
        a.codigo,
        a.descripcion,
        a.deposito,
        a.disponible.toFixed(2),
        `$${a.costoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        `$${a.precioVentaNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
      ])
    );
    setShowReportesModal(false);
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleImportCsv}
      />

      {/* 1. BARRA SUPERIOR DE ENCABEZADO Y LLAMADA AL CALENDARIO */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
            Inventario
          </h1>
          <span className="text-xs text-slate-400 font-mono">| CONTROL MULTIDEPÓSITO Y LISTAS DE PRECIOS</span>
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
        {[
          { key: 'items', label: 'Items de inventario' },
          { key: 'configuracion', label: 'Configuración de inventario' },
          { key: 'listas', label: 'Listas de precios' }
        ].map((tab) => {
          const isActive = tabPrincipal === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabPrincipal(tab.key as 'items' | 'configuracion' | 'listas')}
              className={`px-4 py-2 text-xs font-mono font-bold transition-all border-t-2 ${
                isActive
                  ? 'bg-white border-t-[#064e3b] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
                  : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. VISTA PRINCIPAL: SPLIT-SCREEN MASTER-DETAIL (ITEMS DE INVENTARIO) */}
      {tabPrincipal === 'items' && (
        <div className="flex flex-col lg:flex-row min-h-[640px] bg-white border border-slate-300 border-t-0">
          {/* PANEL IZQUIERDO: LISTADO DE ITEMS DE INVENTARIO (MASTER) */}
          <div className="w-full lg:w-1/2 border-r border-slate-300 bg-white flex flex-col justify-between">
            <div>
              {/* Barra superior de búsqueda y acciones del panel izquierdo */}
              <div className="p-2 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por código o descripción"
                  className="px-2.5 py-1.5 bg-white border border-slate-300 text-xs font-mono flex-1 min-w-[180px] focus:outline-none focus:border-[#064e3b]"
                />

                <button
                  onClick={() => setShowPreciosModal(true)}
                  className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#064e3b]"
                >
                  <span>Actualizar precios ▼</span>
                </button>

                <button
                  onClick={() => setShowReportesModal(true)}
                  className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#064e3b]"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Reportes ▼</span>
                </button>
              </div>

              {/* Sub-cabecera de la tabla */}
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                <span>Listado de items de inventario ({articulosFiltrados.length} registrados)</span>
                <button
                  onClick={handleExportarInventarioExcel}
                  title="Exportar a Excel (CSV)"
                  className="p-0.5 hover:bg-slate-200 text-emerald-700 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-[10px]">Excel</span>
                </button>
              </div>

              {/* Grilla de Artículos */}
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="py-2 px-2.5 border-r border-slate-200">Código</th>
                      <th className="py-2 px-2.5 border-r border-slate-200">Descripción</th>
                      <th className="py-2 px-2 border-r border-slate-200 text-center">Tipo</th>
                      <th className="py-2 px-2 border-r border-slate-200 text-center">UM</th>
                      <th className="py-2 px-2.5 border-r border-slate-200 text-right">P. Venta</th>
                      <th className="py-2 px-2.5 border-r border-slate-200 text-right">Cto. Calculado</th>
                      <th className="py-2 px-2.5 text-right">Disponible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {articulosFiltrados.map((art) => {
                      const isSelected = articuloActivo?.id === art.id;
                      return (
                        <tr
                          key={art.id}
                          onClick={() => setArticuloSeleccionadoId(art.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#ecfdf5] font-semibold text-slate-900 border-l-4 border-l-[#064e3b]'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <td className="py-2 px-2.5 border-r border-slate-200 font-bold text-slate-900">
                            {art.codigo}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-200 truncate max-w-[200px]" title={art.descripcion}>
                            {art.descripcion}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center text-slate-600">
                            {art.tipo}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center text-slate-600">
                            {art.um}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-200 text-right">
                            {art.precioVentaNeto.toLocaleString('es-AR', {
                              minimumFractionDigits: art.precioVentaNeto % 1 === 0 ? 2 : 3
                            })}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-200 text-right text-slate-600">
                            {art.costoCalculado.toLocaleString('es-AR', {
                              minimumFractionDigits: art.costoCalculado % 1 === 0 ? 2 : 3
                            })}
                          </td>
                          <td className={`py-2 px-2.5 text-right font-bold ${art.disponible < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                            {art.disponible.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación del Panel Izquierdo */}
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
              <span>Mostrando 1 - {articulosFiltrados.length} de {articulosFiltrados.length}</span>
            </div>
          </div>

          {/* PANEL DERECHO: DETALLE Y MOVIMIENTOS DEL ITEM SELECCIONADO */}
          <div className="w-full lg:w-1/2 flex flex-col justify-between bg-white min-w-0">
            <div>
              {/* Sub-Pestañas del Detalle */}
              <div className="bg-slate-50 border-b border-slate-300 px-3 pt-1 flex items-center gap-1 text-xs font-mono">
                {[
                  { key: 'movimientos', label: 'Movimientos' },
                  { key: 'general', label: 'Información general' }
                ].map((t) => {
                  const isActive = tabDetalle === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTabDetalle(t.key as 'movimientos' | 'general')}
                      className={`px-3 py-1.5 font-bold transition-colors border-t-2 ${
                        isActive
                          ? 'bg-white border-t-[#064e3b] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
                          : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Título de la Grilla de Movimientos */}
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-4 py-2 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">
                  {articuloActivo
                    ? `Movimientos: ${articuloActivo.codigo} - ${articuloActivo.descripcion}`
                    : 'Movimientos de inventario del item'}
                </span>
                {articuloActivo && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-300 text-slate-700 font-bold">
                    Stock Disponible: {articuloActivo.disponible.toFixed(2)} {articuloActivo.unidadMedida}
                  </span>
                )}
              </div>

              {/* TAB 1: MOVIMIENTOS DE INVENTARIO */}
              {tabDetalle === 'movimientos' && (
                <div>
                  <div className="overflow-x-auto min-h-[380px]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                          <th className="py-2 px-3 border-r border-slate-200">Fecha</th>
                          <th className="py-2 px-3 border-r border-slate-200">Depósito</th>
                          <th className="py-2 px-3 border-r border-slate-200">Descripción</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-center">TipoDoc</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Precio</th>
                          <th className="py-2 px-3 text-right">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {articuloActivo && articuloActivo.movimientos && articuloActivo.movimientos.length > 0 ? (
                          articuloActivo.movimientos.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 border-r border-slate-200">{m.fecha}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{m.deposito}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-800 truncate max-w-xs">{m.descripcion}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-700">{m.tipoDoc}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right">
                                ${m.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className={`py-2 px-3 text-right font-bold ${m.cantidad < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {m.cantidad > 0 ? `+${m.cantidad.toFixed(2)}` : m.cantidad.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          Array.from({ length: 9 }).map((_, idx) => (
                            <tr key={idx} className="h-8 border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="border-r border-slate-100 px-3">&nbsp;</td>
                              <td className="border-r border-slate-100 px-3"></td>
                              <td className="border-r border-slate-100 px-3"></td>
                              <td className="border-r border-slate-100 px-3"></td>
                              <td className="border-r border-slate-100 px-3"></td>
                              <td className="px-3"></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación de la Grilla de Movimientos */}
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
                      {articuloActivo && articuloActivo.movimientos && articuloActivo.movimientos.length > 0
                        ? `Mostrando 1 - ${articuloActivo.movimientos.length} de ${articuloActivo.movimientos.length}`
                        : 'Sin movimientos'}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: INFORMACIÓN GENERAL */}
              {tabDetalle === 'general' && (
                <div className="p-6 max-w-xl space-y-4 font-mono text-xs">
                  {articuloActivo ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Código / SKU:</span>
                          <p className="font-bold text-slate-900 mt-1">{articuloActivo.codigo}</p>
                        </div>
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Categoría:</span>
                          <p className="font-bold text-slate-900 mt-1">{articuloActivo.categoria}</p>
                        </div>
                      </div>

                      <div className="border border-slate-200 p-3 bg-slate-50">
                        <span className="text-slate-500 text-[10px] block">Descripción Oficial:</span>
                        <p className="font-bold text-slate-900 mt-1">{articuloActivo.descripcion}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Precio Venta Neto:</span>
                          <p className="font-bold text-slate-900 mt-1">
                            ${articuloActivo.precioVentaNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Costo Calculado:</span>
                          <p className="font-bold text-slate-900 mt-1">
                            ${articuloActivo.costoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Alícuota IVA:</span>
                          <p className="font-bold text-slate-900 mt-1">{articuloActivo.alicuotaIva}%</p>
                        </div>
                      </div>

                      <div className="border border-slate-200 p-3 bg-slate-50">
                        <span className="text-slate-500 text-[10px] block">Depósito Físico Asignado:</span>
                        <p className="font-bold text-slate-900 mt-1">{articuloActivo.deposito}</p>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      Seleccione un artículo del listado izquierdo para consultar su ficha técnica.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BOTONERA INFERIOR (Agregar item, Registrar Movimiento Stock, Importar items) */}
            <div className="bg-[#ecfdf5]/30 border-t border-slate-300 px-4 py-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAgregarModal(true)}
                className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Agregar Item ▼</span>
              </button>

              <button
                onClick={() => setShowMovimientoStockModal(true)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold border border-emerald-700 flex items-center gap-1.5 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Movimiento de Stock</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CONFIGURACIÓN DE INVENTARIO */}
      {tabPrincipal === 'configuracion' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-[#064e3b]" />
                <span>CONFIGURACIÓN DE DEPÓSITOS Y VALUACIÓN CONTABLE</span>
              </h3>
              <p className="text-slate-500 mt-0.5">Parámetros operativos de inventario y costeo de mercaderías</p>
            </div>
            {configGuardada && (
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Configuración guardada
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="border border-slate-300 p-4 bg-slate-50 space-y-4">
              <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                Criterio de Valuación y Costeo
              </h4>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Método de Valuación de Existencias:</label>
                <select
                  value={metodoValuacion}
                  onChange={(e) => setMetodoValuacion(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300"
                >
                  <option value="Costo Promedio Ponderado (CPP)">Costo Promedio Ponderado (CPP)</option>
                  <option value="PEPS / FIFO (Primero Entrado, Primero Salido)">PEPS / FIFO (Primero Entrado, Primero Salido)</option>
                  <option value="Costo de Última Compra">Costo de Reposición / Última Compra</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Depósito Operativo Predeterminado:</label>
                <select
                  value={depositoPredeterminado}
                  onChange={(e) => setDepositoPredeterminado(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300"
                >
                  <option value="Depósito Central San Juan">Depósito Central San Juan (Ruta 40)</option>
                  <option value="Obrador Zonda - Acueducto">Obrador Zonda - Acueducto</option>
                  <option value="Pañol Móvil Equipos">Pañol Móvil Equipos</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={permitirStockNegativo}
                  onChange={(e) => setPermitirStockNegativo(e.target.checked)}
                  className="accent-[#064e3b] w-4 h-4"
                />
                <span className="font-bold text-slate-800">Permitir facturación y remitos con stock negativo (Pendiente de ingreso)</span>
              </label>
            </div>

            <div className="border border-slate-300 p-4 bg-slate-50 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                Depósitos Físicos Habilitados
              </h4>
              <div className="space-y-2">
                {[
                  { cod: 'DEP-01', nom: 'Depósito Central San Juan', resp: 'Ing. Roberto Quiroga', estado: 'Activo' },
                  { cod: 'DEP-02', nom: 'Obrador Zonda - Acueducto', resp: 'Capataz M. Marinero', estado: 'Activo' },
                  { cod: 'DEP-03', nom: 'Pañol Móvil Equipos', resp: 'Logística HORMISUR', estado: 'Activo' }
                ].map((d) => (
                  <div key={d.cod} className="p-2.5 bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{d.cod} // {d.nom}</span>
                      <span className="text-[11px] text-slate-500">Responsable: {d.resp}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                      {d.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setConfigGuardada(true);
                setTimeout(() => setConfigGuardada(false), 2500);
              }}
              className="px-5 py-2 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase"
            >
              Guardar Configuración de Inventario
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: LISTAS DE PRECIOS */}
      {tabPrincipal === 'listas' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 space-y-6 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#064e3b]" />
                <span>LISTAS DE PRECIOS DIFERENCIADAS EN VIVO</span>
              </h3>
              <p className="text-slate-500 mt-0.5">Cálculo automático según coeficientes comerciales sobre Precio Base</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreciosModal(true)}
                className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold"
              >
                Ajuste Masivo %
              </button>
              <button
                onClick={() =>
                  exportToExcelCsv(
                    'Listas_De_Precios_Comparativa',
                    inventario.map((a) => ({
                      Codigo: a.codigo,
                      Descripcion: a.descripcion,
                      CostoBase: a.costoCalculado,
                      ListaCorporativaObras: Number((a.precioVentaNeto * coefListaCorporativa).toFixed(2)),
                      ListaMinoristaPublico: Number((a.precioVentaNeto * coefListaMinorista).toFixed(2)),
                      ListaMayorista: Number((a.precioVentaNeto * coefListaMayorista).toFixed(2))
                    }))
                  )
                }
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Listas Excel</span>
              </button>
            </div>
          </div>

          {/* Coeficientes de listas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 border border-slate-300 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">LISTA 1: CORPORATIVA OBRAS (BASE)</span>
                <span className="text-[10px] text-slate-500">Coeficiente multiplicador:</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={coefListaCorporativa}
                onChange={(e) => setCoefListaCorporativa(Number(e.target.value) || 1)}
                className="w-20 px-2 py-1 bg-white border border-slate-300 text-right font-bold"
              />
            </div>

            <div className="p-3 border border-slate-300 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">LISTA 2: MINORISTA MOSTRADOR (+25%)</span>
                <span className="text-[10px] text-slate-500">Coeficiente multiplicador:</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={coefListaMinorista}
                onChange={(e) => setCoefListaMinorista(Number(e.target.value) || 1)}
                className="w-20 px-2 py-1 bg-white border border-slate-300 text-right font-bold"
              />
            </div>

            <div className="p-3 border border-slate-300 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">LISTA 3: MAYORISTA GREMIO (-8%)</span>
                <span className="text-[10px] text-slate-500">Coeficiente multiplicador:</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={coefListaMayorista}
                onChange={(e) => setCoefListaMayorista(Number(e.target.value) || 1)}
                className="w-20 px-2 py-1 bg-white border border-slate-300 text-right font-bold"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                  <th className="py-2 px-3 border-r border-slate-200">Código</th>
                  <th className="py-2 px-3 border-r border-slate-200">Descripción del Artículo</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-right">Costo Calc.</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-right bg-[#ecfdf5]/50">Lista 1: Corporativa</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-right">Lista 2: Minorista</th>
                  <th className="py-2 px-3 text-right">Lista 3: Mayorista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inventario.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 border-r border-slate-200 font-bold">{art.codigo}</td>
                    <td className="py-2 px-3 border-r border-slate-200">{art.descripcion}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-500">
                      ${art.costoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-[#064e3b] bg-[#ecfdf5]/20">
                      ${(art.precioVentaNeto * coefListaCorporativa).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-slate-900">
                      ${(art.precioVentaNeto * coefListaMinorista).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                      ${(art.precioVentaNeto * coefListaMayorista).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR ARTÍCULO */}
      {showAgregarModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-lg shadow-2xl">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>AGREGAR ITEM DE INVENTARIO (SUPABASE DB)</span>
              <button onClick={() => setShowAgregarModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCrearArticulo} className="p-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1">Código del Item:</label>
                  <input
                    type="text"
                    required
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value)}
                    placeholder="ej: 000007"
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1">Tipo / Unidad Medida:</label>
                  <div className="flex gap-2">
                    <select
                      value={nuevoTipo}
                      onChange={(e) => setNuevoTipo(e.target.value)}
                      className="w-1/2 px-2 py-1.5 border border-slate-300 bg-white text-xs"
                    >
                      <option value="P">Producto (P)</option>
                      <option value="S">Servicio (S)</option>
                    </select>
                    <input
                      type="text"
                      value={nuevaUm}
                      onChange={(e) => setNuevaUm(e.target.value)}
                      placeholder="UM: 1"
                      className="w-1/2 px-2 py-1.5 border border-slate-300 text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-600 block text-[11px] mb-1">Descripción:</label>
                <input
                  type="text"
                  required
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="ej: VALVULA ESFERICA PEAD 63MM"
                  className="w-full px-2 py-1.5 border border-slate-300 text-xs uppercase focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1">P. Venta ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoPrecioVenta}
                    onChange={(e) => setNuevoPrecioVenta(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1">Costo Calc. ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoCosto}
                    onChange={(e) => setNuevoCosto(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1">Stock Inicial:</label>
                  <input
                    type="number"
                    value={nuevoStock}
                    onChange={(e) => setNuevoStock(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAgregarModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] text-white hover:bg-[#047857] font-bold"
                >
                  Guardar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR MOVIMIENTO DE STOCK */}
      {showMovimientoStockModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-emerald-700 w-full max-w-md shadow-2xl">
            <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>MOVIMIENTO DE STOCK // {articuloActivo?.codigo}</span>
              <button onClick={() => setShowMovimientoStockModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleRegistrarMovimientoStock} className="p-4 space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-600 font-bold block text-[11px] mb-1">Tipo de Comprobante:</label>
                <select
                  value={tipoMovStock}
                  onChange={(e) => setTipoMovStock(e.target.value as 'REM' | 'FAC' | 'AJU')}
                  className="w-full px-2 py-1.5 border border-slate-300 bg-slate-50"
                >
                  <option value="REM">REM - Remito de Ingreso / Egreso de Obra</option>
                  <option value="AJU">AJU - Ajuste de Inventario Físico</option>
                  <option value="FAC">FAC - Descuento por Facturación</option>
                </select>
              </div>
              <div>
                <label className="text-slate-600 font-bold block text-[11px] mb-1">
                  Cantidad (+ para ingreso, - para egreso):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cantMovStock}
                  onChange={(e) => setCantMovStock(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-bold block text-[11px] mb-1">Descripción / Destino:</label>
                <input
                  type="text"
                  required
                  value={descMovStock}
                  onChange={(e) => setDescMovStock(e.target.value)}
                  placeholder="Ej: Ingreso por Compra Remito #0042"
                  className="w-full px-2 py-1.5 border border-slate-300"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMovimientoStockModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-700 text-white font-bold">
                  Registrar en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACTUALIZAR PRECIOS */}
      {showPreciosModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-md shadow-2xl">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>ACTUALIZAR PRECIOS DE VENTA Y COSTOS (SUPABASE DB)</span>
              <button onClick={() => setShowPreciosModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleActualizarPrecios} className="p-4 space-y-3 font-mono text-xs">
              <p className="text-slate-600 text-[11px]">
                Ajuste porcentual masivo sobre toda la lista de precios de inventario:
              </p>
              <div>
                <label className="text-slate-700 block text-[11px] font-bold mb-1">Porcentaje de Variación (%):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={porcentajeAumento}
                    onChange={(e) => setPorcentajeAumento(Number(e.target.value))}
                    className="w-24 px-2 py-1.5 border border-slate-300 text-center font-bold text-sm focus:outline-none focus:border-[#064e3b]"
                  />
                  <span className="text-slate-500">% sobre precio actual</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPreciosModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] text-white hover:bg-[#047857] font-bold"
                >
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPORTES DE INVENTARIO */}
      {showReportesModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-lg shadow-2xl">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>REPORTES DE INVENTARIO Y STOCK</span>
              <button onClick={() => setShowReportesModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2 font-mono text-xs">
              <button
                onClick={handleDescargarValuacionPdf}
                className="w-full text-left p-3 border border-slate-200 hover:bg-[#ecfdf5] transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">1. Existencias Físicas y Valuación Contable (PDF)</p>
                  <p className="text-[11px] text-slate-500">Listado de unidades disponibles valuadas a costo calculado y precio venta neto.</p>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
              </button>

              <button
                onClick={() => {
                  handleExportarInventarioExcel();
                  setShowReportesModal(false);
                }}
                className="w-full text-left p-3 border border-slate-200 hover:bg-[#ecfdf5] transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">2. Exportar Padrón Completo de Artículos y Stock (Excel CSV)</p>
                  <p className="text-[11px] text-slate-500">Descarga inmediata de todos los SKUs, costos y disponibilidades.</p>
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
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-md shadow-2xl">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>CALENDARIO DE VENCIMIENTOS - INVENTARIO</span>
              <button onClick={() => setShowCalendarioModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs text-slate-700">
              <div className="border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Toma de Inventario Mensual</span>
                  <span className="text-[11px] text-slate-500">Cierre de mes: 31 de Octubre de 2026</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px]">
                  En 4 días
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
