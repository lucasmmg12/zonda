import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Mail,
  Globe,
  Copy,
  Send,
  ShieldCheck,
  Clock,
  QrCode
} from 'lucide-react';
import {
  PRECIO_MENSUAL_SIMBOLICO_ARS,
  obtenerSuscripcionDeTenant,
  calcularMetricasTrial,
  iniciarSuscripcionMercadoPago20k,
  acreditarPagoSuscripcionMercadoPago20k,
  cambiarEstadoTrialDemo,
  type SuscripcionTenantSaas
} from '../../services/saasSubscriptionMpService';
import {
  getEmailDomainConfig,
  saveEmailDomainConfig,
  generarRegistrosDnsParaDominio,
  getEmailOutboxLogs,
  enviarEmailTransaccionalSaas,
  type EmailDomainConfig,
  type EmailLogItem
} from '../../services/emailDomainService';

interface SuscripcionMercadoPagoModalProps {
  isOpen: boolean;
  initialTab?: 'plan' | 'emails' | 'dominio';
  tenantId: string;
  razonSocial: string;
  cuit: string;
  emailUsuario: string;
  nombreUsuario: string;
  bloqueadoPorVencimiento?: boolean;
  onClose?: () => void;
}

export const SuscripcionMercadoPagoModal: React.FC<SuscripcionMercadoPagoModalProps> = ({
  isOpen,
  initialTab = 'plan',
  tenantId,
  razonSocial,
  cuit,
  emailUsuario,
  nombreUsuario,
  bloqueadoPorVencimiento = false,
  onClose
}) => {
  const [tab, setTab] = useState<'plan' | 'emails' | 'dominio'>(initialTab);
  const [sub, setSub] = useState<SuscripcionTenantSaas>(() =>
    obtenerSuscripcionDeTenant(tenantId, {
      razonSocial,
      cuit,
      email: emailUsuario,
      nombre: nombreUsuario
    })
  );

  const [mpCheckout, setMpCheckout] = useState<{
    id: string;
    checkoutUrl: string;
    externalReference: string;
    qrPayload: string;
    esModoSandbox: boolean;
  } | null>(null);
  const [procesandoMp, setProcesandoMp] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Dominio de Correo Propio + Bandeja de Salida
  const [domainCfg, setDomainCfg] = useState<EmailDomainConfig>(() => getEmailDomainConfig());
  const [logsEmail, setLogsEmail] = useState<EmailLogItem[]>(() => getEmailOutboxLogs());
  const [emailPreviewSel, setEmailPreviewSel] = useState<EmailLogItem | null>(null);
  const [emailPruebaDest, setEmailPruebaDest] = useState(emailUsuario);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    const refresh = () => {
      setSub(
        obtenerSuscripcionDeTenant(tenantId, {
          razonSocial,
          cuit,
          email: emailUsuario,
          nombre: nombreUsuario
        })
      );
      setLogsEmail(getEmailOutboxLogs());
      setDomainCfg(getEmailDomainConfig());
    };
    refresh();
    window.addEventListener('zonda_subscription_updated', refresh);
    window.addEventListener('zonda_email_logs_updated', refresh);
    return () => {
      window.removeEventListener('zonda_subscription_updated', refresh);
      window.removeEventListener('zonda_email_logs_updated', refresh);
    };
  }, [tenantId, razonSocial, cuit, emailUsuario, nombreUsuario, isOpen]);

  if (!isOpen) return null;

  const metricas = calcularMetricasTrial(sub);

  const notify = (msg: string) => {
    setAviso(msg);
    setTimeout(() => setAviso(null), 4000);
  };

  const handleGenerarLinkMercadoPago = async () => {
    setProcesandoMp(true);
    try {
      const link = await iniciarSuscripcionMercadoPago20k({
        tenantId,
        razonSocial,
        emailPayer: sub.emailTitular || emailUsuario,
        modo: 'preapproval'
      });
      setMpCheckout(link);
      notify('Link oficial de suscripción Mercado Pago ($20.000/mes) listo.');
    } finally {
      setProcesandoMp(false);
    }
  };

  const handleAcreditarPagoWebhook = async () => {
    setProcesandoMp(true);
    try {
      const nueva = await acreditarPagoSuscripcionMercadoPago20k({
        tenantId,
        medio: 'Mercado Pago Suscripción Mensual',
        referenciaMp: mpCheckout?.externalReference
      });
      setSub(nueva);
      setMpCheckout(null);
      notify('¡Pago de $20.000 ARS acreditado! Suscripción activa por 30 días y recibo enviado por email.');
    } finally {
      setProcesandoMp(false);
    }
  };

  const handleActualizarDominio = (nuevoDominio: string) => {
    const dns = generarRegistrosDnsParaDominio(nuevoDominio);
    setDomainCfg((prev) => ({
      ...prev,
      ...dns
    }));
  };

  const handleGuardarDominio = async (e: React.FormEvent) => {
    e.preventDefault();
    const actualizado: EmailDomainConfig = {
      ...domainCfg,
      estadoVerificacion: domainCfg.resendApiKey.trim().startsWith('re_')
        ? 'verificado'
        : 'pendiente_dns',
      ultimaVerificacion: new Date().toLocaleTimeString('es-AR')
    };
    await saveEmailDomainConfig(actualizado);
    setDomainCfg(actualizado);
    notify(`Configuración de dominio @${actualizado.dominio} guardada en Supabase.`);
  };

  const handleEnviarEmailPrueba = async () => {
    await enviarEmailTransaccionalSaas({
      template: 'welcome_trial',
      to: emailPruebaDest || emailUsuario,
      nombre: nombreUsuario,
      razonSocial,
      tenantId,
      trialFinFecha: new Date(sub.trialFinIso).toLocaleDateString('es-AR')
    });
    setLogsEmail(getEmailOutboxLogs());
    notify(`Correo transaccional enviado a ${emailPruebaDest || emailUsuario}.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {bloqueadoPorVencimiento
                ? 'Tu mes de prueba gratuita finalizó'
                : 'Suscripción, Mercado Pago y Dominio de Emails'}
            </h2>
            <p className="text-xs text-slate-500">
              {razonSocial} · Primer mes gratis, luego abono simbólico de $
              {PRECIO_MENSUAL_SIMBOLICO_ARS.toLocaleString('es-AR')} ARS/mes
            </p>
          </div>
          {onClose && !bloqueadoPorVencimiento && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pestañas limpias */}
        <div className="px-6 pt-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
          {[
            { id: 'plan', label: 'Mi Plan y Mercado Pago ($20.000)', icon: CreditCard },
            { id: 'emails', label: `Emails Enviados (${logsEmail.length})`, icon: Mail },
            { id: 'dominio', label: 'Dominio de Correo (DNS)', icon: Globe }
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as any)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl flex items-center gap-1.5 border-b-2 transition-colors ${
                  active
                    ? 'bg-white text-[#3563e9] border-[#3563e9]'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {aviso && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{aviso}</span>
          </div>
        )}

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {tab === 'plan' && (
            <div className="space-y-5">
              {/* Estado actual del Trial o Plan */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        sub.estado === 'active_paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : metricas.bloqueadoPorVencimiento
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#eff3fd] text-[#3563e9]'
                      }`}
                    >
                      {sub.estado === 'active_paid'
                        ? 'Suscripción Mensual Activa'
                        : metricas.bloqueadoPorVencimiento
                        ? 'Prueba de 30 días finalizada'
                        : `Prueba Gratuita Activa · Quedan ${metricas.diasRestantes} días`}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Plan Integral Todo Incluido — $20.000 ARS / mes
                  </h3>
                  <p className="text-xs text-slate-500">
                    {sub.estado === 'active_paid'
                      ? `Próxima renovación: ${new Date(
                          sub.proximoVencimientoIso || Date.now()
                        ).toLocaleDateString('es-AR')}`
                      : `Tu mes bonificado vence el ${new Date(sub.trialFinIso).toLocaleDateString(
                          'es-AR'
                        )}. Sin permanencia ni cargos ocultos.`}
                  </p>
                  {sub.estado !== 'active_paid' && (
                    <div className="w-full max-w-md h-2 rounded-full bg-slate-200 overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          metricas.bloqueadoPorVencimiento ? 'bg-amber-500' : 'bg-[#3563e9]'
                        }`}
                        style={{ width: `${metricas.porcentajeTranscurrido}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-2xl font-extrabold text-slate-900">$20.000</div>
                  <div className="text-[11px] text-slate-400">ARS / mes luego del día 30</div>
                </div>
              </div>

              {/* Bloque de Conexión y Pago Mercado Pago */}
              <div className="p-5 rounded-2xl border border-[#009ee3]/30 bg-gradient-to-br from-sky-50/60 to-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#009ee3] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                      MP
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Abonar con Mercado Pago (Checkout Pro / Débito Automático)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Pagá con dinero en cuenta, tarjeta de débito/crédito o QR interoperable.
                      </p>
                    </div>
                  </div>

                  {!mpCheckout ? (
                    <button
                      type="button"
                      onClick={handleGenerarLinkMercadoPago}
                      disabled={procesandoMp}
                      className="px-4 py-2.5 rounded-xl bg-[#009ee3] hover:bg-[#0086c3] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {procesandoMp
                          ? 'Conectando con Mercado Pago...'
                          : 'Activar Suscripción ($20.000/mes)'}
                      </span>
                    </button>
                  ) : null}
                </div>

                {mpCheckout && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-700">
                        Referencia: <code className="text-slate-500">{mpCheckout.externalReference}</code>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-semibold">
                        {mpCheckout.esModoSandbox ? 'Modo Sandbox / Prueba' : 'Producción Live'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <QrCode className="w-4 h-4 text-[#009ee3] shrink-0" />
                        <span className="truncate text-slate-600">{mpCheckout.checkoutUrl}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(mpCheckout.checkoutUrl);
                          notify('Link de pago copiado.');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
                      >
                        Copiar
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <a
                        href={mpCheckout.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#009ee3] hover:bg-[#0086c3] text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span>Abrir Checkout Mercado Pago</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={handleAcreditarPagoWebhook}
                        disabled={procesandoMp}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                        <span>Simular Pago Aprobado ($20.000 Webhook)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Historial de Pagos + Controles de Simulación de Trial */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="text-slate-500">
                  {sub.historialPagos.length > 0 ? (
                    <span>
                      Último pago acreditado: <strong>{sub.historialPagos[0].fecha}</strong> ($
                      {sub.historialPagos[0].montoArs.toLocaleString('es-AR')} ARS)
                    </span>
                  ) : (
                    <span>Aún no se realizaron cobros (estás dentro del período bonificado).</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {metricas.bloqueadoPorVencimiento ? (
                    <button
                      type="button"
                      onClick={() => setSub(cambiarEstadoTrialDemo(tenantId, 'restaurar_30_dias'))}
                      className="text-[#3563e9] hover:underline font-semibold"
                    >
                      Restaurar 30 días de prueba (Demo)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSub(cambiarEstadoTrialDemo(tenantId, 'forzar_vencimiento'))}
                      className="text-slate-500 hover:text-slate-800 underline"
                    >
                      Probar pantalla de vencimiento día 30
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'emails' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">
                    Despacho automático de emails ({domainCfg.remitenteEmail})
                  </div>
                  <div className="text-slate-500">
                    Cada alta de usuario o pago de suscripción envía un correo HTML automático.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailPruebaDest}
                    onChange={(e) => setEmailPruebaDest(e.target.value)}
                    placeholder="correo@destino.com"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleEnviarEmailPrueba}
                    className="px-3 py-1.5 rounded-lg bg-[#3563e9] hover:bg-[#2952cc] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar prueba</span>
                  </button>
                </div>
              </div>

              {logsEmail.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Todavía no hay correos registrados en esta sesión. Hacé clic en "Enviar prueba".
                </div>
              ) : (
                <div className="space-y-2">
                  {logsEmail.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        setEmailPreviewSel(emailPreviewSel?.id === item.id ? null : item)
                      }
                      className="p-3 rounded-xl border border-slate-200 hover:border-[#3563e9]/40 cursor-pointer transition-colors bg-white"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-900 truncate">{item.asunto}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold shrink-0">
                          {item.estado}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Para: {item.destinatario}</span>
                        <span>{new Date(item.createdAt).toLocaleString('es-AR')}</span>
                      </div>
                      {emailPreviewSel?.id === item.id && (
                        <div
                          className="mt-3 pt-3 border-t border-slate-100"
                          dangerouslySetInnerHTML={{ __html: item.htmlPreview }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'dominio' && (
            <form onSubmit={handleGuardarDominio} className="space-y-4">
              <div className="p-4 rounded-xl bg-[#eff3fd]/60 border border-[#3563e9]/20 text-xs text-slate-700 leading-relaxed">
                Configurá tu propio dominio corporativo (ej. <strong>zondaerp.com.ar</strong>) para
                enviar los correos de registro, recuperación de clave y recibos de suscripción mediante{' '}
                <strong>Resend / SMTP</strong>.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dominio propio de envío
                  </label>
                  <input
                    type="text"
                    value={domainCfg.dominio}
                    onChange={(e) => handleActualizarDominio(e.target.value)}
                    placeholder="zondaerp.com.ar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#3563e9]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Casilla remitente oficial
                  </label>
                  <input
                    type="email"
                    value={domainCfg.remitenteEmail}
                    onChange={(e) =>
                      setDomainCfg({ ...domainCfg, remitenteEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#3563e9]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Resend API Key (opcional en local · comenzando con <code>re_</code> en producción)
                  </label>
                  <input
                    type="password"
                    value={domainCfg.resendApiKey}
                    onChange={(e) =>
                      setDomainCfg({ ...domainCfg, resendApiKey: e.target.value })
                    }
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#3563e9]"
                  />
                </div>
              </div>

              {/* Registros DNS autogenerados para copiar en Cloudflare / NIC.ar */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800">
                  Registros DNS listos para pegar en Cloudflare / Hosting:
                </div>
                {[
                  { tipo: 'TXT (SPF)', host: '@', valor: domainCfg.spfRecord },
                  { tipo: 'TXT (DKIM)', host: 'resend._domainkey', valor: domainCfg.dkimValue },
                  { tipo: 'TXT (DMARC)', host: '_dmarc', valor: domainCfg.dmarcRecord }
                ].map((rec) => (
                  <div
                    key={rec.tipo}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-[11px]"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800">{rec.tipo}</span> · Host:{' '}
                      <code className="text-[#3563e9]">{rec.host}</code>
                      <div className="text-slate-500 truncate mt-0.5 font-mono">{rec.valor}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(rec.valor);
                        notify(`Registro ${rec.tipo} copiado.`);
                      }}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#3563e9] hover:bg-[#2952cc] text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Guardar Dominio y Configuración DNS</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
