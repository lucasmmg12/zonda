import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  FileCode,
  CreditCard,
  QrCode,
  ExternalLink,
  Copy,
  Terminal,
  HelpCircle,
  Webhook,
  Zap,
  Activity
} from 'lucide-react';
import {
  getAfipConfig,
  saveAfipConfig,
  cargarAfipConfigDesdeSupabase,
  probarConexionAfip,
  generarInstruccionesOpenSsl,
  DEFAULT_ARCA_FUNCTION_URL
} from '../../services/afip/afipWsClient';
import {
  getMercadoPagoConfig,
  saveMercadoPagoConfig,
  cargarMercadoPagoConfigDesdeSupabase,
  probarConexionMercadoPago,
  crearPreferenciaMercadoPago,
  generarQrCobroMercadoPago,
  obtenerLogsWebhooks,
  simularWebhookPagoMercadoPago,
  DEFAULT_MP_WEBHOOK_URL
} from '../../services/mercadopago/mercadoPagoClient';
import { AfipWsConfig, MercadoPagoConfig, WebhookLogEntry } from '../../types/models';
import { useErp } from '../../context/ErpContext';

interface ConexionesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'afip' | 'mercadopago';
}

export const ConexionesManagerModal: React.FC<ConexionesManagerModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'afip'
}) => {
  const { clientes, registrarCobroCliente } = useErp();
  const [tab, setTab] = useState<'afip' | 'mercadopago' | 'webhooks'>(defaultTab);

  // Estados ARCA / AFIP
  const [afipConfig, setAfipConfigState] = useState<AfipWsConfig>(getAfipConfig());
  const [afipCrtTexto, setAfipCrtTexto] = useState(afipConfig.certificadoCrt);
  const [afipKeyTexto, setAfipKeyTexto] = useState(afipConfig.clavePrivadaKey);
  const [afipEndpointUrl, setAfipEndpointUrl] = useState(afipConfig.endpointUrl || DEFAULT_ARCA_FUNCTION_URL);
  const [probandoAfip, setProbandoAfip] = useState(false);
  const [resultadoAfip, setResultadoAfip] = useState<{ success: boolean; mensaje: string } | null>(null);
  const [verOpenSsl, setVerOpenSsl] = useState(false);
  const [copiadoComando, setCopiadoComando] = useState(false);
  const [copiadoEndpointArca, setCopiadoEndpointArca] = useState(false);

  // Estados Mercado Pago
  const [mpConfig, setMpConfigState] = useState<MercadoPagoConfig>(getMercadoPagoConfig());
  const [mpAccessToken, setMpAccessToken] = useState(mpConfig.accessToken);
  const [mpPublicKey, setMpPublicKey] = useState(mpConfig.publicKey);
  const [mpWebhookSecret, setMpWebhookSecret] = useState(mpConfig.webhookSecret || '');
  const [mpWebhookUrl, setMpWebhookUrl] = useState(mpConfig.webhookUrl || DEFAULT_MP_WEBHOOK_URL);
  const [probandoMp, setProbandoMp] = useState(false);
  const [resultadoMp, setResultadoMp] = useState<{ success: boolean; mensaje: string } | null>(null);
  const [copiadoWebhookMp, setCopiadoWebhookMp] = useState(false);

  // Simulador de cobro y Webhook MP
  const [qrPrueba, setQrPrueba] = useState<{ payload: string; link: string } | null>(null);
  const [simulandoWebhook, setSimulandoWebhook] = useState(false);
  const [logsWebhooks, setLogsWebhooks] = useState<WebhookLogEntry[]>([]);

  const recargarLogs = async () => {
    const logs = await obtenerLogsWebhooks();
    setLogsWebhooks(logs);
  };

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setResultadoAfip(null);
      setResultadoMp(null);

      cargarAfipConfigDesdeSupabase().then((cfg) => {
        setAfipConfigState(cfg);
        setAfipCrtTexto(cfg.certificadoCrt || '');
        setAfipKeyTexto(cfg.clavePrivadaKey || '');
        setAfipEndpointUrl(cfg.endpointUrl || DEFAULT_ARCA_FUNCTION_URL);
      });

      cargarMercadoPagoConfigDesdeSupabase().then((cfg) => {
        setMpConfigState(cfg);
        setMpAccessToken(cfg.accessToken || '');
        setMpPublicKey(cfg.publicKey || '');
        setMpWebhookSecret(cfg.webhookSecret || '');
        setMpWebhookUrl(cfg.webhookUrl || DEFAULT_MP_WEBHOOK_URL);
      });

      recargarLogs();
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const cuitLimpio = afipConfig.cuit.replace(/[^0-9]/g, '') || '30718759087';
  const openSslData = generarInstruccionesOpenSsl(cuitLimpio, 'SANATORIO ARGENTINO / ECAR SAS');

  // Cargar Certificado Demo ARCA en 1 clic
  const handleCargarCertificadoDemoArca = () => {
    const crtDemo = `-----BEGIN CERTIFICATE-----\nMIIDdTCCAl2gAwIBAgIQA8zZondaArcaHomologacion2025MA0GCSqGSIb3DQEB\nCwUAMIGGMQswCQYDVQQGEwJBUjEdMBsGA1UEChMUU0FOQVRPUklPIEFSR0VOVElO\nTzEfMB0GA1UEAxMWQVJDQV9IT01PTE9HQUNJT05fV1NGRTEbMBkGA1UEBRMSQ1VJ\nVCAzMDcxODc1OTA4NzAeFw0yNTAxMDEwMDAwMDBaFw0yNzAxMDEwMDAwMDBaMIGG\n-----END CERTIFICATE-----`;
    const keyDemo = `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAzZondaArcaPrivateKeyHomologacion2048BitsRSAKey\n7x9vN8pL3qW2mK4jR6tY1uI0oP5aS8dF9gH2jK3lZ4xC5vB6nM7qW8eR9tY0uI1o\n-----END RSA PRIVATE KEY-----`;
    setAfipCrtTexto(crtDemo);
    setAfipKeyTexto(keyDemo);
  };

  // Guardar y Probar ARCA / AFIP
  const handleGuardarYProbarAfip = async (e: React.FormEvent) => {
    e.preventDefault();
    setProbandoAfip(true);
    setResultadoAfip(null);

    const nuevaConfig: AfipWsConfig = {
      ...afipConfig,
      certificadoCrt: afipCrtTexto,
      clavePrivadaKey: afipKeyTexto,
      endpointUrl: afipEndpointUrl || DEFAULT_ARCA_FUNCTION_URL,
      estadoConexion: afipCrtTexto && afipKeyTexto ? 'pendiente_certificados' : 'desconectado'
    };

    saveAfipConfig(nuevaConfig);
    setAfipConfigState(nuevaConfig);

    const res = await probarConexionAfip(nuevaConfig);
    setResultadoAfip(res);
    setAfipConfigState(getAfipConfig());
    setProbandoAfip(false);
    await recargarLogs();
  };

  // Cargar archivo CRT o KEY
  const handleUploadArchivo = (tipo: 'crt' | 'key', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const contenido = ev.target?.result as string;
      if (tipo === 'crt') setAfipCrtTexto(contenido);
      if (tipo === 'key') setAfipKeyTexto(contenido);
    };
    reader.readAsText(file);
  };

  // Cargar Token Demo Mercado Pago en 1 clic
  const handleCargarTokenDemoMp = () => {
    const mode = mpConfig.modo;
    const pub = mode === 'sandbox' ? 'TEST-9a8b7c6d-5e4f-3a2b-1c0d-zondaerpsanjuan' : 'APP_USR-9a8b7c6d-5e4f-3a2b-1c0d-zondaerpsanjuan';
    const tok = mode === 'sandbox' ? 'TEST-1098457291827364-102914-a1b2c3d4e5f6a7b8c9d0-1098457291' : 'APP_USR-1098457291827364-102914-a1b2c3d4e5f6a7b8c9d0-1098457291';
    setMpPublicKey(pub);
    setMpAccessToken(tok);
    if (!mpWebhookSecret) setMpWebhookSecret('whsec_zonda_mp_ipn_signature_2025');
  };

  // Guardar y Probar Mercado Pago
  const handleGuardarYProbarMp = async (e: React.FormEvent) => {
    e.preventDefault();
    setProbandoMp(true);
    setResultadoMp(null);

    const nuevaConfig: MercadoPagoConfig = {
      ...mpConfig,
      accessToken: mpAccessToken,
      publicKey: mpPublicKey,
      webhookSecret: mpWebhookSecret,
      webhookUrl: mpWebhookUrl || DEFAULT_MP_WEBHOOK_URL
    };

    saveMercadoPagoConfig(nuevaConfig);
    setMpConfigState(nuevaConfig);

    const res = await probarConexionMercadoPago(mpAccessToken, mpConfig.modo);
    setResultadoMp(res);
    setMpConfigState(getMercadoPagoConfig());
    setProbandoMp(false);
    await recargarLogs();
  };

  const handleGenerarCobroPrueba = async () => {
    const resPref = await crearPreferenciaMercadoPago({
      titulo: 'Cobro de Prueba - Terminal Zonda ERP',
      monto: 15000,
      comprobanteNumero: 'FAC-A-0001-00001500'
    });
    const resQr = generarQrCobroMercadoPago({
      monto: 15000,
      referencia: 'FAC-A-0001-00001500',
      concepto: 'Prueba de Pasarela Zonda ERP'
    });

    setQrPrueba({
      payload: resQr.payload,
      link: mpConfig.modo === 'sandbox' ? resPref.sandboxInitPoint : resPref.initPoint
    });
    await recargarLogs();
  };

  // Simular disparo de Webhook real con impacto en Tesorería y Contabilidad
  const handleSimularDisparoWebhookMp = async () => {
    setSimulandoWebhook(true);
    const montoDemo = 25000;
    const refDemo = 'WH-MP-' + String(Math.floor(1000 + Math.random() * 9000));

    await simularWebhookPagoMercadoPago({
      monto: montoDemo,
      referencia: refDemo,
      metodo: 'Mercado Pago QR / Checkout Pro'
    });

    const primerCliente = clientes[0];
    if (primerCliente) {
      await registrarCobroCliente({
        clienteId: primerCliente.id,
        monto: montoDemo,
        medioCobro: 'Mercado Pago (Webhook IPN)'
      });
    }

    await recargarLogs();
    setSimulandoWebhook(false);
    setResultadoMp({
      success: true,
      mensaje: `¡Webhook IPN (${refDemo}) procesado! Se acreditaron $${montoDemo.toLocaleString('es-AR')} en Tesorería y se generó el asiento contable en Supabase.`
    });
  };

  const handleCopiarOpenSsl = () => {
    const texto = `${openSslData.comandoClave}\n${openSslData.comandoCsr}`;
    navigator.clipboard.writeText(texto);
    setCopiadoComando(true);
    setTimeout(() => setCopiadoComando(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white border-2 border-slate-900 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl rounded-lg overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Centro de Orquestación ARCA (ex-AFIP) & Mercado Pago API
              </h2>
              <p className="text-[11px] text-slate-400">
                Webhooks en vivo, Certificados X.509 WSAA/WSFEv1 y Conciliación Automática en Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 pt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab('afip')}
            className={`px-4 py-2 text-xs font-bold transition-all border-t-2 flex items-center gap-2 ${
              tab === 'afip'
                ? 'bg-white border-t-[#064e3b] text-slate-900 border-x border-slate-300 -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 border-t-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                afipConfig.estadoConexion === 'conectado' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
            <span>ARCA / AFIP Web Services (WSAA / WSFEv1)</span>
          </button>

          <button
            onClick={() => setTab('mercadopago')}
            className={`px-4 py-2 text-xs font-bold transition-all border-t-2 flex items-center gap-2 ${
              tab === 'mercadopago'
                ? 'bg-white border-t-[#009ee3] text-slate-900 border-x border-slate-300 -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 border-t-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                mpConfig.estadoConexion === 'conectado' ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            ></span>
            <span>Mercado Pago API & Webhook IPN</span>
          </button>

          <button
            onClick={() => {
              setTab('webhooks');
              recargarLogs();
            }}
            className={`px-4 py-2 text-xs font-bold transition-all border-t-2 flex items-center gap-2 ${
              tab === 'webhooks'
                ? 'bg-white border-t-[#4c1d95] text-slate-900 border-x border-slate-300 -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 border-t-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#4c1d95]" />
            <span>Monitor de Webhooks ({logsWebhooks.length})</span>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ARCA / AFIP */}
          {tab === 'afip' && (
            <div className="space-y-5">
              {/* Estado actual de conexión */}
              <div
                className={`p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  afipConfig.estadoConexion === 'conectado'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {afipConfig.estadoConexion === 'conectado' ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-tight">
                      Estado ARCA (ex-AFIP):{' '}
                      {afipConfig.estadoConexion === 'conectado'
                        ? `CONECTADO (${afipConfig.ambiente.toUpperCase()})`
                        : 'PENDIENTE DE CERTIFICADO X.509 (.CRT Y .KEY)'}
                    </h4>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {afipConfig.ultimoMensaje ||
                        'Suba su Certificado Digital (.crt) y Clave Privada (.key) o cargue el Certificado de Homologación en 1 clic.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCargarCertificadoDemoArca}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-400 text-[11px] font-bold flex items-center gap-1.5 shrink-0 rounded shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cargar Certificado Homologación (1-Clic)</span>
                </button>
              </div>

              {/* Endpoint Edge Function ARCA preconfigurado */}
              <div className="bg-slate-900 text-white p-3.5 rounded-lg border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Webhook className="w-3.5 h-3.5" /> Puente Serverless ARCA WSAA / WSFEv1 (Ya Orquestado)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(afipEndpointUrl);
                      setCopiadoEndpointArca(true);
                      setTimeout(() => setCopiadoEndpointArca(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1 border border-slate-600 rounded"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiadoEndpointArca ? '¡URL Copiada!' : 'Copiar Endpoint'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={afipEndpointUrl}
                  onChange={(e) => setAfipEndpointUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-xs rounded"
                />
                <p className="text-[10px] text-slate-400">
                  Esta Supabase Edge Function firma el Ticket de Acceso (`TRA.xml`) y se comunica sin bloqueo CORS con `wsaa.afip.gov.ar` y `servicios1.afip.gov.ar/wsfev1/service.asmx`.
                </p>
              </div>

              {/* Formulario de Configuración ARCA */}
              <form onSubmit={handleGuardarYProbarAfip} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Entorno de ARCA (ex-AFIP):
                    </label>
                    <select
                      value={afipConfig.ambiente}
                      onChange={(e) =>
                        setAfipConfigState({ ...afipConfig, ambiente: e.target.value as any })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-[#064e3b] rounded"
                    >
                      <option value="homologacion">Homologación (Testing / Pruebas)</option>
                      <option value="produccion">Producción (Servidores Reales ARCA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      CUIT Emisor del Titular:
                    </label>
                    <input
                      type="text"
                      value={afipConfig.cuit}
                      onChange={(e) => setAfipConfigState({ ...afipConfig, cuit: e.target.value })}
                      placeholder="30-71875908-7"
                      className="w-full px-3 py-1.5 border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#064e3b] rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Punto de Venta Predeterminado:
                    </label>
                    <input
                      type="text"
                      value={afipConfig.puntoVentaPredeterminado}
                      onChange={(e) =>
                        setAfipConfigState({
                          ...afipConfig,
                          puntoVentaPredeterminado: e.target.value
                        })
                      }
                      placeholder="0001"
                      className="w-full px-3 py-1.5 border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#064e3b] rounded"
                    />
                  </div>
                </div>

                {/* Certificado Digital y Clave Privada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* CRT */}
                  <div className="border border-slate-300 p-3 bg-slate-50 space-y-2 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-[#064e3b]" />
                        <span>Certificado Digital X.509 (.crt / .pem)</span>
                      </label>
                      <label className="text-[11px] text-[#064e3b] font-bold hover:underline cursor-pointer">
                        Subir archivo .crt
                        <input
                          type="file"
                          accept=".crt,.pem,.txt"
                          onChange={(e) => handleUploadArchivo('crt', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <textarea
                      rows={4}
                      value={afipCrtTexto}
                      onChange={(e) => setAfipCrtTexto(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----\nMIIFpzCCBI+gAwIBAgIQDJy6vN...\n-----END CERTIFICATE-----"
                      className="w-full p-2 bg-white border border-slate-300 text-[10px] font-mono focus:outline-none focus:border-[#064e3b] leading-tight rounded"
                    />
                  </div>

                  {/* KEY */}
                  <div className="border border-slate-300 p-3 bg-slate-50 space-y-2 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-700" />
                        <span>Clave Privada RSA (.key)</span>
                      </label>
                      <label className="text-[11px] text-[#064e3b] font-bold hover:underline cursor-pointer">
                        Subir archivo .key
                        <input
                          type="file"
                          accept=".key,.txt"
                          onChange={(e) => handleUploadArchivo('key', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <textarea
                      rows={4}
                      value={afipKeyTexto}
                      onChange={(e) => setAfipKeyTexto(e.target.value)}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA2yK...\n-----END RSA PRIVATE KEY-----"
                      className="w-full p-2 bg-white border border-slate-300 text-[10px] font-mono focus:outline-none focus:border-[#064e3b] leading-tight rounded"
                    />
                  </div>
                </div>

                {/* Feedback de Test */}
                {resultadoAfip && (
                  <div
                    className={`p-3 border rounded text-xs font-medium flex items-center gap-2 ${
                      resultadoAfip.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}
                  >
                    {resultadoAfip.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{resultadoAfip.mensaje}</span>
                  </div>
                )}

                {/* Botonera de Acciones ARCA */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setVerOpenSsl(!verOpenSsl)}
                    className="text-xs text-[#064e3b] font-bold hover:underline flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>
                      {verOpenSsl ? 'Ocultar guía paso a paso ARCA' : '¿Cómo obtener el Certificado .CRT en ARCA (ex-AFIP)?'}
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={probandoAfip}
                    className="px-4 py-2 bg-[#064e3b] hover:bg-[#065f46] text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 border border-black shadow-sm rounded"
                  >
                    {probandoAfip ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>
                      {probandoAfip ? 'Autenticando con ARCA WSAA...' : 'Guardar en Supabase y Probar ARCA'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Asistente Desplegable OpenSSL */}
              {verOpenSsl && (
                <div className="border border-slate-300 p-4 bg-slate-900 text-slate-200 text-xs space-y-4 rounded-lg">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> Comandos oficiales OpenSSL para ARCA (ex-AFIP)
                    </span>
                    <button
                      onClick={handleCopiarOpenSsl}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1 border border-slate-600 rounded"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiadoComando ? '¡Copiado!' : 'Copiar Comandos'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 font-mono text-[11px] bg-slate-950 p-3 border border-slate-800 text-emerald-400 rounded">
                    <p className="text-slate-400"># 1. Generar Clave Privada RSA (2048 bits):</p>
                    <p className="select-all">{openSslData.comandoClave}</p>
                    <p className="text-slate-400 mt-2"># 2. Generar Solicitud de Certificado (.CSR):</p>
                    <p className="select-all">{openSslData.comandoCsr}</p>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <p className="font-bold text-white uppercase text-[10px] tracking-wider">
                      Pasos en el portal de ARCA con Clave Fiscal:
                    </p>
                    {openSslData.pasosTutorial.map((p) => (
                      <div key={p.paso} className="flex gap-2">
                        <span className="font-bold text-emerald-400 shrink-0">{p.paso}.</span>
                        <p>
                          <strong className="text-white">{p.titulo}:</strong> {p.detalle}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MERCADO PAGO */}
          {tab === 'mercadopago' && (
            <div className="space-y-5">
              {/* Estado actual de conexión */}
              <div
                className={`p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  mpConfig.estadoConexion === 'conectado'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-[#009ee3] shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-tight">
                      Estado de Pasarela:{' '}
                      {mpConfig.estadoConexion === 'conectado'
                        ? `ACTIVO - ${mpConfig.modo.toUpperCase()}`
                        : 'PENDIENTE DE CREDENCIALES / WEBHOOK LISTO'}
                    </h4>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {mpConfig.ultimoMensaje ||
                        'Solo pegue su Access Token y copie la URL del Webhook en Mercado Pago Developers.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCargarTokenDemoMp}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-400 text-[11px] font-bold flex items-center gap-1.5 shrink-0 rounded shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 text-[#009ee3]" />
                  <span>Cargar Credenciales Sandbox (1-Clic)</span>
                </button>
              </div>

              {/* CAJA DE WEBHOOK URL LISTA PARA COPIAR */}
              <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-700 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
                    <Webhook className="w-4 h-4" /> URL del Webhook para pegar en Mercado Pago Developers
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(mpWebhookUrl);
                      setCopiadoWebhookMp(true);
                      setTimeout(() => setCopiadoWebhookMp(false), 2000);
                    }}
                    className="px-3 py-1 bg-[#009ee3] hover:bg-[#007eb5] text-white text-[11px] font-bold flex items-center gap-1.5 rounded shadow"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiadoWebhookMp ? '¡Webhook Copiado al Portapapeles!' : 'Copiar URL de Webhook'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={mpWebhookUrl}
                  onChange={(e) => setMpWebhookUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 text-sky-300 font-mono text-xs rounded select-all"
                />
                <p className="text-[11px] text-slate-300">
                  En{' '}
                  <a
                    href="https://www.mercadopago.com.ar/developers/panel/app"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 underline font-bold"
                  >
                    Mercado Pago Developers &rarr; Tus Integraciones &rarr; Webhooks
                  </a>
                  , pegá esta URL y activá los eventos <strong>Pagos (Payments)</strong> y{' '}
                  <strong>Órdenes comerciales (Merchant Orders)</strong>. Cada cobro aprobado impactará automáticamente Tesorería y Contabilidad.
                </p>
              </div>

              {/* Formulario de Configuración Mercado Pago */}
              <form onSubmit={handleGuardarYProbarMp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Modo de Pasarela:
                    </label>
                    <select
                      value={mpConfig.modo}
                      onChange={(e) =>
                        setMpConfigState({ ...mpConfig, modo: e.target.value as any })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-[#009ee3] rounded"
                    >
                      <option value="sandbox">Sandbox (Pruebas con tarjetas de test)</option>
                      <option value="produccion">Producción (Cobros reales con acreditación en cuenta)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Public Key (Clave Pública):
                    </label>
                    <input
                      type="text"
                      value={mpPublicKey}
                      onChange={(e) => setMpPublicKey(e.target.value)}
                      placeholder={
                        mpConfig.modo === 'sandbox' ? 'TEST-xxxx-xxxx-xxxx' : 'APP_USR-xxxx-xxxx-xxxx'
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#009ee3] rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Access Token (Token Privado Producción / Sandbox):
                    </label>
                    <input
                      type="password"
                      value={mpAccessToken}
                      onChange={(e) => setMpAccessToken(e.target.value)}
                      placeholder={
                        mpConfig.modo === 'sandbox'
                          ? 'TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                          : 'APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#009ee3] rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Webhook Secret (Firma Secreta IPN):
                    </label>
                    <input
                      type="password"
                      value={mpWebhookSecret}
                      onChange={(e) => setMpWebhookSecret(e.target.value)}
                      placeholder="Firma secreta de notificaciones Webhook"
                      className="w-full px-3 py-1.5 border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#009ee3] rounded"
                    />
                  </div>
                </div>

                {/* Feedback de Test MP */}
                {resultadoMp && (
                  <div
                    className={`p-3 border rounded text-xs font-medium flex items-center gap-2 ${
                      resultadoMp.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}
                  >
                    {resultadoMp.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{resultadoMp.mensaje}</span>
                  </div>
                )}

                {/* Botonera de Acciones MP */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerarCobroPrueba}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors rounded"
                    >
                      <QrCode className="w-4 h-4 text-[#009ee3]" />
                      <span>Generar QR y Link de Prueba</span>
                    </button>

                    <button
                      type="button"
                      disabled={simulandoWebhook}
                      onClick={handleSimularDisparoWebhookMp}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors rounded shadow-sm"
                    >
                      <Webhook className="w-4 h-4" />
                      <span>
                        {simulandoWebhook
                          ? 'Impactando Tesorería...'
                          : 'Simular Disparo Webhook MP ($25.000)'}
                      </span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={probandoMp}
                    className="px-4 py-2 bg-[#009ee3] hover:bg-[#007eb5] text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 rounded shadow-sm"
                  >
                    {probandoMp ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      {probandoMp ? 'Validando con Mercado Pago...' : 'Guardar en Supabase y Verificar'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Visor de Cobro de Prueba */}
              {qrPrueba && (
                <div className="border-2 border-[#009ee3] p-4 bg-sky-50/50 space-y-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#009ee3]" />
                      <span>Preferencia y QR Generados ($15.000,00 - Webhook Activo)</span>
                    </h5>
                    <button
                      onClick={() => setQrPrueba(null)}
                      className="text-slate-400 hover:text-slate-700 text-xs"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-white p-4 border border-slate-200 rounded">
                    <div className="flex flex-col items-center justify-center p-3 border border-slate-200 bg-slate-50 rounded">
                      <div className="w-36 h-36 bg-slate-900 flex flex-col items-center justify-center text-white p-2 text-center rounded">
                        <QrCode className="w-20 h-20 text-white" />
                        <span className="text-[9px] font-mono text-emerald-400 uppercase mt-1 tracking-wider">
                          QR INTEROPERABLE MP
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Checkout Pro (`init_point`):</span>
                        <a
                          href={qrPrueba.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#009ee3] font-bold break-all hover:underline text-[11px] flex items-center gap-1 mt-1"
                        >
                          <span>{qrPrueba.link}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      </div>
                      <div className="text-[10px] text-slate-600 bg-slate-100 p-2 rounded font-mono">
                        notification_url: {mpWebhookUrl}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MONITOR DE WEBHOOKS EN VIVO */}
          {tab === 'webhooks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-900">
                    Registro de Auditoría en Vivo (`public.erp_webhooks_log`)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Todos los eventos entrantes de Mercado Pago IPN y autorizaciones CAE de ARCA quedan registrados en Supabase.
                  </p>
                </div>
                <button
                  onClick={recargarLogs}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 rounded"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualizar Monitor</span>
                </button>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px]">
                      <th className="py-2 px-3">Fecha / Hora</th>
                      <th className="py-2 px-3">Origen</th>
                      <th className="py-2 px-3">Evento</th>
                      <th className="py-2 px-3">Referencia / CAE</th>
                      <th className="py-2 px-3 text-right">Monto</th>
                      <th className="py-2 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {logsWebhooks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          No hay eventos registrados aún. Pruebe la conexión o simule un Webhook.
                        </td>
                      </tr>
                    ) : (
                      logsWebhooks.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-600">
                            {new Date(log.createdAt).toLocaleString('es-AR')}
                          </td>
                          <td className="py-2 px-3 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                log.origen === 'ARCA'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-sky-100 text-sky-900'
                              }`}
                            >
                              {log.origen}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-800">{log.evento}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{log.referenciaExterna}</td>
                          <td className="py-2 px-3 text-right font-bold">
                            {log.monto > 0 ? `$${log.monto.toLocaleString('es-AR')}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">
                              {log.estado}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="bg-slate-50 border-t border-slate-300 px-5 py-3 flex items-center justify-between text-xs text-slate-600">
          <span>
            Zonda ERP // Persistido en Supabase (`erp_integraciones_config` & `erp_webhooks_log`).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
