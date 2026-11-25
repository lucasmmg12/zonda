-- ==========================================================
-- ZONDA ERP — MÓDULO ECOMMERCE MULTI-TENANT (ESTILO TIENDANUBE)
-- Migración idempotente para Supabase PostgreSQL
-- ==========================================================

-- 1. TIENDAS POR TENANT
CREATE TABLE IF NOT EXISTS public.ecommerce_tiendas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  activa boolean DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.ecommerce_categorias (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  icono text DEFAULT '🏷️',
  imagen_url text,
  orden integer DEFAULT 0,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. PRODUCTOS Y VARIANTES (VINCULADOS A INVENTARIO ERP)
CREATE TABLE IF NOT EXISTS public.ecommerce_productos (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  articulo_inventario_id text,
  sku text NOT NULL,
  nombre text NOT NULL,
  descripcion_corta text DEFAULT '',
  descripcion_larga text DEFAULT '',
  categoria_id text,
  marca text DEFAULT '',
  precio_base numeric DEFAULT 0,
  en_oferta boolean DEFAULT false,
  precio_oferta numeric,
  stock_total integer DEFAULT 0,
  imagenes jsonb DEFAULT '[]'::jsonb,
  publicado boolean DEFAULT true,
  destacado boolean DEFAULT false,
  tiene_variantes boolean DEFAULT false,
  atributos jsonb DEFAULT '[]'::jsonb,
  variantes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 4. COMPRADORES EXTERNOS (GOOGLE AUTH)
CREATE TABLE IF NOT EXISTS public.ecommerce_compradores (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  google_uid text NOT NULL,
  email text NOT NULL,
  nombre text NOT NULL,
  avatar_url text,
  telefono text DEFAULT '',
  dni_cuit text DEFAULT '',
  direccion_envio text DEFAULT '',
  ciudad text DEFAULT '',
  codigo_postal text DEFAULT '',
  cliente_erp_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, email)
);

-- 5. PEDIDOS ECOMMERCE
CREATE TABLE IF NOT EXISTS public.ecommerce_pedidos (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  numero_pedido text NOT NULL,
  fecha timestamptz DEFAULT now() NOT NULL,
  comprador_id text NOT NULL,
  comprador_google_uid text NOT NULL,
  comprador_nombre text NOT NULL,
  comprador_email text NOT NULL,
  comprador_telefono text DEFAULT '',
  comprador_dni_cuit text DEFAULT '',
  direccion_envio text DEFAULT '',
  metodo_envio_id text NOT NULL,
  metodo_envio_nombre text NOT NULL,
  metodo_pago text NOT NULL CHECK (metodo_pago IN ('mercadopago', 'transferencia', 'efectivo_retiro')),
  estado_pago text DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'aprobado', 'rechazado', 'reembolsado')),
  estado_envio text DEFAULT 'pendiente' CHECK (estado_envio IN ('pendiente', 'preparando', 'enviado', 'entregado', 'cancelado')),
  subtotal numeric DEFAULT 0,
  cupon_codigo text,
  descuento_monto numeric DEFAULT 0,
  costo_envio numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notas text,
  mp_preference_id text,
  mp_payment_id text,
  comprobante_transferencia_ref text,
  sincronizado_erp boolean DEFAULT false,
  factura_erp_nro text,
  cliente_erp_id text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- 6. CUPONES DE DESCUENTO
CREATE TABLE IF NOT EXISTS public.ecommerce_cupones (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  codigo text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('porcentaje', 'monto_fijo')),
  valor numeric NOT NULL DEFAULT 0,
  minimo_compra numeric DEFAULT 0,
  usos_actuales integer DEFAULT 0,
  usos_maximos integer DEFAULT 100,
  activo boolean DEFAULT true,
  UNIQUE(tenant_id, codigo)
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_ecom_productos_tenant ON public.ecommerce_productos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ecom_pedidos_tenant ON public.ecommerce_pedidos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ecom_pedidos_email ON public.ecommerce_pedidos(comprador_email);
CREATE INDEX IF NOT EXISTS idx_ecom_compradores_tenant ON public.ecommerce_compradores(tenant_id);

-- RLS BÁSICO (ajustable según políticas de Auth de cada proyecto)
ALTER TABLE public.ecommerce_tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_compradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_cupones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ecom_tiendas_all" ON public.ecommerce_tiendas;
CREATE POLICY "ecom_tiendas_all" ON public.ecommerce_tiendas FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ecom_categorias_all" ON public.ecommerce_categorias;
CREATE POLICY "ecom_categorias_all" ON public.ecommerce_categorias FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ecom_productos_all" ON public.ecommerce_productos;
CREATE POLICY "ecom_productos_all" ON public.ecommerce_productos FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ecom_compradores_all" ON public.ecommerce_compradores;
CREATE POLICY "ecom_compradores_all" ON public.ecommerce_compradores FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ecom_pedidos_all" ON public.ecommerce_pedidos;
CREATE POLICY "ecom_pedidos_all" ON public.ecommerce_pedidos FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ecom_cupones_all" ON public.ecommerce_cupones;
CREATE POLICY "ecom_cupones_all" ON public.ecommerce_cupones FOR ALL USING (true) WITH CHECK (true);
