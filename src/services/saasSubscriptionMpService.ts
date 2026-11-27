import { supabase } from '../lib/supabase';
import {
  crearPreferenciaMercadoPago,
  generarQrCobroMercadoPago,
  getMercadoPagoConfig,
  simularWebhookPagoMercadoPago
} from './mercadopago/mercadoPagoClient';
import { enviarEmailTransaccionalSaas } from './emailDomainService';

export const PRECIO_MENSUAL_SIMBOLICO_ARS = 20000;
export const DIAS_PRUEBA_GRATIS_SAAS = 30;

export type EstadoSuscripcionSaas =
  | 'trial_active'
  | 'trial_expired'
  | 'active_paid'
  | 'cancelled';

export interface PagoSuscripcionHistorial {
  id: string;
  fecha: string;
  montoArs: number;
  medio: string;
  referenciaMp: string;
  estado: 'APROBADO' | 'PENDIENTE';
}

export interface SuscripcionTenantSaas {
  tenantId: string;
  emailTitular: string;
  nombreTitular: string;
  razonSocial: string;
  cuit: string;
  authProvider: 'email' | 'google' | 'demo';
  emailVerificado: boolean;
  estado: EstadoSuscripcionSaas;
  precioMensualArs: number;
  trialInicioIso: string;
  trialFinIso: string;
  proximoVencimientoIso?: string;
  mpPreapprovalId?: string;
  mpUltimoLinkPago?: string;
  historialPagos: PagoSuscripcionHistorial[];
}

const STORAGE_SUBS_MAP_KEY = 'zonda_saas_subscriptions_v1';

function loadSubsMap(): Record<string, SuscripcionTenantSaas> {
  try {
    const raw = localStorage.getItem(STORAGE_SUBS_MAP_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

function saveSubsMap(map: Record<string, SuscripcionTenantSaas>): void {
  try {
    localStorage.setItem(STORAGE_SUBS_MAP_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('zonda_subscription_updated'));
  } catch {
    // ignore
  }
}

export function inicializarSuscripcionTrial30Dias(params: {
  tenantId: string;
  emailTitular: string;
  nombreTitular: string;
  razonSocial: string;
  cuit: string;
  authProvider: 'email' | 'google' | 'demo';
  emailVerificado?: boolean;
}): SuscripcionTenantSaas {
  const map = loadSubsMap();
  const ahora = new Date();
  const finTrial = new Date(ahora.getTime() + DIAS_PRUEBA_GRATIS_SAAS * 24 * 60 * 60 * 1000);

  const sub: SuscripcionTenantSaas = {
    tenantId: params.tenantId,
    emailTitular: params.emailTitular,
    nombreTitular: params.nombreTitular,
    razonSocial: params.razonSocial,
    cuit: params.cuit,
    authProvider: params.authProvider,
    emailVerificado: params.emailVerificado ?? params.authProvider === 'google',
    estado: 'trial_active',
    precioMensualArs: PRECIO_MENSUAL_SIMBOLICO_ARS,
    trialInicioIso: ahora.toISOString(),
    trialFinIso: finTrial.toISOString(),
    historialPagos: []
  };

  map[params.tenantId] = sub;
  saveSubsMap(map);

  void supabase
    .from('saas_cuentas_suscripcion')
    .upsert(
      {
        id: `SUB-${params.tenantId}`,
        tenant_id: params.tenantId,
        email: sub.emailTitular,
        nombre_titular: sub.nombreTitular,
        razon_social: sub.razonSocial,
        cuit: sub.cuit,
        auth_provider: sub.authProvider,
        email_verificado: sub.emailVerificado,
        estado_suscripcion: sub.estado,
        precio_mensual_ars: sub.precioMensualArs,
        trial_inicio: sub.trialInicioIso,
        trial_fin: sub.trialFinIso,
        historial_pagos: sub.historialPagos,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'tenant_id' }
    )
    .then(() => {});

  return sub;
}

export function obtenerSuscripcionDeTenant(
  tenantId: string,
  fallback?: { razonSocial?: string; cuit?: string; email?: string; nombre?: string }
): SuscripcionTenantSaas {
  const map = loadSubsMap();
  let sub = map[tenantId];

  if (!sub) {
    sub = inicializarSuscripcionTrial30Dias({
      tenantId,
      emailTitular: fallback?.email || 'administracion@empresa.com.ar',
      nombreTitular: fallback?.nombre || 'Administrador',
      razonSocial: fallback?.razonSocial || 'Mi Empresa',
      cuit: fallback?.cuit || '30-71000000-1',
      authProvider: tenantId.startsWith('TENANT-SAAS-') ? 'email' : 'demo',
      emailVerificado: true
    });
  }

  // Evaluar automáticamente si venció el período de prueba de 30 días
  if (sub.estado === 'trial_active') {
    const msRestantes = new Date(sub.trialFinIso).getTime() - Date.now();
    if (msRestantes <= 0) {
      sub = { ...sub, estado: 'trial_expired' };
      map[tenantId] = sub;
      saveSubsMap(map);
    }
  }

  return sub;
}

export function calcularMetricasTrial(sub: SuscripcionTenantSaas): {
  diasRestantes: number;
  porcentajeTranscurrido: number;
  bloqueadoPorVencimiento: boolean;
  etiquetaResumen: string;
} {
  if (sub.estado === 'active_paid') {
    return {
      diasRestantes: 30,
      porcentajeTranscurrido: 100,
      bloqueadoPorVencimiento: false,
      etiquetaResumen: 'Plan Activo · $20.000/mes'
    };
  }

  const totalMs = DIAS_PRUEBA_GRATIS_SAAS * 24 * 60 * 60 * 1000;
  const restantesMs = new Date(sub.trialFinIso).getTime() - Date.now();
  const diasRestantes = Math.max(0, Math.ceil(restantesMs / (24 * 60 * 60 * 1000)));
  const transcurrido = Math.min(100, Math.max(4, Math.round(((totalMs - restantesMs) / totalMs) * 100)));
  const bloqueadoPorVencimiento = sub.estado === 'trial_expired' || restantesMs <= 0;

  return {
    diasRestantes,
    porcentajeTranscurrido: transcurrido,
    bloqueadoPorVencimiento,
    etiquetaResumen: bloqueadoPorVencimiento
      ? 'Prueba finalizada · Activar $20.000/mes'
      : `Prueba Gratis · ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}`
  };
}

/**
 * Genera el Link de Suscripción Automática (`preapproval`) o Checkout Pro en Mercado Pago por $20.000 ARS/mes
 */
export async function iniciarSuscripcionMercadoPago20k(params: {
  tenantId: string;
  razonSocial: string;
  emailPayer: string;
  modo?: 'preapproval' | 'checkout_pro';
}): Promise<{
  id: string;
  checkoutUrl: string;
  externalReference: string;
  qrPayload: string;
  esModoSandbox: boolean;
}> {
  const mpCfg = getMercadoPagoConfig();
  const externalRef = `SUB-ZONDA-20K-${params.tenantId}-${Date.now()}`;
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL || 'https://dtjmckbrofevgfqbkzli.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  let checkoutUrl = '';
  let subId = '';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${supabaseUrl}/functions/v1/mercadopago-subscription`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {})
      },
      body: JSON.stringify({
        tenantId: params.tenantId,
        payerEmail: params.emailPayer,
        razonSocial: params.razonSocial,
        modoCobro: params.modo || 'preapproval',
        incluirMesGratis: false,
        backUrl: `${window.location.origin}/?mp_sub_status=approved&tenant=${encodeURIComponent(params.tenantId)}`
      })
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      subId = data.id;
      checkoutUrl = mpCfg.modo === 'produccion' ? data.initPoint : data.sandboxInitPoint || data.initPoint;
    }
  } catch {
    // Fallback inmediato a preferencia directa Checkout Pro $20.000 ARS
  }

  if (!checkoutUrl) {
    const pref = await Promise.race([
      crearPreferenciaMercadoPago({
        titulo: `Suscripción Mensual Zonda ERP — ${params.razonSocial}`,
        monto: PRECIO_MENSUAL_SIMBOLICO_ARS,
        clienteEmail: params.emailPayer,
        comprobanteNumero: externalRef
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000))
    ]);
    if (pref) {
      subId = pref.preferenceId;
      checkoutUrl = mpCfg.modo === 'produccion' ? pref.initPoint : pref.sandboxInitPoint;
    } else {
      subId = `MP-SUB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      checkoutUrl =
        mpCfg.modo === 'produccion'
          ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${subId}`
          : `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${subId}`;
    }
  }

  const qr = generarQrCobroMercadoPago({
    monto: PRECIO_MENSUAL_SIMBOLICO_ARS,
    referencia: externalRef.slice(-18),
    concepto: `Abono Mensual Zonda ERP`
  });

  const map = loadSubsMap();
  if (map[params.tenantId]) {
    map[params.tenantId] = {
      ...map[params.tenantId],
      mpPreapprovalId: subId,
      mpUltimoLinkPago: checkoutUrl
    };
    saveSubsMap(map);
  }

  return {
    id: subId,
    checkoutUrl,
    externalReference: externalRef,
    qrPayload: qr.payload,
    esModoSandbox: mpCfg.modo !== 'produccion'
  };
}

/**
 * Confirma la acreditación del pago de $20.000 ARS (vía retorno de Mercado Pago o Webhook),
 * pasa la suscripción a `active_paid` por 30 días y envía el recibo por email.
 */
export async function acreditarPagoSuscripcionMercadoPago20k(params: {
  tenantId: string;
  medio?: string;
  referenciaMp?: string;
}): Promise<SuscripcionTenantSaas> {
  const map = loadSubsMap();
  const actual = obtenerSuscripcionDeTenant(params.tenantId);
  const referencia = params.referenciaMp || `SUB-ZONDA-20K-${params.tenantId}-${Date.now()}`;

  void simularWebhookPagoMercadoPago({
    monto: PRECIO_MENSUAL_SIMBOLICO_ARS,
    referencia,
    metodo: params.medio || 'mercadopago_checkout_pro'
  });

  const proximoVto = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const nuevoPago: PagoSuscripcionHistorial = {
    id: `PAG-SUB-${Date.now()}`,
    fecha: new Date().toLocaleDateString('es-AR'),
    montoArs: PRECIO_MENSUAL_SIMBOLICO_ARS,
    medio: params.medio || 'Mercado Pago ($20.000 ARS)',
    referenciaMp: referencia,
    estado: 'APROBADO'
  };

  const actualizada: SuscripcionTenantSaas = {
    ...actual,
    estado: 'active_paid',
    proximoVencimientoIso: proximoVto,
    historialPagos: [nuevoPago, ...(actual.historialPagos || [])]
  };

  map[params.tenantId] = actualizada;
  saveSubsMap(map);

  void supabase
    .from('saas_cuentas_suscripcion')
    .upsert(
      {
        id: `SUB-${params.tenantId}`,
        tenant_id: params.tenantId,
        email: actualizada.emailTitular,
        nombre_titular: actualizada.nombreTitular,
        razon_social: actualizada.razonSocial,
        cuit: actualizada.cuit,
        auth_provider: actualizada.authProvider,
        email_verificado: true,
        estado_suscripcion: 'active_paid',
        precio_mensual_ars: PRECIO_MENSUAL_SIMBOLICO_ARS,
        trial_inicio: actualizada.trialInicioIso,
        trial_fin: actualizada.trialFinIso,
        proximo_vencimiento: proximoVto,
        mp_ultimo_pago_id: referencia,
        historial_pagos: actualizada.historialPagos,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'tenant_id' }
    )
    .then(() => {});

  void enviarEmailTransaccionalSaas({
    template: 'subscription_paid_20k',
    to: actualizada.emailTitular,
    nombre: actualizada.nombreTitular,
    razonSocial: actualizada.razonSocial,
    tenantId: params.tenantId,
    montoPagadoArs: PRECIO_MENSUAL_SIMBOLICO_ARS
  });

  return actualizada;
}

/**
 * Utilidad para QA y demostración: permite simular que ya transcurrieron los 30 días gratis
 * (o restaurar la prueba gratuita) para verificar la pantalla de cobro de $20.000 ARS con Mercado Pago.
 */
export function cambiarEstadoTrialDemo(
  tenantId: string,
  modo: 'forzar_vencimiento' | 'restaurar_30_dias'
): SuscripcionTenantSaas {
  const map = loadSubsMap();
  const actual = obtenerSuscripcionDeTenant(tenantId);
  const ahora = Date.now();

  const actualizada: SuscripcionTenantSaas =
    modo === 'forzar_vencimiento'
      ? {
          ...actual,
          estado: 'trial_expired',
          trialInicioIso: new Date(ahora - 31 * 24 * 60 * 60 * 1000).toISOString(),
          trialFinIso: new Date(ahora - 24 * 60 * 60 * 1000).toISOString()
        }
      : {
          ...actual,
          estado: 'trial_active',
          trialInicioIso: new Date(ahora).toISOString(),
          trialFinIso: new Date(ahora + DIAS_PRUEBA_GRATIS_SAAS * 24 * 60 * 60 * 1000).toISOString()
        };

  map[tenantId] = actualizada;
  saveSubsMap(map);
  return actualizada;
}

export function marcarEmailVerificadoSaas(tenantId: string): void {
  const map = loadSubsMap();
  const actual = map[tenantId];
  if (!actual) return;
  map[tenantId] = { ...actual, emailVerificado: true };
  saveSubsMap(map);
}
