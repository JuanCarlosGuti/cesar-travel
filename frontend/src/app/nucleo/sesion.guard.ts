import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion';

/** Rutas privadas: sin sesión se va al login recordando a dónde quería entrar. */
export const sesionGuard: CanActivateFn = (_ruta, estado) => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  if (sesion.autenticado()) {
    return true;
  }
  return router.createUrlTree(['/login'], {
    queryParams: { volverA: estado.url },
  });
};
