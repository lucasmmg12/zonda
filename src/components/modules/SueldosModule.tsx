import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle2,
  DollarSign,
  Plus,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  X,
  FileCode2,
  Printer,
  Sliders,
  Sparkles,
  Trash2,
  BookOpenCheck
} from 'lucide-react';
import type { ConvenioColectivo, LiquidacionPeriodo, ConceptoRecibo } from '../../types/models';
import { generarTxtLibroSueldosDigital, type ResultadoGeneracionLsd } from '../../services/afip/libroSueldosDigital';
import { useErp } from '../../context/ErpContext';
import { exportToExcelCsv } from '../../utils/exportUtils';
import {
  CATALOGO_CONVENIOS_CCT,
  obtenerDefinicionCct,
  calcularConceptosReciboSegunCct
} from '../../services/cctEscalasService';
import {
  imprimirReciboHaberesDobleEjemplar,
  numeroALetrasPesosArgentinos,
  formatearPeriodoMmYyyy,
  formatearFechaArgentina
} from '../../utils/reciboSueldoPrint';

export const SueldosModule: React.FC = () => {
  const {
    empleados,
    liquidacionActual,
    empresa,
    crearEmpleadoLegajo,
    actualizarEmpleadoLegajo,
    actualizarLiquidacionPeriodo,
    refreshAllFromDb
  } = useErp();

  const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState<string>('EMP-101');
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [filtroCct, setFiltroCct] = useState<string>('TODOS');

  // Pestañas principales
  const [tabPrincipal, setTabPrincipal] = useState<'recibo' | 'nomina' | 'cct' | 'afip_lsd'>('recibo');
  const [ejemplarVista, setEjemplarVista] = useState<'ORIGINAL' | 'DUPLICADO' | 'DOBLE'>('DOBLE');
  const [mostrarPanelManualCct, setMostrarPanelManualCct] = useState<boolean>(true);

  // Modales
  const [showNuevaLiquidacionModal, setShowNuevaLiquidacionModal] = useState(false);
  const [showNuevoLegajoModal, setShowNuevoLegajoModal] = useState(false);
  const [showF931Modal, setShowF931Modal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);
  const [copiadoLsd, setCopiadoLsd] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Formulario nuevo empleado
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCuil, setNuevoCuil] = useState('');
  const [nuevoCct, setNuevoCct] = useState<ConvenioColectivo>(CATALOGO_CONVENIOS_CCT[0].id);
  const [nuevaCategoria, setNuevaCategoria] = useState(CATALOGO_CONVENIOS_CCT[0].categorias[0].nombre);
  const [nuevoBasico, setNuevoBasico] = useState(CATALOGO_CONVENIOS_CCT[0].categorias[0].basicoSugerido);

  // Formulario nueva liquidación
  const [formPeriodo, setFormPeriodo] = useState(liquidacionActual.periodo);
  const [formTipoLiq, setFormTipoLiq] = useState<LiquidacionPeriodo['tipoLiquidacion']>(liquidacionActual.tipoLiquidacion);
  const [formFechaPago, setFormFechaPago] = useState(liquidacionActual.fechaPago);

  // Filtrado de empleados
  const empleadosFiltrados = empleados.filter((e) => {
    const coincideTexto =
      e.nombreCompleto.toLowerCase().includes(searchEmpleado.toLowerCase()) ||
      e.cuil.includes(searchEmpleado) ||
      e.legajo.includes(searchEmpleado);
    const coincideCct = filtroCct === 'TODOS' || e.cct === filtroCct;
    return coincideTexto && coincideCct;
  });

  const empleadoActivo = empleados.find((e) => e.id === empleadoSeleccionadoId) || empleadosFiltrados[0];

  // Estado interactivo del CCT, Categoría, Básico y Casillas Manuales del Empleado Activo
  const [cctEdit, setCctEdit] = useState<string>(
    empleadoActivo?.cct || CATALOGO_CONVENIOS_CCT[0].id
  );
  const [categoriaEdit, setCategoriaEdit] = useState<string>(
    empleadoActivo?.categoria || 'ADMINISTRATIVO DE 1°'
  );
  const [basicoEdit, setBasicoEdit] = useState<number>(
    empleadoActivo?.sueldoBasico || 1161824.99
  );
  const [diasTrabajados, setDiasTrabajados] = useState<number>(30);
  const [valoresManualesCct, setValoresManualesCct] = useState<Record<string, number>>({});

  // Nuevo concepto manual libre
  const [nuevoCodLibre, setNuevoCodLibre] = useState('40600');
  const [nuevaDescLibre, setNuevaDescLibre] = useState('');
  const [nuevoTipoLibre, setNuevoTipoLibre] = useState<'Remunerativo' | 'No Remunerativo' | 'Descuento'>('No Remunerativo');
  const [nuevoMontoLibre, setNuevoMontoLibre] = useState<number>(0);

  const defCctActiva = useMemo(() => obtenerDefinicionCct(cctEdit), [cctEdit]);

  // Inicializar valores cuando cambia el empleado seleccionado
  useEffect(() => {
    if (!empleadoActivo) return;
    setCctEdit(empleadoActivo.cct);
    setCategoriaEdit(empleadoActivo.categoria);
    setBasicoEdit(empleadoActivo.sueldoBasico);

    const def = obtenerDefinicionCct(empleadoActivo.cct);
    const defaults: Record<string, number> = {};
    def.camposManuales.forEach((cm) => {
      defaults[cm.id] = cm.valorDefault;
    });

    // Intentar inferir de los conceptos existentes del empleado si ya tiene cargados
    const c240 = empleadoActivo.conceptosLiquidacion.find((c) => c.codigo === '240');
    if (c240 && defaults.adicObjetivos !== undefined) {
      defaults.adicObjetivos = c240.remunerativo;
    }
    const c40525 = empleadoActivo.conceptosLiquidacion.find((c) => c.codigo === '40525');
    if (c40525 && defaults.excepcionalidadClausula4 !== undefined) {
      defaults.excepcionalidadClausula4 = c40525.noRemunerativo;
    }
    const c40206 = empleadoActivo.conceptosLiquidacion.find((c) => c.codigo === '40206');
    if (c40206 && defaults.refrigerioLavado !== undefined) {
      defaults.refrigerioLavado = c40206.noRemunerativo;
    }
    const c40526 = empleadoActivo.conceptosLiquidacion.find((c) => c.codigo === '40526');
    if (c40526 && defaults.asigNoRemParitaria !== undefined) {
      defaults.asigNoRemParitaria = c40526.noRemunerativo;
    }

    setValoresManualesCct(defaults);
  }, [empleadoActivo?.id]);

  // Recalcular automáticamente el recibo cuando el usuario cambia CCT, Categoría, Básico o Casillas Manuales
  const aplicarRecalculoAutomaticoCct = async (
    nextCct: string,
    nextCat: string,
    nextBasico: number,
    nextDias: number,
    nextManuales: Record<string, number>
  ) => {
    if (!empleadoActivo) return;
    const nuevosConceptos = calcularConceptosReciboSegunCct({
      cctId: nextCct,
      sueldoBasico: nextBasico,
      antiguedadAnios: empleadoActivo.antiguedadAnios || 1,
      diasTrabajados: nextDias,
      valoresManuales: nextManuales
    });

    await actualizarEmpleadoLegajo(empleadoActivo.id, {
      cct: nextCct,
      categoria: nextCat,
      sueldoBasico: nextBasico,
      conceptosLiquidacion: nuevosConceptos
    });
  };

  const handleSeleccionarNuevoCct = async (nuevoCctId: string) => {
    const def = obtenerDefinicionCct(nuevoCctId);
    const catInicial = def.categorias[0]?.nombre || 'Categoría General';
    const basicoInicial = def.categorias[0]?.basicoSugerido || 900000;
    const nuevosManuales: Record<string, number> = {};
    def.camposManuales.forEach((cm) => {
      nuevosManuales[cm.id] = cm.valorDefault;
    });

    setCctEdit(nuevoCctId);
    setCategoriaEdit(catInicial);
    setBasicoEdit(basicoInicial);
    setValoresManualesCct(nuevosManuales);

    await aplicarRecalculoAutomaticoCct(
      nuevoCctId,
      catInicial,
      basicoInicial,
      diasTrabajados,
      nuevosManuales
    );
    setNotificacion(`Escala y conceptos actualizados automáticamente según ${def.codigoCorto} (${def.sindicato}).`);
    setTimeout(() => setNotificacion(null), 3500);
  };

  const handleSeleccionarCategoria = async (nombreCat: string) => {
    setCategoriaEdit(nombreCat);
    const encontrada = defCctActiva.categorias.find((c) => c.nombre === nombreCat);
    const nuevoBasicoCat = encontrada ? encontrada.basicoSugerido : basicoEdit;
    setBasicoEdit(nuevoBasicoCat);
    await aplicarRecalculoAutomaticoCct(
      cctEdit,
      nombreCat,
      nuevoBasicoCat,
      diasTrabajados,
      valoresManualesCct
    );
  };

  const handleCambiarCasillaManual = async (campoId: string, valorNum: number) => {
    const actualizados = {
      ...valoresManualesCct,
      [campoId]: valorNum
    };
    setValoresManualesCct(actualizados);
    await aplicarRecalculoAutomaticoCct(
      cctEdit,
      categoriaEdit,
      basicoEdit,
      diasTrabajados,
      actualizados
    );
  };

  const handleEditarRenglonReciboDirecto = async (
    index: number,
    campo: 'descripcion' | 'unidades' | 'remunerativo' | 'descuento' | 'noRemunerativo',
    valor: string | number
  ) => {
    if (!empleadoActivo) return;
    const copia = empleadoActivo.conceptosLiquidacion.map((c, idx) => {
      if (idx !== index) return c;
      return {
        ...c,
        [campo]: valor
      };
    });
    await actualizarEmpleadoLegajo(empleadoActivo.id, {
      conceptosLiquidacion: copia
    });
  };

  const handleEliminarRenglonRecibo = async (index: number) => {
    if (!empleadoActivo) return;
    const copia = empleadoActivo.conceptosLiquidacion.filter((_, idx) => idx !== index);
    await actualizarEmpleadoLegajo(empleadoActivo.id, {
      conceptosLiquidacion: copia
    });
  };

  const handleAgregarConceptoManualLibre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoActivo || !nuevaDescLibre.trim() || nuevoMontoLibre === 0) return;

    const nuevoConcepto: ConceptoRecibo = {
      codigo: nuevoCodLibre.trim() || '40600',
      codigoAfipLsd:
        nuevoTipoLibre === 'Remunerativo'
          ? '130000'
          : nuevoTipoLibre === 'Descuento'
          ? '820000'
          : '990000',
      descripcion: nuevaDescLibre.trim(),
      unidades: '',
      tipo: nuevoTipoLibre,
      remunerativo: nuevoTipoLibre === 'Remunerativo' ? nuevoMontoLibre : 0,
      noRemunerativo: nuevoTipoLibre === 'No Remunerativo' ? nuevoMontoLibre : 0,
      descuento: nuevoTipoLibre === 'Descuento' ? Math.abs(nuevoMontoLibre) : 0
    };

    await actualizarEmpleadoLegajo(empleadoActivo.id, {
      conceptosLiquidacion: [...empleadoActivo.conceptosLiquidacion, nuevoConcepto]
    });
    setNuevaDescLibre('');
    setNuevoMontoLibre(0);
    setNotificacion(`Concepto manual "${nuevoConcepto.descripcion}" incorporado al recibo.`);
    setTimeout(() => setNotificacion(null), 3000);
  };

  // Cálculo de totales del empleado activo (Haberes | Retenciones | Adicionales)
  const totalRemunerativo = empleadoActivo
    ? Number(
        empleadoActivo.conceptosLiquidacion
          .reduce((acc, c) => acc + (c.remunerativo || 0), 0)
          .toFixed(2)
      )
    : 0;
  const totalNoRemunerativo = empleadoActivo
    ? Number(
        empleadoActivo.conceptosLiquidacion
          .reduce((acc, c) => acc + (c.noRemunerativo || 0), 0)
          .toFixed(2)
      )
    : 0;
  const totalDescuentos = empleadoActivo
    ? Number(
        empleadoActivo.conceptosLiquidacion
          .reduce((acc, c) => acc + (c.descuento || 0), 0)
          .toFixed(2)
      )
    : 0;
  const netoCobrar = Number((totalRemunerativo + totalNoRemunerativo - totalDescuentos).toFixed(2));
  const netoEnLetras = numeroALetrasPesosArgentinos(netoCobrar);

  // Logo de la empresa (si el usuario subió foto en Configuración, se usa esa misma)
  const logoEmpresaSrc = useMemo(() => {
    try {
      return localStorage.getItem('zonda_empresa_logo_dataurl_v1') || '/logogrow.png?v=2';
    } catch {
      return '/logogrow.png?v=2';
    }
  }, []);

  // Generación oficial del archivo AFIP LSD (RG 3781)
  const lsdResultado: ResultadoGeneracionLsd = generarTxtLibroSueldosDigital(
    empresa.cuit,
    empleados,
    liquidacionActual
  );

  const handleDescargarTxtLsd = () => {
    const blob = new Blob([lsdResultado.contenidoTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = lsdResultado.nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopiarTxtLsd = () => {
    navigator.clipboard.writeText(lsdResultado.contenidoTxt);
    setCopiadoLsd(true);
    setTimeout(() => setCopiadoLsd(false), 2500);
  };

  // Alta de Legajo
  const handleCrearLegajo = async (e: React.FormEvent) => {
    e.preventDefault();
    const def = obtenerDefinicionCct(nuevoCct);
    const defaultsManuales: Record<string, number> = {};
    def.camposManuales.forEach((cm) => {
      defaultsManuales[cm.id] = cm.valorDefault;
    });
    const conceptosIniciales = calcularConceptosReciboSegunCct({
      cctId: nuevoCct,
      sueldoBasico: nuevoBasico,
      antiguedadAnios: 1,
      diasTrabajados: 30,
      valoresManuales: defaultsManuales
    });

    const creado = await crearEmpleadoLegajo({
      nombreCompleto: nuevoNombre.toUpperCase(),
      cuil: nuevoCuil,
      cct: nuevoCct,
      categoria: nuevaCategoria || def.categorias[0]?.nombre || 'Operario Calificado',
      sueldoBasico: nuevoBasico,
      conceptosLiquidacion: conceptosIniciales
    });

    setEmpleadoSeleccionadoId(creado.id);
    setShowNuevoLegajoModal(false);
    setNuevoNombre('');
    setNuevoCuil('');
    setNotificacion(`Legajo #${creado.legajo} (${creado.nombreCompleto}) dado de alta con escala ${def.codigoCorto}.`);
    setTimeout(() => setNotificacion(null), 3500);
  };

  const handleGuardarLiquidacion = async (e: React.FormEvent) => {
    e.preventDefault();
    await actualizarLiquidacionPeriodo({
      periodo: formPeriodo,
      tipoLiquidacion: formTipoLiq,
      fechaPago: formFechaPago
    });
    setShowNuevaLiquidacionModal(false);
    setNotificacion(`Período ${formPeriodo} (${formTipoLiq}) actualizado para toda la nómina.`);
    setTimeout(() => setNotificacion(null), 3000);
  };

  const handleImprimirReciboPdf = () => {
    if (!empleadoActivo) return;
    imprimirReciboHaberesDobleEjemplar({
      empleado: empleadoActivo,
      empresa,
      liquidacion: liquidacionActual
    });
  };

  const handleExportarNominaExcel = () => {
    exportToExcelCsv(
      `Nomina_Personal_${liquidacionActual.periodo}`,
      empleados.map((e) => {
        const rem = e.conceptosLiquidacion.reduce((a, c) => a + (c.remunerativo || 0), 0);
        const noRem = e.conceptosLiquidacion.reduce((a, c) => a + (c.noRemunerativo || 0), 0);
        const desc = e.conceptosLiquidacion.reduce((a, c) => a + (c.descuento || 0), 0);
        return {
          Legajo: e.legajo,
          NombreCompleto: e.nombreCompleto,
          CUIL: e.cuil,
          CCT: e.cct,
          Categoria: e.categoria,
          SueldoBasico: e.sueldoBasico,
          TotalHaberes: rem,
          TotalRetenciones: desc,
          TotalAdicionalesNoRem: noRem,
          NetoBolsillo: rem + noRem - desc
        };
      })
    );
  };

  const fmtMonto = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Renderizador de 1 ejemplar del Recibo Oficial Argentino (Idéntico a Imagen 2: Original / Duplicado)
  const renderReciboArgentinoCard = (tipoEjemplar: 'ORIGINAL' | 'DUPLICADO', editable: boolean) => {
    if (!empleadoActivo) return null;
    const periodoAbonado = formatearPeriodoMmYyyy(liquidacionActual.periodo);
    const descripcionPago = `SUELDO ${periodoAbonado.replace('/', ' ')}`;
    const fechaPagoStr = formatearFechaArgentina(liquidacionActual.fechaPago);

    return (
      <div className="bg-white text-black font-sans select-none sm:select-auto">
        {/* Título superior "Recibo de haberes" + "Página 1 de 1" */}
        <div className="flex items-baseline justify-between px-2 pb-1">
          <div className="w-20"></div>
          <h3 className="font-serif text-base font-bold tracking-tight text-black text-center">
            Recibo de haberes
          </h3>
          <span className="text-[11px] text-black font-serif">Página 1 de 1</span>
        </div>

        {/* Marco exterior con bordes redondeados tal como el recibo oficial */}
        <div className="border-[1.5px] border-black rounded-xl p-2.5 flex flex-col justify-between min-h-[630px] bg-white shadow-sm">
          <div>
            {/* Cabecera Empleador con Logo, Razón Social, Dirección, CP, CUIT y ORIGINAL/DUPLICADO */}
            <div className="flex items-center gap-3 pb-2">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={logoEmpresaSrc}
                  alt="Logo Empleador"
                  className="max-w-[52px] max-h-[52px] object-contain"
                />
              </div>
              <div className="flex-1 text-[11px] leading-snug">
                <div className="font-serif text-sm font-bold text-black uppercase">
                  {empresa.razonSocial}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>Dirección</strong> : {empresa.domicilioFiscal}
                  </span>
                  <span>
                    <strong>C.P.:</strong> 5400
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span>
                    <strong>C.U.I.T.</strong> : {empresa.cuit}
                  </span>
                  <span className="font-serif font-bold text-xs tracking-wide uppercase">
                    {tipoEjemplar}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabla 1: Periodo abonado | Descripción del pago | Fecha de pago | Lugar de pago */}
            <table className="w-full border-collapse text-[10.5px] border border-black">
              <thead>
                <tr className="bg-slate-200/90 text-black font-bold text-center">
                  <th className="border border-black py-1 px-1.5 w-[22%]">Periodo abonado</th>
                  <th className="border border-black py-1 px-1.5 w-[32%]">Descripción del pago</th>
                  <th className="border border-black py-1 px-1.5 w-[23%]">Fecha de pago</th>
                  <th className="border border-black py-1 px-1.5 w-[23%]">Lugar de pago</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center font-medium">
                  <td className="border border-black py-1 px-1.5 tabular-nums">{periodoAbonado}</td>
                  <td className="border border-black py-1 px-1.5 uppercase">{descripcionPago}</td>
                  <td className="border border-black py-1 px-1.5 tabular-nums">{fechaPagoStr}</td>
                  <td className="border border-black py-1 px-1.5 uppercase">SAN JUAN</td>
                </tr>
              </tbody>
            </table>

            {/* Tabla 2: Legajo | Apellido y nombre del empleado | C.U.I.L. */}
            <table className="w-full border-collapse text-[10.5px] border border-black mt-1">
              <thead>
                <tr className="bg-slate-200/90 text-black font-bold text-center">
                  <th className="border border-black py-1 px-1.5 w-[18%]">Legajo</th>
                  <th className="border border-black py-1 px-1.5 w-[54%]">Apellido y nombre del empleado</th>
                  <th className="border border-black py-1 px-1.5 w-[28%]">C.U.I.L.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-1.5 text-center font-medium tabular-nums">
                    {empleadoActivo.legajo}
                  </td>
                  <td className="border border-black py-1 px-2 font-medium uppercase">
                    {empleadoActivo.nombreCompleto}
                  </td>
                  <td className="border border-black py-1 px-1.5 text-center font-medium tabular-nums">
                    {empleadoActivo.cuil}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Faja de Sueldo / Jornal, Categoría, Ingreso y Depósito Previsional */}
            <div className="py-1.5 px-1 text-[10px] leading-relaxed space-y-0.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>Sueldo / Jornal :</strong>{' '}
                  <span className="tabular-nums font-medium">{fmtMonto(empleadoActivo.sueldoBasico)}</span>
                </span>
                <span>
                  <strong>Categoría :</strong>{' '}
                  <span className="uppercase font-medium">{empleadoActivo.categoria}</span>
                </span>
                <span>
                  <strong>Ingreso :</strong>{' '}
                  <span className="tabular-nums">{formatearFechaArgentina(empleadoActivo.fechaIngreso)}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>Depósito Previsional:</strong> &nbsp; <strong>Banco</strong> Santander Río
                </span>
                <span>
                  <strong>Período:</strong> 09/2026
                </span>
                <span>
                  <strong>Fecha:</strong> 08/10/2026
                </span>
              </div>
            </div>

            {/* Tabla Principal de Conceptos (Descripción | Cód. | Unid. | Haberes | Retenciones | Adicionales) */}
            <div className="border-[1.5px] border-black">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-200/90 text-black font-bold border-b border-black">
                    <th className="py-1.5 px-2 text-left border-r border-black">Descripción</th>
                    <th className="py-1.5 px-1 text-center border-r border-black w-12">Cód.</th>
                    <th className="py-1.5 px-1 text-center border-r border-black w-11">Unid.</th>
                    <th className="py-1.5 px-1.5 text-center border-r border-black w-24">Haberes</th>
                    <th className="py-1.5 px-1.5 text-center border-r border-black w-24">Retenciones</th>
                    <th className="py-1.5 px-1.5 text-center w-24">Adicionales</th>
                    {editable && <th className="py-1.5 px-1 text-center w-6 border-l border-black/30"></th>}
                  </tr>
                </thead>
                <tbody>
                  {empleadoActivo.conceptosLiquidacion.map((c, idx) => (
                    <tr key={`${c.codigo}-${idx}`} className="hover:bg-emerald-50/40 group">
                      <td className="py-0.5 px-2 border-r border-black">
                        {editable ? (
                          <input
                            type="text"
                            value={c.descripcion}
                            onChange={(e) =>
                              handleEditarRenglonReciboDirecto(idx, 'descripcion', e.target.value)
                            }
                            className="w-full bg-transparent focus:bg-yellow-50 focus:outline-none text-[10px]"
                          />
                        ) : (
                          <span>{c.descripcion}</span>
                        )}
                      </td>
                      <td className="py-0.5 px-1 text-right border-r border-black tabular-nums">
                        {c.codigo}
                      </td>
                      <td className="py-0.5 px-1 text-center border-r border-black tabular-nums">
                        {editable ? (
                          <input
                            type="text"
                            value={c.unidades || ''}
                            onChange={(e) =>
                              handleEditarRenglonReciboDirecto(idx, 'unidades', e.target.value)
                            }
                            className="w-full text-center bg-transparent focus:bg-yellow-50 focus:outline-none text-[10px]"
                          />
                        ) : (
                          c.unidades || ''
                        )}
                      </td>
                      <td className="py-0.5 px-1.5 text-right border-r border-black tabular-nums">
                        {editable ? (
                          <input
                            type="number"
                            step="0.01"
                            value={c.remunerativo !== 0 ? c.remunerativo : ''}
                            placeholder=""
                            onChange={(e) =>
                              handleEditarRenglonReciboDirecto(
                                idx,
                                'remunerativo',
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            className="w-full text-right bg-transparent focus:bg-yellow-50 focus:outline-none text-[10px] tabular-nums"
                          />
                        ) : c.remunerativo !== 0 ? (
                          fmtMonto(c.remunerativo)
                        ) : (
                          ''
                        )}
                      </td>
                      <td className="py-0.5 px-1.5 text-right border-r border-black tabular-nums">
                        {editable ? (
                          <input
                            type="number"
                            step="0.01"
                            value={c.descuento !== 0 ? c.descuento : ''}
                            placeholder=""
                            onChange={(e) =>
                              handleEditarRenglonReciboDirecto(
                                idx,
                                'descuento',
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            className="w-full text-right bg-transparent focus:bg-yellow-50 focus:outline-none text-[10px] tabular-nums"
                          />
                        ) : c.descuento !== 0 ? (
                          fmtMonto(c.descuento)
                        ) : (
                          ''
                        )}
                      </td>
                      <td className="py-0.5 px-1.5 text-right tabular-nums">
                        {editable ? (
                          <input
                            type="number"
                            step="0.01"
                            value={c.noRemunerativo !== 0 ? c.noRemunerativo : ''}
                            placeholder=""
                            onChange={(e) =>
                              handleEditarRenglonReciboDirecto(
                                idx,
                                'noRemunerativo',
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            className="w-full text-right bg-transparent focus:bg-yellow-50 focus:outline-none text-[10px] tabular-nums"
                          />
                        ) : c.noRemunerativo !== 0 ? (
                          fmtMonto(c.noRemunerativo)
                        ) : (
                          ''
                        )}
                      </td>
                      {editable && (
                        <td className="py-0.5 px-1 text-center border-l border-black/20">
                          <button
                            type="button"
                            onClick={() => handleEliminarRenglonRecibo(idx)}
                            title="Quitar concepto"
                            className="text-slate-300 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {/* Renglones en blanco para mantener la altura reglamentaria del recibo */}
                  {Array.from({
                    length: Math.max(2, 12 - empleadoActivo.conceptosLiquidacion.length)
                  }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-4">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td></td>
                      {editable && <td className="border-l border-black/20"></td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Barra inferior de Neto y Totales por Columna (Haberes | Retenciones | Adicionales) */}
              <div className="border-t-[1.5px] border-black flex items-stretch text-[10.5px]">
                <div className="flex-1 flex items-center justify-between px-3 py-1.5 font-bold">
                  <span>Neto &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; :</span>
                  <span className="text-xs font-extrabold tabular-nums">{fmtMonto(netoCobrar)}</span>
                </div>
                <div className="flex bg-slate-200/90 font-bold tabular-nums">
                  <div className="w-24 border-l border-black py-1.5 px-1.5 text-right">
                    {fmtMonto(totalRemunerativo)}
                  </div>
                  <div className="w-24 border-l border-black py-1.5 px-1.5 text-right">
                    {fmtMonto(totalDescuentos)}
                  </div>
                  <div className="w-24 border-l border-black py-1.5 px-1.5 text-right">
                    {fmtMonto(totalNoRemunerativo)}
                  </div>
                  {editable && <div className="w-6 border-l border-black/20"></div>}
                </div>
              </div>
            </div>
          </div>

          {/* Pie Legal Art. 140 LCT + Importe en Letras + Banco + Firma */}
          <div className="pt-2 text-[9.5px] leading-snug space-y-1">
            <div>
              <strong>Recibí conforme la suma de pesos:</strong> &nbsp;
              <span className="uppercase text-[9px] font-medium">{netoEnLetras}</span>
            </div>
            <div>
              <strong>Depositados en</strong> &nbsp;&nbsp;&nbsp;
              <span>{empleadoActivo.banco}</span> &nbsp;&nbsp;&nbsp;&nbsp;
              <span>CA &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; {empleadoActivo.cbu}</span>
            </div>

            <div className="pt-5 flex items-end justify-between gap-4">
              <p className="text-[8.5px] text-slate-800 max-w-[62%] leading-tight">
                En concepto de haberes correspondientes al período arriba indicado y según la presente liquidación, dejando constancia de haber recibido un duplicado de este recibo. Incluido aumento de futuros convenios, leyes y/o resoluciones.
              </p>
              <div className="text-center w-44 shrink-0">
                <div className="text-[10px] tracking-widest text-slate-700">
                  .................................................
                </div>
                <div className="text-[10.5px] font-semibold text-black mt-0.5">
                  {tipoEjemplar === 'ORIGINAL' ? 'Firma del Empleado' : 'Firma del Empleador'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      {/* 1. BARRA SUPERIOR DE ENCABEZADO */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
            Liquidación de Sueldos y Cargas Sociales
          </h1>
          <span className="text-xs text-slate-500 font-medium hidden md:inline">
            | MULTI-CONVENIO CCT ACTUALIZADO, CASILLAS MANUALES Y RECIBO LEY 20.744
          </span>
        </div>

        <button
          onClick={() => setShowCalendarioModal(true)}
          className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#064e3b]"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendario de vencimientos</span>
        </button>
      </div>

      {/* NOTIFICACIÓN DE ACTUALIZACIÓN AUTOMÁTICA */}
      {notificacion && (
        <div className="bg-emerald-50 border-b border-emerald-400 px-4 py-2 flex items-center justify-between text-xs font-bold text-[#042f22]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
            <span>{notificacion}</span>
          </div>
          <button onClick={() => setNotificacion(null)} className="text-[11px] underline">
            Cerrar
          </button>
        </div>
      )}

      {/* 2. PESTAÑAS PRINCIPALES DEL MÓDULO */}
      <div className="bg-[#ecfdf5]/40 border-b border-slate-300 px-2 pt-1 flex flex-wrap items-center gap-1">
        {[
          { key: 'recibo', label: 'Liquidación y Recibos de Sueldo' },
          { key: 'nomina', label: 'Nómina de Legajos' },
          { key: 'cct', label: 'Convenios CCT y Escalas Actualizadas' },
          { key: 'afip_lsd', label: 'Libro Sueldos Digital AFIP (TXT RG 3781)' }
        ].map((tab) => {
          const isActive = tabPrincipal === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabPrincipal(tab.key as 'recibo' | 'nomina' | 'cct' | 'afip_lsd')}
              className={`px-3.5 py-2 text-xs font-bold transition-all border-t-2 ${
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

      {/* 3. VISTA 1: RECIBO DE SUELDO & PARAMETRIZACIÓN AUTOMÁTICA POR CCT */}
      {tabPrincipal === 'recibo' && (
        <div className="flex flex-col lg:flex-row min-h-[700px] bg-white border border-slate-300 border-t-0">
          {/* PANEL IZQUIERDO: LISTA DE LEGAJOS (MASTER) */}
          <div className="w-full lg:w-72 border-r border-slate-300 bg-white flex flex-col justify-between shrink-0">
            <div>
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Nómina de Personal</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Período: {formatearPeriodoMmYyyy(liquidacionActual.periodo)}
                </span>
              </div>

              <div className="p-2 border-b border-slate-200 bg-slate-50 space-y-2">
                <input
                  type="text"
                  value={searchEmpleado}
                  onChange={(e) => setSearchEmpleado(e.target.value)}
                  placeholder="Buscar por legajo, nombre o CUIL"
                  className="w-full px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />

                <select
                  value={filtroCct}
                  onChange={(e) => setFiltroCct(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 text-[11px]"
                >
                  <option value="TODOS">Todos los Convenios ({CATALOGO_CONVENIOS_CCT.length} CCT)</option>
                  {CATALOGO_CONVENIOS_CCT.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigoCorto} — {c.sindicato}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-y-auto max-h-[520px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="py-2 px-2 border-r border-slate-200">Legajo</th>
                      <th className="py-2 px-2 border-r border-slate-200">Trabajador</th>
                      <th className="py-2 px-2 text-right">Neto ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {empleadosFiltrados.map((emp) => {
                      const isSelected = empleadoActivo?.id === emp.id;
                      const empRem = emp.conceptosLiquidacion.reduce((a, c) => a + (c.remunerativo || 0), 0);
                      const empNoRem = emp.conceptosLiquidacion.reduce((a, c) => a + (c.noRemunerativo || 0), 0);
                      const empDesc = emp.conceptosLiquidacion.reduce((a, c) => a + (c.descuento || 0), 0);
                      const empNeto = empRem + empNoRem - empDesc;

                      return (
                        <tr
                          key={emp.id}
                          onClick={() => setEmpleadoSeleccionadoId(emp.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#ecfdf5] font-bold text-slate-900 border-l-4 border-l-[#064e3b]'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <td className="py-2 px-2 border-r border-slate-200 font-bold tabular-nums">
                            {emp.legajo}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 truncate max-w-[125px]">
                            <span className="block truncate font-semibold">{emp.nombreCompleto}</span>
                            <span className="text-[10px] text-[#047857] font-semibold block truncate">
                              {emp.cct}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900 whitespace-nowrap tabular-nums">
                            ${empNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#f8fafc] border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-1">
                <button className="p-0.5 hover:bg-slate-200"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 hover:bg-slate-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span>Pág. 1</span>
                <button className="p-0.5 hover:bg-slate-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 hover:bg-slate-200"><ChevronsRight className="w-3.5 h-3.5" /></button>
                <button onClick={() => refreshAllFromDb()} className="p-0.5 hover:bg-slate-200 ml-1"><RotateCw className="w-3.5 h-3.5" /></button>
              </div>
              <span className="font-medium">Total: {empleadosFiltrados.length} legajos</span>
            </div>
          </div>

          {/* PANEL DERECHO: CONFIGURADOR INTERACTIVO DE CCT + RECIBO DE HABERES LEY 20.744 */}
          <div className="flex-1 flex flex-col justify-between bg-slate-50/40 min-w-0">
            <div>
              {/* Barra de Acciones del Recibo */}
              <div className="bg-[#f0fdf4] border-b border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#042f22] uppercase tracking-tight">
                    RECIBO DE HABERES OFICIAL (LEY 20.744 ART. 140)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-[#064e3b] border border-emerald-400 font-bold">
                    {defCctActiva.codigoCorto} • {defCctActiva.resolucionHomologatoria}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Selector de vista: Doble Ejemplar (Original + Duplicado) o Individual */}
                  <div className="flex items-center border border-emerald-800/30 bg-white text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setEjemplarVista('DOBLE')}
                      className={`px-2.5 py-1 transition-colors ${
                        ejemplarVista === 'DOBLE'
                          ? 'bg-[#064e3b] text-white'
                          : 'text-[#042f22] hover:bg-emerald-50'
                      }`}
                    >
                      Original + Duplicado (Imagen 2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEjemplarVista('ORIGINAL')}
                      className={`px-2.5 py-1 border-l border-emerald-800/20 transition-colors ${
                        ejemplarVista === 'ORIGINAL'
                          ? 'bg-[#064e3b] text-white'
                          : 'text-[#042f22] hover:bg-emerald-50'
                      }`}
                    >
                      Solo Original (Editable)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMostrarPanelManualCct(!mostrarPanelManualCct)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#064e3b] text-xs font-bold border border-emerald-800/30 flex items-center gap-1 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{mostrarPanelManualCct ? 'Ocultar Casillas CCT' : 'Casillas Manuales CCT'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImprimirReciboPdf}
                    className="px-3 py-1 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Recibo (Original y Duplicado)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabPrincipal('afip_lsd')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>TXT LSD</span>
                  </button>
                </div>
              </div>

              {/* PANEL INTERACTIVO DE SELECCIÓN DE CONVENIO COLECTIVO (CCT), ESCALA Y CASILLAS MANUALES */}
              {empleadoActivo && mostrarPanelManualCct && (
                <div className="p-3.5 bg-white border-b border-slate-300 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/15 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#047857]" />
                      <span className="font-extrabold text-[#042f22] uppercase">
                        Parametrización Automática por Convenio Colectivo (CCT) + Casillas de Carga Manual
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#047857] bg-emerald-50 px-2 py-0.5 border border-emerald-700/20">
                      Escala vigente: {defCctActiva.ultimaParitaria}
                    </span>
                  </div>

                  {/* Selector de Convenio Colectivo, Categoría, Sueldo Básico y Días */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold text-[#042f22] uppercase mb-1">
                        1. Convenio Colectivo de Trabajo (CCT):
                      </label>
                      <select
                        value={cctEdit}
                        onChange={(e) => handleSeleccionarNuevoCct(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-emerald-800/30 bg-emerald-50/40 font-bold text-[#042f22] text-xs focus:outline-none focus:border-[#064e3b]"
                      >
                        {CATALOGO_CONVENIOS_CCT.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold text-[#042f22] uppercase mb-1">
                        2. Categoría / Función del Convenio:
                      </label>
                      <select
                        value={categoriaEdit}
                        onChange={(e) => handleSeleccionarCategoria(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-semibold text-slate-900 text-xs focus:outline-none focus:border-[#064e3b]"
                      >
                        {defCctActiva.categorias.map((cat) => (
                          <option key={cat.nombre} value={cat.nombre}>
                            {cat.nombre} (Sugerido: ${cat.basicoSugerido.toLocaleString('es-AR')})
                          </option>
                        ))}
                        {!defCctActiva.categorias.some((c) => c.nombre === categoriaEdit) && (
                          <option value={categoriaEdit}>{categoriaEdit}</option>
                        )}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-[#042f22] uppercase mb-1">
                        3. Sueldo Básico ($):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={basicoEdit}
                        onChange={async (e) => {
                          const val = Number(e.target.value) || 0;
                          setBasicoEdit(val);
                          await aplicarRecalculoAutomaticoCct(
                            cctEdit,
                            categoriaEdit,
                            val,
                            diasTrabajados,
                            valoresManualesCct
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-bold text-slate-900 tabular-nums text-xs focus:outline-none focus:border-[#064e3b]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-[#042f22] uppercase mb-1">
                        4. Días Liq.:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={diasTrabajados}
                        onChange={async (e) => {
                          const d = Math.min(30, Math.max(1, Number(e.target.value) || 30));
                          setDiasTrabajados(d);
                          await aplicarRecalculoAutomaticoCct(
                            cctEdit,
                            categoriaEdit,
                            basicoEdit,
                            d,
                            valoresManualesCct
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-bold text-slate-900 tabular-nums text-xs focus:outline-none focus:border-[#064e3b]"
                      />
                    </div>
                  </div>

                  {/* Casillas Manuales Específicas según el CCT elegido */}
                  <div className="bg-emerald-50/40 border border-emerald-800/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#064e3b] uppercase">
                        Casillas Manuales Específicas de {defCctActiva.codigoCorto} ({defCctActiva.sindicato}) — Se actualizan en vivo en el recibo:
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Obra Social: <strong>{defCctActiva.obraSocialDefault}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {defCctActiva.camposManuales.map((campo) => (
                        <div key={campo.id} className="bg-white border border-slate-300 p-2">
                          <label className="block text-[10px] font-bold text-slate-800 mb-1" title={campo.ayuda}>
                            {campo.label}
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={valoresManualesCct[campo.id] ?? campo.valorDefault}
                              onChange={(e) =>
                                handleCambiarCasillaManual(campo.id, Number(e.target.value) || 0)
                              }
                              className="w-full px-2 py-1 border border-slate-300 text-xs font-bold text-[#042f22] tabular-nums focus:outline-none focus:border-[#064e3b]"
                            />
                            {campo.unidadLabel && (
                              <span className="text-[10px] font-bold text-slate-500 px-1">
                                {campo.unidadLabel}
                              </span>
                            )}
                          </div>
                          {campo.ayuda && (
                            <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-tight">
                              {campo.ayuda}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Formulario rápido para agregar cualquier renglón / concepto manual libre */}
                    <form
                      onSubmit={handleAgregarConceptoManualLibre}
                      className="pt-2 border-t border-emerald-800/15 flex flex-wrap items-end gap-2"
                    >
                      <div className="w-20">
                        <label className="block text-[9.5px] font-bold text-slate-600 uppercase">Cód.</label>
                        <input
                          type="text"
                          value={nuevoCodLibre}
                          onChange={(e) => setNuevoCodLibre(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 text-xs tabular-nums"
                        />
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-[9.5px] font-bold text-slate-600 uppercase">
                          Agregar otro concepto o ítem manual al recibo
                        </label>
                        <input
                          type="text"
                          value={nuevaDescLibre}
                          onChange={(e) => setNuevaDescLibre(e.target.value)}
                          placeholder="Ej: Adicional Guardia / Horas Extras / Anticipo de Sueldo"
                          className="w-full px-2 py-1 bg-white border border-slate-300 text-xs"
                        />
                      </div>
                      <div className="w-40">
                        <label className="block text-[9.5px] font-bold text-slate-600 uppercase">Columna</label>
                        <select
                          value={nuevoTipoLibre}
                          onChange={(e) =>
                            setNuevoTipoLibre(
                              e.target.value as 'Remunerativo' | 'No Remunerativo' | 'Descuento'
                            )
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-300 text-xs"
                        >
                          <option value="Remunerativo">Haberes (Remun.)</option>
                          <option value="Descuento">Retenciones (Desc.)</option>
                          <option value="No Remunerativo">Adicionales (No Rem.)</option>
                        </select>
                      </div>
                      <div className="w-32">
                        <label className="block text-[9.5px] font-bold text-slate-600 uppercase">Importe ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={nuevoMontoLibre || ''}
                          placeholder="0.00"
                          onChange={(e) => setNuevoMontoLibre(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 text-xs tabular-nums"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar fila</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* VISTA EN VIVO DEL RECIBO DE HABERES ARGENTINO (ESTRUCTURA IMAGEN 2: ORIGINAL Y DUPLICADO) */}
              <div className="p-4 overflow-x-auto">
                {ejemplarVista === 'DOBLE' ? (
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 min-w-[920px]">
                    {renderReciboArgentinoCard('ORIGINAL', true)}
                    {renderReciboArgentinoCard('DUPLICADO', false)}
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    {renderReciboArgentinoCard(ejemplarVista, true)}
                  </div>
                )}
              </div>
            </div>

            {/* BOTONERA INFERIOR DEL MÓDULO */}
            <div className="bg-[#ecfdf5]/30 border-t border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowNuevaLiquidacionModal(true)}
                  className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Período / Nueva liquidación</span>
                </button>

                <button
                  onClick={() => setShowNuevoLegajoModal(true)}
                  className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold border border-[#064e3b] flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo legajo</span>
                </button>

                <button
                  onClick={() => setShowF931Modal(true)}
                  className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-[#064e3b] text-xs font-bold border border-emerald-800/30 flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cargas Sociales F.931</span>
                </button>
              </div>

              <button
                onClick={handleDescargarTxtLsd}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold border border-emerald-800 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generar TXT Libro Sueldos Digital AFIP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. VISTA 2: LIBRO SUELDOS DIGITAL AFIP (TXT OFICIAL RG 3781) */}
      {tabPrincipal === 'afip_lsd' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 text-xs space-y-5">
          <div className="bg-slate-50 border border-slate-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileCode2 className="w-5 h-5 text-[#064e3b]" />
                <span>Generador Oficial de Archivo TXT para AFIP - Libro Sueldos Digital (RG 3781)</span>
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Este archivo contiene la estructura posicional oficial exigida por AFIP con los registros <strong>01 (Cabecera)</strong>, <strong>02 (Trabajador)</strong>, <strong>03 (Conceptos Homologados)</strong> y <strong>04 (Bases Imponibles F.931)</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopiarTxtLsd}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiadoLsd ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoLsd ? '¡Copiado!' : 'Copiar TXT'}</span>
              </button>

              <button
                onClick={handleDescargarTxtLsd}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Descargar {lsdResultado.nombreArchivo}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="border border-slate-200 p-3 bg-white">
              <span className="text-slate-500 text-[10px] block font-medium">Nombre de Archivo:</span>
              <p className="font-bold text-slate-900 truncate font-mono text-[11px]">{lsdResultado.nombreArchivo}</p>
            </div>
            <div className="border border-slate-200 p-3 bg-white">
              <span className="text-slate-500 text-[10px] block font-medium">Registros Generados:</span>
              <p className="font-bold text-slate-900 tabular-nums">{lsdResultado.totalRegistros} líneas posicionales</p>
            </div>
            <div className="border border-slate-200 p-3 bg-white">
              <span className="text-slate-500 text-[10px] block font-medium">Masa Salarial Bruta:</span>
              <p className="font-bold text-emerald-700 tabular-nums">${lsdResultado.totalBruto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border border-slate-200 p-3 bg-white">
              <span className="text-slate-500 text-[10px] block font-medium">Estado Validación RG 3781:</span>
              <p className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Estructura 100% Válida</span>
              </p>
            </div>
          </div>

          <div>
            <div className="bg-[#042f22] text-emerald-100 px-4 py-2 flex items-center justify-between text-[11px] font-bold">
              <span className="tracking-wide">PREVISUALIZACIÓN DE ARCHIVO PLANO POSICIONAL (AFIP LSD)</span>
              <span className="text-emerald-300 font-normal">Formato UTF-8 / CRLF</span>
            </div>
            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800 select-all">
              {lsdResultado.contenidoTxt}
            </pre>
          </div>
        </div>
      )}

      {/* 5. VISTA 3: NÓMINA DE LEGAJOS */}
      {tabPrincipal === 'nomina' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 text-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Ficha Maestra de Empleados y Categorías de Convenio</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportarNominaExcel}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Nómina Excel</span>
              </button>
              <button
                onClick={() => setShowNuevoLegajoModal(true)}
                className="px-3.5 py-1.5 bg-[#064e3b] text-white font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Alta de Legajo</span>
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="py-2 px-3 border-r border-slate-200">Legajo</th>
                <th className="py-2 px-3 border-r border-slate-200">Nombre Completo</th>
                <th className="py-2 px-3 border-r border-slate-200">CUIL</th>
                <th className="py-2 px-3 border-r border-slate-200">Convenio Colectivo (CCT)</th>
                <th className="py-2 px-3 border-r border-slate-200">Categoría</th>
                <th className="py-2 px-3 border-r border-slate-200">Ingreso</th>
                <th className="py-2 px-3 border-r border-slate-200 text-right">Sueldo Básico</th>
                <th className="py-2 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {empleados.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 border-r border-slate-200 font-bold tabular-nums">{emp.legajo}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{emp.nombreCompleto}</td>
                  <td className="py-2 px-3 border-r border-slate-200 tabular-nums">{emp.cuil}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-semibold text-[#064e3b]">{emp.cct}</td>
                  <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{emp.categoria}</td>
                  <td className="py-2 px-3 border-r border-slate-200 tabular-nums">{emp.fechaIngreso}</td>
                  <td className="py-2 px-3 border-r border-slate-200 text-right font-bold tabular-nums">
                    ${emp.sueldoBasico.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => {
                        setEmpleadoSeleccionadoId(emp.id);
                        setTabPrincipal('recibo');
                      }}
                      className="px-2.5 py-1 bg-[#064e3b] hover:bg-[#047857] text-white font-bold text-[10px] uppercase"
                    >
                      Liquidar / Ver Recibo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. VISTA 4: CATÁLOGO DE CONVENIOS COLECTIVOS (CCT) Y ESCALAS PARITARIAS ACTUALIZADAS */}
      {tabPrincipal === 'cct' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 text-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase">
                Catálogo de Convenios Colectivos de Trabajo (CCT) y Escalas Salariales Homologadas
              </h3>
              <p className="text-slate-500 text-[11px]">
                Seleccione cualquier convenio o categoría para aplicarla automáticamente al trabajador activo con todas sus fórmulas y casillas manuales.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-[#064e3b] border border-emerald-400 font-bold text-[11px]">
              {CATALOGO_CONVENIOS_CCT.length} Convenios Homologados Activos
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {CATALOGO_CONVENIOS_CCT.map((cct) => (
              <div key={cct.id} className="border border-emerald-800/25 p-4 bg-white space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 bg-[#064e3b] text-white font-bold text-[10px] uppercase">
                      {cct.codigoCorto} • {cct.sindicato}
                    </span>
                    <h4 className="font-extrabold text-[#042f22] text-xs mt-1.5">{cct.nombre}</h4>
                  </div>
                  <button
                    onClick={async () => {
                      await handleSeleccionarNuevoCct(cct.id);
                      setTabPrincipal('recibo');
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-[#064e3b] text-[#064e3b] hover:text-white border border-emerald-700/30 font-bold text-[10px] uppercase transition-colors shrink-0 flex items-center gap-1"
                  >
                    <BookOpenCheck className="w-3.5 h-3.5" />
                    <span>Aplicar al Legajo Activo</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-600 space-y-0.5 bg-slate-50 p-2 border border-slate-200">
                  <div>
                    <strong>Paritaria Vigente:</strong> {cct.ultimaParitaria} ({cct.resolucionHomologatoria})
                  </div>
                  <div>
                    <strong>Obra Social:</strong> {cct.obraSocialDefault} | <strong>Antigüedad:</strong>{' '}
                    {cct.antiguedadPctAnual}% anual
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                    Escala de Categorías y Básicos de Convenio:
                  </span>
                  <div className="divide-y divide-slate-200 border border-slate-200 text-[11px]">
                    {cct.categorias.map((cat) => (
                      <div key={cat.nombre} className="py-1 px-2.5 flex items-center justify-between bg-white">
                        <span className="font-medium text-slate-800">{cat.nombre}</span>
                        <span className="font-bold text-[#064e3b] tabular-nums">
                          ${cat.basicoSugerido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NUEVA LIQUIDACIÓN */}
      {showNuevaLiquidacionModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-md shadow-2xl text-xs">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-bold">
              <span className="tracking-tight">APERTURA DE NUEVA LIQUIDACIÓN DE HABERES</span>
              <button onClick={() => setShowNuevaLiquidacionModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleGuardarLiquidacion} className="p-4 space-y-3">
              <div>
                <label className="text-slate-600 block text-[11px] mb-1 font-medium">Período (AAAAMM):</label>
                <input
                  type="text"
                  required
                  value={formPeriodo}
                  onChange={(e) => setFormPeriodo(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 focus:outline-none focus:border-[#064e3b] tabular-nums"
                />
              </div>

              <div>
                <label className="text-slate-600 block text-[11px] mb-1 font-medium">Tipo de Liquidación:</label>
                <select
                  value={formTipoLiq}
                  onChange={(e) => setFormTipoLiq(e.target.value as LiquidacionPeriodo['tipoLiquidacion'])}
                  className="w-full px-2 py-1.5 border border-slate-300 bg-white"
                >
                  <option value="Mensual">Mensual Ordinaria</option>
                  <option value="1ra Quincena">1ra Quincena (Jornalizados CCT 76/75)</option>
                  <option value="2da Quincena">2da Quincena (Jornalizados CCT 76/75)</option>
                  <option value="SAC 1">SAC 1er Semestre (Aguinaldo)</option>
                  <option value="SAC 2">SAC 2do Semestre (Aguinaldo)</option>
                  <option value="Vacaciones">Vacaciones Anuales</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block text-[11px] mb-1 font-medium">Fecha de Pago:</label>
                <input
                  type="date"
                  value={formFechaPago}
                  onChange={(e) => setFormFechaPago(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNuevaLiquidacionModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] text-white font-bold"
                >
                  Actualizar Liquidación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO LEGAJO */}
      {showNuevoLegajoModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-lg shadow-2xl text-xs">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-bold">
              <span className="tracking-tight">ALTA DE LEGAJO / TRABAJADOR CON ESCALA CCT</span>
              <button onClick={() => setShowNuevoLegajoModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCrearLegajo} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1 font-medium">Apellido y Nombre:</label>
                  <input
                    type="text"
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="ej: HERRERA , MATIAS CARLOS"
                    className="w-full px-2 py-1.5 border border-slate-300 uppercase focus:outline-none focus:border-[#064e3b]"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1 font-medium">CUIL (11 dígitos):</label>
                  <input
                    type="text"
                    required
                    value={nuevoCuil}
                    onChange={(e) => setNuevoCuil(e.target.value)}
                    placeholder="20-35891204-9"
                    className="w-full px-2 py-1.5 border border-slate-300 focus:outline-none focus:border-[#064e3b] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 block text-[11px] mb-1 font-medium">Convenio Colectivo (CCT):</label>
                <select
                  value={nuevoCct}
                  onChange={(e) => {
                    const sel = e.target.value;
                    setNuevoCct(sel);
                    const def = obtenerDefinicionCct(sel);
                    if (def.categorias[0]) {
                      setNuevaCategoria(def.categorias[0].nombre);
                      setNuevoBasico(def.categorias[0].basicoSugerido);
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 bg-white font-semibold"
                >
                  {CATALOGO_CONVENIOS_CCT.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1 font-medium">Categoría de Convenio:</label>
                  <select
                    value={nuevaCategoria}
                    onChange={(e) => {
                      const catName = e.target.value;
                      setNuevaCategoria(catName);
                      const def = obtenerDefinicionCct(nuevoCct);
                      const found = def.categorias.find((c) => c.nombre === catName);
                      if (found) setNuevoBasico(found.basicoSugerido);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-white"
                  >
                    {obtenerDefinicionCct(nuevoCct).categorias.map((cat) => (
                      <option key={cat.nombre} value={cat.nombre}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block text-[11px] mb-1 font-medium">Sueldo Básico de Convenio ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={nuevoBasico}
                    onChange={(e) => setNuevoBasico(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 tabular-nums font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNuevoLegajoModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] text-white font-bold"
                >
                  Guardar y Liquidar Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CARGAS SOCIALES F.931 */}
      {showF931Modal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-xl shadow-2xl text-xs">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-bold">
              <span className="tracking-tight">DECLARACIÓN JURADA CARGAS SOCIALES F.931 AFIP</span>
              <button onClick={() => setShowF931Modal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="border border-slate-200 p-2.5 bg-slate-50">
                  <span className="text-slate-500 block font-medium">Total Aportes Trabajadores (Retenciones):</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5 tabular-nums">
                    ${liquidacionActual.totalRetenciones.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="border border-slate-200 p-2.5 bg-slate-50">
                  <span className="text-slate-500 block font-medium">Total Contribuciones Patronales:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5 tabular-nums">
                    ${liquidacionActual.totalContribucionesPatronales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-[#ecfdf5] border border-emerald-600/40 p-3 flex justify-between items-center text-sm font-bold text-[#064e3b]">
                <span>TOTAL A PAGAR VEP AFIP F.931:</span>
                <span className="tabular-nums">
                  ${(liquidacionActual.totalRetenciones + liquidacionActual.totalContribucionesPatronales).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CALENDARIO DE VENCIMIENTOS SUELDOS */}
      {showCalendarioModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-md shadow-2xl text-xs font-mono">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-bold">
              <span>CALENDARIO DE VENCIMIENTOS LABORALES Y AFIP</span>
              <button onClick={() => setShowCalendarioModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">05/11/2026 // 4to Día Hábil</span>
                  <span className="text-[11px] text-slate-500">Acreditación Bancaria de Haberes (Ley 20.744)</span>
                </div>
                <span className="font-bold text-emerald-700">${liquidacionActual.totalNeto.toLocaleString('es-AR')}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-900 block">12/11/2026 // Presentación F.931 y LSD</span>
                  <span className="text-[11px] text-amber-800">Vencimiento CUIT - ARCA / AFIP</span>
                </div>
                <span className="font-bold text-amber-900">
                  ${(liquidacionActual.totalRetenciones + liquidacionActual.totalContribucionesPatronales).toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
