# MANUAL 05: Contabilidad General, Plan de Cuentas y Libros Legales
> **Sistema:** Zonda ERP — Grow Labs / Ecosistema Sanatorio Argentino  
> **Código de Documento:** `MAN-05`  
> **Tablas Supabase Vinculadas:** `erp_plan_cuentas`, `erp_asientos_contables`

---

## 1. Propósito del Módulo
Garantiza la integridad contable bajo el principio de **Partida Doble (`Total Debe = Total Haber`)**. Reúne todos los asientos automáticos generados por los módulos operativos (Ventas, Compras, Tesorería, Sueldos y Webhooks de Mercado Pago) y permite al contador público registrar asientos manuales, administrar el Plan de Cuentas y emitir los Libros Legales (**Libro Diario**, **Libro Mayor** y **Balance de Sumas y Saldos**).

---

## 2. Instrucciones Paso a Paso

### 2.1. Cómo auditar el Libro Diario
1. Ingrese al módulo **Contabilidad**.
2. En la vista **Libro Diario**, verá cada asiento numerado correlativamente con su Fecha, Concepto, Origen (`VENTAS`, `COMPRAS`, `TESORERIA`, `SUELDOS`, `MANUAL`) y el desglose de renglones (`Cuenta`, `Debe`, `Haber`).
3. Utilice el buscador superior para filtrar asientos por glosa, número de comprobante o cuenta contable.

---

### 2.2. Cómo cargar un Nuevo Asiento Contable Manual
1. Haga clic en el botón **`+ Nuevo Asiento Manual`**.
2. Ingrese la **Fecha Contable** y el **Concepto / Leyenda del Asiento** (ej. *Amortización Bienes de Uso Ejercicio 2026*, *Ajuste por Inflación RT 6*, *Refundición de Cuentas de Resultado*).
3. En la grilla de partidas, seleccione la **Cuenta Contable Imputable** e ingrese el importe en la columna **Debe** o **Haber**.
4. Use el botón **`+ Agregar Renglón`** para sumar tantas líneas como requiera el asiento.
5. **Control de Balanceo Automático:**
   - El sistema calcula en vivo `Total Debe`, `Total Haber` y `Diferencia`.
   - El botón **Guardar Asiento** se habilita únicamente cuando la diferencia es exactamente **`$0,00`** y el total es mayor a cero.
   - **Impacto en Base de Datos:** Inserta el asiento en `public.erp_asientos_contables` y actualiza los saldos de las cuentas intervenidas en `public.erp_plan_cuentas`.

---

### 2.3. Cómo agregar una Nueva Cuenta al Plan de Cuentas
1. Cambie a la pestaña **Plan de Cuentas / Sumas y Saldos**.
2. Presione **`+ Nueva Cuenta Contable`**.
3. Ingrese:
   - **Código Jerárquico:** ej. `1.1.06` (Activo Corriente), `2.1.05` (Pasivo Corriente), `5.2.04` (Gastos de Administración).
   - **Nombre de la Cuenta**
   - **Tipo / Rubro:** `Activo`, `Pasivo`, `Patrimonio Neto`, `Ingresos` o `Egresos`.
   - **¿Es Imputable?:** Marque `Sí` si recibe asientos directos, o `No` si es un rubro totalizador.
4. Presione **Guardar Cuenta**.

---

### 2.4. Exportación de Libros Contables para Auditoría / Estudio Contable
- Presione **`Exportar Libro Diario (CSV)`** o **`Imprimir Balance PDF`** en la barra superior del módulo para obtener los reportes listos para copiado a libros rubricados o papeles de trabajo de auditoría.

