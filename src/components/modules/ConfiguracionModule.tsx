import React, { useState } from 'react';
import {
  Calendar,
  AlertCircle,
  Save,
  Upload,
  CheckCircle2,
  Building2,
  Receipt,
  CreditCard,
  Sliders,
  Globe,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Key,
  Terminal,
  QrCode,
  ExternalLink,
  Copy,
  HelpCircle,
  RefreshCw,
  FileCode
} from 'lucide-react';
import { mockEmpresa } from '../../services/mockData';
import { EmpresaConfig, AfipWsConfig, MercadoPagoConfig } from '../../types/models';
import { getAfipConfig, saveAfipConfig, probarConexionAfip, generarInstruccionesOpenSsl } from '../../services/afip/afipWsClient';
import { getMercadoPagoConfig, saveMercadoPagoConfig, probarConexionMercadoPago, crearPreferenciaMercadoPago, generarQrCobroMercadoPago } from '../../services/mercadopago/mercadoPagoClient';

export const ConfiguracionModule: React.FC = () => {
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

  // Datos Generales
  const [nombre, setNombre] = useState('ECAR S. A. S.');
  const [razonSocial, setRazonSocial] = useState('ECAR S. A. S.');
  const [domicilio, setDomicilio] = useState('CASA 15  M:E');
  const [localidad, setLocalidad] = useState('VILLA KRAUSE');
  const [codPostal, setCodPostal] = useState('5425');
  const [provincia, setProvincia] = useState('San Juan');
  const [pais, setPais] = useState('12');
  const [telefono, setTelefono] = useState('+542644693547');
  const [email, setEmail] = useState('administracion@ecarconstrucciones.com');
  const [cbu, setCbu] = useState('');
  const [cuit, setCuit] = useState('30718759087');
  const [numeroIibb, setNumeroIibb] = useState('30718759087');
  const [convenioMultilateral, setConvenioMultilateral] = useState(false);

  // Logo
  const [logoAncho, setLogoAncho] = useState('');
  const [logoAltura, setLogoAltura] = useState('');
  const [logoArchivo, setLogoArchivo] = useState('');

  // Notificaciones de guardado
  const [notificacion, setNotificacion] = useState<string | null>(null);

  const handleGuardarDatos = (e: React.FormEvent) => {
    e.preventDefault();
    setNotificacion('Datos generales de la empresa guardados correctamente.');
    setTimeout(() => setNotificacion(null), 3000);
  };

  const handleGuardarLogo = (e: React.FormEvent) => {
    e.preventDefault();
    setNotificacion('Parámetros de logotipo corporativo guardados con éxito.');
    setTimeout(() => setNotificacion(null), 3000);
  };

  return (
    <div className="space-y-0 text-slate-800 font-sans">
      {/* 1. BARRA SUPERIOR DE ENCABEZADO Y LLAMADA AL CALENDARIO */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
            Configuración de la Empresa
          </h1>
          <span className="text-xs text-slate-500 font-medium">| PARÁMETROS FISCALES, TALONARIOS Y AFIP</span>
        </div>

        <button
          onClick={() => alert('Calendario de vencimientos impositivos: IVA 18/11, IIBB San Juan 20/11, 931 Cargas Sociales 12/11.')}
          className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#4c1d95]"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendario de vencimientos</span>
        </button>
      </div>

      {/* 2. PESTAÑAS PRINCIPALES DEL MÓDULO */}
      <div className="bg-[#ede9fe]/40 border-b border-slate-300 px-2 pt-1 flex flex-wrap items-center gap-1">
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
              onClick={() => setTabActiva(tab.key as any)}
              className={`px-3 py-1.5 text-xs font-bold transition-all border-t-2 ${
                isActive
                  ? 'bg-white border-t-[#4c1d95] text-slate-900 border-x border-slate-300 -mb-[1px] z-10'
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

      {/* 3. VISTA PRINCIPAL: PESTAÑA DATOS GENERALES (RÉPLICA EXACTA) */}
      {tabActiva === 'generales' && (
        <div className="bg-white border border-slate-300 border-t-0 min-h-[640px]">
          {/* Sub-cabecera con títulos de columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 bg-[#f3f0ff] border-b border-slate-300 text-xs font-mono font-bold text-slate-800">
            <div className="px-4 py-1.5 border-r border-slate-300">
              Datos generales
            </div>
            <div className="px-4 py-1.5">
              Logo
            </div>
          </div>

          {/* Cuerpo dividido en 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* COLUMNA IZQUIERDA: FORMULARIO DATOS GENERALES */}
            <form onSubmit={handleGuardarDatos} className="p-4 border-r border-slate-300 space-y-2.5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Nombre:</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Razón social:</label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Domicilio:</label>
                <input
                  type="text"
                  value={domicilio}
                  onChange={(e) => setDomicilio(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Localidad:</label>
                <input
                  type="text"
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Cod. Postal:</label>
                <input
                  type="text"
                  value={codPostal}
                  onChange={(e) => setCodPostal(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
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
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Teléfono:</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">CBU:</label>
                <input
                  type="text"
                  value={cbu}
                  onChange={(e) => setCbu(e.target.value)}
                  placeholder=""
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">CUIT:</label>
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-32 shrink-0 text-slate-700">Número IIBB:</label>
                <input
                  type="text"
                  value={numeroIibb}
                  onChange={(e) => setNumeroIibb(e.target.value)}
                  className="w-full max-w-sm px-2 py-1 bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#4c1d95]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 pl-32">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800 text-[11px]">
                  <input
                    type="checkbox"
                    checked={convenioMultilateral}
                    onChange={(e) => setConvenioMultilateral(e.target.checked)}
                    className="accent-[#4c1d95] w-3.5 h-3.5"
                  />
                  <span>Inscripto en Convenio Multilateral</span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold transition-colors border border-[#4c1d95]"
                >
                  Guardar datos
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
                  value=""
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
                    className="w-full px-2 py-1 bg-white border border-slate-300 text-xs pr-7 focus:outline-none focus:border-[#4c1d95]"
                  />
                  <button
                    type="button"
                    onClick={() => alert('Selector de archivo de imagen abierto. Formatos aceptados: JPG, PNG, GIF.')}
                    className="absolute right-1 text-slate-500 hover:text-slate-800 p-0.5"
                    title="Examinar imagen"
                  >
                    <Save className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold transition-colors border border-[#4c1d95]"
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
                <p className="font-bold text-slate-900 mt-1">IVA Responsable Inscripto</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Inicio de Actividades:</span>
                <p className="font-bold text-slate-900 mt-1">01/03/2021</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Agente de Retención Ganancias:</span>
                <p className="text-slate-800 mt-1">No Sujeto a Retención RG 830</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Padrón Rentas San Juan:</span>
                <p className="font-bold text-emerald-700 mt-1">Alícuota General 3.0% (Construcción y Redes)</p>
              </div>
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
              onClick={() => alert('Asistente de alta de nuevo Punto de Venta AFIP activo.')}
              className="px-3 py-1.5 bg-[#4c1d95] text-white font-bold"
            >
              + Agregar Punto de Venta
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
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 border-r border-slate-200 font-bold">0001</td>
                <td className="py-2 px-3 border-r border-slate-200">Facturación Electrónica Sede Central San Juan</td>
                <td className="py-2 px-3 border-r border-slate-200">Web Service AFIP (WSFE v1)</td>
                <td className="py-2 px-3 border-r border-slate-200">Facturas A, B, Notas de Crédito/Débito A, B</td>
                <td className="py-2 px-3 text-center">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px]">Activo</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 border-r border-slate-200 font-bold">0002</td>
                <td className="py-2 px-3 border-r border-slate-200">Sucursal Rawson</td>
                <td className="py-2 px-3 border-r border-slate-200">Web Service AFIP (WSFE v1)</td>
                <td className="py-2 px-3 border-r border-slate-200">Facturas A, B, Remitos R</td>
                <td className="py-2 px-3 text-center">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px]">Activo</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2 px-3 border-r border-slate-200 font-bold">0003</td>
                <td className="py-2 px-3 border-r border-slate-200">Recibos Móviles de Cobranza en Obra</td>
                <td className="py-2 px-3 border-r border-slate-200">Comprobante de Cobro Interno</td>
                <td className="py-2 px-3 border-r border-slate-200">Recibos Oficiales X</td>
                <td className="py-2 px-3 text-center">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px]">Activo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* PESTAÑA 5: INTEGRACIONES (AFIP WEB SERVICES & MERCADO PAGO) */}
      {tabActiva === 'integraciones' && (
        <div className="bg-white border border-slate-300 border-t-0 p-6 text-xs space-y-6">
          {/* Sub-selector */}
          <div className="flex border-b border-slate-300 gap-4">
            <button
              onClick={() => setSubTabIntegracion('afip')}
              className={`pb-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
                subTabIntegracion === 'afip'
                  ? 'border-blue-700 text-blue-900'
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Ambiente AFIP:
                  </label>
                  <select
                    value={afipConfig.ambiente}
                    onChange={(e) =>
                      setAfipConfig({ ...afipConfig, ambiente: e.target.value as any })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 bg-white font-semibold text-xs"
                  >
                    <option value="homologacion">Homologación (Testing / Pruebas)</option>
                    <option value="produccion">Producción (Servidores Reales)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    CUIT del Titular:
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
                    Punto de Venta Predeterminado:
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-blue-700" />
                      <span>Certificado Digital (.crt)</span>
                    </label>
                    <label className="text-[11px] text-blue-700 font-bold hover:underline cursor-pointer">
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
                    <label className="text-[11px] text-blue-700 font-bold hover:underline cursor-pointer">
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
                  className="text-blue-700 font-bold hover:underline flex items-center gap-1"
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
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-2"
                >
                  {probandoAfip ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{probandoAfip ? 'Probando...' : 'Guardar y Probar Conexión AFIP'}</span>
                </button>
              </div>

              {verOpenSsl && (
                <div className="p-4 bg-slate-900 text-slate-200 space-y-3 border border-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold text-cyan-400 uppercase flex items-center gap-1.5">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Modo de Pasarela:
                  </label>
                  <select
                    value={mpConfig.modo}
                    onChange={(e) => setMpConfig({ ...mpConfig, modo: e.target.value as any })}
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

      {/* OTRAS PESTAÑAS */}
      {tabActiva !== 'generales' && tabActiva !== 'impositivos' && tabActiva !== 'talonarios' && tabActiva !== 'integraciones' && (
        <div className="bg-white border border-slate-300 border-t-0 p-8 text-xs text-slate-500 text-center font-medium">
          Pestaña {tabActiva} configurada según los parámetros de la empresa en Zonda ERP.
        </div>
      )}
    </div>
  );
};
