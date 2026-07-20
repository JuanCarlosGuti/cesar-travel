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
      return JSON.parse(guardada) as Sesion;
    } catch {
      // Dato corrupto (edición manual, versión vieja): se descarta sin romper la app.
      localStorage.removeItem(CLAVE);
      return null;
    }
  }
}
