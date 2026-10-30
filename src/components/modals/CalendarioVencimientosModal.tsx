import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  Clock,
  DollarSign,
  Send,
  Filter,
  Trash2
} from 'lucide-react';
import { useErp, flattenCuentasContables } from '../../context/ErpContext';

export interface CalendarioVencimientosModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProveedorId?: string;
  defaultContext?: 'proveedores' | 'clientes' | 'tesoreria' | 'contabilidad' | 'inventario' | 'sueldos' | 'general';
}

interface EventoCalendarioCustom {
  id: string;
  fecha: string; // DD/MM/YYYY
  titulo: string;
  categoria: 'fiscal' | 'proveedor' | 'laboral' | 'otro';
  proveedorId?: string;
  proveedorNombre?: string;
  montoEstimado?: number;
  notas?: string;
}

export interface CalendarEventMapped {
  id: string;
  fecha: string; // DD/MM/YYYY
  isoDate: string; // YYYY-MM-DD
  tipo: 'pago_proveedor_pendiente' | 'cobro_cliente_pendiente' | 'cheque_cartera' | 'evento_agenda';
  titulo: string;
  subtitulo: string;
  monto: number;
  estado: 'PENDIENTE' | 'VENCIDO' | 'EN_CARTERA' | 'AGENDADO';
  proveedorId?: string;
  proveedorNombre?: string;
  clienteId?: string;
  clienteNombre?: string;
  nroComprobante?: string;
  medioPagoPactado?: string;
  customEventId?: string;
}

const STORAGE_KEY_CUSTOM_EVENTS = 'zonda_calendario_eventos_v1';

const DEFAULT_FISCAL_EVENTS: EventoCalendarioCustom[] = [
  {
    id: 'FIS-1',
    fecha: '18/10/2026',
    titulo: 'Vencimiento DDJJ IVA Digital ARCA (RG 4597)',
    categoria: 'fiscal',
    montoEstimado: 0,
    notas: 'Presentación Libro IVA Ventas y Compras Digital'
  },
  {
    id: 'FIS-2',
    fecha: '09/11/2026',
    titulo: 'Vencimiento F.931 SUSS Cargas Sociales AFIP',
    categoria: 'laboral',
    montoEstimado: 0,
    notas: 'Declaración jurada mensual de aportes y contribuciones'
  },
  {
    id: 'FIS-3',
    fecha: '20/11/2026',
    titulo: 'Vencimiento DDJJ IVA + Ingresos Brutos Convenio',
    categoria: 'fiscal',
    montoEstimado: 0,
    notas: 'Liquidación mensual impositiva'
  }
];

function loadCustomEvents(): EventoCalendarioCustom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_EVENTS);
    if (!raw) return DEFAULT_FISCAL_EVENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FISCAL_EVENTS;
  } catch {
    return DEFAULT_FISCAL_EVENTS;
  }
}

function saveCustomEvents(list: EventoCalendarioCustom[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_EVENTS, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function parseDdMmYyyyToIso(fechaStr: string): string {
  if (!fechaStr) return '2026-10-30';
  const clean = fechaStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const parts = clean.split(/[/-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return '2026-10-30';
}

function formatIsoToDdMmYyyy(isoStr: string): string {
  if (!isoStr) return '30/10/2026';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return isoStr;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const DAY_HEADERS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

export const CalendarioVencimientosModal: React.FC<CalendarioVencimientosModalProps> = ({
  isOpen,
  onClose,
  initialProveedorId = '',
  defaultContext = 'proveedores'
}) => {
  const {
    proveedores,
    clientes,
    cheques,
    cuentasBancarias,
    planDeCuentas,
    registrarFacturaCompra,
    registrarPagoProveedor
  } = useErp();

  // Estado del mes/año visible (Por defecto Octubre 2026 donde están la mayoría de los vencimientos activos)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = Octubre
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>('2026-10-30');
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Filtro de Proveedor y Capas del Calendario
  const [filtroProveedorId, setFiltroProveedorId] = useState<string>(initialProveedorId || 'TODOS');
  const [showLayerProveedores, setShowLayerProveedores] = useState<boolean>(true);
  const [showLayerClientes, setShowLayerClientes] = useState<boolean>(defaultContext !== 'proveedores');
  const [showLayerCheques, setShowLayerCheques] = useState<boolean>(true);
  const [showLayerFiscal, setShowLayerFiscal] = useState<boolean>(true);

  // Eventos personalizados agendados
  const [customEvents, setCustomEvents] = useState<EventoCalendarioCustom[]>(() => loadCustomEvents());

  // Pestaña activa en el panel derecho del día seleccionado
  const [rightPanelTab, setRightPanelTab] = useState<'detalle' | 'nueva_factura' | 'sacar_pago' | 'agendar'>('detalle');

  // Estado para "Cargar Factura / Vencimiento de Proveedor" desde el calendario
  const [formProveedorId, setFormProveedorId] = useState<string>(
    initialProveedorId || proveedores[0]?.id || ''
  );
  const [formTipoComp, setFormTipoComp] = useState<'Factura A' | 'Factura B' | 'Factura C'>('Factura A');
  const [formCuentaGasto, setFormCuentaGasto] = useState<string>('5.1.01 - Costo de Mercaderías Vendidas / Materiales');
  const [formMedioPagoPactado, setFormMedioPagoPactado] = useState<string>(
    cuentasBancarias[0]?.nombre || 'Transferencia Bancaria Santander'
  );
  const [formDescripcion, setFormDescripcion] = useState<string>('');
  const [formNetoGravado, setFormNetoGravado] = useState<string>('');

  // Estado para "Sacar Pago de Proveedor" desde el calendario
  const [pagoProveedorId, setPagoProveedorId] = useState<string>(
    initialProveedorId || proveedores[0]?.id || ''
  );
  const [pagoFacturaSeleccionadaId, setPagoFacturaSeleccionadaId] = useState<string>('');
  const [pagoMonto, setPagoMonto] = useState<string>('');
  const [pagoCuentaBancariaId, setPagoCuentaBancariaId] = useState<string>(
    cuentasBancarias[0]?.id || ''
  );
  const [pagoMedio, setPagoMedio] = useState<string>('Transferencia Bancaria');

  // Estado para "Agendar Recordatorio / Vencimiento"
  const [agendaTitulo, setAgendaTitulo] = useState<string>('');
  const [agendaCategoria, setAgendaCategoria] = useState<'fiscal' | 'proveedor' | 'laboral' | 'otro'>('proveedor');
  const [agendaProveedorId, setAgendaProveedorId] = useState<string>('');
  const [agendaMonto, setAgendaMonto] = useState<string>('');
  const [agendaNotas, setAgendaNotas] = useState<string>('');

  // Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const cuentasImputables = useMemo(
    () => flattenCuentasContables(planDeCuentas).filter((c) => c.imputable),
    [planDeCuentas]
  );

  // Consolidar TODOS los vencimientos mapeados en vivo desde el ERP
  const allMappedEvents = useMemo<CalendarEventMapped[]>(() => {
    const events: CalendarEventMapped[] = [];

    // 1. Pagos Pendientes de Proveedores (Facturas Adeudadas con saldo > 0)
    if (showLayerProveedores) {
      proveedores.forEach((prov) => {
        if (filtroProveedorId !== 'TODOS' && prov.id !== filtroProveedorId) return;
        prov.facturasAdeudadas.forEach((fac) => {
          if (fac.saldo <= 0) return;
          const iso = parseDdMmYyyyToIso(fac.fechaPago || fac.fechaEmision);
          events.push({
            id: `PROV-${prov.id}-${fac.id}`,
            fecha: formatIsoToDdMmYyyy(iso),
            isoDate: iso,
            tipo: 'pago_proveedor_pendiente',
            titulo: `${prov.razonSocial}`,
            subtitulo: `${fac.tipo} ${fac.nroComprobante} · ${fac.descripcion || 'Compra a proveedor'}`,
            monto: fac.saldo,
            estado: iso < '2026-10-30' ? 'VENCIDO' : 'PENDIENTE',
            proveedorId: prov.id,
            proveedorNombre: prov.razonSocial,
            nroComprobante: `${fac.tipo} ${fac.nroComprobante}`,
            medioPagoPactado: fac.medioPagoPactado || 'Transferencia Bancaria'
          });
        });
      });
    }

    // 2. Cobros Pendientes de Clientes (Facturas Emitidas con saldo > 0)
    if (showLayerClientes && filtroProveedorId === 'TODOS') {
      clientes.forEach((cli) => {
        cli.facturasAdeudadas.forEach((fac) => {
          if (fac.saldo <= 0) return;
          const iso = parseDdMmYyyyToIso(fac.fechaPago || fac.fechaEmision);
          events.push({
            id: `CLI-${cli.id}-${fac.id}`,
            fecha: formatIsoToDdMmYyyy(iso),
            isoDate: iso,
            tipo: 'cobro_cliente_pendiente',
            titulo: `Cobro: ${cli.razonSocial}`,
            subtitulo: `${fac.tipo} ${fac.nroComprobante} · ${fac.descripcion || 'Cliente'}`,
            monto: fac.saldo,
            estado: 'PENDIENTE',
            clienteId: cli.id,
            clienteNombre: cli.razonSocial,
            nroComprobante: `${fac.tipo} ${fac.nroComprobante}`
          });
        });
      });
    }

    // 3. Cheques en Cartera y Cheques Entregados a Proveedores (Atados a Factura y Proveedor)
    if (showLayerCheques) {
      const seenChequeNumbers = new Set<string>();

      // 3a. Cheques asociados directamente a cada factura de proveedor
      proveedores.forEach((prov) => {
        if (filtroProveedorId !== 'TODOS' && prov.id !== filtroProveedorId) return;
        prov.facturasAdeudadas.forEach((fac) => {
          (fac.chequesAsociados || []).forEach((ch) => {
            seenChequeNumbers.add(ch.numero);
            const iso = parseDdMmYyyyToIso(ch.fechaPago || ch.fechaEmision);
            events.push({
              id: `CHQ-FAC-${prov.id}-${fac.id}-${ch.id}`,
              fecha: formatIsoToDdMmYyyy(iso),
              isoDate: iso,
              tipo: 'cheque_cartera',
              titulo: `🏦 Chq #${ch.numero} · ${prov.razonSocial}`,
              subtitulo: `Atado a ${fac.tipo} ${fac.nroComprobante} · ${ch.bancoEmisor} (Cuota ${
                ch.cuotaNro || 1
              }/${ch.totalCuotas || 1})`,
              monto: ch.importe,
              estado: 'EN_CARTERA',
              proveedorId: prov.id,
              proveedorNombre: prov.razonSocial,
              nroComprobante: `${fac.tipo} ${fac.nroComprobante}`
            });
          });
        });
      });

      // 3b. Cheques en cartera o entregados en el padrón general de cheques
      cheques.forEach((chq) => {
        if (seenChequeNumbers.has(chq.numero)) return;
        if (
          filtroProveedorId !== 'TODOS' &&
          chq.proveedorId !== filtroProveedorId
        ) {
          return;
        }
        const iso = parseDdMmYyyyToIso(chq.fechaPago || chq.fechaEmision);
        events.push({
          id: `CHQ-${chq.id}`,
          fecha: formatIsoToDdMmYyyy(iso),
          isoDate: iso,
          tipo: 'cheque_cartera',
          titulo: chq.proveedorNombre
            ? `🏦 Chq #${chq.numero} · ${chq.proveedorNombre}`
            : `Cheque #${chq.numero} · ${chq.bancoEmisor}`,
          subtitulo: chq.facturaNro
            ? `Atado a ${chq.facturaNro} · ${chq.bancoEmisor} (${chq.estado})`
            : `Librador: ${chq.librador} (${chq.estado})`,
          monto: chq.importe,
          estado: 'EN_CARTERA',
          proveedorId: chq.proveedorId,
          proveedorNombre: chq.proveedorNombre,
          nroComprobante: chq.facturaNro
        });
      });
    }

    // 4. Vencimientos Fiscales / Personalizados Agendados
    if (showLayerFiscal) {
      customEvents.forEach((ev) => {
        if (filtroProveedorId !== 'TODOS' && ev.proveedorId && ev.proveedorId !== filtroProveedorId) {
          return;
        }
        const iso = parseDdMmYyyyToIso(ev.fecha);
        events.push({
          id: `CUST-${ev.id}`,
          fecha: formatIsoToDdMmYyyy(iso),
          isoDate: iso,
          tipo: 'evento_agenda',
          titulo: ev.titulo,
          subtitulo: ev.proveedorNombre
            ? `Proveedor: ${ev.proveedorNombre}${ev.notas ? ` · ${ev.notas}` : ''}`
            : ev.notas || 'Vencimiento agendado en calendario',
          monto: ev.montoEstimado || 0,
          estado: 'AGENDADO',
          proveedorId: ev.proveedorId,
          proveedorNombre: ev.proveedorNombre,
          customEventId: ev.id
        });
      });
    }

    return events.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  }, [
    proveedores,
    clientes,
    cheques,
    customEvents,
    filtroProveedorId,
    showLayerProveedores,
    showLayerClientes,
    showLayerCheques,
    showLayerFiscal
  ]);

  // Todos los pagos pendientes de proveedores (filtrados por proveedor si aplica)
  const pagosPendientesProveedores = useMemo(() => {
    return proveedores
      .filter((p) => filtroProveedorId === 'TODOS' || p.id === filtroProveedorId)
      .flatMap((p) =>
        p.facturasAdeudadas
          .filter((f) => f.saldo > 0)
          .map((f) => ({
            ...f,
            proveedorId: p.id,
            proveedorNombre: p.razonSocial,
            proveedorCuit: p.cuit,
            isoDate: parseDdMmYyyyToIso(f.fechaPago || f.fechaEmision)
          }))
      )
      .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  }, [proveedores, filtroProveedorId]);

  // Pagos pendientes del proveedor elegido en la pestaña "Sacar Pago"
  const proveedorParaPago = useMemo(
    () => proveedores.find((p) => p.id === pagoProveedorId) || proveedores[0],
    [proveedores, pagoProveedorId]
  );

  const facturasPendientesProveedorSeleccionado = useMemo(
    () => (proveedorParaPago?.facturasAdeudadas || []).filter((f) => f.saldo > 0),
    [proveedorParaPago]
  );

  // Grilla de 42 celdas (6 semanas x 7 días, empezando en Lunes como Google Calendar)
  const calendarGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 0 = Domingo ... 6 = Sábado -> convertir a Lunes = 0 ... Domingo = 6
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;

    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    const cells: {
      isoDate: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEventMapped[];
    }[] = [];

    // Días del mes anterior
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(currentYear, currentMonth - 1, d);
      const iso = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(
        prevDate.getDate()
      ).padStart(2, '0')}`;
      cells.push({
        isoDate: iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: iso === '2026-10-30',
        events: allMappedEvents.filter((e) => e.isoDate === iso)
      });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        isoDate: iso,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: iso === '2026-10-30',
        events: allMappedEvents.filter((e) => e.isoDate === iso)
      });
    }

    // Completar hasta 42 celdas (o 35 si alcanza)
    const totalCells = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalCells) {
      const nextDate = new Date(currentYear, currentMonth + 1, nextDay++);
      const iso = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(
        nextDate.getDate()
      ).padStart(2, '0')}`;
      cells.push({
        isoDate: iso,
        dayNumber: nextDate.getDate(),
        isCurrentMonth: false,
        isToday: iso === '2026-10-30',
        events: allMappedEvents.filter((e) => e.isoDate === iso)
      });
    }

    return cells;
  }, [currentYear, currentMonth, allMappedEvents]);

  const selectedDayEvents = useMemo(
    () => allMappedEvents.filter((e) => e.isoDate === selectedIsoDate),
    [allMappedEvents, selectedIsoDate]
  );

  if (!isOpen) return null;

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9);
    setSelectedIsoDate('2026-10-30');
  };

  const jumpToIsoDate = (iso: string) => {
    const [y, m] = iso.split('-').map(Number);
    if (y && m) {
      setCurrentYear(y);
      setCurrentMonth(m - 1);
    }
    setSelectedIsoDate(iso);
  };

  // Acción 1: Cargar nueva Factura / Pago Pendiente de Proveedor en la fecha seleccionada del calendario
  const handleCrearFacturaEnFecha = async (e: React.FormEvent) => {
    e.preventDefault();
    const neto = Number(formNetoGravado);
    if (!formProveedorId || !neto || neto <= 0) return;

    const fechaVtoDdMmYyyy = formatIsoToDdMmYyyy(selectedIsoDate);
    const provObj = proveedores.find((p) => p.id === formProveedorId);

    await registrarFacturaCompra({
      proveedorId: formProveedorId,
      tipo: formTipoComp,
      netoGravado: neto,
      descripcion:
        formDescripcion.trim() ||
        `Vencimiento programado desde Calendario (${fechaVtoDdMmYyyy})`,
      cuentaGasto: formCuentaGasto,
      medioPagoPactado: formMedioPagoPactado,
      fechaVencimiento: fechaVtoDdMmYyyy
    });

    setFormDescripcion('');
    setFormNetoGravado('');
    setRightPanelTab('detalle');
    setFeedbackMsg(
      `Factura pendiente registrada para ${provObj?.razonSocial || 'Proveedor'} con vencimiento el ${fechaVtoDdMmYyyy}.`
    );
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Acción 2: Sacar el pago de una factura pendiente del proveedor elegido
  const handleSacarPagoProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = Number(pagoMonto);
    if (!pagoProveedorId || !montoNum || montoNum <= 0) return;

    const provObj = proveedores.find((p) => p.id === pagoProveedorId);

    await registrarPagoProveedor({
      proveedorId: pagoProveedorId,
      monto: montoNum,
      medioPago: pagoMedio,
      cuentaBancariaId: pagoCuentaBancariaId || cuentasBancarias[0]?.id
    });

    setPagoMonto('');
    setPagoFacturaSeleccionadaId('');
    setRightPanelTab('detalle');
    setFeedbackMsg(
      `Orden de Pago emitida para ${provObj?.razonSocial || 'Proveedor'} por $${montoNum.toLocaleString(
        'es-AR',
        { minimumFractionDigits: 2 }
      )}. Saldo descontado de Tesorería.`
    );
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Acción 3: Agendar un vencimiento o recordatorio personalizado en la fecha seleccionada
  const handleAgendarEventoCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaTitulo.trim()) return;

    const provObj = proveedores.find((p) => p.id === agendaProveedorId);
    const nuevo: EventoCalendarioCustom = {
      id: `EV-${Date.now()}`,
      fecha: formatIsoToDdMmYyyy(selectedIsoDate),
      titulo: agendaTitulo.trim(),
      categoria: agendaCategoria,
      proveedorId: agendaProveedorId || undefined,
      proveedorNombre: provObj?.razonSocial,
      montoEstimado: Number(agendaMonto) || 0,
      notas: agendaNotas.trim() || undefined
    };

    const updated = [...customEvents, nuevo];
    setCustomEvents(updated);
    saveCustomEvents(updated);

    setAgendaTitulo('');
    setAgendaMonto('');
    setAgendaNotas('');
    setRightPanelTab('detalle');
    setFeedbackMsg(`Vencimiento "${nuevo.titulo}" agendado para el ${nuevo.fecha}.`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleEliminarEventoCustom = (customId: string) => {
    const updated = customEvents.filter((c) => c.id !== customId);
    setCustomEvents(updated);
    saveCustomEvents(updated);
  };

  const abrirSacarPagoDesdeEvento = (ev: CalendarEventMapped) => {
    if (ev.proveedorId) {
      setPagoProveedorId(ev.proveedorId);
      setPagoMonto(String(ev.monto));
      if (ev.medioPagoPactado) {
        setPagoMedio(ev.medioPagoPactado);
        const ctaMatch = cuentasBancarias.find((c) =>
          ev.medioPagoPactado?.toLowerCase().includes(c.nombre.toLowerCase()) ||
          ev.medioPagoPactado?.toLowerCase().includes(c.banco.toLowerCase())
        );
        if (ctaMatch) setPagoCuentaBancariaId(ctaMatch.id);
      }
      setRightPanelTab('sacar_pago');
    }
  };

  const totalDeudaProveedores = pagosPendientesProveedores.reduce((acc, f) => acc + f.saldo, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-300 w-full max-w-[1440px] h-[92vh] shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* TOP HEADER ESTILO GOOGLE CALENDAR */}
        <div className="px-4 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#064e3b] text-white flex items-center justify-center">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#042f22] uppercase tracking-tight">
                  Calendario de Vencimientos y Pagos
                </h2>
                <p className="text-[10px] text-slate-500">
                  Mapeado en vivo con Facturas Adeudadas de Proveedores, Cobranzas y Cheques
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-emerald-50 text-slate-800 font-bold text-xs transition-colors"
            >
              Hoy (30 Oct)
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 min-w-[155px]">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
          </div>

          {/* FILTRO DE PROVEEDOR + SELECTOR DE VISTA + BOTÓN AGREGAR */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-300 px-2.5 py-1">
              <Filter className="w-3.5 h-3.5 text-[#064e3b]" />
              <span className="text-[10px] font-bold text-[#064e3b] uppercase">Proveedor:</span>
              <select
                value={filtroProveedorId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFiltroProveedorId(val);
                  if (val !== 'TODOS') {
                    setFormProveedorId(val);
                    setPagoProveedorId(val);
                  }
                }}
                className="bg-transparent text-xs font-bold text-[#042f22] focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos los proveedores ({proveedores.length})</option>
                {proveedores.map((p) => {
                  const cantPend = p.facturasAdeudadas.filter((f) => f.saldo > 0).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.razonSocial} ({cantPend} pend. · ${p.saldo.toLocaleString('es-AR')})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex border border-slate-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 font-bold text-xs ${
                  viewMode === 'month'
                    ? 'bg-[#064e3b] text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 font-bold text-xs border-l border-slate-300 ${
                  viewMode === 'agenda'
                    ? 'bg-[#064e3b] text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Agenda ({allMappedEvents.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setRightPanelTab('nueva_factura')}
              className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#042f22] text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cargar Vencimiento / Factura</span>
            </button>

            <button
              type="button"
              onClick={() => setRightPanelTab('sacar_pago')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Sacar Pago a Proveedor</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 ml-1"
              title="Cerrar calendario"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BANNER DE FEEDBACK SI SE CREÓ UNA FACTURA O SE SACÓ UN PAGO */}
        {feedbackMsg && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-300 flex items-center justify-between text-[#064e3b] font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs underline">
              Cerrar
            </button>
          </div>
        )}

        {/* CUERPO PRINCIPAL EN 3 COLUMNAS ESTILO GOOGLE CALENDAR */}
        <div className="flex-1 flex overflow-hidden">
          {/* COLUMNA IZQUIERDA: CAPAS + LISTA DE PAGOS PENDIENTES DE PROVEEDORES */}
          <div className="w-72 border-r border-slate-200 bg-slate-50/70 flex flex-col overflow-hidden shrink-0 hidden lg:flex">
            {/* Capas ("Mis Calendarios") */}
            <div className="p-3.5 border-b border-slate-200 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Capas Mapeadas del ERP
              </span>
              <label className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showLayerProveedores}
                    onChange={(e) => setShowLayerProveedores(e.target.checked)}
                    className="accent-rose-600"
                  />
                  <span className="w-2.5 h-2.5 bg-rose-600 inline-block" />
                  <span>Pagos Pendientes Proveedores</span>
                </span>
                <span className="text-[10px] font-bold text-rose-700">
                  {pagosPendientesProveedores.length}
                </span>
              </label>

              <label className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showLayerClientes}
                    onChange={(e) => setShowLayerClientes(e.target.checked)}
                    className="accent-emerald-700"
                  />
                  <span className="w-2.5 h-2.5 bg-emerald-600 inline-block" />
                  <span>Cobros Pendientes Clientes</span>
                </span>
              </label>

              <label className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showLayerCheques}
                    onChange={(e) => setShowLayerCheques(e.target.checked)}
                    className="accent-indigo-600"
                  />
                  <span className="w-2.5 h-2.5 bg-indigo-600 inline-block" />
                  <span>Cheques en Cartera</span>
                </span>
              </label>

              <label className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showLayerFiscal}
                    onChange={(e) => setShowLayerFiscal(e.target.checked)}
                    className="accent-amber-600"
                  />
                  <span className="w-2.5 h-2.5 bg-amber-500 inline-block" />
                  <span>Agenda Fiscal / Recordatorios</span>
                </span>
              </label>
            </div>

            {/* Lista en vivo de Pagos Pendientes de Proveedores */}
            <div className="p-3 bg-rose-50/60 border-b border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-rose-900 uppercase block">
                  Pagos Pendientes a Proveedores
                </span>
                <span className="text-xs font-extrabold text-rose-700">
                  Total: ${totalDeudaProveedores.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px]">
                {pagosPendientesProveedores.length} fact.
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {pagosPendientesProveedores.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  No hay pagos pendientes para el filtro seleccionado.
                </div>
              ) : (
                pagosPendientesProveedores.map((fp) => (
                  <div
                    key={`${fp.proveedorId}-${fp.id}`}
                    onClick={() => jumpToIsoDate(fp.isoDate)}
                    className={`p-2.5 border transition-all cursor-pointer ${
                      selectedIsoDate === fp.isoDate
                        ? 'bg-rose-50 border-rose-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-extrabold text-rose-800 bg-rose-100 px-1.5 py-0.5">
                        Vence: {fp.fechaPago}
                      </span>
                      <span className="font-extrabold text-rose-700 text-xs">
                        ${fp.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 truncate">{fp.proveedorNombre}</p>
                    <p className="text-[10px] text-slate-600 truncate">
                      {fp.tipo} {fp.nroComprobante} · {fp.descripcion}
                    </p>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] text-amber-800 font-semibold truncate">
                        Medio: {fp.medioPagoPactado || 'A definir'}
                      </span>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          jumpToIsoDate(fp.isoDate);
                          setPagoProveedorId(fp.proveedorId);
                          setPagoFacturaSeleccionadaId(fp.id);
                          setPagoMonto(String(fp.saldo));
                          setRightPanelTab('sacar_pago');
                        }}
                        className="px-2 py-0.5 bg-[#064e3b] hover:bg-[#042f22] text-white font-bold text-[10px]"
                      >
                        Sacar Pago
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMNA CENTRAL: GRILLA MENSUAL GOOGLE CALENDAR O VISTA AGENDA */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {viewMode === 'month' ? (
              <>
                {/* Encabezado de los 7 días de la semana */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 shrink-0">
                  {DAY_HEADERS.map((dayName) => (
                    <div
                      key={dayName}
                      className="py-2 text-center text-[11px] font-extrabold text-slate-600 tracking-wider border-r border-slate-200 last:border-r-0"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Celdas del Mes estilo Google Calendar */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                  {calendarGridDays.map((cell) => {
                    const isSelected = cell.isoDate === selectedIsoDate;
                    const dayTotalProveedores = cell.events
                      .filter((e) => e.tipo === 'pago_proveedor_pendiente')
                      .reduce((s, e) => s + e.monto, 0);

                    return (
                      <div
                        key={cell.isoDate}
                        onClick={() => {
                          setSelectedIsoDate(cell.isoDate);
                        }}
                        className={`min-h-[108px] p-1.5 border-b border-r border-slate-200 flex flex-col justify-between transition-colors cursor-pointer group ${
                          !cell.isCurrentMonth ? 'bg-slate-50/60 text-slate-400' : 'bg-white'
                        } ${
                          isSelected
                            ? 'ring-2 ring-inset ring-[#064e3b] bg-emerald-50/25'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Cabecera de la celda: Número de día + Botón rápido + */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${
                              cell.isToday
                                ? 'bg-[#064e3b] text-white'
                                : isSelected
                                ? 'bg-emerald-200 text-[#042f22]'
                                : cell.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>

                          <div className="flex items-center gap-1">
                            {dayTotalProveedores > 0 && (
                              <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1">
                                ${dayTotalProveedores.toLocaleString('es-AR')}
                              </span>
                            )}
                            <button
                              type="button"
                              title="Agregar vencimiento o factura en este día"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedIsoDate(cell.isoDate);
                                setRightPanelTab('nueva_factura');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 bg-emerald-50 hover:bg-[#064e3b] text-[#064e3b] hover:text-white border border-emerald-300 transition-opacity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Píldoras de Eventos estilo Google Calendar */}
                        <div className="flex-1 space-y-1 overflow-y-auto max-h-[82px] pr-0.5">
                          {cell.events.map((ev) => {
                            const pillStyles =
                              ev.tipo === 'pago_proveedor_pendiente'
                                ? 'bg-rose-600 text-white hover:bg-rose-700'
                                : ev.tipo === 'cobro_cliente_pendiente'
                                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                : ev.tipo === 'cheque_cartera'
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200';

                            return (
                              <div
                                key={ev.id}
                                onClick={(clickEv) => {
                                  clickEv.stopPropagation();
                                  setSelectedIsoDate(cell.isoDate);
                                  setRightPanelTab('detalle');
                                }}
                                className={`px-1.5 py-0.5 text-[10px] font-semibold truncate flex items-center justify-between gap-1 rounded-sm ${pillStyles}`}
                                title={`${ev.titulo} - ${ev.subtitulo} ($${ev.monto.toLocaleString('es-AR')})`}
                              >
                                <span className="truncate">{ev.titulo}</span>
                                {ev.monto > 0 && (
                                  <span className="font-extrabold shrink-0">
                                    ${Math.round(ev.monto).toLocaleString('es-AR')}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* VISTA AGENDA COMPLETA */
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase mb-3">
                  Agenda Cronológica de Vencimientos ({allMappedEvents.length} registros)
                </h4>
                {allMappedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      jumpToIsoDate(ev.isoDate);
                      setRightPanelTab('detalle');
                    }}
                    className="p-3 bg-white border border-slate-200 hover:border-[#064e3b] flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 font-bold text-slate-900">
                        {ev.fecha}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{ev.titulo}</p>
                        <p className="text-[11px] text-slate-600">{ev.subtitulo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {ev.monto > 0 && (
                        <span
                          className={`font-extrabold text-xs ${
                            ev.tipo === 'pago_proveedor_pendiente'
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          ${ev.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {ev.tipo === 'pago_proveedor_pendiente' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            jumpToIsoDate(ev.isoDate);
                            abrirSacarPagoDesdeEvento(ev);
                          }}
                          className="px-2.5 py-1 bg-[#064e3b] text-white font-bold text-[10px]"
                        >
                          Sacar Pago
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: DETALLE DEL DÍA SELECCIONADO + CARGAR FACTURA / SACAR PAGO / AGENDAR */}
          <div className="w-96 border-l border-slate-200 bg-slate-50/50 flex flex-col overflow-hidden shrink-0">
            {/* Fecha activa en el panel derecho */}
            <div className="p-3.5 bg-[#042f22] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                  Día Seleccionado en Calendario
                </span>
                <h4 className="text-sm font-extrabold">
                  {formatIsoToDdMmYyyy(selectedIsoDate)} ({selectedDayEvents.length} vencimientos)
                </h4>
              </div>
              <input
                type="date"
                value={selectedIsoDate}
                onChange={(e) => {
                  if (e.target.value) jumpToIsoDate(e.target.value);
                }}
                className="bg-[#064e3b] text-white border border-emerald-500 px-2 py-1 text-xs font-bold"
              />
            </div>

            {/* Pestañas de Acción Rápida sobre la Fecha Seleccionada */}
            <div className="grid grid-cols-4 border-b border-slate-200 bg-white text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setRightPanelTab('detalle')}
                className={`py-2.5 text-center border-b-2 transition-colors ${
                  rightPanelTab === 'detalle'
                    ? 'border-[#064e3b] text-[#064e3b] bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                Del Día ({selectedDayEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('nueva_factura')}
                className={`py-2.5 text-center border-b-2 transition-colors ${
                  rightPanelTab === 'nueva_factura'
                    ? 'border-[#064e3b] text-[#064e3b] bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                + Factura
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('sacar_pago')}
                className={`py-2.5 text-center border-b-2 transition-colors ${
                  rightPanelTab === 'sacar_pago'
                    ? 'border-amber-600 text-amber-800 bg-amber-50/60'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                $ Sacar Pago
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('agendar')}
                className={`py-2.5 text-center border-b-2 transition-colors ${
                  rightPanelTab === 'agendar'
                    ? 'border-[#064e3b] text-[#064e3b] bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                + Recordatorio
              </button>
            </div>

            {/* CONTENIDO DE LA PESTAÑA ACTIVA EN EL PANEL DERECHO */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {rightPanelTab === 'detalle' && (
                <>
                  {selectedDayEvents.length === 0 ? (
                    <div className="p-5 bg-white border border-slate-200 text-center space-y-3">
                      <Clock className="w-7 h-7 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        Sin vencimientos registrados para el {formatIsoToDdMmYyyy(selectedIsoDate)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Podés cargar una factura de proveedor con vencimiento en esta fecha o agendar un recordatorio.
                      </p>
                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setRightPanelTab('nueva_factura')}
                          className="w-full py-2 bg-[#064e3b] hover:bg-[#042f22] text-white font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Cargar Factura de Proveedor el {formatIsoToDdMmYyyy(selectedIsoDate)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRightPanelTab('agendar')}
                          className="w-full py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs"
                        >
                          Agendar Recordatorio Fiscal / Operativo
                        </button>
                      </div>
                    </div>
                  ) : (
                    selectedDayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 bg-white border border-slate-200 shadow-sm space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                              ev.tipo === 'pago_proveedor_pendiente'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : ev.tipo === 'cobro_cliente_pendiente'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : ev.tipo === 'cheque_cartera'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {ev.tipo === 'pago_proveedor_pendiente'
                              ? 'Pago Pendiente Proveedor'
                              : ev.tipo === 'cobro_cliente_pendiente'
                              ? 'Cobro Pendiente Cliente'
                              : ev.tipo === 'cheque_cartera'
                              ? 'Cheque en Cartera'
                              : 'Agenda / Vencimiento'}
                          </span>

                          {ev.customEventId && (
                            <button
                              type="button"
                              onClick={() => handleEliminarEventoCustom(ev.customEventId!)}
                              className="text-slate-400 hover:text-rose-600"
                              title="Eliminar recordatorio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div>
                          <h5 className="font-extrabold text-slate-900 text-xs">{ev.titulo}</h5>
                          <p className="text-[11px] text-slate-600">{ev.subtitulo}</p>
                        </div>

                        {ev.medioPagoPactado && (
                          <div className="text-[10px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-1">
                            Medio de pago pactado: <strong>{ev.medioPagoPactado}</strong>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-sm font-extrabold text-slate-900">
                            {ev.monto > 0
                              ? `$${ev.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : 'Sin monto fijo'}
                          </span>

                          {ev.tipo === 'pago_proveedor_pendiente' && (
                            <button
                              type="button"
                              onClick={() => abrirSacarPagoDesdeEvento(ev)}
                              className="px-3 py-1 bg-[#064e3b] hover:bg-[#042f22] text-white font-bold text-xs flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Sacar Pago</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* TAB 2: CARGAR NUEVA FACTURA DE PROVEEDOR CON VENCIMIENTO EN ESTA FECHA */}
              {rightPanelTab === 'nueva_factura' && (
                <form onSubmit={handleCrearFacturaEnFecha} className="bg-white border border-slate-200 p-3.5 space-y-3">
                  <div className="pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-extrabold text-[#064e3b] uppercase block">
                      Programar Factura de Proveedor en Calendario
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Quedará como <strong>PENDIENTE</strong> con vencimiento el{' '}
                      <strong>{formatIsoToDdMmYyyy(selectedIsoDate)}</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Elegir Proveedor:
                    </label>
                    <select
                      value={formProveedorId}
                      onChange={(e) => setFormProveedorId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 font-bold text-xs"
                      required
                    >
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.razonSocial} (CUIT: {p.cuit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                        Comprobante:
                      </label>
                      <select
                        value={formTipoComp}
                        onChange={(e) => setFormTipoComp(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 text-xs font-bold"
                      >
                        <option value="Factura A">Factura A</option>
                        <option value="Factura B">Factura B</option>
                        <option value="Factura C">Factura C</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                        Fecha Vencimiento:
                      </label>
                      <input
                        type="date"
                        value={selectedIsoDate}
                        onChange={(e) => {
                          if (e.target.value) jumpToIsoDate(e.target.value);
                        }}
                        className="w-full p-2 bg-emerald-50 border border-emerald-400 text-xs font-bold text-[#042f22]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Medio de Pago Pactado (Queda Pendiente):
                    </label>
                    <select
                      value={formMedioPagoPactado}
                      onChange={(e) => setFormMedioPagoPactado(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 text-xs font-bold"
                    >
                      {cuentasBancarias.map((cta) => (
                        <option key={cta.id} value={`Transferencia ${cta.nombre}`}>
                          Transferencia {cta.nombre}
                        </option>
                      ))}
                      <option value="Cheque de Pago Diferido (CPD)">Cheque de Pago Diferido (CPD)</option>
                      <option value="Efectivo por Caja Chica">Efectivo por Caja Chica</option>
                      <option value="Mercado Pago Empresarial">Mercado Pago Empresarial</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Cuenta Contable de Imputación:
                    </label>
                    <select
                      value={formCuentaGasto}
                      onChange={(e) => setFormCuentaGasto(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 text-xs"
                    >
                      {cuentasImputables.map((c) => (
                        <option key={c.codigo} value={`${c.codigo} - ${c.nombre}`}>
                          {c.codigo} - {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Descripción / Concepto:
                    </label>
                    <input
                      type="text"
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                      placeholder="Ej: Compra de materiales o servicio mensual"
                      className="w-full p-2 bg-white border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Neto Gravado ($ ARS):
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={formNetoGravado}
                      onChange={(e) => setFormNetoGravado(e.target.value)}
                      placeholder="Ej: 250000"
                      className="w-full p-2 bg-white border border-slate-300 text-sm font-extrabold"
                      required
                    />
                    {Number(formNetoGravado) > 0 && (
                      <p className="text-[10px] text-[#064e3b] font-bold mt-1">
                        Total con IVA: $
                        {(
                          Number(formNetoGravado) *
                          (formTipoComp === 'Factura A' || formTipoComp === 'Factura B' ? 1.21 : 1)
                        ).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#064e3b] hover:bg-[#042f22] text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Guardar en Calendario y Proveedores</span>
                  </button>
                </form>
              )}

              {/* TAB 3: ELEGIR PROVEEDOR, VER SUS PAGOS PENDIENTES Y SACAR EL PAGO */}
              {rightPanelTab === 'sacar_pago' && (
                <form onSubmit={handleSacarPagoProveedor} className="bg-white border border-slate-200 p-3.5 space-y-3">
                  <div className="pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase block">
                      Emitir Orden de Pago desde el Calendario
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Elegí el proveedor para ver sus facturas adeudadas y descontar el pago de Tesorería.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      1. Elegir Proveedor del Pago:
                    </label>
                    <select
                      value={pagoProveedorId}
                      onChange={(e) => {
                        setPagoProveedorId(e.target.value);
                        setPagoFacturaSeleccionadaId('');
                      }}
                      className="w-full p-2 bg-emerald-50 border border-emerald-400 font-bold text-xs text-[#042f22]"
                    >
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.razonSocial} — Saldo Pendiente: ${p.saldo.toLocaleString('es-AR')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lista de Pagos Pendientes del Proveedor Seleccionado */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase block">
                      2. Pagos Pendientes de {proveedorParaPago?.razonSocial}:
                    </label>
                    {facturasPendientesProveedorSeleccionado.length === 0 ? (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                        Este proveedor no tiene facturas pendientes de pago.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {facturasPendientesProveedorSeleccionado.map((fac) => {
                          const isChosen = pagoFacturaSeleccionadaId === fac.id;
                          return (
                            <div
                              key={fac.id}
                              onClick={() => {
                                setPagoFacturaSeleccionadaId(fac.id);
                                setPagoMonto(String(fac.saldo));
                                if (fac.medioPagoPactado) setPagoMedio(fac.medioPagoPactado);
                              }}
                              className={`p-2 border cursor-pointer transition-all ${
                                isChosen
                                  ? 'bg-amber-50 border-amber-500 shadow-sm'
                                  : 'bg-slate-50 border-slate-200 hover:border-amber-400'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold text-xs">
                                <span className="text-slate-900">
                                  {fac.tipo} {fac.nroComprobante}
                                </span>
                                <span className="text-rose-700">
                                  ${fac.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-600 mt-0.5">
                                <span>Vence: {fac.fechaPago}</span>
                                <span>Medio: {fac.medioPagoPactado || 'Transferencia'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      3. Cuenta de Tesorería / Caja de donde sale el dinero:
                    </label>
                    <select
                      value={pagoCuentaBancariaId}
                      onChange={(e) => setPagoCuentaBancariaId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 text-xs font-bold"
                    >
                      {cuentasBancarias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.banco}) — Disp: ${c.saldoActual.toLocaleString('es-AR')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      4. Importe a Pagar ($ ARS):
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={pagoMonto}
                      onChange={(e) => setPagoMonto(e.target.value)}
                      placeholder="Seleccione una factura arriba o ingrese monto"
                      className="w-full p-2 bg-white border border-slate-300 text-sm font-extrabold text-emerald-900"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Confirmar Orden de Pago y Descontar Saldo</span>
                  </button>
                </form>
              )}

              {/* TAB 4: AGENDAR RECORDATORIO O VENCIMIENTO PERSONALIZADO */}
              {rightPanelTab === 'agendar' && (
                <form onSubmit={handleAgendarEventoCustom} className="bg-white border border-slate-200 p-3.5 space-y-3">
                  <div className="pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-extrabold text-[#064e3b] uppercase block">
                      Nuevo Evento en Calendario ({formatIsoToDdMmYyyy(selectedIsoDate)})
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Título del Vencimiento:
                    </label>
                    <input
                      type="text"
                      value={agendaTitulo}
                      onChange={(e) => setAgendaTitulo(e.target.value)}
                      placeholder="Ej: Pago quincena / Vencimiento convenio proveedor"
                      className="w-full p-2 bg-white border border-slate-300 text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                        Categoría:
                      </label>
                      <select
                        value={agendaCategoria}
                        onChange={(e) => setAgendaCategoria(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 text-xs font-bold"
                      >
                        <option value="proveedor">Pago a Proveedor</option>
                        <option value="fiscal">Fiscal / ARCA</option>
                        <option value="laboral">Laboral / Sueldos</option>
                        <option value="otro">Otro Operativo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                        Monto Estimado ($):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={agendaMonto}
                        onChange={(e) => setAgendaMonto(e.target.value)}
                        placeholder="Opcional"
                        className="w-full p-2 bg-white border border-slate-300 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Vincular a Proveedor (Opcional):
                    </label>
                    <select
                      value={agendaProveedorId}
                      onChange={(e) => setAgendaProveedorId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 text-xs"
                    >
                      <option value="">-- Sin proveedor específico --</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.razonSocial}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Notas:
                    </label>
                    <input
                      type="text"
                      value={agendaNotas}
                      onChange={(e) => setAgendaNotas(e.target.value)}
                      placeholder="Detalle adicional..."
                      className="w-full p-2 bg-white border border-slate-300 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#064e3b] hover:bg-[#042f22] text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agendar en el Calendario</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
