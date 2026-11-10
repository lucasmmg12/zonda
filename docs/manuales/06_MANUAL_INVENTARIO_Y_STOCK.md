# MANUAL 06: Inventario, Stock, Depósitos y Valuación de Costos
> **Sistema:** Zonda ERP — Grow Labs / Ecosistema Sanatorio Argentino  
> **Código de Documento:** `MAN-06`  
> **Tablas Supabase Vinculadas:** `erp_inventario`

---

## 1. Propósito del Módulo
Administra el catálogo de productos, materiales de obra e insumos clínicos, controlando las existencias en cada depósito (**Stock Físico**, **Stock Comprometido** y **Stock Disponible**), emitiendo alertas automáticas de **Stock Mínimo (Punto de Pedido)** y determinando la valuación total del inventario a costo de reposición.

---

## 2. Instrucciones Paso a Paso

### 2.1. Cómo dar de alta un Nuevo Artículo o Insumo
1. Ingrese al módulo **Inventario**.
2. Haga clic en **`+ Nuevo Artículo`**.
3. Complete los datos del formulario:
   - **Código / SKU:** ej. `INS-900`, `MAT-250`.
   - **Descripción del Artículo**
   - **Rubro / Familia:** ej. *Materiales Eléctricos*, *Insumos Médicos*, *Ferretería Industrial*.
   - **Depósito:** ej. *Depósito Central San Juan*, *Obrador Acueducto*, *Farmacia Central*.
   - **Stock Físico Inicial** y **Stock Mínimo de Alerta**.
   - **Costo de Reposición ($)** y **Precio de Venta Neto ($)**.
   - **Alícuota de IVA:** `21%`, `10.5%` o `0%`.
4. Presione **Guardar Artículo**.
   - **Impacto en Base de Datos:** Inserta el artículo en `public.erp_inventario`.

---

### 2.2. Cómo realizar un Ingreso por Factura de Proveedor, Salida de Stock o Reposición Rápida por Alerta de Stock Crítico
1. **Ingreso Obligatorio con Factura y Proveedor (`+ Ingreso por Factura`):**
   - Todo ingreso de mercadería exige seleccionar un **Proveedor** y su **Factura de Compra** (o cargarla desde `03 - Proveedores`). Suma las unidades al disponible, actualiza el costo de reposición y activa la cuenta `1.1.03 Bienes de Cambio (Inventario)`.
2. **Descuento Automático en Ventas y Asiento de CMV:**
   - Al emitir una factura en `02 - Clientes` con artículos de stock, el sistema descuenta automáticamente las unidades y genera el asiento de **Costo de Mercaderías Vendidas** (`Debe 5.1 Costo de Ventas` a `Haber 1.1.03 Bienes de Cambio`).
3. **⚠️ Alerta Automática de Stock Crítico / Negativo y Reposición en 1 Clic:**
   - Cuando el `Stock Disponible` de cualquier artículo es menor o igual a su `Stock Mínimo`, Zonda ERP despliega automáticamente el panel superior **`⚠️ Alerta de Stock Crítico`** (tanto en `06 - Inventario` como al facturar en `02 - Clientes`).
   - Haciendo clic en **`⚡ Reponer [Código] en Proveedores`**, el sistema abre `03 - Proveedores` con el artículo, costo y cantidad sugerida pre-cargados en el modal de Factura de Compra.

