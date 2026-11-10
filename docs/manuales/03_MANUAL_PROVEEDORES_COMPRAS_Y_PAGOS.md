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

### 2.3. Cómo emitir una Orden de Pago a Proveedor (Medio Único, Cuotas con Cheques, Pago Mixto Multi-Medio y Retenciones ARCA)
1. En el módulo **Proveedores**, presione **`Agregar pago`** (o el botón de pago junto al proveedor o factura pendiente).
2. Verifique el **Proveedor Beneficiario** y la **Factura Adeudada a Imputar**.
3. Elija la **Modalidad de Medios de Pago**:
   - **Medio Único / Plan de Cheques:** Pague con un único medio o divida la factura en `2, 3, 4 o 6 Cheques Propios Diferidos` / `Endoso de Cheques en Cartera`.
   - **⚡ Pago Mixto Multi-Medio (Combinar):** Pulse **`+ Agregar Medio de Pago`** para combinar en una misma Orden de Pago múltiples tramos (`Efectivo en Caja Central` + `Transferencia Bancaria Santander/Galicia` + `Cheque Propio Diferido` + `Endoso de Cheque de Terceros en Cartera` + `Tarjeta Corporativa`). Cada tramo descuenta exactamente de su cuenta de Tesorería (`CTA-01` a `CTA-05`).
4. **🏛️ Retenciones Impositivas Practicadas al Proveedor (Conectado a `11 - Zonda Cloud ARCA`):**
   - Utilice los botones rápidos **`Calc. IIBB 3% s/Neto`** y **`Calc. Ganancias RG 830 (2%)`** (o complete `Ret. IIBB`, `Ret. Ganancias`, `Ret. IVA`, `Ret. SUSS` y `N° Certificado`).
   - Las retenciones descuentan del desembolso bancario, se imputan en **`2.1.02 Cargas Fiscales, Retenciones Practicadas a Proveedor`** y se sincronizan en `erp_comprobantes_compra` para las liquidaciones de **`11 - Zonda Cloud (ARCA)`**.
5. **⚡ Cancelación Al Contado en 1 Solo Paso (al Cargar Factura):**
   - Al cargar una factura de compra puede activar **`⚡ Cancelación Al Contado (1 Paso)`** para registrar la factura, ingresar el stock y emitir la Orden de Pago en una sola operación (`Pagado Total`, `Saldo $0`).

