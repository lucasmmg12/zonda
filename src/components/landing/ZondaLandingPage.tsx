import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Landmark,
  Boxes,
  ShoppingBag,
  ShieldCheck,
  Cloud,
  CreditCard,
  Sparkles,
  User
} from 'lucide-react';

interface ZondaLandingPageProps {
  onOpenAuth: (mode: 'signup' | 'login', prefilledEmail?: string) => void;
  tieneSesionActiva?: boolean;
  onIrAlSistema?: () => void;
}

const FAQS_DATA = [
  {
    q: '¿Cómo funciona el mes de prueba gratuita?',
    a: 'Te registrás con Google o con tu email y contraseña en 30 segundos, sin ingresar tarjeta. Durante 30 días tenés acceso total a todos los módulos para facturar, controlar stock, bancos, sueldos y tu tienda online.'
  },
  {
    q: '¿Cuánto cuesta después de los 30 días gratis y cómo se paga?',
    a: 'Finalizado el primer mes gratuito, el abono es un importe único y simbólico de $20.000 ARS por mes con todo incluido. Lo abonás directamente desde tu cuenta mediante Mercado Pago (dinero en cuenta, tarjeta o débito automático) y podés cancelar cuando quieras.'
  },
  {
    q: '¿Mis datos se mezclan con los de otras empresas?',
    a: 'Nunca. Al crear tu cuenta, Zonda aprovisiona automáticamente un entorno Multi-Tenant 100% aislado para tu CUIT. Solo vos y los operadores internos que invites pueden ver tu información.'
  },
  {
    q: '¿Puedo darle acceso a mi contador sin compartir mi clave?',
    a: 'Sí. Con un clic activás la vinculación con Zonda Cloud para que tu estudio contable liquide IVA Digital, F.2002, IIBB y Balances RT 54 sin entrar a tu operatoria comercial privada.'
  },
  {
    q: '¿Emite Factura Electrónica oficial con CAE de ARCA (ex-AFIP)?',
    a: 'Sí. Incluye conexión directa con Web Services WSFEv1 de ARCA para Facturas A, B, C y Notas de Crédito/Débito con código QR oficial e integración nativa de cobros con Mercado Pago.'
  }
];

export const ZondaLandingPage: React.FC<ZondaLandingPageProps> = ({
  onOpenAuth,
  tieneSesionActiva = false,
  onIrAlSistema
}) => {
  const [faqAbierta, setFaqAbierta] = useState<number>(0);
  const [vistaHeroTab, setVistaHeroTab] = useState<'tablero' | 'facturacion' | 'ecommerce'>('tablero');
  const [emailFooter, setEmailFooter] = useState('');

  return (
    <div className="min-h-screen bg-white text-[#212121] font-sans selection:bg-[#3563e9]/15 selection:text-[#3563e9]">
      {/* 1. NAVIGATION (TechPilot Node 5:2015 Style=01) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 h-20 flex items-center justify-between gap-6">
          <a href="#inicio" className="flex items-center gap-2.5 shrink-0">
            <img src="/logogrow.png?v=2" alt="Zonda ERP" className="w-9 h-9 object-contain" />
            <div className="leading-tight">
              <span className="text-base font-extrabold tracking-tight text-[#212121] block">
                Zonda ERP
              </span>
              <span className="text-[10px] font-medium text-[#757575] block">Grow Labs Suite</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#424242]">
            <a href="#inicio" className="text-[#3563e9] font-bold">
              Inicio
            </a>
            <a href="#como-funciona" className="hover:text-[#3563e9] transition-colors">
              Cómo Funciona
            </a>
            <a href="#modulos" className="hover:text-[#3563e9] transition-colors">
              Módulos
            </a>
            <a href="#precios" className="hover:text-[#3563e9] transition-colors">
              Precios
            </a>
            <a href="#preguntas" className="hover:text-[#3563e9] transition-colors">
              Preguntas
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {tieneSesionActiva && onIrAlSistema ? (
              <button
                type="button"
                onClick={onIrAlSistema}
                className="px-4 py-2.5 rounded-xl bg-[#3563e9] hover:bg-[#2952cc] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Volver a mi Panel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[#424242] hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                    <User className="w-4 h-4 text-[#424242]" />
                  </span>
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-5 py-2.5 rounded-xl bg-[#3563e9] hover:bg-[#2952cc] text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  Probar 30 Días Gratis
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO (TechPilot Node 13:3021 Style=Hero 7 — Diagonal Royal Blue + Floating Preview) */}
      <section id="inicio" className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Diagonal Royal Blue Background */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[620px] bg-[#3563e9]"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 78%, 0 96%)'
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-medium mb-6 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autogestión en 1 minuto · 1 Mes Gratis y luego $20.000 ARS/mes</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Toda la gestión de tu empresa, simple y en un solo lugar
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#f5f5f5]/90 max-w-2xl mx-auto leading-relaxed">
            Facturación electrónica ARCA, cuentas corrientes, stock, bancos, sueldos y tu propia
            tienda online. Registrate con Google o tu email y empezá a operar hoy mismo.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-3.5 rounded-xl bg-white text-[#3563e9] hover:bg-[#eff3fd] font-semibold text-base shadow-lg transition-all"
            >
              Comenzar prueba gratis (30 días)
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-8 py-3.5 rounded-xl border border-white text-white hover:bg-white/10 font-medium text-base transition-all"
            >
              Ingresar al sistema
            </button>
          </div>

          {/* Floating Interactive Product Preview Card (TechPilot #EFF3FD Frame) */}
          <div className="mt-14 max-w-4xl mx-auto rounded-[18px] bg-[#eff3fd] p-3 sm:p-5 shadow-[0_20px_50px_rgba(15,23,42,0.16)] border border-white">
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden text-left">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-[11px] font-medium text-slate-400">
                    Zonda ERP — Interfaz Limpia "Menos es Más"
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[11px] font-semibold">
                  {[
                    { id: 'tablero', label: 'Panel Ejecutivo' },
                    { id: 'facturacion', label: 'Facturación ARCA' },
                    { id: 'ecommerce', label: 'Tienda Online' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setVistaHeroTab(t.id as any)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        vistaHeroTab === t.id
                          ? 'bg-white text-[#3563e9] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-[#f8fafc]">
                {vistaHeroTab === 'tablero' && (
                  <img
                    src="/tutorial/preview_growlabs_dashboard.png"
                    alt="Vista del Panel Ejecutivo Zonda ERP"
                    className="w-full h-[260px] sm:h-[380px] object-cover object-top rounded-xl border border-slate-200 shadow-xs"
                  />
                )}
                {vistaHeroTab === 'facturacion' && (
                  <img
                    src="/tutorial/step_04_venta_stock_contado.png"
                    alt="Facturación Electrónica ARCA y Mercado Pago"
                    className="w-full h-[260px] sm:h-[380px] object-cover object-top rounded-xl border border-slate-200 shadow-xs"
                  />
                )}
                {vistaHeroTab === 'ecommerce' && (
                  <img
                    src="/tutorial/step_12_ecommerce_storefront.png"
                    alt="Tienda Online Integrada Zonda Ecommerce"
                    className="w-full h-[260px] sm:h-[380px] object-cover object-top rounded-xl border border-slate-200 shadow-xs"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. QUÉ HACE Y CÓMO LO HACE — LEFT & RIGHT CONTENT (TechPilot 26:4209 & 33:3413) */}
      <section id="como-funciona" className="py-16 lg:py-24 max-w-7xl mx-auto px-6 lg:px-16 space-y-24">
        {/* Bloque 1: Texto Izquierda, Visual Derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <span className="text-sm font-medium text-[#757575]">
              01 · Facturación ARCA y Cobros Online
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] leading-tight">
              Emití facturas electrónicas y cobrá en segundos
            </h2>
            <p className="text-base text-[#757575] leading-relaxed">
              Generá Facturas A, B, C y Notas de Crédito con CAE oficial de ARCA, enviá el PDF con
              QR por WhatsApp y acreditá el cobro automáticamente con Mercado Pago en tu tesorería.
            </p>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="inline-flex items-center gap-2 text-[#3563e9] font-medium text-base hover:gap-3 transition-all pt-1"
            >
              <span>Crear mi cuenta y probarlo</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="lg:col-span-7 bg-[#eff3fd] rounded-2xl p-6 sm:p-8">
            <img
              src="/tutorial/preview_growlabs_clientes.png"
              alt="Facturación y Cuentas Corrientes"
              className="w-full rounded-xl shadow-md border border-slate-200/80 bg-white"
            />
          </div>
        </div>

        {/* Bloque 2: Visual Izquierda, Texto Derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1 bg-[#eff3fd] rounded-2xl p-6 sm:p-8">
            <img
              src="/tutorial/step_03_compra_stock_contado.png"
              alt="Inventario, Compras IA y Contabilidad"
              className="w-full rounded-xl shadow-md border border-slate-200/80 bg-white"
            />
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
            <span className="text-sm font-medium text-[#757575]">
              02 · Compras con IA, Stock y Contabilidad
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] leading-tight">
              Cada compra alimenta tu stock y tus libros sin doble carga
            </h2>
            <p className="text-base text-[#757575] leading-relaxed">
              Sacale una foto a la factura de tu proveedor para extraer los ítems con IA: Zonda
              actualiza existencias, calcula costos y genera el asiento en el Libro Diario
              automáticamente.
            </p>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="inline-flex items-center gap-2 text-[#3563e9] font-medium text-base hover:gap-3 transition-all pt-1"
            >
              <span>Empezar mes gratuito</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bloque 3: Texto Izquierda, Visual Derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <span className="text-sm font-medium text-[#757575]">
              03 · Tienda Online + Estudio Contable Zonda Cloud
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121] leading-tight">
              Vendé 24/7 en tu tienda web y delegá impuestos en 1 clic
            </h2>
            <p className="text-base text-[#757575] leading-relaxed">
              Publicá tu catálogo con variantes de talle y color conectado en vivo a tu depósito, y
              habilitá a tu contador en Zonda Cloud para liquidar IVA Digital y Balances sin
              planillas sueltas.
            </p>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="inline-flex items-center gap-2 text-[#3563e9] font-medium text-base hover:gap-3 transition-all pt-1"
            >
              <span>Activar mi tienda ahora</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="lg:col-span-7 bg-[#eff3fd] rounded-2xl p-6 sm:p-8">
            <img
              src="/tutorial/step_11_ecommerce_admin.png"
              alt="Constructor de Tienda Online Zonda"
              className="w-full rounded-xl shadow-md border border-slate-200/80 bg-white"
            />
          </div>
        </div>
      </section>

      {/* 4. FEATURE GRID 2x3 (TechPilot Node 33:4509 Style=01) */}
      <section id="modulos" className="py-20 bg-slate-50/60 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-base text-[#757575]">Ecosistema Completo</span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121]">
              Todo lo que necesitás, sin pantallas sobrecargadas
            </h2>
            <p className="text-base text-[#757575]">
              Diseñado bajo la filosofía menos es más para que cualquier persona del equipo pueda
              usarlo desde el primer día.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: 'Ventas y CAE ARCA',
                desc: 'Facturas A/B/C, Notas de Crédito, cuenta corriente por cliente y envío por WhatsApp.'
              },
              {
                icon: Boxes,
                title: 'Stock y Compras IA',
                desc: 'Kardex trazable por comprobante, listas de precios y lectura OCR de facturas.'
              },
              {
                icon: Landmark,
                title: 'Tesorería y Conciliación',
                desc: 'Cajas, bancos, cartera de cheques y conciliación automática de extractos CSV.'
              },
              {
                icon: ShoppingBag,
                title: 'Ecommerce Integrado',
                desc: 'Tienda online propia con variantes, cupones, login Google y cobro digital.'
              },
              {
                icon: Cloud,
                title: 'Puente Zonda Cloud',
                desc: 'Entorno separado para que tu contador liquide IVA F.2002, IIBB y Balances RT 54.'
              },
              {
                icon: ShieldCheck,
                title: 'Aislamiento Multi-Tenant',
                desc: 'Creación instantánea de empresa, roles por operador y correos con dominio propio.'
              }
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-white rounded-2xl p-7 border border-slate-200/70 text-center flex flex-col items-center gap-4 shadow-xs"
                >
                  <div className="w-[60px] h-[60px] rounded-full bg-[#eff3fd] text-[#3563e9] flex items-center justify-center">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#212121]">{feat.title}</h3>
                  <p className="text-sm text-[#616161] leading-relaxed max-w-xs">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PRECIO ÚNICO TRANSPARENTE + 30 DÍAS GRATIS + MERCADO PAGO */}
      <section id="precios" className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-base text-[#757575]">Precio simple y previsible</span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121]">
            Probá 1 mes gratis. Seguí por un valor simbólico.
          </h2>
          <p className="text-base text-[#757575]">
            Sin costos de implementación, sin límite de comprobantes y sin letra chica.
          </p>
        </div>

        <div className="mt-12 bg-white rounded-3xl border-2 border-[#3563e9] shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-7 p-8 sm:p-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eff3fd] text-[#3563e9] text-xs font-semibold">
              <span>Plan Único Todo Incluido</span>
            </div>
            <h3 className="text-2xl font-bold text-[#212121]">
              Autogestioná tu alta hoy y operá gratis durante 30 días
            </h3>
            <ul className="space-y-3 text-sm text-[#424242]">
              {[
                'Primeros 30 días 100% bonificados ($0 ARS) sin tarjeta de crédito',
                'Registro instantáneo con Google o correo electrónico y contraseña',
                'Todos los módulos incluidos: Facturación ARCA, Stock, Bancos, Sueldos y Tienda Web',
                'Notificaciones automáticas por email y vinculación opcional con tu contador',
                'Renovación mensual mediante Mercado Pago cancelable en cualquier momento'
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#eff3fd] text-[#3563e9] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-5 bg-[#eff3fd] p-8 sm:p-10 flex flex-col justify-center items-center text-center border-t md:border-t-0 md:border-l border-[#3563e9]/15 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3563e9]">
              Mes 1: $0 ARS (Gratis)
            </span>
            <div>
              <span className="text-4xl sm:text-5xl font-extrabold text-[#212121]">$20.000</span>
              <span className="text-sm text-[#616161] block mt-1">
                ARS / mes a partir del segundo mes
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#009ee3] text-xs font-semibold border border-sky-200">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pago seguro con Mercado Pago</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="w-full py-3.5 px-6 rounded-xl bg-[#3563e9] hover:bg-[#2952cc] text-white font-semibold text-sm shadow-md transition-colors"
            >
              Crear cuenta gratis ahora
            </button>
          </div>
        </div>
      </section>

      {/* 6. FAQS COLLAPSIBLE ACCORDION (TechPilot Node 43:3378 Style=01) */}
      <section id="preguntas" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4 mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#212121]">
              Preguntas frecuentes
            </h2>
            <p className="text-base text-[#757575] max-w-2xl mx-auto">
              Resolvé tus dudas sobre el registro automático, el período gratuito y la suscripción
              mensual.
            </p>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQS_DATA.map((item, idx) => {
              const open = faqAbierta === idx;
              return (
                <div key={item.q} className="py-5">
                  <button
                    type="button"
                    onClick={() => setFaqAbierta(open ? -1 : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                  >
                    <span className="text-base sm:text-lg font-medium text-[#212121]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#757575] shrink-0 transition-transform ${
                        open ? 'rotate-180 text-[#3563e9]' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <p className="mt-3 text-sm sm:text-base text-[#757575] leading-relaxed pr-8">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION BANNER (TechPilot Node 49:4054 Style=03) */}
      <section className="py-16 max-w-7xl mx-auto px-6 lg:px-16">
        <div className="bg-[#3563e9] rounded-[18px] px-8 py-12 sm:px-16 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-tight">
              Empezá hoy tus 30 días gratuitos y ordená tu empresa
            </h2>
            <p className="text-base text-[#fafafa]/90 max-w-xl">
              Creá tu usuario en segundos con Google o tu correo electrónico y recibí acceso
              inmediato a tu propio entorno en la nube.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="px-6 py-3.5 rounded-xl bg-white text-[#3563e9] hover:bg-[#eff3fd] font-semibold text-sm inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                <span>Crear mi cuenta gratis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#eff3fd] rounded-xl p-5 text-[#212121] space-y-3 shadow-inner">
            <div className="text-xs font-bold uppercase text-[#3563e9]">Alta Instantánea</div>
            <div className="text-sm font-semibold">¿Qué incluye tu cuenta desde el minuto 1?</div>
            <div className="space-y-2 text-xs text-[#424242]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3563e9]" />
                <span>Empresa propia aislada lista para facturar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3563e9]" />
                <span>Email automático de activación y bienvenida</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3563e9]" />
                <span>30 días sin cargo · luego $20.000/mes con Mercado Pago</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER (TechPilot Node 71:4126 Style=01) */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div className="space-y-3">
                <p className="font-bold text-[#212121]">Producto</p>
                <ul className="space-y-2.5 text-[#757575]">
                  <li><a href="#modulos" className="hover:text-[#212121]">Facturación ARCA</a></li>
                  <li><a href="#modulos" className="hover:text-[#212121]">Inventario y Compras</a></li>
                  <li><a href="#modulos" className="hover:text-[#212121]">Tesorería y Bancos</a></li>
                  <li><a href="#modulos" className="hover:text-[#212121]">Tienda Ecommerce</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="font-bold text-[#212121]">Estudios</p>
                <ul className="space-y-2.5 text-[#757575]">
                  <li><a href="#como-funciona" className="hover:text-[#212121]">Zonda Cloud Contadores</a></li>
                  <li><a href="#como-funciona" className="hover:text-[#212121]">Libro IVA Digital</a></li>
                  <li><a href="#como-funciona" className="hover:text-[#212121]">Balances RT 54</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="font-bold text-[#212121]">Cuenta</p>
                <ul className="space-y-2.5 text-[#757575]">
                  <li>
                    <button type="button" onClick={() => onOpenAuth('signup')} className="hover:text-[#212121]">
                      Crear cuenta gratis
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => onOpenAuth('login')} className="hover:text-[#212121]">
                      Iniciar sesión
                    </button>
                  </li>
                  <li><a href="#precios" className="hover:text-[#212121]">Suscripción Mercado Pago</a></li>
                </ul>
              </div>
            </div>

            {/* Caja de registro directo por email estilo TechPilot Footer */}
            <div className="md:col-span-5 bg-[#eff3fd] rounded-2xl p-6 space-y-3">
              <p className="font-bold text-[#212121] text-sm">Comenzá con tu correo electrónico</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onOpenAuth('signup', emailFooter);
                }}
                className="flex bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <input
                  type="email"
                  value={emailFooter}
                  onChange={(e) => setEmailFooter(e.target.value)}
                  placeholder="tucorreo@empresa.com"
                  className="flex-1 px-3.5 py-2.5 text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 bg-[#3563e9] hover:bg-[#2952cc] text-white flex items-center justify-center"
                  title="Comenzar registro gratis"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="text-xs text-[#616161] leading-relaxed">
                Activá tus 30 días sin costo y recibí los accesos y guía inicial directo en tu
                casilla.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#757575]">
            <div className="flex items-center gap-2">
              <img src="/logogrow.png?v=2" alt="Grow Labs" className="w-6 h-6 object-contain" />
              <span className="font-semibold text-[#212121]">Zonda ERP · Grow Labs Suite</span>
            </div>
            <div className="flex items-center gap-6">
              <span>Términos</span>
              <span>Privacidad</span>
              <span>San Juan, Argentina</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
