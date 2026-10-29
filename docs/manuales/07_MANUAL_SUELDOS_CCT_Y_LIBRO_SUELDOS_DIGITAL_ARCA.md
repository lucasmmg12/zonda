# MANUAL 07: Sueldos, Convenios Colectivos (CCT) y Libro Sueldos Digital ARCA (RG 3781)
> **Sistema:** Zonda ERP — Grow Labs / Ecosistema Sanatorio Argentino  
> **Código de Documento:** `MAN-07`  
> **Tablas Supabase Vinculadas:** `erp_empleados`, `erp_liquidaciones`, `erp_asientos_contables`

---

## 1. Propósito del Módulo
Liquida sueldos, jornales y cargas sociales en Argentina contemplando las particularidades de cada Convenio Colectivo de Trabajo (**CCT 76/75 UOCRA Construcción**, **CCT 130/75 Comercio**, **CCT 122/75 Sanidad FATSA** y **Fuera de Convenio Ley 20.744**), emite los Recibos de Haberes y genera el archivo posicional **`.TXT` oficial de ARCA (ex-AFIP) Resolución General 3781** para el **Libro de Sueldos Digital** y declaración jurada **F.931**.

---

## 2. Instrucciones Paso a Paso

### 2.1. Cómo dar de alta un Nuevo Legajo de Empleado
1. Ingrese al módulo **Sueldos y Haberes**.
2. Presione **`+ Nuevo Legajo`**.
3. Complete:
   - **Número de Legajo** (ej. `LEG-108`) y **Nombre Completo**.
   - **CUIL:** 11 dígitos (`XX-XXXXXXXX-X`).
   - **Convenio Colectivo (CCT):**
     - *CCT 76/75 (UOCRA - Construcción)*: calcula automáticamente Adicional Asistencia Perfecta (20%) y Fondo de Cese Laboral.
     - *CCT 130/75 (Comercio y Servicios)*: calcula Antigüedad (1% por año) y Presentismo Art. 40 (8.33%).
     - *CCT 122/75 (Sanidad - Clínicas y Sanatorios)*: calcula Antigüedad (2% por año) y Adicionales Asistenciales.
     - *Fuera de Convenio (Dirección)*.
   - **Categoría Profesional**, **Antigüedad (años)**, **Banco**, **CBU de 22 dígitos** y **Sueldo Básico ($)**.
4. Presione **Guardar Legajo**.
   - **Impacto Automático:** Calcula todos los renglones remunerativos y las deducciones de ley (Jubilación SIPA 11% cód. AFIP `810000`, Ley 19.032 PAMI 3% cód. `810001`, Obra Social 3% cód. `810002`, Sindicato) y guarda el legajo en `public.erp_empleados`.

---

### 2.2. Cómo ejecutar la Liquidación Mensual de Haberes
1. En la barra superior del módulo **Sueldos**, haga clic en **`Ejecutar Liquidación Período`**.
2. Ingrese el **Período Fiscal** en formato `AAAAMM` (ej. `202611`), el **Tipo de Liquidación** (`Mensual`, `1ra Quincena`, `2da Quincena`, `SAC`) y la **Fecha de Pago**.
3. Confirme la liquidación.
   - **Impacto Automático:**
     - Registra el cierre de nómina en `public.erp_liquidaciones` con el Total Bruto, Total Retenciones, Neto a Pagar en Bancos y Contribuciones Patronales.
     - Genera automáticamente el asiento contable de devengamiento de sueldos y cargas sociales en `public.erp_asientos_contables`.

---

### 2.3. Cómo ver e imprimir el Recibo de Sueldo de un Trabajador
1. En la pestaña **Nómina de Empleados y Legajos**, haga clic sobre cualquier trabajador o en el botón **`Ver Recibo`**.
2. Se desplegará el recibo oficial con haberes remunerativos, no remunerativos, descuentos legales, neto a cobrar y leyenda de depósito bancario en CBU.
3. Presione **`Imprimir Recibo PDF`** para generar el ejemplar del empleador y del trabajador.

---

### 2.4. Cómo exportar el Archivo `.TXT` para el Libro Sueldos Digital ARCA (F.931)
1. Ingrese a la pestaña **`Libro Sueldos Digital AFIP (RG 3781)`**.
2. Verifique en el visor técnico la estructura posicional generada:
   - **Registro `01`:** Cabecera de la liquidación (CUIT empleador, período `AAAAMM`, cantidad de legajos).
   - **Registro `02`:** Datos particulares de cada CUIL, CBU de 22 dígitos, fecha de pago y modalidad de contratación.
   - **Registro `03`:** Renglones liquidados por CUIL con importes expresados en centavos en 15 posiciones fijas.
   - **Registro `04`:** Bases Imponibles Previsionales 1 a 10 para el cálculo automático del **Formulario 931** de ARCA.
3. Presione el botón **`Descargar TXT Oficial AFIP`** y suba ese archivo directamente en el portal con Clave Fiscal de ARCA &rarr; servicio *Libro de Sueldos Digital*.

