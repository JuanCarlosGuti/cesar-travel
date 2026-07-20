import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SesionService } from './sesion';

/** Agrega el token a las llamadas a la API. Un solo lugar en toda la app. */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const token = inject(SesionService).token();
  if (!token || !peticion.url.startsWith('/api')) {
    return siguiente(peticion);
  }
  return siguiente(
    peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};
