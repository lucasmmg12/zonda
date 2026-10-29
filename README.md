# Zonda ERP - Sistema de Gestión Contable, Financiera y Auditoría
> **Grow Labs | Ecosistema Sanatorio Argentino**  
> **Versión:** 1.0.0  
> **Entorno Local:** `http://127.0.0.1:5173/`

---

## 1. ¿Qué es Zonda ERP?

**Zonda** es una suite moderna de gestión contable, administrativa y financiera concebida para la administración integral de PyMEs, prestadores y estudios contables, conectando los procesos operativos con la contabilidad formal en partida doble bajo los más altos estándares de calidad y auditoría médica de **Sanatorio Argentino**.

### Principales Módulos Operativos:

* **Tablero de Control (Dashboard):**
  * Indicadores clave de desempeño financiero (KPIs): facturación neta mensual, compras acumuladas, facturas pendientes de cobro y obligaciones pendientes de pago.
  * Gráficos dinámicos interactivos: "Ingresos vs. Gastos" y "Evolución de Cajas y Bancos" con segmentación mensual, trimestral y anual.
  * Guía rápida de operaciones y auditoría diaria paso a paso.

* **Clientes (Facturación, Ventas y Cobranzas):**
  * Emisión y gestión de comprobantes electrónicos con autorización directa de **AFIP** (Facturas A, B, C, M, Notas de Débito y Crédito, Presupuestos y Remitos).
  * Panel maestro-detalle con buscador en tiempo real de cuentas corrientes de clientes.
  * Registro de cobranzas multimoneda y pasarela de cobro digital.

* **Proveedores (Compras, Gastos y Pagos):**
  * Registro de comprobantes de compras e imputación automática por cuenta de gasto.
  * Cálculo y retenciones impositivas (IVA, Ganancias, Ingresos Brutos, SUSS).
  * Generación y liquidación de órdenes de pago con cheques, transferencias o efectivo.
  * Seguimiento de saldos y vencimientos en cuentas corrientes de proveedores.

* **Tesorería (Cajas, Bancos y Valores):**
  * Administración de múltiples entidades financieras (Cajas físicas en pesos/dólares, cuentas corrientes bancarias como Banco Santander, Banco Galicia, tarjetas corporativas).
  * **Gestión de Cheques:** Cartera de cheques recibidos, seguimiento de cheques diferidos propios, endosos, depósitos y canjes.
  * Conciliación bancaria contra extractos de cuentas y registro de transferencias internas.

* **Contabilidad General y Libros Legales:**
  * Plan de Cuentas contable jerárquico multinivel personalizable.
  * Generación automática de asientos contables a partir de comprobantes de ventas, compras y tesorería.
  * Balance de Sumas y Saldos, Libro Diario y Libro Mayor interactivo con trazabilidad hasta el comprobante de origen.
  * Balance matemático estricto: Debe = Haber.

* **Inventario y Stock:**
  * Catálogo de productos y servicios con control de stock y depósitos.
  * Cálculo de costos de reposición y margen bruto sobre precios netos.

* **Zonda Data Hub & Conector de Migración:**
  * Ingestión y mapeo de esquemas desde sistemas ERP legados hacia modelos tipados en TypeScript.
  * Motor de simulación **Dry-Run (Sandbox Activo)** para auditoría de integridad sin riesgos.
  * Bloqueo de seguridad estricto que protege entornos productivos externos.

---

## 2. Instrucciones e Indicaciones Operativas

Cada módulo de Zonda ERP cuenta con una **Guía Paso a Paso** integrada:

1. **Emisión de Comprobantes AFIP:**
   * **Paso 1:** Seleccione el tipo de comprobante (Factura A o B) e ingrese el CUIT del cliente (validado con algoritmo Módulo 11).
   * **Paso 2:** Ingrese el Neto Gravado en pesos; el sistema calcula alícuotas de IVA y total automáticamente.
   * **Paso 3:** Presione *"Autorizar en AFIP"* para obtener el CAE y registrar el asiento contable en el Libro Diario.

2. **Tesorería y Cheques:**
   * **Paso 1:** Ingrese cheques en cartera desde recibos de cobranza.
   * **Paso 2:** Al llegar al vencimiento, elija depositarlos en cuenta bancaria o endosarlos para saldar órdenes de compra.
   * **Paso 3:** Realice conciliaciones bancarias mensuales cargando extractos para contrastar contra saldos contables.

3. **Migración Segura (Data Hub):**
   * **Paso 1:** Configure el endpoint de la pasarela RPC de origen.
   * **Paso 2:** Seleccione las entidades contables a ingerir.
   * **Paso 3:** Ejecute la simulación Dry-Run para validar consistencia de datos en memoria local.

---

## 3. Stack Tecnológico

* **Build Tool & Framework:** **Vite** + **React 19** + **TypeScript**.
* **Estilizado & Diseño:** **Tailwind CSS** bajo la estética *"Limpia y Clínica QOAG"*:
  * Fondo blanco (`bg-white`), tipografía sans-serif Inter, acentos en Azul Institucional Sanatorio Argentino (`#005696`), bordes suaves (`rounded-lg`) y sombras sutiles.
* **Iconografía:** **Lucide React** con iconografía clínica y de negocios.

---

## 4. Módulo de Sueldos y Cargas Sociales (Argentina) & AFIP LSD

Zonda ERP incorpora un motor nativo de liquidación de haberes y exportación reglamentaria:

### Convenios Colectivos de Trabajo (CCT) Soportados:
1. **CCT 76/75 (UOCRA - Construcción):**
   * Básico por categoría, Adicional Asistencia Perfecta (20% sobre básico), Adicional Zona Desfavorable, Fondo de Cese Laboral (FOCER Ley 22.250) y cuota sindical delegación.
2. **CCT 130/75 (FAECYS - Comercio y Servicios):**
   * Básico mercantil, Presentismo Art. 40 (8.33% / una doceava parte), Antigüedad 1% anual acumulativo, y sumas no remunerativas homologadas.
3. **CCT 122/75 (FATSA / ATSA - Sanidad: Clínicas y Sanatorios):**
   * Básico asistencial (Sanatorio Argentino), Módulos de Guardias Críticas, Adicional Título Universitario, Tareas Riesgosas y Antigüedad 2% anual.
4. **Fuera de Convenio (Ley de Contrato de Trabajo 20.744):**
   * Topes previsionales SIPA fijados por ANSES/AFIP, retención automatizada de Impuesto a las Ganancias (4ta Categoría) y beneficios no remunerativos.

### Libro Sueldos Digital AFIP (Resolución General 3781):
* Generación directa del archivo plano posicional `.txt` (UTF-8 con saltos CRLF) estructurado con:
  * **Registro 01 (Cabecera):** CUIT empleador, período AAAAMM, tipo de liquidación mensual/quincenal, número de liquidación, días base (30) y cantidad de trabajadores.
  * **Registro 02 (Datos del Trabajador):** CUIL, CBU de acreditación (22 dígitos), días/horas trabajadas, fecha de pago y forma de pago bancaria.
  * **Registro 03 (Conceptos Homologados):** CUIL, código interno del concepto, cantidad/unidades, tipo (R = Remunerativo, N = No Remunerativo, D = Retención/Descuento), importe en centavos sin separadores decimales (15 posiciones fijas rellenas con ceros a la izquierda) y código oficial AFIP homologado (110000 sueldo básico, 130000 presentismo, 810000 jubilación SIPA, 810001 INSSJyP PAMI, 810002 Obra Social, etc.).
  * **Registro 04 (Bases Imponibles F.931):** Determinación de aportes y contribuciones de Seguridad Social (Base 1 SIPA, Base 2 PAMI, Base 4 Obra Social, Base 5 ART/LRT, y detracción Ley 27.430).
* Incluye botón de descarga directa de archivo `.txt` y previsualizador con validación de sintaxis en tiempo real.

---

## 5. Base de Datos Supabase PostgreSQL & Orquestación ARCA / Mercado Pago

Todo el sistema persiste en tiempo real sobre **Supabase PostgreSQL** (`https://dtjmckbrofevgfqbkzli.supabase.co`) y cuenta con dos **Supabase Edge Functions** listas para producción:

* **Webhook de Mercado Pago (`mercadopago-webhook`):**
  * **URL:** `https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-webhook`
  * Recibe notificaciones IPN/Webhooks de pagos aprobados, acredita automáticamente la cuenta en **Tesorería (`erp_cuentas_bancarias`)**, imputa la factura en **Clientes (`erp_comprobantes_venta`)**, genera el asiento en **Contabilidad (`erp_asientos_contables`)** y guarda el evento en `erp_webhooks_log`.
* **Puente Serverless ARCA WSAA / WSFEv1 (`arca-wsfe`):**
  * **URL:** `https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/arca-wsfe`
  * Gestiona la firma del Ticket de Requerimiento de Acceso (`TRA.xml`) y la solicitud de CAE (`FECAESolicitar`) ante ARCA (ex-AFIP) sin bloqueos CORS del navegador.

Consultá la guía completa paso a paso en [`INSTRUCCIONES_ARCA_MERCADOPAGO.md`](./INSTRUCCIONES_ARCA_MERCADOPAGO.md).


