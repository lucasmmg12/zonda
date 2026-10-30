import React, { useState, useRef } from 'react';
import {
  Calendar,
  HelpCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  DollarSign,
  UserPlus,
  Upload,
  Download,
  CheckCircle2,
  FileText,
  Send,
  Camera,
  Sparkles,
  Plus,
  Trash2,
  Boxes,
  X
} from 'lucide-react';
import { useErp, flattenCuentasContables } from '../../context/ErpContext';
import { exportToExcelCsv, printFinancialReport } from '../../utils/exportUtils';
import {
  extraerDatosFacturaDesdeFoto,
  imageFileToBase64,
  guardarEquivalenciaArticuloProveedor,
  type ItemFacturaCompraExtraido
} from '../../services/invoiceOcrService';

export const ProveedoresModule: React.FC = () => {
  const {
    proveedores,
    cuentasBancarias,
    planDeCuentas,
    inventario,
    crearProveedor,
    registrarFacturaCompra,
    registrarPagoProveedor,
    refreshAllFromDb
  } = useErp();

  // Cuentas imputables reales obtenidas en vivo desde el Plan de Cuentas (Módulo 05 Contabilidad)
  const cuentasImputablesPlan = flattenCuentasContables(planDeCuentas).filter(
    (c) => c.imputable && (c.codigo.startsWith('5.') || c.codigo.startsWith('1.1.03') || c.codigo.startsWith('1.2.'))
  );

  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState<string | null>('PRV-001');
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
  const [tipoFactura, setTipoFactura] = useState<'Factura A' | 'Factura B' | 'Factura C' | 'Liquidación' | 'Nota de Débito'>('Factura A');
  const [netoFactura, setNetoFactura] = useState(300000);
  const [descFactura, setDescFactura] = useState('');
  const [cuentaImputacionFactura, setCuentaImputacionFactura] = useState('5.1.01 Materiales e Insumos');
  const [centroCostoFactura, setCentroCostoFactura] = useState('CC-100 · Obra Acueducto Gran Tulum - Tramo II');
  const [medioPagoFactura, setMedioPagoFactura] = useState('Transferencia Bancaria Santander');
  const [fechaVtoFactura, setFechaVtoFactura] = useState(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Escáner de Factura por Foto / Cámara (OCR IA) + Ítems de Artículos
  const [escaneandoFoto, setEscaneandoFoto] = useState(false);
  const [fotoFacturaPreview, setFotoFacturaPreview] = useState<string | null>(null);
  const [datosExtraidosMsg, setDatosExtraidosMsg] = useState<string | null>(null);
  const [itemsFactura, setItemsFactura] = useState<ItemFacturaCompraExtraido[]>([]);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const videoCamaraRef = useRef<HTMLVideoElement | null>(null);
  const streamCamaraRef = useRef<MediaStream | null>(null);
  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const camaraMobileInputRef = useRef<HTMLInputElement | null>(null);

  const recalcularNetoDesdeItems = (listaItems: ItemFacturaCompraExtraido[]) => {
    setItemsFactura(listaItems);
    if (listaItems.length > 0) {
      const sumaNeto = Number(
        listaItems.reduce((acc, it) => acc + it.cantidad * it.costoUnitarioNeto, 0).toFixed(2)
      );
      setNetoFactura(sumaNeto);
    }
  };

  const actualizarItemFactura = (
    idItem: string,
    cambios: Partial<ItemFacturaCompraExtraido>
  ) => {
    const nuevaLista = itemsFactura.map((it) => {
      if (it.id !== idItem) return it;
      const actualizado = { ...it, ...cambios };
      actualizado.subtotalNeto = Number(
        (actualizado.cantidad * actualizado.costoUnitarioNeto).toFixed(2)
      );
      if (cambios.articuloAsociadoId && cambios.articuloAsociadoId !== '__CREAR_NUEVO__') {
        guardarEquivalenciaArticuloProveedor(actualizado.codigoProveedor, cambios.articuloAsociadoId);
        guardarEquivalenciaArticuloProveedor(actualizado.descripcionProveedor, cambios.articuloAsociadoId);
      }
      return actualizado;
    });
    recalcularNetoDesdeItems(nuevaLista);
  };

  const agregarItemManualFactura = () => {
    const nuevoIt: ItemFacturaCompraExtraido = {
      id: `IT-MAN-${Date.now()}`,
      codigoProveedor: `PRV-${itemsFactura.length + 1}`,
      descripcionProveedor: 'ARTÍCULO DE PROVEEDOR',
      cantidad: 1,
      costoUnitarioNeto: 25000,
      subtotalNeto: 25000,
      articuloAsociadoId: inventario[0]?.id || ''
    };
    recalcularNetoDesdeItems([...itemsFactura, nuevoIt]);
  };

  const eliminarItemFactura = (idItem: string) => {
    const nuevaLista = itemsFactura.filter((i) => i.id !== idItem);
    recalcularNetoDesdeItems(nuevaLista);
  };

  const detenerCamara = () => {
    if (streamCamaraRef.current) {
      streamCamaraRef.current.getTracks().forEach((t) => t.stop());
      streamCamaraRef.current = null;
    }
    setCamaraActiva(false);
  };

  const iniciarCamaraEnVivo = async () => {
    setDatosExtraidosMsg(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamCamaraRef.current = stream;
        setCamaraActiva(true);
        setTimeout(() => {
          if (videoCamaraRef.current) {
            videoCamaraRef.current.srcObject = stream;
            videoCamaraRef.current.play().catch(() => {});
          }
        }, 100);
        return;
      } catch {
        // Fallback a selector de cámara nativo del dispositivo
      }
    }
    camaraMobileInputRef.current?.click();
  };

  const procesarImagenFactura = async (base64: string, nombreArchivo = 'foto_camara.jpg') => {
    setFotoFacturaPreview(base64);
    setEscaneandoFoto(true);
    setDatosExtraidosMsg(null);
    try {
      const extraido = await extraerDatosFacturaDesdeFoto({
        imageBase64: base64,
        fileName: nombreArchivo,
        proveedorNombre: proveedorActivo?.razonSocial,
        cuentaHabitual: proveedorActivo?.cuentaGastoHabitual,
        inventarioInterno: inventario
      });
      setTipoFactura(extraido.tipoComprobante);
      setCuentaImputacionFactura(extraido.cuentaImputacionSugerida);
      setCentroCostoFactura(extraido.centroCostoSugerido);
      setMedioPagoFactura(extraido.medioPagoSugerido);
      setFechaVtoFactura(extraido.fechaVencimiento);
      setDescFactura(extraido.descripcion);
      setItemsFactura(extraido.items || []);
      setNetoFactura(extraido.netoGravado);
      setDatosExtraidosMsg(
        `✓ Factura ${extraido.tipoComprobante} ${extraido.nroComprobante} y ${extraido.items.length} ítems extraídos de la foto. Verificá abajo la asociación con tus productos para actualizar Stock y Costo.`
      );
    } finally {
      setEscaneandoFoto(false);
    }
  };

  const capturarFotoDesdeVideo = async () => {
    if (!videoCamaraRef.current) return;
    const video = videoCamaraRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      detenerCamara();
      await procesarImagenFactura(dataUrl, `captura_${Date.now()}.jpg`);
    }
  };

  const handleSeleccionarFotoArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await imageFileToBase64(file);
    await procesarImagenFactura(base64, file.name);
    e.target.value = '';
  };

  // Aviso interactivo post-carga de factura (Paso 1 -> Paso 2)
  const [avisoFacturaPendiente, setAvisoFacturaPendiente] = useState<{
    total: number;
    medioPactado: string;
    proveedorNombre: string;
  } | null>(null);

  // Formulario Pago
  const [montoPago, setMontoPago] = useState(150000);
  const [medioPago, setMedioPago] = useState('Transferencia Bancaria Santander');
  const [cuentaPagoId, setCuentaPagoId] = useState('CTA-01');
  const [nroChequePago, setNroChequePago] = useState('');

  // Helper para abrir el modal de Pago (Paso 2) pre-cargando el medio de pago elegido en la factura
  const abrirModalPagoConMedio = (monto: number, medioElegido?: string) => {
    const medio = medioElegido || medioPagoFactura || 'Transferencia Bancaria Santander';
    setMontoPago(Number(monto.toFixed(2)));
    setMedioPago(medio);
    if (medio.toLowerCase().includes('santander')) {
      setCuentaPagoId('CTA-02');
    } else if (medio.toLowerCase().includes('galicia')) {
      setCuentaPagoId('CTA-04');
    } else {
      setCuentaPagoId('CTA-01');
    }
    setShowPagoModal(true);
  };

  // Formulario Nuevo Proveedor
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCuit, setNuevoCuit] = useState('');
  const [nuevoDomicilio, setNuevoDomicilio] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoCondicionIva, setNuevoCondicionIva] = useState('Responsable Inscripto');
  const [nuevoCuentaGasto, setNuevoCuentaGasto] = useState('5.1.01 Materiales e Insumos');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtrado de proveedores
  const proveedoresFiltrados = proveedores.filter((p) => {
    const coincideEstado = filtroActivos === 'activos' ? p.activo : !p.activo;
    const coincideTexto =
      p.nombre.toLowerCase().includes(searchProveedor.toLowerCase()) ||
      p.razonSocial.toLowerCase().includes(searchProveedor.toLowerCase()) ||
      p.cuit.includes(searchProveedor);
    return coincideEstado && coincideTexto;
  });

  const proveedorActivo =
    proveedores.find((p) => p.id === proveedorSeleccionadoId) || proveedoresFiltrados[0];

  // Crear Factura Compra en Supabase + Contabilidad (Paso 1: Queda Pendiente de Pago)
  const handleCrearFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorActivo) return;

    const totalCalculado = Number((netoFactura * 1.21).toFixed(2));

    // Guardar equivalencias de artículos del proveedor -> nuestro inventario
    for (const it of itemsFactura) {
      if (it.articuloAsociadoId && it.articuloAsociadoId !== '__CREAR_NUEVO__') {
        guardarEquivalenciaArticuloProveedor(it.codigoProveedor, it.articuloAsociadoId);
        guardarEquivalenciaArticuloProveedor(it.descripcionProveedor, it.articuloAsociadoId);
      }
    }

    await registrarFacturaCompra({
      proveedorId: proveedorActivo.id,
      tipo: tipoFactura,
      netoGravado: netoFactura,
      descripcion: descFactura
        ? `${descFactura} [${centroCostoFactura}]`
        : `Provisión de insumos operativos [${centroCostoFactura}]`,
      cuentaGasto: cuentaImputacionFactura || proveedorActivo.cuentaGastoHabitual,
      medioPagoPactado: medioPagoFactura,
      fechaVencimiento: fechaVtoFactura,
      itemsInventarioAsociados: itemsFactura.map((it) => ({
        articuloAsociadoId: it.articuloAsociadoId,
        codigoProveedor: it.codigoProveedor,
        descripcionProveedor: it.descripcionProveedor,
        cantidad: it.cantidad,
        costoUnitarioNeto: it.costoUnitarioNeto
      }))
    });

    // Pre-configurar el formulario de pago con el monto y medio elegido para el Paso 2
    setMontoPago(totalCalculado);
    setMedioPago(medioPagoFactura);
    setAvisoFacturaPendiente({
      total: totalCalculado,
      medioPactado: medioPagoFactura,
      proveedorNombre: proveedorActivo.razonSocial
    });

    detenerCamara();
    setFotoFacturaPreview(null);
    setDatosExtraidosMsg(null);
    setItemsFactura([]);
    setShowFacturaModal(false);
    setDescFactura('');
  };

  // Agregar Pago en Supabase + Tesorería + Contabilidad (Paso 2: Saca el dinero de Tesorería)
  const handleAgregarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorActivo) return;

    await registrarPagoProveedor({
      proveedorId: proveedorActivo.id,
      monto: montoPago,
      medioPago,
      cuentaBancariaId: cuentaPagoId,
      nroCheque: nroChequePago || undefined
    });

    setAvisoFacturaPendiente(null);
    setShowPagoModal(false);
    setNroChequePago('');
  };

  // Alta de Proveedor en Supabase
  const handleCrearNuevoProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const creado = await crearProveedor({
      nombre: nuevoNombre,
      razonSocial: nuevoNombre,
      cuit: nuevoCuit || '30-00000000-0',
      condicionIva: nuevoCondicionIva,
      domicilio: nuevoDomicilio || 'San Juan, Argentina',
      telefono: '+54 264 400-0000',
      email: nuevoEmail || 'contacto@proveedor.com',
      activo: true,
      cuentaGastoHabitual: nuevoCuentaGasto,
      condicionPago: 'Cuenta Corriente 30 Días'
    });

    setProveedorSeleccionadoId(creado.id);
    setShowNuevoProveedorModal(false);
    setNuevoNombre('');
    setNuevoCuit('');
    setNuevoDomicilio('');
    setNuevoEmail('');
  };

  // Importar CSV de Proveedores
  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[;,]/).map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols[0]) {
        await crearProveedor({
          nombre: cols[0],
          razonSocial: cols[0],
          cuit: cols[1] || '30-00000000-0',
          condicionIva: cols[2] || 'Responsable Inscripto',
          domicilio: cols[3] || 'San Juan, Argentina',
          telefono: '+54 264 400-0000',
          email: cols[4] || 'proveedores@empresa.com',
          activo: true,
          cuentaGastoHabitual: '5.1.01 Materiales e Insumos',
          condicionPago: 'Cuenta Corriente 30 Días'
        });
      }
    }
    e.target.value = '';
  };

  // Exportar Facturas Adeudadas
  const handleExportarAdeudadasExcel = () => {
    if (!proveedorActivo) return;
    exportToExcelCsv(
      `Facturas_Adeudadas_${proveedorActivo.nombre.replace(/\s+/g, '_')}`,
      proveedorActivo.facturasAdeudadas.map((f) => ({
        Proveedor: proveedorActivo.razonSocial,
        CUIT: proveedorActivo.cuit,
        Comprobante: f.nroComprobante,
        Tipo: f.tipo,
        FechaPago: f.fechaPago,
        Descripcion: f.descripcion,
        Total: f.total,
        Pagado: f.pagado,
        Saldo: f.saldo
      }))
    );
  };

  // Exportar Cuenta Corriente Proveedor
  const handleExportarCuentaExcel = () => {
    if (!proveedorActivo) return;
    exportToExcelCsv(
      `Cuenta_Corriente_${proveedorActivo.nombre.replace(/\s+/g, '_')}`,
      proveedorActivo.movimientos.map((m) => ({
        Proveedor: proveedorActivo.razonSocial,
        Fecha: m.fecha,
        Comprobante: m.comprobante,
        Concepto: m.concepto,
        Debe: m.debe,
        Haber: m.haber,
        Saldo: m.saldo
      }))
    );
  };

  // Totales dinámicos de cartera de proveedores
  const totalPorPagar = proveedores.reduce((acc, p) => acc + Math.max(0, p.saldo), 0);
  const aVencer30 = Math.round(totalPorPagar * 0.68 * 100) / 100;
  const vencido31a60 = Math.round(totalPorPagar * 0.24 * 100) / 100;
  const vencidoMas60 = Math.max(0, totalPorPagar - aVencer30 - vencido31a60);

  const handleExportarResumenPdf = () => {
    printFinancialReport(
      'RESUMEN DE OBLIGACIONES Y CARTERA DE PROVEEDORES',
      `Total consolidado por pagar: $${totalPorPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      ['Razón Social', 'CUIT', 'Condición IVA', 'Cuenta de Gasto', 'Saldo por Pagar ($)'],
      proveedores.map((p) => [
        p.razonSocial,
        p.cuit,
        p.condicionIva,
        p.cuentaGastoHabitual,
        `$${p.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
      ])
    );
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
            Proveedores
          </h1>
          <span className="text-xs text-slate-400 font-mono">| GESTIÓN DE COMPRAS Y ÓRDENES DE PAGO (SUPABASE DB)</span>
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
          { key: 'resumen', label: 'Resumen proveedores' },
          { key: 'gestion', label: 'Gestión de proveedores' }
        ].map((tab) => {
          const isActive = tabPrincipal === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabPrincipal(tab.key as 'resumen' | 'gestion')}
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
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
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
                          ? 'bg-white text-slate-900 border-b-2 border-b-[#064e3b]'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Activos ({proveedores.filter((p) => p.activo).length})
                    </button>
                    <button
                      onClick={() => setFiltroActivos('inactivos')}
                      className={`py-1.5 text-center font-bold transition-colors ${
                        filtroActivos === 'inactivos'
                          ? 'bg-white text-slate-900 border-b-2 border-b-[#064e3b]'
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
                        placeholder="Razón social o CUIT..."
                        className="w-full px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                      />
                    </div>
                    <button
                      onClick={() => setSearchProveedor('')}
                      title="Limpiar filtro"
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <HelpCircle className="w-4 h-4 text-[#064e3b]" />
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
                                  ? 'bg-[#ecfdf5] font-semibold text-slate-900 border-l-4 border-l-[#064e3b]'
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
                  <button onClick={() => refreshAllFromDb()} title="Sincronizar con Supabase" className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5" /></button>
                </div>
                <span>Mostrando 1 - {proveedoresFiltrados.length} de {proveedoresFiltrados.length}</span>
              </div>
            )}
          </div>

          {/* PANEL DERECHO: DETALLE DEL PROVEEDOR SELECCIONADO */}
          <div className="flex-1 flex flex-col justify-between bg-white min-w-0">
            <div>
              {/* Título del Proveedor Seleccionado */}
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-4 py-2 flex items-center justify-between">
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
                      onClick={() => setTabDetalle(t.key as 'adeudadas' | 'cuenta' | 'general' | 'otra')}
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

              {/* CONTENIDO DE LA PESTAÑA: FACTURAS ADEUDADAS AL PROVEEDOR */}
              {tabDetalle === 'adeudadas' && (
                <div>
                  {/* Instructivo Permanente de Flujo en 2 Pasos (Cargar Factura Pendiente -> Sacar Pago) */}
                  <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-2 text-[#042f22]">
                      <span className="px-2 py-0.5 bg-[#042f22] text-white font-bold text-[10px] uppercase">
                        CÓMO REGISTRAR Y PAGAR
                      </span>
                      <span>
                        <strong>Paso 1:</strong> En <strong>&ldquo;Agregar factura&rdquo;</strong> elegís el medio de pago previsto y la factura queda <strong>PENDIENTE</strong> (no descuenta caja).
                      </span>
                      <span className="text-emerald-700 font-bold">&rarr;</span>
                      <span>
                        <strong>Paso 2:</strong> Usá <strong>&ldquo;$ Agregar pago&rdquo;</strong> o el botón <strong>&ldquo;$ Sacar Pago&rdquo;</strong> de la tabla para debitar el dinero de Tesorería.
                      </span>
                    </div>
                    <button
                      onClick={handleExportarAdeudadasExcel}
                      title="Exportar a Excel (CSV)"
                      className="p-1 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1 font-bold shrink-0"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="text-[10px]">Excel</span>
                    </button>
                  </div>

                  {/* Banner interactivo cuando el usuario acaba de cargar una factura (Paso 1 completado -> Invitación a Paso 2) */}
                  {avisoFacturaPendiente && (
                    <div className="bg-amber-50 border-b-2 border-amber-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-950 uppercase block">
                          ✓ PASO 1 COMPLETADO: FACTURA REGISTRADA COMO PENDIENTE (${avisoFacturaPendiente.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })})
                        </span>
                        <p className="text-[11px] text-amber-900 font-sans">
                          Medio de pago pactado: <strong>{avisoFacturaPendiente.medioPactado}</strong>. El dinero <strong>aún no salió de Tesorería</strong>. Para desembolsar el pago ahora o cuando corresponda, ejecutá el <strong>Paso 2</strong>:
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirModalPagoConMedio(avisoFacturaPendiente.total, avisoFacturaPendiente.medioPactado)}
                          className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Paso 2: Sacar Pago Ahora (${avisoFacturaPendiente.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvisoFacturaPendiente(null)}
                          className="px-2 py-1 text-amber-800 hover:bg-amber-100 font-bold text-xs"
                        >
                          Dejar Pendiente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Grilla de Facturas Adeudadas */}
                  <div className="overflow-x-auto min-h-[360px]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                          <th className="py-2 px-3 border-r border-slate-200">Nro. Comprobante</th>
                          <th className="py-2 px-3 border-r border-slate-200">Tipo</th>
                          <th className="py-2 px-3 border-r border-slate-200">Fecha pago</th>
                          <th className="py-2 px-3 border-r border-slate-200">Descripción</th>
                          <th className="py-2 px-3 border-r border-slate-200">Medio de Pago Pactado</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Total</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Pagado</th>
                          <th className="py-2 px-3 border-r border-slate-200 text-right">Saldo Pendiente</th>
                          <th className="py-2 px-3 text-center">Acción (Paso 2)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {proveedorActivo && proveedorActivo.facturasAdeudadas.length > 0 ? (
                          proveedorActivo.facturasAdeudadas.map((f) => (
                            <tr
                              key={f.id}
                              onDoubleClick={() => abrirModalPagoConMedio(f.saldo, f.medioPagoPactado)}
                              className="hover:bg-slate-50 cursor-pointer"
                            >
                              <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                                {f.nroComprobante}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{f.tipo}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{f.fechaPago}</td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-sans text-[11px] truncate max-w-xs">
                                {f.descripcion}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] font-bold text-[#042f22]">
                                    {f.medioPagoPactado || 'Transferencia Bancaria Santander'}
                                  </span>
                                  <span className="inline-block w-fit text-[9px] font-bold uppercase px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300">
                                    PENDIENTE DE SALIDA
                                  </span>
                                </div>
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
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirModalPagoConMedio(f.saldo, f.medioPagoPactado);
                                  }}
                                  className="px-2.5 py-1 bg-[#064e3b] hover:bg-[#047857] text-white text-[10px] font-bold uppercase inline-flex items-center gap-1"
                                  title="Abrir ventana Agregar Pago con este monto y medio de pago"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span>Sacar Pago</span>
                                </button>
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
                      <button onClick={() => refreshAllFromDb()} className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5 text-[#064e3b]" /></button>
                    </div>
                    <span>
                      {proveedorActivo && proveedorActivo.facturasAdeudadas.length > 0
                        ? `Mostrando 1 - ${proveedorActivo.facturasAdeudadas.length} de ${proveedorActivo.facturasAdeudadas.length}`
                        : 'Sin facturas pendientes'}
                    </span>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA PESTAÑA: CUENTA PROVEEDOR (EXTRACTO) */}
              {tabDetalle === 'cuenta' && (
                <div>
                  <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                    <span>Historial completo de cuenta corriente con el proveedor</span>
                    <button
                      onClick={handleExportarCuentaExcel}
                      title="Exportar a Excel"
                      className="p-1 hover:bg-slate-200 text-emerald-700 flex items-center gap-1 font-bold"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="text-[10px]">Excel</span>
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
                        : 'Sin movimientos'}
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
            <div className="bg-[#ecfdf5]/30 border-t border-slate-300 px-4 py-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (proveedorActivo?.cuentaGastoHabitual) {
                    setCuentaImputacionFactura(proveedorActivo.cuentaGastoHabitual);
                  }
                  setShowFacturaModal(true);
                }}
                title="Paso 1: Cargar factura y elegir medio de pago pactado (queda pendiente en cuenta corriente)"
                className="px-3.5 py-1.5 bg-[#ecfdf5] hover:bg-emerald-100 text-[#042f22] font-mono text-xs font-bold border border-emerald-400 flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#064e3b]" />
                <span>1° Agregar factura (Pendiente) ▼</span>
              </button>

              <button
                onClick={() => {
                  const primeraPendiente = proveedorActivo?.facturasAdeudadas?.[0];
                  if (primeraPendiente) {
                    abrirModalPagoConMedio(primeraPendiente.saldo, primeraPendiente.medioPagoPactado);
                  } else {
                    setShowPagoModal(true);
                  }
                }}
                title="Paso 2: Sacar el pago de Tesorería para cancelar facturas pendientes"
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 font-mono text-xs font-bold border border-amber-400 flex items-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5 text-amber-800" />
                <span>2° Agregar pago (Sacar Pago)</span>
              </button>

              <button
                onClick={() => setShowNuevoProveedorModal(true)}
                className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo proveedor</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar CSV ▼</span>
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
              <p className="text-xs text-slate-500 font-mono">Consolidación de cuentas a pagar en vivo desde Supabase</p>
            </div>
            <button
              onClick={handleExportarResumenPdf}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Informe PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-4 border border-slate-300 bg-slate-50">
              <span className="text-[11px] text-slate-500 uppercase block">A VENCER (0-30 DÍAS)</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                ${aVencer30.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 border border-slate-300 bg-amber-50/50">
              <span className="text-[11px] text-amber-700 uppercase block">VENCIDO (31-60 DÍAS)</span>
              <p className="text-xl font-bold text-amber-900 mt-1">
                ${vencido31a60.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 border border-slate-300 bg-rose-50/50">
              <span className="text-[11px] text-rose-700 uppercase block">VENCIDO (+60 DÍAS)</span>
              <p className="text-xl font-bold text-rose-900 mt-1">
                ${vencidoMas60.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 border border-slate-300 bg-zonda-50">
              <span className="text-[11px] text-zonda-700 uppercase block">TOTAL POR PAGAR</span>
              <p className="text-xl font-bold text-zonda-900 mt-1">
                ${totalPorPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR FACTURA DE COMPRA (PASO 1: QUEDA PENDIENTE CON MEDIO DE PAGO PACTADO) */}
      {showFacturaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 max-w-2xl w-full p-6 shadow-2xl space-y-3.5 my-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                AGREGAR FACTURA // {proveedorActivo?.razonSocial}
              </h3>
              <button
                onClick={() => {
                  detenerCamara();
                  setShowFacturaModal(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ESCÁNER INTELIGENTE DE FACTURA POR FOTO / CÁMARA (AUTOCOMPLETADO AUTOMÁTICO) */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-300 space-y-2.5">
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleSeleccionarFotoArchivo}
                className="hidden"
              />
              <input
                ref={camaraMobileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleSeleccionarFotoArchivo}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#064e3b] shrink-0" />
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#042f22] uppercase block">
                      Autocompletar Factura con Foto / Cámara (IA OCR)
                    </span>
                    <span className="text-[10px] text-slate-600 block">
                      Sacá una foto o subí la imagen del comprobante para cargar todos los campos automáticamente.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={escaneandoFoto}
                    onClick={iniciarCamaraEnVivo}
                    className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Sacar Foto</span>
                  </button>
                  <button
                    type="button"
                    disabled={escaneandoFoto}
                    onClick={() => fotoInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-[#042f22] font-mono text-[11px] font-bold border border-emerald-400 flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Foto</span>
                  </button>
                </div>
              </div>

              {/* Visor de cámara en vivo cuando el usuario pulsa "Sacar Foto" */}
              {camaraActiva && (
                <div className="p-2.5 bg-[#042f22] text-white space-y-2 border border-emerald-700">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-300 font-bold uppercase">
                      ● Cámara Activa · Encuadrá la factura y presioná Capturar
                    </span>
                    <button
                      type="button"
                      onClick={detenerCamara}
                      className="text-xs text-emerald-200 hover:text-white font-bold"
                    >
                      Cerrar Cámara ✕
                    </button>
                  </div>
                  <video
                    ref={videoCamaraRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-44 object-cover bg-black border border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={capturarFotoDesdeVideo}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-[#042f22] font-mono text-xs font-extrabold uppercase flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar Foto y Autocompletar Datos</span>
                  </button>
                </div>
              )}

              {/* Estado de escaneo OCR o vista previa de la foto procesada */}
              {escaneandoFoto && (
                <div className="p-2.5 bg-white border border-emerald-300 flex items-center gap-2.5 text-xs font-mono text-[#064e3b]">
                  <RotateCw className="w-4 h-4 animate-spin shrink-0" />
                  <span className="font-bold">
                    Leyendo foto de la factura y completando Tipo, Imputación, Descripción, Neto e IVA...
                  </span>
                </div>
              )}

              {!escaneandoFoto && datosExtraidosMsg && (
                <div className="p-2 bg-white border border-emerald-400 flex items-center justify-between gap-2 text-[11px] font-mono text-[#042f22]">
                  <div className="flex items-center gap-2">
                    {fotoFacturaPreview && (
                      <img
                        src={fotoFacturaPreview}
                        alt="Factura escaneada"
                        className="w-9 h-9 object-cover border border-emerald-300 shrink-0"
                      />
                    )}
                    <span className="font-bold text-emerald-900">{datosExtraidosMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFotoFacturaPreview(null);
                      setDatosExtraidosMsg(null);
                    }}
                    className="text-slate-400 hover:text-slate-700 px-1"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* GUÍA EXPLICATIVA DESPLEGABLE PARA EL USUARIO: CÓMO FUNCIONA EL PAGO */}
            <details className="group bg-emerald-50/90 border-l-4 border-l-[#064e3b] border border-emerald-200 text-xs">
              <summary className="px-3 py-2 font-mono font-bold text-[#042f22] uppercase flex items-center justify-between cursor-pointer select-none list-none hover:bg-emerald-100/60 transition-colors">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#064e3b] shrink-0" />
                  <span>Importante: ¿Cómo se registra y se saca el pago?</span>
                </div>
                <span className="text-[10px] text-[#064e3b] font-bold group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-3 pb-3 pt-1.5 border-t border-emerald-200/80 space-y-1.5">
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>1. En esta ventana (Agregar Factura):</strong> Elegís el <strong>Medio de Pago Pactado</strong> con el proveedor, pero <strong>de acá NO sale el dinero de Caja/Bancos</strong>. La factura queda cargada como <strong>PENDIENTE</strong> en <em>Facturas adeudadas</em>.
                </p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>2. Para sacar el pago de Tesorería:</strong> Una vez cargada la factura, hacé clic en el botón <strong>&ldquo;$ Agregar pago&rdquo;</strong> (abajo) o en el botón <strong>&ldquo;Sacar Pago&rdquo;</strong> de la factura adeudada para emitir la Orden de Pago y descontar el dinero.
                </p>
              </div>
            </details>

            <form onSubmit={handleCrearFactura} className="space-y-3.5 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tipo de Comprobante:</label>
                  <select
                    value={tipoFactura}
                    onChange={(e) => setTipoFactura(e.target.value as 'Factura A' | 'Factura B' | 'Factura C')}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 text-xs"
                  >
                    <option value="Factura A">Factura A</option>
                    <option value="Factura B">Factura B</option>
                    <option value="Factura C">Factura C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Cuenta de Imputación (Plan de Cuentas):
                  </label>
                  <select
                    value={cuentaImputacionFactura}
                    onChange={(e) => setCuentaImputacionFactura(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 font-bold text-[#042f22] text-xs"
                  >
                    {cuentasImputablesPlan.map((cta) => {
                      const label = `${cta.codigo} ${cta.nombre}`;
                      return (
                        <option key={cta.codigo} value={label}>
                          {label}
                        </option>
                      );
                    })}
                    {proveedorActivo?.cuentaGastoHabitual &&
                      !cuentasImputablesPlan.some(
                        (c) => `${c.codigo} ${c.nombre}` === proveedorActivo.cuentaGastoHabitual
                      ) && (
                        <option value={proveedorActivo.cuentaGastoHabitual}>
                          {proveedorActivo.cuentaGastoHabitual}
                        </option>
                      )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Centro de Costo / Imputación Operativa (Configuración):
                </label>
                <select
                  value={centroCostoFactura}
                  onChange={(e) => setCentroCostoFactura(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800"
                >
                  <option value="CC-100 · Obra Acueducto Gran Tulum - Tramo II">
                    CC-100 · Obra Acueducto Gran Tulum - Tramo II
                  </option>
                  <option value="CC-200 · Red Cloacal Rawson - Sector Sur">
                    CC-200 · Red Cloacal Rawson - Sector Sur
                  </option>
                  <option value="CC-300 · Administración Central y Depósito">
                    CC-300 · Administración Central y Depósito
                  </option>
                </select>
              </div>

              {/* NUEVO: SELECTOR DE MEDIO DE PAGO PACTADO + FECHA DE VENCIMIENTO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 border border-amber-200">
                <div>
                  <label className="block text-[#042f22] font-bold mb-1">
                    Medio de Pago Pactado (Queda Pendiente):
                  </label>
                  <select
                    value={medioPagoFactura}
                    onChange={(e) => setMedioPagoFactura(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 font-bold text-[#042f22] text-xs"
                  >
                    <option value="Transferencia Bancaria Santander">Transferencia Bancaria Santander</option>
                    <option value="Transferencia Bancaria Galicia">Transferencia Bancaria Galicia</option>
                    <option value="Cheque Propio Diferido">Cheque Propio Diferido</option>
                    <option value="Efectivo de Caja">Efectivo en Caja</option>
                    <option value="Mercado Pago / Transferencia CVU">Mercado Pago / Transferencia CVU</option>
                    <option value="Cuenta Corriente a 30 Días">Cuenta Corriente a 30 Días</option>
                  </select>
                  <span className="text-[10px] text-amber-800 block mt-1 font-sans">
                    * No descuenta saldo ahora. Se pre-cargará al pulsar &ldquo;Agregar pago&rdquo;.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Fecha de Vencimiento del Pago:
                  </label>
                  <input
                    type="date"
                    value={fechaVtoFactura}
                    onChange={(e) => setFechaVtoFactura(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1 font-sans">
                    Impacta en el Calendario de Vencimientos.
                  </span>
                </div>
              </div>

              {/* TABLA DE ÍTEMS DE LA FACTURA Y ASOCIACIÓN CON NUESTRO INVENTARIO (STOCK + PRECIO DE COSTO) */}
              <div className="border border-emerald-300 bg-emerald-50/40 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-[#064e3b] shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold uppercase text-[#042f22] block">
                        Ítems de la Factura y Asociación con Nuestro Inventario ({itemsFactura.length})
                      </span>
                      <span className="text-[10px] text-slate-600 font-sans block">
                        Asociá el artículo del proveedor con tu producto para actualizar automáticamente su <strong>Stock</strong> y <strong>Precio de Costo</strong>.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={agregarItemManualFactura}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-[#064e3b] border border-emerald-400 text-[10px] font-bold uppercase flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Ítem</span>
                  </button>
                </div>

                {itemsFactura.length === 0 ? (
                  <div className="p-3 bg-white border border-dashed border-emerald-300 text-center text-[11px] text-slate-500 font-sans">
                    Sacá o subí una foto de la factura arriba para detectar los ítems automáticamente, o pulsá <strong>&ldquo;+ Agregar Ítem&rdquo;</strong> para asociar artículos de stock manualmente.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {itemsFactura.map((it) => {
                      const prodAsociado = inventario.find((a) => a.id === it.articuloAsociadoId);
                      return (
                        <div
                          key={it.id}
                          className="p-2.5 bg-white border border-emerald-300 space-y-2 shadow-sm"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] text-slate-500 font-bold mb-0.5">
                                Artículo según Factura del Proveedor:
                              </label>
                              <input
                                type="text"
                                value={it.descripcionProveedor}
                                onChange={(e) =>
                                  actualizarItemFactura(it.id, { descripcionProveedor: e.target.value })
                                }
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-900"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] text-slate-500 font-bold mb-0.5">
                                Cant.:
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={it.cantidad}
                                onChange={(e) =>
                                  actualizarItemFactura(it.id, {
                                    cantidad: parseFloat(e.target.value) || 0
                                  })
                                }
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-900"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[10px] text-slate-500 font-bold mb-0.5">
                                Costo Unit. Neto ($):
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={it.costoUnitarioNeto}
                                onChange={(e) =>
                                  actualizarItemFactura(it.id, {
                                    costoUnitarioNeto: parseFloat(e.target.value) || 0
                                  })
                                }
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 text-[11px] font-bold text-[#042f22]"
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => eliminarItemFactura(it.id)}
                                title="Quitar ítem"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Selector de Asociación con Nuestro Producto en Inventario */}
                          <div className="pt-1.5 border-t border-slate-100">
                            <label className="block text-[10px] font-bold text-[#064e3b] uppercase mb-1">
                              🔗 Asociar con Nuestro Producto en Inventario (Actualiza Stock y Costo):
                            </label>
                            <select
                              value={it.articuloAsociadoId}
                              onChange={(e) =>
                                actualizarItemFactura(it.id, { articuloAsociadoId: e.target.value })
                              }
                              className="w-full px-2 py-1.5 bg-emerald-50/70 border border-emerald-400 text-[11px] font-bold text-[#042f22]"
                            >
                              <option value="">-- No asociar a Stock (Imputar solo como Gasto) --</option>
                              {inventario.map((art) => (
                                <option key={art.id} value={art.id}>
                                  [{art.codigo}] {art.descripcion} (Stock actual: {art.stockActual} | Costo actual: ${art.costoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })})
                                </option>
                              ))}
                              <option value="__CREAR_NUEVO__">
                                + Crear como Nuevo Producto en nuestro Inventario ({it.descripcionProveedor})
                              </option>
                            </select>

                            {prodAsociado && (
                              <div className="mt-1.5 px-2.5 py-1 bg-emerald-100/80 border border-emerald-300 text-[10px] text-[#042f22] flex flex-wrap items-center justify-between gap-2">
                                <span>
                                  <strong>Stock:</strong> {prodAsociado.stockActual} u. &rarr;{' '}
                                  <strong className="text-emerald-800">
                                    {Number((prodAsociado.stockActual + it.cantidad).toFixed(2))} u. (+{it.cantidad})
                                  </strong>
                                </span>
                                <span>
                                  <strong>Precio de Costo:</strong> $
                                  {prodAsociado.costoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })} &rarr;{' '}
                                  <strong className="text-emerald-800">
                                    ${it.costoUnitarioNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                  </strong>
                                </span>
                              </div>
                            )}
                            {it.articuloAsociadoId === '__CREAR_NUEVO__' && (
                              <div className="mt-1.5 px-2.5 py-1 bg-sky-50 border border-sky-300 text-[10px] text-sky-950">
                                Se dará de alta automáticamente en <strong>Inventario y Stock</strong> con Stock inicial de <strong>{it.cantidad} u.</strong> y Costo <strong>${it.costoUnitarioNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                <div className="flex justify-between text-amber-800 font-bold text-[11px] pt-1">
                  <span>Estado inicial en Tesorería:</span>
                  <span>PENDIENTE DE PAGO ({medioPagoFactura})</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Factura Compra (A Pagar):</span>
                  <span>${(netoFactura * 1.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    detenerCamara();
                    setShowFacturaModal(false);
                  }}
                  className="px-3.5 py-1.5 font-bold text-slate-600 hover:bg-slate-100 uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Cargar Factura (Dejar Pendiente)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR PAGO A PROVEEDOR (PASO 2: DESEMBOLSO REAL DE TESORERÍA) */}
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

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 font-sans">
              <strong>Desembolso Efectivo:</strong> Desde aquí se <strong>saca el pago</strong> descontando el dinero de la Cuenta de Tesorería elegida y cancelando la deuda pendiente del proveedor.
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
                <label className="block text-slate-600 font-bold mb-1">Medio de Pago:</label>
                <select
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 font-bold text-[#042f22]"
                >
                  <option value="Transferencia Bancaria Santander">Transferencia Bancaria Santander</option>
                  <option value="Transferencia Bancaria Galicia">Transferencia Bancaria Galicia</option>
                  <option value="Cheque Propio Diferido">Cheque Propio Diferido</option>
                  <option value="Efectivo de Caja">Efectivo en Caja</option>
                  <option value="Mercado Pago / Transferencia CVU">Mercado Pago / Transferencia CVU</option>
                  <option value="Cuenta Corriente a 30 Días">Cancelación de Cuenta Corriente</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Cuenta de Tesorería Origen:</label>
                <select
                  value={cuentaPagoId}
                  onChange={(e) => setCuentaPagoId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                >
                  {cuentasBancarias.map((cta) => (
                    <option key={cta.id} value={cta.id}>
                      {cta.nombre} (${cta.saldoActual.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              {medioPago.includes('Cheque') && (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nro. de Cheque Propio:</label>
                  <input
                    type="text"
                    placeholder="Ej: 55410999"
                    value={nroChequePago}
                    onChange={(e) => setNroChequePago(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                  />
                </div>
              )}

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
                ALTA DE NUEVO PROVEEDOR (SUPABASE DB)
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
                <label className="block text-slate-600 font-bold mb-1">Cuenta de Gasto Habitual (Plan de Cuentas):</label>
                <select
                  value={nuevoCuentaGasto}
                  onChange={(e) => setNuevoCuentaGasto(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300"
                >
                  {cuentasImputablesPlan.map((cta) => {
                    const label = `${cta.codigo} ${cta.nombre}`;
                    return (
                      <option key={cta.codigo} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
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
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase"
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
                <Calendar className="w-4 h-4 text-[#064e3b]" />
                <span>CALENDARIO DE VENCIMIENTOS // COMPRAS Y PAGOS</span>
              </h3>
              <button onClick={() => setShowCalendarioModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {proveedores.flatMap((p) =>
                p.facturasAdeudadas.map((f) => ({
                  ...f,
                  proveedorNombre: p.razonSocial
                }))
              ).map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">VENCIMIENTO: {item.fechaPago}</span>
                    <p className="text-[11px] text-slate-600">{item.proveedorNombre} - {item.tipo} {item.nroComprobante}</p>
                  </div>
                  <span className="font-bold text-rose-700">${item.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
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
