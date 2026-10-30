import React, { useState, useEffect } from 'react';
import {
  Calendar,
  AlertCircle,
  Save,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Key,
  Terminal,
  QrCode,
  HelpCircle,
  RefreshCw,
  FileCode,
  Plus,
  X
} from 'lucide-react';
import type { AfipWsConfig, MercadoPagoConfig } from '../../types/models';
import { getAfipConfig, saveAfipConfig, probarConexionAfip, generarInstruccionesOpenSsl, DEFAULT_ARCA_FUNCTION_URL } from '../../services/afip/afipWsClient';
import { getMercadoPagoConfig, saveMercadoPagoConfig, probarConexionMercadoPago, crearPreferenciaMercadoPago, simularWebhookPagoMercadoPago, DEFAULT_MP_WEBHOOK_URL } from '../../services/mercadopago/mercadoPagoClient';
import { ConexionesManagerModal } from '../modals/ConexionesManagerModal';
import { useErp } from '../../context/ErpContext';

export const ConfiguracionModule: React.FC = () => {
  const {
    empresa,
    empresaExtra,
    guardarConfiguracionEmpresa,
    clientes,
    cuentasBancarias,
    registrarCobroCliente,
    dbStatus,
    lastSync,
    refreshAllFromDb
  } = useErp();

  const [modalConexionesOpen, setModalConexionesOpen] = useState(false);
  const [tabModalConexion, setTabModalConexion] = useState<'afip' | 'mercadopago'>('afip');

  const abrirModalConexiones = (targetTab: 'afip' | 'mercadopago') => {
    setTabModalConexion(targetTab);
    setModalConexionesOpen(true);
  };

  // Pestaña activa superior
  const [tabActiva, setTabActiva] = useState<
    'generales' | 'impositivos' | 'clientes_proveedores' | 'talonarios' | 'portal' | 'tesoreria' | 'integraciones' | 'costos'
  >('generales');

  // Integraciones (AFIP & Mercado Pago)
  const [subTabIntegracion, setSubTabIntegracion] = useState<'afip' | 'mercadopago'>('afip');
  const [afipConfig, setAfipConfig] = useState<AfipWsConfig>(getAfipConfig());
  const [afipCrt, setAfipCrt] = useState(afipConfig.certificadoCrt);
  const [afipKey, setAfipKey] = useState(afipConfig.clavePrivadaKey);
  const [probandoAfip, setProbandoAfip] = useState(false);
  const [resultadoAfip, setResultadoAfip] = useState<{ success: boolean; mensaje: string } | null>(null);
  const [verOpenSsl, setVerOpenSsl] = useState(false);
  const [copiadoOpenSsl, setCopiadoOpenSsl] = useState(false);

  const [mpConfig, setMpConfig] = useState<MercadoPagoConfig>(getMercadoPagoConfig());
  const [mpAccessToken, setMpAccessToken] = useState(mpConfig.accessToken);
  const [mpPublicKey, setMpPublicKey] = useState(mpConfig.publicKey);
  const [mpWebhook, setMpWebhook] = useState(mpConfig.webhookSecret || '');
  const [probandoMp, setProbandoMp] = useState(false);
  const [resultadoMp, setResultadoMp] = useState<{ success: boolean; mensaje: string } | null>(null);
  const [qrPrueba, setQrPrueba] = useState<{ link: string } | null>(null);

  // Datos Generales (sincronizados con Supabase via ErpContext)
  const [nombre, setNombre] = useState(empresaExtra.nombre);
  const [razonSocial, setRazonSocial] = useState(empresa.razonSocial);
  const [domicilio, setDomicilio] = useState(empresa.domicilioFiscal);
  const [localidad, setLocalidad] = useState(empresaExtra.localidad);
  const [codPostal, setCodPostal] = useState(empresaExtra.codPostal);
  const [provincia, setProvincia] = useState(empresaExtra.provincia);
  const [pais, setPais] = useState(empresaExtra.pais);
  const [telefono, setTelefono] = useState(empresaExtra.telefono);
  const [email, setEmail] = useState(empresaExtra.email);
  const [cbu, setCbu] = useState(empresaExtra.cbu);
  const [cuit, setCuit] = useState(empresa.cuit);
  const [numeroIibb, setNumeroIibb] = useState(empresa.ingresosBrutos);
  const [convenioMultilateral, setConvenioMultilateral] = useState(empresaExtra.convenioMultilateral);

  // Logo
  const [logoAncho, setLogoAncho] = useState(empresaExtra.logoAncho || '45');
  const [logoAltura, setLogoAltura] = useState(empresaExtra.logoAltura || '20');
  const [logoArchivo, setLogoArchivo] = useState(empresaExtra.logoArchivo || 'logo_ecar_oficial.png');

  // Talonarios dinámicos
  const [talonarios, setTalonarios] = useState([
    { punto: '0001', desc: 'Facturación Electrónica Sede Central San Juan', emision: 'Web Service AFIP (WSFE v1)', hab: 'Facturas A, B, Notas de Crédito/Débito A, B', estado: 'Activo' },
    { punto: '0002', desc: 'Sucursal Rawson', emision: 'Web Service AFIP (WSFE v1)', hab: 'Facturas A, B, Remitos R', estado: 'Activo' },
    { punto: '0003', desc: 'Recibos Móviles de Cobranza en Obra', emision: 'Comprobante de Cobro Interno', hab: 'Recibos Oficiales X', estado: 'Activo' }
  ]);
  const [showNuevoPuntoModal, setShowNuevoPuntoModal] = useState(false);
  const [nuevoPtoNro, setNuevoPtoNro] = useState('0004');
  const [nuevoPtoDesc, setNuevoPtoDesc] = useState('');

  // Centros de Costo dinámicos
  const [centrosCosto, setCentrosCosto] = useState([
    { codigo: 'CC-100', nombre: 'Obra Acueducto Gran Tulum - Tramo II', responsable: 'Ing. Roberto Quiroga', presupuesto: 45000000 },
    { codigo: 'CC-200', nombre: 'Planta Elaboradora de Hormigón Ruta 40', responsable: 'Téc. Lucas Marinero', presupuesto: 28000000 },
    { codigo: 'CC-300', nombre: 'Administración Central y Finanzas', responsable: 'Cra. Valeria Sánchez', presupuesto: 12500000 }
  ]);

  useEffect(() => {
    setNombre(empresaExtra.nombre);
    setRazonSocial(empresa.razonSocial);
    setDomicilio(empresa.domicilioFiscal);
    setLocalidad(empresaExtra.localidad);
    setCodPostal(empresaExtra.codPostal);
    setProvincia(empresaExtra.provincia);
    setPais(empresaExtra.pais);
    setTelefono(empresaExtra.telefono);
    setEmail(empresaExtra.email);
    setCbu(empresaExtra.cbu);
    setCuit(empresa.cuit);
    setNumeroIibb(empresa.ingresosBrutos);
    setConvenioMultilateral(empresaExtra.convenioMultilateral);
  }, [empresa, empresaExtra]);

  // Notificaciones de guardado
  const [notificacion, setNotificacion] = useState<string | null>(null);

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    await guardarConfiguracionEmpresa(
      {
        ...empresa,
        razonSocial,
        cuit,
        domicilioFiscal: domicilio,
        ingresosBrutos: numeroIibb
      },
      {
        nombre,
        localidad,
        codPostal,
        provincia,
        pais,
        telefono,
        email,
        cbu,
        convenioMultilateral,
        logoAncho,
        logoAltura,
        logoArchivo
      }
    );
    setNotificacion('Datos generales de la empresa guardados en Supabase PostgreSQL.');
    setTimeout(() => setNotificacion(null), 3000);
  };

  const handleGuardarLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    await guardarConfiguracionEmpresa(empresa, {
      ...empresaExtra,
      logoAncho,
      logoAltura,
      logoArchivo
    });
    setNotificacion('Parámetros de logotipo corporativo sincronizados en Supabase.');
    setTimeout(() => setNotificacion(null), 3000);
  };

  const handleAgregarPuntoVenta = (e: React.FormEvent) => {
    e.preventDefault();
    setTalonarios([
      ...talonarios,
      {
        punto: nuevoPtoNro,
        desc: nuevoPtoDesc || 'Nuevo Punto de Emisión',
        emision: 'Web Service AFIP (WSFE v1)',
        hab: 'Facturas A, B, C y Notas de Crédito',
        estado: 'Activo'
      }
    ]);
    setShowNuevoPuntoModal(false);
    setNuevoPtoDesc('');
    setNotificacion(`Punto de venta ${nuevoPtoNro} habilitado correctamente.`);
    setTimeout(() => setNotificacion(null), 3000);
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      {/* 1. BARRA SUPERIOR DE ENCABEZADO Y CONEXIONES (Supabase | ARCA | Mercado Pago) */}
      <div className="bg-white border-b border-emerald-800/25 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-extrabold text-[#042f22] tracking-tight uppercase">
            Configuración de la Empresa
          </h1>
          <span className="text-xs text-[#357a59] font-medium hidden md:inline">
            | PARÁMETROS FISCALES, TALONARIOS Y CONEXIONES CLOUD
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Barra Segmentada Unificada contenida en Configuración: Supabase | ARCA | Mercado Pago */}
          <div className="flex items-center h-8 border border-emerald-800/25 bg-emerald-50/30 divide-x divide-emerald-800/20 whitespace-nowrap">
            {/* Supabase */}
            <button
              type="button"
              onClick={refreshAllFromDb}
              title={`Base de Datos Supabase PostgreSQL (Última sincr.: ${lastSync}). Click para refrescar.`}
              className="h-full px-3 flex items-center gap-1.5 text-[11px] font-bold text-[#064e3b] hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              {dbStatus === 'sincronizando' ? (
                <RefreshCw className="w-3 h-3 animate-spin text-[#047857]" />
              ) : (
                <span className="w-2 h-2 bg-[#16a34a] inline-block"></span>
              )}
              <span>Supabase</span>
            </button>

            {/* ARCA */}
            <button
              type="button"
              onClick={() => abrirModalConexiones('afip')}
              title="Configurar o verificar Web Services de ARCA (ex-AFIP)"
              className="h-full px-3 flex items-center gap-1.5 text-[11px] font-bold text-[#064e3b] hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              <span
                className={`w-2 h-2 inline-block ${
                  afipConfig.estadoConexion === 'conectado' ? 'bg-[#16a34a]' : 'bg-emerald-600/50'
                }`}
              ></span>
              <span>ARCA</span>
            </button>

            {/* Mercado Pago */}
            <button
              type="button"
              onClick={() => abrirModalConexiones('mercadopago')}
              title="Configurar o verificar pasarela Mercado Pago (Checkout Pro y QR)"
              className="h-full px-3 flex items-center gap-1.5 text-[11px] font-bold text-[#064e3b] hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              <CreditCard className="w-3 h-3 text-[#047857]" />
              <span>Mercado Pago</span>
            </button>
          </div>

          <button
            onClick={() => setNotificacion('Calendario impositivo sincronizado: IVA 18/11, IIBB San Juan 20/11, F.931 12/11.')}
            className="h-8 px-3.5 bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#064e3b]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario de vencimientos</span>
          </button>
        </div>
      </div>

      {/* 2. PESTAÑAS PRINCIPALES DEL MÓDULO */}
      <div className="bg-[#ecfdf5]/40 border-b border-slate-300 px-2 pt-1 flex flex-wrap items-center gap-1">
        {[
          { key: 'generales', label: 'Datos generales' },
          { key: 'impositivos', label: 'Datos Impositivos' },
          { key: 'clientes_proveedores', label: 'Clientes/Proveedores' },
          { key: 'talonarios', label: 'Talonarios' },
          { key: 'integraciones', label: 'Integraciones AFIP & Mercado Pago' },
          { key: 'portal', label: 'Portal Clientes' },
          { key: 'tesoreria', label: 'Tesorería' },
          { key: 'costos', label: 'Centros de Costos' }
        ].map((tab) => {
          const isActive = tabActiva === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key as typeof tabActiva)}
              className={`px-3 py-1.5 text-xs font-bold transition-all border-t-2 ${
                isActive
                  ? 'bg-white border-t-[#064e3b] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
                  : 'bg-transparent border-t-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* NOTIFICACIÓN TOAST */}
      {notificacion && (
        <div className="bg-emerald-50 border-b border-emerald-300 px-4 py-2 flex items-center gap-2 text-emerald-800 text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notificacion}</span>
        </div>
      )}

      {/* 3. VISTA PRINCIPAL: PESTAÑA DATOS GENERALES */}
      {tabActiva === 'generales' && (
        <div className="bg-white border border-slate-300 border-t-0 min-h-[640px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 bg-[#f0fdf4] border-b border-slate-300 text-xs font-mono font-bold text-slate-800">
            <div className="px-4 py-1.5 border-r border-slate-300">
              Datos generales (Persistidos en Supabase `erp_empresa`)
            </div>
            <div className="px-4 py-1.5">
              Logo
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <form onSubmit={handleGuardarDatos} className="p-4 border-r border-slate-300 space-y-2.5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Nombre:</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Razón social:</label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Domicilio:</label>
                <input
                  type="text"
                  value={domicilio}
                  onChange={(e) => setDomicilio(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Localidad:</label>
                <input
                  type="text"
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Cod. Postal:</label>
                <input
                  type="text"
                  value={codPostal}
                  onChange={(e) => setCodPostal(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Provincia:</label>
                <select
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs"
                >
                  <option value="San Juan">San Juan</option>
                  <option value="Mendoza">Mendoza</option>
                  <option value="San Luis">San Luis</option>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="CABA">Ciudad Autónoma de Buenos Aires</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Santa Fe">Santa Fe</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">País:</label>
                <input
                  type="text"
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Teléfono:</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">CBU:</label>
                <input
                  type="text"
                  value={cbu}
                  onChange={(e) => setCbu(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">CUIT:</label>
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Número IIBB:</label>
                <input
                  type="text"
                  value={numeroIibb}
                  onChange={(e) => setNumeroIibb(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 pl-32">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800 text-[11px]">
                  <input
                    type="checkbox"
                    checked={convenioMultilateral}
                    onChange={(e) => setConvenioMultilateral(e.target.checked)}
                    className="accent-[#064e3b] w-3.5 h-3.5"
                  />
                  <span>Inscripto en Convenio Multilateral</span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold transition-colors border border-[#064e3b]"
                >
                  Guardar datos en Supabase
                </button>
              </div>
            </form>

            {/* COLUMNA DERECHA: LOGO DE LA EMPRESA */}
            <form onSubmit={handleGuardarLogo} className="p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <label className="w-40 shrink-0 text-slate-700">Logo Actual:</label>
                <input
                  type="text"
                  readOnly
                  value={logoArchivo}
                  className="w-full max-w-md px-2 py-1 bg-slate-50 border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-40 shrink-0 text-slate-700">Ancho(en milímetros):</label>
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    value={logoAncho}
                    onChange={(e) => setLogoAncho(e.target.value)}
                    placeholder="Ingrese el ancho del Logo en milímetros"
                    className="w-full px-2 py-1 bg-[#fef9c3] border border-amber-300 text-xs placeholder:text-amber-800/60 focus:outline-none focus:border-amber-500 pr-7"
                  />
                  <AlertCircle className="w-4 h-4 text-rose-600 absolute right-2 top-1.5" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-40 shrink-0 text-slate-700">Altura(en milímetros):</label>
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    value={logoAltura}
                    onChange={(e) => setLogoAltura(e.target.value)}
                    placeholder="Ingrese la altura del Logo en milímetros"
                    className="w-full px-2 py-1 bg-[#fef9c3] border border-amber-300 text-xs placeholder:text-amber-800/60 focus:outline-none focus:border-amber-500 pr-7"
                  />
                  <AlertCircle className="w-4 h-4 text-rose-600 absolute right-2 top-1.5" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-40 shrink-0 text-slate-700">Archivo del Logo:</label>
                <div className="relative w-full max-w-md flex items-center">
                  <input
                    type="text"
                    value={logoArchivo}
                    onChange={(e) => setLogoArchivo(e.target.value)}
                    placeholder="Seleccionar una Imagen del Logo(.jpg/.gif/.png)"
                    className="w-full px-2 py-1 bg-white border border-slate-300 text-xs pr-7 focus:outline-none focus:border-[#064e3b]"
                  />
                  <Save className="w-4 h-4 text-slate-600 absolute right-2" />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-mono text-xs font-bold transition-colors border border-[#064e3b]"
                >
                  Guardar logo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: DATOS IMPOSITIVOS */}
      {tabActiva === 'impositivos' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 font-mono text-xs space-y-4 max-w-3xl">
          <div className="bg-slate-50 border border-slate-200 p-4 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Condición Impositiva y Fiscal ante AFIP</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 text-[11px] block">Condición frente al IVA:</span>
                <p className="font-bold text-slate-900 mt-1">{empresa.condicionIva}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Inicio de Actividades:</span>
                <p className="font-bold text-slate-900 mt-1">{empresa.inicioActividades}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Agente de Retención Ganancias:</span>
                <p className="text-slate-800 mt-1">Régimen General RG 830 AFIP</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Padrón Rentas San Juan:</span>
                <p className="font-bold text-emerald-700 mt-1">Alícuota General 3.0% (Construcción y Redes)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CLIENTES / PROVEEDORES */}
      {tabActiva === 'clientes_proveedores' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 font-mono text-xs space-y-4 max-w-4xl">
          <h3 className="font-bold text-slate-900 text-sm uppercase">
            Parámetros Predeterminados de Cuentas Corrientes (Clientes y Proveedores)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 p-4 bg-slate-50 space-y-2">
              <span className="font-bold text-[#064e3b] block">VENTAS Y CUENTAS POR COBRAR</span>
              <p className="text-slate-600">Cuenta Contable Deudores por Ventas: <strong>1.1.02 Créditos por Ventas</strong></p>
              <p className="text-slate-600">Plazo de Vencimiento Facturas por Defecto: <strong>30 días corridos</strong></p>
              <p className="text-slate-600">Interés Punitorio por Mora: <strong>4.5% mensual</strong></p>
            </div>
            <div className="border border-slate-200 p-4 bg-slate-50 space-y-2">
              <span className="font-bold text-[#064e3b] block">COMPRAS Y CUENTAS POR PAGAR</span>
              <p className="text-slate-600">Cuenta Contable Proveedores: <strong>2.1.01 Proveedores Locales</strong></p>
              <p className="text-slate-600">Validación de CUIT duplicado: <strong>Estricta (Bloqueante)</strong></p>
              <p className="text-slate-600">Cálculo Automático Retenciones IIBB/Ganancias: <strong>Activo</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: TALONARIOS */}
      {tabActiva === 'talonarios' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Puntos de Venta y Talonarios de Emisión Electrónica</h3>
            <button
              onClick={() => setShowNuevoPuntoModal(true)}
              className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Punto de Venta</span>
            </button>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="py-2 px-3 border-r border-slate-200">Punto</th>
                <th className="py-2 px-3 border-r border-slate-200">Descripción</th>
                <th className="py-2 px-3 border-r border-slate-200">Tipo de Emisión</th>
                <th className="py-2 px-3 border-r border-slate-200">Comprobantes Habilitados</th>
                <th className="py-2 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {talonarios.map((t) => (
                <tr key={t.punto} className="hover:bg-slate-50">
                  <td className="py-2 px-3 border-r border-slate-200 font-bold">{t.punto}</td>
                  <td className="py-2 px-3 border-r border-slate-200">{t.desc}</td>
                  <td className="py-2 px-3 border-r border-slate-200">{t.emision}</td>
                  <td className="py-2 px-3 border-r border-slate-200">{t.hab}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px]">{t.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PESTAÑA 5: INTEGRACIONES (AFIP WEB SERVICES & MERCADO PAGO) */}
      {tabActiva === 'integraciones' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 text-xs space-y-6">
          <div className="flex border-b border-slate-300 gap-4">
            <button
              onClick={() => setSubTabIntegracion('afip')}
              className={`pb-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
                subTabIntegracion === 'afip'
                  ? 'border-[#064e3b] text-[#064e3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span
                className={`w-2 h-2 ${
                  afipConfig.estadoConexion === 'conectado' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
              <span>AFIP Web Services (Facturación Electrónica WSAA / WSFE)</span>
            </button>

            <button
              onClick={() => setSubTabIntegracion('mercadopago')}
              className={`pb-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
                subTabIntegracion === 'mercadopago'
                  ? 'border-[#009ee3] text-[#009ee3]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span
                className={`w-2 h-2 ${
                  mpConfig.estadoConexion === 'conectado' ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              ></span>
              <span>Mercado Pago API (Cobros con Tarjetas & QR Interoperable)</span>
            </button>
          </div>

          {/* CONTENIDO SUB-TAB AFIP */}
          {subTabIntegracion === 'afip' && (
            <div className="space-y-5">
              <div
                className={`p-4 border flex items-center justify-between gap-3 ${
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
                    <h4 className="font-bold uppercase text-xs">
                      Estado del Web Service:{' '}
                      {afipConfig.estadoConexion === 'conectado'
                        ? `CONECTADO (${afipConfig.ambiente.toUpperCase()})`
                        : 'DESCONECTADO / PENDIENTE DE CERTIFICADOS'}
                    </h4>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {afipConfig.ultimoMensaje ||
                        'Cargue el Certificado Digital y Clave Privada emitidos por AFIP para autorizar facturas con CAE.'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold block opacity-75">Entorno Actual:</span>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 bg-white border border-current">
                    {afipConfig.ambiente}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3 border border-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase text-emerald-400 block">
                    Endpoint Serverless ARCA WSAA / WSFEv1 (Preconfigurado):
                  </span>
                  <code className="text-xs text-emerald-300 font-mono">{DEFAULT_ARCA_FUNCTION_URL}</code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(DEFAULT_ARCA_FUNCTION_URL);
                    setNotificacion('Endpoint ARCA WSFE copiado al portapapeles.');
                    setTimeout(() => setNotificacion(null), 2500);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600"
                >
                  Copiar Endpoint ARCA
                </button>
              </div>

              {/* SELECTOR DE ARQUITECTURA DE CONEXIÓN ARCA (MODELO DUX SOFTWARE VS CERTIFICADO PROPIO) */}
              <div className="bg-emerald-50/70 border border-emerald-300 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-[#042f22] block">
                      Modalidad de Representación ante ARCA (ex-AFIP):
                    </span>
                    <p className="text-[11px] text-emerald-900">
                      Al igual que <strong>Dux Software</strong>, el cliente puede delegar el servicio <code className="font-mono font-bold">wsfe</code> a nuestro CUIT Representante en Clave Fiscal sin generar certificados OpenSSL.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAfipConfig({ ...afipConfig, modoConexion: 'delegacion_representante' })}
                      className={`px-3 py-1.5 text-[11px] font-bold border transition-colors ${
                        (afipConfig.modoConexion ?? 'delegacion_representante') === 'delegacion_representante'
                          ? 'bg-[#042f22] text-white border-[#042f22]'
                          : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      1. Delegación Web Service (Estilo Dux)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAfipConfig({ ...afipConfig, modoConexion: 'certificado_propio' })}
                      className={`px-3 py-1.5 text-[11px] font-bold border transition-colors ${
                        afipConfig.modoConexion === 'certificado_propio'
                          ? 'bg-[#042f22] text-white border-[#042f22]'
                          : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      2. Certificado Propio (.CRT / .KEY)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Ambiente AFIP:
                  </label>
                  <select
                    value={afipConfig.ambiente}
                    onChange={(e) =>
                      setAfipConfig({ ...afipConfig, ambiente: e.target.value as 'homologacion' | 'produccion' })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 bg-white font-semibold text-xs"
                  >
                    <option value="homologacion">Homologación (Testing / Pruebas)</option>
                    <option value="produccion">Producción (Servidores Reales)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    CUIT del Titular (Empresa Representada):
                  </label>
                  <input
                    type="text"
                    value={afipConfig.cuit}
                    onChange={(e) => setAfipConfig({ ...afipConfig, cuit: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Punto de Venta Web Service:
                  </label>
                  <input
                    type="text"
                    value={afipConfig.puntoVentaPredeterminado}
                    onChange={(e) =>
                      setAfipConfig({ ...afipConfig, puntoVentaPredeterminado: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 font-semibold text-xs"
                  />
                </div>
              </div>

              {(afipConfig.modoConexion ?? 'delegacion_representante') === 'delegacion_representante' ? (
                <div className="border-2 border-[#064e3b] bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-[#064e3b] border border-emerald-300">
                        ARQUITECTURA DUX SOFTWARE · DELEGACIÓN WSFE
                      </span>
                      <h5 className="text-xs font-bold text-[#042f22] mt-1">
                        Instructivo de 3 Pasos en ARCA (Administrador de Relaciones de Clave Fiscal)
                      </h5>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-300 px-3 py-1.5 text-right">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                        CUIT Representante (Grow Labs SaaS):
                      </span>
                      <span className="text-xs font-mono font-bold text-[#042f22]">
                        {afipConfig.cuitRepresentanteSaaS || '30-71875908-7'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 space-y-1">
                      <span className="font-bold text-[#064e3b] uppercase block">Paso 1 · Crear Punto de Venta</span>
                      <p className="text-slate-700">
                        En ARCA ingrese a <strong>&ldquo;Administración de Puntos de Venta y Domicilios&rdquo;</strong> &rarr; <em>A/B/M de Puntos de Venta</em> y cree un punto con sistema:
                      </p>
                      <select
                        value={afipConfig.sistemaPuntoVentaAfip || 'RECE para aplicativos y Web Services'}
                        onChange={(e) =>
                          setAfipConfig({
                            ...afipConfig,
                            sistemaPuntoVentaAfip: e.target.value as AfipWsConfig['sistemaPuntoVentaAfip']
                          })
                        }
                        className="w-full mt-1 px-2 py-1 border border-emerald-300 bg-white font-bold text-[10px] text-[#042f22]"
                      >
                        <option value="RECE para aplicativos y Web Services">
                          RECE para aplicativos y Web Services (Resp. Inscripto)
                        </option>
                        <option value="Factura Electrónica - Monotributo - Web Services">
                          Factura Electrónica - Monotributo - Web Services
                        </option>
                      </select>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 space-y-1">
                      <span className="font-bold text-[#064e3b] uppercase block">Paso 2 · Delegar Servicio WSFE</span>
                      <p className="text-slate-700">
                        En <strong>&ldquo;Administrador de Relaciones de Clave Fiscal&rdquo;</strong> &rarr; <em>Nueva Relación</em> &rarr; busque <strong>AFIP &rarr; WebServices &rarr; Facturación Electrónica (wsfe)</strong> y en Representante ingrese el CUIT:
                      </p>
                      <input
                        type="text"
                        value={afipConfig.cuitRepresentanteSaaS || '30-71875908-7'}
                        onChange={(e) => setAfipConfig({ ...afipConfig, cuitRepresentanteSaaS: e.target.value })}
                        className="w-full mt-1 px-2 py-1 border border-emerald-300 bg-white font-mono font-bold text-xs text-[#042f22]"
                      />
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-[#064e3b] uppercase block">Paso 3 · Confirmar Delegación</span>
                        <p className="text-slate-700">
                          Una vez aceptada la relación en ARCA, marque la casilla inferior y presione <strong>Guardar y Probar Conexión AFIP</strong>.
                        </p>
                      </div>
                      <label className="flex items-center gap-2 pt-1 cursor-pointer font-bold text-[#042f22]">
                        <input
                          type="checkbox"
                          checked={afipConfig.delegacionConfirmadaPorCliente ?? true}
                          onChange={(e) =>
                            setAfipConfig({ ...afipConfig, delegacionConfirmadaPorCliente: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#064e3b]"
                        />
                        <span>Relación WSFE delegada en ARCA</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-[#064e3b]" />
                        <span>Certificado Digital (.crt)</span>
                      </label>
                      <label className="text-[11px] text-[#064e3b] font-bold hover:underline cursor-pointer">
                        Subir archivo .crt
                        <input
                          type="file"
                          accept=".crt,.pem,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const r = new FileReader();
                            r.onload = (ev) => setAfipCrt(ev.target?.result as string);
                            r.readAsText(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <textarea
                      rows={4}
                      value={afipCrt}
                      onChange={(e) => setAfipCrt(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                      className="w-full p-2 bg-white border border-slate-300 font-mono text-[10px]"
                    />
                  </div>

                  <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-700" />
                        <span>Clave Privada RSA (.key)</span>
                      </label>
                      <label className="text-[11px] text-[#064e3b] font-bold hover:underline cursor-pointer">
                        Subir archivo .key
                        <input
                          type="file"
                          accept=".key,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const r = new FileReader();
                            r.onload = (ev) => setAfipKey(ev.target?.result as string);
                            r.readAsText(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <textarea
                      rows={4}
                      value={afipKey}
                      onChange={(e) => setAfipKey(e.target.value)}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
                      className="w-full p-2 bg-white border border-slate-300 font-mono text-[10px]"
                    />
                  </div>
                </div>
              )}

              {resultadoAfip && (
                <div
                  className={`p-3 border flex items-center gap-2 ${
                    resultadoAfip.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {resultadoAfip.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{resultadoAfip.mensaje}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setVerOpenSsl(!verOpenSsl)}
                  className="text-[#064e3b] font-bold hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>{verOpenSsl ? 'Ocultar guía OpenSSL' : 'Ver comandos OpenSSL y pasos en AFIP'}</span>
                </button>

                <button
                  type="button"
                  disabled={probandoAfip}
                  onClick={async () => {
                    setProbandoAfip(true);
                    setResultadoAfip(null);
                    const cfg: AfipWsConfig = {
                      ...afipConfig,
                      certificadoCrt: afipCrt,
                      clavePrivadaKey: afipKey,
                      estadoConexion: afipCrt && afipKey ? 'pendiente_certificados' : 'desconectado'
                    };
                    saveAfipConfig(cfg);
                    setAfipConfig(cfg);
                    const res = await probarConexionAfip(cfg);
                    setResultadoAfip(res);
                    setAfipConfig(getAfipConfig());
                    setProbandoAfip(false);
                  }}
                  className="px-4 py-2 bg-[#064e3b] hover:bg-[#065f46] text-white font-bold flex items-center gap-2 border border-black shadow-sm"
                >
                  {probandoAfip ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{probandoAfip ? 'Probando...' : 'Guardar y Probar Conexión AFIP'}</span>
                </button>
              </div>

              {verOpenSsl && (
                <div className="p-4 bg-slate-900 text-slate-200 space-y-3 border border-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <Terminal className="w-4 h-4" /> Generación de Certificado para AFIP
                    </span>
                    <button
                      onClick={() => {
                        const data = generarInstruccionesOpenSsl(afipConfig.cuit.replace(/[^0-9]/g, ''), 'SANATORIO ARGENTINO');
                        navigator.clipboard.writeText(`${data.comandoClave}\n${data.comandoCsr}`);
                        setCopiadoOpenSsl(true);
                        setTimeout(() => setCopiadoOpenSsl(false), 2000);
                      }}
                      className="px-2 py-1 bg-slate-800 text-[11px] font-bold border border-slate-600"
                    >
                      {copiadoOpenSsl ? '¡Copiado!' : 'Copiar Comandos OpenSSL'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed">
                    {`# 1. Generar Clave Privada (2048 bits):\nopenssl genrsa -out zonda_${afipConfig.cuit.replace(/[^0-9]/g, '')}.key 2048\n\n# 2. Generar Solicitud de Certificado (CSR):\nopenssl req -new -key zonda_${afipConfig.cuit.replace(/[^0-9]/g, '')}.key -subj "/C=AR/O=SANATORIO ARGENTINO/CN=AFIP_${afipConfig.cuit.replace(/[^0-9]/g, '')}_ZONDA/serialNumber=CUIT ${afipConfig.cuit.replace(/[^0-9]/g, '')}" -out zonda_${afipConfig.cuit.replace(/[^0-9]/g, '')}.csr`}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO SUB-TAB MERCADO PAGO */}
          {subTabIntegracion === 'mercadopago' && (
            <div className="space-y-5">
              <div
                className={`p-4 border flex items-center justify-between gap-3 ${
                  mpConfig.estadoConexion === 'conectado'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-[#009ee3] shrink-0" />
                  <div>
                    <h4 className="font-bold uppercase text-xs">
                      Estado de Mercado Pago:{' '}
                      {mpConfig.estadoConexion === 'conectado'
                        ? `ACTIVO (${mpConfig.modo.toUpperCase()})`
                        : 'DESCONECTADO / PENDIENTE DE TOKEN'}
                    </h4>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {mpConfig.ultimoMensaje ||
                        'Conecte su cuenta de Mercado Pago Developers para habilitar cobros con tarjetas, transferencias y QR.'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold block opacity-75">Modo de Operación:</span>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 bg-white border border-current">
                    {mpConfig.modo}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3.5 border border-slate-700 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-sky-400 block">
                      URL del Webhook para pegar en Mercado Pago Developers:
                    </span>
                    <code className="text-xs text-sky-300 font-mono select-all">{DEFAULT_MP_WEBHOOK_URL}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(DEFAULT_MP_WEBHOOK_URL);
                        setNotificacion('URL de Webhook de Mercado Pago copiada al portapapeles.');
                        setTimeout(() => setNotificacion(null), 2500);
                      }}
                      className="px-3 py-1 bg-[#009ee3] hover:bg-[#007eb5] text-white text-xs font-bold"
                    >
                      Copiar Webhook URL
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const refDemo = 'WH-MP-' + String(Math.floor(1000 + Math.random() * 9000));
                        await simularWebhookPagoMercadoPago({ monto: 25000, referencia: refDemo });
                        if (clientes[0]) {
                          await registrarCobroCliente({
                            clienteId: clientes[0].id,
                            monto: 25000,
                            medioCobro: 'Mercado Pago (Webhook IPN)'
                          });
                        }
                        setNotificacion(`Webhook IPN (${refDemo}) simulado: $25.000 acreditados en Tesorería y Contabilidad.`);
                        setTimeout(() => setNotificacion(null), 4000);
                      }}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                    >
                      Simular Webhook ($25.000)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Modo de Pasarela:
                  </label>
                  <select
                    value={mpConfig.modo}
                    onChange={(e) => setMpConfig({ ...mpConfig, modo: e.target.value as 'sandbox' | 'produccion' })}
                    className="w-full px-3 py-1.5 border border-slate-300 bg-white font-semibold text-xs"
                  >
                    <option value="sandbox">Sandbox (Pruebas con tarjetas de test)</option>
                    <option value="produccion">Producción (Cobros Reales)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Public Key:
                  </label>
                  <input
                    type="text"
                    value={mpPublicKey}
                    onChange={(e) => setMpPublicKey(e.target.value)}
                    placeholder={mpConfig.modo === 'sandbox' ? 'TEST-...' : 'APP_USR-...'}
                    className="w-full px-3 py-1.5 border border-slate-300 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Access Token (Producción / Sandbox):
                </label>
                <input
                  type="password"
                  value={mpAccessToken}
                  onChange={(e) => setMpAccessToken(e.target.value)}
                  placeholder={mpConfig.modo === 'sandbox' ? 'TEST-...' : 'APP_USR-...'}
                  className="w-full px-3 py-1.5 border border-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Webhook Secret (Firma IPN para conciliación automática):
                </label>
                <input
                  type="password"
                  value={mpWebhook}
                  onChange={(e) => setMpWebhook(e.target.value)}
                  placeholder="Secreto de webhook para confirmar pagos en Tesorería"
                  className="w-full px-3 py-1.5 border border-slate-300 font-mono text-xs"
                />
              </div>

              {/* MAPEO DE CAJA DESTINO Y TERMINALES POINT / QR (MODELO DUX SOFTWARE) */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 space-y-3">
                <div className="flex items-center justify-between border-b border-sky-200 pb-1.5">
                  <span className="text-[11px] font-bold uppercase text-sky-950">
                    Vinculación Operativa con Tesorería, QR y Terminales Point (Estilo Dux Software)
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-white text-sky-800 border border-sky-300">
                    CONCILIACIÓN AUTOMÁTICA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                      Caja / Cuenta Destino en ERP
                    </label>
                    <select
                      value={mpConfig.cuentaBancariaDestinoId || 'CTA-01'}
                      onChange={(e) => setMpConfig({ ...mpConfig, cuentaBancariaDestinoId: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-semibold text-xs"
                    >
                      {cuentasBancarias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.banco} ({c.moneda})
                        </option>
                      ))}
                      <option value="MP-VIRTUAL">Cuenta Virtual Mercado Pago</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                      Sucursal MP (Store External ID)
                    </label>
                    <input
                      type="text"
                      value={mpConfig.sucursalExternalId || 'SUC001'}
                      onChange={(e) => setMpConfig({ ...mpConfig, sucursalExternalId: e.target.value })}
                      placeholder="SUC001"
                      className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                      Caja QR Mostrador (POS External ID)
                    </label>
                    <input
                      type="text"
                      value={mpConfig.cajaPosExternalId || 'CAJA01'}
                      onChange={(e) => setMpConfig({ ...mpConfig, cajaPosExternalId: e.target.value })}
                      placeholder="CAJA01"
                      className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                      Lector Físico Mercado Pago Point
                    </label>
                    <input
                      type="text"
                      value={mpConfig.pointDeviceId || 'PAX_A910__SMARTPOS01'}
                      onChange={(e) => setMpConfig({ ...mpConfig, pointDeviceId: e.target.value })}
                      placeholder="PAX_A910__SMARTPOS01"
                      className="w-full px-2.5 py-1.5 border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {resultadoMp && (
                <div
                  className={`p-3 border flex items-center gap-2 ${
                    resultadoMp.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {resultadoMp.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{resultadoMp.mensaje}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await crearPreferenciaMercadoPago({
                      titulo: 'Prueba de Integración Zonda ERP',
                      monto: 25000,
                      comprobanteNumero: 'FAC-TEST-001'
                    });
                    setQrPrueba({ link: mpConfig.modo === 'sandbox' ? res.sandboxInitPoint : res.initPoint });
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4 text-[#009ee3]" />
                  <span>Generar Cobro de Prueba (QR / Link)</span>
                </button>

                <button
                  type="button"
                  disabled={probandoMp}
                  onClick={async () => {
                    setProbandoMp(true);
                    setResultadoMp(null);
                    const cfg: MercadoPagoConfig = {
                      ...mpConfig,
                      accessToken: mpAccessToken,
                      publicKey: mpPublicKey,
                      webhookSecret: mpWebhook
                    };
                    saveMercadoPagoConfig(cfg);
                    setMpConfig(cfg);
                    const res = await probarConexionMercadoPago(mpAccessToken, mpConfig.modo);
                    setResultadoMp(res);
                    setMpConfig(getMercadoPagoConfig());
                    setProbandoMp(false);
                  }}
                  className="px-4 py-2 bg-[#009ee3] hover:bg-[#007eb5] text-white font-bold flex items-center gap-2"
                >
                  {probandoMp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{probandoMp ? 'Validando...' : 'Guardar y Probar Mercado Pago'}</span>
                </button>
              </div>

              {qrPrueba && (
                <div className="p-3 bg-sky-50 border border-[#009ee3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#009ee3]" />
                    <span className="font-semibold text-slate-900">
                      Link de Prueba generado:{' '}
                      <a href={qrPrueba.link} target="_blank" rel="noreferrer" className="text-[#009ee3] underline ml-1">
                        {qrPrueba.link}
                      </a>
                    </span>
                  </div>
                  <button onClick={() => setQrPrueba(null)} className="text-slate-500 hover:text-slate-800">
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 6: PORTAL CLIENTES */}
      {tabActiva === 'portal' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 font-mono text-xs space-y-4 max-w-3xl">
          <h3 className="font-bold text-slate-900 text-sm uppercase">Configuración de Portal de Autogestión de Clientes</h3>
          <div className="p-4 bg-slate-50 border border-slate-200 space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-[#064e3b] w-4 h-4" />
              <span className="font-bold">Enviar comprobantes electrónicos con CAE automáticamente por correo al emitir</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-[#064e3b] w-4 h-4" />
              <span className="font-bold">Incluir botón de pago QR interoperable de Mercado Pago en el PDF de la factura</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="accent-[#064e3b] w-4 h-4" />
              <span className="font-bold">Permitir descarga de certificados de retención y recibos X</span>
            </label>
          </div>
        </div>
      )}

      {/* PESTAÑA 7: TESORERÍA */}
      {tabActiva === 'tesoreria' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 font-mono text-xs space-y-4 max-w-3xl">
          <h3 className="font-bold text-slate-900 text-sm uppercase">Parámetros de Tesorería y Conciliación Bancaria</h3>
          <div className="p-4 bg-slate-50 border border-slate-200 space-y-2">
            <p className="text-slate-700">Moneda Principal del Sistema: <strong>ARS (Peso Argentino)</strong></p>
            <p className="text-slate-700">Cuenta Puente de Valores a Depositar: <strong>1.1.01 Caja y Bancos</strong></p>
            <p className="text-slate-700">Control de numeración correlativa de Órdenes de Pago y Recibos X: <strong>Automático</strong></p>
          </div>
        </div>
      )}

      {/* PESTAÑA 8: CENTROS DE COSTOS */}
      {tabActiva === 'costos' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm uppercase">Centros de Costos y Unidades de Negocio / Obras</h3>
            <button
              onClick={() => {
                setCentrosCosto([
                  ...centrosCosto,
                  {
                    codigo: `CC-${(centrosCosto.length + 1) * 100}`,
                    nombre: 'Nueva Obra Civil San Juan',
                    responsable: 'Dirección Técnica',
                    presupuesto: 15000000
                  }
                ]);
              }}
              className="px-3 py-1.5 bg-[#064e3b] text-white font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Centro de Costo</span>
            </button>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <th className="py-2 px-3 border-r border-slate-200">Código</th>
                <th className="py-2 px-3 border-r border-slate-200">Unidad de Negocio / Obra</th>
                <th className="py-2 px-3 border-r border-slate-200">Responsable</th>
                <th className="py-2 px-3 text-right">Presupuesto Asignado ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {centrosCosto.map((cc) => (
                <tr key={cc.codigo} className="hover:bg-slate-50">
                  <td className="py-2 px-3 border-r border-slate-200 font-bold">{cc.codigo}</td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{cc.nombre}</td>
                  <td className="py-2 px-3 border-r border-slate-200">{cc.responsable}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-700">
                    ${cc.presupuesto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: NUEVO PUNTO DE VENTA */}
      {showNuevoPuntoModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#064e3b] w-full max-w-md shadow-2xl font-mono text-xs">
            <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between font-bold">
              <span>HABILITAR PUNTO DE VENTA AFIP</span>
              <button onClick={() => setShowNuevoPuntoModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAgregarPuntoVenta} className="p-4 space-y-3">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Número de Punto de Venta (4 o 5 dígitos):</label>
                <input
                  type="text"
                  required
                  value={nuevoPtoNro}
                  onChange={(e) => setNuevoPtoNro(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Descripción / Sucursal:</label>
                <input
                  type="text"
                  required
                  value={nuevoPtoDesc}
                  onChange={(e) => setNuevoPtoDesc(e.target.value)}
                  placeholder="Ej: Obrador Acueducto Zonda"
                  className="w-full px-2 py-1.5 border border-slate-300"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNuevoPuntoModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#064e3b] text-white font-bold">
                  Guardar Punto de Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CENTRALIZADO DE CONEXIONES (ARCA / MERCADO PAGO / WEBHOOKS) */}
      <ConexionesManagerModal
        isOpen={modalConexionesOpen}
        onClose={() => setModalConexionesOpen(false)}
        defaultTab={tabModalConexion}
      />
    </div>
  );
};
