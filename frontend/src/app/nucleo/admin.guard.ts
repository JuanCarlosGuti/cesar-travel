import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion';

/**
 * Solo ADMIN. Es comodidad, no seguridad: quien fuerce la ruta ve la página, pero la
 * API responde 403 a todo lo que el panel pide si no es ADMIN (AdminGuard del backend).
 */
export const adminGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.usuario()?.rol === 'ADMIN' ? true : inject(Router).createUrlTree(['/']);
};
