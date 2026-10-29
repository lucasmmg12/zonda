# MANUAL 03: Proveedores, Compras, Retenciones y Órdenes de Pago
> **Sistema:** Zonda ERP — Grow Labs / Ecosistema Sanatorio Argentino  
> **Código de Documento:** `MAN-03`  
> **Tablas Supabase Vinculadas:** `erp_proveedores`, `erp_comprobantes_compra`, `erp_cuentas_bancarias`, `erp_asientos_contables`

---

## 1. Propósito del Módulo
Administra el ciclo completo de compras y cuentas por pagar (**Procure-to-Pay**): padrón de proveedores, registración de facturas de compra (cómputo de IVA Crédito Fiscal e imputación al centro de gasto) y emisión de **Órdenes de Pago** con descuento directo de fondos en Tesorería.

---

## 2. Instrucciones Paso a Paso

### 2.1. Cómo dar de alta un Nuevo Proveedor
1. Ingrese al módulo **Proveedores** desde el menú lateral.
2. Presione **`+ Nuevo Proveedor`**.
3. Complete:
   - **Razón Social**
   - **CUIT** (`XX-XXXXXXXX-X`)
   - **Condición frente al IVA** (*Responsable Inscripto*, *Monotributo*, *Exento*)
   - **Categoría / Rubro de Gasto** (ej. *Insumos Médicos*, *Materiales de Construcción*, *Servicios Públicos*, *Honorarios*).
4. Haga clic en **Guardar Proveedor**.
   - **Impacto en Base de Datos:** Inserta el proveedor en `public.erp_proveedores`.

---

### 2.2. Cómo cargar una Factura de Compra o Gasto
1. Presione el botón **`+ Nueva Compra`**.
2. Seleccione el **Proveedor** emisor de la factura.
3. Ingrese el **Número de Comprobante** (ej. `FA-A-0002-00045120`), **Fecha de Emisión** y **Fecha de Vencimiento**.
4. Ingrese el **Importe Neto Gravado** y el **IVA Crédito Fiscal** (el sistema calcula automáticamente el 21% o permite ajustarlo).
5. Presione **`Registrar Compra`**.
   - **Impacto Automático en 3 niveles:**
     1. **Comprobantes de Compra:** Guarda la factura en `public.erp_comprobantes_compra` con estado `Pendiente`.
     2. **Cuenta Corriente Proveedor:** Incrementa la deuda con el proveedor en `public.erp_proveedores`.
     3. **Contabilidad (Partida Doble):** Genera el asiento en `public.erp_asientos_contables` debitando *5.1.01 Costos Operativos / Gastos* + *1.1.05 IVA Crédito Fiscal* y acreditando *2.1.01 Proveedores Locales*.

---

### 2.3. Cómo emitir una Orden de Pago a Proveedor
1. En el módulo **Proveedores**, presione **`Emitir Orden de Pago`** (o el botón **`Pagar`** junto al proveedor o factura pendiente).
2. Verifique el **Proveedor**, ingrese el **Monto a Pagar** y seleccione la **Cuenta Bancaria o Caja** desde donde saldrán los fondos.
3. Confirme la Orden de Pago.
   - **Impacto Automático:**
     - Reduce el saldo adeudado al proveedor en `erp_proveedores`.
     - Actualiza el estado de las facturas de compra a `Pagada` en `erp_comprobantes_compra`.
     - Descuenta el saldo disponible de la cuenta seleccionada en `erp_cuentas_bancarias`.
     - Genera el asiento contable (*2.1.01 Proveedores Locales* en el Debe contra *1.1.01 Caja y Bancos* en el Haber).

