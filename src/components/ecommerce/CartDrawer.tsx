import React from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { EcommerceCartItem } from '../../types/ecommerce';

interface Props {
  isOpen: boolean;
  items: EcommerceCartItem[];
  colorPrimario: string;
  onClose: () => void;
  onUpdateQty: (cartKey: string, qty: number) => void;
  onRemove: (cartKey: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  items,
  colorPrimario,
  onClose,
  onUpdateQty,
  onRemove,
  onCheckout
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: colorPrimario }} />
            <h3 className="font-bold text-slate-900 text-sm">Tu Carrito ({items.reduce((a, i) => a + i.cantidad, 0)})</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Tu carrito está vacío</p>
              <p className="text-xs">Explorá el catálogo y elegí tus productos o variantes.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartKey} className="border border-slate-200 rounded-xl p-3 flex gap-3 bg-white">
                <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">{item.sku.slice(0, 6)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.nombre}</p>
                      {item.varianteNombre && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.varianteNombre}
                        </span>
                      )}
                    </div>
                    <button onClick={() => onRemove(item.cartKey)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center border border-slate-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartKey, item.cantidad - 1)}
                        className="px-2 py-1 hover:bg-slate-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-mono font-bold">{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartKey, Math.min(item.stockDisponible, item.cantidad + 1))}
                        className="px-2 py-1 hover:bg-slate-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-slate-900">
                      ${(item.precioUnitario * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span>Subtotal</span>
              <span className="font-mono text-base">
                ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              style={{ backgroundColor: colorPrimario }}
              className="w-full py-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              <span>Iniciar Compra (Google Auth + Pago)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
