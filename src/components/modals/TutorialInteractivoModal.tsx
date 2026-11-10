import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  GraduationCap,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Layers,
  Package,
  ShoppingCart,
  Receipt,
  CreditCard,
  Landmark,
  Cloud,
  Sparkles,
  BookOpen,
  Eye
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { ModuleKey } from '../layout/Sidebar';

export interface TutorialCallout {
  num: string;
  label: string;
  desc: string;
  top: string;
  left: string;
}

export interface TutorialImageSlide {
  src: string;
  caption: string;
  badge: string;
  callouts: TutorialCallout[];
}

export interface TutorialStepData {
  stepNumber: number;
  id: string;
  title: string;
  subtitle: string;
  moduleKey: ModuleKey;
  moduleLabel: string;
  icon: React.FC<{ className?: string }>;
  summary: string;
  highlights: {
    title: string;
    detail: string;
    tag: string;
  }[];
  accountingImpact: string;
  images: TutorialImageSlide[];
}

export const TUTORIAL_STEPS: TutorialStepData[] = [
  {
    stepNumber: 1,
    id: 'step-bienvenida-multitenant',
    title: 'Bienvenida, Tablero Ejecutivo y Aislamiento Multi-Tenant',
    subtitle: 'Control financiero en tiempo real y seguridad estricta por CUIT / Empresa',
    moduleKey: 'tablero',
    moduleLabel: '01 · Tablero de Control',
    icon: Layers,
    summary:
      'Al iniciar sesión en Zonda ERP accedés a un entorno Multi-Tenant aislado donde cada usuario opera exclusivamente sobre la contabilidad, stock y tesorería de su propia empresa (CUIT), con sincronización en vivo con Supabase y delegación opcional hacia el Estudio Contable (Zonda Cloud).',
    highlights: [
      {
        title: '① Selector de Usuario Aislado y Delegación Zonda Cloud',
        detail:
          'En la barra superior podés verificar la empresa activa (ej. ECAR S.R.L. o Sanatorio Argentino S.R.L.), alternar el permiso "Cloud: Aceptado ✓" para tu contador, o cambiar de sesión desde el botón de perfil.',
        tag: 'Multi-Tenant RBAC'
      },
      {
        title: '② Buscador Omnicanal Instantáneo (Ctrl + K)',
        detail:
          'Buscá cualquier CUIT, razón social, código de artículo, número de factura, cheque en cartera o cuenta contable y saltá directo al registro con un clic.',
        tag: 'Productividad'
      },
      {
        title: '③ KPIs Financieros y Estado de Resultados en Vivo',
        detail:
          'Visualizá al instante Disponibilidades en Caja/Bancos, Cuentas por Cobrar, Pasivos con Proveedores y el flujo de ingresos vs. egresos.',
        tag: 'Tiempo Real'
      }
    ],
    accountingImpact:
      'Todos los módulos impactan automáticamente en el Plan de Cuentas y en el Balance General sin necesidad de reprocesar lotes.',
    images: [
      {
        src: '/tutorial/step_01_dashboard.png',
        caption: 'Vista General del Tablero de Control (01 - Tablero) con KPIs ejecutivos y cabecera Multi-Tenant',
        badge: 'Vista A · Tablero Principal',
        callouts: [
          {
            num: '1',
            label: 'Empresa Activa + Estado Cloud',
            desc: 'Muestra el CUIT en sesión y si el Estudio Contable está autorizado.',
            top: '5%',
            left: '28%'
          },
          {
            num: '2',
            label: 'Buscador Global (Ctrl+K) y Perfil',
            desc: 'Acceso rápido a entidades, Manuales, Tutorial y cambio de Operador.',
            top: '5%',
            left: '78%'
          },
          {
            num: '3',
            label: 'Indicadores Financieros Auditables',
            desc: 'Saldos conciliados con Tesorería, Clientes, Proveedores y Contabilidad.',
            top: '28%',
            left: '48%'
          }
        ]
      },
      {
        src: '/tutorial/step_01b_multitenant_aislado.png',
        caption: 'Aislamiento estricto por Usuario/CUIT: al ingresar con otro operador, todo el ERP cambia a su propia base de datos',
        badge: 'Vista B · Sesión Aislada por CUIT',
        callouts: [
          {
            num: '1',
            label: 'Cambio Automático de Empresa',
            desc: 'Cada operador ve únicamente los comprobantes y saldos de su CUIT.',
            top: '6%',
            left: '30%'
          },
          {
            num: '2',
            label: 'Menú Lateral Dinámico',
            desc: 'En Zonda ERP muestra GROW // ERP y en el portal contable cambia a ZONDA CLOUD.',
            top: '8%',
            left: '8%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 2,
    id: 'step-inventario-alertas',
    title: 'Inventario, Kárdex Documentado y Alertas de Stock Crítico',
    subtitle: 'Trazabilidad obligatoria por comprobante y reposición en 1 clic',
    moduleKey: 'inventario',
    moduleLabel: '06 · Inventario y Stock',
    icon: Package,
    summary:
      'El módulo de Inventario impide ajustes de stock "en el aire": toda alta o ingreso de mercadería exige respaldo documental (Factura + Proveedor). Además, detecta automáticamente los artículos por debajo del stock mínimo y permite reponerlos en 1 clic.',
    highlights: [
      {
        title: '① Banner Ámbar de Alerta de Stock Crítico (Disponible <= Mínimo)',
        detail:
          'Cuando un artículo cae por debajo de su punto de pedido tras una venta, el sistema despliega una alerta visual detallando stock disponible, mínimo y cantidad sugerida a comprar.',
        tag: 'Control Preventivo'
      },
      {
        title: '② Botón "⚡ Reponer en Proveedores (1-Click)"',
        detail:
          'Con un solo clic en el artículo crítico, Zonda ERP te lleva al módulo de Proveedores, abre el modal de Nueva Compra y pre-carga el ítem con la cantidad sugerida de reposición.',
        tag: 'Automatización'
      },
      {
        title: '③ Kárdex Auditable con Respaldo Documental',
        detail:
          'Cada movimiento en el Kárdex registra fecha, comprobante origen (Factura de Compra o Venta), cliente/proveedor y costo promedio ponderado (PPP).',
        tag: 'Auditoría Kárdex'
      }
    ],
    accountingImpact:
      'Valuación permanente de Mercaderías de Reventa (Cuenta 1.1.03.01) a Costo Promedio Ponderado / Costo de Reposición.',
    images: [
      {
        src: '/tutorial/step_02_inventario_alerta.png',
        caption: 'Módulo 06 - Inventario con Banner de Alerta de Stock Crítico y botón de reposición automática en Proveedores',
        badge: 'Vista A · Alerta de Stock Crítico',
        callouts: [
          {
            num: '1',
            label: 'Alerta de Stock Crítico',
            desc: 'Detecta en vivo artículos con stock disponible igual o menor al mínimo.',
            top: '26%',
            left: '35%'
          },
          {
            num: '2',
            label: '⚡ Reponer en Proveedores',
            desc: 'Abre la carga de factura de compra con el artículo y cantidad pre-cargados.',
            top: '30%',
            left: '84%'
          },
          {
            num: '3',
            label: 'Semáforo de Disponibilidad',
            desc: 'Indicador visual de unidades físicas, comprometidas y costo unitario.',
            top: '56%',
            left: '65%'
          }
        ]
      },
      {
        src: '/tutorial/step_02b_kardex_trazabilidad.png',
        caption: 'Actualización instantánea de existencias luego de registrar compras (+ unidades) o ventas (- unidades)',
        badge: 'Vista B · Kárdex y Existencias',
        callouts: [
          {
            num: '1',
            label: 'Valuación Total del Inventario',
            desc: 'Cálculo automático del capital inmovilizado en depósito.',
            top: '18%',
            left: '25%'
          },
          {
            num: '2',
            label: 'Alta de Artículo con Factura Obligatoria',
            desc: 'Todo stock inicial exige asociar proveedor y comprobante respaldatorio.',
            top: '18%',
            left: '86%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 3,
    id: 'step-compras-proveedores',
    title: 'Compras a Proveedores, Ingreso de Stock y Pago Al Contado',
    subtitle: 'Carga manual o por foto IA, impacto en Kárdex y cancelación en 1 paso',
    moduleKey: 'proveedores',
    moduleLabel: '03 · Proveedores y Compras',
    icon: ShoppingCart,
    summary:
      'Al registrar una Factura de Compra en Proveedores podés escanear el comprobante con OCR IA, asociar los artículos comprados para que sumen stock automáticamente (+ Unidades) y elegir si queda en Cuenta Corriente o si se paga Al Contado en el mismo acto.',
    highlights: [
      {
        title: '① Asociación de Artículos que Suman Stock (+ Unidades)',
        detail:
          'Seleccioná uno o más productos del inventario, indicá cantidad y costo unitario neto: al guardar la factura, el stock disponible sube automáticamente y recalcula el costo.',
        tag: 'Stock + Unidades'
      },
      {
        title: '② Selector "⚡ Cancelación Al Contado (1 Paso)" vs. Cuenta Corriente',
        detail:
          'Si comprás al contado, activá el botón verde "⚡ Al Contado (Pago Inmediato)", elegí la caja/banco o cheque y el sistema emite la Factura + la Orden de Pago dejando saldo $0.',
        tag: 'Pago en 1 Paso'
      },
      {
        title: '③ Escáner Inteligente OCR / IA de Facturas',
        detail:
          'Subí una foto o PDF de la factura del proveedor para autocompletar CUIT, número de comprobante, importes netos e IVA Crédito Fiscal.',
        tag: 'OCR IA'
      }
    ],
    accountingImpact:
      'Asiento 1: Debe Mercaderías (1.1.03) / Gasto + IVA Crédito Fiscal (1.1.05) a Proveedores (2.1.01). Si es Al Contado, genera además el Asiento 2 cancelando Proveedores contra Caja/Banco.',
    images: [
      {
        src: '/tutorial/step_03_compra_stock_contado.png',
        caption: 'Modal Cargar Factura de Compra con renglones de artículos que incrementan el stock en el Kárdex (+ Unidades)',
        badge: 'Vista A · Carga de Compra + Stock',
        callouts: [
          {
            num: '1',
            label: 'Datos Fiscales del Comprobante',
            desc: 'Proveedor, Tipo (FA/FB/FC), N° de factura e imputación contable.',
            top: '24%',
            left: '35%'
          },
          {
            num: '2',
            label: 'Renglones de Stock (+ Unidades)',
            desc: 'Incrementa automáticamente el disponible del artículo al guardar.',
            top: '55%',
            left: '48%'
          },
          {
            num: '3',
            label: 'Cálculo Automático de IVA y Total',
            desc: 'Determina Neto Gravado, IVA Crédito Fiscal y Total de la factura.',
            top: '78%',
            left: '65%'
          }
        ]
      },
      {
        src: '/tutorial/step_03b_proveedores_trazabilidad.png',
        caption: 'Ficha del Proveedor con Cuenta Corriente, facturas pendientes y trazabilidad de Órdenes de Pago',
        badge: 'Vista B · Cuenta Corriente Proveedor',
        callouts: [
          {
            num: '1',
            label: 'Padrón de Proveedores y Deuda',
            desc: 'Visualizá el saldo exigible de cada proveedor en tiempo real.',
            top: '35%',
            left: '22%'
          },
          {
            num: '2',
            label: 'Acciones: Cargar Factura / Registrar Pago',
            desc: 'Emití nuevas compras o cancelá facturas con pagos simples o mixtos.',
            top: '20%',
            left: '82%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 4,
    id: 'step-ventas-clientes',
    title: 'Ventas Electrónicas ARCA, Descuento de Stock y Cobro Al Contado',
    subtitle: 'Obtención de CAE, asiento automático de CMV y cobro inmediato en 1 paso',
    moduleKey: 'clientes',
    moduleLabel: '02 · Clientes y Ventas',
    icon: Receipt,
    summary:
      'En Clientes y Ventas emitís Facturas Electrónicas (A, B, C, MiPyME) validadas con CAE de ARCA. Al incluir productos del inventario, el sistema descuenta el stock físicamente (- Unidades), contabiliza el Costo de Mercadería Vendida (CMV) y permite cobrar Al Contado en 1 solo paso.',
    highlights: [
      {
        title: '① Descuento Automático de Stock (- Unidades) y Asiento de CMV',
        detail:
          'Al facturar artículos del inventario, Zonda ERP valida el stock disponible, descuenta las unidades vendidas y registra el asiento contable de CMV contra Mercaderías.',
        tag: 'Stock - Unidades & CMV'
      },
      {
        title: '② Cobro Inmediato "⚡ Al Contado (1 Paso)"',
        detail:
          'Seleccioná "⚡ Al Contado (Cobro Inmediato en 1 Paso)" dentro de la factura para elegir el medio de cobro (Efectivo, Transferencia, Posnet o Cheque) y emitir el Recibo X automáticamente.',
        tag: 'Cobro en 1 Paso'
      },
      {
        title: '③ Validación ARCA (Ex-AFIP) con CAE y Código QR',
        detail:
          'Cada factura emitida obtiene su CAE oficial, vencimiento y trazabilidad directa hacia el Libro IVA Ventas Digital.',
        tag: 'Factura Electrónica'
      }
    ],
    accountingImpact:
      'Genera hasta 3 asientos simultáneos: 1) Deudores por Ventas a Ventas + IVA Débito Fiscal; 2) CMV (5.1) a Mercaderías (1.1.03); 3) Si es Al Contado, Caja/Banco a Deudores por Ventas.',
    images: [
      {
        src: '/tutorial/step_04_venta_stock_contado.png',
        caption: 'Emisión de Factura de Venta con Cancelación Al Contado en 1 paso: genera Factura + Recibo X + Descuento de Stock',
        badge: 'Vista A · Venta Al Contado + Stock',
        callouts: [
          {
            num: '1',
            label: 'Factura Cancelada Al Contado (Saldo $0)',
            desc: 'La factura nace cobrada con su Recibo X e ingreso en Tesorería.',
            top: '52%',
            left: '62%'
          },
          {
            num: '2',
            label: 'Botones Nueva Factura / Registrar Cobro',
            desc: 'Facturación electrónica ARCA y recibos de cobranza multi-medio.',
            top: '22%',
            left: '84%'
          }
        ]
      },
      {
        src: '/tutorial/step_04b_venta_descuento_stock.png',
        caption: 'Modal Agregar Factura de Venta seleccionando artículos del inventario con descuento automático de unidades',
        badge: 'Vista B · Modal Factura con Stock (-)',
        callouts: [
          {
            num: '1',
            label: 'Selección de Artículos (- Unidades)',
            desc: 'Muestra stock disponible en vivo y descuenta las unidades al facturar.',
            top: '50%',
            left: '45%'
          },
          {
            num: '2',
            label: 'Condición: Cta. Cte. o Al Contado',
            desc: 'Elegí si queda pendiente de cobro o si ingresa hoy mismo a Caja/Banco.',
            top: '68%',
            left: '45%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 5,
    id: 'step-pagos-mixtos-retenciones',
    title: 'Cobros y Pagos Mixtos Multi-Medio + Retenciones Impositivas',
    subtitle: 'Combiná Efectivo + Transferencia + Cheque + Posnet y calculá IIBB / Ganancias',
    moduleKey: 'clientes',
    moduleLabel: '02 y 03 · Cobros y Pagos Mixtos',
    icon: CreditCard,
    summary:
      '¿Un cliente te paga una misma factura mitad en efectivo, una parte por transferencia y el resto con un cheque o certificado de retención? Con el motor de Pagos y Cobros Mixtos podés combinar infinitos tramos en un único Recibo u Orden de Pago.',
    highlights: [
      {
        title: '① Botón "⚡ Cobro / Pago Mixto Multi-Medio"',
        detail:
          'Activá la grilla multi-medio para agregar múltiples filas (+ Agregar Medio). Cada tramo puede apuntar a una cuenta de Tesorería distinta (Caja, Banco Nación, Banco Galicia, MP o Cheque).',
        tag: 'Multi-Medio'
      },
      {
        title: '② Calculadora Automática de Retenciones (IIBB 3% / Ganancias RG 830 2%)',
        detail:
          'Desplegá el panel "🏛️ Retenciones Impositivas" y usá los botones rápidos (Auto IIBB 3% o Auto Ganancias 2%) para calcular retenciones sufridas o practicadas con número de certificado.',
        tag: 'Retenciones Fiscales'
      },
      {
        title: '③ Validación de Cuadre Exacto en Vivo',
        detail:
          'El validador inferior suma (Tramos de Tesorería + Retenciones) y verifica que coincida al centavo con el total a cancelar antes de emitir el comprobante.',
        tag: 'Control de Cuadre'
      }
    ],
    accountingImpact:
      'Genera un asiento compuesto que debita/acredita cada cuenta bancaria/caja por su tramo exacto e imputa las retenciones en Créditos Fiscales (1.1.05) o Retenciones a Depositar (2.1.03.05).',
    images: [
      {
        src: '/tutorial/step_05_cobro_mixto_retenciones.png',
        caption: 'Modal Registrar Cobro de Cliente en modo Mixto Multi-Medio (Efectivo + Transferencia + Cheque) + Retenciones sufridas',
        badge: 'Vista A · Cobro Mixto de Cliente',
        callouts: [
          {
            num: '1',
            label: 'Selector Simple vs. ⚡ Cobro Mixto',
            desc: 'Habilita múltiples líneas de cobro en un mismo Recibo X.',
            top: '30%',
            left: '65%'
          },
          {
            num: '2',
            label: 'Grilla de Tramos (Efectivo / Banco / Cheque)',
            desc: 'Cada fila elige su medio, cuenta destino de Tesorería e importe.',
            top: '48%',
            left: '50%'
          },
          {
            num: '3',
            label: '🏛️ Panel de Retenciones Impositivas',
            desc: 'Botones rápidos para IIBB (3%), Ganancias (2%), IVA y SUSS.',
            top: '68%',
            left: '50%'
          }
        ]
      },
      {
        src: '/tutorial/step_05b_pago_mixto_retenciones.png',
        caption: 'Modal Orden de Pago a Proveedor combinando Transferencia + Efectivo + Cheque Propio + Retención Ganancias RG 830',
        badge: 'Vista B · Pago Mixto a Proveedor',
        callouts: [
          {
            num: '1',
            label: 'Tramos de Pago Multi-Cuenta',
            desc: 'Descuenta cada tramo de su respectiva Caja o Cuenta Bancaria.',
            top: '46%',
            left: '48%'
          },
          {
            num: '2',
            label: 'Retenciones Practicadas al Proveedor',
            desc: 'Calcula el pasivo fiscal en Retenciones a Depositar (2.1.03.05).',
            top: '66%',
            left: '48%'
          },
          {
            num: '3',
            label: 'Barra de Cuadre Exacto',
            desc: 'Confirma que Medios + Retenciones = Total Orden de Pago.',
            top: '82%',
            left: '50%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 6,
    id: 'step-tesoreria-contabilidad',
    title: 'Tesorería Multi-Cuenta, Cartera de Cheques y Libro Diario',
    subtitle: 'Trazabilidad [Tramo X/N] en cajas/bancos y partida doble automática',
    moduleKey: 'tesoreria',
    moduleLabel: '04 y 05 · Tesorería y Contabilidad',
    icon: Landmark,
    summary:
      'Cada operación comercial o pago mixto impacta sin demoras en Tesorería y en Contabilidad. Podés auditar cada tramo de cobro/pago en su cuenta bancaria o caja, administrar el endoso de cheques de terceros y consultar el Libro Diario General.',
    highlights: [
      {
        title: '① Desglose por Tramos [Tramo 1/3, 2/3...] en Cajas y Bancos',
        detail:
          'En Tesorería verás cómo cada medio de un pago mixto impactó exactamente en la cuenta seleccionada (Caja Administración, Banco Nación, Banco Galicia, Mercado Pago).',
        tag: 'Conciliación Bancaria'
      },
      {
        title: '② Cartera de Cheques de Terceros y Cheques Propios',
        detail:
          'Los cheques recibidos de clientes entran a cartera listos para depositarse o endosarse a proveedores; los cheques propios emitidos quedan agendados por fecha de pago.',
        tag: 'Tracking de Cheques'
      },
      {
        title: '③ Libro Diario General y Mayorización Automática',
        detail:
          'En el módulo 05 - Contabilidad auditás todos los asientos de Ventas, CMV, Compras, Cobros/Pagos Mixtos y Retenciones perfectamente balanceados (Debe = Haber).',
        tag: 'Partida Doble'
      }
    ],
    accountingImpact:
      'Integridad contable 100% garantizada: ningún movimiento de fondos o de stock ocurre sin su correspondiente asiento en el Libro Diario General.',
    images: [
      {
        src: '/tutorial/step_06_tesoreria_tramos.png',
        caption: 'Módulo 04 - Tesorería mostrando saldos actualizados por cuenta y el historial de movimientos con etiqueta [Tramo X/N]',
        badge: 'Vista A · Tesorería y Cajas/Bancos',
        callouts: [
          {
            num: '1',
            label: 'Tarjetas de Cuentas (CTA-01 a CTA-05)',
            desc: 'Saldos en vivo de Cajas, Cuentas Corrientes Bancarias y Billeteras.',
            top: '25%',
            left: '45%'
          },
          {
            num: '2',
            label: 'Trazabilidad por Tramo [Tramo X/N]',
            desc: 'Identifica a qué Recibo u Orden de Pago pertenece cada movimiento.',
            top: '68%',
            left: '52%'
          }
        ]
      },
      {
        src: '/tutorial/step_06b_libro_diario.png',
        caption: 'Módulo 05 - Contabilidad con los asientos automáticos de Ventas, CMV, Pagos Mixtos y Retenciones Impositivas',
        badge: 'Vista B · Libro Diario General',
        callouts: [
          {
            num: '1',
            label: 'Asientos Compuestos Multi-Línea',
            desc: 'Muestra el desglose completo de Cajas, Bancos y Retenciones.',
            top: '38%',
            left: '50%'
          },
          {
            num: '2',
            label: 'Equilibrio Debe = Haber',
            desc: 'Validación contable permanente para exportación a balances.',
            top: '72%',
            left: '75%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 7,
    id: 'step-zondacloud-rt54',
    title: 'Zonda Cloud (ARCA) y Exportador de Balance Oficial RT 54 (22 Hojas)',
    subtitle: 'Liquidación de impuestos y generación del Excel FACPCE RT 54 tal cual el modelo oficial',
    moduleKey: 'zondacloud',
    moduleLabel: '11 · Zonda Cloud (ARCA)',
    icon: Cloud,
    summary:
      'El módulo 11 - Zonda Cloud es el puente definitivo con el Estudio Contable y ARCA (ex-AFIP): liquida IVA Simple F.2051, IIBB Convenio Multilateral CM03, Cargas Sociales F.931 y Ganancias Sociedades F.713, e incluye el motor de exportación del Balance Oficial RT 54.',
    highlights: [
      {
        title: '① Exportador Excel Oficial RT 54 (.xlsx - 22 Hojas Tal Cual)',
        detail:
          'Genera en 1 clic el libro Excel completo con las 22 pestañas oficiales (Carátula, ESP, ER, ER-2, EEPN, EFE, Notas 22, BsUso, Activos Intangibles, Anexo IX de Gastos Art. 64, Costos e Informe del Auditor).',
        tag: '22 Hojas RT 54'
      },
      {
        title: '② Inspector Interactivo de Estados Contables y Cuadro de Gastos',
        detail:
          'Previsualizá en pantalla cada una de las 22 hojas del balance y auditá la matriz de gastos clasificada en Costos, Administración, Comercialización y Financieros.',
        tag: 'Auditoría Pre-Exportación'
      },
      {
        title: '③ Papeles de Trabajo y Liquidaciones ARCA por Cliente',
        detail:
          'El contador selecciona cualquiera de las empresas que le otorgaron consentimiento ("Cloud: Aceptado ✓") y descarga sus libros y declaraciones juradas listas para presentar.',
        tag: 'Portal Estudio Contable'
      }
    ],
    accountingImpact:
      'Mapeo 100% automatizado entre el Plan de Cuentas del ERP y los rubros oficiales de la Resolución Técnica N° 54 (FACPCE / CPCE).',
    images: [
      {
        src: '/tutorial/step_07_zondacloud_rt54.png',
        caption: 'Módulo 11 - Zonda Cloud con el Inspector de las 22 Hojas del Balance Oficial RT 54 y botón de descarga Excel (.xlsx)',
        badge: 'Vista A · Balance Oficial RT 54 (22 Hojas)',
        callouts: [
          {
            num: '1',
            label: 'Exportar Excel Oficial RT 54 (.xlsx)',
            desc: 'Descarga el archivo Excel idéntico al modelo profesional de 22 hojas.',
            top: '22%',
            left: '78%'
          },
          {
            num: '2',
            label: 'Selector de las 22 Hojas Oficiales',
            desc: 'Navegá por Carátula, ESP, ER, EEPN, EFE, Notas 22, BsUso y Costos.',
            top: '36%',
            left: '45%'
          },
          {
            num: '3',
            label: 'Sidebar ZONDA CLOUD',
            desc: 'Identidad dedicada cuando operás dentro del entorno Zonda Cloud.',
            top: '14%',
            left: '18%'
          }
        ]
      },
      {
        src: '/tutorial/step_07b_rt54_inspector.png',
        caption: 'Detalle en vivo del Estado de Evolución del Patrimonio Neto (EEPN), Flujo de Efectivo (EFE) y Anexo de Bienes de Uso',
        badge: 'Vista B · EEPN, EFE y Anexo Bs. de Uso',
        callouts: [
          {
            num: '1',
            label: 'Cifras Conectadas al Mayor Contable',
            desc: 'Comparativo Ejercicio Actual vs. Ejercicio Anterior conciliado.',
            top: '48%',
            left: '52%'
          },
          {
            num: '2',
            label: 'Control de Integridad RT 54',
            desc: 'Verifica ecuación patrimonial A = P + PN antes de exportar.',
            top: '28%',
            left: '75%'
          }
        ]
      }
    ]
  }
];

export const LOGIN_TUTORIAL_STORAGE_KEY = 'zonda_erp_hide_login_tutorial_v1';

interface TutorialInteractivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStepIndex?: number;
}

export const TutorialInteractivoModal: React.FC<TutorialInteractivoModalProps> = ({
  isOpen,
  onClose,
  initialStepIndex = 0
}) => {
  const { setActiveModule } = useErp();
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(initialStepIndex);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [showCallouts, setShowCallouts] = useState<boolean>(true);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [minimizedGuideMode, setMinimizedGuideMode] = useState<boolean>(false);
  const [dontShowOnLogin, setDontShowOnLogin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOGIN_TUTORIAL_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isOpen) {
      setActiveSlideIdx(0);
    }
  }, [currentStepIdx, isOpen]);

  // Navegación con flechas del teclado cuando el modal está expandido
  useEffect(() => {
    if (!isOpen || minimizedGuideMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && !lightboxOpen) {
        setCurrentStepIdx((prev) => (prev < TUTORIAL_STEPS.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft' && !lightboxOpen) {
        setCurrentStepIdx((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, minimizedGuideMode, lightboxOpen, onClose]);

  const handleToggleDontShow = (checked: boolean) => {
    setDontShowOnLogin(checked);
    try {
      if (checked) {
        localStorage.setItem(LOGIN_TUTORIAL_STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(LOGIN_TUTORIAL_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  };

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIdx] || TUTORIAL_STEPS[0];
  const currentSlide = currentStep.images[activeSlideIdx] || currentStep.images[0];
  const StepIcon = currentStep.icon;

  const handleProbarEnVivo = () => {
    setActiveModule(currentStep.moduleKey);
    setMinimizedGuideMode(true);
  };

  const handleIrAPaso = (idx: number) => {
    setCurrentStepIdx(idx);
    setActiveSlideIdx(0);
    if (minimizedGuideMode) {
      setActiveModule(TUTORIAL_STEPS[idx].moduleKey);
    }
  };

  // MODO GUÍA FLOTANTE EN VIVO (Permite usar el sistema real mientras el tutorial acompaña abajo a la izquierda)
  if (minimizedGuideMode) {
    return createPortal(
      <div className="fixed bottom-4 left-4 z-[9999] max-w-md w-full bg-white border-2 border-[#064e3b] shadow-2xl rounded-lg overflow-hidden font-sans text-xs animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-[#064e3b] text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-1.5 py-0.5 bg-emerald-400 text-[#042f22] font-extrabold text-[10px] rounded uppercase shrink-0">
              Paso {currentStep.stepNumber}/{TUTORIAL_STEPS.length}
            </span>
            <span className="font-bold truncate text-xs">{currentStep.title}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setMinimizedGuideMode(false)}
              title="Expandir Tutorial con Imágenes"
              className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded text-[10px] font-bold flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Ver Capturas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMinimizedGuideMode(false);
                onClose();
              }}
              title="Cerrar guía"
              className="p-1 text-emerald-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3.5 space-y-2.5 bg-[#f4fbf7]">
          <div className="flex items-center justify-between text-[11px] text-[#047857] font-bold">
            <span>Módulo activo: {currentStep.moduleLabel}</span>
            <span className="text-[10px] bg-emerald-100 text-[#064e3b] px-2 py-0.5 rounded border border-emerald-300">
              Modo Práctica en Vivo Activo
            </span>
          </div>
          <p className="text-[11px] text-[#042f22] leading-relaxed">{currentStep.summary}</p>
          <div className="space-y-1">
            {currentStep.highlights.map((h, i) => (
              <div
                key={i}
                className="p-1.5 bg-white border border-emerald-800/20 rounded text-[10px] text-[#042f22]"
              >
                <strong className="text-[#064e3b]">{h.title}:</strong> {h.detail}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-emerald-800/20 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={currentStepIdx === 0}
              onClick={() => handleIrAPaso(currentStepIdx - 1)}
              className="px-2.5 py-1.5 bg-white border border-emerald-800/30 text-[#042f22] font-bold rounded disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={() => setMinimizedGuideMode(false)}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-[#064e3b] font-bold rounded border border-emerald-400"
            >
              Volver al Tutorial Completo
            </button>

            {currentStepIdx < TUTORIAL_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => handleIrAPaso(currentStepIdx + 1)}
                className="px-2.5 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold rounded flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMinimizedGuideMode(false);
                  onClose();
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finalizar</span>
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-[#042f22]/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="bg-white border-2 border-[#064e3b] rounded-lg max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Cabecera Institucional del Tutorial */}
        <div className="bg-[#064e3b] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide uppercase">
                  Tutorial Interactivo de Inicio — Zonda ERP & Zonda Cloud
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-400 text-[#042f22] font-extrabold text-[10px] rounded uppercase">
                  <Sparkles className="w-3 h-3" /> Recorrido Visual Guiado
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Aprendé en 7 pasos visuales cómo operar Inventario, Compras, Ventas, Pagos Mixtos, Retenciones y el Balance Oficial RT 54
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#042f22] text-emerald-300 border border-emerald-700 font-mono font-bold text-[11px] rounded">
              Paso {currentStep.stepNumber} de {TUTORIAL_STEPS.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              title="Cerrar Tutorial (Esc)"
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Progreso de los 7 Pasos (Clickeable) */}
        <div className="bg-[#f4fbf7] border-b border-emerald-800/20 px-4 py-2.5 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 min-w-max">
            {TUTORIAL_STEPS.map((st, idx) => {
              const Icon = st.icon;
              const isCurrent = idx === currentStepIdx;
              const isCompleted = idx < currentStepIdx;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleIrAPaso(idx)}
                  className={`px-3 py-1.5 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    isCurrent
                      ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-sm font-bold'
                      : isCompleted
                      ? 'bg-emerald-50 text-[#042f22] border-emerald-400/60 hover:bg-emerald-100 font-semibold'
                      : 'bg-white text-slate-600 border-emerald-800/20 hover:bg-emerald-50/50'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-400 text-[#042f22]'
                        : isCompleted
                        ? 'bg-[#064e3b] text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCompleted ? '✓' : st.stepNumber}
                  </span>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] whitespace-nowrap">
                    {st.moduleLabel.split('·')[1]?.trim() || st.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cuerpo Principal: Izquierda Explicación y Acción en Vivo | Derecha Visor de Imágenes con Callouts */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white">
          {/* Columna Izquierda: Guía Paso a Paso (5 columnas) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 bg-emerald-100 text-[#064e3b] border border-emerald-300 font-bold text-[10px] uppercase rounded">
                  Módulo: {currentStep.moduleLabel}
                </span>
                <button
                  type="button"
                  onClick={handleProbarEnVivo}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Ir a esta pantalla y probar en vivo</span>
                </button>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#042f22] leading-snug flex items-center gap-2">
                  <StepIcon className="w-5 h-5 text-[#064e3b] shrink-0" />
                  <span>
                    Paso {currentStep.stepNumber}: {currentStep.title}
                  </span>
                </h2>
                <p className="text-xs font-semibold text-[#047857] mt-0.5">
                  {currentStep.subtitle}
                </p>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-[#f4fbf7] p-3 rounded-lg border border-emerald-800/20">
                {currentStep.summary}
              </p>

              {/* Puntos clave numerados */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-extrabold text-[#042f22] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#064e3b]" />
                  <span>Puntos Clave en la Imagen:</span>
                </div>
                {currentStep.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-emerald-800/25 rounded-lg shadow-2xs hover:border-[#064e3b] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-extrabold text-[#042f22] text-xs">{item.title}</span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-[#064e3b] border border-emerald-300 text-[9px] font-bold uppercase rounded shrink-0">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Caja de Impacto Contable y Trazabilidad */}
            <div className="p-3 bg-emerald-950 text-emerald-100 rounded-lg border border-emerald-700 space-y-1">
              <div className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trazabilidad e Impacto Contable Automático</span>
              </div>
              <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                {currentStep.accountingImpact}
              </p>
            </div>
          </div>

          {/* Columna Derecha: Visor Interactivo de Capturas Reales del Sistema (7 columnas) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Selector de Captura (Vista A / Vista B) + Controles de Callouts y Zoom */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5">
                {currentStep.images.map((img, sIdx) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => setActiveSlideIdx(sIdx)}
                    className={`px-3 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      activeSlideIdx === sIdx
                        ? 'bg-[#064e3b] text-white shadow-2xs'
                        : 'bg-white text-[#042f22] border border-slate-300 hover:bg-emerald-50'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{img.badge}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCallouts(!showCallouts)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                    showCallouts
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  {showCallouts ? 'Ocultar Indicadores ①②③' : 'Mostrar Indicadores ①②③'}
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#042f22] border border-slate-300 rounded text-[10px] font-bold flex items-center gap-1"
                  title="Ampliar imagen a pantalla completa"
                >
                  <Maximize2 className="w-3 h-3 text-[#064e3b]" />
                  <span>Ampliar Imagen</span>
                </button>
              </div>
            </div>

            {/* Contenedor de la Imagen con Callouts Interactivos */}
            <div className="relative rounded-lg border-2 border-emerald-900/30 bg-slate-900 overflow-hidden shadow-lg group flex-1 min-h-[300px] flex items-center justify-center">
              <img
                src={currentSlide.src}
                alt={currentSlide.caption}
                onClick={() => setLightboxOpen(true)}
                className="w-full h-auto max-h-[440px] object-contain cursor-zoom-in transition-transform duration-200"
              />

              {/* Badges de Callouts sobre la imagen */}
              {showCallouts &&
                currentSlide.callouts.map((c) => (
                  <div
                    key={c.num}
                    style={{ top: c.top, left: c.left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/pin"
                  >
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-[#042f22] border-2 border-white shadow-xl font-extrabold text-[11px] cursor-pointer hover:scale-105 transition-transform">
                      <span className="w-4 h-4 rounded-full bg-[#042f22] text-amber-300 flex items-center justify-center text-[10px]">
                        {c.num}
                      </span>
                      <span className="whitespace-nowrap hidden sm:inline">{c.label}</span>
                    </div>
                    <div className="hidden group-hover/pin:block absolute left-1/2 -translate-x-1/2 mt-1.5 w-56 p-2 bg-[#042f22] text-white text-[10px] rounded shadow-2xl border border-emerald-500 z-30 pointer-events-none">
                      <div className="font-bold text-amber-300 mb-0.5">
                        Punto {c.num}: {c.label}
                      </div>
                      <div>{c.desc}</div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Epígrafe de la captura + Tarjetas resumen de los Callouts */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#042f22]">
                  📸 {currentSlide.caption}
                </span>
                <span className="text-[10px] text-slate-500 shrink-0">
                  Clic en la imagen para ampliar
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {currentSlide.callouts.map((c) => (
                  <div
                    key={c.num}
                    className="p-2 bg-white rounded border border-emerald-800/20 flex items-start gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-[#042f22] font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {c.num}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[#042f22] text-[11px] truncate">{c.label}</div>
                      <div className="text-[10px] text-slate-600 leading-tight">{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pie del Modal: Checkbox de No volver a mostrar + Navegación Anterior / Siguiente */}
        <div className="bg-[#f4fbf7] border-t border-emerald-800/25 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#042f22] font-medium">
            <input
              type="checkbox"
              checked={dontShowOnLogin}
              onChange={(e) => handleToggleDontShow(e.target.checked)}
              className="w-4 h-4 accent-[#064e3b] rounded cursor-pointer"
            />
            <span>
              No volver a abrir automáticamente al iniciar sesión{' '}
              <span className="text-slate-500 text-[11px]">
                (Siempre disponible en el botón <strong>"🎓 Tutorial"</strong> de la barra superior)
              </span>
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStepIdx === 0}
              onClick={() => handleIrAPaso(currentStepIdx - 1)}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-[#042f22] border border-emerald-800/30 font-bold rounded-lg disabled:opacity-40 flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Paso Anterior</span>
            </button>

            <button
              type="button"
              onClick={handleProbarEnVivo}
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Modo Guía Flotante</span>
            </button>

            {currentStepIdx < TUTORIAL_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => handleIrAPaso(currentStepIdx + 1)}
                className="px-4 py-2 bg-[#064e3b] hover:bg-[#047857] text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Siguiente Paso ({currentStepIdx + 2}/{TUTORIAL_STEPS.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Comenzar a Operar Zonda ERP!</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox de Pantalla Completa para Inspeccionar la Captura en Alta Resolución */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 bg-black/90 z-60 flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="max-w-7xl w-full flex items-center justify-between text-white mb-3 px-2">
            <div>
              <span className="px-2 py-0.5 bg-emerald-500 text-[#042f22] font-extrabold text-xs rounded mr-2">
                Paso {currentStep.stepNumber} · {currentSlide.badge}
              </span>
              <span className="font-bold text-sm">{currentSlide.caption}</span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg font-bold text-xs flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cerrar Vista Ampliada (Esc)</span>
            </button>
          </div>
          <img
            src={currentSlide.src}
            alt={currentSlide.caption}
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg border-2 border-emerald-500/50 shadow-2xl"
          />
        </div>
      )}
    </div>,
    document.body
  );
};

