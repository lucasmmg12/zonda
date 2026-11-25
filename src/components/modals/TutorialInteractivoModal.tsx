import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  GraduationCap,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Maximize2,
  CheckCircle2,
  Layers,
  Package,
  ShoppingCart,
  Receipt,
  CreditCard,
  Landmark,
  Cloud,
  FileMinus2,
  Calculator,
  FileSpreadsheet,
  Store,
  Search
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
  },
  {
    stepNumber: 8,
    id: 'step-notas-credito-debito',
    title: 'Cómo Emitir Notas de Crédito y Débito (NC / ND)',
    subtitle: 'Anulá saldos de facturas, reversá IVA y reingresá mercadería devuelta al stock',
    moduleKey: 'clientes',
    moduleLabel: '02 · Notas de Crédito / Débito',
    icon: FileMinus2,
    summary:
      'Cuando necesitás anular parcialmente o totalmente una factura, aplicar una bonificación o cobrar intereses, usá el botón "NC / ND" desde Clientes o Proveedores. Zonda ERP descuenta el saldo de la factura original, reversa el IVA y opcionalmente devuelve la mercadería al Inventario.',
    highlights: [
      {
        title: '① Elegí el Tipo de Comprobante y la Factura Asociada',
        detail:
          'Seleccioná Nota de Crédito A/B o Nota de Débito y vinculala a una factura impaga para que el saldo adeudado se actualice automáticamente.',
        tag: 'Cuenta Corriente'
      },
      {
        title: '② Ingresá el Neto Gravado (Cálculo automático de IVA 21%)',
        detail:
          'El sistema calcula el IVA y el total en tiempo real. Si elegís una factura asociada, podés precargar su saldo exacto.',
        tag: 'ARCA / IVA'
      },
      {
        title: '③ Tildá "Reingresar mercadería devuelta al Inventario"',
        detail:
          'Si el cliente devolvió productos físicos, activá esta casilla para sumar nuevamente las unidades al depósito con trazabilidad en el Kardex.',
        tag: 'Stock Automático'
      }
    ],
    accountingImpact:
      'Genera el asiento contable de reversión (Ventas e IVA Débito al Debe vs. Deudores por Ventas al Haber) y actualiza la Posición Impositiva Mensual.',
    images: [
      {
        src: '/tutorial/step_08_clientes_nc_nd.png',
        caption: 'Cómo cargar una Nota de Crédito / Débito vinculada a una factura impaga desde Clientes',
        badge: 'Vista A · Modal NC / ND',
        callouts: [
          {
            num: '1',
            label: 'Tipo NC/ND y Factura Asociada',
            desc: 'Elegí Nota de Crédito A/B o Débito y vinculá la factura que querés ajustar.',
            top: '34%',
            left: '50%'
          },
          {
            num: '2',
            label: 'Neto, IVA 21% y Total en Vivo',
            desc: 'Ingresá el neto gravado; el sistema calcula IVA 21% y el total automáticamente.',
            top: '44%',
            left: '50%'
          },
          {
            num: '3',
            label: 'Reingreso de Stock + Confirmar',
            desc: 'Tildá para devolver stock al depósito y pulsá Confirmar Nota de Crédito.',
            top: '62%',
            left: '52%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 9,
    id: 'step-posicion-impositiva',
    title: 'Cómo Calcular la Posición Impositiva Mensual (IVA F.2002)',
    subtitle: 'Liquidación mensual automática de Débito, Crédito Fiscal, Retenciones y Percepciones',
    moduleKey: 'contabilidad',
    moduleLabel: '05 · Posición Impositiva',
    icon: Calculator,
    summary:
      'Desde Contabilidad pulsá el botón "Posición Impositiva" para conocer en segundos cuánto IVA tenés a pagar o a favor en cualquier mes, contemplando Facturas, Notas de Crédito y todas las retenciones/percepciones sufridas.',
    highlights: [
      {
        title: '① Seleccioná el Período Fiscal (Mes y Año)',
        detail:
          'Cambiá el selector de período para recalcular al instante todos los comprobantes de venta y compra imputados en ese mes.',
        tag: 'Período Mensual'
      },
      {
        title: '② Compará Débito Fiscal vs. Crédito Fiscal (Neto de NC)',
        detail:
          'Visualizá el total de ventas netas, compras netas y el IVA discriminado, descontando automáticamente las Notas de Crédito emitidas y recibidas.',
        tag: 'IVA Neto'
      },
      {
        title: '③ Saldo Técnico, Libre Disponibilidad y Exportar CSV',
        detail:
          'Descuenta Retenciones/Percepciones de IVA sufridas para mostrar el Saldo a Pagar (F.2002) o Saldo a Favor, listo para descargar en CSV.',
        tag: 'Exportación ARCA'
      }
    ],
    accountingImpact:
      'Se nutre en tiempo real de Comprobantes de Venta, Compras y Asientos de Retenciones sin cargas duplicadas.',
    images: [
      {
        src: '/tutorial/step_09_posicion_impositiva.png',
        caption: 'Consola de Posición Impositiva Mensual en Contabilidad (IVA Débito, Crédito y Retenciones)',
        badge: 'Vista A · Posición Mensual',
        callouts: [
          {
            num: '1',
            label: 'Selector de Período Fiscal',
            desc: 'Elegí cualquier mes (YYYY-MM) para auditar ventas y compras del período.',
            top: '30%',
            left: '42%'
          },
          {
            num: '2',
            label: 'Débito vs. Crédito Fiscal',
            desc: 'Totales gravados e IVA neteado automáticamente de Notas de Crédito.',
            top: '41%',
            left: '50%'
          },
          {
            num: '3',
            label: 'Saldo Final y Exportar CSV',
            desc: 'Saldo a Pagar o Libre Disponibilidad + descarga inmediata en CSV.',
            top: '64%',
            left: '56%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 10,
    id: 'step-conciliacion-csv',
    title: 'Cómo Hacer Conciliación Bancaria por Extracto CSV',
    subtitle: 'Subí tu extracto del Homebanking y cruzá movimientos automáticamente',
    moduleKey: 'tesoreria',
    moduleLabel: '04 · Conciliación Bancaria CSV',
    icon: FileSpreadsheet,
    summary:
      'En Tesorería, hacé clic en "Conciliar" sobre cualquier banco o caja para importar el archivo CSV de tu homebanking. El motor detecta coincidencias exactas por importe y fecha (±3 días) y actualiza el Saldo Conciliado.',
    highlights: [
      {
        title: '① Subí el CSV del Banco o Usá el Simulador Homebanking',
        detail:
          'Admite archivos CSV argentinos (fechas DD/MM/YYYY y decimales con coma) de Galicia, Santander, Nación, Macro y otros.',
        tag: 'Importador CSV'
      },
      {
        title: '② Revisá las Coincidencias Exactas Sugeridas',
        detail:
          'A la izquierda ves el extracto del banco y a la derecha tus movimientos en Zonda ERP con las coincidencias ya marcadas ("Match Exacta").',
        tag: 'Matching Automático'
      },
      {
        title: '③ Confirmá la Conciliación',
        detail:
          'Al confirmar, los movimientos quedan marcados como conciliados y se actualiza el Saldo Conciliado oficial de la cuenta.',
        tag: 'Auditoría Bancaria'
      }
    ],
    accountingImpact:
      'Mantiene auditado el Saldo Contable frente al Saldo Conciliado real en cada cuenta bancaria de Tesorería.',
    images: [
      {
        src: '/tutorial/step_10_conciliacion_csv.png',
        caption: 'Conciliación Bancaria por Extracto CSV con detección automática de coincidencias en Tesorería',
        badge: 'Vista A · Cruce CSV',
        callouts: [
          {
            num: '1',
            label: 'Subir Extracto CSV / Simulador',
            desc: 'Cargá el CSV descargado de tu homebanking para iniciar el cruce.',
            top: '29%',
            left: '34%'
          },
          {
            num: '2',
            label: 'Match Exacta Automático',
            desc: 'Cruza importe exacto y fecha (±3 días) tildando las coincidencias en azul.',
            top: '45%',
            left: '52%'
          },
          {
            num: '3',
            label: 'Confirmar Conciliación',
            desc: 'Guarda los movimientos conciliados y actualiza el Saldo Conciliado.',
            top: '78%',
            left: '73%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 11,
    id: 'step-ecommerce-admin-variantes',
    title: 'Cómo Crear tu Tienda Ecommerce y Productos con Variantes',
    subtitle: 'Armá tu tienda online estilo Tiendanube con variantes Talle × Color vinculadas al Stock',
    moduleKey: 'ecommerce',
    moduleLabel: '12 · Ecommerce (Admin y Variantes)',
    icon: Store,
    summary:
      'Desde el módulo 12 · Ecommerce cada empresa administra su propia tienda online. Podés personalizar colores y logo, importar productos del inventario y generar matrices de variantes (ej. Talle × Color) con SKU y stock propio.',
    highlights: [
      {
        title: '① Copiá el Link Público o Abrí tu Tienda en Vivo',
        detail:
          'Cada empresa tiene su URL pública aislada (/?tienda=tu-empresa) lista para compartir por WhatsApp o Instagram, más una Vista Previa en vivo.',
        tag: 'Multi-Tenant Shop'
      },
      {
        title: '② Configurá Pestañas Estilo Tiendanube',
        detail:
          'Organizá Pedidos, Productos y Variantes, Diseño de Tienda, Medios de Pago (Mercado Pago / Transferencia) y Cupones desde un solo lugar.',
        tag: 'Panel Tiendanube'
      },
      {
        title: '③ Generá Matrices de Variantes (Talle, Color, Presentación)',
        detail:
          'Agregá atributos separados por coma y pulsá "+ Generar": el sistema crea todas las combinaciones con SKU, precio y stock individual.',
        tag: 'Variantes + Stock'
      }
    ],
    accountingImpact:
      'Al vincular un producto de la tienda a un artículo de 06 · Inventario, cada venta online descuenta stock real y genera CMV.',
    images: [
      {
        src: '/tutorial/step_11_ecommerce_admin.png',
        caption: 'Panel Administrador 12 · Ecommerce con accesos a link público, pestañas y KPIs de tienda',
        badge: 'Vista A · Panel Admin',
        callouts: [
          {
            num: '1',
            label: 'Copiar Link / Abrir Tienda',
            desc: 'Compartí tu URL pública /?tienda=<slug> o probá la tienda en vivo.',
            top: '18%',
            left: '36%'
          },
          {
            num: '2',
            label: 'Menú Estilo Tiendanube',
            desc: 'Cambiá entre Pedidos, Productos y Variantes, Diseño, Pagos y Cupones.',
            top: '26%',
            left: '48%'
          },
          {
            num: '3',
            label: 'KPIs Online en Tiempo Real',
            desc: 'Ventas aprobadas, pedidos recibidos, productos y compradores Google.',
            top: '35%',
            left: '50%'
          }
        ]
      },
      {
        src: '/tutorial/step_11b_ecommerce_variantes.png',
        caption: 'Generador de Matriz de Variantes multi-atributo (Talle × Color) vinculado al Inventario ERP',
        badge: 'Vista B · Variantes',
        callouts: [
          {
            num: '1',
            label: 'Vincular a Inventario ERP',
            desc: 'Conectá el producto online con tu depósito real para descontar stock.',
            top: '41%',
            left: '66%'
          },
          {
            num: '2',
            label: 'Atributos + Botón Generar',
            desc: 'Escribí Talle / Color y valores separados por coma para crear la matriz.',
            top: '51%',
            left: '69%'
          },
          {
            num: '3',
            label: 'SKU, Precio y Stock por Variante',
            desc: 'Editá el stock y precio exacto de cada combinación antes de guardar.',
            top: '63%',
            left: '48%'
          }
        ]
      }
    ]
  },
  {
    stepNumber: 12,
    id: 'step-ecommerce-compra-google-erp',
    title: 'Cómo Compran tus Clientes (Google Auth + Pago Directo) y Sync ERP',
    subtitle: 'Experiencia de compra pública con Google Auth obligatorio, pagos online y facturación automática',
    moduleKey: 'ecommerce',
    moduleLabel: '12 · Storefront y Pedidos ERP',
    icon: ShoppingCart,
    summary:
      'Tus clientes navegan tu tienda pública sin ver el ERP, eligen variantes, ingresan obligatoriamente con su cuenta de Google y pagan con Mercado Pago, Transferencia o Efectivo. Cada pago aprobado impacta automáticamente en Clientes, Stock, Facturación, Tesorería y Libro Diario.',
    highlights: [
      {
        title: '① Storefront Público Aislado con Selector de Variantes',
        detail:
          'El comprador filtra por categoría, elige la variante (ej. L / Blanco) con stock disponible en vivo y agrega al carrito deslizable.',
        tag: 'Tienda Pública'
      },
      {
        title: '② Checkout con Google Auth, Cupones y Pagos Directos',
        detail:
          'Al finalizar compra se exige Google Auth, se pueden aplicar cupones (% OFF) y pagar con Mercado Pago o Transferencia Bancaria (con descuento extra).',
        tag: 'Google Auth + Pagos'
      },
      {
        title: '③ Aprobación y Facturación Automática en el ERP',
        detail:
          'Los pagos por Mercado Pago se facturan al instante; las transferencias se aprueban en 1 clic desde Pedidos generando cliente, factura y asiento contable.',
        tag: 'Sync 100% ERP'
      }
    ],
    accountingImpact:
      'Crea el cliente en 02 · Clientes, emite Factura B + Recibo X, descuenta stock en 06 · Inventario y genera el asiento de Venta + CMV en 05 · Contabilidad.',
    images: [
      {
        src: '/tutorial/step_12_ecommerce_storefront.png',
        caption: 'Tienda Pública (/?tienda=<slug>) con banner, categorías, buscador y productos con variantes',
        badge: 'Vista A · Storefront',
        callouts: [
          {
            num: '1',
            label: 'Google Auth y Carrito',
            desc: 'Ingreso del comprador con Google y carrito en tiempo real.',
            top: '11%',
            left: '79%'
          },
          {
            num: '2',
            label: 'Filtros por Categoría y Ofertas',
            desc: 'Navegación rápida por rubros y solo ofertas activas.',
            top: '53%',
            left: '34%'
          },
          {
            num: '3',
            label: 'Botón Elegir Variante',
            desc: 'Abre el selector interactivo de Talle/Color con stock real.',
            top: '92%',
            left: '24%'
          }
        ]
      },
      {
        src: '/tutorial/step_12b_ecommerce_checkout_google.png',
        caption: 'Checkout con Google Auth verificado, aplicación de cupones y medios de pago directos',
        badge: 'Vista B · Checkout',
        callouts: [
          {
            num: '1',
            label: 'Entrega (Retiro o Envío)',
            desc: 'Elegí retiro en sucursal gratis o envío a domicilio/correo.',
            top: '21%',
            left: '36%'
          },
          {
            num: '2',
            label: 'Medios de Pago Directos',
            desc: 'Mercado Pago (tarjetas/cuotas), Transferencia con % OFF o Efectivo.',
            top: '48%',
            left: '36%'
          },
          {
            num: '3',
            label: 'Cupón + Total y Confirmar',
            desc: 'Descuento acumulado de cupón + transferencia calculado al instante.',
            top: '28%',
            left: '66%'
          }
        ]
      },
      {
        src: '/tutorial/step_12c_ecommerce_pedidos_erp.png',
        caption: 'Bandeja de Pedidos en 12 · Ecommerce mostrando pedido aprobado y facturado en Zonda ERP',
        badge: 'Vista C · Sync ERP',
        callouts: [
          {
            num: '1',
            label: 'Comprador Google Verificado',
            desc: 'Nombre, email de Google y DNI/CUIT sincronizados con 02 · Clientes.',
            top: '44%',
            left: '32%'
          },
          {
            num: '2',
            label: 'Variante Vendida y Estado Pago',
            desc: 'Detalle exacto de variante (L / Blanco) y medio de pago aprobado.',
            top: '44%',
            left: '58%'
          },
          {
            num: '3',
            label: 'Comprobante Emitido en ERP',
            desc: 'Badge "✓ Facturado" confirmando factura, stock y asiento contable.',
            top: '44%',
            left: '93%'
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
  const [activeCalloutNum, setActiveCalloutNum] = useState<string | null>('1');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      setActiveCalloutNum('1');
    }
  }, [currentStepIdx, isOpen]);

  useEffect(() => {
    setActiveCalloutNum('1');
  }, [activeSlideIdx]);

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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Cabecera Minimalista (1 sola línea) */}
        <div className="bg-[#064e3b] text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-300 shrink-0" />
            <span className="font-bold text-sm tracking-tight">Guía Visual Interactiva</span>
            <span className="text-[11px] text-emerald-200 font-mono">
              ({currentStep.stepNumber}/{TUTORIAL_STEPS.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-emerald-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tema (ej. factura, banco, variantes)..."
                className="pl-8 pr-3 py-1 bg-[#042f22] text-white placeholder-emerald-300/70 border border-emerald-700 rounded-lg text-[11px] w-60 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Cerrar (Esc)"
              className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selector Compacto de Tutoriales */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 min-w-max">
            {TUTORIAL_STEPS.map((st, idx) => {
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const match =
                  st.title.toLowerCase().includes(q) ||
                  st.moduleLabel.toLowerCase().includes(q) ||
                  st.summary.toLowerCase().includes(q);
                if (!match) return null;
              }
              const isCurrent = idx === currentStepIdx;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleIrAPaso(idx)}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-all flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-[#064e3b] text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-80">{st.stepNumber}.</span>
                  <span className="whitespace-nowrap">
                    {st.moduleLabel.split('·')[1]?.trim() || st.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cuerpo Limpio: 4 cols pasos cortos | 8 cols captura protagonista */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-white items-start">
          {/* Izquierda: Solo Título + 3 Pasos Acordeón + Botón Probar */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-snug flex items-center gap-2">
                  <StepIcon className="w-4 h-4 text-[#064e3b] shrink-0" />
                  <span>{currentStep.title}</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tocá un número para verlo señalado en la pantalla:
                </p>
              </div>

              <div className="space-y-2">
                {currentSlide.callouts.map((c) => {
                  const isFocused = activeCalloutNum === c.num;
                  return (
                    <button
                      key={c.num}
                      type="button"
                      onClick={() => {
                        setShowCallouts(true);
                        setActiveCalloutNum(c.num);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isFocused
                          ? 'bg-amber-50 border-amber-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                            isFocused
                              ? 'bg-amber-400 text-slate-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.num}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{c.label}</span>
                      </div>
                      {isFocused && (
                        <p className="text-[11px] text-slate-700 mt-2 pl-8 leading-relaxed">
                          {c.desc}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleProbarEnVivo}
              className="w-full py-2.5 px-4 bg-[#064e3b] hover:bg-[#047857] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Ir a esta pantalla y probar</span>
            </button>
          </div>

          {/* Derecha: Captura Grande y Despejada con Pines Circulares Limpios */}
          <div className="lg:col-span-8 flex flex-col space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {currentStep.images.length > 1 &&
                  currentStep.images.map((img, sIdx) => (
                    <button
                      key={img.src}
                      type="button"
                      onClick={() => setActiveSlideIdx(sIdx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        activeSlideIdx === sIdx
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {img.badge}
                    </button>
                  ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCallouts(!showCallouts)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  {showCallouts ? 'Ocultar puntos' : 'Mostrar puntos'}
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ampliar</span>
                </button>
              </div>
            </div>

            {/* Imagen protagonista sin ruido */}
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm flex items-center justify-center">
              <img
                src={currentSlide.src}
                alt={currentSlide.caption}
                onClick={() => setLightboxOpen(true)}
                className="w-full h-auto max-h-[500px] object-contain cursor-zoom-in"
              />

              {/* Pines circulares limpios: solo el activo muestra etiqueta corta */}
              {showCallouts &&
                currentSlide.callouts.map((c) => {
                  const isFocused = activeCalloutNum === c.num;
                  return (
                    <button
                      key={c.num}
                      type="button"
                      style={{ top: c.top, left: c.left }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCalloutNum(c.num);
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all flex items-center gap-1.5 rounded-full border-2 border-white shadow-lg ${
                        isFocused
                          ? 'z-30 bg-amber-400 text-slate-950 px-2.5 py-1 scale-110 ring-4 ring-amber-400/50 font-extrabold text-[11px]'
                          : 'z-20 w-7 h-7 justify-center bg-[#064e3b] text-white hover:scale-110 font-extrabold text-xs'
                      }`}
                    >
                      <span
                        className={
                          isFocused
                            ? 'w-4 h-4 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center text-[10px]'
                            : ''
                        }
                      >
                        {c.num}
                      </span>
                      {isFocused && <span className="whitespace-nowrap">{c.label}</span>}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Pie Minimalista */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={dontShowOnLogin}
              onChange={(e) => handleToggleDontShow(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#064e3b] rounded"
            />
            <span>No abrir automáticamente al iniciar</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStepIdx === 0}
              onClick={() => handleIrAPaso(currentStepIdx - 1)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            {currentStepIdx < TUTORIAL_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => handleIrAPaso(currentStepIdx + 1)}
                className="px-4 py-1.5 bg-[#064e3b] hover:bg-[#047857] text-white font-bold rounded-lg flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
              >
                Listo
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

