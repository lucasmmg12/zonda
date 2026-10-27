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
  Building2,
  ArrowRight
} from 'lucide-react';
import {
  getAfipConfig,
  saveAfipConfig,
  probarConexionAfip,
  generarInstruccionesOpenSsl,
  AFIP_ENDPOINTS
} from '../../services/afip/afipWsClient';
import {
  getMercadoPagoConfig,
  saveMercadoPagoConfig,
  probarConexionMercadoPago,
  crearPreferenciaMercadoPago,
  generarQrCobroMercadoPago
} from '../../services/mercadopago/mercadoPagoClient';
import { AfipWsConfig, MercadoPagoConfig } from '../../types/models';

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
  const [tab, setTab] = useState<'afip' | 'mercadopago'>(defaultTab);

  // Estados AFIP
  const [afipConfig, setAfipConfigState] = useState<AfipWsConfig>(getAfipConfig());
  const [afipCrtTexto, setAfipCrtTexto] = useState(afipConfig.certificadoCrt);
  const [afipKeyTexto, setAfipKeyTexto] = useState(afipConfig.clavePrivadaKey);
  const [probandoAfip, setProbandoAfip] = useState(false);
  const [resultadoAfip, setResultadoAfip] = useState<{ success: boolean; mensaje: string } | null>(null);
  const [verOpenSsl, setVerOpenSsl] = useState(false);
  const [copiadoComando, setCopiadoComando] = useState(false);

  // Estados Mercado Pago
  const [mpConfig, setMpConfigState] = useState<MercadoPagoConfig>(getMercadoPagoConfig());
  const [mpAccessToken, setMpAccessToken] = useState(mpConfig.accessToken);
  const [mpPublicKey, setMpPublicKey] = useState(mpConfig.publicKey);
  const [mpWebhookSecret, setMpWebhookSecret] = useState(mpConfig.webhookSecret || '');
  const [probandoMp, setProbandoMp] = useState(false);
  const [resultadoMp, setResultadoMp] = useState<{ success: boolean; mensaje: string } | null>(null);

  // Simulador de cobro de prueba MP
  const [qrPrueba, setQrPrueba] = useState<{ payload: string; link: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAfipConfigState(getAfipConfig());
      setMpConfigState(getMercadoPagoConfig());
      setResultadoAfip(null);
      setResultadoMp(null);
      setTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const cuitLimpio = afipConfig.cuit.replace(/[^0-9]/g, '') || '30718759087';
  const openSslData = generarInstruccionesOpenSsl(cuitLimpio, 'SANATORIO ARGENTINO / ECAR SAS');

  // Guardar y Probar AFIP
  const handleGuardarYProbarAfip = async (e: React.FormEvent) => {
    e.preventDefault();
    setProbandoAfip(true);
    setResultadoAfip(null);

    const nuevaConfig: AfipWsConfig = {
      ...afipConfig,
      certificadoCrt: afipCrtTexto,
      clavePrivadaKey: afipKeyTexto,
      estadoConexion: afipCrtTexto && afipKeyTexto ? 'pendiente_certificados' : 'desconectado'
    };

    saveAfipConfig(nuevaConfig);
    setAfipConfigState(nuevaConfig);

    const res = await probarConexionAfip(nuevaConfig);
    setResultadoAfip(res);
    setAfipConfigState(getAfipConfig());
    setProbandoAfip(false);
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

  // Guardar y Probar Mercado Pago
  const handleGuardarYProbarMp = async (e: React.FormEvent) => {
    e.preventDefault();
    setProbandoMp(true);
    setResultadoMp(null);

    const nuevaConfig: MercadoPagoConfig = {
      ...mpConfig,
      accessToken: mpAccessToken,
      publicKey: mpPublicKey,
      webhookSecret: mpWebhookSecret
    };

    saveMercadoPagoConfig(nuevaConfig);
    setMpConfigState(nuevaConfig);

    const res = await probarConexionMercadoPago(mpAccessToken, mpConfig.modo);
    setResultadoMp(res);
    setMpConfigState(getMercadoPagoConfig());
    setProbandoMp(false);
  };

  const handleGenerarCobroPrueba = async () => {
    const resPref = await crearPreferenciaMercadoPago({
      titulo: 'Cobro de Prueba - Terminal Zonda ERP',
      monto: 15000,
      comprobanteNumero: 'TEST-0001'
    });
    const resQr = generarQrCobroMercadoPago({
      monto: 15000,
      referencia: 'PRUEBA_' + Date.now(),
      concepto: 'Prueba de Pasarela Zonda ERP'
    });

    setQrPrueba({
      payload: resQr.payload,
      link: mpConfig.modo === 'sandbox' ? resPref.sandboxInitPoint : resPref.initPoint
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
      <div className="bg-white border-2 border-slate-900 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Centro de Conexiones Oficiales & Web Services
              </h2>
              <p className="text-[11px] text-slate-400">
                AFIP (Facturación Electrónica WSAA / WSFE) & Mercado Pago (Pasarela de Cobros)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 pt-2 flex items-center gap-2">
          <button
            onClick={() => setTab('afip')}
            className={`px-4 py-2 text-xs font-bold transition-all border-t-2 flex items-center gap-2 ${
              tab === 'afip'
                ? 'bg-white border-t-blue-700 text-slate-900 border-x border-slate-300 -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 border-t-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                afipConfig.estadoConexion === 'conectado' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
            <span>AFIP Web Services (WSAA / WSFE v1)</span>
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
            <span>Mercado Pago API (Checkout Pro & QR)</span>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: AFIP */}
          {tab === 'afip' && (
            <div className="space-y-6">
              {/* Estado actual de conexión */}
              <div
                className={`p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
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
                      Estado del Servicio:{' '}
                      {afipConfig.estadoConexion === 'conectado'
                        ? `CONECTADO (${afipConfig.ambiente.toUpperCase()})`
                        : 'DESCONECTADO / PENDIENTE DE CERTIFICADOS'}
                    </h4>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {afipConfig.ultimoMensaje ||
                        'Para emitir comprobantes con CAE legal se requiere cargar el Certificado Digital y la Clave Privada.'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold block opacity-75">Ambiente Seleccionado:</span>
                  <span className="text-xs font-extrabold uppercase px-2 py-0.5 bg-white border border-current">
                    {afipConfig.ambiente}
                  </span>
                </div>
              </div>

              {/* Formulario de Configuración AFIP */}
              <form onSubmit={handleGuardarYProbarAfip} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Entorno de AFIP:
                    </label>
                    <select
                      value={afipConfig.ambiente}
                      onChange={(e) =>
                        setAfipConfigState({ ...afipConfig, ambiente: e.target.value as any })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-blue-700"
                    >
                      <option value="homologacion">Homologación (Testing / Pruebas)</option>
                      <option value="produccion">Producción (Servidores Reales AFIP)</option>
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
                      className="w-full px-3 py-1.5 border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-700"
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
                      className="w-full px-3 py-1.5 border border-slate-300 text-xs font-semibold focus:outline-none focus:border-blue-700"
                    />
                  </div>
                </div>

                {/* Certificado Digital y Clave Privada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* CRT */}
                  <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-blue-700" />
                        <span>Certificado Digital X.509 (.crt / .pem)</span>
                      </label>
                      <label className="text-[11px] text-blue-700 font-bold hover:underline cursor-pointer">
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
                      rows={5}
                      value={afipCrtTexto}
                      onChange={(e) => setAfipCrtTexto(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----\nMIIFpzCCBI+gAwIBAgIQDJy6vN...\n-----END CERTIFICATE-----"
                      className="w-full p-2 bg-white border border-slate-300 text-[10px] font-mono focus:outline-none focus:border-blue-700 leading-tight"
                    />
                    <p className="text-[10px] text-slate-500">
                      Emitido por la Autoridad Certificante de AFIP luego de subir el CSR.
                    </p>
                  </div>

                  {/* KEY */}
                  <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-700" />
                        <span>Clave Privada RSA (.key)</span>
                      </label>
                      <label className="text-[11px] text-blue-700 font-bold hover:underline cursor-pointer">
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
                      rows={5}
                      value={afipKeyTexto}
                      onChange={(e) => setAfipKeyTexto(e.target.value)}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA2yK...\n-----END RSA PRIVATE KEY-----"
                      className="w-full p-2 bg-white border border-slate-300 text-[10px] font-mono focus:outline-none focus:border-blue-700 leading-tight"
                    />
                    <p className="text-[10px] text-slate-500">
                      Generada localmente con OpenSSL (2048 bits). No compartir públicamente.
                    </p>
                  </div>
                </div>

                {/* Feedback de Test */}
                {resultadoAfip && (
                  <div
                    className={`p-3 border text-xs font-medium flex items-center gap-2 ${
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

                {/* Botonera de Acciones AFIP */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setVerOpenSsl(!verOpenSsl)}
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>{verOpenSsl ? 'Ocultar guía OpenSSL' : '¿Cómo generar la Clave y el CSR para AFIP?'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={probandoAfip}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {probandoAfip ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>
                        {probandoAfip ? 'Autenticando con WSAA...' : 'Guardar y Probar Conexión AFIP'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Asistente Desplegable OpenSSL */}
              {verOpenSsl && (
                <div className="border border-slate-300 p-4 bg-slate-900 text-slate-200 text-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> Comandos oficiales OpenSSL para AFIP
                    </span>
                    <button
                      onClick={handleCopiarOpenSsl}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1 border border-slate-600"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiadoComando ? '¡Copiado!' : 'Copiar Comandos'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 font-mono text-[11px] bg-slate-950 p-3 border border-slate-800 text-emerald-400">
                    <p className="text-slate-400"># 1. Generar Clave Privada (2048 bits):</p>
                    <p className="select-all">{openSslData.comandoClave}</p>
                    <p className="text-slate-400 mt-2"># 2. Generar Solicitud de Certificado (CSR):</p>
                    <p className="select-all">{openSslData.comandoCsr}</p>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <p className="font-bold text-white uppercase text-[10px] tracking-wider">
                      Pasos en la web de AFIP con Clave Fiscal:
                    </p>
                    {openSslData.pasosTutorial.map((p) => (
                      <div key={p.paso} className="flex gap-2">
                        <span className="font-bold text-cyan-400 shrink-0">{p.paso}.</span>
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
            <div className="space-y-6">
              {/* Estado actual de conexión */}
              <div
                className={`p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
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
                        : 'DESCONECTADO / PENDIENTE DE TOKEN'}
                    </h4>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {mpConfig.ultimoMensaje ||
                        'Vincula tus credenciales de Mercado Pago Developers para emitir botones de pago y QR en facturas.'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold block opacity-75">Modo de Operación:</span>
                  <span className="text-xs font-extrabold uppercase px-2 py-0.5 bg-white border border-current">
                    {mpConfig.modo}
                  </span>
                </div>
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
                      className="w-full px-3 py-1.5 border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-[#009ee3]"
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
                      className="w-full px-3 py-1.5 border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#009ee3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Access Token (Token Privado de Producción / Sandbox):
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
                    className="w-full px-3 py-1.5 border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#009ee3]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Obtenido desde{' '}
                    <a
                      href="https://www.mercadopago.com.ar/developers/panel/app"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#009ee3] font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      Panel de Desarrolladores de Mercado Pago <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Webhook Secret / Firma de Notificaciones IPN (Opcional):
                  </label>
                  <input
                    type="password"
                    value={mpWebhookSecret}
                    onChange={(e) => setMpWebhookSecret(e.target.value)}
                    placeholder="Firma secreta para conciliación automática en Tesorería"
                    className="w-full px-3 py-1.5 border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#009ee3]"
                  />
                </div>

                {/* Feedback de Test MP */}
                {resultadoMp && (
                  <div
                    className={`p-3 border text-xs font-medium flex items-center gap-2 ${
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
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleGenerarCobroPrueba}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-[#009ee3]" />
                    <span>Generar Cobro de Prueba (QR y Link)</span>
                  </button>

                  <button
                    type="submit"
                    disabled={probandoMp}
                    className="px-4 py-2 bg-[#009ee3] hover:bg-[#007eb5] text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {probandoMp ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      {probandoMp ? 'Validando con Mercado Pago...' : 'Guardar y Verificar Credenciales'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Visor de Cobro de Prueba */}
              {qrPrueba && (
                <div className="border-2 border-[#009ee3] p-4 bg-sky-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#009ee3]" />
                      <span>Cobro de Prueba Generado con Éxito ($15.000,00)</span>
                    </h5>
                    <button
                      onClick={() => setQrPrueba(null)}
                      className="text-slate-400 hover:text-slate-700 text-xs"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-white p-4 border border-slate-200">
                    <div className="flex flex-col items-center justify-center p-3 border border-slate-200 bg-slate-50">
                      <div className="w-40 h-40 bg-slate-900 flex flex-col items-center justify-center text-white p-2 text-center">
                        <QrCode className="w-24 h-24 text-white" />
                        <span className="text-[9px] font-mono text-cyan-400 uppercase mt-1 tracking-wider">
                          QR INTEROPERABLE MP
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-2 font-medium">
                        Escanear con Mercado Pago o cualquier billetera
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Checkout Pro (Link de Pago):</span>
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

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(qrPrueba.link);
                            alert('Link de cobro copiado al portapapeles.');
                          }}
                          className="px-3 py-1.5 bg-[#009ee3] hover:bg-[#007eb5] text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link de Pago</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="bg-slate-50 border-t border-slate-300 px-5 py-3 flex items-center justify-between text-xs text-slate-600">
          <span>
            Zonda Engine // Modo Seguro: Las claves se guardan cifradas localmente en su terminal.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
