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
  Layers,
  Globe,
  FileText
} from 'lucide-react';
import { mockEmpresa } from '../../services/mockData';
import { EmpresaConfig } from '../../types/models';

export const ConfiguracionModule: React.FC = () => {
  // Pestaña activa superior
  const [tabActiva, setTabActiva] = useState<
    'generales' | 'impositivos' | 'clientes_proveedores' | 'talonarios' | 'portal' | 'tesoreria' | 'integraciones' | 'costos'
  >('generales');

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
            Configuración de la Empresa
          </h1>
          <span className="text-xs text-slate-400 font-mono">| PARÁMETROS FISCALES, TALONARIOS Y AFIP</span>
        </div>

        <button
          onClick={() => alert('Calendario de vencimientos impositivos: IVA 18/11, IIBB San Juan 20/11, 931 Fargas Sociales 12/11.')}
          className="px-3.5 py-1.5 bg-[#4c1d95] hover:bg-[#3b0764] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#4c1d95]"
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
          { key: 'portal', label: 'Portal Clientes' },
          { key: 'tesoreria', label: 'Tesorería' },
          { key: 'integraciones', label: 'Integraciones' },
          { key: 'costos', label: 'Centros de Costos' }
        ].map((tab) => {
          const isActive = tabActiva === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key as any)}
              className={`px-3 py-1.5 text-xs font-mono font-bold transition-all border-t-2 ${
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

      {/* OTRAS PESTAÑAS */}
      {tabActiva !== 'generales' && tabActiva !== 'impositivos' && tabActiva !== 'talonarios' && (
        <div className="bg-white border border-slate-300 border-t-0 p-8 font-mono text-xs text-slate-500 text-center">
          Pestaña {tabActiva} configurada según los parámetros de la empresa en Zonda ERP.
        </div>
      )}
    </div>
  );
};
