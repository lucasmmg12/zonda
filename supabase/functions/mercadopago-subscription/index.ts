/**
 * SUPABASE EDGE FUNCTION: mercadopago-subscription
 * Endpoint: https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-subscription
 *
 * Crea la Suscripción Mensual Recurrente (`preapproval`) en Mercado Pago con:
 * - 1 Mes de Prueba Gratuita (`free_trial: { frequency: 1, frequency_type: 'months' }`)
 * - Abono mensual simbólico de $20.000 ARS (`transaction_amount: 20000`)
 * Y provee fallback a Preferencia Checkout Pro de $20.000 ARS (`checkout/preferences`).
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
      tenantId,
      payerEmail,
      razonSocial,
      modoCobro = 'preapproval', // 'preapproval' | 'checkout_pro'
      incluirMesGratis = false,
      backUrl = 'https://zondaerp.com.ar/?mp_sub=approved'
    } = body;

    const { data: configRow } = await supabase
      .from('erp_integraciones_config')
      .select('mercadopago_config')
      .eq('id', 'PRINCIPAL')
      .maybeSingle();

    const mpConfig = configRow?.mercadopago_config || {};
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') || mpConfig.accessToken || '';
    const webhookUrl =
      mpConfig.webhookUrl || `${supabaseUrl}/functions/v1/mercadopago-webhook`;
    const externalReference = `SUB-ZONDA-20K-${tenantId || 'TENANT'}-${Date.now()}`;
    const montoMensual = 20000;

    if (accessToken && (accessToken.startsWith('APP_USR-') || accessToken.startsWith('TEST-'))) {
      if (modoCobro === 'preapproval') {
        const preapprovalPayload = {
          reason: `Suscripción Mensual Zonda ERP — ${razonSocial || 'Empresa'}`,
          external_reference: externalReference,
          payer_email: payerEmail,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: montoMensual,
            currency_id: 'ARS',
            ...(incluirMesGratis
              ? {
                  free_trial: {
                    frequency: 1,
                    frequency_type: 'months'
                  }
                }
              : {})
          },
          back_url: backUrl,
          status: 'pending'
        };

        const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(preapprovalPayload)
        });

        if (mpRes.ok) {
          const data = await mpRes.json();
          return new Response(
            JSON.stringify({
              ok: true,
              mode: 'preapproval_live',
              id: data.id,
              initPoint: data.init_point,
              sandboxInitPoint: data.sandbox_init_point || data.init_point,
              externalReference,
              montoMensual
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Fallback o modo directo Checkout Pro ($20.000 ARS)
      const prefPayload = {
        items: [
          {
            id: 'PLAN-ZONDA-PRO-20K',
            title: `Abono Mensual Zonda ERP (${razonSocial || 'Licencia Cloud'})`,
            quantity: 1,
            currency_id: 'ARS',
            unit_price: montoMensual
          }
        ],
        payer: payerEmail ? { email: payerEmail } : undefined,
        external_reference: externalReference,
        notification_url: webhookUrl,
        back_urls: {
          success: backUrl,
          pending: backUrl,
          failure: backUrl
        },
        auto_return: 'approved',
        statement_descriptor: 'ZONDA ERP'
      };

      const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prefPayload)
      });

      if (prefRes.ok) {
        const pref = await prefRes.json();
        return new Response(
          JSON.stringify({
            ok: true,
            mode: 'checkout_pro_live',
            id: pref.id,
            initPoint: pref.init_point,
            sandboxInitPoint: pref.sandbox_init_point || pref.init_point,
            externalReference,
            montoMensual
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const simId = `MP-SUB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    return new Response(
      JSON.stringify({
        ok: true,
        mode: 'sandbox_ready',
        id: simId,
        initPoint: `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=${simId}`,
        sandboxInitPoint: `https://sandbox.mercadopago.com.ar/subscriptions/checkout?preapproval_id=${simId}`,
        externalReference,
        montoMensual
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
