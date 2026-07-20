import { Routes } from '@angular/router';
import { sesionGuard } from './nucleo/sesion.guard';

/**
 * Todas las páginas se cargan de forma diferida (lazy): el bundle inicial solo trae el
 * armazón y el home, y el resto llega cuando se navega.
 */
export const rutas: Routes = [
  {
    path: '',
    loadComponent: () => import('./paginas/inicio/inicio').then((m) => m.InicioComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./paginas/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./paginas/registro/registro').then((m) => m.RegistroComponent),
  },
  {
    path: 'buscar',
    loadComponent: () =>
      import('./paginas/resultados/resultados').then((m) => m.ResultadosComponent),
  },
  {
    path: 'propiedades/:id',
    loadComponent: () =>
      import('./paginas/detalle/detalle').then((m) => m.DetalleComponent),
  },
  {
    path: 'propiedades/:id/reservar',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/reservar/reservar').then((m) => m.ReservarComponent),
  },
  {
    path: 'mis-reservas',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/mis-reservas/mis-reservas').then((m) => m.MisReservasComponent),
  },
  {
    path: 'mis-propiedades',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/mis-propiedades/mis-propiedades').then(
        (m) => m.MisPropiedadesComponent,
      ),
  },
  {
    path: 'publicar',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/publicar/publicar').then((m) => m.PublicarComponent),
  },
  {
    path: 'publicar/:id',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/publicar/publicar').then((m) => m.PublicarComponent),
  },
  {
    path: 'mensajes',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/mensajes/mensajes').then((m) => m.MensajesComponent),
  },
  {
    path: 'mensajes/:id',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/mensajes/conversacion').then((m) => m.ConversacionComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./paginas/no-encontrado/no-encontrado').then(
        (m) => m.NoEncontradoComponent,
      ),
  },
];
