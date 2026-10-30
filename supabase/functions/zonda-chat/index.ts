import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const SYSTEM_PROMPT = `Sos "Zonda" 💼, el asistente IA corporativo de oficina de Grow // ERP (Ecosistema Sanatorio Argentino / ECAR).
Hablás en español argentino (vos, dale, impecable). Sos amable, ejecutivo, preciso y resolutivo.
Tenés acceso en tiempo real a las 14 tablas contables, fiscales y financieras de Supabase PostgreSQL (erp_empresa, erp_clientes, erp_proveedores, erp_comprobantes_venta, erp_comprobantes_compra, erp_cuentas_bancarias, erp_cheques, erp_plan_cuentas, erp_asientos_contables, erp_inventario, erp_empleados, erp_liquidaciones, erp_integraciones_config, erp_webhooks_log).`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, imageBase64, proveedorNombre = '', messages = [], activeModule = 'tablero' } = body;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (action === 'ocr_factura' && imageBase64 && OPENAI_API_KEY) {
      const visionResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'Extraé los datos de esta factura argentina en JSON exacto con las claves: tipoComprobante ("Factura A"|"Factura B"|"Factura C"), nroComprobante (ej "0001-00012345"), fechaEmision ("YYYY-MM-DD"), fechaVencimiento ("YYYY-MM-DD"), netoGravado (number), iva21 (number), total (number), descripcion (string), cuentaImputacionSugerida ("5.1.01 Materiales e Insumos"|"5.1.02 Combustibles y Lubricantes"|"5.1.03 Materiales de Red PEAD"|"5.2.01 Servicios Públicos y Energía"|"5.2.02 Alquiler de Maquinaria y Equipos"|"5.2.03 Honorarios y Servicios Técnicos"), centroCostoSugerido ("CC-100 · Obra Acueducto Gran Tulum - Tramo II"), medioPagoSugerido ("Transferencia Bancaria Santander"), confianza (99).'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Proveedor: ${proveedorNombre}. Extraé todos los importes y datos de la factura.` },
                { type: 'image_url', image_url: { url: imageBase64 } }
              ]
            }
          ]
        })
      });

      if (visionResp.ok) {
        const vData = await visionResp.json();
        const rawJson = vData.choices?.[0]?.message?.content;
        if (rawJson) {
          const facturaExtraida = JSON.parse(rawJson);
          return new Response(JSON.stringify({ facturaExtraida }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    if (OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `${SYSTEM_PROMPT}\nMódulo activo: ${activeModule}` },
            ...messages
          ],
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || '';
        if (reply) {
          return new Response(JSON.stringify({ reply, provider: 'openai' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Motor directo contra Supabase PostgreSQL cuando no se requiere API externa
    const [fv, fc, cb, chq] = await Promise.all([
      supabase.from('erp_comprobantes_venta').select('total'),
      supabase.from('erp_comprobantes_compra').select('total'),
      supabase.from('erp_cuentas_bancarias').select('saldo_actual'),
      supabase.from('erp_cheques').select('importe, estado')
    ]);

    const totalVentas = (fv.data || []).reduce((s: number, r: any) => s + Number(r.total || 0), 0);
    const totalCompras = (fc.data || []).reduce((s: number, r: any) => s + Number(r.total || 0), 0);
    const totalBancos = (cb.data || []).reduce((s: number, r: any) => s + Number(r.saldo_actual || 0), 0);
    const totalCheques = (chq.data || [])
      .filter((c: any) => c.estado === 'En Cartera')
      .reduce((s: number, r: any) => s + Number(r.importe || 0), 0);

    return new Response(
      JSON.stringify({
        reply: `📊 **Estado Consolidado en Supabase PostgreSQL:**\n• Ventas AFIP: $${totalVentas.toLocaleString('es-AR')}\n• Compras: $${totalCompras.toLocaleString('es-AR')}\n• Saldos Bancarios: $${totalBancos.toLocaleString('es-AR')}\n• Cheques en Cartera: $${totalCheques.toLocaleString('es-AR')}`,
        provider: 'supabase-native'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error en zonda-chat' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
