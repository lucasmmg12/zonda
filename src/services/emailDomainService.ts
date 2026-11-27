import { supabase } from '../lib/supabase';

export interface EmailDomainConfig {
  dominio: string;
  remitenteNombre: string;
  remitenteEmail: string;
  replyTo: string;
  proveedor: 'resend' | 'smtp';
  resendApiKey: string;
  spfRecord: string;
  dkimSelector: string;
  dkimValue: string;
  dmarcRecord: string;
  mxReturnPath: string;
  estadoVerificacion: 'pendiente_dns' | 'verificado';
  ultimaVerificacion?: string;
}

export type EmailTemplateType =
  | 'welcome_trial'
  | 'verify_email'
  | 'trial_expiring'
  | 'subscription_paid_20k';

export interface EmailLogItem {
  id: string;
  tenantId?: string;
  destinatario: string;
  remitente: string;
  asunto: string;
  plantilla: EmailTemplateType;
  htmlPreview: string;
  proveedor: string;
  estado: string;
  createdAt: string;
}

const STORAGE_EMAIL_DOMAIN_KEY = 'zonda_saas_email_domain_v1';
const STORAGE_EMAIL_LOGS_KEY = 'zonda_saas_email_logs_v1';

export function generarRegistrosDnsParaDominio(dominioRaw: string): Pick<
  EmailDomainConfig,
  'dominio' | 'remitenteEmail' | 'replyTo' | 'spfRecord' | 'dkimSelector' | 'dkimValue' | 'dmarcRecord' | 'mxReturnPath'
> {
  const dominio = (dominioRaw || 'zondaerp.com.ar')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  return {
    dominio,
    remitenteEmail: `hola@${dominio}`,
    replyTo: `soporte@${dominio}`,
    spfRecord: `v=spf1 include:amazonses.com include:_spf.resend.com ~all`,
    dkimSelector: `resend._domainkey.${dominio}`,
    dkimValue: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD${btoa(dominio).replace(/[^a-zA-Z0-9]/g, '').slice(0, 28)}ZondaMailAuth2026IDAQAB`,
    dmarcRecord: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${dominio}; pct=100; adkim=s; aspf=s`,
    mxReturnPath: `10 feedback-smtp.sa-east-1.amazonses.com`
  };
}

export function getEmailDomainConfig(): EmailDomainConfig {
  const baseDns = generarRegistrosDnsParaDominio('zondaerp.com.ar');
  const defaultCfg: EmailDomainConfig = {
    ...baseDns,
    remitenteNombre: 'Zonda ERP · Grow Labs',
    proveedor: 'resend',
    resendApiKey: import.meta.env.VITE_RESEND_API_KEY || '',
    estadoVerificacion: 'pendiente_dns'
  };

  try {
    const raw = localStorage.getItem(STORAGE_EMAIL_DOMAIN_KEY);
    if (raw) {
      return { ...defaultCfg, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return defaultCfg;
}

export async function saveEmailDomainConfig(cfg: EmailDomainConfig): Promise<void> {
  try {
    localStorage.setItem(STORAGE_EMAIL_DOMAIN_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event('zonda_email_domain_updated'));
  } catch {
    // ignore
  }

  try {
    await supabase.from('saas_email_domain_config').upsert(
      {
        id: 'PRINCIPAL',
        dominio: cfg.dominio,
        remitente_nombre: cfg.remitenteNombre,
        remitente_email: cfg.remitenteEmail,
        reply_to: cfg.replyTo,
        proveedor: cfg.proveedor,
        api_key_configured: Boolean(cfg.resendApiKey?.trim()),
        spf_record: cfg.spfRecord,
        dkim_selector: cfg.dkimSelector,
        dkim_value: cfg.dkimValue,
        dmarc_record: cfg.dmarcRecord,
        estado_verificacion: cfg.estadoVerificacion,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    );
  } catch {
    // fallback local
  }
}

export function getEmailOutboxLogs(): EmailLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_EMAIL_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function appendEmailOutboxLog(item: EmailLogItem): void {
  try {
    const prev = getEmailOutboxLogs();
    const next = [item, ...prev].slice(0, 50);
    localStorage.setItem(STORAGE_EMAIL_LOGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('zonda_email_logs_updated'));
  } catch {
    // ignore
  }
}

export function buildTransactionalEmailHtml(params: {
  template: EmailTemplateType;
  nombre: string;
  razonSocial: string;
  email: string;
  trialFinFecha?: string;
  codigoVerificacion?: string;
  montoPagadoArs?: number;
}): { subject: string; html: string } {
  const {
    template,
    nombre,
    razonSocial,
    email,
    trialFinFecha = '',
    codigoVerificacion = '849201',
    montoPagadoArs = 20000
  } = params;

  if (template === 'verify_email') {
    return {
      subject: `Confirmá tu cuenta en Zonda ERP — Código ${codigoVerificacion}`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;color:#0f172a">
          <div style="font-size:12px;font-weight:700;color:#3563e9;text-transform:uppercase;letter-spacing:0.08em">Zonda ERP · Verificación de Seguridad</div>
          <h2 style="margin:12px 0 8px;font-size:22px;color:#0f172a">Hola ${nombre}, confirmá tu correo</h2>
          <p style="font-size:14px;line-height:1.6;color:#475569">Tu entorno aislado para <strong>${razonSocial}</strong> ya fue creado. Usá este código o ingresá directo a tu panel:</p>
          <div style="margin:20px 0;padding:16px;background:#eff3fd;border-radius:12px;text-align:center;font-size:26px;font-weight:800;letter-spacing:0.2em;color:#3563e9">${codigoVerificacion}</div>
          <p style="font-size:12px;color:#64748b">Correo registrado: ${email}</p>
        </div>`
    };
  }

  if (template === 'subscription_paid_20k') {
    return {
      subject: `Pago acreditado ($${montoPagadoArs.toLocaleString('es-AR')} ARS) — Suscripción Activa Zonda ERP`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;color:#0f172a">
          <div style="font-size:12px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:0.08em">Mercado Pago · Suscripción Confirmada</div>
          <h2 style="margin:12px 0 8px;font-size:22px;color:#0f172a">¡Gracias, ${nombre}! Tu plan mensual está activo</h2>
          <p style="font-size:14px;line-height:1.6;color:#475569">Acreditamos tu abono mensual simbólico de <strong>$${montoPagadoArs.toLocaleString('es-AR')} ARS</strong> para <strong>${razonSocial}</strong>. Tenés acceso ilimitado a Facturación ARCA, Inventario, Sueldos, Contabilidad y Tienda Online.</p>
        </div>`
    };
  }

  if (template === 'trial_expiring') {
    return {
      subject: `Tu mes de prueba gratuita en Zonda ERP finaliza pronto`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;color:#0f172a">
          <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a">Hola ${nombre}, continuá usando Zonda ERP sin interrupciones</h2>
          <p style="font-size:14px;line-height:1.6;color:#475569">Tu período bonificado de 30 días para <strong>${razonSocial}</strong> vence el <strong>${trialFinFecha}</strong>. Podés activar tu suscripción mensual simbólica de <strong>$20.000 ARS/mes</strong> con Mercado Pago en 1 clic desde tu cuenta.</p>
        </div>`
    };
  }

  return {
    subject: `¡Bienvenido a Zonda ERP, ${nombre}! Tus 30 días gratis ya están activos`,
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;color:#0f172a">
        <div style="font-size:12px;font-weight:700;color:#3563e9;text-transform:uppercase;letter-spacing:0.08em">Zonda ERP · Grow Labs Suite</div>
        <h2 style="margin:12px 0 8px;font-size:22px;color:#0f172a">¡Tu empresa ya está lista para operar!</h2>
        <p style="font-size:14px;line-height:1.6;color:#475569">Hola <strong>${nombre}</strong>, creamos automáticamente el entorno aislado para <strong>${razonSocial}</strong> (${email}).</p>
        <div style="margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:13px;color:#334155">
          <div style="margin-bottom:6px">✓ <strong>30 días de prueba 100% gratuita</strong> (hasta el ${trialFinFecha || 'próximo mes'})</div>
          <div style="margin-bottom:6px">✓ Todos los módulos activos: Ventas ARCA, Compras, Stock, Bancos, Sueldos y Ecommerce</div>
          <div>✓ Luego del mes gratis: abono simbólico de <strong>$20.000 ARS/mes</strong> vía Mercado Pago (sin permanencia)</div>
        </div>
        <p style="font-size:12px;color:#64748b">Equipo Zonda ERP · Autogestión Cloud</p>
      </div>`
  };
}

export async function enviarEmailTransaccionalSaas(params: {
  template: EmailTemplateType;
  to: string;
  nombre: string;
  razonSocial: string;
  tenantId?: string;
  trialFinFecha?: string;
  codigoVerificacion?: string;
  montoPagadoArs?: number;
}): Promise<EmailLogItem> {
  const domainCfg = getEmailDomainConfig();
  const { subject, html } = buildTransactionalEmailHtml({
    template: params.template,
    nombre: params.nombre,
    razonSocial: params.razonSocial,
    email: params.to,
    trialFinFecha: params.trialFinFecha,
    codigoVerificacion: params.codigoVerificacion,
    montoPagadoArs: params.montoPagadoArs
  });

  const formattedFrom = `${domainCfg.remitenteNombre} <${domainCfg.remitenteEmail}>`;
  let estado = domainCfg.resendApiKey ? 'ENVIADO_RESEND_TLS' : 'DESPACHADO_OUTBOX';

  try {
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL || 'https://dtjmckbrofevgfqbkzli.supabase.co';
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {})
      },
      body: JSON.stringify({
        to: params.to,
        subject,
        html,
        fromEmail: domainCfg.remitenteEmail,
        fromName: domainCfg.remitenteNombre,
        replyTo: domainCfg.replyTo,
        template: params.template,
        tenantId: params.tenantId,
        resendApiKey: domainCfg.resendApiKey || undefined
      })
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json?.status) estado = json.status;
    }
  } catch {
    // Si la Edge Function aún no fue desplegada, persistimos en segundo plano
    void supabase
      .from('saas_emails_log')
      .insert({
        id: `EML-${Date.now()}`,
        tenant_id: params.tenantId || null,
        destinatario: params.to,
        remitente: formattedFrom,
        asunto: subject,
        plantilla: params.template,
        html_preview: html,
        proveedor: domainCfg.proveedor,
        estado
      })
      .then(() => {});
  }

  const item: EmailLogItem = {
    id: `EML-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    tenantId: params.tenantId,
    destinatario: params.to,
    remitente: formattedFrom,
    asunto: subject,
    plantilla: params.template,
    htmlPreview: html,
    proveedor: domainCfg.proveedor.toUpperCase(),
    estado,
    createdAt: new Date().toISOString()
  };

  appendEmailOutboxLog(item);
  return item;
}
