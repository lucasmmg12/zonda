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
  Boxes,
  X,
  Tag,
  Warehouse,
  CheckCircle2,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import { exportToExcelCsv, printFinancialReport } from '../../utils/exportUtils';

export const InventarioModule: React.FC = () => {
  const {
    inventario,
    proveedores,
    clientes,
    facturasCompra,
    crearArticuloInventario,
    actualizarPreciosInventario,
    registrarMovimientoStock,
    registrarFacturaCompra,
    refreshAllFromDb,
    setActiveModule
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
  const [showIngresoFacturaModal, setShowIngresoFacturaModal] = useState(false);
  const [showEgresoStockModal, setShowEgresoStockModal] = useState(false);
  const [showPreciosModal, setShowPreciosModal] = useState(false);
  const [showReportesModal, setShowReportesModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);

  // Mensaje de confirmación en pantalla
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Formulario Nuevo Artículo (Si stockInicial > 0 exige Proveedor + Factura)
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('P');
  const [nuevaUm, setNuevaUm] = useState('1');
  const [nuevoPrecioVenta, setNuevoPrecioVenta] = useState(1500);
  const [nuevoCosto, setNuevoCosto] = useState(1000);
  const [nuevoStock, setNuevoStock] = useState(0);
  const [nuevoArtProveedorId, setNuevoArtProveedorId] = useState('PRV-01');
  const [nuevoArtTipoFactura, setNuevoArtTipoFactura] = useState<'Factura A' | 'Factura B' | 'Factura C'>('Factura A');
  const [nuevoArtNroFactura, setNuevoArtNroFactura] = useState('0001-00045190');
  const [nuevoArtGenerarFacturaPrv, setNuevoArtGenerarFacturaPrv] = useState(true);

  // Formulario INGRESO DE STOCK (+ Entrada obligatoriamente con Proveedor y Factura)
  const [ingresoProveedorId, setIngresoProveedorId] = useState('PRV-01');
  const [ingresoModoFactura, setIngresoModoFactura] = useState<'nueva_factura' | 'factura_existente'>('nueva_factura');
  const [ingresoFacturaExistenteNro, setIngresoFacturaExistenteNro] = useState('');
  const [ingresoTipoFactura, setIngresoTipoFactura] = useState<'Factura A' | 'Factura B' | 'Factura C'>('Factura A');
  const [ingresoNroFactura, setIngresoNroFactura] = useState('0001-00048210');
  const [ingresoMedioPagoPactado, setIngresoMedioPagoPactado] = useState('Transferencia Bancaria Santander');
  const [ingresoCantidad, setIngresoCantidad] = useState(10);
  const [ingresoCostoUnitario, setIngresoCostoUnitario] = useState(1000);
  const [ingresoDeposito, setIngresoDeposito] = useState('Depósito Central');
  const [errorIngresoMsg, setErrorIngresoMsg] = useState<string | null>(null);

  // Formulario EGRESO / SALIDA DE STOCK (- Salida a Obra / Remito / Venta)
  const [egresoTipoDoc, setEgresoTipoDoc] = useState<'REM' | 'FAC' | 'CON' | 'AJU'>('REM');
  const [egresoComprobanteNro, setEgresoComprobanteNro] = useState('R-0001-00000205');
  const [egresoDestino, setEgresoDestino] = useState('CC-100 · Obra Acueducto Gran Tulum - Tramo II');
  const [egresoCantidad, setEgresoCantidad] = useState(1);
  const [egresoDeposito, setEgresoDeposito] = useState('Depósito Central');
  const [egresoObservacion, setEgresoObservacion] = useState('');

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

  // Proveedor seleccionado para ingreso y sus facturas registradas
  const proveedorIngresoObj =
    proveedores.find((p) => p.id === ingresoProveedorId) || proveedores[0];

  const facturasDelProveedorSeleccionado = React.useMemo(() => {
    if (!proveedorIngresoObj) return [];
    const adeudadas = (proveedorIngresoObj.facturasAdeudadas || []).map((f) => ({
      id: f.id,
      etiqueta: `${f.tipo} ${f.nroComprobante}`,
      fecha: f.fechaEmision,
      total: f.total
    }));
    const deCompras = facturasCompra
      .filter(
        (fc) =>
          fc.proveedorCuit === proveedorIngresoObj.cuit ||
          fc.proveedorNombre === proveedorIngresoObj.razonSocial
      )
      .map((fc) => ({
        id: fc.id,
        etiqueta: `${fc.tipo} ${fc.numero}`,
        fecha: fc.fechaComprobante,
        total: fc.total
      }));
    const vistas = new Set<string>();
    const unificadas: { id: string; etiqueta: string; fecha: string; total: number }[] = [];
    for (const item of [...adeudadas, ...deCompras]) {
      if (!vistas.has(item.etiqueta)) {
        vistas.add(item.etiqueta);
        unificadas.push(item);
      }
    }
    return unificadas;
  }, [proveedorIngresoObj, facturasCompra]);

  const abrirModalIngresoStock = () => {
    setErrorIngresoMsg(null);
    if (articuloActivo) {
      setIngresoCostoUnitario(articuloActivo.costoCalculado || 1000);
    }
    setIngresoNroFactura(`0001-000${Math.floor(15000 + Math.random() * 80000)}`);
    setShowIngresoFacturaModal(true);
  };

  const abrirModalEgresoStock = () => {
    setEgresoComprobanteNro(`R-0001-00000${Math.floor(200 + Math.random() * 799)}`);
    setEgresoCantidad(1);
    setEgresoObservacion('');
    setShowEgresoStockModal(true);
  };

  // Navegar directo al Módulo Proveedores con el modal de Factura + Stock pre-cargado
  const irAProveedoresCargarFactura = (proveedorIdTarget?: string) => {
    try {
      sessionStorage.setItem(
        'zonda_open_proveedor_factura_stock',
        JSON.stringify({
          proveedorId: proveedorIdTarget || ingresoProveedorId || proveedores[0]?.id,
          articuloId: articuloActivo?.id,
          cantidad: ingresoCantidad || 10
        })
      );
    } catch {
      // ignore
    }
    setShowIngresoFacturaModal(false);
    setShowAgregarModal(false);
    setActiveModule('proveedores');
  };

  // Manejo de creación de artículo en Supabase (con validación de Factura + Proveedor si hay stock inicial)
  const handleCrearArticulo = async (e: React.FormEvent) => {
    e.preventDefault();
    const prvSel = proveedores.find((p) => p.id === nuevoArtProveedorId) || proveedores[0];
    const etiquetaFac = `${nuevoArtTipoFactura} ${nuevoArtNroFactura.trim() || '0001-00045190'}`;

    // Si tiene stock inicial > 0 y eligió registrar también la Factura de Compra en Proveedores, usamos registrarFacturaCompra con __CREAR_NUEVO__ o creamos el artículo y su factura
    const creado = await crearArticuloInventario({
      codigo: nuevoCodigo || String(inventario.length + 1).padStart(6, '0'),
      descripcion: nuevaDescripcion.toUpperCase(),
      tipo: nuevoTipo,
      um: nuevaUm,
      categoria: 'Materiales Generales',
      precioVentaNeto: nuevoPrecioVenta,
      costoCalculado: nuevoCosto,
      stockInicial: nuevoStock,
      deposito: depositoPredeterminado,
      proveedorId: prvSel?.id,
      proveedorNombre: prvSel?.razonSocial,
      proveedorCuit: prvSel?.cuit,
      facturaNro: etiquetaFac
    });

    if (nuevoStock > 0 && nuevoArtGenerarFacturaPrv && prvSel) {
      await registrarFacturaCompra({
        proveedorId: prvSel.id,
        tipo: nuevoArtTipoFactura,
        nroComprobante: nuevoArtNroFactura.trim() || '0001-00045190',
        netoGravado: Number((nuevoStock * nuevoCosto).toFixed(2)),
        descripcion: `Alta e ingreso inicial de stock: ${creado.descripcion} (${nuevoStock} u.)`,
        cuentaGasto: prvSel.cuentaGastoHabitual || '5.1.01 Materiales e Insumos',
        medioPagoPactado: 'Cuenta Corriente 30 Días',
        itemsInventarioAsociados: []
      });
    }

    setArticuloSeleccionadoId(creado.id);
    setShowAgregarModal(false);
    setNuevoCodigo('');
    setNuevaDescripcion('');
    setNuevoStock(0);
    setFeedbackBanner(
      nuevoStock > 0
        ? `✓ Artículo [${creado.codigo}] ${creado.descripcion} creado con ingreso de +${nuevoStock} u. asociado a ${etiquetaFac} (${prvSel?.razonSocial}).`
        : `✓ Artículo [${creado.codigo}] ${creado.descripcion} creado con Stock 0. Cargá la factura de su proveedor para ingresar unidades.`
    );
  };

  // Registrar INGRESO DE STOCK (+ Entrada vinculada obligatoriamente a Proveedor y Factura)
  const handleRegistrarIngresoConFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articuloActivo) return;
    setErrorIngresoMsg(null);

    if (!proveedorIngresoObj) {
      setErrorIngresoMsg('Debés seleccionar obligatoriamente un Proveedor para cualquier ingreso de stock.');
      return;
    }
    if (ingresoCantidad <= 0) {
      setErrorIngresoMsg('La cantidad a ingresar debe ser mayor a 0.');
      return;
    }

    if (ingresoModoFactura === 'nueva_factura') {
      if (!ingresoNroFactura.trim()) {
        setErrorIngresoMsg('Debés ingresar el Número de Factura del proveedor (ej. 0001-00048210).');
        return;
      }
      const netoCalc = Number((ingresoCantidad * ingresoCostoUnitario).toFixed(2));
      // El proceso nace en Proveedores: registramos la Factura de Compra del Proveedor con el ítem asociado
      await registrarFacturaCompra({
        proveedorId: proveedorIngresoObj.id,
        tipo: ingresoTipoFactura,
        nroComprobante: ingresoNroFactura.trim(),
        netoGravado: netoCalc,
        descripcion: `Ingreso de Stock [${articuloActivo.codigo}] ${articuloActivo.descripcion} (${ingresoCantidad} u.)`,
        cuentaGasto: proveedorIngresoObj.cuentaGastoHabitual || '5.1.01 Materiales e Insumos',
        medioPagoPactado: ingresoMedioPagoPactado,
        itemsInventarioAsociados: [
          {
            articuloAsociadoId: articuloActivo.id,
            codigoProveedor: articuloActivo.codigo,
            descripcionProveedor: articuloActivo.descripcion,
            cantidad: ingresoCantidad,
            costoUnitarioNeto: ingresoCostoUnitario
          }
        ]
      });

      setFeedbackBanner(
        `✓ Ingreso de +${ingresoCantidad} u. registrado en [${articuloActivo.codigo}] ${articuloActivo.descripcion} y Factura ${ingresoTipoFactura} ${ingresoNroFactura.trim()} cargada en Proveedores (${proveedorIngresoObj.razonSocial}).`
      );
    } else {
      const facElegida =
        ingresoFacturaExistenteNro || facturasDelProveedorSeleccionado[0]?.etiqueta || '';
      if (!facElegida) {
        setErrorIngresoMsg(
          'Este proveedor no tiene facturas previas seleccionadas. Elegí "Cargar Nueva Factura de Compra" para registrar la factura y el ingreso.'
        );
        return;
      }

      await registrarMovimientoStock({
        articuloId: articuloActivo.id,
        tipoDoc: 'FAC',
        descripcion: `Ingreso por ${facElegida} — ${proveedorIngresoObj.razonSocial}`,
        cantidad: Math.abs(ingresoCantidad),
        precio: ingresoCostoUnitario,
        deposito: ingresoDeposito,
        proveedorId: proveedorIngresoObj.id,
        proveedorNombre: proveedorIngresoObj.razonSocial,
        proveedorCuit: proveedorIngresoObj.cuit,
        facturaNro: facElegida
      });

      setFeedbackBanner(
        `✓ Ingreso de +${ingresoCantidad} u. vinculado a ${facElegida} del proveedor ${proveedorIngresoObj.razonSocial}.`
      );
    }

    setShowIngresoFacturaModal(false);
  };

  // Registrar EGRESO / SALIDA DE STOCK (- Salida de depósito a Obra / Remito / Venta)
  const handleRegistrarEgresoStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articuloActivo) return;
    const cantSalida = -Math.abs(egresoCantidad || 1);
    const compLabel =
      egresoTipoDoc === 'REM'
        ? `Remito ${egresoComprobanteNro}`
        : egresoTipoDoc === 'FAC'
        ? `Factura Venta ${egresoComprobanteNro}`
        : `${egresoTipoDoc} ${egresoComprobanteNro}`;

    const descCompleta = egresoObservacion.trim()
      ? `Salida por ${compLabel} — ${egresoDestino} (${egresoObservacion.trim()})`
      : `Salida por ${compLabel} — ${egresoDestino}`;

    await registrarMovimientoStock({
      articuloId: articuloActivo.id,
      tipoDoc: egresoTipoDoc,
      descripcion: descCompleta,
      cantidad: cantSalida,
      precio: articuloActivo.costoCalculado,
      deposito: egresoDeposito,
      destinoEgreso: egresoDestino,
      comprobanteEgreso: compLabel
    });

    setShowEgresoStockModal(false);
    setFeedbackBanner(
      `✓ Salida de ${cantSalida} u. registrada en [${articuloActivo.codigo}] ${articuloActivo.descripcion} (${compLabel} -> ${egresoDestino}).`
    );
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
    const prvDefault = proveedores[0];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[;,]/).map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols[0] && cols[1]) {
        const cantIni = parseFloat(cols[4]) || 0;
        const nroFacCsv = cols[5] || 'Factura A 0001-00004120';
        const nomPrvCsv = cols[6] || prvDefault?.razonSocial || 'ALEJANDRO MIGUEL LUL...';
        await crearArticuloInventario({
          codigo: cols[0],
          descripcion: cols[1],
          tipo: 'P',
          um: '1',
          precioVentaNeto: parseFloat(cols[2]) || 1500,
          costoCalculado: parseFloat(cols[3]) || 1000,
          stockInicial: cantIni,
          proveedorId: prvDefault?.id || 'PRV-01',
          proveedorNombre: nomPrvCsv,
          proveedorCuit: prvDefault?.cuit || '20-24891230-4',
          facturaNro: nroFacCsv
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

  // Totales de entradas y salidas del artículo activo
  const resumenMovimientosActivo = React.useMemo(() => {
    const movs = articuloActivo?.movimientos || [];
    const totalEntradas = movs
      .filter((m) => m.cantidad > 0)
      .reduce((acc, m) => acc + m.cantidad, 0);
    const totalSalidas = movs
      .filter((m) => m.cantidad < 0)
      .reduce((acc, m) => acc + Math.abs(m.cantidad), 0);
    return { totalEntradas, totalSalidas };
  }, [articuloActivo]);

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
          <span className="text-xs text-slate-400 font-mono">
            | CONTROL MULTIDEPÓSITO, ENTRADAS POR FACTURA DE PROVEEDOR Y SALIDAS A OBRA
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => irAProveedoresCargarFactura()}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-400"
            title="Ir a Proveedores para cargar una Factura de Compra e ingresar stock"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Ir a Proveedores (Cargar Factura)</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={() => setShowCalendarioModal(true)}
            className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#064e3b]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario de vencimientos</span>
          </button>
        </div>
      </div>

      {/* BANNER DE CONFIRMACIÓN DE MOVIMIENTO */}
      {feedbackBanner && (
        <div className="bg-emerald-50 border-b border-emerald-300 px-4 py-2 flex items-center justify-between text-xs font-mono text-[#042f22]">
          <span className="font-bold">{feedbackBanner}</span>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-500 hover:text-slate-800 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

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
          <div className="w-full lg:w-[46%] border-r border-slate-300 bg-white flex flex-col justify-between">
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
                          <td className="py-2 px-2.5 border-r border-slate-200 truncate max-w-[190px]" title={art.descripcion}>
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
          <div className="w-full lg:w-[54%] flex flex-col justify-between bg-white min-w-0">
            <div>
              {/* Sub-Pestañas del Detalle */}
              <div className="bg-slate-50 border-b border-slate-300 px-3 pt-1 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1">
                  {[
                    { key: 'movimientos', label: 'Movimientos (Entradas y Salidas)' },
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
                <span className="text-[10px] text-emerald-800 font-bold pb-1 hidden sm:inline">
                  ✓ Todo ingreso requiere Factura + Proveedor
                </span>
              </div>

              {/* Título de la Grilla de Movimientos + KPIs de Entradas y Salidas */}
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-slate-900">
                  {articuloActivo
                    ? `Movimientos: ${articuloActivo.codigo} - ${articuloActivo.descripcion}`
                    : 'Movimientos de inventario del item'}
                </span>
                {articuloActivo && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold">
                      Entradas (Facturas): +{resumenMovimientosActivo.totalEntradas.toFixed(2)}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-100 border border-rose-300 text-rose-900 font-bold">
                      Salidas (Remitos/Obras): -{resumenMovimientosActivo.totalSalidas.toFixed(2)}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-400 text-slate-900 font-extrabold">
                      Stock Disponible: {articuloActivo.disponible.toFixed(2)} {articuloActivo.unidadMedida}
                    </span>
                  </div>
                )}
              </div>

              {/* TAB 1: MOVIMIENTOS DE INVENTARIO CON TRAZABILIDAD DE FACTURA Y PROVEEDOR */}
              {tabDetalle === 'movimientos' && (
                <div>
                  <div className="overflow-x-auto min-h-[380px]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                          <th className="py-2 px-2.5 border-r border-slate-200">Fecha</th>
                          <th className="py-2 px-2.5 border-r border-slate-200">Depósito</th>
                          <th className="py-2 px-2.5 border-r border-slate-200">Proveedor / Destino Obra</th>
                          <th className="py-2 px-2.5 border-r border-slate-200">Factura / Comprobante</th>
                          <th className="py-2 px-2 border-r border-slate-200 text-center">TipoDoc</th>
                          <th className="py-2 px-2.5 border-r border-slate-200 text-right">Precio</th>
                          <th className="py-2 px-2.5 text-right">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {articuloActivo && articuloActivo.movimientos && articuloActivo.movimientos.length > 0 ? (
                          articuloActivo.movimientos.map((m) => {
                            const esIngreso = m.cantidad > 0;
                            // Resolver Proveedor y Factura para cualquier movimiento de ingreso
                            const descParts = String(m.descripcion || '').split(/\s+[-—]\s+/);
                            const matchFacturaTexto = String(m.descripcion || '').match(
                              /(Factura\s+[ABC]\s+[0-9]{4}-[0-9]{5,8})/i
                            );
                            const proveedorMostrar = esIngreso
                              ? m.proveedorNombre || descParts[1]?.split('(')[0]?.trim() || 'ALEJANDRO MIGUEL LUL...'
                              : m.destinoEgreso || descParts[1] || m.descripcion;
                            const comprobanteMostrar = esIngreso
                              ? m.facturaNro || (matchFacturaTexto ? matchFacturaTexto[1] : 'Factura A 0001-00004120')
                              : m.comprobanteEgreso || `${m.tipoDoc} Salida`;

                            return (
                              <tr key={m.id} className="hover:bg-slate-50">
                                <td className="py-2 px-2.5 border-r border-slate-200 whitespace-nowrap">
                                  {m.fecha}
                                </td>
                                <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                                  {m.deposito}
                                </td>
                                <td className="py-2 px-2.5 border-r border-slate-200">
                                  {esIngreso ? (
                                    <div className="flex items-center justify-between gap-1">
                                      <div>
                                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-bold uppercase mr-1.5">
                                          PROVEEDOR
                                        </span>
                                        <span className="font-bold text-slate-900">{proveedorMostrar}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          try {
                                            sessionStorage.setItem(
                                              'zonda_global_search_target',
                                              JSON.stringify({
                                                modulo: 'proveedores',
                                                entityId: m.proveedorId,
                                                queryHint: proveedorMostrar
                                              })
                                            );
                                          } catch {
                                            // ignore
                                          }
                                          setActiveModule('proveedores');
                                        }}
                                        title="Ver proveedor en Módulo Proveedores"
                                        className="text-[#064e3b] hover:underline text-[10px] flex items-center gap-0.5 shrink-0"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 text-[9px] font-bold uppercase mr-1.5">
                                        DESTINO
                                      </span>
                                      <span className="text-slate-800 font-semibold">{proveedorMostrar}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 border-r border-slate-200 whitespace-nowrap">
                                  {esIngreso ? (
                                    <span className="font-bold text-[#064e3b] flex items-center gap-1">
                                      <FileText className="w-3 h-3 shrink-0" />
                                      <span>{comprobanteMostrar}</span>
                                    </span>
                                  ) : (
                                    <span className="font-semibold text-slate-700">{comprobanteMostrar}</span>
                                  )}
                                </td>
                                <td className="py-2 px-2 border-r border-slate-200 text-center font-bold text-slate-700">
                                  {esIngreso ? 'FAC' : m.tipoDoc}
                                </td>
                                <td className="py-2 px-2.5 border-r border-slate-200 text-right whitespace-nowrap">
                                  ${m.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </td>
                                <td
                                  className={`py-2 px-2.5 text-right font-extrabold whitespace-nowrap ${
                                    m.cantidad < 0 ? 'text-rose-700 bg-rose-50/40' : 'text-emerald-700 bg-emerald-50/40'
                                  }`}
                                >
                                  {m.cantidad > 0 ? `+${m.cantidad.toFixed(2)}` : m.cantidad.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          Array.from({ length: 8 }).map((_, idx) => (
                            <tr key={idx} className="h-8 border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="border-r border-slate-100 px-3">&nbsp;</td>
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
                          <span className="text-slate-500 text-[10px] block">Costo Calculado (Últ. Factura):</span>
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

            {/* BOTONERA INFERIOR (Agregar item, Ingreso por Factura Proveedor, Salida de Stock, Importar CSV) */}
            <div className="bg-[#ecfdf5]/30 border-t border-slate-300 px-4 py-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAgregarModal(true)}
                className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Agregar Item ▼</span>
              </button>

              <button
                onClick={abrirModalIngresoStock}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold border border-emerald-700 flex items-center gap-1.5 transition-colors"
                title="Todo ingreso de mercadería requiere obligatoriamente Factura y Proveedor asociados"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>+ Ingreso por Factura (Proveedor)</span>
              </button>

              <button
                onClick={abrirModalEgresoStock}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-mono text-xs font-bold border border-rose-700 flex items-center gap-1.5 transition-colors"
                title="Registrar Salida / Egreso de Stock por Remito de Obra, Consumo o Venta"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>- Salida / Egreso de Stock</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
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

      {/* MODAL 1: AGREGAR ARTÍCULO AL CATÁLOGO (CON REGLA DE FACTURA + PROVEEDOR SI TIENE STOCK INICIAL) */}
      {showAgregarModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-xl shadow-2xl my-auto">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>AGREGAR ITEM DE INVENTARIO (CATÁLOGO DE PRODUCTOS)</span>
              <button onClick={() => setShowAgregarModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCrearArticulo} className="p-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Código del Item:</label>
                  <input
                    type="text"
                    required
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value)}
                    placeholder={`ej: 00000${inventario.length + 1}`}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Tipo / Unidad Medida:</label>
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
                <label className="text-slate-600 font-bold block text-[11px] mb-1">Descripción:</label>
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
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">P. Venta ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoPrecioVenta}
                    onChange={(e) => setNuevoPrecioVenta(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Costo Calc. ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoCosto}
                    onChange={(e) => setNuevoCosto(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">
                    Stock Inicial (0 = entra por factura):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoStock}
                    onChange={(e) => setNuevoStock(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Si el usuario ingresa Stock Inicial > 0, exigir Proveedor y Factura asociada */}
              {nuevoStock > 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-400 space-y-2.5">
                  <div className="text-[11px] font-bold text-[#042f22] uppercase">
                    🔗 Respaldo Obligatorio de Ingreso: Proveedor y Factura de Compra
                  </div>
                  <p className="text-[10px] text-slate-600 font-sans">
                    Todo ingreso positivo de unidades (+{nuevoStock}) debe estar asociado a un Proveedor y su Factura de Compra.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Proveedor:</label>
                      <select
                        value={nuevoArtProveedorId}
                        onChange={(e) => setNuevoArtProveedorId(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 text-[11px] font-bold"
                      >
                        {proveedores.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.razonSocial}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Tipo Comprobante:</label>
                      <select
                        value={nuevoArtTipoFactura}
                        onChange={(e) => setNuevoArtTipoFactura(e.target.value as 'Factura A' | 'Factura B' | 'Factura C')}
                        className="w-full px-2 py-1 bg-white border border-slate-300 text-[11px]"
                      >
                        <option value="Factura A">Factura A</option>
                        <option value="Factura B">Factura B</option>
                        <option value="Factura C">Factura C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">N° Factura:</label>
                      <input
                        type="text"
                        required
                        value={nuevoArtNroFactura}
                        onChange={(e) => setNuevoArtNroFactura(e.target.value)}
                        placeholder="0001-00045190"
                        className="w-full px-2 py-1 bg-white border border-slate-300 text-[11px] font-bold"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px]">
                    <input
                      type="checkbox"
                      checked={nuevoArtGenerarFacturaPrv}
                      onChange={(e) => setNuevoArtGenerarFacturaPrv(e.target.checked)}
                      className="accent-[#064e3b]"
                    />
                    <span className="font-bold text-[#042f22]">
                      Registrar simultáneamente esta Factura de Compra en la cuenta corriente del Proveedor
                    </span>
                  </label>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-sans">
                  💡 <strong>Recomendado:</strong> El artículo se creará en el catálogo con <strong>Stock = 0</strong>. El ingreso de unidades se realiza cargando la <strong>Factura del Proveedor</strong> en el módulo <em>Proveedores</em>.
                </div>
              )}

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

      {/* MODAL 2: INGRESO DE STOCK VINCULADO OBLIGATORIAMENTE A FACTURA Y PROVEEDOR */}
      {showIngresoFacturaModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-emerald-700 w-full max-w-xl shadow-2xl my-auto">
            <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>
                + INGRESO DE STOCK POR FACTURA DE PROVEEDOR // [{articuloActivo?.codigo}] {articuloActivo?.descripcion}
              </span>
              <button onClick={() => setShowIngresoFacturaModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="p-4 space-y-3.5 font-mono text-xs">
              {/* Aviso de Regla de Negocio */}
              <div className="p-3 bg-emerald-50 border-l-4 border-l-[#064e3b] border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#042f22] uppercase text-[11px]">
                    📌 Regla de Trazabilidad: Todo Ingreso nace en Proveedores y su Factura
                  </span>
                  <button
                    type="button"
                    onClick={() => irAProveedoresCargarFactura(ingresoProveedorId)}
                    className="px-2.5 py-1 bg-[#064e3b] hover:bg-[#047857] text-white font-bold text-[10px] uppercase flex items-center gap-1 shrink-0"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Abrir en Módulo Proveedores (Con OCR)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-700 font-sans">
                  Ningún producto puede ingresar al depósito sin estar atado a un <strong>Proveedor</strong> y a una <strong>Factura de Compra</strong>. Podés iniciar la carga completa en <em>Proveedores</em> o cargar la Factura del Proveedor directamente acá abajo:
                </p>
              </div>

              {errorIngresoMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 font-bold text-[11px]">
                  ⚠️ {errorIngresoMsg}
                </div>
              )}

              <form onSubmit={handleRegistrarIngresoConFactura} className="space-y-3">
                {/* 1. Selección obligatoria de Proveedor */}
                <div>
                  <label className="text-slate-700 font-bold block text-[11px] mb-1">
                    1. Proveedor Emisor de la Factura (Obligatorio):
                  </label>
                  <select
                    value={ingresoProveedorId}
                    onChange={(e) => {
                      setIngresoProveedorId(e.target.value);
                      setIngresoFacturaExistenteNro('');
                    }}
                    className="w-full px-2.5 py-1.5 border border-emerald-400 bg-white font-bold text-[#042f22]"
                  >
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.razonSocial} — CUIT: {p.cuit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Modo de vinculación de la Factura */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIngresoModoFactura('nueva_factura')}
                    className={`py-2 px-2.5 border text-[11px] font-bold uppercase text-center transition-colors ${
                      ingresoModoFactura === 'nueva_factura'
                        ? 'bg-[#064e3b] text-white border-[#064e3b]'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    A) Cargar Nueva Factura del Proveedor
                  </button>
                  <button
                    type="button"
                    onClick={() => setIngresoModoFactura('factura_existente')}
                    className={`py-2 px-2.5 border text-[11px] font-bold uppercase text-center transition-colors ${
                      ingresoModoFactura === 'factura_existente'
                        ? 'bg-[#064e3b] text-white border-[#064e3b]'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    B) Asociar a Factura ya Cargada ({facturasDelProveedorSeleccionado.length})
                  </button>
                </div>

                {ingresoModoFactura === 'nueva_factura' ? (
                  <div className="p-3 bg-slate-50 border border-slate-300 space-y-2.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Se registrará la Factura en Proveedores (Cuenta Corriente + Contabilidad) y el Ingreso en Inventario:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Tipo Factura:</label>
                        <select
                          value={ingresoTipoFactura}
                          onChange={(e) =>
                            setIngresoTipoFactura(e.target.value as 'Factura A' | 'Factura B' | 'Factura C')
                          }
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold"
                        >
                          <option value="Factura A">Factura A</option>
                          <option value="Factura B">Factura B</option>
                          <option value="Factura C">Factura C</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          N° de Factura (Obligatorio):
                        </label>
                        <input
                          type="text"
                          required
                          value={ingresoNroFactura}
                          onChange={(e) => setIngresoNroFactura(e.target.value)}
                          placeholder="0001-00048210"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Medio Pago Pactado:</label>
                        <select
                          value={ingresoMedioPagoPactado}
                          onChange={(e) => setIngresoMedioPagoPactado(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300"
                        >
                          <option value="Transferencia Bancaria Santander">Transferencia Santander</option>
                          <option value="Cheque Propio Diferido">Cheque Propio Diferido</option>
                          <option value="Cuenta Corriente a 30 Días">Cta. Cte. 30 Días</option>
                          <option value="Efectivo de Caja">Efectivo de Caja</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-300 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-700">
                      Seleccionar Factura registrada de {proveedorIngresoObj?.razonSocial}:
                    </label>
                    {facturasDelProveedorSeleccionado.length > 0 ? (
                      <select
                        value={ingresoFacturaExistenteNro || facturasDelProveedorSeleccionado[0]?.etiqueta || ''}
                        onChange={(e) => setIngresoFacturaExistenteNro(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 font-bold text-slate-900"
                      >
                        {facturasDelProveedorSeleccionado.map((f) => (
                          <option key={f.id} value={f.etiqueta}>
                            {f.etiqueta} — Fecha: {f.fecha} (${f.total.toLocaleString('es-AR')})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 border border-amber-200 font-sans">
                        Este proveedor aún no tiene facturas cargadas. Usá la opción <strong>A) Cargar Nueva Factura del Proveedor</strong>.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Cantidad, Costo Unitario y Depósito */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block text-[11px] mb-1">
                      Cantidad a Ingresar (+):
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={ingresoCantidad}
                      onChange={(e) => setIngresoCantidad(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 border border-emerald-400 bg-emerald-50/40 font-extrabold text-emerald-900"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block text-[11px] mb-1">
                      Costo Unitario Neto ($):
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={ingresoCostoUnitario}
                      onChange={(e) => setIngresoCostoUnitario(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block text-[11px] mb-1">Depósito Receptor:</label>
                    <select
                      value={ingresoDeposito}
                      onChange={(e) => setIngresoDeposito(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 bg-white"
                    >
                      <option value="Depósito Central">Depósito Central</option>
                      <option value="Obrador Zonda - Acueducto">Obrador Zonda - Acueducto</option>
                      <option value="Pañol Móvil Equipos">Pañol Móvil Equipos</option>
                    </select>
                  </div>
                </div>

                {/* Vista previa del impacto en Stock y Facturación */}
                {articuloActivo && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#042f22]">
                    <span>
                      <strong>Impacto en Stock:</strong> {articuloActivo.disponible.toFixed(2)} u. &rarr;{' '}
                      <strong className="text-emerald-800">
                        {(articuloActivo.disponible + Number(ingresoCantidad || 0)).toFixed(2)} u. (+{ingresoCantidad})
                      </strong>
                    </span>
                    <span>
                      <strong>Subtotal Neto Compra:</strong> $
                      {(Number(ingresoCantidad || 0) * Number(ingresoCostoUnitario || 0)).toLocaleString('es-AR', {
                        minimumFractionDigits: 2
                      })}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowIngresoFacturaModal(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase"
                  >
                    Registrar Factura e Ingresar Stock (+)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRAR SALIDA / EGRESO DE STOCK (- DESPACHO A OBRA, REMITO O VENTA) */}
      {showEgresoStockModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-700 w-full max-w-md shadow-2xl">
            <div className="bg-rose-700 text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs font-bold">
              <span>
                - SALIDA / EGRESO DE STOCK // [{articuloActivo?.codigo}] {articuloActivo?.descripcion}
              </span>
              <button onClick={() => setShowEgresoStockModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleRegistrarEgresoStock} className="p-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Tipo Comprobante Salida:</label>
                  <select
                    value={egresoTipoDoc}
                    onChange={(e) => setEgresoTipoDoc(e.target.value as 'REM' | 'FAC' | 'CON' | 'AJU')}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-slate-50 font-bold"
                  >
                    <option value="REM">REM - Remito Salida a Obra</option>
                    <option value="FAC">FAC - Despacho por Venta</option>
                    <option value="CON">CON - Consumo Interno</option>
                    <option value="AJU">AJU - Baja / Merma Física</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">N° Remito / Comprobante:</label>
                  <input
                    type="text"
                    required
                    value={egresoComprobanteNro}
                    onChange={(e) => setEgresoComprobanteNro(e.target.value)}
                    placeholder="R-0001-00000205"
                    className="w-full px-2 py-1.5 border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block text-[11px] mb-1">
                  Obra / Centro de Costo / Cliente Destino:
                </label>
                <select
                  value={egresoDestino}
                  onChange={(e) => setEgresoDestino(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 bg-white font-bold text-slate-800"
                >
                  <option value="CC-100 · Obra Acueducto Gran Tulum - Tramo II">
                    CC-100 · Obra Acueducto Gran Tulum - Tramo II
                  </option>
                  <option value="CC-200 · Obra Red Cloacal Rawson - Sector Sur">
                    CC-200 · Obra Red Cloacal Rawson - Sector Sur
                  </option>
                  <option value="CC-300 · Mantenimiento Central y Depósito">
                    CC-300 · Mantenimiento Central y Depósito
                  </option>
                  {clientes.map((c) => (
                    <option key={c.id} value={`Cliente: ${c.razonSocial}`}>
                      Cliente: {c.razonSocial} (CUIT {c.cuit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">
                    Cantidad a Egresar (-):
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={egresoCantidad}
                    onChange={(e) => setEgresoCantidad(Math.max(0.01, Number(e.target.value)))}
                    className="w-full px-2 py-1.5 border border-rose-400 bg-rose-50/40 font-extrabold text-rose-900"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block text-[11px] mb-1">Depósito Origen:</label>
                  <select
                    value={egresoDeposito}
                    onChange={(e) => setEgresoDeposito(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-white"
                  >
                    <option value="Depósito Central">Depósito Central</option>
                    <option value="Obrador Zonda - Acueducto">Obrador Zonda - Acueducto</option>
                    <option value="Pañol Móvil Equipos">Pañol Móvil Equipos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block text-[11px] mb-1">
                  Observación / Retirado por (Opcional):
                </label>
                <input
                  type="text"
                  value={egresoObservacion}
                  onChange={(e) => setEgresoObservacion(e.target.value)}
                  placeholder="Ej: Retira Capataz M. Marinero para Frente 2"
                  className="w-full px-2 py-1.5 border border-slate-300"
                />
              </div>

              {articuloActivo && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 flex items-center justify-between text-[11px] text-rose-950">
                  <span>Stock Actual: <strong>{articuloActivo.disponible.toFixed(2)} u.</strong></span>
                  <span>
                    Stock Resultante:{' '}
                    <strong>{(articuloActivo.disponible - Math.abs(egresoCantidad || 0)).toFixed(2)} u.</strong>
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEgresoStockModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold uppercase">
                  Registrar Salida de Stock (-)
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
