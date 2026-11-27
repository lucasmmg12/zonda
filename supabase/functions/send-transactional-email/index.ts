/**
 * SUPABASE EDGE FUNCTION: send-transactional-email
 * Endpoint: https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/send-transactional-email
 *
 * Despacha correos transaccionales HTML desde el dominio corporativo propio (vía Resend API)
 * para:
 *  - Bienvenida + Activación de 30 Días Gratis (`welcome_trial`)
 *  - Confirmación de correo electrónico (`verify_email`)
 *  - Aviso de vencimiento próximo de prueba gratuita (`trial_expiring`)
 *  - Recibo de pago de suscripción mensual $20.000 ARS Mercado Pago (`subscription_paid_20k`)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://dtjmckbrofevgfqbkzli.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      to,
      subject,
      html,
      fromEmail,
      fromName,
      replyTo,
      template = 'welcome_trial',
      tenantId,
      resendApiKey: bodyApiKey
    } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendKey = bodyApiKey || Deno.env.get('RESEND_API_KEY') || '';
    const senderAddress = fromEmail || Deno.env.get('SAAS_FROM_EMAIL') || 'notificaciones@zondaerp.com.ar';
    const senderName = fromName || 'Zonda ERP · Grow Labs';
    const formattedFrom = `${senderName} <${senderAddress}>`;

    let providerStatus = 'SIMULADO_COLA_LOCAL';
    let providerMessageId = `MSG-LOCAL-${Date.now()}`;

    if (resendKey && resendKey.startsWith('re_')) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: formattedFrom,
          to: [to],
          reply_to: replyTo || senderAddress,
          subject,
          html
        })
      });

      if (resendRes.ok) {
        const data = await resendRes.json();
        providerStatus = 'ENVIADO_RESEND_TLS';
        providerMessageId = data?.id || providerMessageId;
      } else {
        const errTxt = await resendRes.text();
        providerStatus = `PENDIENTE_DOMINIO (${errTxt.slice(0, 80)})`;
      }
    }

    const logId = `EML-${Date.now()}`;
    await supabase.from('saas_emails_log').insert({
      id: logId,
      tenant_id: tenantId || null,
      destinatario: to,
      remitente: formattedFrom,
      asunto: subject,
      plantilla: template,
      html_preview: html,
      proveedor: resendKey ? 'resend' : 'sandbox_outbox',
      estado: providerStatus,
      provider_message_id: providerMessageId
    });

    return new Response(
      JSON.stringify({
        ok: true,
        logId,
        status: providerStatus,
        messageId: providerMessageId,
        from: formattedFrom,
        to
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
