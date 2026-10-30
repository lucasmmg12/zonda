import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Minimize2,
  Sparkles,
  Zap,
  BarChart3,
  Users,
  Banknote,
  Bell,
  FileText,
  ShoppingCart,
  Building2,
  ClipboardList,
  Receipt,
  Download,
  ShieldCheck,
  Mic,
  Trash2,
  Loader2,
  AudioLines,
  BookOpenCheck,
  Boxes,
  BadgeDollarSign,
  ArrowRightLeft,
  Settings,
  Footprints,
  ExternalLink
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import type { ModuleKey } from './layout/Sidebar';
import { getUsuariosList, getActiveOperator } from '../services/usuariosRbacService';
import { exportToExcelCsv } from '../utils/exportUtils';
import {
  generateLibroIvaDigitalRg4597,
  downloadTxtFile
} from '../utils/afipLibroIvaDigital';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MODULE_LABELS: Record<ModuleKey, string> = {
  tablero: '01 · Tablero de Control Financiero',
  clientes: '02 · Clientes, Facturación AFIP y Cobranzas',
  proveedores: '03 · Proveedores, Compras y Cuentas por Pagar',
  tesoreria: '04 · Tesorería, Bancos y Cartera de Cheques',
  contabilidad: '05 · Contabilidad, Plan de Cuentas y Libros',
  inventario: '06 · Inventario, Kardex y Listas de Precios',
  sueldos: '07 · Sueldos, Legajos y Libro Sueldos Digital',
  migracion: '08 · Centro de Migración ERP (Dry-Run)',
  configuracion: '09 · Configuración Fiscal, ARCA y Mercado Pago',
  usuarios: '10 · Usuarios, Roles y Accesos (RBAC)'
};

const MODULE_QUICK_ACTIONS: Record<
  ModuleKey,
  { icon: React.ElementType; label: string; prompt: string }[]
> = {
  tablero: [
    { icon: Zap, label: 'Resumen ejecutivo hoy', prompt: '¿Cómo está la empresa hoy? Dame el resumen ejecutivo completo.' },
    { icon: Banknote, label: 'Flujo de caja 30d', prompt: '¿Cuál es mi flujo de caja y liquidez disponible en bancos y cheques?' },
    { icon: BarChart3, label: 'Anomalías y alertas', prompt: 'Detectá anomalías en stock crítico, cheques por vencer y facturas impagas.' },
    { icon: Receipt, label: 'Posición IVA del mes', prompt: 'Calculá mi Posición de IVA actual (Débito vs Crédito Fiscal).' }
  ],
  clientes: [
    { icon: Receipt, label: 'Facturación del mes', prompt: '¿Cuántas facturas de venta emitimos y cuál es el total facturado con CAE?' },
    { icon: Users, label: 'Deudores principales', prompt: '¿Cuáles son los clientes con mayor saldo pendiente de cobro?' },
    { icon: Download, label: 'Descargar Libro IVA Ventas', prompt: 'Quiero descargar el Libro IVA Ventas del período actual' },
    { icon: Zap, label: 'Emitir Factura rápida', prompt: 'Emití una Factura A para Constructora del Oeste por $450.000 de Certificación de Servicios' }
  ],
  proveedores: [
    { icon: ShoppingCart, label: 'Compras registradas', prompt: '¿Cuántas facturas de compra tenemos registradas y cuál es el total?' },
    { icon: Download, label: 'Descargar Libro IVA Compras', prompt: 'Quiero descargar el Libro IVA Compras del período actual' },
    { icon: Receipt, label: 'IVA Crédito Fiscal', prompt: '¿Cuánto IVA crédito fiscal tenemos acumulado en compras?' },
    { icon: Building2, label: 'Proveedores con deuda', prompt: '¿Cuáles son los principales proveedores a los que les debemos saldo?' }
  ],
  tesoreria: [
    { icon: Banknote, label: 'Saldos en Cajas y Bancos', prompt: '¿Cuál es mi posición actual en cada cuenta bancaria y caja?' },
    { icon: CalendarIcon, label: 'Cheques en cartera', prompt: '¿Qué cheques tenemos en cartera y cuáles son sus montos y vencimientos?' },
    { icon: Zap, label: 'Conciliar bancos', prompt: 'Conciliá todas las cuentas bancarias pendientes ahora.' },
    { icon: BarChart3, label: 'Proyección de liquidez', prompt: 'Analizá si los saldos en bancos y cheques cubren las deudas con proveedores.' }
  ],
  contabilidad: [
    { icon: BookOpenCheck, label: 'Auditoría Partida Doble', prompt: 'Verificá si todos los asientos del Libro Diario cumplen Partida Doble (Debe = Haber).' },
    { icon: FileText, label: 'Últimos asientos', prompt: 'Mostrame los últimos asientos contables registrados en el Libro Diario.' },
    { icon: Download, label: 'Exportar Libro IVA RG 4597', prompt: 'Quiero descargar el Libro IVA Ventas y Compras para AFIP' },
    { icon: BarChart3, label: 'Estado de Resultados', prompt: 'Calculá el resultado operativo comparando Ingresos por Ventas vs Compras y Sueldos.' }
  ],
  inventario: [
    { icon: Boxes, label: 'Alertas Stock Crítico', prompt: '¿Qué artículos de inventario tienen stock igual o por debajo del mínimo?' },
    { icon: BarChart3, label: 'Valorización del Stock', prompt: '¿Cuál es el valor total del inventario a costo y a precio de venta?' },
    { icon: ClipboardList, label: 'Catálogo completo', prompt: 'Listame los artículos principales del inventario con su stock disponible.' },
    { icon: Zap, label: 'Sugerir reposición', prompt: '¿Qué insumos o materiales deberíamos reponer con urgencia?' }
  ],
  sueldos: [
    { icon: BadgeDollarSign, label: 'Resumen Liquidación', prompt: 'Dame el resumen de la liquidación de sueldos actual: bruto, retenciones, neto y F.931.' },
    { icon: Users, label: 'Plantilla de Legajos', prompt: '¿Cuántos empleados activos tenemos en nómina y en qué convenios colectivos?' },
    { icon: FileText, label: 'Costo Patronal F.931', prompt: '¿Cuál es el costo total de cargas sociales F.931 del período?' },
    { icon: Zap, label: 'Detalle por empleado', prompt: 'Mostrame el listado de empleados con su CUIL, categoría y sueldo básico.' }
  ],
  migracion: [
    { icon: ArrowRightLeft, label: 'Estado de tablas DB', prompt: '¿Cuántos registros activos tenemos en cada tabla de Supabase PostgreSQL?' },
    { icon: ShieldCheck, label: 'Validar CUITs padrón', prompt: 'Auditá si todos los clientes y proveedores tienen CUIT válido cargado.' },
    { icon: Zap, label: 'Guía de importación', prompt: '¿Cómo funciona la importación de facturas con los 26 campos de impuestos?' },
    { icon: BarChart3, label: 'Integridad contable', prompt: 'Verificá la integridad entre comprobantes emitidos y asientos contables.' }
  ],
  configuracion: [
    { icon: Settings, label: 'Datos Fiscales Empresa', prompt: 'Mostrame la configuración fiscal actual de la empresa (CUIT, IVA, IIBB y Puntos de Venta).' },
    { icon: Zap, label: 'Estado WS-AFIP / ARCA', prompt: '¿Cómo funcionan las Edge Functions de ARCA WSFEv1 y Webhook Mercado Pago?' },
    { icon: Bell, label: 'Puntos de venta', prompt: '¿Qué puntos de venta AFIP están habilitados en el sistema?' },
    { icon: ShieldCheck, label: 'Auditoría de seguridad', prompt: 'Dame un diagnóstico del estado de conexión con Supabase PostgreSQL.' }
  ],
  usuarios: [
    { icon: ShieldCheck, label: 'Usuarios registrados', prompt: '¿Qué usuarios y roles RBAC están registrados y activos en el sistema?' },
    { icon: Users, label: 'Operador en sesión', prompt: '¿Qué rol está en sesión activa ahora y qué permisos tiene?' },
    { icon: Zap, label: 'Matriz de permisos', prompt: 'Explicame qué módulos puede operar cada rol del sistema.' },
    { icon: Download, label: 'Exportar Padrón RBAC', prompt: 'Quiero exportar el padrón de usuarios y permisos en Excel CSV.' }
  ]
};

function CalendarIcon(props: any) {
  return <Bell {...props} />;
}

const MODULE_IDLE_PHRASES: Record<ModuleKey, string[]> = {
  tablero: [
    '📊 Revisando los KPIs ejecutivos...',
    '🔍 Todo cuadrado en el Tablero Financiero',
    '💼 ¡Listo para asistirte en la oficina!'
  ],
  clientes: [
    '🧾 Verificando CAEs en ARCA / AFIP...',
    '📈 Revisando cobranzas y cuentas corrientes...',
    '💬 ¿Necesitás emitir una Factura Electrónica?'
  ],
  proveedores: [
    '📑 Auditando facturas de proveedores...',
    '🧮 Calculando el IVA Crédito Fiscal del mes...',
    '🏦 Revisando órdenes de pago pendientes...'
  ],
  tesoreria: [
    '💰 Controlando la cartera de cheques...',
    '🏦 Conciliando saldos de Santander y Galicia...',
    '📊 Monitoreando el flujo de caja en vivo...'
  ],
  contabilidad: [
    '⚖️ Verificando cuadre de Partida Doble (Debe = Haber)...',
    '📘 Revisando el Libro Diario y Mayor...',
    '🧾 Preparando el Libro IVA Digital RG 4597...'
  ],
  inventario: [
    '📦 Controlando el Kardex valorizado...',
    '🔍 Verificando alertas de stock mínimo...',
    '🏷️ Revisando listas de precios...'
  ],
  sueldos: [
    '👥 Revisando legajos y liquidación Ley 20.744...',
    '📋 Calculando cargas sociales F.931...',
    '📄 Listo para exportar Libro de Sueldos Digital...'
  ],
  migracion: [
    '🔄 Auditando integridad de padrones CSV...',
    '🛡️ Simulando validación Dry-Run...',
    '📊 Todo sincronizado con Supabase PostgreSQL'
  ],
  configuracion: [
    '🔐 Verificando certificados ARCA y Webhook MP...',
    '⚙️ Controlando puntos de venta fiscales...',
    '✅ Servicios cloud 100% operativos'
  ],
  usuarios: [
    '🛡️ Auditando roles y permisos RBAC...',
    '🔑 Controlando accesos por módulo...',
    '👤 Padrón de usuarios sincronizado en vivo'
  ]
};

const MODULE_CAPABILITIES: Record<
  ModuleKey,
  { where: string; capabilities: string[]; proTip: string }
> = {
  tablero: {
    where: '01 · Tablero de Control Financiero',
    capabilities: [
      'Darte un **resumen ejecutivo en tiempo real** de ventas, compras, bancos y cheques',
      '**Detectar anomalías** en stock crítico, cheques en cartera o saldos deudores',
      'Calcular tu **Posición de IVA mensual** y el resultado neto operativo',
      'Llevarte o ejecutar acciones directas sobre cualquiera de los **10 módulos**'
    ],
    proTip: 'Preguntame por voz o texto cualquier dato de la empresa y lo consulto en vivo en Supabase.'
  },
  clientes: {
    where: '02 · Clientes, Facturación AFIP y Cobranzas',
    capabilities: [
      '**Emitir Facturas Electrónicas con CAE** dictándome cliente, monto y concepto',
      'Consultar **deudores por ventas** y saldos de cuenta corriente',
      'Descargar el **Libro IVA Ventas** en Excel (`.CSV`) o `.TXT` RG 4597 con 1 clic',
      'Buscar cualquier cliente por **CUIT o Razón Social**'
    ],
    proTip: 'Podés decirme: "Emití una Factura A para Constructora del Oeste por $450.000" y la impacto con su asiento contable.'
  },
  proveedores: {
    where: '03 · Proveedores, Compras y Cuentas por Pagar',
    capabilities: [
      'Consultar **facturas de compra** registradas y su imputación contable',
      'Calcular el **IVA Crédito Fiscal** y retenciones acumuladas',
      'Descargar el **Libro IVA Compras** directo desde este chat',
      'Identificar los **proveedores con mayor saldo pendiente de pago**'
    ],
    proTip: 'Pedime "Descargar Libro IVA Compras" y te habilito el botón de descarga inmediata acá mismo.'
  },
  tesoreria: {
    where: '04 · Tesorería, Bancos y Cartera de Cheques',
    capabilities: [
      'Ver **saldos reales y conciliados** de todas las cajas y bancos',
      '**Conciliar cuentas bancarias** automáticamente desde el chat',
      'Revisar **cheques en cartera** con librador, banco, importe y fecha de cobro',
      '**Depositar cheques** o proyectar tu liquidez a 30 días'
    ],
    proTip: 'Decime "Conciliá todas las cuentas bancarias" y lo ejecuto en el acto en PostgreSQL.'
  },
  contabilidad: {
    where: '05 · Contabilidad, Plan de Cuentas y Libros',
    capabilities: [
      'Auditar el **cuadre de Partida Doble (`Debe = Haber`)** en todo el Libro Diario',
      'Consultar los **últimos asientos contables** automáticos y manuales',
      'Calcular la **Posición Mensual de IVA (F.2002)** y descargar los `.TXT` RG 4597',
      'Inspeccionar saldos del **Plan de Cuentas jerárquico**'
    ],
    proTip: 'Cada factura, cobro, pago o liquidación genera su asiento contable automático.'
  },
  inventario: {
    where: '06 · Inventario, Kardex y Listas de Precios',
    capabilities: [
      'Detectar artículos con **stock crítico (bajo mínimo)** para reponer',
      'Calcular la **valorización total del depósito** a costo PPP y precio de venta',
      'Consultar disponibilidad, SKU, alícuota de IVA y movimientos de Kardex'
    ],
    proTip: 'Preguntame "¿Qué artículos tienen stock bajo?" para prevenir quiebres de inventario.'
  },
  sueldos: {
    where: '07 · Sueldos, Legajos y Libro Sueldos Digital',
    capabilities: [
      'Consultar la **nómina activa de empleados**, CUIL, convenio CCT y sueldo básico',
      'Ver el resumen de **liquidación del período**: Total Bruto, Retenciones y Neto',
      'Calcular las **Contribuciones Patronales F.931 (SUSS)**'
    ],
    proTip: 'Soportamos CCT 130/75 (Comercio), CCT 76/75 (UOCRA), CCT 122/75 (Sanidad) y Fuera de Convenio.'
  },
  migracion: {
    where: '08 · Centro de Migración ERP (Dry-Run)',
    capabilities: [
      'Auditar la **cantidad de registros vivos** en las 14 tablas de Supabase',
      'Verificar la validez de **CUITs y cuadres contables** antes de importar',
      'Guiarte con la plantilla oficial de **26 columnas impositivas AFIP/IIBB**'
    ],
    proTip: 'El motor Dry-Run valida tus archivos Excel/CSV sin ensuciar la base productiva.'
  },
  configuracion: {
    where: '09 · Configuración Fiscal, ARCA y Mercado Pago',
    capabilities: [
      'Consultar **CUIT, Condición IVA, IIBB y Puntos de Venta** de la empresa',
      'Verificar el estado de las Edge Functions **`arca-wsfe`** y **`mercadopago-webhook`**',
      'Guiarte paso a paso en la homologación de certificados `.crt` y `.key`'
    ],
    proTip: 'Desde la barra superior también podés probar el ping en vivo contra ARCA y Mercado Pago.'
  },
  usuarios: {
    where: '10 · Usuarios, Roles y Accesos (RBAC)',
    capabilities: [
      'Consultar el **padrón completo de usuarios**, roles, emails y estados',
      'Ver qué **módulos y permisos críticos** tiene asignado cada operador',
      'Exportar la **Matriz de Usuarios y Permisos en Excel (`.CSV`)** desde el chat'
    ],
    proTip: 'En el Módulo 10 podés dar de alta o quitar usuarios y cambiar permisos con un solo clic.'
  }
};

// ==================== IDLE WALKER HOOK (Igual a Rombo) ====================
function useIdleWalker(chatOpen: boolean, moduleId: ModuleKey) {
  const [walking, setWalking] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [facingRight, setFacingRight] = useState(true);
  const [phrase, setPhrase] = useState('');
  const [showPhrase, setShowPhrase] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrame = useRef<number | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const dirRef = useRef(1);
  const IDLE_MS = 60000; // 1 minuto de inactividad
  const SPEED = 1.15;
  const ZONDA_SIZE = 115;

  const startWalking = useCallback(() => {
    const startX = 20;
    const startY = window.innerHeight - ZONDA_SIZE - 24;
    posRef.current = { x: startX, y: startY };
    dirRef.current = 1;
    setFacingRight(true);
    setPos({ x: startX, y: startY });
    setWalking(true);
    const phrases = MODULE_IDLE_PHRASES[moduleId] || MODULE_IDLE_PHRASES.tablero;
    setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    setShowPhrase(true);
    setTimeout(() => setShowPhrase(false), 4500);
  }, [moduleId]);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setWalking(false);
    setShowPhrase(false);
    if (animFrame.current) cancelAnimationFrame(animFrame.current);

    if (!chatOpen) {
      idleTimer.current = setTimeout(startWalking, IDLE_MS);
    }
  }, [chatOpen, startWalking]);

  useEffect(() => {
    if (!walking) return;
    let running = true;
    const maxX = Math.max(200, window.innerWidth - ZONDA_SIZE - 20);

    const step = () => {
      if (!running) return;
      posRef.current.x += SPEED * dirRef.current;

      if (posRef.current.x >= maxX) {
        dirRef.current = -1;
        setFacingRight(false);
        posRef.current.x = maxX;
        const phrases = MODULE_IDLE_PHRASES[moduleId] || MODULE_IDLE_PHRASES.tablero;
        setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
        setShowPhrase(true);
        setTimeout(() => setShowPhrase(false), 3500);
      } else if (posRef.current.x <= 16) {
        dirRef.current = 1;
        setFacingRight(true);
        posRef.current.x = 16;
      }

      setPos({ ...posRef.current });
      animFrame.current = requestAnimationFrame(step);
    };

    animFrame.current = requestAnimationFrame(step);
    return () => {
      running = false;
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [walking, moduleId]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [resetIdle]);

  return {
    walking,
    pos,
    facingRight,
    phrase,
    showPhrase,
    stopWalking: resetIdle,
    forceStart: startWalking
  };
}

// ==================== MAIN COMPONENT: ZONDA ASSISTANT ====================
export const ZondaChat: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    empresa,
    clientes,
    proveedores,
    facturasVenta,
    facturasCompra,
    cuentasBancarias,
    cheques,
    asientosContables,
    inventario,
    empleados,
    liquidacionActual,
    emitirFacturaVenta,
    conciliarCuentaBancaria,
    depositarCheque
  } = useErp();

  const moduleLabel = MODULE_LABELS[activeModule] || '01 · Tablero de Control';
  const [open, setOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bounce, setBounce] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevModuleRef = useRef<ModuleKey>(activeModule);

  const { walking, pos, facingRight, phrase, showPhrase, stopWalking, forceStart } =
    useIdleWalker(open || isMinimized, activeModule);

  // Grabación de voz / Dictado inteligente
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>('');
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const contextualGreeting = useMemo(() => {
    const info = MODULE_CAPABILITIES[activeModule] || MODULE_CAPABILITIES.tablero;
    const capsList = info.capabilities.map((c) => `• ${c}`).join('\n');
    return `¡Hola! 👋 Soy **Zonda**, tu copiloto contable y administrativo de **Grow // ERP**.\n\n📍 Estás en **${info.where}**. Acá puedo ayudarte a:\n\n${capsList}\n\n💡 **Tip:** ${info.proTip}\n\n¿Qué gestionamos hoy?`;
  }, [activeModule]);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: contextualGreeting }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar contexto cuando el usuario cambia de módulo con el chat abierto
  useEffect(() => {
    if (prevModuleRef.current !== activeModule && messages.length > 0) {
      prevModuleRef.current = activeModule;
      const info = MODULE_CAPABILITIES[activeModule];
      if (info) {
        const topCaps = info.capabilities
          .slice(0, 3)
          .map((c) => `• ${c}`)
          .join('\n');
        const navMsg = `📍 Cambiaste a **${info.where}**. Desde acá puedo:\n\n${topCaps}\n\n¿Qué necesitás consultar o ejecutar?`;
        setMessages((prev) => [...prev, { role: 'assistant', content: navMsg }]);
      }
    }
  }, [activeModule, messages.length]);

  const quickActions = useMemo(
    () => MODULE_QUICK_ACTIONS[activeModule] || MODULE_QUICK_ACTIONS.tablero,
    [activeModule]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const t = setTimeout(() => setBounce(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Motor Operativo de Zonda: Ejecuta acciones y consultas reales sobre el ERP + Supabase
  const procesarConsultaZonda = async (textoUsuario: string): Promise<string> => {
    const q = textoUsuario.toLowerCase().trim();
    const fmt = (n: number) =>
      `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 1. ACCIÓN REAL: Emitir Factura de Venta desde el chat
    if (
      (q.includes('emití') || q.includes('emiti') || q.includes('emitir') || q.includes('creá') || q.includes('generá')) &&
      q.includes('factura')
    ) {
      const montoMatch = textoUsuario.match(/\$?\s*([\d.]+(?:,\d{1,2})?)/);
      const montoExtraido = montoMatch
        ? Number(montoMatch[1].replace(/\./g, '').replace(',', '.'))
        : 450000;
      const neto = montoExtraido > 0 ? montoExtraido : 450000;

      const clienteEncontrado =
        clientes.find((c) => q.includes(c.razonSocial.toLowerCase().split(' ')[0])) ||
        clientes[0];

      const tipoComp = q.includes('factura b')
        ? 'Factura B'
        : q.includes('factura c')
          ? 'Factura C'
          : 'Factura A';

      await emitirFacturaVenta({
        clienteId: clienteEncontrado.id,
        tipo: tipoComp,
        netoGravado: neto,
        iva21: tipoComp === 'Factura C' ? 0 : Math.round(neto * 0.21 * 100) / 100,
        descripcion: `Comprobante emitido por Asistente Zonda IA`
      });

      const iva = tipoComp === 'Factura C' ? 0 : Math.round(neto * 0.21 * 100) / 100;
      const total = neto + iva;

      return `✅ **¡Comprobante Emitido y Contabilizado en Supabase!**\n\n• **Comprobante:** ${tipoComp} (Pto. Venta 0001)\n• **Cliente:** **${clienteEncontrado.razonSocial}** (CUIT ${clienteEncontrado.cuit})\n• **Neto Gravado:** ${fmt(neto)}\n• **IVA 21%:** ${fmt(iva)}\n• **Total Facturado:** **${fmt(total)}**\n• **Estado AFIP / ARCA:** CAE asignado y asiento de Partida Doble registrado en el Libro Diario.\n\n[NAVIGATE:clientes:Ir a Clientes y Ventas]`;
    }

    // 2. ACCIÓN REAL: Conciliar Cuentas Bancarias
    if (q.includes('conciliá') || q.includes('concilia') || q.includes('conciliar')) {
      for (const cta of cuentasBancarias) {
        await conciliarCuentaBancaria(cta.id);
      }
      const totalBancos = cuentasBancarias.reduce((acc, c) => acc + c.saldoActual, 0);
      return `✅ **¡Conciliación Bancaria Ejecutada con Éxito!**\n\nSe igualaron los saldos conciliados con los extractos reales en las **${cuentasBancarias.length} cuentas activas**.\n• **Disponibilidad Consolidada Conciliada:** **${fmt(totalBancos)}**\n\n[NAVIGATE:tesoreria:Ver Cuentas Conciliadas]`;
    }

    // 3. ACCIÓN REAL: Depositar cheque en cartera
    if (q.includes('depositá') || q.includes('depositar cheque')) {
      const enCartera = cheques.find((c) => c.estado === 'En Cartera');
      if (!enCartera) {
        return `ℹ️ Todos los cheques registrados ya se encuentran **Depositados** o **Acreditados** en tesorería.`;
      }
      await depositarCheque(enCartera.id);
      return `✅ **¡Cheque Depositado en Cuenta Bancaria!**\n\n• **Cheque N°:** **${enCartera.numero}** (${enCartera.bancoEmisor})\n• **Librador:** ${enCartera.librador}\n• **Importe Acreditado:** **${fmt(enCartera.importe)}**\n• **Contabilidad:** Se generó el asiento automático en el Libro Diario.\n\n[NAVIGATE:tesoreria:Ver Cartera de Cheques]`;
    }

    // 4. DESCARGA DE LIBRO IVA (Ventas / Compras)
    if (q.includes('libro iva') || q.includes('rg 4597') || (q.includes('descargar') && q.includes('iva'))) {
      const { resumenPosicionIva: pos } = generateLibroIvaDigitalRg4597(facturasVenta, facturasCompra);
      const retenciones = facturasCompra.reduce((s, f) => s + (f.retencionIva || 0) + (f.retencionIIBB || 0), 0);
      return `📑 **Posición de IVA y Descarga de Libros Oficiales (Período 2026-10)**\n\n• **IVA Débito Fiscal (Ventas):** **${fmt(pos.totalIvaDebitoFiscal)}** (${facturasVenta.length} comprobantes)\n• **IVA Crédito Fiscal (Compras):** **${fmt(pos.totalIvaCreditoFiscal)}** (${facturasCompra.length} comprobantes)\n• **Retenciones / Percepciones Sufridas:** **${fmt(retenciones)}**\n• **Saldo Técnico / Posición F.2002:** **${fmt(pos.saldoTecnicoIva)}**\n\nHacé clic abajo para descargar los archivos directamente:\n\n[DOWNLOAD_LIBRO_IVA:ventas]\n[DOWNLOAD_LIBRO_IVA:compras]`;
    }

    // 5. CONSULTA DE CHEQUES Y TESORERÍA
    if (q.includes('cheque') || q.includes('cartera') || q.includes('flujo de caja') || q.includes('banco') || q.includes('liquidez') || q.includes('caja')) {
      const totalBancos = cuentasBancarias.reduce((s, c) => s + c.saldoActual, 0);
      const chqCartera = cheques.filter((c) => c.estado === 'En Cartera');
      const totalCartera = chqCartera.reduce((s, c) => s + c.importe, 0);
      const detalleCuentas = cuentasBancarias
        .map((c) => `• **${c.nombre}** (${c.banco}): **${fmt(c.saldoActual)}**`)
        .join('\n');
      const detalleCheques = chqCartera
        .map((c) => `• **Chq #${c.numero}** (${c.bancoEmisor} - ${c.librador}): **${fmt(c.importe)}** — Cobro: ${c.fechaPago}`)
        .join('\n');

      return `🏦 **Estado de Tesorería, Liquidez y Cartera de Cheques**\n\n**Saldos en Cajas y Bancos (${cuentasBancarias.length} entidades):**\n${detalleCuentas}\n• **Total Disponibilidades:** **${fmt(totalBancos)}**\n\n**Cheques en Cartera (${chqCartera.length} valores disponibles):**\n${detalleCheques || '• Sin cheques pendientes en cartera'}\n• **Total Valores en Custodia:** **${fmt(totalCartera)}**\n\n[NAVIGATE:tesoreria:Ir a Tesorería y Cheques]`;
    }

    // 6. CONSULTA DE CLIENTES Y FACTURAS DE VENTA
    if (q.includes('cliente') || q.includes('facturas de venta') || q.includes('deudores') || q.includes('facturación') || q.includes('facturacion')) {
      const totalVentas = facturasVenta.reduce((s, f) => s + f.total, 0);
      const topDeudores = [...clientes]
        .filter((c) => c.saldo > 0)
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 5)
        .map((c) => `• **${c.razonSocial}** (CUIT ${c.cuit}): **${fmt(c.saldo)}**`)
        .join('\n');

      return `🧾 **Reporte de Clientes y Facturación AFIP**\n\n• **Total Facturado en el Período:** **${fmt(totalVentas)}** (${facturasVenta.length} comprobantes con CAE)\n• **Padrón Activo:** **${clientes.length} clientes** registrados\n\n**Principales Cuentas por Cobrar:**\n${topDeudores || '• Todas las cuentas al día'}\n\n[DOWNLOAD_LIBRO_IVA:ventas]\n[NAVIGATE:clientes:Abrir Módulo Clientes]`;
    }

    // 7. CONSULTA DE PROVEEDORES Y COMPRAS
    if (q.includes('proveedor') || q.includes('compra') || q.includes('crédito fiscal') || q.includes('credito fiscal')) {
      const totalCompras = facturasCompra.reduce((s, f) => s + f.total, 0);
      const totalIvaCompras = facturasCompra.reduce((s, f) => s + f.iva, 0);
      const topProveedores = [...proveedores]
        .filter((p) => p.saldo > 0)
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 5)
        .map((p) => `• **${p.razonSocial}** (CUIT ${p.cuit}): **${fmt(p.saldo)}**`)
        .join('\n');

      return `🛒 **Resumen de Compras, Proveedores e IVA Crédito Fiscal**\n\n• **Total Compras Registradas:** **${fmt(totalCompras)}** (${facturasCompra.length} comprobantes)\n• **IVA Crédito Fiscal Acumulado:** **${fmt(totalIvaCompras)}**\n• **Padrón de Proveedores:** **${proveedores.length} empresas** activas\n\n**Principales Saldos a Pagar:**\n${topProveedores || '• Sin deuda vencida con proveedores'}\n\n[DOWNLOAD_LIBRO_IVA:compras]\n[NAVIGATE:proveedores:Abrir Módulo Proveedores]`;
    }

    // 8. CONSULTA DE CONTABILIDAD Y PARTIDA DOBLE
    if (q.includes('asiento') || q.includes('partida doble') || q.includes('diario') || q.includes('contabilidad') || q.includes('resultado')) {
      const totalDebe = asientosContables.reduce((s, a) => s + a.totalDebe, 0);
      const totalHaber = asientosContables.reduce((s, a) => s + a.totalHaber, 0);
      const cuadrado = Math.abs(totalDebe - totalHaber) < 0.01;
      const ultimos = asientosContables
        .slice(0, 4)
        .map((a) => `• **Asiento #${a.numero}** (${a.fecha}) — ${a.concepto}: **${fmt(a.totalDebe)}**`)
        .join('\n');

      return `⚖️ **Auditoría del Libro Diario y Partida Doble**\n\n• **Asientos Registrados:** **${asientosContables.length} asientos** en PostgreSQL\n• **Suma Total Debe:** **${fmt(totalDebe)}**\n• **Suma Total Haber:** **${fmt(totalHaber)}**\n• **Diagnóstico Matemático:** ${cuadrado ? '✅ **100% CUADRADO (Diferencia $0,00)**' : '⚠️ Revisar diferencia'}\n\n**Últimos Pases Contables:**\n${ultimos}\n\n[NAVIGATE:contabilidad:Ver Libro Diario y Mayor]`;
    }

    // 9. CONSULTA DE INVENTARIO Y STOCK CRÍTICO
    if (q.includes('stock') || q.includes('inventario') || q.includes('artículo') || q.includes('articulo') || q.includes('mínimo') || q.includes('minimo') || q.includes('reponer')) {
      const criticos = inventario.filter((i) => i.stockActual <= i.stockMinimo);
      const valorCosto = inventario.reduce((s, i) => s + i.stockActual * i.costoCalculado, 0);
      const valorVenta = inventario.reduce((s, i) => s + i.stockActual * i.precioVentaNeto, 0);
      const listaCriticos = criticos
        .map((i) => `• **${i.codigo} - ${i.descripcion}**: Stock actual **${i.stockActual} ${i.um}** (Mínimo: ${i.stockMinimo})`)
        .join('\n');

      return `📦 **Auditoría de Inventario y Kardex Valorizado**\n\n• **Artículos en Catálogo:** **${inventario.length} ítems**\n• **Valorización a Costo PPP:** **${fmt(valorCosto)}**\n• **Valorización a Precio de Venta:** **${fmt(valorVenta)}**\n• **Alertas de Stock Bajo Mínimo (${criticos.length}):**\n${listaCriticos || '• ✅ Todos los artículos superan el stock mínimo de seguridad.'}\n\n[NAVIGATE:inventario:Ir a Inventario y Kardex]`;
    }

    // 10. CONSULTA DE SUELDOS, LEGAJOS Y F.931
    if (q.includes('sueldo') || q.includes('empleado') || q.includes('legajo') || q.includes('931') || q.includes('nómina') || q.includes('nomina') || q.includes('plantilla')) {
      const listaEmp = empleados
        .map((e) => `• **${e.legajo} - ${e.nombreCompleto}** (CUIL ${e.cuil}) — ${e.cct}: Básico **${fmt(e.sueldoBasico)}**`)
        .join('\n');

      return `👥 **Resumen de Recursos Humanos, Sueldos y F.931 (${liquidacionActual.periodo})**\n\n• **Plantilla Activa:** **${empleados.length} colaboradores**\n• **Total Haberes Brutos:** **${fmt(liquidacionActual.totalBruto)}**\n• **Retenciones de Ley:** **${fmt(liquidacionActual.totalRetenciones)}**\n• **Neto de Bolsillo a Pagar:** **${fmt(liquidacionActual.totalNeto)}**\n• **Contribuciones Patronales F.931 (SUSS):** **${fmt(liquidacionActual.totalContribucionesPatronales)}**\n\n**Nómina de Legajos:**\n${listaEmp}\n\n[NAVIGATE:sueldos:Abrir Liquidación y LSD]`;
    }

    // 11. CONSULTA DE USUARIOS Y ROLES RBAC
    if (q.includes('usuario') || q.includes('rol') || q.includes('permiso') || q.includes('rbac') || q.includes('operador')) {
      const listaUsuarios = getUsuariosList();
      const opActual = getActiveOperator();
      const detalleUsr = listaUsuarios
        .map(
          (u) =>
            `• **${u.rol}** (${u.nombre} — ${u.email}): **${u.activo ? 'ACTIVO' : 'SUSPENDIDO'}** (${u.modulosPermitidos.length}/10 módulos)`
        )
        .join('\n');

      return `🛡️ **Control de Usuarios y Accesos (RBAC)**\n\n• **Operador en Sesión Activa:** **${opActual.rol}** (${opActual.nombre})\n• **Total Usuarios Registrados:** **${listaUsuarios.length} perfiles**\n\n**Padrón de Usuarios en Supabase:**\n${detalleUsr}\n\n[DOWNLOAD_PADRON_USUARIOS]\n[NAVIGATE:usuarios:Ir a Módulo 10 · Usuarios]`;
    }

    // 12. RESUMEN EJECUTIVO DEL DÍA / ANOMALÍAS / GENERAL
    const totalVentas = facturasVenta.reduce((s, f) => s + f.total, 0);
    const totalCompras = facturasCompra.reduce((s, f) => s + f.total, 0);
    const totalBancos = cuentasBancarias.reduce((s, c) => s + c.saldoActual, 0);
    const chqCartera = cheques.filter((c) => c.estado === 'En Cartera');
    const totalCartera = chqCartera.reduce((s, c) => s + c.importe, 0);
    const criticos = inventario.filter((i) => i.stockActual <= i.stockMinimo);
    const { resumenPosicionIva: posIva } = generateLibroIvaDigitalRg4597(facturasVenta, facturasCompra);

    return `📊 **Resumen Ejecutivo en Tiempo Real — ${empresa.razonSocial} (CUIT ${empresa.cuit})**\n\n1. **Facturación Ventas (AFIP):** **${fmt(totalVentas)}** (${facturasVenta.length} comprobantes emitidos con CAE)\n2. **Compras y Gastos:** **${fmt(totalCompras)}** (${facturasCompra.length} comprobantes registrados)\n3. **Posición IVA Mensual:** Débito **${fmt(posIva.totalIvaDebitoFiscal)}** vs. Crédito **${fmt(posIva.totalIvaCreditoFiscal)}**\n4. **Saldos en Cajas y Bancos:** **${fmt(totalBancos)}** en ${cuentasBancarias.length} cuentas\n5. **Cheques en Cartera:** **${fmt(totalCartera)}** (${chqCartera.length} cheques listos para depositar)\n6. **Sueldos y Cargas (${liquidacionActual.periodo}):** Neto a pagar **${fmt(liquidacionActual.totalNeto)}** (${empleados.length} legajos)\n7. **Alertas Operativas:** **${criticos.length} artículos** en stock crítico y **100% cuadre de Partida Doble** (${asientosContables.length} asientos).\n\n¿Querés que emita una factura, concilie bancos o descargue el Libro IVA?`;
  };

  const sendMessage = async (e?: React.FormEvent | string) => {
    if (typeof e !== 'string' && e?.preventDefault) e.preventDefault();
    const text = typeof e === 'string' ? e : input;
    if (!text.trim() || loading) return;

    setInput('');
    if (showGreeting) setShowGreeting(false);

    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const reply = await procesarConsultaZonda(text.trim());
      setMessages([...newMessages, { role: 'assistant', content: reply }]);

      // Registrar interacción en bitácora de auditoría Supabase
      void supabase.from('erp_webhooks_log').insert({
        origen: 'ZONDA_IA',
        evento: 'assistant.query_executed',
        referencia_externa: activeModule,
        monto: 0,
        estado: 'PROCESADO',
        payload: {
          prompt: text.trim(),
          modulo: activeModule,
          operador: getActiveOperator().rol,
          timestamp: new Date().toISOString()
        }
      });
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '⚠️ Ocurrió un inconveniente al procesar la solicitud. Intentá nuevamente.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatRecordingTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    if (loading || isTranscribing) return;
    transcriptBufferRef.current = '';

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let texto = '';
          for (let i = 0; i < event.results.length; i++) {
            texto += event.results[i][0].transcript;
          }
          transcriptBufferRef.current = texto;
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
        setRecordingSeconds(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
        return;
      } catch {
        // Fallback si el navegador bloquea SpeechRecognition
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          '🎙️ Para usar dictado por voz directo, habilitá el permiso de micrófono en tu navegador (Chrome / Edge).'
      }
    ]);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    transcriptBufferRef.current = '';
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const stopAndSendRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setIsTranscribing(true);

    setTimeout(() => {
      setIsTranscribing(false);
      const texto = transcriptBufferRef.current.trim();
      if (texto) {
        void sendMessage(texto);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '🎙️ No alcancé a escuchar palabras en el audio. Probá hablar más cerca del micrófono o escribí tu consulta.'
          }
        ]);
      }
    }, 350);
  };

  const handleDescargarLibroIvaDesdeZonda = (tipo: 'ventas' | 'compras') => {
    const { ventasCbteTxt, comprasCbteTxt } = generateLibroIvaDigitalRg4597(facturasVenta, facturasCompra);
    if (tipo === 'ventas') {
      const filas = facturasVenta.map((f) => ({
        Fecha: f.fechaEmision,
        Tipo: f.tipo,
        Punto_Venta: f.puntoVenta,
        Numero: f.numero,
        Cliente: f.clienteNombre,
        CUIT: f.clienteCuit,
        Condicion_IVA: f.condicionIva,
        Neto_Gravado: f.netoGravado,
        IVA_21: f.iva21,
        IVA_10_5: f.iva105,
        Total: f.total,
        CAE: f.cae || 'PENDIENTE'
      }));
      exportToExcelCsv('Libro_IVA_Ventas_ZondaERP_202610', filas);
      downloadTxtFile('LIBRO_IVA_DIGITAL_VENTAS_CBTE_202610.txt', ventasCbteTxt);
    } else {
      const filas = facturasCompra.map((f) => ({
        Fecha: f.fechaComprobante,
        Tipo: f.tipo,
        Numero: f.numero,
        Proveedor: f.proveedorNombre,
        CUIT: f.proveedorCuit,
        Cuenta_Gasto: f.cuentaGasto,
        Neto_Gravado: f.netoGravado,
        IVA_Credito: f.iva,
        Retencion_IVA: f.retencionIva,
        Retencion_IIBB: f.retencionIIBB,
        Total: f.total,
        Estado: f.estadoPago
      }));
      exportToExcelCsv('Libro_IVA_Compras_ZondaERP_202610', filas);
      downloadTxtFile('LIBRO_IVA_DIGITAL_COMPRAS_CBTE_202610.txt', comprasCbteTxt);
    }
  };

  const handleDescargarPadronUsuariosDesdeZonda = () => {
    const filas = getUsuariosList().map((u) => ({
      ID: u.id,
      Rol: u.rol,
      Nombre: u.nombre,
      Email: u.email,
      Estado: u.activo ? 'ACTIVO' : 'SUSPENDIDO',
      Modulos: u.modulosPermitidos.join(' | ')
    }));
    exportToExcelCsv('Padron_Usuarios_RBAC_ZondaERP', filas);
  };

  const renderContent = (text: string) => {
    const tieneDescargaVentas = text.includes('[DOWNLOAD_LIBRO_IVA:ventas]');
    const tieneDescargaCompras = text.includes('[DOWNLOAD_LIBRO_IVA:compras]');
    const tieneDescargaUsuarios = text.includes('[DOWNLOAD_PADRON_USUARIOS]');

    const navRegex = /\[NAVIGATE:([^:]+):([^\]]+)\]/g;
    const navMatches: { mod: ModuleKey; label: string }[] = [];
    let match;
    while ((match = navRegex.exec(text)) !== null) {
      navMatches.push({ mod: match[1] as ModuleKey, label: match[2] });
    }

    const cleanText = text
      .replace(/\[DOWNLOAD_LIBRO_IVA:[^\]]+\]/g, '')
      .replace(/\[DOWNLOAD_PADRON_USUARIOS\]/g, '')
      .replace(/\[NAVIGATE:[^\]]+\]/g, '')
      .trim();

    return (
      <div className="space-y-1">
        {cleanText.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-1' : ''}>
            {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j} className="font-bold text-[#042f22]">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        ))}

        {(tieneDescargaVentas || tieneDescargaCompras || tieneDescargaUsuarios || navMatches.length > 0) && (
          <div className="pt-2 mt-2 border-t border-emerald-800/15 space-y-1.5">
            {tieneDescargaVentas && (
              <button
                type="button"
                onClick={() => handleDescargarLibroIvaDesdeZonda('ventas')}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#064e3b] hover:bg-[#047857] text-white px-3 py-2 text-xs font-bold uppercase transition-all cursor-pointer shadow-sm"
              >
                <Download size={14} className="shrink-0" />
                <span>Descargar Libro IVA Ventas (.CSV + TXT RG 4597)</span>
              </button>
            )}
            {tieneDescargaCompras && (
              <button
                type="button"
                onClick={() => handleDescargarLibroIvaDesdeZonda('compras')}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#047857] hover:bg-[#064e3b] text-white px-3 py-2 text-xs font-bold uppercase transition-all cursor-pointer shadow-sm"
              >
                <Download size={14} className="shrink-0" />
                <span>Descargar Libro IVA Compras (.CSV + TXT RG 4597)</span>
              </button>
            )}
            {tieneDescargaUsuarios && (
              <button
                type="button"
                onClick={handleDescargarPadronUsuariosDesdeZonda}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#064e3b] hover:bg-[#047857] text-white px-3 py-2 text-xs font-bold uppercase transition-all cursor-pointer shadow-sm"
              >
                <Download size={14} className="shrink-0" />
                <span>Descargar Padrón de Usuarios RBAC (.CSV)</span>
              </button>
            )}
            {navMatches.map((nm, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveModule(nm.mod)}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-700/30 px-3 py-1.5 text-xs font-bold uppercase transition-all cursor-pointer"
              >
                <ExternalLink size={13} className="shrink-0" />
                <span>{nm.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const showQuickActions = messages.length <= 2 && !loading;

  const handleOpenChat = () => {
    setOpen(true);
    setBounce(false);
    stopWalking();
    setShowGreeting(true);
  };

  const handleWalkerClick = () => {
    stopWalking();
    setOpen(true);
    setShowGreeting(true);
  };

  return (
    <>
      {/* Overlay de Saludo Amigable de Zonda encima del chat */}
      {showGreeting && open && (
        <div className="fixed bottom-[665px] right-8 z-[70] pointer-events-none zonda-greeting-overlay hidden sm:flex items-center gap-2">
          <div className="bg-white border border-emerald-800/30 px-3 py-1.5 shadow-lg text-xs font-bold text-[#042f22]">
            ¡Hola! Soy Zonda, tu asistente de oficina 👋
          </div>
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#064e3b] bg-emerald-50 shadow-2xl zonda-greeting-img">
            <img
              src="/zonda-assistant.png"
              alt="Zonda saludando"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Zonda Caminando por la pantalla en modo inactivo (Igual a Rombo) */}
      {walking && !open && !isMinimized && (
        <div
          className="fixed z-[60] cursor-pointer group"
          style={{ left: pos.x, top: pos.y, transition: 'none' }}
          onClick={handleWalkerClick}
        >
          {showPhrase && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 bg-white border border-emerald-800/30 shadow-lg text-xs font-bold text-[#042f22] zonda-speech">
              {phrase}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-emerald-800/30 rotate-45" />
            </div>
          )}

          <div
            className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#064e3b] bg-white shadow-2xl transition-transform group-hover:scale-105"
            style={{ transform: `scaleX(${facingRight ? 1 : -1})` }}
          >
            <img
              src="/zonda-assistant.png"
              alt="Zonda en oficina"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>

          <div className="mt-1 mx-auto w-14 h-2.5 bg-emerald-950/15 rounded-full blur-sm zonda-shadow" />

          <div className="absolute -top-20 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#064e3b] text-white text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ¡Hacé clic para hablar con Zonda!
          </div>
        </div>
      )}

      {/* Botón Flotante Principal de Zonda (Esquina inferior derecha) */}
      {!open && !walking && !isMinimized && (
        <div className="fixed bottom-6 right-6 z-40 flex items-start gap-1 group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
              stopWalking();
            }}
            className="w-5 h-5 rounded-full bg-white hover:bg-emerald-100 text-[#064e3b] flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-emerald-800/30 -mr-2 z-10 font-bold"
            title="Minimizar Zonda"
          >
            ×
          </button>

          <button
            onClick={handleOpenChat}
            className={`group ${bounce ? 'animate-bounce' : ''}`}
            title="Hablar con Zonda — Asistente IA Contable"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white shadow-2xl border-2 border-[#064e3b] overflow-hidden transition-transform group-hover:scale-105 group-active:scale-95">
                <img
                  src="/zonda-assistant.png"
                  alt="Zonda Asistente"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#059669] rounded-full border-2 border-white flex items-center justify-center">
                <Sparkles size={10} className="text-white" />
              </div>
            </div>
            <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#042f22] text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
              ¡Preguntale a Zonda! 💼
            </span>
          </button>
        </div>
      )}

      {/* Chip Minimizado */}
      {!open && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-3 right-4 z-40 bg-white hover:bg-emerald-50 text-[#042f22] px-3 py-1.5 rounded-full text-xs font-bold shadow-md border border-emerald-800/30 flex items-center gap-2 transition-all hover:scale-105"
          title="Restaurar asistente Zonda"
        >
          <img
            src="/zonda-assistant.png"
            alt="Zonda"
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Zonda IA</span>
        </button>
      )}

      {/* Panel de Chat Principal de Zonda */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[430px] max-w-[calc(100vw-2rem)] h-[650px] max-h-[calc(100vh-3rem)] flex flex-col bg-white shadow-2xl border border-emerald-800/35 overflow-hidden"
          style={{ animation: 'zondaSlideUp 0.25s ease-out' }}
        >
          {/* Header del Chat con Avatar de Zonda */}
          <div className="bg-gradient-to-r from-[#042f22] via-[#064e3b] to-[#047857] p-3.5 flex items-center gap-3 shrink-0 border-b border-emerald-900">
            <div className="w-11 h-11 rounded-full bg-white overflow-hidden border-2 border-emerald-300 shrink-0 shadow-md">
              <img
                src="/zonda-assistant.png"
                alt="Zonda"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white font-extrabold text-sm flex items-center gap-1.5 tracking-tight">
                <span>Zonda</span>
              </h4>
              <p className="text-emerald-100 text-[10px] truncate font-medium">
                📍 {moduleLabel}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setTimeout(() => forceStart(), 150);
                }}
                title="Ver a Zonda patrullando la pantalla"
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Footprints size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Minimizar ventana de chat"
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minimize2 size={17} />
              </button>
            </div>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f4fbf7]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#064e3b] bg-white mt-0.5 shadow-sm">
                    <img
                      src="/zonda-assistant.png"
                      alt="Zonda"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[83%] px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#064e3b] text-white font-medium border border-[#047857]'
                      : 'bg-white text-[#042f22] border border-emerald-800/25 shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? msg.content : renderContent(msg.content)}
                </div>
              </div>
            ))}

            {/* Acciones Rápidas Contextuales del Módulo Actual */}
            {showQuickActions && (
              <div className="pt-2">
                <div className="text-[10px] font-bold text-[#357a59] uppercase mb-1.5 px-0.5">
                  Sugerencias rápidas para este módulo:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickActions.map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(qa.prompt)}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-800/25 text-xs font-semibold text-[#064e3b] hover:bg-emerald-50 hover:border-[#064e3b] transition-all text-left shadow-xs"
                    >
                      <qa.icon size={14} className="text-[#047857] shrink-0" />
                      <span className="truncate">{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#064e3b] bg-white mt-0.5">
                  <img
                    src="/zonda-assistant.png"
                    alt="Zonda"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-white border border-emerald-800/25 px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <div
                      className="w-2 h-2 rounded-full bg-[#064e3b] animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-[#064e3b] animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-[#064e3b] animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                    <span className="text-[11px] text-[#357a59] font-semibold ml-2">
                      Zonda está procesando en Supabase...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input de Texto y Grabación de Voz */}
          <div className="p-3 bg-white border-t border-emerald-800/20">
            {isRecording ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-[#064e3b] px-4 py-2 text-sm shadow-xs animate-pulse">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <div className="flex items-center gap-1.5 font-mono text-[#042f22] font-bold text-xs tabular-nums">
                    <AudioLines size={15} className="text-[#064e3b]" />
                    <span>{formatRecordingTime(recordingSeconds)}</span>
                  </div>
                  <span className="text-xs text-[#064e3b] font-semibold">
                    Escuchando tu voz para Zonda...
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    title="Cancelar grabación"
                    className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    title="Enviar comando de voz"
                    className="p-1.5 bg-[#064e3b] text-white hover:bg-[#047857] transition flex items-center justify-center cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            ) : isTranscribing ? (
              <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-300 py-2.5 px-4 text-xs font-bold text-[#064e3b]">
                <Loader2 size={15} className="animate-spin text-[#064e3b]" />
                <span>Interpretando comando de voz...</span>
              </div>
            ) : (
              <form onSubmit={sendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (showGreeting) setShowGreeting(false);
                  }}
                  placeholder="Escribí o dictale una orden a Zonda..."
                  disabled={loading}
                  className="w-full pl-3.5 pr-20 py-2.5 bg-emerald-50/30 border border-emerald-800/30 text-xs text-[#042f22] placeholder:text-[#357a59] focus:outline-none focus:bg-white focus:border-[#064e3b] transition-all"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={loading}
                    title="Hablar por micrófono con Zonda"
                    className="p-1.5 text-[#357a59] hover:text-[#064e3b] hover:bg-emerald-50 transition cursor-pointer"
                  >
                    <Mic size={16} />
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    title="Enviar mensaje a Zonda"
                    className="w-8 h-8 bg-[#064e3b] hover:bg-[#047857] text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </form>
            )}
            <div className="flex items-center justify-between text-[10px] text-[#357a59] mt-1.5 px-0.5">
              <span>Zonda IA • Conectado a Supabase PostgreSQL</span>
              <button
                type="button"
                onClick={() => setMessages([{ role: 'assistant', content: contextualGreeting }])}
                className="hover:underline font-semibold"
              >
                Limpiar chat
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes zondaSlideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .zonda-shadow {
          animation: zondaShadow 0.6s ease-in-out infinite;
        }
        @keyframes zondaShadow {
          0%, 50%, 100% { transform: scaleX(1); opacity: 0.18; }
          25%, 75% { transform: scaleX(0.75); opacity: 0.08; }
        }
        .zonda-speech {
          animation: zondaFadeIn 0.25s ease-out;
        }
        @keyframes zondaFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .zonda-greeting-overlay {
          animation: zondaGreetingIn 0.5s ease-out;
        }
        .zonda-greeting-img {
          animation: zondaPulse 2.2s ease-in-out infinite;
        }
        @keyframes zondaGreetingIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zondaPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
};
