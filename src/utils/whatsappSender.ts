import { supabase } from '../lib/supabase';

export interface WhatsAppInvoiceNotificationParams {
  telefonoCliente: string;
  clienteNombre: string;
  nroComprobante: string;
  tipoComprobante: string;
  importeTotal: number;
  cae?: string;
  vencimientoPago?: string;
  linkMercadoPago?: string;
  empresaNombre: string;
}

/**
 * Envía el comprobante electrónico y/o link de pago de Mercado Pago por WhatsApp.
 * 1) Si VITE_WHATSAPP_API_URL está configurado (ej. BuilderBot Cloud), realiza POST automático.
 * 2) Abre WhatsApp Web / Desktop (wa.me) con el mensaje ejecutivo formateado listo para enviar en 1 clic.
 * 3) Registra el evento de notificación en public.erp_webhooks_log en Supabase.
 */
export async function sendInvoiceViaWhatsApp(
  params: WhatsAppInvoiceNotificationParams
): Promise<{ ok: boolean; mode: 'api' | 'wame'; message: string }> {
  const digitsOnly = (params.telefonoCliente || '').replace(/\D/g, '');
  const normalizedPhone = digitsOnly.startsWith('54')
    ? digitsOnly
    : digitsOnly.length >= 10
    ? `549${digitsOnly.replace(/^0+/, '')}`
    : '5492644220000';

  const lineasMensaje = [
    `*${params.empresaNombre}*`,
    `Estimado/a *${params.clienteNombre}*, le enviamos el detalle de su comprobante electrónico:`,
    ``,
    `📄 *Comprobante:* ${params.tipoComprobante} ${params.nroComprobante}`,
    `💰 *Importe Total:* $${params.importeTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    params.vencimientoPago ? `📅 *Vencimiento:* ${params.vencimientoPago}` : '',
    params.cae ? `🔐 *CAE ARCA (AFIP):* ${params.cae}` : '',
    params.linkMercadoPago ? `\n💳 *Link de Pago Online (Mercado Pago):*\n${params.linkMercadoPago}` : '',
    ``,
    `_Mensaje emitido automáticamente por Zonda ERP._`
  ]
    .filter(Boolean)
    .join('\n');

  // Registrar en bitácora de auditoría Supabase
  try {
    await supabase.from('erp_webhooks_log').insert({
      origen: 'WHATSAPP_NOTIFIER',
      evento: 'invoice.whatsapp_sent',
      referencia_externa: params.nroComprobante,
      monto: params.importeTotal,
      estado: 'PROCESADO',
      payload: {
        telefono: normalizedPhone,
        cliente: params.clienteNombre,
        comprobante: `${params.tipoComprobante} ${params.nroComprobante}`,
        link_mp: params.linkMercadoPago || null
      }
    });
  } catch {
    // No bloquear envío si la bitácora falla
  }

  const builderBotUrl = import.meta.env.VITE_WHATSAPP_API_URL;
  if (builderBotUrl && String(builderBotUrl).startsWith('http')) {
    try {
      const res = await fetch(String(builderBotUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: normalizedPhone,
          messages: { content: lineasMensaje }
        })
      });
      if (res.ok) {
        return {
          ok: true,
          mode: 'api',
          message: `Comprobante enviado por API WhatsApp a +${normalizedPhone}`
        };
      }
    } catch {
      // Fallback a wa.me directo
    }
  }

  const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(lineasMensaje)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  return {
    ok: true,
    mode: 'wame',
    message: `WhatsApp abierto para ${params.clienteNombre} (+${normalizedPhone})`
  };
}
