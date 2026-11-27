import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Building2,
  User,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  registrarUsuarioEmpresaAutogestionado,
  iniciarSesionConEmailPassword,
  iniciarFlujoGoogleSaas,
  ingresarConCuentaDemoRapida,
  type SaasWebSession
} from '../../services/saasAuthOnboardingService';

interface AuthOnboardingModalProps {
  isOpen: boolean;
  initialMode?: 'signup' | 'login';
  prefilledEmail?: string;
  onClose: () => void;
  onSuccess: (session: SaasWebSession) => void;
}

export const AuthOnboardingModal: React.FC<AuthOnboardingModalProps> = ({
  isOpen,
  initialMode = 'signup',
  prefilledEmail = '',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [cuit, setCuit] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState<'core' | 'cloud'>('core');
  const [mostrarOpcionesEmpresa, setMostrarOpcionesEmpresa] = useState(false);
  const [mostrarDemos, setMostrarDemos] = useState(false);
  const [mostrarGoogleRapido, setMostrarGoogleRapido] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleNombre, setGoogleNombre] = useState('');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registroExitoso, setRegistroExitoso] = useState<{
    session: SaasWebSession;
    codigoVerificacion?: string;
  } | null>(null);

  React.useEffect(() => {
    setMode(initialMode);
    if (prefilledEmail) setEmail(prefilledEmail);
    setError(null);
    setRegistroExitoso(null);
  }, [initialMode, prefilledEmail, isOpen]);

  if (!isOpen) return null;

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      if (mode === 'signup') {
        const res = await registrarUsuarioEmpresaAutogestionado({
          nombre,
          email,
          password,
          razonSocial: razonSocial || `${nombre} Empresa`,
          cuit: cuit || '30-71900100-8',
          tipoCuenta,
          authProvider: 'email'
        });
        if (!res.ok || !res.session) {
          setError(res.error || 'No se pudo completar el registro.');
          return;
        }
        setRegistroExitoso({
          session: res.session,
          codigoVerificacion: res.codigoVerificacion
        });
      } else {
        const res = await iniciarSesionConEmailPassword({ email, password });
        if (!res.ok || !res.session) {
          setError(res.error || 'Credenciales inválidas.');
          return;
        }
        onSuccess(res.session);
      }
    } finally {
      setCargando(false);
    }
  };

  const handleClickGoogle = async () => {
    setError(null);
    setCargando(true);
    try {
      const res = await iniciarFlujoGoogleSaas();
      if (res.redirected) return;
      if (res.session) {
        onSuccess(res.session);
        return;
      }
      // Si el proyecto aún no tiene Google Client ID configurado para localhost, abrimos el selector rápido Google
      setMostrarGoogleRapido(true);
    } finally {
      setCargando(false);
    }
  };

  const handleConfirmarGoogleRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setError('Ingresá tu dirección de Gmail o Google Workspace.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const res = await iniciarFlujoGoogleSaas({
        emailGoogle: googleEmail,
        nombreGoogle: googleNombre || googleEmail.split('@')[0],
        razonSocial: razonSocial || undefined,
        cuit: cuit || undefined,
        tipoCuenta
      });
      if (res.session) {
        onSuccess(res.session);
      } else if (res.error) {
        setError(res.error);
      }
    } finally {
      setCargando(false);
    }
  };

  const handleIngresarDemo = async (opId: string) => {
    setCargando(true);
    try {
      const session = await ingresarConCuentaDemoRapida(opId);
      if (session) onSuccess(session);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera limpia */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eff3fd] text-[#3563e9] text-[11px] font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>30 días gratis · Luego $20.000/mes</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {registroExitoso
                ? '¡Cuenta creada con éxito!'
                : mode === 'signup'
                ? 'Creá tu cuenta gratis'
                : 'Ingresá a Zonda ERP'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {registroExitoso
                ? 'Te enviamos un correo de bienvenida y activamos tu mes gratuito.'
                : mode === 'signup'
                ? 'Empezá a usar el sistema en menos de 1 minuto, sin tarjeta.'
                : 'Accedé con tu cuenta de Google o con tu correo y contraseña.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {registroExitoso ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Entorno aislado listo: {registroExitoso.session.razonSocial}</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Enviamos el correo de bienvenida y verificación a{' '}
                <strong>{registroExitoso.session.email}</strong>. Tenés{' '}
                <strong>30 días de prueba 100% bonificada</strong> antes del abono simbólico de $20.000/mes.
              </p>
              {registroExitoso.codigoVerificacion && (
                <div className="text-[11px] text-emerald-800 bg-white/80 rounded-lg px-3 py-1.5 border border-emerald-200">
                  Código enviado a tu casilla: <strong>{registroExitoso.codigoVerificacion}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSuccess(registroExitoso.session)}
              className="w-full py-3 px-4 rounded-xl bg-[#3563e9] hover:bg-[#2952cc] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <span>Comenzar a usar Zonda ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Selector de pestaña Registro / Login */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Registrarse Gratis
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Iniciar Sesión
              </button>
            </div>

            {/* Botón Google OAuth */}
            {!mostrarGoogleRapido ? (
              <button
                type="button"
                onClick={handleClickGoogle}
                disabled={cargando}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
                  />
                </svg>
                <span>
                  {mode === 'signup' ? 'Registrarse con Google' : 'Continuar con Google'}
                </span>
              </button>
            ) : (
              <form
                onSubmit={handleConfirmarGoogleRapido}
                className="p-3.5 rounded-xl bg-[#eff3fd]/70 border border-[#3563e9]/25 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Seleccioná tu cuenta de Google
                  </span>
                  <button
                    type="button"
                    onClick={() => setMostrarGoogleRapido(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={googleNombre}
                  onChange={(e) => setGoogleNombre(e.target.value)}
                  placeholder="Tu nombre (ej. Juan Pérez)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#3563e9]"
                />
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#3563e9]"
                />
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-2 rounded-lg bg-[#3563e9] hover:bg-[#2952cc] text-white text-xs font-semibold"
                >
                  Confirmar e Ingresar con Google
                </button>
              </form>
            )}

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink-0 px-3 text-[11px] text-slate-400">o con tu email</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Formulario Email y Contraseña */}
            <form onSubmit={handleSubmitEmail} className="space-y-3">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nombre y apellido
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. María González"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs focus:outline-none focus:border-[#3563e9]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nombre de tu empresa o comercio
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        placeholder="Ej. Distribuidora del Sol S.A.S."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs focus:outline-none focus:border-[#3563e9]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@tuempresa.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs focus:outline-none focus:border-[#3563e9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs focus:outline-none focus:border-[#3563e9]"
                  />
                </div>
              </div>

              {/* Opciones adicionales colapsadas ("Menos es más") */}
              {mode === 'signup' && (
                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMostrarOpcionesEmpresa(!mostrarOpcionesEmpresa)}
                    className="w-full px-3 py-2 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-[11px] font-medium text-slate-600"
                  >
                    <span>Datos fiscales opcionales (CUIT / Estudio Contable)</span>
                    {mostrarOpcionesEmpresa ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {mostrarOpcionesEmpresa && (
                    <div className="p-3 space-y-2.5 bg-white border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          CUIT (podés configurarlo luego)
                        </label>
                        <input
                          type="text"
                          value={cuit}
                          onChange={(e) => setCuit(e.target.value)}
                          placeholder="30-71000000-8"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#3563e9]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Perfil del entorno
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setTipoCuenta('core')}
                            className={`py-1.5 px-2 rounded-lg border font-semibold ${
                              tipoCuenta === 'core'
                                ? 'border-[#3563e9] bg-[#eff3fd] text-[#3563e9]'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            Empresa (Zonda Core)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTipoCuenta('cloud')}
                            className={`py-1.5 px-2 rounded-lg border font-semibold ${
                              tipoCuenta === 'cloud'
                                ? 'border-[#3563e9] bg-[#eff3fd] text-[#3563e9]'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            Contador (Zonda Cloud)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3 px-4 rounded-xl bg-[#3563e9] hover:bg-[#2952cc] disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span>
                  {cargando
                    ? 'Procesando...'
                    : mode === 'signup'
                    ? 'Comenzar mis 30 días gratis'
                    : 'Ingresar a mi cuenta'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Acceso rápido a entornos Demo precargados (colapsado por defecto) */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMostrarDemos(!mostrarDemos)}
                className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-800 py-1"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Explorar cuentas Demo con datos cargados</span>
                </span>
                {mostrarDemos ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {mostrarDemos && (
                <div className="mt-2 grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleIngresarDemo('USR-ECAR-01')}
                    className="text-left px-3 py-2 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-slate-50 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">ECAR S.A.S. (Zonda Core)</div>
                      <div className="text-[10px] text-slate-400">Empresa con ventas, stock y bancos</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIngresarDemo('USR-SAN-01')}
                    className="text-left px-3 py-2 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-slate-50 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Sanatorio Argentino S.R.L.</div>
                      <div className="text-[10px] text-slate-400">Clínica y prestaciones médicas</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIngresarDemo('USR-ZCLOUD-01')}
                    className="text-left px-3 py-2 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-slate-50 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Estudio Contable (Zonda Cloud)</div>
                      <div className="text-[10px] text-slate-400">Liquidación multi-CUIT ARCA</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
