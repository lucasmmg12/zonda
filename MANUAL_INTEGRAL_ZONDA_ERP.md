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

## Resumen Rápido de Circuito Operativo Integrado (Trazabilidad 360°)

```
[1. CLIENTES / VENTAS + DESCUENTO DE STOCK + CMV AUTOMÁTICO]
   └── Emite Factura A/B ──► Solicita CAE a ARCA (arca-wsfe)
                         ──► Guarda en erp_comprobantes_venta
                         ──► Descuenta unidades de erp_inventario + registra salida en Kárdex
                         ──► Genera Asiento Venta + Asiento CMV (Debe 5.1 Costo Ventas / Haber 1.1.03 Bienes de Cambio)
                         ──► Modalidad Dual:
                               ├─ Cuenta Corriente: Queda Pendiente en erp_clientes
                               └─ ⚡ Cancelación Al Contado (1 Paso): Emite Recibo X simultáneamente (Saldo $0)

[2. COBRANZAS SIMPLES, COBROS MIXTOS MULTI-MEDIO Y RETENCIONES SUFRIDAS]
   └── Recibo X (Clientes) ─► Permite Medio Único o ⚡ Cobro Mixto Multi-Medio (Efectivo + Transferencia + Cheque + Posnet)
                           ─► Calculadora de Retenciones Sufridas (IIBB 3%, Ganancias 2%, IVA, SUSS + N° Certificado)
                           ─► Impacta cada tramo en su Cuenta de Tesorería (CTA-01 a CTA-04) y Cheques en erp_cheques
                           ─► Genera Asiento (Caja/Bancos + 2.1.02 Retenciones Sufridas a 1.1.02 Créditos por Ventas)

[3. PROVEEDORES / COMPRAS (+ STOCK) + ÓRDENES DE PAGO MIXTAS Y RETENCIONES ARCA]
   └── Carga Factura Compra ─► Guarda en erp_comprobantes_compra + suma unidades en erp_inventario (activa 1.1.03)
                            ─► Modalidad Dual: Cuenta Corriente o ⚡ Cancelación Al Contado (Factura + OP en 1 Paso)
   └── Emite Orden de Pago  ─► Soporta Medio Único, Cuotas con Cheques o ⚡ Pago Mixto Multi-Medio
                            ─► Calculadora de Retenciones Practicadas (IIBB 3%, Ganancias RG 830 2%, IVA, SUSS)
                            ─► Sincroniza retenciones con 11 - Zonda Cloud (ARCA) y 2.1.02 Cargas Fiscales

[4. ALERTAS DE STOCK CRÍTICO Y REPOSICIÓN RÁPIDA EN 1 CLIC]
   └── Stock Disponible <= Stock Mínimo ─► Dispara banner "⚠️ Alerta de Stock Crítico" en Inventario y al Facturar
                                        ─► Botón "⚡ Reponer en Proveedores" pre-carga la Factura de Compra e Ingreso

[5. ZONDA CLOUD (ARCA) & MOTOR DE BALANCE OFICIAL RT 54 FACPCE (22 HOJAS .XLSX)]
   └── Consola Multitenant ─► Aislamiento estricto por CUIT (tenant_id) + delegación autorizada al Estudio Contable
                           ─► Exporta el Balance Oficial RT 54 en Excel (.xlsx con las 22 hojas vinculadas tal cual)
                           ─► Descarga PDF Único PUB (RG 4626) + Ganancias F.713 Web (RG 5908)
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

