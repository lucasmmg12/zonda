# Guía Operativa: Dominio de Emails Propio, Registro Google/Email y Suscripciones Mercado Pago ($20.000/mes)

Esta guía documenta la puesta en producción de la arquitectura **SaaS Autogestionable** de **Zonda ERP & Zonda Cloud**:

1. **Web Pública Propia** con registro automático multi-empresa.
2. **Autenticación Dual**: Google OAuth 2.0 + Registro nativo con Usuario (Email) y Contraseña.
3. **Dominio Propio de Envío de Emails** (`SPF`, `DKIM`, `DMARC`) y correos transaccionales HTML.
4. **Prueba Gratuita de 30 días ($0 ARS)** + **Cobro Recurrente Simbólico de $20.000 ARS/mes** mediante **Mercado Pago**.

---

## 1. Cómo Crear y Configurar el Dominio Propio para Envío de Emails (10 minutos)

Para que los correos de bienvenida, verificación y recibos de pago lleguen a la bandeja principal (Gmail / Outlook / corporativos) sin caer en Spam, Zonda ERP utiliza **Resend** (estándar moderno para Vite + Supabase Edge Functions) sobre tu propio dominio.

### Paso 1.1: Registrar tu Dominio
- Si tu dominio es `.com.ar`: registralo en **[NIC Argentina](https://nic.ar)** (ej. `zondaerp.com.ar`) y delegá los DNS a **Cloudflare** (gratuito y con propagación en 30 segundos).
- Si preferís `.com` o `.cloud`: podés adquirirlo directamente en **Cloudflare Registrar** o **Namecheap**.

### Paso 1.2: Verificar el Dominio en Resend y Cargar Registros DNS
1. Creá una cuenta gratuita en **[Resend](https://resend.com)** (incluye 3.000 emails/mes sin costo).
2. Entrá a **Domains → Add Domain** e ingresá tu dominio (ej. `zondaerp.com.ar` o `notificaciones.zondaerp.com.ar`).
3. En tu panel de DNS (Cloudflare / Hosting) o copiándolos desde **Zonda ERP → Configuración → Pagos y Emails (Dominio)**, agregá los 3 registros obligatorios:
   - **SPF (`TXT`)**: `v=spf1 include:amazonses.com include:_spf.resend.com ~all`
   - **DKIM (`TXT`)**: Host `resend._domainkey` → clave pública provista por Resend.
   - **DMARC (`TXT`)**: Host `_dmarc` → `v=DMARC1; p=quarantine; rua=mailto:dmarc@tudominio.com.ar; pct=100`
4. En **Resend → API Keys**, generá una clave (`re_...`) y guardala como secreto en Supabase o pegala en **Configuración → Pagos y Emails** dentro de Zonda ERP:

```bash
npx supabase secrets set RESEND_API_KEY=re_tu_clave_oficial SAAS_FROM_EMAIL=hola@tudominio.com.ar --project-ref dtjmckbrofevgfqbkzli
npx supabase functions deploy send-transactional-email --project-ref dtjmckbrofevgfqbkzli --no-verify-jwt
```

---

## 2. Cómo Habilitar Google OAuth + Email/Contraseña en Supabase Auth

1. Ingresá a **[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Creá un **OAuth 2.0 Client ID (Web Application)** y agregá como *Authorized redirect URI*:
   ```text
   https://dtjmckbrofevgfqbkzli.supabase.co/auth/v1/callback
   ```
3. En tu panel de **[Supabase Dashboard → Authentication → Providers](https://supabase.com/dashboard/project/dtjmckbrofevgfqbkzli/auth/providers)**:
   - Habilitá **Email** (usuario y contraseña). Podés conectar el mismo servidor SMTP de Resend (`smtp.resend.com`, puerto `465`, usuario `resend`, clave `re_...`) en **Project Settings → Auth → SMTP Settings**.
   - Habilitá **Google** y pegá el `Client ID` y `Client Secret`.
4. En **Authentication → URL Configuration**, configurá como `Site URL` el dominio de tu web pública (ej. `https://zondaerp.com.ar` y en desarrollo `http://localhost:5173`).

---

## 3. Cómo Activar el Cobro Mensual de $20.000 ARS con Mercado Pago

El motor de suscripciones opera con dos modalidades oficiales de Mercado Pago Argentina:
- **Débito Automático Mensual (`POST /preapproval`)**: 30 días bonificados + renovación mensual de **$20.000 ARS**.
- **Pago Mensual Checkout Pro / QR (`POST /checkout/preferences`)**: link directo de **$20.000 ARS** con acreditación inmediata por Webhook.

### Despliegue de las Edge Functions de Suscripción y Webhook
```bash
npx supabase functions deploy mercadopago-subscription --project-ref dtjmckbrofevgfqbkzli --no-verify-jwt
npx supabase functions deploy mercadopago-webhook --project-ref dtjmckbrofevgfqbkzli --no-verify-jwt
```

Cuando un cliente abona los **$20.000 ARS**, Mercado Pago notifica a `mercadopago-webhook` con la referencia `SUB-ZONDA-20K-<TENANT_ID>`, cambiando automáticamente el estado del cliente a `active_paid` por 30 días adicionales y enviándole el comprobante por correo electrónico.
