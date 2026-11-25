// ==========================================================
// ZONDA ERP — ECOMMERCE MULTI-TENANT (ESTILO TIENDANUBE + VYPER)
// ==========================================================

export interface EcommerceAtributo {
  nombre: string; // Ej: "Talle", "Color", "Presentación"
  valores: string[]; // Ej: ["S", "M", "L"]
}

export interface EcommerceProductoVariante {
  id: string;
  sku: string;
  nombre: string; // Ej: "M / Negro"
  combinacion: Record<string, string>; // Ej: { Talle: "M", Color: "Negro" }
  precio: number;
  stock: number;
  imagen?: string;
  activa: boolean;
}

export interface EcommerceCategoria {
  id: string;
  tenantId: string;
  nombre: string;
  descripcion?: string;
  icono: string;
  imagenUrl?: string;
  orden: number;
  activa: boolean;
}

export interface EcommerceProducto {
  id: string;
  tenantId: string;
  articuloInventarioId?: string; // Vínculo directo con 06 - Inventario
  sku: string;
  nombre: string;
  descripcionCorta: string;
  descripcionLarga: string;
  categoriaId?: string;
  marca: string;
  precioBase: number;
  enOferta: boolean;
  precioOferta?: number;
  stockTotal: number;
  imagenes: string[];
  publicado: boolean;
  destacado: boolean;
  tieneVariantes: boolean;
  atributos: EcommerceAtributo[];
  variantes: EcommerceProductoVariante[];
  createdAt: string;
  updatedAt: string;
}

export interface EcommerceFaq {
  pregunta: string;
  respuesta: string;
}

export interface EcommerceMetodoEnvio {
  id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  gratisDesde?: number;
  activo: boolean;
  tipo: 'retiro_local' | 'envio_domicilio' | 'correo_nacional';
}

export interface EcommerceTiendaConfig {
  id: string;
  tenantId: string;
  slug: string; // Ej: "ecar-sas" -> /?tienda=ecar-sas
  activa: boolean;
  identidad: {
    nombreTienda: string;
    slogan: string;
    logoUrl: string;
    colorPrimario: string;
    colorAcento: string;
    whatsappNumero: string;
    whatsappMensaje: string;
    instagram: string;
    emailContacto: string;
    direccionLocal: string;
    horarios: string;
  };
  marquesina: {
    activa: boolean;
    mensajes: string[];
    bgColor: string;
    textColor: string;
  };
  hero: {
    titulo: string;
    subtitulo: string;
    textoBoton: string;
    imagenFondoUrl: string;
  };
  pagos: {
    mercadoPagoActivo: boolean;
    mercadoPagoCuotasTexto: string;
    transferenciaActiva: boolean;
    transferenciaCbu: string;
    transferenciaAlias: string;
    transferenciaTitular: string;
    transferenciaDescuentoPct: number;
    efectivoRetiroActivo: boolean;
    cuentaTesoreriaDestinoId: string;
  };
  envios: EcommerceMetodoEnvio[];
  faqs: EcommerceFaq[];
  updatedAt: string;
}

export interface EcommerceCompradorGoogle {
  id: string;
  tenantId: string;
  googleUid: string;
  email: string;
  nombre: string;
  avatarUrl?: string;
  telefono: string;
  dniCuit: string;
  direccionEnvio: string;
  ciudad: string;
  codigoPostal: string;
  clienteErpId?: string;
  esModoDemoGoogle?: boolean;
  createdAt: string;
}

export interface EcommerceCartItem {
  cartKey: string; // productoId__varianteId o productoId
  productoId: string;
  articuloInventarioId?: string;
  nombre: string;
  sku: string;
  varianteId?: string;
  varianteNombre?: string;
  precioUnitario: number;
  cantidad: number;
  stockDisponible: number;
  imagen?: string;
}

export type EstadoPagoPedido = 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
export type EstadoEnvioPedido = 'pendiente' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';
export type MetodoPagoEcommerce = 'mercadopago' | 'transferencia' | 'efectivo_retiro';

export interface EcommercePedidoItem {
  productoId: string;
  articuloInventarioId?: string;
  sku: string;
  nombre: string;
  varianteId?: string;
  varianteNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  imagen?: string;
}

export interface EcommercePedido {
  id: string;
  tenantId: string;
  numeroPedido: string; // Ej: "EC-0001"
  fecha: string;
  compradorId: string;
  compradorGoogleUid: string;
  compradorNombre: string;
  compradorEmail: string;
  compradorTelefono: string;
  compradorDniCuit: string;
  direccionEnvio: string;
  metodoEnvioId: string;
  metodoEnvioNombre: string;
  metodoPago: MetodoPagoEcommerce;
  estadoPago: EstadoPagoPedido;
  estadoEnvio: EstadoEnvioPedido;
  subtotal: number;
  cuponCodigo?: string;
  descuentoMonto: number;
  costoEnvio: number;
  total: number;
  notas?: string;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  comprobanteTransferenciaRef?: string;
  sincronizadoErp: boolean;
  facturaErpNro?: string;
  clienteErpId?: string;
  items: EcommercePedidoItem[];
}

export interface EcommerceCupon {
  id: string;
  tenantId: string;
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  minimoCompra: number;
  usosActuales: number;
  usosMaximos: number;
  activo: boolean;
}

export interface EcommerceTenantState {
  config: EcommerceTiendaConfig;
  categorias: EcommerceCategoria[];
  productos: EcommerceProducto[];
  pedidos: EcommercePedido[];
  compradores: EcommerceCompradorGoogle[];
  cupones: EcommerceCupon[];
}
