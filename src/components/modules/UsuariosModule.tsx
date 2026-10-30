import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  KeyRound,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Search,
  Eye,
  EyeOff,
  UserCheck,
  Activity,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import {
  OperadorProfile,
  RolOperador,
  PermisosEspeciales,
  TODOS_LOS_MODULOS,
  PLANTILLAS_ROLES,
  getUsuariosList,
  getActiveOperator,
  sincronizarUsuariosDesdeSupabase,
  guardarUsuariosEnSupabase,
  cambiarOperadorActivo
} from '../../services/usuariosRbacService';
import type { ModuleKey } from '../layout/Sidebar';
import { supabase } from '../../lib/supabase';
import { exportToExcelCsv } from '../../utils/exportUtils';

export const UsuariosModule: React.FC = () => {
  const [usuarios, setUsuarios] = useState<OperadorProfile[]>(getUsuariosList());
  const [operadorActual, setOperadorActual] = useState<OperadorProfile>(getActiveOperator());
  const [activeTab, setActiveTab] = useState<'padron' | 'matriz' | 'auditoria'>('padron');
  const [sincronizando, setSincronizando] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Filtros Padrón
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'suspendidos'>('todos');
  const [verPins, setVerPins] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Modal / Formulario de Alta y Edición
  const [formOpen, setFormOpen] = useState(false);
  const [modoEdicionId, setModoEdicionId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<RolOperador>('ADMINISTRADOR GENERAL');
  const [email, setEmail] = useState('');
  const [cuil, setCuil] = useState('');
  const [sector, setSector] = useState('');
  const [pin, setPin] = useState('1234');
  const [activo, setActivo] = useState(true);
  const [descripcionPermisos, setDescripcionPermisos] = useState(
    PLANTILLAS_ROLES['ADMINISTRADOR GENERAL'].descripcion
  );
  const [modulosSeleccionados, setModulosSeleccionados] = useState<ModuleKey[]>(
    PLANTILLAS_ROLES['ADMINISTRADOR GENERAL'].modulos
  );
  const [permisosEspeciales, setPermisosEspeciales] = useState<PermisosEspeciales>(
    PLANTILLAS_ROLES['ADMINISTRADOR GENERAL'].permisos
  );

  // Bitácora de Auditoría RBAC desde Supabase
  const [logsRbac, setLogsRbac] = useState<any[]>([]);
  const [cargandoLogs, setCargandoLogs] = useState(false);

  const mostrarNotificacion = (tipo: 'ok' | 'error', texto: string) => {
    setBannerMsg({ tipo, texto });
    setTimeout(() => {
      setBannerMsg((prev) => (prev?.texto === texto ? null : prev));
    }, 4500);
  };

  const cargarAuditoria = async () => {
    setCargandoLogs(true);
    try {
      const { data } = await supabase
        .from('erp_webhooks_log')
        .select('*')
        .eq('origen', 'AUTH_RBAC')
        .order('created_at', { ascending: false })
        .limit(40);
      if (data) setLogsRbac(data);
    } catch {
      // Sin bloqueo
    } finally {
      setCargandoLogs(false);
    }
  };

  useEffect(() => {
    const syncLocal = () => {
      setUsuarios(getUsuariosList());
      setOperadorActual(getActiveOperator());
    };
    window.addEventListener('zonda_usuarios_updated', syncLocal);

    // Sincronizar con Supabase al montar el módulo
    setSincronizando(true);
    void sincronizarUsuariosDesdeSupabase()
      .then((remotos) => {
        setUsuarios(remotos);
        setOperadorActual(getActiveOperator());
      })
      .finally(() => setSincronizando(false));

    void cargarAuditoria();

    return () => window.removeEventListener('zonda_usuarios_updated', syncLocal);
  }, []);

  const handleAplicarPlantillaRol = (nuevoRol: RolOperador) => {
    setRol(nuevoRol);
    const tpl = PLANTILLAS_ROLES[nuevoRol];
    if (tpl) {
      setModulosSeleccionados([...tpl.modulos]);
      setPermisosEspeciales({ ...tpl.permisos });
      setDescripcionPermisos(tpl.descripcion);
    }
  };

  const abrirModalNuevoUsuario = () => {
    setModoEdicionId(null);
    setNombre('');
    setRol('FACTURACIÓN Y VENTAS');
    setEmail('');
    setCuil('');
    setSector('Administración / Operaciones');
    setPin(String(Math.floor(1000 + Math.random() * 9000)));
    setActivo(true);
    setModulosSeleccionados([...PLANTILLAS_ROLES['FACTURACIÓN Y VENTAS'].modulos]);
    setPermisosEspeciales({ ...PLANTILLAS_ROLES['FACTURACIÓN Y VENTAS'].permisos });
    setDescripcionPermisos(PLANTILLAS_ROLES['FACTURACIÓN Y VENTAS'].descripcion);
    setFormOpen(true);
  };

  const abrirModalEditarUsuario = (u: OperadorProfile) => {
    setModoEdicionId(u.id);
    setNombre(u.nombre);
    setRol((u.rol as RolOperador) || 'ADMINISTRADOR GENERAL');
    setEmail(u.email);
    setCuil(u.cuil || '');
    setSector(u.sector || 'Operaciones ERP');
    setPin(u.pin);
    setActivo(u.activo);
    setModulosSeleccionados([...u.modulosPermitidos]);
    setPermisosEspeciales({ ...u.permisosEspeciales });
    setDescripcionPermisos(u.descripcionPermisos);
    setFormOpen(true);
  };

  const toggleModuloEnFormulario = (modKey: ModuleKey) => {
    setModulosSeleccionados((prev) =>
      prev.includes(modKey) ? prev.filter((k) => k !== modKey) : [...prev, modKey]
    );
  };

  const handleGuardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      mostrarNotificacion('error', 'Debe ingresar el nombre o identificación del usuario.');
      return;
    }
    if (!email.trim()) {
      mostrarNotificacion('error', 'Debe ingresar un correo electrónico o identificador de usuario.');
      return;
    }
    if (!pin.trim() || pin.trim().length < 4) {
      mostrarNotificacion('error', 'El PIN de acceso debe tener al menos 4 dígitos.');
      return;
    }
    if (modulosSeleccionados.length === 0) {
      mostrarNotificacion('error', 'Debe habilitar al menos 1 módulo para el usuario.');
      return;
    }

    setSincronizando(true);
    try {
      if (modoEdicionId) {
        const nuevaLista = usuarios.map((u) =>
          u.id === modoEdicionId
            ? {
                ...u,
                nombre: nombre.trim(),
                rol,
                email: email.trim().toLowerCase(),
                cuil: cuil.trim(),
                sector: sector.trim() || 'Operaciones ERP',
                pin: pin.trim(),
                activo,
                modulosPermitidos: modulosSeleccionados,
                permisosEspeciales,
                descripcionPermisos: descripcionPermisos.trim()
              }
            : u
        );

        await guardarUsuariosEnSupabase(nuevaLista, {
          accion: 'user.updated',
          usuarioAfectado: modoEdicionId,
          detalle: `Usuario actualizado: ${nombre.trim()} (${rol}) - ${modulosSeleccionados.length}/10 módulos`
        });

        setUsuarios(nuevaLista);
        mostrarNotificacion('ok', `Usuario ${nombre.trim()} (${rol}) actualizado y sincronizado en Supabase.`);
      } else {
        const nextNum = usuarios.length + 1;
        const nuevoId = `USR-${String(nextNum).padStart(3, '0')}-${Date.now().toString().slice(-3)}`;
        const nuevoUsuario: OperadorProfile = {
          id: nuevoId,
          nombre: nombre.trim(),
          rol,
          email: email.trim().toLowerCase(),
          cuil: cuil.trim(),
          sector: sector.trim() || 'Operaciones ERP',
          pin: pin.trim(),
          activo,
          fechaAlta: new Date().toISOString().slice(0, 10),
          ultimoAcceso: 'Recién dado de alta',
          modulosPermitidos: modulosSeleccionados,
          permisosEspeciales,
          descripcionPermisos: descripcionPermisos.trim()
        };

        const nuevaLista = [...usuarios, nuevoUsuario];
        await guardarUsuariosEnSupabase(nuevaLista, {
          accion: 'user.created',
          usuarioAfectado: nuevoId,
          detalle: `Alta de nuevo usuario: ${nuevoUsuario.nombre} (${nuevoUsuario.rol}) - Email: ${nuevoUsuario.email}`
        });

        setUsuarios(nuevaLista);
        mostrarNotificacion('ok', `Usuario ${nuevoUsuario.nombre} dado de alta exitosamente en Supabase.`);
      }

      setFormOpen(false);
      void cargarAuditoria();
    } finally {
      setSincronizando(false);
    }
  };

  const handleToggleEstadoActivo = async (u: OperadorProfile) => {
    if (u.id === operadorActual.id && u.activo) {
      mostrarNotificacion(
        'error',
        'No puede suspender el usuario que se encuentra actualmente en sesión activa. Cambie de operador primero.'
      );
      return;
    }

    const nuevaLista = usuarios.map((item) =>
      item.id === u.id ? { ...item, activo: !item.activo } : item
    );

    setSincronizando(true);
    await guardarUsuariosEnSupabase(nuevaLista, {
      accion: u.activo ? 'user.suspended' : 'user.reactivated',
      usuarioAfectado: u.id,
      detalle: `${u.activo ? 'Suspensión' : 'Reactivación'} de usuario: ${u.nombre} (${u.rol})`
    });
    setUsuarios(nuevaLista);
    setSincronizando(false);
    mostrarNotificacion(
      'ok',
      `Usuario ${u.nombre} ${u.activo ? 'SUSPENDIDO' : 'REACTIVADO'} correctamente.`
    );
    void cargarAuditoria();
  };

  const handleEliminarUsuario = async (u: OperadorProfile) => {
    if (u.id === operadorActual.id) {
      mostrarNotificacion(
        'error',
        'No puede eliminar el usuario que está en sesión activa. Active otro usuario primero.'
      );
      setConfirmDeleteId(null);
      return;
    }

    const adminsRestantes = usuarios.filter(
      (item) => item.id !== u.id && item.rol === 'ADMINISTRADOR GENERAL' && item.activo
    );
    if (u.rol === 'ADMINISTRADOR GENERAL' && adminsRestantes.length === 0) {
      mostrarNotificacion(
        'error',
        'Seguridad RBAC: Debe existir al menos un ADMINISTRADOR GENERAL activo en el sistema.'
      );
      setConfirmDeleteId(null);
      return;
    }

    const nuevaLista = usuarios.filter((item) => item.id !== u.id);
    setSincronizando(true);
    await guardarUsuariosEnSupabase(nuevaLista, {
      accion: 'user.deleted',
      usuarioAfectado: u.id,
      detalle: `Baja definitiva de usuario: ${u.nombre} (${u.rol} - ${u.email})`
    });
    setUsuarios(nuevaLista);
    setConfirmDeleteId(null);
    setSincronizando(false);
    mostrarNotificacion('ok', `Usuario ${u.nombre} eliminado definitivamente del padrón.`);
    void cargarAuditoria();
  };

  const handleToggleModuloMatriz = async (usuarioId: string, modKey: ModuleKey) => {
    const target = usuarios.find((u) => u.id === usuarioId);
    if (!target) return;

    const yaTiene = target.modulosPermitidos.includes(modKey);
    const nuevosModulos = yaTiene
      ? target.modulosPermitidos.filter((m) => m !== modKey)
      : [...target.modulosPermitidos, modKey];

    if (nuevosModulos.length === 0) {
      mostrarNotificacion('error', 'Todo usuario debe tener al menos un módulo asignado.');
      return;
    }

    const nuevaLista = usuarios.map((u) =>
      u.id === usuarioId ? { ...u, modulosPermitidos: nuevosModulos } : u
    );

    await guardarUsuariosEnSupabase(nuevaLista, {
      accion: 'user.permissions_matrix_updated',
      usuarioAfectado: usuarioId,
      detalle: `${yaTiene ? 'Revocado' : 'Otorgado'} módulo [${modKey.toUpperCase()}] para ${target.nombre}`
    });
    setUsuarios(nuevaLista);
    mostrarNotificacion(
      'ok',
      `Permiso de módulo [${modKey.toUpperCase()}] ${yaTiene ? 'revocado' : 'habilitado'} para ${target.nombre}.`
    );
  };

  const handleActivarSesionDirecta = async (u: OperadorProfile) => {
    if (!u.activo) {
      mostrarNotificacion('error', 'No se puede iniciar sesión con un usuario SUSPENDIDO.');
      return;
    }
    await cambiarOperadorActivo(u);
    setOperadorActual(getActiveOperator());
    mostrarNotificacion('ok', `Sesión activa cambiada a: ${u.rol} (${u.nombre}).`);
    void cargarAuditoria();
  };

  const handleExportarExcel = () => {
    const filas = usuarios.map((u) => ({
      ID_Usuario: u.id,
      Nombre_Identificacion: u.nombre,
      Rol_RBAC: u.rol,
      Email: u.email,
      CUIL: u.cuil || '-',
      Sector: u.sector || '-',
      Estado: u.activo ? 'ACTIVO' : 'SUSPENDIDO',
      Cantidad_Modulos: `${u.modulosPermitidos.length}/10`,
      Modulos_Habilitados: u.modulosPermitidos.join(' | '),
      Emite_Facturas_AFIP: u.permisosEspeciales.emitirFacturasAfip ? 'SI' : 'NO',
      Aprueba_Pagos_Tesoreria: u.permisosEspeciales.aprobarPagosTesoreria ? 'SI' : 'NO',
      Modifica_Contabilidad: u.permisosEspeciales.modificarPlanCuentas ? 'SI' : 'NO',
      Elimina_Registros: u.permisosEspeciales.eliminarRegistros ? 'SI' : 'NO',
      Exporta_Libros_Fiscales: u.permisosEspeciales.exportarReportesFiscales ? 'SI' : 'NO',
      Fecha_Alta: u.fechaAlta,
      Ultimo_Acceso: u.ultimoAcceso || '-'
    }));
    exportToExcelCsv('Padron_Usuarios_y_Permisos_RBAC_GrowERP', filas);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busqueda.trim().toLowerCase();
    const coincideTexto =
      !q ||
      u.nombre.toLowerCase().includes(q) ||
      u.rol.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.sector || '').toLowerCase().includes(q) ||
      (u.cuil || '').includes(q);

    const coincideEstado =
      filtroEstado === 'todos'
        ? true
        : filtroEstado === 'activos'
          ? u.activo
          : !u.activo;

    return coincideTexto && coincideEstado;
  });

  const totalActivos = usuarios.filter((u) => u.activo).length;
  const totalSuspendidos = usuarios.length - totalActivos;

  return (
    <div className="space-y-5 font-sans text-[#042f22]">
      {/* Cabecera Institucional del Módulo 10 */}
      <div className="bg-white border border-emerald-800/25 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#047857] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>MÓDULO 10 // SEGURIDAD, ROLES Y CONTROL DE ACCESOS (RBAC)</span>
          </div>
          <h2 className="text-lg font-extrabold text-[#042f22] tracking-tight uppercase">
            Administración de Usuarios, Roles Operativos y Permisos por Módulo
          </h2>
          <p className="text-xs text-[#357a59] mt-0.5">
            Agregue o quite usuarios, asigne PINs de autorización y controle qué módulos e impuestos puede operar cada perfil en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={abrirModalNuevoUsuario}
            className="px-4 py-2 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold uppercase flex items-center gap-2 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Agregar Nuevo Usuario</span>
          </button>

          <button
            onClick={handleExportarExcel}
            className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-[#064e3b] border border-emerald-800/30 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Padrón (.CSV)</span>
          </button>

          <button
            onClick={async () => {
              setSincronizando(true);
              const remotos = await sincronizarUsuariosDesdeSupabase();
              setUsuarios(remotos);
              await cargarAuditoria();
              setSincronizando(false);
              mostrarNotificacion('ok', 'Padrón de usuarios sincronizado con Supabase PostgreSQL.');
            }}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-700/30 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
            <span>Sincronizar DB</span>
          </button>
        </div>
      </div>

      {/* Notificación de estado en vivo */}
      {bannerMsg && (
        <div
          className={`p-3 border flex items-center justify-between text-xs font-bold ${
            bannerMsg.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-500 text-[#042f22]'
              : 'bg-red-50 border-red-400 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMsg.tipo === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{bannerMsg.texto}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-xs underline ml-4">
            Cerrar
          </button>
        </div>
      )}

      {/* Tarjetas KPI de Usuarios y Seguridad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-emerald-800/25 border-t-4 border-t-[#064e3b] p-4">
          <span className="text-[10px] font-bold text-[#357a59] uppercase block">
            TOTAL USUARIOS REGISTRADOS
          </span>
          <div className="text-2xl font-extrabold text-[#042f22] mt-1 tabular-nums">
            {usuarios.length}
          </div>
          <span className="text-[11px] text-[#047857] font-semibold mt-1 block">
            Sincronizados en PostgreSQL
          </span>
        </div>

        <div className="bg-white border border-emerald-800/25 border-t-4 border-t-[#059669] p-4">
          <span className="text-[10px] font-bold text-[#357a59] uppercase block">
            USUARIOS HABILITADOS / SUSPENDIDOS
          </span>
          <div className="text-2xl font-extrabold text-[#042f22] mt-1 tabular-nums">
            {totalActivos} <span className="text-sm font-semibold text-[#357a59]">activos</span> / {totalSuspendidos}{' '}
            <span className="text-sm font-semibold text-amber-700">susp.</span>
          </div>
          <span className="text-[11px] text-[#047857] font-semibold mt-1 block">
            Control de acceso inmediato
          </span>
        </div>

        <div className="bg-white border border-emerald-800/25 border-t-4 border-t-[#047857] p-4">
          <span className="text-[10px] font-bold text-[#357a59] uppercase block">
            ROL EN SESIÓN ACTIVA AHORA
          </span>
          <div className="text-sm font-extrabold text-[#064e3b] mt-1.5 uppercase truncate">
            {operadorActual.rol}
          </div>
          <span className="text-[11px] text-[#357a59] font-semibold mt-1 block truncate">
            {operadorActual.nombre} ({operadorActual.modulosPermitidos.length}/10 módulos)
          </span>
        </div>

        <div className="bg-white border border-emerald-800/25 border-t-4 border-t-emerald-700 p-4">
          <span className="text-[10px] font-bold text-[#357a59] uppercase block">
            AUDITORÍA RBAC SUPABASE
          </span>
          <div className="text-2xl font-extrabold text-[#042f22] mt-1 tabular-nums">
            {logsRbac.length} <span className="text-xs font-semibold text-[#357a59]">eventos</span>
          </div>
          <span className="text-[11px] text-[#047857] font-semibold mt-1 block">
            Trazabilidad en erp_webhooks_log
          </span>
        </div>
      </div>

      {/* Pestañas de Navegación del Módulo */}
      <div className="bg-white border border-emerald-800/25">
        <div className="border-b border-emerald-800/20 px-4 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/30">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('padron')}
              className={`px-4 py-3 text-xs font-bold uppercase border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'padron'
                  ? 'border-[#064e3b] text-[#042f22] bg-white'
                  : 'border-transparent text-[#357a59] hover:text-[#042f22]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>1. Padrón de Usuarios (Alta / Baja / Edición)</span>
            </button>

            <button
              onClick={() => setActiveTab('matriz')}
              className={`px-4 py-3 text-xs font-bold uppercase border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'matriz'
                  ? 'border-[#064e3b] text-[#042f22] bg-white'
                  : 'border-transparent text-[#357a59] hover:text-[#042f22]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>2. Matriz Interactiva de Permisos por Módulo</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('auditoria');
                void cargarAuditoria();
              }}
              className={`px-4 py-3 text-xs font-bold uppercase border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'auditoria'
                  ? 'border-[#064e3b] text-[#042f22] bg-white'
                  : 'border-transparent text-[#357a59] hover:text-[#042f22]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>3. Bitácora de Auditoría de Accesos ({logsRbac.length})</span>
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: PADRÓN DE USUARIOS */}
        {activeTab === 'padron' && (
          <div className="p-4 space-y-4">
            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-[#357a59] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, rol, email, CUIL o sector..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-emerald-800/30 bg-emerald-50/20 focus:bg-white focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['todos', 'activos', 'suspendidos'] as const).map((est) => (
                  <button
                    key={est}
                    onClick={() => setFiltroEstado(est)}
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase border transition-colors ${
                      filtroEstado === est
                        ? 'bg-[#064e3b] text-white border-[#064e3b]'
                        : 'bg-white text-[#064e3b] border-emerald-800/25 hover:bg-emerald-50'
                    }`}
                  >
                    {est}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="overflow-x-auto border border-emerald-800/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-50/70 border-b border-emerald-800/25 text-[10px] font-extrabold text-[#064e3b] uppercase">
                    <th className="py-2.5 px-3">ID / Estado</th>
                    <th className="py-2.5 px-3">Rol Institucional</th>
                    <th className="py-2.5 px-3">Usuario / Correo / Sector</th>
                    <th className="py-2.5 px-3">Módulos Habilitados</th>
                    <th className="py-2.5 px-3">Permisos Críticos</th>
                    <th className="py-2.5 px-3">PIN</th>
                    <th className="py-2.5 px-3 text-right">Acciones (Editar / Activar / Quitar)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-800/15">
                  {usuariosFiltrados.map((u) => {
                    const esActual = u.id === operadorActual.id;
                    const mostrarPin = Boolean(verPins[u.id]);
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-emerald-50/40 transition-colors ${
                          !u.activo ? 'opacity-60 bg-slate-50' : esActual ? 'bg-emerald-50/30' : 'bg-white'
                        }`}
                      >
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="font-bold text-[#042f22] tabular-nums">{u.id}</div>
                          <div className="mt-1 flex items-center gap-1">
                            {u.activo ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-[#064e3b] border border-emerald-400 text-[9px] font-bold uppercase">
                                ACTIVO
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 text-[9px] font-bold uppercase">
                                SUSPENDIDO
                              </span>
                            )}
                            {esActual && (
                              <span className="px-1.5 py-0.5 bg-[#064e3b] text-white text-[9px] font-bold uppercase">
                                EN SESIÓN
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <span className="font-extrabold text-[#064e3b] uppercase block">
                            {u.rol}
                          </span>
                          <span className="text-[10px] text-[#357a59] block mt-0.5">
                            Alta: {u.fechaAlta}
                          </span>
                          {u.ultimoAcceso && (
                            <span className="text-[10px] text-[#357a59] block">
                              Últ. acceso: {u.ultimoAcceso}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="font-bold text-[#042f22]">{u.nombre}</div>
                          <div className="text-[11px] text-[#047857]">{u.email}</div>
                          <div className="text-[10px] text-[#357a59]">
                            {u.sector || 'Operaciones ERP'} {u.cuil ? `• CUIL: ${u.cuil}` : ''}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="font-bold text-[#042f22] mb-1 tabular-nums">
                            {u.modulosPermitidos.length} de 10 módulos
                          </div>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {TODOS_LOS_MODULOS.map((m) => {
                              const activoMod = u.modulosPermitidos.includes(m.key);
                              return (
                                <span
                                  key={m.key}
                                  title={`${m.codigo} - ${m.nombre}`}
                                  className={`text-[9px] px-1.5 py-0.5 font-bold uppercase border ${
                                    activoMod
                                      ? 'bg-emerald-50 text-[#064e3b] border-emerald-400'
                                      : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                                  }`}
                                >
                                  {m.codigo}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="space-y-0.5 text-[10px]">
                            <div className={u.permisosEspeciales.emitirFacturasAfip ? 'text-[#064e3b] font-semibold' : 'text-slate-400'}>
                              {u.permisosEspeciales.emitirFacturasAfip ? '✓' : '×'} Facturación AFIP
                            </div>
                            <div className={u.permisosEspeciales.aprobarPagosTesoreria ? 'text-[#064e3b] font-semibold' : 'text-slate-400'}>
                              {u.permisosEspeciales.aprobarPagosTesoreria ? '✓' : '×'} Pagos Tesorería
                            </div>
                            <div className={u.permisosEspeciales.modificarPlanCuentas ? 'text-[#064e3b] font-semibold' : 'text-slate-400'}>
                              {u.permisosEspeciales.modificarPlanCuentas ? '✓' : '×'} Plan de Cuentas
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#042f22] bg-emerald-50 px-2 py-0.5 border border-emerald-800/20 tabular-nums">
                              {mostrarPin ? u.pin : '••••'}
                            </span>
                            <button
                              onClick={() =>
                                setVerPins((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                              }
                              title={mostrarPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                              className="p-1 text-[#357a59] hover:text-[#042f22]"
                            >
                              {mostrarPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!esActual && u.activo && (
                              <button
                                onClick={() => handleActivarSesionDirecta(u)}
                                title="Cambiar sesión activa a este usuario"
                                className="px-2 py-1 bg-emerald-50 hover:bg-[#064e3b] text-[#064e3b] hover:text-white border border-emerald-700/30 text-[10px] font-bold uppercase transition-colors"
                              >
                                Usar Rol
                              </button>
                            )}

                            <button
                              onClick={() => abrirModalEditarUsuario(u)}
                              title="Editar usuario, rol, PIN y permisos"
                              className="px-2 py-1 bg-white hover:bg-emerald-50 text-[#064e3b] border border-emerald-800/30 text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>

                            <button
                              onClick={() => handleToggleEstadoActivo(u)}
                              title={u.activo ? 'Suspender acceso del usuario' : 'Reactivar acceso del usuario'}
                              className={`px-2 py-1 border text-[10px] font-bold uppercase flex items-center gap-1 transition-colors ${
                                u.activo
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border-emerald-400'
                              }`}
                            >
                              {u.activo ? (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  <span>Suspender</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Reactivar</span>
                                </>
                              )}
                            </button>

                            {confirmDeleteId === u.id ? (
                              <div className="flex items-center gap-1 bg-red-50 border border-red-300 px-1.5 py-0.5">
                                <span className="text-[10px] font-bold text-red-900">¿Quitar?</span>
                                <button
                                  onClick={() => handleEliminarUsuario(u)}
                                  className="px-1.5 py-0.5 bg-red-700 text-white text-[10px] font-bold uppercase"
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-0.5 bg-white text-slate-700 border border-slate-300 text-[10px] font-bold uppercase"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(u.id)}
                                title="Quitar / Eliminar usuario definitivamente"
                                className="px-2 py-1 bg-red-50 hover:bg-red-700 text-red-800 hover:text-white border border-red-300 text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Quitar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: MATRIZ INTERACTIVA DE PERMISOS POR MÓDULO */}
        {activeTab === 'matriz' && (
          <div className="p-4 space-y-3">
            <div className="p-3 bg-emerald-50/50 border border-emerald-800/20 flex items-center justify-between text-xs">
              <span>
                <strong>Matriz en Tiempo Real:</strong> Haga clic sobre cualquier casilla para otorgar (<strong>✓</strong>) o revocar (<strong>—</strong>) el acceso de un usuario a un módulo específico. Los cambios se guardan inmediatamente en Supabase.
              </span>
            </div>

            <div className="overflow-x-auto border border-emerald-800/25">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#064e3b] text-white text-[10px] uppercase">
                    <th className="py-2.5 px-3">Usuario / Rol</th>
                    {TODOS_LOS_MODULOS.map((m) => (
                      <th key={m.key} className="py-2.5 px-2 text-center" title={m.nombre}>
                        <div className="font-extrabold text-emerald-300">{m.codigo}</div>
                        <div className="text-[9px] font-normal truncate max-w-[72px]">{m.nombre.split(' ')[0]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-800/15">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-emerald-50/40">
                      <td className="py-2.5 px-3 font-bold text-[#042f22] whitespace-nowrap">
                        <div className="uppercase text-[11px] text-[#064e3b]">{u.rol}</div>
                        <div className="text-[10px] text-[#357a59] font-normal">{u.nombre}</div>
                      </td>
                      {TODOS_LOS_MODULOS.map((m) => {
                        const habilitado = u.modulosPermitidos.includes(m.key);
                        return (
                          <td key={m.key} className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleToggleModuloMatriz(u.id, m.key)}
                              title={`${habilitado ? 'Revocar' : 'Habilitar'} ${m.nombre} para ${u.nombre}`}
                              className={`w-7 h-7 mx-auto flex items-center justify-center border transition-all ${
                                habilitado
                                  ? 'bg-[#064e3b] text-white border-[#047857] font-bold'
                                  : 'bg-white text-slate-300 border-slate-200 hover:border-emerald-500'
                              }`}
                            >
                              {habilitado ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: BITÁCORA DE AUDITORÍA RBAC */}
        {activeTab === 'auditoria' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#042f22] uppercase">
                Eventos de Seguridad y Cambios de Usuarios Registrados en Supabase (`erp_webhooks_log`)
              </span>
              <button
                onClick={cargarAuditoria}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-700/30 text-[11px] font-bold uppercase"
              >
                {cargandoLogs ? 'Actualizando...' : 'Refrescar Bitácora'}
              </button>
            </div>

            <div className="overflow-x-auto border border-emerald-800/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-50/70 border-b border-emerald-800/25 text-[10px] font-extrabold text-[#064e3b] uppercase">
                    <th className="py-2 px-3">Fecha / Hora</th>
                    <th className="py-2 px-3">Evento RBAC</th>
                    <th className="py-2 px-3">Referencia Usuario</th>
                    <th className="py-2 px-3">Detalle de Auditoría</th>
                    <th className="py-2 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-800/15">
                  {logsRbac.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#357a59]">
                        No hay eventos de seguridad registrados aún.
                      </td>
                    </tr>
                  ) : (
                    logsRbac.map((log) => (
                      <tr key={log.id} className="hover:bg-emerald-50/30">
                        <td className="py-2 px-3 whitespace-nowrap tabular-nums text-[11px]">
                          {new Date(log.created_at).toLocaleString('es-AR')}
                        </td>
                        <td className="py-2 px-3 font-bold text-[#064e3b] uppercase text-[11px]">
                          {log.evento}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          {log.referencia_externa || '-'}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-[#042f22]">
                          {log.payload?.detalle ||
                            (log.payload?.operador
                              ? `Cambio de sesión activa a ${log.payload.operador} (${log.payload.rol})`
                              : JSON.stringify(log.payload))}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-[#064e3b] border border-emerald-400 text-[9px] font-bold uppercase">
                            {log.estado || 'AUTORIZADO'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE ALTA / EDICIÓN DE USUARIO */}
      {formOpen && (
        <div className="fixed inset-0 bg-[#042f22]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-emerald-800/30 max-w-3xl w-full shadow-2xl text-xs my-8">
            <div className="bg-[#064e3b] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-300" />
                <span className="font-bold uppercase tracking-wider">
                  {modoEdicionId ? `Editar Usuario y Permisos (${modoEdicionId})` : 'Alta de Nuevo Usuario Operador (RBAC)'}
                </span>
              </div>
              <button onClick={() => setFormOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarUsuario} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-[#042f22] uppercase mb-1">
                    Rol Institucional / Plantilla de Permisos *
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => handleAplicarPlantillaRol(e.target.value as RolOperador)}
                    className="w-full px-3 py-2 border border-emerald-800/30 bg-emerald-50/30 font-bold text-[#042f22]"
                  >
                    {Object.keys(PLANTILLAS_ROLES).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#042f22] uppercase mb-1">
                    Nombre Completo o Identificación del Puesto *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Cra. Laura Méndez / Auditoría Fiscal"
                    className="w-full px-3 py-2 border border-emerald-800/30 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#042f22] uppercase mb-1">
                    Correo Electrónico / Usuario *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@growsanjuan.com"
                    className="w-full px-3 py-2 border border-emerald-800/30 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#042f22] uppercase mb-1">
                      CUIL / Legajo
                    </label>
                    <input
                      type="text"
                      value={cuil}
                      onChange={(e) => setCuil(e.target.value)}
                      placeholder="20-XXXXXXXX-X"
                      className="w-full px-3 py-2 border border-emerald-800/30 bg-white tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#042f22] uppercase mb-1">
                      Sector / Área
                    </label>
                    <input
                      type="text"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      placeholder="Contaduría / Caja"
                      className="w-full px-3 py-2 border border-emerald-800/30 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#042f22] uppercase mb-1">
                    PIN de Autorización (4 a 6 dígitos) *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="w-3.5 h-3.5 text-[#047857] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-emerald-800/30 bg-white font-mono font-bold tabular-nums"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPin(String(Math.floor(1000 + Math.random() * 9000)))}
                      className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-700/30 font-bold uppercase text-[10px]"
                    >
                      Generar PIN
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#042f22] uppercase mb-1">
                    Estado del Usuario
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActivo(true)}
                      className={`flex-1 py-2 font-bold uppercase border ${
                        activo
                          ? 'bg-[#064e3b] text-white border-[#064e3b]'
                          : 'bg-white text-[#357a59] border-emerald-800/25'
                      }`}
                    >
                      ACTIVO (Habilitado)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivo(false)}
                      className={`flex-1 py-2 font-bold uppercase border ${
                        !activo
                          ? 'bg-amber-700 text-white border-amber-800'
                          : 'bg-white text-[#357a59] border-emerald-800/25'
                      }`}
                    >
                      SUSPENDIDO
                    </button>
                  </div>
                </div>
              </div>

              {/* Selección Granular de los 10 Módulos */}
              <div className="border-t border-emerald-800/20 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-[#042f22] uppercase">
                    Módulos Habilitados para este Usuario ({modulosSeleccionados.length} de 10):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModulosSeleccionados(TODOS_LOS_MODULOS.map((m) => m.key))}
                      className="text-[10px] font-bold text-[#047857] hover:underline uppercase"
                    >
                      Marcar Todos
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setModulosSeleccionados(['tablero'])}
                      className="text-[10px] font-bold text-[#357a59] hover:underline uppercase"
                    >
                      Solo Tablero
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TODOS_LOS_MODULOS.map((m) => {
                    const checked = modulosSeleccionados.includes(m.key);
                    return (
                      <div
                        key={m.key}
                        onClick={() => toggleModuloEnFormulario(m.key)}
                        className={`p-2.5 border cursor-pointer flex items-start gap-2.5 transition-all ${
                          checked
                            ? 'bg-emerald-50/70 border-[#064e3b]'
                            : 'bg-white border-emerald-800/20 opacity-65 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="mt-0.5 accent-[#064e3b]"
                        />
                        <div>
                          <div className="font-bold text-[#042f22] uppercase text-[11px]">
                            {m.codigo} · {m.nombre}
                          </div>
                          <div className="text-[10px] text-[#357a59]">{m.descripcion}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Permisos Especiales de Operación */}
              <div className="border-t border-emerald-800/20 pt-3">
                <label className="block font-bold text-[#042f22] uppercase mb-2">
                  Permisos Especiales de Auditoría y Transacciones Críticas:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'emitirFacturasAfip', label: 'Emitir Facturas AFIP (CAE)' },
                    { key: 'aprobarPagosTesoreria', label: 'Aprobar Pagos y Conciliar' },
                    { key: 'modificarPlanCuentas', label: 'Modificar Plan de Cuentas' },
                    { key: 'eliminarRegistros', label: 'Anular / Eliminar Registros' },
                    { key: 'exportarReportesFiscales', label: 'Exportar Libro IVA y F.931' }
                  ].map((perm) => {
                    const k = perm.key as keyof PermisosEspeciales;
                    const val = permisosEspeciales[k];
                    return (
                      <label
                        key={perm.key}
                        className={`p-2 border flex items-center gap-2 cursor-pointer ${
                          val ? 'bg-emerald-50/60 border-[#064e3b] font-bold' : 'bg-white border-emerald-800/20'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) =>
                            setPermisosEspeciales((prev) => ({
                              ...prev,
                              [k]: e.target.checked
                            }))
                          }
                          className="accent-[#064e3b]"
                        />
                        <span className="text-[11px] text-[#042f22]">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#042f22] uppercase mb-1">
                  Descripción / Observaciones de Auditoría
                </label>
                <input
                  type="text"
                  value={descripcionPermisos}
                  onChange={(e) => setDescripcionPermisos(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-800/30 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-emerald-800/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-[#042f22] border border-emerald-800/30 font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sincronizando}
                  className="px-5 py-2 bg-[#064e3b] hover:bg-[#047857] text-white font-bold uppercase flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {modoEdicionId ? 'Guardar Cambios en Base de Datos' : 'Crear Usuario en Base de Datos'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
