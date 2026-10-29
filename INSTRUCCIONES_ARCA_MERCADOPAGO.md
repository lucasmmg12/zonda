# Guía Rápida de Activación en Producción: ARCA (ex-AFIP) & Mercado Pago API

Todo el ecosistema de **Zonda ERP** ya se encuentra **100% orquestado** y conectado a la base de datos de **Supabase (`dtjmckbrofevgfqbkzli`)**.

No necesitas escribir ni tocar código para salir a producción: únicamente pegar tus credenciales o configurar la URL del Webhook según los pasos detallados a continuación.

---

## 1. Cómo conectar Mercado Pago API y su Webhook (5 minutos)

### Paso 1.1: Obtener tus Credenciales en Mercado Pago Developers
1. Ingresá a [Mercado Pago Developers - Tus Integraciones](https://www.mercadopago.com.ar/developers/panel/app) con la cuenta oficial de cobros de la empresa.
2. Creá una aplicación (o abrí la existente) eligiendo **Pagos online &rarr; Checkout Pro**.
3. En el menú lateral izquierdo, entrá a **Credenciales de prueba** (para Sandbox) o **Credenciales de producción** (para cobros reales).
4. Copiá los dos valores:
   - **Public Key**: comienza con `APP_USR-...` (o `TEST-...` en Sandbox).
   - **Access Token**: comienza con `APP_USR-...` (o `TEST-...` en Sandbox).

### Paso 1.2: Pegar la URL del Webhook en Mercado Pago Developers
1. Dentro de tu aplicación en el panel de Mercado Pago Developers, andá al menú izquierdo **Webhooks &rarr; Configurar notificaciones**.
2. En el campo **URL de producción** (y **URL de prueba**), pegá exactamente esta URL que ya está configurada en Zonda ERP:
   ```text
   https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/mercadopago-webhook
   ```
3. En **Eventos recomendados**, tildá:
   - [x] **Pagos (`payment`)**
   - [x] **Órdenes comerciales (`merchant_order`)**
4. Hacé clic en **Guardar configuración**. Mercado Pago te mostrará una **Clave secreta (Firma Secreta / Webhook Secret)**: copiala.

### Paso 1.3: Pegar las claves en Zonda ERP
1. En la barra superior de **Zonda ERP**, hacé clic en el botón **Mercado Pago API** (o entrá a **Configuración &rarr; Integraciones AFIP & Mercado Pago**).
2. Seleccioná el modo (**Sandbox** o **Producción**).
3. Pegá la **Public Key**, el **Access Token** y el **Webhook Secret**.
4. Hacé clic en **Guardar en Supabase y Verificar**.
   - ¡Listo! Cada vez que emitas una factura o generes un link/QR de pago en Zonda ERP, la preferencia lleva inyectada automáticamente la `notification_url` apuntando al Webhook.
   - Cuando el cliente pague, el Webhook acredita automáticamente el saldo en **Tesorería (`erp_cuentas_bancarias`)**, imputa el cobro en **Clientes**, genera el asiento en **Contabilidad (`erp_asientos_contables`)** y guarda la trazabilidad en **Monitor de Webhooks (`erp_webhooks_log`)**.

---

## 2. Cómo conectar ARCA (ex-AFIP) para Facturación Electrónica con CAE (WSAA / WSFEv1)

ARCA utiliza criptografía asimétrica X.509 (`.crt` + `.key`) para autorizar comprobantes electrónicos (`FECAESolicitar`) y otorgar el CAE legal.

### Paso 2.1: Generar tu Clave Privada (`.key`) y Solicitud de Certificado (`.csr`)
Podés copiar estos dos comandos directamente desde la ventana **Centro de Orquestación ARCA &rarr; ¿Cómo obtener el Certificado .CRT?** dentro del ERP, o ejecutarlos en tu terminal (PowerShell / Bash):

```bash
# 1. Generar la Clave Privada RSA de 2048 bits (guardala, se sube al ERP):
openssl genrsa -out zonda_30718759087.key 2048

# 2. Generar el archivo CSR (Solicitud de Certificado para subir a ARCA):
openssl req -new -key zonda_30718759087.key -subj "/C=AR/O=SANATORIO ARGENTINO/CN=ARCA_30718759087_ZONDA/serialNumber=CUIT 30718759087" -out zonda_30718759087.csr
```
*(Reemplazá `30718759087` por el CUIT emisor si corresponde).*

### Paso 2.2: Subir el `.csr` en el portal de ARCA con Clave Fiscal
1. Ingresá a [ARCA (ex-AFIP) con Clave Fiscal Nivel 3](https://auth.afip.gob.ar/contribuyente_/login.xhtml).
2. Para **Homologación (Testing)**: abrí el servicio **"WSASS - Autogestión Certificados Homologación"**.
   Para **Producción**: abrí el servicio **"Administración de Certificados Digitales"**.
3. Hacé clic en **Agregar Alias**, subí el archivo `zonda_30718759087.csr` y descargá el certificado firmado `.crt` que te devuelve ARCA.
4. En **Administrador de Relaciones de Clave Fiscal &rarr; Nueva Relación**, buscá **ARCA &rarr; WebServices &rarr; Facturación Electrónica (wsfe)** y asocialo al computador fiscal que acabás de crear.
5. En el servicio **Administración de Puntos de Venta y Domicilios**, verificá que tu Punto de Venta (ej. `0001`) tenga el sistema **"RECE para aplicativo y Web Services"**.

### Paso 2.3: Subir el `.crt` y `.key` en Zonda ERP
1. En la barra superior de **Zonda ERP**, hacé clic en el botón **ARCA / AFIP WSFE**.
2. Elegí el entorno (**Homologación** o **Producción**), verificá el CUIT y Punto de Venta.
3. Hacé clic en **Subir archivo .crt** y **Subir archivo .key** (o pegá su texto PEM).
4. Hacé clic en **Guardar en Supabase y Probar ARCA**.
   - ¡Listo! Al emitir cualquier Factura A, B o C en el módulo **Clientes**, Zonda ERP invocará el puente serverless:
     ```text
     https://dtjmckbrofevgfqbkzli.supabase.co/functions/v1/arca-wsfe
     ```
     y estampará el **CAE oficial de 14 dígitos** y su vencimiento en el comprobante.

---

## 3. Despliegue de las Supabase Edge Functions (Opcional / DevOps)

El código de los dos receptores Serverless ya está creado en este repositorio dentro de:
- [`supabase/functions/mercadopago-webhook/index.ts`](supabase/functions/mercadopago-webhook/index.ts)
- [`supabase/functions/arca-wsfe/index.ts`](supabase/functions/arca-wsfe/index.ts)

Para publicarlos o actualizarlos en tu proyecto de Supabase (`dtjmckbrofevgfqbkzli`), ejecutá desde la raíz del proyecto:

```bash
npx supabase login --token <TU_SUPABASE_ACCESS_TOKEN>
npx supabase functions deploy mercadopago-webhook --project-ref dtjmckbrofevgfqbkzli --no-verify-jwt
npx supabase functions deploy arca-wsfe --project-ref dtjmckbrofevgfqbkzli --no-verify-jwt
```

> **Nota:** Se incluye `--no-verify-jwt` en `mercadopago-webhook` para que los servidores externos de Mercado Pago puedan hacer `POST` directamente sin requerir cabecera JWT de Supabase.

---

## 4. Tablas de Base de Datos Orquestadas en Supabase (`dtjmckbrofevgfqbkzli`)

| Tabla en Supabase | Propósito |
| :--- | :--- |
| `public.erp_integraciones_config` | Almacena la configuración activa de ARCA (`.crt`, `.key`, CUIT, Punto de Venta, Ambiente) y de Mercado Pago (`Public Key`, `Access Token`, `Webhook Secret`, `Webhook URL`). |
| `public.erp_webhooks_log` | Registro de auditoría en tiempo real de cada notificación IPN/Webhook de Mercado Pago y cada solicitud de CAE enviada a ARCA WSFEv1. |
| `public.erp_comprobantes_venta` | Guarda cada factura emitida con su número de CAE oficial, vencimiento CAE y estado de cobro. |
| `public.erp_cuentas_bancarias` | Se acredita automáticamente cuando entra un Webhook `payment.updated` (`approved`) de Mercado Pago. |
| `public.erp_asientos_contables` | Registra automáticamente el asiento contable de partida doble por cada cobro vía Webhook o facturación ARCA. |
