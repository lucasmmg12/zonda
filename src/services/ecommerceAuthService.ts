import { supabase } from '../lib/supabase';
import type { EcommerceCompradorGoogle } from '../types/ecommerce';

const BUYER_SESSION_KEY = 'zonda_ecommerce_google_buyer_v1';

export interface GoogleBuyerSession {
  googleUid: string;
  email: string;
  nombre: string;
  avatarUrl?: string;
  esModoDemoGoogle?: boolean;
}

export function getStoredGoogleBuyer(): GoogleBuyerSession | null {
  try {
    const raw = localStorage.getItem(BUYER_SESSION_KEY);
    return raw ? (JSON.parse(raw) as GoogleBuyerSession) : null;
  } catch {
    return null;
  }
}

export function saveStoredGoogleBuyer(buyer: GoogleBuyerSession | null): void {
  try {
    if (!buyer) {
      localStorage.removeItem(BUYER_SESSION_KEY);
    } else {
      localStorage.setItem(BUYER_SESSION_KEY, JSON.stringify(buyer));
    }
    window.dispatchEvent(new CustomEvent('zonda_ecommerce_buyer_changed', { detail: buyer }));
  } catch {
    // ignore
  }
}

/**
 * Obtiene la sesión real de Supabase Auth (Google OAuth) si existe,
 * o devuelve la sesión local guardada (sandbox/demo).
 */
export async function resolverSesionGoogleBuyer(): Promise<GoogleBuyerSession | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;
    if (user && user.email) {
      const session: GoogleBuyerSession = {
        googleUid: user.id,
        email: user.email,
        nombre:
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email.split('@')[0],
        avatarUrl: (user.user_metadata?.avatar_url as string) || (user.user_metadata?.picture as string),
        esModoDemoGoogle: false
      };
      saveStoredGoogleBuyer(session);
      return session;
    }
  } catch {
    // fallback to stored session
  }
  return getStoredGoogleBuyer();
}

/**
 * Dispara el flujo real de Google OAuth a través de Supabase Auth.
 * Retorna { redirected: true } si redirige a Google, o { error } si el proveedor
 * todavía no fue habilitado en el proyecto de Supabase.
 */
export async function iniciarSesionConGoogleOAuth(redirectUrl?: string): Promise<{
  redirected: boolean;
  error?: string;
}> {
  try {
    const targetRedirect = redirectUrl || window.location.href;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetRedirect,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    if (error) {
      return { redirected: false, error: error.message };
    }
    if (data?.url) {
      window.location.href = data.url;
      return { redirected: true };
    }
    return { redirected: false, error: 'No se recibió URL de autorización de Google.' };
  } catch (err) {
    return {
      redirected: false,
      error: err instanceof Error ? err.message : 'Error conectando con Google OAuth'
    };
  }
}

/**
 * Modo Sandbox/Demo para desarrollo local o QA cuando Google OAuth
 * aún no está configurado en Supabase Dashboard para localhost.
 */
export function iniciarSesionGoogleSandbox(params: {
  email: string;
  nombre: string;
}): GoogleBuyerSession {
  const cleanEmail = params.email.trim().toLowerCase();
  const session: GoogleBuyerSession = {
    googleUid: `google-sandbox-${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 14)}`,
    email: cleanEmail,
    nombre: params.nombre.trim() || cleanEmail.split('@')[0],
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(params.nombre.trim() || 'Cliente')}&background=1b365d&color=fff`,
    esModoDemoGoogle: true
  };
  saveStoredGoogleBuyer(session);
  return session;
}

export async function cerrarSesionGoogleBuyer(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  saveStoredGoogleBuyer(null);
}

export function buildCompradorProfile(
  tenantId: string,
  session: GoogleBuyerSession,
  datos: { telefono: string; dniCuit: string; direccionEnvio: string; ciudad: string; codigoPostal: string },
  existente?: EcommerceCompradorGoogle
): EcommerceCompradorGoogle {
  return {
    id: existente?.id || `COMP-${Date.now()}`,
    tenantId,
    googleUid: session.googleUid,
    email: session.email,
    nombre: session.nombre,
    avatarUrl: session.avatarUrl,
    telefono: datos.telefono,
    dniCuit: datos.dniCuit,
    direccionEnvio: datos.direccionEnvio,
    ciudad: datos.ciudad,
    codigoPostal: datos.codigoPostal,
    clienteErpId: existente?.clienteErpId,
    esModoDemoGoogle: session.esModoDemoGoogle,
    createdAt: existente?.createdAt || new Date().toISOString()
  };
}
