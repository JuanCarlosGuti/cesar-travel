import { Injectable, computed, signal } from '@angular/core';
import { Sesion } from './modelos';

const CLAVE = 'cesar-travel.sesion';

/**
 * Sesión del usuario: una sola fuente de verdad para toda la app.
 *
 * Vive en un signal (para que las vistas reaccionen solas) y se refleja en
 * localStorage para sobrevivir a un refresco de página. El interceptor de HTTP lee
 * el token de acá, así que no hay lecturas sueltas de localStorage repartidas por el código.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly sesion = signal<Sesion | null>(this.leerDelAlmacenamiento());

  readonly usuario = this.sesion.asReadonly();
  readonly autenticado = computed(() => this.sesion() !== null);
  readonly token = computed(() => this.sesion()?.token ?? null);

  iniciar(sesion: Sesion): void {
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
    this.sesion.set(sesion);
  }

  cerrar(): void {
    localStorage.removeItem(CLAVE);
    this.sesion.set(null);
  }

  private leerDelAlmacenamiento(): Sesion | null {
    const guardada = localStorage.getItem(CLAVE);
    if (!guardada) {
      return null;
    }
    try {
      const sesion = JSON.parse(guardada) as Sesion;
      // Un token vencido no es una sesión: se descarta al abrir la app en vez de
      // mostrar "Hola, …" y fallar en la primera acción.
      if (vencido(sesion.token)) {
        localStorage.removeItem(CLAVE);
        return null;
      }
      return sesion;
    } catch {
      // Dato corrupto (edición manual, versión vieja): se descarta sin romper la app.
      localStorage.removeItem(CLAVE);
      return null;
    }
  }
}

/** Lee `exp` del JWT (segundos). Sin `exp` legible se considera vencido. */
function vencido(token: string): boolean {
  const carga = token.split('.')[1];
  if (!carga) {
    return true;
  }
  const { exp } = JSON.parse(atob(carga.replace(/-/g, '+').replace(/_/g, '/'))) as {
    exp?: number;
  };
  return typeof exp !== 'number' || exp * 1000 <= Date.now();
}
