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

* **Clientes (Facturación, Ventas, Descuento de Stock y Cobros Mixtos):**
  * Emisión y gestión de comprobantes electrónicos con autorización directa de **ARCA (ex-AFIP)** (Facturas A, B, C, M, Notas de Débito y Crédito) con código QR oficial RG 4892.
  * **Modalidad Dual de Venta:** en **Cuenta Corriente (Queda Pendiente)** o **⚡ Cancelación Al Contado en 1 Paso** (emite Factura + Recibo X simultáneamente dejando Saldo $0).
  * **Descuento Automático de Stock y CMV:** al incluir productos del inventario en la venta, descuenta unidades físicas del depósito y registra automáticamente el asiento de Costo de Mercaderías Vendidas (`5.1 Costo de Ventas` a `1.1.03 Bienes de Cambio`).
  * **⚡ Cobro Mixto Multi-Medio (`Recibo X`):** permite combinar múltiples medios en un mismo cobro (`Efectivo en Caja Central` + `Transferencia Santander/Galicia` + `Cheque / E-Cheq de Terceros` + `Tarjeta Posnet / Mercado Pago`) impactando cada cuenta bancaria/caja por separado.
  * **Retenciones Fiscales Sufridas:** cálculo automático de `IIBB (3%)`, `Ganancias (2%)`, `IVA` y `SUSS` con número de certificado e imputación en `2.1.02 Cargas Fiscales`.

* **Proveedores (Compras con Ingreso de Stock, Órdenes de Pago Mixtas y Retenciones ARCA):**
  * Registro de comprobantes de compras con escáner OCR IA por foto/cámara e imputación automática a cuentas de gasto o activación de `1.1.03 Bienes de Cambio (Inventario)`.
  * **Modalidad Dual de Compra:** **Cuenta Corriente** o **⚡ Cancelación Al Contado en 1 Paso** (Factura + Stock + Orden de Pago simultánea).
  * **⚡ Orden de Pago Mixta Multi-Medio y Plan de Cheques:** permite combinar `Efectivo` + `Transferencia Bancaria` + `Cheque Propio Diferido` + `Endoso de Cheque en Cartera` + `Tarjeta Corporativa` en una misma Orden de Pago, o dividir en cuotas con múltiples cheques diferidos.
  * **Retenciones Practicadas Conectadas a Zonda Cloud (ARCA):** cálculo en 1 clic de `IIBB (3%)`, `Ganancias RG 830 (2%)`, `IVA` y `SUSS`, sincronizadas con las liquidaciones impositivas.

* **Tesorería (Cajas, Bancos y Cartera de Cheques):**
  * Administración de múltiples entidades financieras (`CTA-01 CAJA en $`, `CTA-02 Banco Santander`, `CTA-03 Tarjeta de crédito`, `CTA-04 Banco Galicia`, `CTA-05 Cheques emitidos no debitados`) con trazabilidad por tramo `[Tramo X/N]`.
  * **Gestión Integral de Cheques:** Cartera de cheques de terceros recibidos (con trazabilidad a cliente y factura), endoso a proveedores en 1 clic y seguimiento de cheques propios diferidos.

* **Contabilidad General, Libros Legales y Balance Oficial RT 54 FACPCE (22 Hojas `.xlsx`):**
  * Plan de Cuentas contable jerárquico multinivel y Libro Diario General con partida doble estricta (`Debe = Haber`).
  * **Exportador de Balance Oficial RT 54 (`.xlsx` - 22 Hojas Tal Cual):** clona e inyecta en vivo los saldos del ERP en las 22 pestañas del modelo profesional de Estados Contables RT 54 (`CONTROLES`, `CARATULA`, `ESP`, `ER`, `EEPN`, `EFE`, `NOTAS`, `ANEXO VIII CMV`, `ANEXO IX Gastos Art. 64`, `BS USO`, `INV TRANS`, `CREDITOS`, `PASIVOS`, `CAJA Y BANCOS`, `FCI`).

* **Inventario y Stock con Alertas de Stock Crítico y Reposición en 1 Clic:**
  * Catálogo multidepósito con trazabilidad obligatoria de Proveedor y Factura en cada ingreso.
  * **⚠️ Alerta Automática de Stock Crítico / Negativo:** banner superior e indicador al facturar cuando `Disponible <= Stock Mínimo`, con botón **`⚡ Reponer en Proveedores`** que abre `03 - Proveedores` con la compra de reposición pre-cargada.

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


