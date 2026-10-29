# MANUAL 08: Configuración Fiscal, ARCA (ex-AFIP), Mercado Pago API & Base de Datos Supabase
> **Sistema:** Zonda ERP — Grow Labs / Ecosistema Sanatorio Argentino  
> **Código de Documento:** `MAN-08`  
> **Tablas Supabase Vinculadas:** `erp_empresa`, `erp_integraciones_config`, `erp_webhooks_log`

---

## 1. Configuración de Datos de la Empresa, Talonarios y Centros de Costos
1. Ingrese al módulo **Configuración** desde el menú lateral izquierdo.
2. **Pestaña `Datos generales`:**
   - Modifique Nombre Comercial, Razón Social, Domicilio Fiscal, Localidad, Provincia, Teléfono, Email, CBU, CUIT e Ingresos Brutos.
   - Al presionar **`Guardar datos en Supabase`**, los cambios se actualizan en `public.erp_empresa` y se reflejan inmediatamente en el encabezado del ERP y en todos los reportes PDF.
3. **Pestaña `Talonarios`:**
   - Administre los Puntos de Venta electrónicos habilitados en ARCA (ej. `0001`, `0002`, `0003`) o agregue uno nuevo con **`+ Agregar Punto de Venta`**.
4. **Pestaña `Centros de Costos`:**
   - Cree y presupueste unidades de negocio u obras (ej. `CC-100`, `CC-200`) para segmentar la contabilidad analítica.

---

## 2. Instrucciones Paso a Paso para Conectar Mercado Pago API y su Webhook

### Paso 1: Obtener `Public Key` y `Access Token`
1. Ingrese a [Mercado Pago Developers &rarr; Tus Integraciones](https://www.mercadopago.com.ar/developers/panel/app).
2. Seleccione su aplicación y abra **Credenciales de Producción** (o *Credenciales de Prueba* para Sandbox).
3. Copie la **`Public Key`** y el **`Access Token`** (comienzan con `APP_USR-...` o `TEST-...`).

### Paso 2: Configurar el Webhook en Mercado Pago Developers
1. Dentro de su aplicación en Mercado Pago Developers, ingrese al menú izquierdo **Webhooks &rarr; Configurar notificaciones**.
2. En el campo **URL de producción** (y **URL de prueba**), pegue la siguiente URL ya orquestada en su proyecto Supabase:
   ```text
   https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-webhook
   ```
3. En **Eventos**, marque:
   - [x] **Pagos (`payment`)**
   - [x] **Órdenes comerciales (`merchant_order`)**
4. Presione **Guardar** y copie el **Webhook Secret (Firma secreta)**.

### Paso 3: Activar en Zonda ERP
1. Haga clic en el botón **`MP: CONFIGURAR`** en la barra superior de Zonda ERP (o en *Configuración &rarr; Integraciones AFIP & Mercado Pago*).
2. Pegue su `Public Key`, `Access Token` y `Webhook Secret` y presione **`Guardar en Supabase y Verificar`**.
3. Puede probar todo el flujo en tiempo real haciendo clic en **`Simular Disparo Webhook MP ($25.000)`** y verificando el registro en la pestaña **`Monitor de Webhooks`**.

---

## 3. Instrucciones Paso a Paso para Conectar ARCA (ex-AFIP) WSAA / WSFEv1

### Paso 1: Generar Clave Privada (`.key`) y Solicitud CSR (`.csr`) con OpenSSL
Ejecute en su terminal estos dos comandos (reemplazando `30718759087` por su CUIT si corresponde):
```bash
# 1. Generar Clave Privada RSA de 2048 bits:
openssl genrsa -out zonda_30718759087.key 2048

# 2. Generar Solicitud de Certificado (.CSR):
openssl req -new -key zonda_30718759087.key -subj "/C=AR/O=SANATORIO ARGENTINO/CN=ARCA_30718759087_ZONDA/serialNumber=CUIT 30718759087" -out zonda_30718759087.csr
```

### Paso 2: Obtener el Certificado `.crt` en el portal de ARCA
1. Ingrese con Clave Fiscal a [ARCA (ex-AFIP)](https://auth.afip.gob.ar/contribuyente_/login.xhtml).
2. Abra **"WSASS - Autogestión Certificados Homologación"** (para pruebas) o **"Administración de Certificados Digitales"** (para Producción).
3. Cree un nuevo alias, suba el archivo `zonda_30718759087.csr` y descargue el archivo firmado **`.crt`**.
4. En **Administrador de Relaciones**, asocie el Web Service **Facturación Electrónica (`wsfe`)** al computador fiscal creado.

### Paso 3: Subir el `.crt` y `.key` en Zonda ERP
1. Haga clic en el botón **`WS-AFIP`** de la barra superior del ERP.
2. Suba los archivos `.crt` y `.key` (o utilice el botón **`Cargar Certificado Homologación (1-Clic)`** para pruebas inmediatas).
3. Presione **`Guardar en Supabase y Probar ARCA`**.
   - El puente serverless ya está preconfigurado en:
     `https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/arca-wsfe`

---

## 4. Diccionario Completo de las 14 Tablas en Supabase (`dtjmckbrofevgfqbkzli`)

| N° | Tabla en PostgreSQL (`public`) | Descripción Funcional |
| :-: | :--- | :--- |
| 1 | `erp_empresa` | Datos fiscales de la empresa, CUIT, IIBB, domicilio, CBU y configuración de logo. |
| 2 | `erp_clientes` | Padrón de clientes, CUIT, condición IVA y saldo actualizado de cuenta corriente. |
| 3 | `erp_proveedores` | Padrón de proveedores, rubro de gasto y saldo acreedor. |
| 4 | `erp_comprobantes_venta` | Facturas A/B/C y Notas de Crédito/Débito emitidas con su número de CAE y vencimiento. |
| 5 | `erp_comprobantes_compra` | Facturas de proveedores cargadas con desglose de Neto e IVA Crédito Fiscal. |
| 6 | `erp_cuentas_bancarias` | Cajas físicas, cuentas corrientes bancarias y billeteras virtuales con saldo en vivo. |
| 7 | `erp_cheques` | Cartera de cheques recibidos de terceros y cheques propios emitidos. |
| 8 | `erp_plan_cuentas` | Estructura jerárquica del Plan de Cuentas contable y saldos acumulados. |
| 9 | `erp_asientos_contables` | Libro Diario general con asientos en partida doble (`renglones` JSONB Debe/Haber). |
| 10 | `erp_inventario` | Catálogo de artículos, stock físico, stock mínimo, depósito y costos de reposición. |
| 11 | `erp_empleados` | Legajos de personal, CUIL, CBU, Convenio Colectivo (CCT) y conceptos de recibo. |
| 12 | `erp_liquidaciones` | Cierres mensuales/quincenales de sueldos y contribuciones patronales F.931. |
| 13 | `erp_integraciones_config` | Credenciales y certificados activos de ARCA WSFEv1 y Mercado Pago API. |
| 14 | `erp_webhooks_log` | Historial de auditoría de notificaciones IPN de Mercado Pago y autorizaciones CAE. |

