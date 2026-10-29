# MANUAL INTEGRAL DE OPERACIÓN Y ARQUITECTURA — ZONDA ERP
> **Grow Labs // Ecosistema Sanatorio Argentino**  
> **Base de Datos Productiva:** Supabase PostgreSQL (`https://dtjmckbrofevgfqbkzli.supabase.co`)  
> **Web Services Oficiales:** ARCA (ex-AFIP) WSAA/WSFEv1 & Mercado Pago API + Webhooks IPN

---

## Índice General de Manuales Específicos (`docs/manuales/`)

Cada módulo del sistema cuenta con su propio manual detallado paso a paso tanto en la carpeta [`docs/manuales/`](./docs/manuales/) como dentro de la aplicación haciendo clic en el botón superior **`MANUALES E INSTRUCCIONES`**:

1. **[`01_MANUAL_DASHBOARD_Y_NAVEGACION.md`](./docs/manuales/01_MANUAL_DASHBOARD_Y_NAVEGACION.md)**
   - Tablero de Control Ejecutivo, lectura de KPIs financieros, buscador global inteligente, alertas de vencimientos y resincronización en tiempo real con Supabase.
2. **[`02_MANUAL_CLIENTES_FACTURACION_Y_COBRANZAS.md`](./docs/manuales/02_MANUAL_CLIENTES_FACTURACION_Y_COBRANZAS.md)**
   - Alta de Clientes, validación de CUIT (Módulo 11), emisión de Facturas A/B/C y Notas de Crédito con CAE de ARCA (14 dígitos), cobros con QR Interoperable / Link de Mercado Pago, Recibos X e impacto automático en Tesorería y Contabilidad.
3. **[`03_MANUAL_PROVEEDORES_COMPRAS_Y_PAGOS.md`](./docs/manuales/03_MANUAL_PROVEEDORES_COMPRAS_Y_PAGOS.md)**
   - Alta de Proveedores, carga de comprobantes de compra con discriminación de IVA Crédito Fiscal, seguimiento de cuentas por pagar y emisión de Órdenes de Pago.
4. **[`04_MANUAL_TESORERIA_BANCOS_Y_CHEQUES.md`](./docs/manuales/04_MANUAL_TESORERIA_BANCOS_Y_CHEQUES.md)**
   - Cuentas bancarias, cajas físicas, billeteras virtuales, movimientos de ingreso/egreso y administración de Cartera de Cheques (alta y depósito en 1 clic).
5. **[`05_MANUAL_CONTABILIDAD_Y_LIBROS_LEGALES.md`](./docs/manuales/05_MANUAL_CONTABILIDAD_Y_LIBROS_LEGALES.md)**
   - Plan de Cuentas jerárquico, Libro Diario, Libro Mayor, Balance de Sumas y Saldos y carga de Asientos Manuales con validación estricta de Partida Doble (`Debe = Haber`).
6. **[`06_MANUAL_INVENTARIO_Y_STOCK.md`](./docs/manuales/06_MANUAL_INVENTARIO_Y_STOCK.md)**
   - Catálogo de artículos e insumos, depósitos, alertas de Stock Mínimo (Punto de Pedido), Ajustes de Entrada/Salida y valuación patrimonial a costo de reposición.
7. **[`07_MANUAL_SUELDOS_CCT_Y_LIBRO_SUELDOS_DIGITAL_ARCA.md`](./docs/manuales/07_MANUAL_SUELDOS_CCT_Y_LIBRO_SUELDOS_DIGITAL_ARCA.md)**
   - Alta de Legajos, liquidación por Convenios Colectivos (UOCRA 76/75, Comercio 130/75, Sanidad 122/75, Fuera de Convenio), emisión de recibos de haberes y descarga del archivo posicional `.TXT` para **Libro de Sueldos Digital ARCA (RG 3781)** y **F.931**.
8. **[`08_MANUAL_CONFIGURACION_ARCA_MERCADOPAGO_Y_SUPABASE.md`](./docs/manuales/08_MANUAL_CONFIGURACION_ARCA_MERCADOPAGO_Y_SUPABASE.md)**
   - Parámetros fiscales de la empresa, Talonarios, Centros de Costo, guía de conexión **ARCA WSAA/WSFEv1 (`.key`/`.csr`/`.crt`)**, guía de conexión **Mercado Pago API + Webhooks** y diccionario de las **14 tablas en Supabase PostgreSQL**.

---

## Resumen Rápido de Circuito Operativo Integrado

```
[1. CLIENTES / VENTAS]
   └── Emite Factura A/B ──► Solicita CAE a ARCA (arca-wsfe)
                         ──► Guarda en erp_comprobantes_venta
                         ──► Suma saldo en erp_clientes
                         ──► Genera Asiento (Deudores a Ventas + IVA DF) en erp_asientos_contables

[2. COBRANZAS / WEBHOOK MERCADO PAGO]
   └── Cliente Paga QR/Link ─► Webhook (mercadopago-webhook) recibe notificación IPN
                            ─► Registra auditoría en erp_webhooks_log
                            ─► Acredita saldo en Tesorería (erp_cuentas_bancarias)
                            ─► Baja saldo del cliente (erp_clientes) y marca Factura "Pagada"
                            ─► Genera Asiento (Caja/Banco a Deudores por Ventas)

[3. PROVEEDORES / COMPRAS Y PAGOS]
   └── Carga Factura Compra ─► Guarda en erp_comprobantes_compra + suma deuda en erp_proveedores
                            ─► Genera Asiento (Gastos + IVA CF a Proveedores)
   └── Emite Orden de Pago  ─► Descuenta de erp_cuentas_bancarias + baja deuda en erp_proveedores
                            ─► Genera Asiento (Proveedores a Caja/Banco)

[4. SUELDOS Y CARGAS SOCIALES]
   └── Liquida Período AAAAMM ► Guarda en erp_liquidaciones
                              ► Genera Asiento (Sueldos y Cargas Sociales a Sueldos/Cargas a Pagar)
                              ► Exporta TXT posicional RG 3781 para Libro Sueldos Digital ARCA (F.931)
```

---

## Acceso Rápido a URLs de Producción Orquestadas

- **Proyecto Supabase PostgreSQL:** `https://dtjmckbrofevgfqbkzli.supabase.co`
- **Webhook Receptor de Mercado Pago (IPN / Webhooks):**
  ```text
  https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-webhook
  ```
- **Puente Serverless ARCA (ex-AFIP) WSAA / WSFEv1:**
  ```text
  https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/arca-wsfe
  ```

