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

### 2.2. Cómo realizar un Ajuste de Stock (Entrada por Remito o Salida por Consumo)
1. En la tabla de artículos, localice el ítem que desea ajustar y presione el botón **`Ajustar Stock`** (o desde la barra superior del módulo).
2. Seleccione el **Tipo de Ajuste**:
   - **Ingreso (+):** Recepción de mercadería por remito de proveedor, devolución o recuento físico positivo.
   - **Egreso (-):** Salida de materiales hacia obra/servicio, consumo interno o merma.
3. Ingrese la **Cantidad de Unidades** y el **Motivo / Comprobante de Referencia** (ej. *Remito R-0001-00012900*).
4. Confirme el movimiento.
   - **Impacto Automático:** Recalcula instantáneamente el `Stock Físico` y el `Stock Disponible` en `public.erp_inventario` y actualiza la valuación patrimonial del stock.

