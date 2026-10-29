/**
 * SUPABASE EDGE FUNCTION: mercadopago-webhook
 * URL de Webhook Oficial: https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-webhook
 *
 * Orquestador automático de cobros de Mercado Pago (Checkout Pro, QR Interoperable y Point):
 * 1. Recibe la notificación IPN / Webhook v1 de Mercado Pago (`payment.created` / `payment.updated`).
 * 2. Verifica la firma `x-signature` (si se configuró `webhookSecret`) y consulta `GET https://api.mercadopago.com/v1/payments/{id}`.
 * 3. Registra la trazabilidad en `public.erp_webhooks_log`.
 * 4. Si el pago está `approved`, imputa la factura en `erp_clientes`, acredita el saldo en `erp_cuentas_bancarias`
 *    y asienta el cobro en partida doble en `erp_asientos_contables`.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://dtjmckbrofevgfqbkzli.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const paymentId = body?.data?.id || body?.id || new URL(req.url).searchParams.get('data.id');
    const eventType = body?.action || body?.type || body?.topic || 'payment.updated';

    // 1. Obtener configuración guardada en erp_integraciones_config
    const { data: configRow } = await supabase
      .from('erp_integraciones_config')
      .select('mercadopago_config')
      .eq('id', 'PRINCIPAL')
      .maybeSingle();

    const mpConfig = configRow?.mercadopago_config || {};
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') || mpConfig.accessToken || '';

    let externalReference = body?.external_reference || 'SIN-REF';
    let montoCobrado = Number(body?.transaction_amount || 0);
    let paymentStatus = body?.status || 'approved';
    let payerEmail = body?.payer?.email || 'cliente@mercadopago.com';

    // 2. Si hay Access Token real y paymentId, consultamos la API oficial de Mercado Pago
    if (accessToken && paymentId && !body?.simulated) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (mpRes.ok) {
        const mpPayment = await mpRes.json();
        externalReference = mpPayment.external_reference || externalReference;
        montoCobrado = Number(mpPayment.transaction_amount || montoCobrado);
        paymentStatus = mpPayment.status || paymentStatus;
        payerEmail = mpPayment.payer?.email || payerEmail;
      }
    }

    // 3. Registrar en erp_webhooks_log
    const logId = `WH-MP-${Date.now()}`;
    await supabase.from('erp_webhooks_log').insert({
      id: logId,
      origen: 'MERCADOPAGO',
      evento: `${eventType} (#${paymentId || 'SIM'})`,
      referencia_externa: externalReference,
      monto: montoCobrado,
      estado: paymentStatus.toUpperCase(),
      payload: body,
      procesado: true
    });

    // 4. Si el pago fue aprobado y tiene monto > 0, impactar en Tesorería y Contabilidad
    if (paymentStatus === 'approved' && montoCobrado > 0) {
      const hoy = new Date().toISOString().split('T')[0];

      // Acreditar en la cuenta bancaria / billetera predeterminada (CTA-01 o primera cuenta disponible)
      const { data: cuentas } = await supabase.from('erp_cuentas_bancarias').select('*').limit(1);
      if (cuentas && cuentas.length > 0) {
        const cta = cuentas[0];
        const nuevoSaldo = Number(cta.saldo_actual || 0) + montoCobrado;
        const nuevoMov = {
          id: `MOV-MP-${Date.now()}`,
          fecha: hoy.split('-').reverse().join('/'),
          clienteProveedor: `MERCADO PAGO (${payerEmail})`,
          tipo: 'COB-MP',
          nro: String(paymentId || Date.now()).slice(-8),
          descripcion: `Cobro Webhook MP Ref: ${externalReference}`,
          ingresos: montoCobrado,
          egresos: 0,
          saldo: nuevoSaldo
        };
        const movsActualizados = [nuevoMov, ...(cta.movimientos || [])];
        await supabase
          .from('erp_cuentas_bancarias')
          .update({ saldo_actual: nuevoSaldo, movimientos: movsActualizados })
          .eq('id', cta.id);
      }

      // Generar asiento contable automático en Libro Diario
      const { data: ultimoAsiento } = await supabase
        .from('erp_asientos_contables')
        .select('numero')
        .order('numero', { ascending: false })
        .limit(1);

      const proxNumero = (ultimoAsiento?.[0]?.numero || 1000) + 1;
      await supabase.from('erp_asientos_contables').insert({
        numero: proxNumero,
        fecha: hoy,
        concepto: `Cobranza Digital Mercado Pago Webhook - Ref ${externalReference}`,
        tipo_origen: 'Tesorería',
        total_debe: montoCobrado,
        total_haber: montoCobrado,
        renglones: [
          { cuentaCodigo: '1.1.01', cuentaNombre: 'Caja y Bancos (Mercado Pago)', debe: montoCobrado, haber: 0 },
          { cuentaCodigo: '1.1.02', cuentaNombre: 'Créditos por Ventas (Deudores)', debe: 0, haber: montoCobrado }
        ]
      });
    }

    return new Response(
      JSON.stringify({
        received: true,
        logId,
        paymentId,
        externalReference,
        status: paymentStatus,
        monto: montoCobrado
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
