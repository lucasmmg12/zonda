import React, { useState } from 'react';
import {
  Calendar,
  HelpCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  Plus,
  DollarSign,
  UserPlus,
  Upload,
  Download,
  CheckCircle2,
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowUpDown,
  Send,
  X,
  FileDown
} from 'lucide-react';
import { Proveedor, FacturaAdeudadaProveedor } from '../../types/models';
import { mockProveedores } from '../../services/mockData';

export const ProveedoresModule: React.FC = () => {
  // Lista de proveedores
  const [proveedores, setProveedores] = useState<Proveedor[]>(mockProveedores);
  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState<string | null>(null); // Inicialmente sin selección, tal como en la captura
  const [filtroActivos, setFiltroActivos] = useState<'activos' | 'inactivos'>('activos');
  const [searchProveedor, setSearchProveedor] = useState('');
  const [panelIzquierdoColapsado, setPanelIzquierdoColapsado] = useState(false);

  // Pestañas principales superiores
  const [tabPrincipal, setTabPrincipal] = useState<'resumen' | 'gestion'>('gestion');

  // Pestañas de detalle del proveedor (Panel derecho)
  const [tabDetalle, setTabDetalle] = useState<'adeudadas' | 'cuenta' | 'general' | 'otra'>('adeudadas');

  // Modales
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);

  // Formulario Factura Compra
  const [tipoFactura, setTipoFactura] = useState('Factura A');
  const [netoFactura, setNetoFactura] = useState(300000);
  const [descFactura, setDescFactura] = useState('');

  // Formulario Pago
  const [montoPago, setMontoPago] = useState(150000);
  const [medioPago, setMedioPago] = useState('Transferencia Bancaria Santander');

  // Formulario Nuevo Proveedor
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCuit, setNuevoCuit] = useState('');
  const [nuevoDomicilio, setNuevoDomicilio] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoCondicionIva, setNuevoCondicionIva] = useState('Responsable Inscripto');

  // Filtrado de proveedores
  const proveedoresFiltrados = proveedores.filter((p) => {
    const coincideEstado = filtroActivos === 'activos' ? p.activo : !p.activo;
    const coincideTexto =
      p.nombre.toLowerCase().includes(searchProveedor.toLowerCase()) ||
      p.razonSocial.toLowerCase().includes(searchProveedor.toLowerCase()) ||
      p.cuit.includes(searchProveedor);
    return coincideEstado && coincideTexto;
  });

  const proveedorActivo = proveedorSeleccionadoId
    ? proveedores.find((p) => p.id === proveedorSeleccionadoId)
    : undefined;

  // Crear Factura Compra
  const handleCrearFactura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorActivo) return;

    const iva = netoFactura * 0.21;
    const total = netoFactura + iva;
    const nroFact = `0001-00000${Math.floor(100 + Math.random() * 900)}`;

    const nuevaFactura: FacturaAdeudadaProveedor = {
      id: `FAC-COMP-${Date.now()}`,
      nroComprobante: nroFact,
      tipo: tipoFactura,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      descripcion: descFactura || 'Provisión de insumos operativos',
      valorMe: 0,
      total,
      pagado: 0,
      saldo: total,
      saldoAcumulado: proveedorActivo.saldo + total
    };

    setProveedores((prev) =>
      prev.map((p) => {
        if (p.id === proveedorActivo.id) {
          return {
            ...p,
            saldo: p.saldo + total,
            facturasAdeudadas: [nuevaFactura, ...p.facturasAdeudadas],
            movimientos: [
              ...p.movimientos,
              {
                id: `MOV-P-${Date.now()}`,
                fecha: new Date().toISOString().split('T')[0],
                comprobante: `${tipoFactura} ${nroFact}`,
                concepto: descFactura || 'Carga de Comprobante de Compra',
                debe: 0,
                haber: total,
                saldo: p.saldo + total
              }
            ]
          };
        }
        return p;
      })
    );

    setShowFacturaModal(false);
    setDescFactura('');
  };

  // Agregar Pago
  const handleAgregarPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorActivo) return;

    setProveedores((prev) =>
      prev.map((p) => {
        if (p.id === proveedorActivo.id) {
          const nuevoSaldo = Math.max(0, p.saldo - montoPago);
          return {
            ...p,
            saldo: nuevoSaldo,
            movimientos: [
              ...p.movimientos,
              {
                id: `MOV-P-${Date.now()}`,
                fecha: new Date().toISOString().split('T')[0],
                comprobante: `OP 0001-00000${Math.floor(100 + Math.random() * 900)}`,
                concepto: `Orden de Pago mediante ${medioPago}`,
                debe: montoPago,
                haber: 0,
                saldo: nuevoSaldo
              }
            ]
          };
        }
        return p;
      })
    );

    setShowPagoModal(false);
  };

  // Alta de Proveedor
  const handleCrearNuevoProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo: Proveedor = {
      id: `PRV-00${proveedores.length + 1}`,
      nombre: nuevoNombre,
      razonSocial: nuevoNombre,
      cuit: nuevoCuit || '30-00000000-0',
      condicionIva: nuevoCondicionIva,
      domicilio: nuevoDomicilio || 'San Juan, Argentina',
      telefono: '+54 264 400-0000',
      email: nuevoEmail || 'contacto@proveedor.com',
      saldo: 0,
      activo: true,
      cuentaGastoHabitual: '5.1.01 Materiales e Insumos',
      condicionPago: 'Cuenta Corriente 30 Días',
      facturasAdeudadas: [],
      movimientos: []
    };

    setProveedores([nuevo, ...proveedores]);
    setProveedorSeleccionadoId(nuevo.id);
    setShowNuevoProveedorModal(false);
    setNuevoNombre('');
    setNuevoCuit('');
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      {/* 1. BARRA SUPERIOR DE ENCABEZADO Y LLAMADA AL CALENDARIO */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
            Proveedores
          </h1>
          <span className="text-xs text-slate-400 font-mono">| GESTIÓN DE COMPRAS Y ÓRDENES DE PAGO</span>
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
          { key: 'resumen', label: 'Resumen proveedores' },
          { key: 'gestion', label: 'Gestión de proveedores' }
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

      {/* 3. VISTA PRINCIPAL: SPLIT-SCREEN MASTER-DETAIL (GESTIÓN DE PROVEEDORES) */}
      {tabPrincipal === 'gestion' ? (
        <div className="flex flex-col lg:flex-row min-h-[640px] bg-white border border-slate-300 border-t-0">
          {/* PANEL IZQUIERDO: LISTA DE PROVEEDORES (MASTER) */}
          <div
            className={`border-r border-slate-300 bg-white flex flex-col justify-between transition-all duration-200 ${
              panelIzquierdoColapsado ? 'w-12 overflow-hidden' : 'w-full lg:w-80 shrink-0'
            }`}
          >
            <div>
              {/* Cabecera del Panel Izquierdo */}
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                {!panelIzquierdoColapsado && <span>Lista de proveedores</span>}
                <button
                  onClick={() => setPanelIzquierdoColapsado(!panelIzquierdoColapsado)}
                  title={panelIzquierdoColapsado ? 'Expandir lista' : 'Colapsar lista'}
                  className="p-1 hover:bg-slate-200 text-slate-600 transition-colors ml-auto"
                >
                  {panelIzquierdoColapsado ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
                </button>
              </div>

              {!panelIzquierdoColapsado && (
                <>
                  {/* Pestañas Activos / Inactivos */}
                  <div className="grid grid-cols-2 border-b border-slate-300 text-xs font-mono">
                    <button
                      onClick={() => setFiltroActivos('activos')}
                      className={`py-1.5 text-center font-bold transition-colors ${
                        filtroActivos === 'activos'
                          ? 'bg-white text-slate-900 border-b-2 border-b-[#4c1d95]'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Activos ({proveedores.filter((p) => p.activo).length})
                    </button>
                    <button
                      onClick={() => setFiltroActivos('inactivos')}
                      className={`py-1.5 text-center font-bold transition-colors ${
                        filtroActivos === 'inactivos'
                          ? 'bg-white text-slate-900 border-b-2 border-b-[#4c1d95]'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Inactivos ({proveedores.filter((p) => !p.activo).length})
                    </button>
                  </div>

                  {/* Buscador de Proveedor */}
                  <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-600 text-[11px] whitespace-nowrap">Buscar proveedor:</span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchProveedor}
                        onChange={(e) => setSearchProveedor(e.target.value)}
                        placeholder=""
                        className="w-full px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                      />
                    </div>
                    <button title="Ayuda de búsqueda" className="text-slate-400 hover:text-slate-600">
                      <HelpCircle className="w-4 h-4 text-[#4c1d95]" />
                    </button>
                  </div>

                  {/* Tabla de Proveedores */}
                  <div className="overflow-y-auto max-h-[460px]">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-mono font-bold text-slate-700">
                          <th className="py-2 px-2.5 border-r border-slate-200">Nombre</th>
                          <th className="py-2 px-2 border-r border-slate-200">Razón social</th>
                          <th className="py-2 px-2 text-right">Saldo ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {proveedoresFiltrados.map((prv) => {
                          const isSelected = proveedorActivo?.id === prv.id;
                          return (
                            <tr
                              key={prv.id}
                              onClick={() => setProveedorSeleccionadoId(prv.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#ede9fe] font-semibold text-slate-900 border-l-4 border-l-[#4c1d95]'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                              title="Haga click sobre proveedores para ver información y cuenta corriente"
                            >
                              <td className="py-2 px-2.5 border-r border-slate-200 truncate max-w-[100px]">
                                {prv.nombre}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-200 truncate max-w-[100px] text-slate-500 text-[11px]">
                                {prv.razonSocial}
                              </td>
                              <td className={`py-2 px-2 text-right font-mono font-bold whitespace-nowrap ${prv.saldo < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                                {prv.saldo !== 0
                                  ? prv.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })
                                  : '0,00'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Paginación del Panel Izquierdo */}
            {!panelIzquierdoColapsado && (
              <div className="bg-[#f8fafc] border-t border-slate-300 px-2 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-600">
                <div className="flex items-center gap-1">
                  <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                  <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <span>Página</span>
                  <input type="text" readOnly value="1" className="w-6 text-center border border-slate-300 bg-white py-0.5 text-[10px]" />
                  <span>de 1</span>
                  <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                  <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
                  <button className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5" /></button>
                </div>
                <span>Mostrando 1 - {proveedoresFiltrados.length} de {proveedoresFiltrados.length}</span>
              </div>
            )}
          </div>

          {/* PANEL DERECHO: DETALLE DEL PROVEEDOR SELECCIONADO */}
          <div className="flex-1 flex flex-col justify-between bg-white min-w-0">
            <div>
              {/* Título del Proveedor Seleccionado */}
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                    {proveedorActivo ? proveedorActivo.razonSocial : 'Seleccionar proveedor de la lista'}
                  </span>
                  {proveedorActivo && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-300 text-slate-700">
                      CUIT: {proveedorActivo.cuit} | {proveedorActivo.condicionIva}
                    </span>
                  )}
                </div>

                {proveedorActivo && (
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-500">Saldo por Pagar:</span>
                    <span className={`font-bold bg-white px-2 py-0.5 border border-slate-300 ${proveedorActivo.saldo < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                      ${proveedorActivo.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-Pestañas de Detalle */}
              <div className="bg-slate-50 border-b border-slate-300 px-3 pt-1 flex items-center gap-1 text-xs font-mono">
                {[
                  { key: 'adeudadas', label: 'Facturas adeudadas' },
                  { key: 'cuenta', label: 'Cuenta proveedor' },
                  { key: 'general', label: 'Información general' },
                  { key: 'otra', label: 'Otra información' }
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

              {/* CONTENIDO DE LA PESTAÑA: FACTURAS ADEUDADAS AL PROVEEDOR */}
              {tabDetalle === 'adeudadas' && (
                <div>
                  {/* Barra informativa */}
                  <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                    <span>Facturas adeudadas al proveedor (doble click para seleccionar ítem)</span>
                    <button title="Exportar a Excel" className="p-1 hover:bg-slate-200 text-emerald-700">
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Grilla de Facturas Adeudadas */}
                  <div className="overflow-x-auto min-h-[360px]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                          <th className="py-2 px-3 border-r border-slate-200">Nro. Comprobante</th>
                          <th className="py-2 px-3 border-r border-slate-200">Tipo</th>
                          <th className="py-2 px-3 border-r border-slate-200">Fecha pago</th>
                          <th className="py-2 px-3 border-r border-slate-200">Descripción</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Valor ME</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Total</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Pagado</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Saldo</th>
                          <th className="py-2 px-3 text-right">Saldo acumulado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {proveedorActivo && proveedorActivo.facturasAdeudadas.length > 0 ? (
                          proveedorActivo.facturasAdeudadas.map((f) => (
                            <tr key={f.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                                {f.nroComprobante}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{f.tipo}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{f.fechaPago}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-sans text-[11px] truncate max-w-xs">
                                {f.descripcion}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-400">
                                {f.valorMe > 0 ? `$${f.valorMe.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-slate-900">
                                ${f.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-emerald-700">
                                ${f.pagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-rose-700">
                                ${f.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                ${f.saldoAcumulado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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

                  {/* Paginación de la Grilla de Facturas Adeudadas */}
                  <div className="bg-[#f8fafc] border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <div className="flex items-center gap-1">
                      <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                      <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                      <span>Página</span>
                      <input type="text" readOnly value="1" className="w-6 text-center border border-slate-300 bg-white py-0.5 text-[10px]" />
                      <span>de 1</span>
                      <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                      <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
                      <button className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5 text-purple-700" /></button>
                    </div>
                    <span>
                      {proveedorActivo && proveedorActivo.facturasAdeudadas.length > 0
                        ? `Mostrando 1 - ${proveedorActivo.facturasAdeudadas.length} de ${proveedorActivo.facturasAdeudadas.length}`
                        : 'Sin datos para mostrar'}
                    </span>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: CUENTA PROVEEDOR (EXTRACTO) */}
              {tabDetalle === 'cuenta' && (
                <div>
                  <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                    <span>Historial completo de cuenta corriente con el proveedor</span>
                    <button title="Exportar a Excel" className="p-1 hover:bg-slate-200 text-emerald-700">
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="overflow-x-auto min-h-[360px]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                          <th className="py-2 px-3 border-r border-slate-200">Fecha</th>
                          <th className="py-2 px-3 border-r border-slate-200">Comprobante</th>
                          <th className="py-2 px-3 border-r border-slate-200">Concepto</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Debe ($)</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Haber ($)</th>
                          <th className="py-2 px-3 text-right">Saldo Histórico ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {proveedorActivo && proveedorActivo.movimientos.length > 0 ? (
                          proveedorActivo.movimientos.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 border-r border-slate-200">{m.fecha}</td>
                              <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{m.comprobante}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-sans text-[11px]">{m.concepto}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-emerald-700 font-bold">
                                {m.debe > 0 ? `$${m.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-rose-700 font-bold">
                                {m.haber > 0 ? `$${m.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                ${m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          Array.from({ length: 6 }).map((_, idx) => (
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

                  <div className="bg-[#f8fafc] border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <div className="flex items-center gap-1">
                      <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                      <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                      <span>Página</span>
                      <input type="text" readOnly value="1" className="w-6 text-center border border-slate-300 bg-white py-0.5 text-[10px]" />
                      <span>de 1</span>
                      <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                      <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
                    </div>
                    <span>
                      {proveedorActivo && proveedorActivo.movimientos.length > 0
                        ? `Mostrando 1 - ${proveedorActivo.movimientos.length} de ${proveedorActivo.movimientos.length}`
                        : 'Sin datos para mostrar'}
                    </span>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: INFORMACIÓN GENERAL */}
              {tabDetalle === 'general' && (
                <div className="p-6 max-w-2xl space-y-4 font-mono text-xs">
                  {proveedorActivo ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Razón Social:</span>
                          <p className="font-bold text-slate-900 mt-1">{proveedorActivo.razonSocial}</p>
                        </div>
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Identificación CUIT:</span>
                          <p className="font-bold text-slate-900 mt-1">{proveedorActivo.cuit}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Condición IVA:</span>
                          <p className="font-bold text-slate-900 mt-1">{proveedorActivo.condicionIva}</p>
                        </div>
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Cuenta de Gasto Habitual:</span>
                          <p className="font-bold text-slate-900 mt-1">{proveedorActivo.cuentaGastoHabitual}</p>
                        </div>
                      </div>

                      <div className="border border-slate-200 p-3 bg-slate-50">
                        <span className="text-slate-500 text-[10px] block">Domicilio Fiscal:</span>
                        <p className="font-bold text-slate-900 mt-1">{proveedorActivo.domicilio}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Teléfono:</span>
                          <p className="font-bold text-slate-900 mt-1">{proveedorActivo.telefono}</p>
                        </div>
                        <div className="border border-slate-200 p-3 bg-slate-50">
                          <span className="text-slate-500 text-[10px] block">Email:</span>
                          <p className="font-bold text-slate-900 mt-1">{proveedorActivo.email}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      Seleccione un proveedor de la lista izquierda para consultar su información fiscal y de contacto.
                    </div>
                  )}
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: OTRA INFORMACIÓN */}
              {tabDetalle === 'otra' && (
                <div className="p-6 max-w-2xl space-y-4 font-mono text-xs">
                  {proveedorActivo ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-slate-200 p-3 bg-slate-50">
                        <span className="text-slate-500 text-[10px] block">Condición de Pago:</span>
                        <p className="font-bold text-slate-900 mt-1">{proveedorActivo.condicionPago}</p>
                      </div>
                      <div className="border border-slate-200 p-3 bg-slate-50">
                        <span className="text-slate-500 text-[10px] block">Padrón de Retenciones:</span>
                        <p className="font-bold text-emerald-700 mt-1">Sujeto a Retención IIBB / Ganancias</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      Seleccione un proveedor de la lista izquierda para consultar condiciones comerciales.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BARRA INFERIOR DE ACCIONES (Agregar factura, Agregar pago, Nuevo proveedor, Importar) */}
            <div className="bg-[#ede9fe]/30 border-t border-slate-300 px-4 py-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFacturaModal(true)}
                className="px-3.5 py-1.5 bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#581c87] font-mono text-xs font-bold border border-[#c4b5fd] flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#581c87]" />
                <span>Agregar factura ▼</span>
              </button>

              <button
                onClick={() => setShowPagoModal(true)}
                className="px-3.5 py-1.5 bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#581c87] font-mono text-xs font-bold border border-[#c4b5fd] flex items-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5 text-[#581c87]" />
                <span>Agregar pago</span>
              </button>

              <button
                onClick={() => setShowNuevoProveedorModal(true)}
                className="px-3.5 py-1.5 bg-[#581c87] hover:bg-[#4c1d95] text-white font-mono text-xs font-bold border border-[#581c87] flex items-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo proveedor</span>
              </button>

              <button
                onClick={() => alert('Asistente de importación masiva de proveedores activo.')}
                className="px-3.5 py-1.5 bg-[#581c87] hover:bg-[#4c1d95] text-white font-mono text-xs font-bold border border-[#581c87] flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar ▼</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PESTAÑA: RESUMEN PROVEEDORES */
        <div className="bg-white border border-slate-300 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                RESUMEN DE OBLIGACIONES Y CARTERA DE PROVEEDORES
              </h3>
              <p className="text-xs text-slate-500 font-mono">Consolidación de cuentas a pagar</p>
            </div>
            <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-bold flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Informe PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-[11px] text-slate-500 uppercase block">A VENCER (0-30 DÍAS)</span>
              <p className="text-xl font-bold text-slate-900 mt-1">$6.423.500,00</p>
            </div>
            <div className="p-4 border border-slate-300 bg-amber-50/50">
              <span className="text-[11px] text-amber-700 uppercase block">VENCIDO (31-60 DÍAS)</span>
              <p className="text-xl font-bold text-amber-900 mt-1">$2.500.000,00</p>
            </div>
            <div className="p-4 border border-slate-300 bg-rose-50/50">
              <span className="text-[11px] text-rose-700 uppercase block">VENCIDO (+60 DÍAS)</span>
              <p className="text-xl font-bold text-rose-900 mt-1">$340.222,40</p>
            </div>
            <div className="p-4 border border-slate-300 bg-zonda-50">
              <span className="text-[11px] text-zonda-700 uppercase block">TOTAL POR PAGAR</span>
              <p className="text-xl font-bold text-zonda-900 mt-1">$9.263.722,40</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR FACTURA DE COMPRA */}
      {showFacturaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                AGREGAR FACTURA // {proveedorActivo?.razonSocial}
              </h3>
              <button onClick={() => setShowFacturaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearFactura} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tipo de Comprobante:</label>
                  <select
                    value={tipoFactura}
                    onChange={(e) => setTipoFactura(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 text-xs"
                  >
                    <option value="Factura A">Factura A</option>
                    <option value="Factura B">Factura B</option>
                    <option value="Factura C">Factura C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Cuenta de Imputación:</label>
                  <input type="text" readOnly value={proveedorActivo?.cuentaGastoHabitual || '5.1.01 Materiales'} className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Descripción del Comprobante:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Insumos de obra o combustibles"
                  value={descFactura}
                  onChange={(e) => setDescFactura(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Neto Gravado ($ ARS):</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={netoFactura}
                  onChange={(e) => setNetoFactura(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Neto:</span>
                  <span>${netoFactura.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IVA (21%):</span>
                  <span>${(netoFactura * 0.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Factura Compra:</span>
                  <span>${(netoFactura * 1.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFacturaModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-bold uppercase flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Cargar Factura</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR PAGO A PROVEEDOR */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                AGREGAR PAGO // {proveedorActivo?.razonSocial}
              </h3>
              <button onClick={() => setShowPagoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAgregarPago} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Monto a Pagar ($ ARS):</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={montoPago}
                  onChange={(e) => setMontoPago(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Medio de Pago / Cuenta de Origen:</label>
                <select
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                >
                  <option value="Transferencia Bancaria Santander">Transferencia Santander Cta Cte</option>
                  <option value="Transferencia Bancaria Galicia">Transferencia Galicia Cta Cte</option>
                  <option value="Cheque Propio Diferido">Cheque Propio Diferido</option>
                  <option value="Efectivo de Caja">Efectivo en Caja</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPagoModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Emitir Orden de Pago</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PROVEEDOR */}
      {showNuevoProveedorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                ALTA DE NUEVO PROVEEDOR
              </h3>
              <button onClick={() => setShowNuevoProveedorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevoProveedor} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Razón Social:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: DISTRIBUIDORA SAN JUAN S.R.L."
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">CUIT:</label>
                  <input
                    type="text"
                    required
                    placeholder="30-12345678-9"
                    value={nuevoCuit}
                    onChange={(e) => setNuevoCuit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Condición IVA:</label>
                  <select
                    value={nuevoCondicionIva}
                    onChange={(e) => setNuevoCondicionIva(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Monotributo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Domicilio Fiscal:</label>
                <input
                  type="text"
                  placeholder="Calle, Número, Ciudad, San Juan"
                  value={nuevoDomicilio}
                  onChange={(e) => setNuevoDomicilio(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  placeholder="pagos@proveedor.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNuevoProveedorModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-bold uppercase"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CALENDARIO DE VENCIMIENTOS */}
      {showCalendarioModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4c1d95]" />
                <span>CALENDARIO DE VENCIMIENTOS // COMPRAS Y PAGOS</span>
              </h3>
              <button onClick={() => setShowCalendarioModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-amber-50 border border-amber-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-900 block">25/10/2026 // VENCIDO HACE 2 DÍAS</span>
                  <p className="text-[11px] text-amber-800">ESTACION CENTRAL S.A.S. - Factura A 0008-00041289</p>
                </div>
                <span className="font-bold text-amber-900">$6.423.500,00</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">28/10/2026 // MAÑANA</span>
                  <p className="text-[11px] text-slate-600">GOMALAR SRL - Factura A 0002-00008912</p>
                </div>
                <span className="font-bold text-slate-900">$26.500,00</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">31/10/2026 // EN 4 DÍAS</span>
                  <p className="text-[11px] text-slate-600">LUCAS MAXIMILIANO MARINERO - Factura A 0001-00000021</p>
                </div>
                <span className="font-bold text-slate-900">$2.500.000,00</span>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowCalendarioModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
