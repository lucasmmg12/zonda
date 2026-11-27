-- ============================================================================
-- ZONDA ERP & ZONDA CLOUD — SAAS AUTOGESTIÓN, EMAILS & SUSCRIPCIONES ($20.000)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saas_cuentas_suscripcion (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  supabase_user_id TEXT,
  email TEXT NOT NULL,
  password_hash_hint TEXT,
  nombre_titular TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  cuit TEXT NOT NULL,
  condicion_iva TEXT NOT NULL DEFAULT 'Responsable Inscripto',
  tipo_entorno TEXT NOT NULL DEFAULT 'core', -- 'core' | 'cloud'
  auth_provider TEXT NOT NULL DEFAULT 'email', -- 'email' | 'google'
  email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  plan_codigo TEXT NOT NULL DEFAULT 'TRIAL_30D_PRO_20K',
  estado_suscripcion TEXT NOT NULL DEFAULT 'trial_active', -- 'trial_active' | 'trial_expired' | 'active_paid' | 'cancelled'
  precio_mensual_ars NUMERIC(14,2) NOT NULL DEFAULT 20000.00,
  trial_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_fin TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  proximo_vencimiento TIMESTAMPTZ,
  mp_preapproval_id TEXT,
  mp_preference_id TEXT,
  mp_ultimo_pago_id TEXT,
  historial_pagos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_cuentas_email ON public.saas_cuentas_suscripcion (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_saas_cuentas_tenant ON public.saas_cuentas_suscripcion (tenant_id);

CREATE TABLE IF NOT EXISTS public.saas_email_domain_config (
  id TEXT PRIMARY KEY DEFAULT 'PRINCIPAL',
  dominio TEXT NOT NULL DEFAULT 'zondaerp.com.ar',
  remitente_nombre TEXT NOT NULL DEFAULT 'Zonda ERP · Grow Labs',
  remitente_email TEXT NOT NULL DEFAULT 'notificaciones@zondaerp.com.ar',
  reply_to TEXT NOT NULL DEFAULT 'soporte@zondaerp.com.ar',
  proveedor TEXT NOT NULL DEFAULT 'resend', -- 'resend' | 'smtp'
  api_key_configured BOOLEAN NOT NULL DEFAULT FALSE,
  spf_record TEXT NOT NULL DEFAULT 'v=spf1 include:amazonses.com include:_spf.resend.com ~all',
  dkim_selector TEXT NOT NULL DEFAULT 'resend._domainkey',
  dkim_value TEXT NOT NULL DEFAULT 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCzondaDkimPublicKeyValidationRecord',
  dmarc_record TEXT NOT NULL DEFAULT 'v=DMARC1; p=quarantine; rua=mailto:dmarc@zondaerp.com.ar; pct=100',
  estado_verificacion TEXT NOT NULL DEFAULT 'pendiente_dns', -- 'pendiente_dns' | 'verificado'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saas_emails_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  destinatario TEXT NOT NULL,
  remitente TEXT NOT NULL,
  asunto TEXT NOT NULL,
  plantilla TEXT NOT NULL, -- 'welcome_trial' | 'verify_email' | 'trial_expiring' | 'subscription_paid_20k'
  cuerpo_resumen TEXT,
  html_preview TEXT,
  proveedor TEXT NOT NULL DEFAULT 'resend',
  estado TEXT NOT NULL DEFAULT 'ENVIADO',
  provider_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saas_cuentas_suscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_email_domain_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_emails_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saas_cuentas_suscripcion' AND policyname = 'saas_cuentas_all'
  ) THEN
    CREATE POLICY saas_cuentas_all ON public.saas_cuentas_suscripcion FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saas_email_domain_config' AND policyname = 'saas_domain_all'
  ) THEN
    CREATE POLICY saas_domain_all ON public.saas_email_domain_config FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saas_emails_log' AND policyname = 'saas_emails_all'
  ) THEN
    CREATE POLICY saas_emails_all ON public.saas_emails_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
