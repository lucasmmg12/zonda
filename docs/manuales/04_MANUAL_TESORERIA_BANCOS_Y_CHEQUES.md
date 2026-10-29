# MANUAL 04: Tesorería, Cajas, Bancos, Cheques y Conciliación
> **Sistema:** Zonda ERP — Grow Labs / Ecosistema Sanatorio Argentino  
> **Código de Documento:** `MAN-04`  
> **Tablas Supabase Vinculadas:** `erp_cuentas_bancarias`, `erp_cheques`, `erp_asientos_contables`

---

## 1. Propósito del Módulo
Centraliza el manejo de fondos líquidos y valores en cartera: cuentas corrientes bancarias, cajas físicas en pesos o dólares, billeteras virtuales (Mercado Pago) y el seguimiento completo de **Cheques de Terceros y Cheques Propios (Físicos y eCheqs)**.

---

## 2. Instrucciones Paso a Paso

### 2.1. Cómo dar de alta una Nueva Cuenta Bancaria, Caja o Billetera
1. Ingrese al módulo **Tesorería**.
2. Haga clic en **`+ Nueva Cuenta / Caja`**.
3. Complete:
   - **Nombre de la Entidad:** ej. *Banco San Juan Cta. Cte.*, *Caja Chica Administración*, *Mercado Pago Corporativo*.
   - **Tipo:** `Banco`, `Caja` o `Billetera Virtual`.
   - **Moneda:** `ARS` o `USD`.
   - **CBU / CVU / Alias** y **Saldo Inicial**.
4. Presione **Guardar**.
   - **Impacto en Base de Datos:** Crea el registro en `public.erp_cuentas_bancarias`.

---

### 2.2. Cómo registrar un Ingreso, Egreso o Transferencia de Fondos
1. Haga clic en **`Registrar Movimiento`**.
2. Seleccione la **Cuenta**, el **Tipo de Movimiento** (`Ingreso` o `Egreso`), el **Importe** y el **Concepto / Referencia** (ej. *Aporte de Capital*, *Gastos y Comisiones Bancarias*, *Refuerzo de Caja*).
3. Presione **Confirmar**.
   - **Impacto Automático:** Actualiza el saldo en `erp_cuentas_bancarias` y registra el asiento contable en `erp_asientos_contables`.

---

### 2.3. Cómo administrar la Cartera de Cheques y Depositar Cheques al Cobro
1. En la sección **Cartera de Cheques (Terceros y Propios)** verá todos los valores recibidos de clientes o emitidos a proveedores.
2. Para cargar un cheque manualmente, presione **`+ Nuevo Cheque`**, indique Número, Banco Emisor, Librador, Fecha de Emisión, Fecha de Pago, Importe y Tipo (`Recibido de Tercero` o `Propio Emitido`).
3. **Para depositar un cheque en cartera:**
   - Localice el cheque con estado **`En Cartera`** y presione el botón **`Depositar`**.
   - **Impacto Automático:**
     - El cheque cambia su estado a **`Depositado`** en `public.erp_cheques`.
     - El importe del cheque se suma automáticamente al saldo de la cuenta bancaria principal en `public.erp_cuentas_bancarias`.
     - Se genera el asiento contable en `public.erp_asientos_contables` (*Banco Cta. Cte.* a *Valores a Depositar*).

