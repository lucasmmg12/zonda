import React, { useState } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  Plus,
  BarChart3,
  Upload,
  ArrowUpDown,
  Boxes,
  X,
  Tag,
  Warehouse,
  CheckCircle2
} from 'lucide-react';
import { ArticuloInventario, MovimientoInventario } from '../../types/models';
import { mockInventario } from '../../services/mockData';

export const InventarioModule: React.FC = () => {
  // Lista de artículos
  const [articulos, setArticulos] = useState<ArticuloInventario[]>(mockInventario);
  const [articuloSeleccionadoId, setArticuloSeleccionadoId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Pestañas principales superiores
  const [tabPrincipal, setTabPrincipal] = useState<'items' | 'configuracion' | 'listas'>('items');

  // Pestañas de detalle (Panel derecho)
  const [tabDetalle, setTabDetalle] = useState<'movimientos' | 'general'>('movimientos');

  // Modales
  const [showAgregarModal, setShowAgregarModal] = useState(false);
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

  // Formulario Ajuste Precios
  const [porcentajeAumento, setPorcentajeAumento] = useState(15);

  // Filtrado de artículos
  const articulosFiltrados = articulos.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.codigo.toLowerCase().includes(q) ||
      a.descripcion.toLowerCase().includes(q) ||
      a.categoria.toLowerCase().includes(q)
    );
  });

  const articuloActivo = articuloSeleccionadoId
    ? articulos.find((a) => a.id === articuloSeleccionadoId)
    : undefined;

  // Manejo de creación de artículo
  const handleCrearArticulo = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo: ArticuloInventario = {
      id: `INV-${Date.now()}`,
      codigo: nuevoCodigo || `00000${articulos.length + 1}`,
      sku: nuevoCodigo || `00000${articulos.length + 1}`,
      descripcion: nuevaDescripcion.toUpperCase(),
      tipo: nuevoTipo,
      um: nuevaUm,
      categoria: 'Materiales Generales',
      unidadMedida: 'Unidad',
      disponible: nuevoStock,
      stockActual: nuevoStock,
      stockMinimo: 1,
      costoCalculado: nuevoCosto,
      precioVentaNeto: nuevoPrecioVenta,
      alicuotaIva: 21,
      deposito: 'Depósito Central San Juan',
      movimientos: [
        {
          id: `MOV-INV-${Date.now()}`,
          fecha: new Date().toISOString().split('T')[0],
          deposito: 'Depósito Central',
          descripcion: 'Alta de Stock Inicial de Artículo',
          tipoDoc: 'INI',
          precio: nuevoCosto,
          cantidad: nuevoStock
        }
      ]
    };

    setArticulos([...articulos, nuevo]);
    setArticuloSeleccionadoId(nuevo.id);
    setShowAgregarModal(false);
    setNuevoCodigo('');
    setNuevaDescripcion('');
  };

  // Manejo de actualización porcentual de precios
  const handleActualizarPrecios = (e: React.FormEvent) => {
    e.preventDefault();
    const factor = 1 + porcentajeAumento / 100;
    setArticulos((prev) =>
      prev.map((a) => ({
        ...a,
        precioVentaNeto: Number((a.precioVentaNeto * factor).toFixed(2)),
        costoCalculado: Number((a.costoCalculado * factor).toFixed(2))
      }))
    );
    setShowPreciosModal(false);
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
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
          className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#4c1d95]"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendario de vencimientos</span>
        </button>
      </div>

      {/* 2. PESTAÑAS PRINCIPALES DEL MÓDULO */}
      <div className="bg-[#ede9fe]/40 border-b border-slate-300 px-2 pt-1 flex items-center gap-1">
        {[
          { key: 'items', label: 'Items de inventario' },
          { key: 'configuracion', label: 'Configuración de inventario' },
          { key: 'listas', label: 'Listas de precios' }
        ].map((tab) => {
          const isActive = tabPrincipal === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabPrincipal(tab.key as any)}
              className={`px-4 py-2 text-xs font-mono font-bold transition-all border-t-2 ${
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

      {/* 3. VISTA PRINCIPAL: SPLIT-SCREEN MASTER-DETAIL */}
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
                  className="px-2.5 py-1.5 bg-white border border-slate-300 text-xs font-mono flex-1 min-w-[180px] focus:outline-none focus:border-[#4c1d95]"
                />

                <button
                  onClick={() => setShowPreciosModal(true)}
                  className="px-3 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#4c1d95]"
                >
                  <span>Actualizar precios ▼</span>
                </button>

                <button
                  onClick={() => setShowReportesModal(true)}
                  className="px-3 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#4c1d95]"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Reportes ▼</span>
                </button>
              </div>

              {/* Sub-cabecera de la tabla */}
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                <span>Listado de items de inventario (doble click para seleccionar)</span>
                <button title="Exportar a Excel" className="p-0.5 hover:bg-slate-200 text-emerald-700">
                  <FileSpreadsheet className="w-4 h-4" />
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
                              ? 'bg-[#ede9fe] font-semibold text-slate-900 border-l-4 border-l-[#4c1d95]'
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
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900">
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
                <button className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5 text-[#4c1d95]" /></button>
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
                      onClick={() => setTabDetalle(t.key as any)}
                      className={`px-3 py-1.5 font-bold transition-colors border-t-2 ${
                        isActive
                          ? 'bg-white border-t-[#4c1d95] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
                          : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Título de la Grilla de Movimientos */}
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-4 py-2 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">
                  {articuloActivo
                    ? `Movimientos de inventario: ${articuloActivo.codigo} - ${articuloActivo.descripcion}`
                    : 'Movimientos de inventario del item'}
                </span>
                {articuloActivo && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-300 text-slate-700">
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
                      <button className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5 text-[#4c1d95]" /></button>
                    </div>
                    <span>
                      {articuloActivo && articuloActivo.movimientos && articuloActivo.movimientos.length > 0
                        ? `Mostrando 1 - ${articuloActivo.movimientos.length} de ${articuloActivo.movimientos.length}`
                        : 'Sin datos para mostrar'}
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

            {/* BOTONERA INFERIOR (Agregar ▼, Importar items) */}
            <div className="bg-[#ede9fe]/30 border-t border-slate-300 px-4 py-2 flex items-center gap-2">
              <button
                onClick={() => setShowAgregarModal(true)}
                className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Agregar ▼</span>
              </button>

              <button
                onClick={() => alert('Asistente de importación masiva de artículos y stock en catálogo activo.')}
                className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar items</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR ARTÍCULO */}
      {showAgregarModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-lg shadow-2xl">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>AGREGAR ITEM DE INVENTARIO</span>
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
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
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
                  className="w-full px-2 py-1.5 border border-slate-300 text-xs uppercase focus:outline-none focus:border-[#4c1d95]"
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
                  className="px-4 py-1.5 bg-[#4c1d95] text-white hover:bg-[#3b0764] font-bold"
                >
                  Guardar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACTUALIZAR PRECIOS */}
      {showPreciosModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-md shadow-2xl">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>ACTUALIZAR PRECIOS DE VENTA Y COSTOS</span>
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
                    className="w-24 px-2 py-1.5 border border-slate-300 text-center font-bold text-sm focus:outline-none focus:border-[#4c1d95]"
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
                  className="px-4 py-1.5 bg-[#4c1d95] text-white hover:bg-[#3b0764] font-bold"
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
          <div className="bg-white border-2 border-[#4c1d95] w-full max-w-lg shadow-2xl">
            <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>REPORTES DE INVENTARIO Y STOCK</span>
              <button onClick={() => setShowReportesModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2 font-mono text-xs">
              <button
                onClick={() => { alert('Generando informe de Existencias Físicas y Valuación Contable...'); setShowReportesModal(false); }}
                className="w-full text-left p-3 border border-slate-200 hover:bg-[#ede9fe] transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">1. Existencias Físicas y Valuación Contable</p>
                  <p className="text-[11px] text-slate-500">Listado de unidades disponibles valuadas a costo calculado y precio venta neto.</p>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
              </button>

              <button
                onClick={() => { alert('Generando informe de Movimientos de Stock por Depósito...'); setShowReportesModal(false); }}
                className="w-full text-left p-3 border border-slate-200 hover:bg-[#ede9fe] transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">2. Libro Mayor de Movimientos por Depósito</p>
                  <p className="text-[11px] text-slate-500">Trazabilidad de remitos de ingreso, egreso y ajustes por roturas o mermas.</p>
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
