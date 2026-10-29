# Mapeo Funcional End-to-End (Punta a Punta) y Auditoría Operativa — Zonda ERP

**Ecosistema:** Sanatorio Argentino / Grow Labs  
**Motor Operativo:** React 19 + TypeScript + Vite + Tailwind CSS + Supabase PostgreSQL (`dtjmckbrofevgfqbkzli`)  
**Resultado de Verificación E2E:** **26 / 26 Pruebas Exitosas (0 Errores)**  

---

## 1. Arquitectura Transversal y Barra Global (`Header.tsx` & `Sidebar.tsx`)

| Funcionalidad | Componente / Archivo | Impacto en Base de Datos / Servicio | Estado E2E |
| :--- | :--- | :--- | :--- |
| **Omnibuscador Global en Tiempo Real** | `src/components/layout/Header.tsx` | Filtra al instante por CUIT, Razón Social, SKU o Legajo en `clientes`, `proveedores`, `inventario` y `empleados` y navega al módulo correspondiente. | ✅ VERIFICADO |
| **Sincronizador Live con Supabase** | `src/components/layout/Header.tsx` (`SUPABASE DB: ONLINE`) | Ejecuta `refreshAllFromDb()` en `ErpContext.tsx` leyendo en paralelo las 14 tablas productivas de PostgreSQL. | ✅ VERIFICADO |
| **Centro de Manuales e Instrucciones Integrado** | `src/components/modals/ManualesCentroAyudaModal.tsx` | Abre los 11 manuales interactivos (`MAN-01` a `MAN-11`) con buscador, copiado de comandos y exportación PDF. | ✅ VERIFICADO |
| **Orquestador Rápido ARCA (`WS-AFIP`) y Mercado Pago (`MP`)** | `src/components/modals/ConexionesManagerModal.tsx` | Configura certificados `.crt`/`.key`, tokens MP, copia Webhook URL, simula cobros de $25.000 e inspecciona `erp_webhooks_log`. | ✅ VERIFICADO |
| **Centro de Alertas y Notificaciones Operativas** | `src/components/layout/Header.tsx` | Monitorea estado del motor transaccional Supabase, homologación ARCA y cobros IPN de Mercado Pago. | ✅ VERIFICADO |
| **Navegación Colapsable de 9 Módulos (`Sidebar`)** | `src/components/layout/Sidebar.tsx` | Conmutación instantánea sin recarga y telemetría de persistencia activa en PostgreSQL. | ✅ VERIFICADO |

---

## 2. Mapeo Punta a Punta de los 9 Módulos del Sistema

### MÓDULO 01 — Tablero de Control Financiero (`DashboardModule.tsx`)
1. **KPIs Ejecutivos Interactivos (4 Tarjetas con Drill-Down):**
   - **Facturación Ventas (AFIP):** Calcula el total facturado en vivo desde `erp_comprobantes_venta` y redirige a `02 - Clientes y Ventas`.
   - **Compras y Gastos:** Calcula erogaciones e IVA Crédito Fiscal desde `erp_comprobantes_compra` y redirige a `03 - Proveedores y Compras`.
   - **Disponibilidad Bancaria:** Suma saldos conciliados/actuales de `erp_cuentas_bancarias` y redirige a `04 - Tesorería y Cheques`.
   - **Cheques en Cartera:** Totaliza valores de terceros en `erp_cheques` y redirige a `04 - Tesorería y Cheques`.
2. **Protocolo de Auditoría Diaria en 4 Pasos:** Accesos directos guiados a Tesorería, Ventas AFIP, Compras y Libro Diario.
3. **Gráfico Comparativo de Flujo Operativo (6 Meses):** Barras dinámicas Ingresos vs. Egresos con cálculo de Resultado Neto del período.
4. **Panel de Posición Consolidada de Cajas y Bancos:** Vista rápida de saldos por cuenta (`CTA-01` a `CTA-05`).
5. **Reportería Ejecutiva:** Botones **Imprimir PDF** y **Descargar Excel Auditoría** con el resumen consolidado de todas las carteras.

---

### MÓDULO 02 — Clientes, Facturación Electrónica ARCA y Cobranzas (`ClientesModule.tsx`)
1. **Pestaña 1: Resumen Clientes (Master-Detail):**
   - Filtro instantáneo por **Activos / Inactivos / Todos** y buscador por CUIT o Razón Social.
   - **Sub-pestaña `Facturas adeudadas`:** Comprobantes pendientes de cobro con vencimiento, mora y saldo acumulado.
   - **Sub-pestaña `Cuenta cliente`:** Extracto histórico de Cuenta Corriente (`Debe`, `Haber`, `Saldo`) exportable a Excel.
   - **Sub-pestaña `Información general`:** CUIT, Condición IVA, Domicilio, Teléfono y Correo Electrónico.
   - **Sub-pestaña `Otra información`:** Lista de precios asignada, Límite de crédito y Vendedor.
2. **Emisión de Factura Electrónica con CAE (`Agregar factura`):**
   - Emite `Factura A`, `Factura B`, `Factura C`, `Nota de Crédito A` o `Nota de Débito A`.
   - Obtiene CAE (`744...` / WSFEv1), impacta `erp_comprobantes_venta`, actualiza `erp_clientes` y genera automáticamente el asiento en `erp_asientos_contables` (`1.1.02 Créditos por Ventas` a `4.1 Ingresos por Ventas` + `2.1.02 IVA Débito Fiscal`).
3. **Registración de Cobranza e Imputación FIFO (`Agregar cobro`):**
   - Emite `Recibo X`, cancela total o parcialmente las facturas más antiguas del cliente, acredita la cuenta en `erp_cuentas_bancarias` (o ingresa el cheque en `erp_cheques`) y genera el asiento en el Libro Diario (`1.1.01 Caja y Bancos` a `1.1.02 Créditos por Ventas`).
4. **Pestaña 2: Gestión de Clientes:** Padrón completo con alta de cliente (`Nuevo cliente`) y exportación masiva.
5. **Pestaña 3: Importación de Facturas y Padrón CSV:** Descarga de plantilla oficial `.CSV` e ingesta por lotes hacia `erp_clientes`.
6. **Pestaña 4: Mercado Pago / Cobros Online:**
   - Selección de cualquier factura pendiente para generar **Link de Pago Checkout Pro** (`/checkout/preferences`) y **QR Interoperable EMVCo Transferencias 3.0** con `notification_url` preconfigurada hacia el Webhook en Supabase.

---

### MÓDULO 03 — Proveedores, Compras y Cuentas por Pagar (`ProveedoresModule.tsx`)
1. **Pestaña 1: Resumen Proveedores (Master-Detail):**
   - Padrón con 48 proveedores reales precargados en `erp_proveedores`, filtro por estado y buscador.
   - **Sub-pestaña `Facturas pendientes de pago`:** Doble clic sobre cualquier comprobante pendiente para precargar su pago inmediato.
   - **Sub-pestaña `Cuenta corriente proveedor`:** Historial completo de facturas y órdenes de pago.
   - **Sub-pestaña `Información fiscal` y `Condiciones comerciales`:** Cuenta contable de gasto habitual y plazo de pago.
2. **Carga de Comprobante de Compra (`Agregar factura`):**
   - Registra `Factura A/B/C`, `Liquidación` o `Nota de Débito` con imputación al centro de gasto/costo.
   - Impacta `erp_comprobantes_compra`, incrementa el saldo acreedor en `erp_proveedores` y contabiliza el asiento (`5.1 Costos y Gastos` + `2.1.02 IVA Crédito Fiscal` a `2.1.01 Proveedores Comerciales`).
3. **Emisión de Orden de Pago (`Agregar pago`):**
   - Emite `Orden de Pago (OP)` mediante Transferencia Bancaria, Efectivo o **Cheque Propio Diferido** (dando de alta el cheque en `erp_cheques`), descuenta fondos de `erp_cuentas_bancarias` y contabiliza la baja de deuda (`2.1.01 Proveedores Comerciales` a `1.1.01 Caja y Bancos`).
4. **Pestaña 2: Gestión de Proveedores & Importación CSV:** Alta individual y carga masiva por archivo `.CSV`.

---

### MÓDULO 04 — Tesorería, Cajas, Bancos y Cartera de Cheques (`TesoreriaModule.tsx`)
1. **Gestión Multicuenta (`erp_cuentas_bancarias`):**
   - Administración de Cajas Físicas, Cuentas Corrientes Bancarias (Santander, Galicia), Fondos Fijos y Valores a Depositar.
   - Alta de nuevas cuentas (`Agregar cuenta`), edición de CBU/Alias (`Editar`) y **Conciliación Bancaria en 1 clic (`Conciliar`)** que iguala `saldo_conciliado = saldo_actual`.
2. **Gráfico Anual de Flujo de Fondos (Cashflow):** Evolución mensual/trimestral/anual de Ingresos, Egresos y Saldo Disponible.
3. **Cartera de Cheques y Custodia Interactiva (`erp_cheques`):**
   - Reportes dedicados: *Cheques en Cartera*, *Cheques Emitidos Diferidos* y *Seguimiento de Cheques*.
   - **Acción `Depositar` en 1 clic:** Permite depositar cualquier cheque `En Cartera` directamente en la cuenta bancaria activa, cambiando su estado a `Depositado`, acreditando el saldo bancario y registrando el asiento contable (`1.1.01 Caja y Bancos` a `1.1.01.03 Valores a Depositar`).
   - Calendario de vencimientos de cheques y exportación de dictamen en PDF.
4. **Operaciones Directas de Tesorería:** Botones `Pagos`, `Cobranzas` y `Depósitos / Extracciones / Canjes` con impacto directo en el extracto de movimientos.

---

### MÓDULO 05 — Contabilidad General, Plan de Cuentas y Libros (`ContabilidadModule.tsx`)
1. **Pestaña 1: Panel de Cuentas y Libro Mayor (`erp_plan_cuentas`):**
   - **Árbol Jerárquico Multinivel (Tree View):** Explora `1 - ACTIVO`, `2 - PASIVO`, `3 - PATRIMONIO NETO`, `4 - INGRESOS` y `5 - EGRESOS` con saldos acumulados en tiempo real.
   - **ABM de Cuentas Contables:** Edición de nombre, rubro e imputabilidad (`Guardar Cambios`) y creación de nuevas subcuentas (`Nueva Subcuenta`).
   - **Libro Mayor por Cuenta:** Filtra todos los pases contables de la cuenta seleccionada con cálculo de saldo progresivo y exportación a Excel.
2. **Pestaña 2: Libro Diario General (`erp_asientos_contables`):**
   - Visualización de todos los asientos automáticos (`FAC`, `REC`, `PAG`, `DEP`, `LIQ`, `MP`) y manuales (`MAN`).
   - **Registración de Asiento Manual (`Nuevo asiento a diario`):** Validador estricto de Partida Doble (`Total Debe === Total Haber`) que actualiza los saldos del Plan de Cuentas y persiste en PostgreSQL.
   - **Cierres Contables y Exportación de Balance de Sumas y Saldos (PDF y Excel).**

---

### MÓDULO 06 — Inventario, Kardex Físico/Valorizado y Listas de Precios (`InventarioModule.tsx`)
1. **Pestaña 1: Items de Inventario (`erp_inventario`):**
   - Catálogo maestro de insumos médicos, materiales y servicios con alertas visuales de **Stock Crítico (`stock_actual <= stock_minimo`)**.
   - **Kardex de Movimientos por Artículo:** Historial detallado de entradas y salidas (`INI`, `REM`, `FAC`, `AJU`) con depósito, costo y cantidad.
   - **Ficha Técnica e Imputación Contable:** Configuración de cuentas de Activo (Inventario), Costo (CMV) e Ingresos (Ventas).
   - **Operaciones:** `Agregar Item`, `Movimiento de Stock` (Ingreso/Egreso/Ajuste), `Actualizar precios` (% masivo en toda la base) e `Importar CSV`.
2. **Pestaña 2: Configuración de Inventario:** Método de costeo (PPP / UEPS / PEPS), bloqueo de stock negativo y depósitos habilitados.
3. **Pestaña 3: Listas de Precios Dinámicas:** Simulación y exportación de listas *Corporativa (-10%)*, *Minorista (+25%)* y *Mayorista (+10%)* con IVA discriminado y precio final.

---

### MÓDULO 07 — Sueldos, Legajos, F.931 y Libro de Sueldos Digital AFIP (`SueldosModule.tsx`)
1. **Pestaña 1: Liquidación y Recibos de Sueldo (`erp_empleados` & `erp_liquidaciones`):**
   - Selección de legajo y previsualización en vivo del **Recibo de Haberes Oficial Ley 20.744** con haberes remunerativos (Sueldo Básico, Antigüedad, Presentismo CCT), retenciones de ley (Jubilación 11%, Ley 19.032 3%, Obra Social 3%, Sindicato) y Neto a Cobrar.
   - Impresión individual de Recibo en PDF (`Imprimir Recibo PDF`), ejecución de `Nueva liquidación` (con asiento contable de devengamiento de sueldos y cargas patronales) y resumen de **Cargas Sociales F.931 (SUSS)**.
2. **Pestaña 2: Nómina de Legajos:** Alta de empleados (`Nuevo legajo (Alta AFIP)`) con CUIL, Categoría, Convenio Colectivo, Obra Social y CBU.
3. **Pestaña 3: Convenios CCT y Fórmulas:** Parámetros de cálculo para CCT 130/75 (Comercio), CCT 76/75 (UOCRA), CCT 122/75 (Sanidad / ATSA) y Fuera de Convenio.
4. **Pestaña 4: Libro de Sueldos Digital AFIP (`TXT RG 3781`):**
   - Generador posicional de registros `01` (Cabecera), `02` (Datos del Legajo), `03` (Conceptos Liquidados) y `04` (Atributos de Seguridad Social) listo para copiar o descargar como archivo `.TXT` para subir a ARCA.

---

### MÓDULO 08 — Centro de Migración ERP Dry-Run (`MigrationHubModule.tsx`)
1. **Conector de Pasarela ERP:** Configuración de endpoint origen, credenciales y selección de las 9 entidades maestras.
2. **Motor de Simulación Protegida (Dry-Run):** Audita miles de registros validando CUITs (Módulo 11) y cuadres de Partida Doble sin contaminar las tablas productivas.
3. **Informe de Viabilidad Exportable:** Tabla de resultados por entidad, reglas de transformación de esquemas y botones **Exportar Excel** e **Imprimir PDF Auditoría**.

---

### MÓDULO 09 — Configuración Fiscal, Talonarios e Integraciones (`ConfiguracionModule.tsx`)
1. **8 Pestañas de Parametrización Corporativa (`erp_empresa` & `erp_integraciones_config`):**
   - `Datos generales`, `Datos Impositivos` (CUIT, Condición IVA, IIBB, Punto de Venta), `Clientes/Proveedores`, `Talonarios`, `Integraciones AFIP & Mercado Pago`, `Portal Clientes`, `Tesorería` y `Centros de Costos`.
2. **Panel de Orquestación ARCA + Mercado Pago + Monitor de Webhooks:**
   - Guardado persistente en `erp_integraciones_config` y visor en vivo de los eventos recibidos en `erp_webhooks_log`.
