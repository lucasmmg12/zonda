# MANUAL 02: Clientes, Facturación Electrónica (ARCA CAE) y Cobranzas
> **Sistema:** Zonda ERP — Grow Labs / Ecosistema Sanatorio Argentino  
> **Código de Documento:** `MAN-02`  
> **Tablas Supabase Vinculadas:** `erp_clientes`, `erp_comprobantes_venta`, `erp_cuentas_bancarias`, `erp_cheques`, `erp_asientos_contables`, `erp_webhooks_log`

---

## 1. Propósito del Módulo
Gestiona el ciclo completo de ingresos (**Order-to-Cash**): padrón de clientes, emisión de comprobantes electrónicos con autorización de **CAE ante ARCA (ex-AFIP)**, generación de cobros digitales por **Mercado Pago (QR y Link Checkout Pro)** e imputación de recibos de cobranza con impacto automático en Tesorería y Contabilidad.

---

## 2. Instrucciones Paso a Paso

### 2.1. Cómo dar de alta un Nuevo Cliente
1. Ingrese al módulo **Clientes** desde el menú lateral izquierdo.
2. Presione el botón **`+ Nuevo Cliente`**.
3. Complete los campos obligatorios:
   - **Razón Social / Nombre Completo**
   - **CUIT / DNI:** Formato `XX-XXXXXXXX-X` (validado con algoritmo Módulo 11).
   - **Condición frente al IVA:** *Responsable Inscripto*, *Monotributo*, *Exento* o *Consumidor Final*.
   - **Email de Facturación y Teléfono.**
4. Haga clic en **Guardar Cliente**.
   - **Impacto en Base de Datos:** Se crea el registro en `public.erp_clientes` con saldo inicial `$0,00`.

---

### 2.2. Cómo emitir una Factura Electrónica con CAE de ARCA (ex-AFIP)
1. En el módulo **Clientes**, presione el botón **`+ Nueva Factura`**.
2. Seleccione el **Cliente** del desplegable.
3. Elija el **Tipo de Comprobante**:
   - **Factura A:** Para clientes *Responsables Inscriptos* (discrimina IVA 21% / 10.5%).
   - **Factura B:** Para *Consumidor Final*, *Exento* o *Monotributo*.
   - **Nota de Crédito A / B:** Para anular o bonificar comprobantes previos.
4. Verifique el **Punto de Venta** (ej. `0001`), ingrese el **Concepto / Detalle**, el **Importe Neto Gravado** y la **Alícuota de IVA**.
5. Presione **`Emitir y Solicitar CAE`**.
   - **Impacto Automático en 4 niveles:**
     1. **ARCA WSFEv1:** Invoca el puente `arca-wsfe` y asigna el **CAE de 14 dígitos** con su fecha de vencimiento.
     2. **Comprobantes:** Inserta la factura en `public.erp_comprobantes_venta` con estado `Pendiente`.
     3. **Cuenta Corriente:** Suma el total de la factura al saldo deudor del cliente en `public.erp_clientes`.
     4. **Contabilidad (Partida Doble):** Crea el asiento automático en `public.erp_asientos_contables` debitando *1.1.02 Deudores por Ventas* y acreditando *4.1.01 Ventas* + *2.1.03 IVA Débito Fiscal*.

---

### 2.3. Cómo cobrar una Factura con Mercado Pago (QR Interoperable o Link)
1. En la tabla de **Comprobantes Emitidos** o desde la cuenta corriente del cliente, haga clic en el botón de **Cobro QR / Mercado Pago**.
2. El sistema genera instantáneamente:
   - **Código QR Interoperable (EMVCo):** Escaneable desde la app de Mercado Pago o cualquier billetera bancaria.
   - **Link de Pago Checkout Pro (`init_point`):** Para enviar por WhatsApp o correo electrónico al cliente.
3. Cada preferencia lleva configurada automáticamente la URL del Webhook:
   `https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-webhook`
4. Cuando el cliente abona, el Webhook impacta automáticamente Tesorería y Contabilidad.

---

### 2.4. Cómo registrar un Recibo de Cobranza (Medio Único, Cobro Mixto Multi-Medio y Retenciones)
1. Presione el botón **`Agregar cobro`** (o el ícono de cobro junto al cliente/comprobante).
2. Seleccione el **Cliente** y la **Factura Adeudada a Imputar**.
3. Elija la **Modalidad de Medios de Cobro**:
   - **Medio Único (Simple):** Seleccione un único medio (*Transferencia Santander/Galicia*, *Efectivo en Caja Central*, *Cheque / E-Cheq de Terceros* o *Tarjeta Posnet / Mercado Pago*).
   - **⚡ Cobro Mixto Multi-Medio (Combinar):** Pulse **`+ Agregar Medio de Cobro`** para combinar varios tramos en un mismo Recibo X (por ejemplo: parte en *Efectivo en Caja Central* + parte en *Transferencia Bancaria Santander* + parte en *Cheque de Terceros a Depositar*). Cada tramo impacta en su cuenta de Tesorería (`CTA-01` a `CTA-04`) de forma independiente con etiqueta `[Tramo X/N]`.
4. **🏛️ Retenciones Impositivas Sufridas (Certificados ARCA / IIBB):**
   - Si el cliente retuvo impuestos al pagar, utilice los botones rápidos **`Calc. IIBB 3% s/Neto`** o **`Calc. Ganancias 2%`** (o ingrese manualmente `Ret. IIBB`, `Ret. Ganancias`, `Ret. IVA`, `Ret. SUSS` y el `N° Certificado`).
   - Las retenciones se imputan automáticamente en la cuenta **`2.1.02 Cargas Fiscales, Retenciones Sufridas`** y cancelan saldo de la factura del cliente.
5. **⚡ Cancelación Al Contado en 1 Solo Paso (al Facturar):**
   - También puede elegir **`⚡ Cancelación Al Contado (1 Paso)`** directamente dentro del modal **`Agregar factura`** para emitir la Factura y el Recibo X simultáneamente en un solo paso (`Pagado Total`, `Saldo $0`).

---

### 2.5. Cómo Imprimir una Factura en PDF o Exportar a Excel
- **PDF Oficial:** Haga clic en el ícono de impresora/PDF en la fila de cualquier factura para abrir la vista de impresión A4 con logo, CUIT, detalle de IVA y CAE de ARCA.
- **Excel (CSV):** Haga clic en **`Exportar CSV`** arriba a la derecha para descargar el listado completo de clientes o comprobantes compatible con Microsoft Excel.

