-- =====================================================================================
-- ZONDA ERP & ZONDA CLOUD — ARQUITECTURA MULTI-TENANT & DELEGACIÓN IMPOSITIVA ARCA
-- Script Oficial PostgreSQL / Supabase con Row Level Security (RLS)
-- =====================================================================================
-- Propósito:
-- 1. Aislar al 100% los usuarios y datos operativos de cada empresa (tenant_id / CUIT)
--    para que jamás se mezclen clientes, proveedores, ventas, compras, cajas, stock o sueldos.
-- 2. Habilitar el puente de autorización explícita (erp_zonda_cloud_autorizaciones)
--    mediante el cual el usuario titular de Zonda ERP autoriza a Zonda Cloud a gestionar
--    Compras y Ventas para liquidar impuestos ante ARCA (IVA F.2002, Libro IVA Digital
--    RG 4597, SICORE/SIRE e Ingresos Brutos SIFERE).
-- =====================================================================================

-- 1. TABLA MAESTRA DE ORGANIZACIONES / EMPRESAS (TENANTS)
CREATE TABLE IF NOT EXISTS public.erp_tenants (
    tenant_id TEXT PRIMARY KEY,
    razon_social TEXT NOT NULL,
    nombre_fantasia TEXT,
    cuit TEXT NOT NULL UNIQUE,
    condicion_iva TEXT NOT NULL DEFAULT 'Responsable Inscripto',
    ingresos_brutos TEXT,
    jurisdiccion_dgr TEXT DEFAULT '918 - San Juan',
    convenio_multilateral BOOLEAN DEFAULT FALSE,
    domicilio_fiscal TEXT,
    actividad_principal_arca TEXT,
    punto_venta_arca TEXT DEFAULT '0001',
    ambiente_arca TEXT DEFAULT 'HOMOLOGACION',
    prorrateo_iva_computable_pct NUMERIC(5,2) DEFAULT 100.00,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE VINCULACIÓN DE USUARIOS POR TENANT (AISLAMIENTO DE USUARIOS)
CREATE TABLE IF NOT EXISTS public.erp_tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES public.erp_tenants(tenant_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    rol_institucional TEXT NOT NULL,
    es_titular_erp BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- 3. TABLA DE AUTORIZACIÓN Y CONSENTIMIENTO ZONDA ERP -> ZONDA CLOUD (BAJO ARCA)
CREATE TABLE IF NOT EXISTS public.erp_zonda_cloud_autorizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL UNIQUE REFERENCES public.erp_tenants(tenant_id) ON DELETE CASCADE,
    autorizado BOOLEAN NOT NULL DEFAULT FALSE,
    token_vinculacion TEXT NOT NULL,
    estudio_contable_cuit TEXT NOT NULL,
    estudio_contable_nombre TEXT NOT NULL,
    estudio_contable_email TEXT NOT NULL,
    autorizado_por_usuario_erp TEXT,
    fecha_autorizacion TIMESTAMPTZ,
    fecha_expiracion TIMESTAMPTZ,
    perm_gestionar_ventas_arca BOOLEAN DEFAULT TRUE,
    perm_gestionar_compras_arca BOOLEAN DEFAULT TRUE,
    perm_cruzar_mis_comprobantes_arca BOOLEAN DEFAULT TRUE,
    perm_liquidar_iva_digital_f2002 BOOLEAN DEFAULT TRUE,
    perm_liquidar_retenciones_sire_sicore BOOLEAN DEFAULT TRUE,
    perm_liquidar_iibb_sifere BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INYECCIÓN DE COLUMNA tenant_id EN LAS TABLAS OPERATIVAS DEL ERP
ALTER TABLE IF EXISTS public.erp_clientes ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_proveedores ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_comprobantes_venta ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_comprobantes_compra ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_cuentas_bancarias ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_cheques ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_plan_cuentas ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_asientos_contables ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_inventario ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_empleados ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';
ALTER TABLE IF EXISTS public.erp_liquidaciones ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'TENANT-ECAR';

-- Campos adicionales ARCA para clasificación de Crédito Fiscal en Compras (Zonda Cloud)
ALTER TABLE IF EXISTS public.erp_comprobantes_compra
    ADD COLUMN IF NOT EXISTS caracter_credito_fiscal TEXT DEFAULT 'COMPUTABLE_100',
    ADD COLUMN IF NOT EXISTS porcentaje_computable NUMERIC(5,2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS rubro_credito_fiscal_f2002 TEXT DEFAULT 'COMPRA_BIENES_INSUMOS',
    ADD COLUMN IF NOT EXISTS codigo_operacion_arca TEXT DEFAULT '0',
    ADD COLUMN IF NOT EXISTS percepcion_iva NUMERIC(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS percepcion_iibb NUMERIC(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS retencion_ganancias NUMERIC(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS validado_mis_comprobantes_arca BOOLEAN DEFAULT TRUE;

-- 5. ÍNDICES DE RENDIMIENTO POR TENANT
CREATE INDEX IF NOT EXISTS idx_erp_clientes_tenant ON public.erp_clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_erp_proveedores_tenant ON public.erp_proveedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_erp_ventas_tenant ON public.erp_comprobantes_venta(tenant_id);
CREATE INDEX IF NOT EXISTS idx_erp_compras_tenant ON public.erp_comprobantes_compra(tenant_id);
CREATE INDEX IF NOT EXISTS idx_erp_inventario_tenant ON public.erp_inventario(tenant_id);
CREATE INDEX IF NOT EXISTS idx_erp_empleados_tenant ON public.erp_empleados(tenant_id);

-- 6. POLÍTICA DE ACCESO DELEGADO PARA ZONDA CLOUD (SOLO COMPRAS Y VENTAS CON AUTORIZACIÓN ACTIVA)
-- Permite que Zonda Cloud opere sobre erp_comprobantes_venta y erp_comprobantes_compra
-- únicamente si el titular de Zonda ERP tiene autorizado = true en erp_zonda_cloud_autorizaciones.
CREATE OR REPLACE FUNCTION public.fn_zonda_cloud_tiene_acceso_fiscal(p_tenant_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_zonda_cloud_autorizaciones a
    WHERE a.tenant_id = p_tenant_id
      AND a.autorizado = TRUE
      AND (a.perm_gestionar_ventas_arca = TRUE OR a.perm_gestionar_compras_arca = TRUE)
  );
$$;

-- 7. SEMILLA INICIAL DE LOS 3 TENANTS DEMO
INSERT INTO public.erp_tenants (
    tenant_id, razon_social, nombre_fantasia, cuit, condicion_iva,
    ingresos_brutos, jurisdiccion_dgr, convenio_multilateral,
    domicilio_fiscal, actividad_principal_arca, punto_venta_arca, prorrateo_iva_computable_pct
) VALUES
(
    'TENANT-ECAR', 'ECAR S. A. S.', 'ECAR Ingeniería & Redes', '30-71875908-7',
    'Responsable Inscripto', '918-718759-0', '918 - San Juan', FALSE,
    'Av. Libertador Gral. San Martín 1420 Oeste, San Juan',
    '422100 - Construcción de obras de ingeniería civil y redes eléctricas', '0001', 100.00
),
(
    'TENANT-SANATORIO', 'SANATORIO ARGENTINO S. R. L.', 'Sanatorio Argentino · Calidad QOAG', '30-60992686-0',
    'Responsable Inscripto', '918-609926-8', '918 - San Juan', FALSE,
    'Calle San Luis 432 Oeste, Capital, San Juan (C.P. 5400)',
    '861010 - Servicios de internación y clínicas médicas (Gravado + Exento Art. 7 inc. h Ley IVA)', '0003', 68.50
),
(
    'TENANT-ANDINA', 'DISTRIBUIDORA MAYORISTA ANDINA S. A.', 'Andina Logística & Consumo', '30-71549012-9',
    'Responsable Inscripto', '918-715490-1', '918 - San Juan / 913 - Mendoza', TRUE,
    'Ruta Nacional 40 Km 3480, Parque Industrial Pocito, San Juan',
    '463199 - Venta al por mayor de productos alimenticios e insumos industriales', '0005', 100.00
)
ON CONFLICT (tenant_id) DO NOTHING;
