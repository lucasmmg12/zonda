# MANUAL 01: Tablero de Control (Dashboard), KPIs y Navegación General
> **Sistema:** Zonda ERP — Grow Labs / Ecosistema Sanatorio Argentino  
> **Código de Documento:** `MAN-01`  
> **Tablas Supabase Vinculadas:** `erp_comprobantes_venta`, `erp_comprobantes_compra`, `erp_cuentas_bancarias`, `erp_cheques`, `erp_asientos_contables`

---

## 1. Propósito del Módulo
El **Tablero de Control (Dashboard)** brinda una radiografía financiera y contable en tiempo real al iniciar el sistema. Todos los valores se calculan en vivo a partir de las operaciones registradas en **Supabase PostgreSQL (`dtjmckbrofevgfqbkzli`)**.

---

## 2. Elementos de la Barra Superior (`Header`)
1. **Indicador `SUPABASE DB: ONLINE`:**
   - Muestra el estado de sincronización con la base de datos en la nube (`https://dtjmckbrofevgfqbkzli.supabase.co`).
   - **Instrucción:** Haga clic sobre este botón en cualquier momento para refrescar manualmente las 14 tablas desde el servidor.
2. **Botón `MANUALES E INSTRUCCIONES`:**
   - Abre el Centro de Ayuda interactivo posicionado automáticamente en el manual del módulo que esté utilizando, con opción de imprimir o descargar en PDF.
3. **Botón `WS-AFIP` (ARCA Web Services):**
   - Abre la consola de certificados X.509 (`.crt` y `.key`) para facturación electrónica WSAA/WSFEv1.
4. **Botón `MP` (Mercado Pago API):**
   - Abre la consola de credenciales de Mercado Pago, URL de Webhook y Simulador de Pagos IPN en vivo.
5. **Buscador Global (`BUSCAR [CUIT / CLIENTE / ITEM]`):**
   - Escriba al menos 2 caracteres (nombre, CUIT, CUIL o código de artículo) para saltar directamente al registro buscado.

---

## 3. Instrucciones Paso a Paso del Tablero Principal

### Paso 1: Auditar los 4 KPIs Principales
- **Facturación Neta del Período:** Suma de comprobantes de venta emitidos y autorizados.
- **Compras y Gastos del Período:** Suma de facturas de proveedores devengadas.
- **Facturas a Cobrar (Cuentas por Cobrar):** Saldo pendiente de cobro en cuentas corrientes de clientes.
- **Facturas a Pagar (Cuentas por Pagar):** Deuda exigible con proveedores.
- **Acción rápida:** Haga clic sobre cualquiera de las tarjetas para abrir directamente el módulo de detalle correspondiente.

### Paso 2: Analizar Gráficos de Ingresos vs. Gastos y Liquidez
- Utilice los selectores de período (**6 Meses**, **Trimestre**, **Año**) arriba a la derecha del gráfico para comparar la evolución de ingresos frente a erogaciones.
- En el panel de **Disponibilidades (Cajas y Bancos)** verifique la liquidez inmediata consolidada.

### Paso 3: Ejecutar Acciones Rápidas o Exportar Resumen
- **Botón `+ Emitir Factura`:** Lo dirige al módulo Clientes abriendo el formulario de facturación electrónica ARCA.
- **Botón `Exportar Resumen (CSV / PDF)`:** Descarga una planilla Excel (`.csv`) o genera un reporte imprimible (`.pdf`) con el estado de resultados y saldos del día.

