import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SesionService } from './sesion';

/**
 * Agrega el token a las llamadas a la API. Un solo lugar en toda la app.
 *
 * Si la API responde 401 a una llamada que llevaba token, ese token ya no vale (venció
 * o se rotó JWT_SECRET): se cierra la sesión y se manda al login. Sin esto la app seguía
 * mostrándose "con sesión iniciada" mientras cada acción fallaba.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const token = sesion.token();
  if (!token || !peticion.url.startsWith('/api')) {
    return siguiente(peticion);
  }
  return siguiente(
    peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  ).pipe(
    catchError((error: unknown) => {
      // Se compara con el token de esta petición: si mientras tanto se inició otra
      // sesión, un 401 viejo no debe cerrarla.
      if (error instanceof HttpErrorResponse && error.status === 401 && sesion.token() === token) {
        sesion.cerrar();
        void router.navigate(['/login'], { queryParams: { volverA: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
