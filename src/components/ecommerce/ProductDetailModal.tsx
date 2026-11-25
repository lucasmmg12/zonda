import React, { useMemo, useState } from 'react';
import { Check, Minus, Package, Plus, ShoppingCart, Tag, X } from 'lucide-react';
import type { EcommerceCartItem, EcommerceProducto } from '../../types/ecommerce';
import { buildCartKey } from '../../services/ecommerceService';

interface Props {
  producto: EcommerceProducto | null;
  colorPrimario: string;
  onClose: () => void;
  onAddToCart: (item: EcommerceCartItem) => void;
}

export const ProductDetailModal: React.FC<Props> = ({ producto, colorPrimario, onClose, onAddToCart }) => {
  const [seleccion, setSeleccion] = useState<Record<string, string>>(() => {
    if (!producto || !producto.tieneVariantes) return {};
    const init: Record<string, string> = {};
    producto.atributos.forEach((a) => {
      if (a.valores[0]) init[a.nombre] = a.valores[0];
    });
    return init;
  });
  const [cantidad, setCantidad] = useState(1);

  const varianteActiva = useMemo(() => {
    if (!producto || !producto.tieneVariantes || producto.variantes.length === 0) return undefined;
    return (
      producto.variantes.find((v) =>
        Object.entries(seleccion).every(([k, val]) => v.combinacion[k] === val)
      ) || producto.variantes.find((v) => v.activa)
    );
  }, [producto, seleccion]);

  if (!producto) return null;

  const precioFinal = varianteActiva
    ? varianteActiva.precio
    : producto.enOferta && producto.precioOferta
    ? producto.precioOferta
    : producto.precioBase;

  const stockDisponible = varianteActiva ? varianteActiva.stock : producto.stockTotal;
  const skuMostrar = varianteActiva ? varianteActiva.sku : producto.sku;
  const imagenPrincipal = varianteActiva?.imagen || producto.imagenes[0];

  const handleAgregar = () => {
    if (stockDisponible <= 0) return;
    onAddToCart({
      cartKey: buildCartKey(producto.id, varianteActiva?.id),
      productoId: producto.id,
      articuloInventarioId: producto.articuloInventarioId,
      nombre: producto.nombre,
      sku: skuMostrar,
      varianteId: varianteActiva?.id,
      varianteNombre: varianteActiva?.nombre,
      precioUnitario: precioFinal,
      cantidad: Math.min(cantidad, stockDisponible),
      stockDisponible,
      imagen: imagenPrincipal
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Galería / Imagen */}
        <div className="bg-slate-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative min-h-[280px]">
          {producto.enOferta && (
            <span className="absolute top-4 left-4 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3" /> OFERTA
            </span>
          )}
          {imagenPrincipal ? (
            <img src={imagenPrincipal} alt={producto.nombre} className="max-h-72 object-contain rounded-xl" />
          ) : (
            <div className="w-40 h-40 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <Package className="w-12 h-12 mb-2 text-slate-300" />
              <span className="text-[11px] font-mono">{skuMostrar}</span>
            </div>
          )}
        </div>

        {/* Detalle y Selector de Variantes */}
        <div className="p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  {producto.marca || 'Catálogo Oficial'} · SKU {skuMostrar}
                </p>
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug mt-0.5">{producto.nombre}</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-black text-slate-900 font-mono">
                ${precioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              {!varianteActiva && producto.enOferta && producto.precioOferta && (
                <span className="text-sm text-slate-400 line-through font-mono">
                  ${producto.precioBase.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{producto.descripcionLarga || producto.descripcionCorta}</p>

            {/* Selectores de Atributos / Variantes */}
            {producto.tieneVariantes && producto.atributos.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {producto.atributos.map((attr) => (
                  <div key={attr.nombre}>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                      {attr.nombre}: <span className="text-slate-900">{seleccion[attr.nombre]}</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {attr.valores.map((val) => {
                        const active = seleccion[attr.nombre] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSeleccion((prev) => ({ ...prev, [attr.nombre]: val }))}
                            style={active ? { backgroundColor: colorPrimario, borderColor: colorPrimario } : undefined}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                              active
                                ? 'text-white shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                            }`}
                          >
                            {active && <Check className="w-3 h-3" />}
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs flex items-center justify-between pt-2">
              <span className={`font-semibold ${stockDisponible > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {stockDisponible > 0 ? `✓ Stock disponible: ${stockDisponible} u.` : 'Sin stock en esta variante'}
              </span>
              {varianteActiva && (
                <span className="text-[11px] text-slate-500 font-mono">Variante: {varianteActiva.nombre}</span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="px-2.5 py-2 hover:bg-slate-100 text-slate-700"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-2 text-xs font-bold font-mono">{cantidad}</span>
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.min(Math.max(1, stockDisponible), c + 1))}
                className="px-2.5 py-2 hover:bg-slate-100 text-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={stockDisponible <= 0}
              onClick={handleAgregar}
              style={{ backgroundColor: colorPrimario }}
              className="flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-40 transition-opacity"
            >
              <ShoppingCart className="w-4 h-4" />
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
