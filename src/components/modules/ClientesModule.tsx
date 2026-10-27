import React, { useState } from 'react';
import {
  Calendar,
  Settings,
  Search,
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
  CreditCard,
  Send,
  X,
  FileDown
} from 'lucide-react';
import { Cliente, FacturaAdeudada, TipoComprobante } from '../../types/models';
import { mockClientes } from '../../services/mockData';

export const ClientesModule: React.FC = () => {
  // Lista de clientes
  const [clientes, setClientes] = useState<Cliente[]>(mockClientes);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('CLI-003'); // Constructora Cuyana seleccionada por defecto
  const [filtroActivos, setFiltroActivos] = useState<'activos' | 'inactivos'>('activos');
  const [searchCliente, setSearchCliente] = useState('');
  const [panelIzquierdoColapsado, setPanelIzquierdoColapsado] = useState(false);

  // Pestañas principales superiores
  const [tabPrincipal, setTabPrincipal] = useState<'resumen' | 'gestion' | 'importacion' | 'pasarela'>('gestion');

  // Pestañas de detalle del cliente (Panel derecho)
  const [tabDetalle, setTabDetalle] = useState<'adeudadas' | 'cuenta' | 'general' | 'otra'>('adeudadas');

  // Modales
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);
  const [showConfigAfipModal, setShowConfigAfipModal] = useState(false);

  // Formulario Factura
  const [tipoFactura, setTipoFactura] = useState<TipoComprobante>('Factura A');
  const [netoFactura, setNetoFactura] = useState(500000);
  const [descFactura, setDescFactura] = useState('');

  // Formulario Cobro
  const [montoCobro, setMontoCobro] = useState(100000);
  const [medioCobro, setMedioCobro] = useState('Transferencia Bancaria Santander');

  // Formulario Nuevo Cliente
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCuit, setNuevoCuit] = useState('');
  const [nuevoDomicilio, setNuevoDomicilio] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoCondicionIva, setNuevoCondicionIva] = useState<'Responsable Inscripto' | 'Consumidor Final'>('Responsable Inscripto');

  // Filtrado de clientes
  const clientesFiltrados = clientes.filter((c) => {
    const coincideEstado = filtroActivos === 'activos' ? c.activo : !c.activo;
    const coincideTexto =
      c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.razonSocial.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.cuit.includes(searchCliente);
    return coincideEstado && coincideTexto;
  });

  const clienteActivo = clientes.find((c) => c.id === clienteSeleccionadoId) || clientesFiltrados[0];

  // Crear Factura
  const handleCrearFactura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteActivo) return;

    const iva = netoFactura * 0.21;
    const total = netoFactura + iva;
    const nroFact = `0001-00000${Math.floor(100 + Math.random() * 900)}`;

    const nuevaFactura: FacturaAdeudada = {
      id: `FAC-${Date.now()}`,
      nroComprobante: nroFact,
      tipo: tipoFactura,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      descripcion: descFactura || 'Venta y certificación de servicios',
      valorMe: 0,
      total,
      cobrado: 0,
      saldo: total,
      saldoAcumulado: clienteActivo.saldo + total
    };

    setClientes((prev) =>
      prev.map((c) => {
        if (c.id === clienteActivo.id) {
          return {
            ...c,
            saldo: c.saldo + total,
            facturasAdeudadas: [nuevaFactura, ...c.facturasAdeudadas],
            movimientos: [
              ...c.movimientos,
              {
                id: `MOV-${Date.now()}`,
                fecha: new Date().toISOString().split('T')[0],
                comprobante: `${tipoFactura} ${nroFact}`,
                concepto: descFactura || 'Emisión de Factura',
                debe: total,
                haber: 0,
                saldo: c.saldo + total
              }
            ]
          };
        }
        return c;
      })
    );

    setShowFacturaModal(false);
    setDescFactura('');
  };

  // Agregar Cobro
  const handleAgregarCobro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteActivo) return;

    setClientes((prev) =>
      prev.map((c) => {
        if (c.id === clienteActivo.id) {
          const nuevoSaldo = Math.max(0, c.saldo - montoCobro);
          return {
            ...c,
            saldo: nuevoSaldo,
            movimientos: [
              ...c.movimientos,
              {
                id: `MOV-${Date.now()}`,
                fecha: new Date().toISOString().split('T')[0],
                comprobante: `Recibo X 0003-00000${Math.floor(100 + Math.random() * 900)}`,
                concepto: `Cobro mediante ${medioCobro}`,
                debe: 0,
                haber: montoCobro,
                saldo: nuevoSaldo
              }
            ]
          };
        }
        return c;
      })
    );

    setShowCobroModal(false);
  };

  // Alta de Cliente
  const handleCrearNuevoCliente = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo: Cliente = {
      id: `CLI-00${clientes.length + 1}`,
      nombre: nuevoNombre,
      razonSocial: nuevoNombre,
      cuit: nuevoCuit || '30-00000000-0',
      condicionIva: nuevoCondicionIva,
      domicilio: nuevoDomicilio || 'San Juan, Argentina',
      telefono: '+54 264 400-0000',
      email: nuevoEmail || 'contacto@cliente.com',
      saldo: 0,
      activo: true,
      listaPrecios: 'Lista Corporativa Obras A',
      limiteCredito: 2000000,
      vendedor: 'Ing. Lucas Marinero',
      facturasAdeudadas: [],
      movimientos: []
    };

    setClientes([nuevo, ...clientes]);
    setClienteSeleccionadoId(nuevo.id);
    setShowNuevoClienteModal(false);
    setNuevoNombre('');
    setNuevoCuit('');
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      {/* 1. BARRA SUPERIOR DE ENCABEZADO Y LLAMADAS A LA ACCIÓN */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
            CLIENTES
          </h1>
          <span className="text-xs text-slate-400 font-mono">| GESTIÓN COMERCIAL Y CUENTAS CORRIENTES</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-600">¿Querés emitir Factura electrónica?</span>
            <button
              onClick={() => setShowConfigAfipModal(true)}
              className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-zonda-700 font-bold flex items-center gap-1.5 transition-colors uppercase text-[11px]"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuralo ahora</span>
            </button>
          </div>

          <button
            onClick={() => setShowCalendarioModal(true)}
            className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#4c1d95]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario de vencimientos</span>
          </button>
        </div>
      </div>

      {/* 2. PESTAÑAS PRINCIPALES DEL MÓDULO */}
      <div className="bg-[#ede9fe]/40 border-b border-slate-300 px-2 pt-1 flex items-center gap-1">
        {[
          { key: 'resumen', label: 'Resumen clientes' },
          { key: 'gestion', label: 'Gestión de clientes' },
          { key: 'importacion', label: 'Importación de facturas' },
          { key: 'pasarela', label: 'Mercado Pago / Cobros Online' }
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

      {/* 3. VISTA PRINCIPAL: SPLIT-SCREEN MASTER-DETAIL (GESTIÓN DE CLIENTES) */}
      {tabPrincipal === 'gestion' ? (
        <div className="flex flex-col lg:flex-row min-h-[640px] bg-white border border-slate-300 border-t-0">
          {/* PANEL IZQUIERDO: LISTA DE CLIENTES (MASTER) */}
          <div
            className={`border-r border-slate-300 bg-white flex flex-col justify-between transition-all duration-200 ${
              panelIzquierdoColapsado ? 'w-12 overflow-hidden' : 'w-full lg:w-80 shrink-0'
            }`}
          >
            <div>
              {/* Cabecera del Panel Izquierdo */}
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                {!panelIzquierdoColapsado && <span>Lista de clientes</span>}
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
                      Activos ({clientes.filter((c) => c.activo).length})
                    </button>
                    <button
                      onClick={() => setFiltroActivos('inactivos')}
                      className={`py-1.5 text-center font-bold transition-colors ${
                        filtroActivos === 'inactivos'
                          ? 'bg-white text-slate-900 border-b-2 border-b-[#4c1d95]'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Inactivos ({clientes.filter((c) => !c.activo).length})
                    </button>
                  </div>

                  {/* Buscador de Cliente */}
                  <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-600 text-[11px] whitespace-nowrap">Buscar cliente:</span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchCliente}
                        onChange={(e) => setSearchCliente(e.target.value)}
                        placeholder=""
                        className="w-full px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                      />
                    </div>
                    <button title="Ayuda de búsqueda" className="text-slate-400 hover:text-slate-600">
                      <HelpCircle className="w-4 h-4 text-[#4c1d95]" />
                    </button>
                  </div>

                  {/* Tabla de Clientes */}
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
                        {clientesFiltrados.map((cli) => {
                          const isSelected = clienteActivo?.id === cli.id;
                          return (
                            <tr
                              key={cli.id}
                              onClick={() => setClienteSeleccionadoId(cli.id)}
                              className={`cursor-pointer transition-colors group ${
                                isSelected
                                  ? 'bg-[#ede9fe] font-semibold text-slate-900 border-l-4 border-l-[#4c1d95]'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                              title="Haga click sobre clientes para ver información y cuenta corriente"
                            >
                              <td className="py-2 px-2.5 border-r border-slate-200 truncate max-w-[100px]">
                                {cli.nombre}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-200 truncate max-w-[100px] text-slate-500 text-[11px]">
                                {cli.razonSocial}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                {cli.saldo > 0
                                  ? `$${cli.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                  : '$0,00'}
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
                <span>Mostrando 1 - {clientesFiltrados.length} de {clientesFiltrados.length}</span>
              </div>
            )}
          </div>

          {/* PANEL DERECHO: DETALLE DEL CLIENTE SELECCIONADO */}
          <div className="flex-1 flex flex-col justify-between bg-white min-w-0">
            <div>
              {/* Título del Cliente Seleccionado */}
              <div className="bg-[#f3f0ff] border-b border-slate-300 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                    {clienteActivo ? clienteActivo.razonSocial : 'Seleccionar cliente de la lista'}
                  </span>
                  {clienteActivo && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-300 text-slate-700">
                      CUIT: {clienteActivo.cuit} | {clienteActivo.condicionIva}
                    </span>
                  )}
                </div>

                {clienteActivo && (
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-500">Saldo Total:</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 border border-slate-300">
                      ${clienteActivo.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-Pestañas de Detalle */}
              <div className="bg-slate-50 border-b border-slate-300 px-3 pt-1 flex items-center gap-1 text-xs font-mono">
                {[
                  { key: 'adeudadas', label: 'Facturas adeudadas' },
                  { key: 'cuenta', label: 'Cuenta cliente' },
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

              {/* CONTENIDO DE LA PESTAÑA: FACTURAS ADEUDADAS */}
              {tabDetalle === 'adeudadas' && (
                <div>
                  {/* Barra informativa */}
                  <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                    <span>Facturas adeudadas por el cliente (doble click para seleccionar ítem)</span>
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
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Cobrado</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Saldo</th>
                          <th className="py-2 px-3 text-right">Saldo acumulado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {clienteActivo && clienteActivo.facturasAdeudadas.length > 0 ? (
                          clienteActivo.facturasAdeudadas.map((f) => (
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
                                ${f.cobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
                          <tr>
                            <td colSpan={9} className="py-16 text-center text-slate-400 font-mono text-xs">
                              Sin facturas adeudadas para este cliente
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: CUENTA CLIENTE (MAYOR / EXTRACTO) */}
              {tabDetalle === 'cuenta' && (
                <div>
                  <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                    <span>Historial completo de movimientos de cuenta corriente</span>
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
                        {clienteActivo && clienteActivo.movimientos.length > 0 ? (
                          clienteActivo.movimientos.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 border-r border-slate-200">{m.fecha}</td>
                              <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{m.comprobante}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-sans text-[11px]">{m.concepto}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-rose-700 font-bold">
                                {m.debe > 0 ? `$${m.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-right text-emerald-700 font-bold">
                                {m.haber > 0 ? `$${m.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                ${m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-16 text-center text-slate-400 font-mono text-xs">
                              Sin movimientos en la cuenta corriente
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: INFORMACIÓN GENERAL */}
              {tabDetalle === 'general' && clienteActivo && (
                <div className="p-6 max-w-2xl space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Razón Social:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.razonSocial}</p>
                    </div>
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Identificación CUIT:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.cuit}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Condición IVA:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.condicionIva}</p>
                    </div>
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Lista de Precios Asignada:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.listaPrecios}</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 p-3 bg-slate-50">
                    <span className="text-slate-500 text-[10px] block">Domicilio Fiscal:</span>
                    <p className="font-bold text-slate-900 mt-1">{clienteActivo.domicilio}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Teléfono de Contacto:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.telefono}</p>
                    </div>
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Correo Electrónico:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: OTRA INFORMACIÓN */}
              {tabDetalle === 'otra' && clienteActivo && (
                <div className="p-6 max-w-2xl space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Límite de Crédito Otorgado:</span>
                      <p className="font-bold text-slate-900 mt-1">
                        ${clienteActivo.limiteCredito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="border border-slate-200 p-3 bg-slate-50">
                      <span className="text-slate-500 text-[10px] block">Vendedor Asignado:</span>
                      <p className="font-bold text-slate-900 mt-1">{clienteActivo.vendedor}</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 p-3 bg-slate-50">
                    <span className="text-slate-500 text-[10px] block">Estado en Padrón AFIP / Rentas:</span>
                    <p className="font-bold text-emerald-700 mt-1">Activo y Verificado (Sin bloqueos)</p>
                  </div>
                </div>
              )}
            </div>

            {/* BARRA INFERIOR DE ACCIONES Y PAGINACIÓN DEL DETALLE */}
            <div className="bg-[#f8fafc] border-t border-slate-300 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Paginación del Detalle */}
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
                <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span>Página</span>
                <input type="text" readOnly value="1" className="w-6 text-center border border-slate-300 bg-white py-0.5 text-[10px]" />
                <span>de 1</span>
                <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5" /></button>
              </div>

              {/* Botonera de Acciones (Agregar factura, Agregar cobro, Nuevo cliente, Importar) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFacturaModal(true)}
                  className="px-3 py-1.5 bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#4c1d95] font-mono text-xs font-bold border border-[#c4b5fd] flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Agregar factura ▼</span>
                </button>

                <button
                  onClick={() => setShowCobroModal(true)}
                  className="px-3 py-1.5 bg-[#ecfdf5] hover:bg-[#d1fae5] text-emerald-800 font-mono text-xs font-bold border border-emerald-300 flex items-center gap-1.5 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Agregar cobro</span>
                </button>

                <button
                  onClick={() => setShowNuevoClienteModal(true)}
                  className="px-3 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Nuevo cliente</span>
                </button>

                <button
                  onClick={() => setTabPrincipal('importacion')}
                  className="px-3 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold border border-[#4c1d95] flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar ▼</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : tabPrincipal === 'resumen' ? (
        /* PESTAÑA: RESUMEN CLIENTES */
        <div className="bg-white border border-slate-300 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                ANTIGÜEDAD DE SALDOS Y CARTERA DE CRÉDITO
              </h3>
              <p className="text-xs text-slate-500 font-mono">Consolidación de cuentas a cobrar</p>
            </div>
            <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-bold flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Informe PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-[11px] text-slate-500 uppercase block">A VENCER (0-30 DÍAS)</span>
              <p className="text-xl font-bold text-slate-900 mt-1">$9.740.500,00</p>
            </div>
            <div className="p-4 border border-slate-300 bg-amber-50/50">
              <span className="text-[11px] text-amber-700 uppercase block">VENCIDO (31-60 DÍAS)</span>
              <p className="text-xl font-bold text-amber-900 mt-1">$1.850.400,00</p>
            </div>
            <div className="p-4 border border-slate-300 bg-rose-50/50">
              <span className="text-[11px] text-rose-700 uppercase block">VENCIDO (+60 DÍAS)</span>
              <p className="text-xl font-bold text-rose-900 mt-1">$0,00</p>
            </div>
            <div className="p-4 border border-slate-300 bg-zonda-50">
              <span className="text-[11px] text-zonda-700 uppercase block">TOTAL POR COBRAR</span>
              <p className="text-xl font-bold text-zonda-900 mt-1">$11.590.900,00</p>
            </div>
          </div>
        </div>
      ) : tabPrincipal === 'importacion' ? (
        /* PESTAÑA: IMPORTACIÓN DE FACTURAS */
        <div className="bg-white border border-slate-300 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                IMPORTACIÓN MASIVA DE FACTURAS Y COMPROBANTES
              </h3>
              <p className="text-xs text-slate-500 font-mono">Carga por lotes mediante plantilla Excel o CSV</p>
            </div>
            <button className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <FileDown className="w-4 h-4" />
              <span>Descargar Plantilla Excel Modelo</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 p-10 text-center space-y-3 bg-slate-50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-mono font-bold text-slate-700 uppercase">
              ARRASTRE SU ARCHIVO EXCEL/CSV O HAGA CLICK PARA EXAMINAR
            </p>
            <p className="text-[11px] text-slate-400 font-mono">Formatos soportados: .xlsx, .csv (UTF-8) hasta 10.000 filas</p>
            <button className="px-4 py-2 bg-slate-900 text-white font-mono text-xs font-bold uppercase">
              Seleccionar archivo local
            </button>
          </div>
        </div>
      ) : (
        /* PESTAÑA: MERCADO PAGO / COBROS ONLINE */
        <div className="bg-white border border-slate-300 p-6 space-y-6 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                PASARELA DE COBRANZAS DIGITALES
              </h3>
              <p className="text-xs text-slate-500">Cobros automáticos mediante tarjeta de débito/crédito y QR</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Conectado</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-slate-500 text-[10px] block">Comprobantes Cobrados este Mes:</span>
              <p className="text-lg font-bold text-slate-900 mt-1">14 cobranzas acreditadas</p>
            </div>
            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-slate-500 text-[10px] block">Acreditación Directa:</span>
              <p className="text-lg font-bold text-slate-900 mt-1">Banco Santander Río Cta Cte</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR FACTURA */}
      {showFacturaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                AGREGAR FACTURA // {clienteActivo?.razonSocial}
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
                    onChange={(e) => setTipoFactura(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 text-xs"
                  >
                    <option value="Factura A">Factura A</option>
                    <option value="Factura B">Factura B</option>
                    <option value="Presupuesto">Presupuesto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Punto de Venta:</label>
                  <input type="text" readOnly value="0001 (Electrónico)" className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Descripción del Ítem / Servicio:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Certificado de obra o provisión de materiales"
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
                  <span>Total Comprobante:</span>
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
                  <span>Emitir Comprobante</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR COBRO */}
      {showCobroModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                AGREGAR COBRO // {clienteActivo?.razonSocial}
              </h3>
              <button onClick={() => setShowCobroModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAgregarCobro} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Monto a Cobrar ($ ARS):</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={montoCobro}
                  onChange={(e) => setMontoCobro(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Medio de Pago / Cuenta:</label>
                <select
                  value={medioCobro}
                  onChange={(e) => setMedioCobro(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                >
                  <option value="Transferencia Bancaria Santander">Transferencia Santander Cta Cte</option>
                  <option value="Transferencia Bancaria Galicia">Transferencia Galicia Cta Cte</option>
                  <option value="Cheque de Terceros">Cheque de Terceros a Depositar</option>
                  <option value="Efectivo en Caja Central">Efectivo en Caja Central</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCobroModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar Cobro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO CLIENTE */}
      {showNuevoClienteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                ALTA DE NUEVO CLIENTE
              </h3>
              <button onClick={() => setShowNuevoClienteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevoCliente} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Nombre / Razón Social:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: OBRAS CIVILES CUYO S.A."
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
                    onChange={(e) => setNuevoCondicionIva(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Consumidor Final">Consumidor Final</option>
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
                  placeholder="administracion@empresa.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNuevoClienteModal(false)}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-bold uppercase"
                >
                  Guardar Cliente
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
                <span>CALENDARIO DE VENCIMIENTOS // OCT - NOV 2026</span>
              </h3>
              <button onClick={() => setShowCalendarioModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-amber-50 border border-amber-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-900 block">28/10/2026 // MAÑANA</span>
                  <p className="text-[11px] text-amber-800">VALDIVIESO GROUP S.R.L. - Factura A 0001-00000398</p>
                </div>
                <span className="font-bold text-amber-900">$1.850.400,00</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">23/11/2026 // EN 27 DÍAS</span>
                  <p className="text-[11px] text-slate-600">CONSTRUCTORA CUYANA S.R.L. - Factura A 0001-00000412</p>
                </div>
                <span className="font-bold text-slate-900">$5.868.500,00</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">24/11/2026 // EN 28 DÍAS</span>
                  <p className="text-[11px] text-slate-600">HIDRÁULICA SAN JUAN - Factura A 0001-00000413</p>
                </div>
                <span className="font-bold text-slate-900">$3.872.000,00</span>
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

      {/* MODAL: CONFIGURAR FACTURA ELECTRÓNICA AFIP */}
      {showConfigAfipModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                <Settings className="w-4 h-4 text-zonda-700" />
                <span>CONFIGURACIÓN AFIP // PUNTOS DE VENTA</span>
              </h3>
              <button onClick={() => setShowConfigAfipModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed font-sans">
                El sistema emite facturas electrónicas A, B, C y M comunicándose directamente con los Web Services de AFIP.
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="font-bold block">PUNTO DE VENTA ACTIVO: 0001</span>
                <span>Certificado digital instalado y vigente hasta 2027.</span>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowConfigAfipModal(false)}
                className="px-4 py-1.5 bg-[#4c1d95] text-white font-bold uppercase"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
