import { supabase } from '../lib/supabase';
import type { ModuleKey } from '../components/layout/Sidebar';

export type RolOperador =
  | 'ADMINISTRADOR GENERAL'
  | 'CONTADOR / AUDITORÍA'
  | 'TESORERÍA Y FINANZAS'
  | 'FACTURACIÓN Y VENTAS'
  | 'RECURSOS HUMANOS'
  | 'AUDITOR EXTERNO';

export interface PermisosEspeciales {
  emitirFacturasAfip: boolean;
  aprobarPagosTesoreria: boolean;
  modificarPlanCuentas: boolean;
  eliminarRegistros: boolean;
  exportarReportesFiscales: boolean;
}

export interface OperadorProfile {
  id: string;
  nombre: string;
  rol: RolOperador | string;
  email: string;
  cuil?: string;
  sector?: string;
  pin: string;
  activo: boolean;
  fechaAlta: string;
  ultimoAcceso?: string;
  modulosPermitidos: ModuleKey[];
  permisosEspeciales: PermisosEspeciales;
  descripcionPermisos: string;
}

export const TODOS_LOS_MODULOS: { key: ModuleKey; codigo: string; nombre: string; descripcion: string }[] = [
  { key: 'tablero', codigo: '01', nombre: 'Tablero de Control', descripcion: 'KPIs ejecutivos, flujo de caja y auditoría diaria' },
  { key: 'clientes', codigo: '02', nombre: 'Clientes y Ventas (AFIP)', descripcion: 'Facturación electrónica CAE, cobranzas y Mercado Pago' },
  { key: 'proveedores', codigo: '03', nombre: 'Proveedores y Compras', descripcion: 'Comprobantes de compra, cuentas por pagar y órdenes de pago' },
  { key: 'tesoreria', codigo: '04', nombre: 'Tesorería y Cheques', descripcion: 'Cajas, bancos, conciliación y cartera de cheques' },
  { key: 'contabilidad', codigo: '05', nombre: 'Contabilidad y Libros', descripcion: 'Plan de cuentas, Libro Diario, Mayor y Libro IVA Digital' },
  { key: 'inventario', codigo: '06', nombre: 'Inventario y Stock', descripcion: 'Catálogo de artículos, Kardex físico/valorizado y precios' },
  { key: 'sueldos', codigo: '07', nombre: 'Sueldos y Cargas (LSD)', descripcion: 'Legajos, liquidación Ley 20.744, F.931 y Libro Sueldos Digital' },
  { key: 'migracion', codigo: '08', nombre: 'Centro de Migración', descripcion: 'Importación y validación Dry-Run de padrones y saldos' },
  { key: 'configuracion', codigo: '09', nombre: 'Configuración Fiscal', descripcion: 'Datos impositivos, puntos de venta, certificados ARCA y MP' },
  { key: 'usuarios', codigo: '10', nombre: 'Usuarios y Accesos', descripcion: 'Alta/baja de usuarios, roles RBAC, PINs y auditoría de accesos' }
];

export const PLANTILLAS_ROLES: Record<
  RolOperador,
  {
    modulos: ModuleKey[];
    permisos: PermisosEspeciales;
    descripcion: string;
  }
> = {
  'ADMINISTRADOR GENERAL': {
    modulos: ['tablero', 'clientes', 'proveedores', 'tesoreria', 'contabilidad', 'inventario', 'sueldos', 'migracion', 'configuracion', 'usuarios'],
    permisos: {
      emitirFacturasAfip: true,
      aprobarPagosTesoreria: true,
      modificarPlanCuentas: true,
      eliminarRegistros: true,
      exportarReportesFiscales: true
    },
    descripcion: 'Acceso total a los 10 módulos, gestión de usuarios, certificados ARCA, Mercado Pago y cierres contables.'
  },
  'CONTADOR / AUDITORÍA': {
    modulos: ['tablero', 'contabilidad', 'sueldos', 'clientes', 'proveedores', 'tesoreria', 'configuracion'],
    permisos: {
      emitirFacturasAfip: true,
      aprobarPagosTesoreria: false,
      modificarPlanCuentas: true,
      eliminarRegistros: false,
      exportarReportesFiscales: true
    },
    descripcion: 'Libro Diario, Plan de Cuentas, Libro IVA Digital RG 4597, Sueldos F.931 y Auditoría Fiscal.'
  },
  'TESORERÍA Y FINANZAS': {
    modulos: ['tablero', 'tesoreria', 'clientes', 'proveedores'],
    permisos: {
      emitirFacturasAfip: false,
      aprobarPagosTesoreria: true,
      modificarPlanCuentas: false,
      eliminarRegistros: false,
      exportarReportesFiscales: true
    },
    descripcion: 'Conciliación bancaria, custodia y depósito de cheques, órdenes de pago y cobranzas Mercado Pago.'
  },
  'FACTURACIÓN Y VENTAS': {
    modulos: ['tablero', 'clientes', 'inventario'],
    permisos: {
      emitirFacturasAfip: true,
      aprobarPagosTesoreria: false,
      modificarPlanCuentas: false,
      eliminarRegistros: false,
      exportarReportesFiscales: false
    },
    descripcion: 'Emisión de Facturas Electrónicas con CAE, cobros QR/Link Mercado Pago, envío por WhatsApp y Kardex.'
  },
  'RECURSOS HUMANOS': {
    modulos: ['tablero', 'sueldos'],
    permisos: {
      emitirFacturasAfip: false,
      aprobarPagosTesoreria: false,
      modificarPlanCuentas: false,
      eliminarRegistros: false,
      exportarReportesFiscales: true
    },
    descripcion: 'Administración de legajos, liquidación de haberes, recibos de sueldo y exportación Libro de Sueldos Digital.'
  },
  'AUDITOR EXTERNO': {
    modulos: ['tablero', 'contabilidad', 'tesoreria'],
    permisos: {
      emitirFacturasAfip: false,
      aprobarPagosTesoreria: false,
      modificarPlanCuentas: false,
      eliminarRegistros: false,
      exportarReportesFiscales: true
    },
    descripcion: 'Consulta de estados contables, Libro Mayor, Sumas y Saldos y conciliación bancaria en modo auditoría.'
  }
};

export const OPERADORES_INICIALES: OperadorProfile[] = [
  {
    id: 'USR-001',
    nombre: 'Administrador General',
    rol: 'ADMINISTRADOR GENERAL',
    email: 'admin@growsanjuan.com',
    cuil: '20-31458920-4',
    sector: 'Dirección General & Sistemas',
    pin: '1234',
    activo: true,
    fechaAlta: '2026-01-15',
    ultimoAcceso: '2026-10-30 12:25',
    modulosPermitidos: PLANTILLAS_ROLES['ADMINISTRADOR GENERAL'].modulos,
    permisosEspeciales: PLANTILLAS_ROLES['ADMINISTRADOR GENERAL'].permisos,
    descripcionPermisos: PLANTILLAS_ROLES['ADMINISTRADOR GENERAL'].descripcion
  },
  {
    id: 'USR-002',
    nombre: 'Contador / Auditoría Fiscal',
    rol: 'CONTADOR / AUDITORÍA',
    email: 'auditoria@growsanjuan.com',
    cuil: '20-28941023-9',
    sector: 'Contaduría e Impuestos',
    pin: '2026',
    activo: true,
    fechaAlta: '2026-02-01',
    ultimoAcceso: '2026-10-29 18:40',
    modulosPermitidos: PLANTILLAS_ROLES['CONTADOR / AUDITORÍA'].modulos,
    permisosEspeciales: PLANTILLAS_ROLES['CONTADOR / AUDITORÍA'].permisos,
    descripcionPermisos: PLANTILLAS_ROLES['CONTADOR / AUDITORÍA'].descripcion
  },
  {
    id: 'USR-003',
    nombre: 'Tesorería y Finanzas',
    rol: 'TESORERÍA Y FINANZAS',
    email: 'tesoreria@growsanjuan.com',
    cuil: '27-33910482-1',
    sector: 'Tesorería y Bancos',
    pin: '5555',
    activo: true,
    fechaAlta: '2026-02-10',
    ultimoAcceso: '2026-10-30 09:15',
    modulosPermitidos: PLANTILLAS_ROLES['TESORERÍA Y FINANZAS'].modulos,
    permisosEspeciales: PLANTILLAS_ROLES['TESORERÍA Y FINANZAS'].permisos,
    descripcionPermisos: PLANTILLAS_ROLES['TESORERÍA Y FINANZAS'].descripcion
  },
  {
    id: 'USR-004',
    nombre: 'Facturación y Ventas',
    rol: 'FACTURACIÓN Y VENTAS',
    email: 'facturacion@growsanjuan.com',
    cuil: '27-36819204-6',
    sector: 'Comercial y Facturación AFIP',
    pin: '1111',
    activo: true,
    fechaAlta: '2026-03-05',
    ultimoAcceso: '2026-10-30 11:02',
    modulosPermitidos: PLANTILLAS_ROLES['FACTURACIÓN Y VENTAS'].modulos,
    permisosEspeciales: PLANTILLAS_ROLES['FACTURACIÓN Y VENTAS'].permisos,
    descripcionPermisos: PLANTILLAS_ROLES['FACTURACIÓN Y VENTAS'].descripcion
  }
];

const STORAGE_USUARIOS_KEY = 'zonda_usuarios_rbac_v2';
const STORAGE_ACTIVE_OP_KEY = 'zonda_active_operator_v3';

function normalizeModulos(mods: string[]): ModuleKey[] {
  const mapped = mods.map((m) => (m === 'dashboard' ? 'tablero' : m)) as ModuleKey[];
  return Array.from(new Set(mapped));
}

function normalizeUsuario(u: any): OperadorProfile {
  const rol = (u.rol || 'ADMINISTRADOR GENERAL') as RolOperador;
  const plantilla = PLANTILLAS_ROLES[rol] || PLANTILLAS_ROLES['ADMINISTRADOR GENERAL'];
  return {
    id: u.id || `USR-${Date.now()}`,
    nombre: u.nombre || rol,
    rol,
    email: u.email || 'usuario@growsanjuan.com',
    cuil: u.cuil || '',
    sector: u.sector || 'Operaciones ERP',
    pin: u.pin || '1234',
    activo: u.activo !== undefined ? Boolean(u.activo) : true,
    fechaAlta: u.fechaAlta || new Date().toISOString().slice(0, 10),
    ultimoAcceso: u.ultimoAcceso || 'Sin accesos recientes',
    modulosPermitidos: Array.isArray(u.modulosPermitidos)
      ? normalizeModulos(u.modulosPermitidos)
      : plantilla.modulos,
    permisosEspeciales: u.permisosEspeciales
      ? { ...plantilla.permisos, ...u.permisosEspeciales }
      : plantilla.permisos,
    descripcionPermisos: u.descripcionPermisos || plantilla.descripcion
  };
}

export function getUsuariosList(): OperadorProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_USUARIOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeUsuario);
      }
    }
  } catch {
    // Fallback
  }
  localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(OPERADORES_INICIALES));
  return OPERADORES_INICIALES;
}

export function getActiveOperator(): OperadorProfile {
  const usuarios = getUsuariosList();
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_OP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const found = usuarios.find((u) => u.id === parsed.id && u.activo);
      if (found) return found;
    }
  } catch {
    // Fallback
  }
  const firstActive = usuarios.find((u) => u.activo) || usuarios[0] || OPERADORES_INICIALES[0];
  return firstActive;
}

export async function sincronizarUsuariosDesdeSupabase(): Promise<OperadorProfile[]> {
  try {
    const { data, error } = await supabase
      .from('erp_integraciones_config')
      .select('afip_config')
      .eq('id', 'USUARIOS_RBAC')
      .maybeSingle();

    if (!error && data?.afip_config && Array.isArray((data.afip_config as any).usuarios)) {
      const remotos = (data.afip_config as any).usuarios.map(normalizeUsuario);
      if (remotos.length > 0) {
        localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(remotos));
        window.dispatchEvent(new Event('zonda_usuarios_updated'));
        return remotos;
      }
    } else {
      // Inicializar en Supabase si aún no existe el registro USUARIOS_RBAC
      const actuales = getUsuariosList();
      await supabase.from('erp_integraciones_config').upsert(
        {
          id: 'USUARIOS_RBAC',
          afip_config: { usuarios: actuales },
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );
      return actuales;
    }
  } catch {
    // Mantener versión local si hay corte de red
  }
  return getUsuariosList();
}

export async function guardarUsuariosEnSupabase(
  usuarios: OperadorProfile[],
  eventoAuditoria?: {
    accion: string;
    usuarioAfectado: string;
    detalle: string;
  }
): Promise<void> {
  const normalizados = usuarios.map(normalizeUsuario);
  localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(normalizados));

  // Si el operador activo fue editado, actualizar su copia activa
  const activoActual = getActiveOperator();
  const activoActualizado = normalizados.find((u) => u.id === activoActual.id && u.activo);
  if (activoActualizado) {
    localStorage.setItem(STORAGE_ACTIVE_OP_KEY, JSON.stringify(activoActualizado));
  } else {
    const fallback = normalizados.find((u) => u.activo) || normalizados[0];
    if (fallback) {
      localStorage.setItem(STORAGE_ACTIVE_OP_KEY, JSON.stringify(fallback));
    }
  }

  window.dispatchEvent(new Event('zonda_usuarios_updated'));

  try {
    await supabase.from('erp_integraciones_config').upsert(
      {
        id: 'USUARIOS_RBAC',
        afip_config: { usuarios: normalizados },
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    );

    if (eventoAuditoria) {
      await supabase.from('erp_webhooks_log').insert({
        origen: 'AUTH_RBAC',
        evento: eventoAuditoria.accion,
        referencia_externa: eventoAuditoria.usuarioAfectado,
        monto: 0,
        estado: 'AUTORIZADO',
        payload: {
          accion: eventoAuditoria.accion,
          usuarioAfectado: eventoAuditoria.usuarioAfectado,
          detalle: eventoAuditoria.detalle,
          ejecutadoPor: activoActual.rol,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (err) {
    console.error('Error sincronizando usuarios en Supabase:', err);
  }
}

export async function cambiarOperadorActivo(op: OperadorProfile): Promise<void> {
  const ahora = new Date().toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  const actualizado: OperadorProfile = { ...op, ultimoAcceso: ahora };

  const lista = getUsuariosList().map((u) => (u.id === op.id ? actualizado : u));
  localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(lista));
  localStorage.setItem(STORAGE_ACTIVE_OP_KEY, JSON.stringify(actualizado));
  window.dispatchEvent(new Event('zonda_usuarios_updated'));

  try {
    await supabase.from('erp_integraciones_config').upsert(
      {
        id: 'USUARIOS_RBAC',
        afip_config: { usuarios: lista },
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    );

    await supabase.from('erp_webhooks_log').insert({
      origen: 'AUTH_RBAC',
      evento: 'session.operator_switch',
      referencia_externa: op.id,
      monto: 0,
      estado: 'AUTORIZADO',
      payload: {
        operador: op.nombre,
        rol: op.rol,
        email: op.email,
        modulos: op.modulosPermitidos.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch {
    // No bloquear cambio de sesión
  }
}

