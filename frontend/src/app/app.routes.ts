import { Routes } from '@angular/router';
import { adminGuard } from './nucleo/admin.guard';
import { sesionGuard } from './nucleo/sesion.guard';

/**
 * Todas las páginas se cargan de forma diferida (lazy): el bundle inicial solo trae el
 * armazón y el home, y el resto llega cuando se navega.
 *
 * Si se agrega o cambia una ruta, actualizar también RUTAS_SPA en
 * backend/src/spa/spa.controller.ts: el servidor responde 404 a lo que no esté ahí.
 */
export const rutas: Routes = [
  {
    path: '',
    loadComponent: () => import('./paginas/inicio/inicio').then((m) => m.InicioComponent),
  },
  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./paginas/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    title: 'Crear cuenta',
    loadComponent: () =>
      import('./paginas/registro/registro').then((m) => m.RegistroComponent),
  },
  {
    path: 'buscar',
    title: 'Buscar alojamientos',
    loadComponent: () =>
      import('./paginas/resultados/resultados').then((m) => m.ResultadosComponent),
  },
  {
    path: 'propiedades/:id',
    title: 'Alojamiento',
    loadComponent: () =>
      import('./paginas/detalle/detalle').then((m) => m.DetalleComponent),
  },
  {
    path: 'propiedades/:id/reservar',
    title: 'Reservar',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/reservar/reservar').then((m) => m.ReservarComponent),
  },
  {
    path: 'mis-reservas',
    title: 'Mis reservas',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/mis-reservas/mis-reservas').then((m) => m.MisReservasComponent),
  },
  {
    path: 'mis-propiedades',
    title: 'Mis propiedades',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/mis-propiedades/mis-propiedades').then(
        (m) => m.MisPropiedadesComponent,
      ),
  },
  {
    path: 'publicar',
    title: 'Publicar alojamiento',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/publicar/publicar').then((m) => m.PublicarComponent),
  },
  {
    path: 'publicar/:id',
    title: 'Editar alojamiento',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/publicar/publicar').then((m) => m.PublicarComponent),
  },
  {
    path: 'mensajes',
    title: 'Mensajes',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/mensajes/mensajes').then((m) => m.MensajesComponent),
  },
  {
    path: 'mensajes/:id',
    title: 'Conversación',
    canActivate: [sesionGuard],
    loadComponent: () =>
      import('./paginas/mensajes/conversacion').then((m) => m.ConversacionComponent),
  },
  {
    path: 'admin',
    title: 'Administración',
    canActivate: [sesionGuard, adminGuard],
    loadComponent: () => import('./paginas/admin/admin').then((m) => m.AdminComponent),
  },
  {
    path: '**',
    title: 'Página no encontrada',
    loadComponent: () =>
      import('./paginas/no-encontrado/no-encontrado').then(
        (m) => m.NoEncontradoComponent,
      ),
  },
];
