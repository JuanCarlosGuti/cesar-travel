import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminPropiedad,
  AdminResena,
  AdminReserva,
  AdminResumen,
  AdminUsuario,
  Caracteristica,
  Categoria,
  Conversacion,
  Departamento,
  Mensaje,
  Municipio,
  Municipio as MunicipioModelo,
  Ocupante,
  PropiedadDetalle,
  PropiedadResumen,
  RangoOcupado,
  Resena,
  Reserva,
  ResumenResenas,
  Sesion,
} from './modelos';

/**
 * Único punto de acceso a la API. Las URLs son relativas (`/api/...`): en producción el
 * backend sirve la SPA desde el mismo origen y en desarrollo el proxy de Angular
 * redirige al backend, así que nunca hay que configurar un host.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // Autenticación ----------------------------------------------------------

  registrar(datos: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    telefono?: string;
  }): Observable<Sesion> {
    return this.http.post<Sesion>('/api/auth/registro', datos);
  }

  iniciarSesion(email: string, password: string): Observable<Sesion> {
    return this.http.post<Sesion>('/api/auth/login', { email, password });
  }

  // Catálogo ---------------------------------------------------------------

  departamentos(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>('/api/departamentos');
  }

  /**
   * Ubicaciones (municipios de Colombia + destinos turísticos), con dos filtros según
   * para qué se pidan:
   *  - `departamentoId`: al publicar, la lista del departamento elegido.
   *  - `conPropiedades`: en el buscador, solo donde hay alojamientos — ofrecer los 1.122
   *    municipios del país sería inútil porque en casi todos no habría nada.
   */
  municipios(
    filtros: { departamentoId?: number; conPropiedades?: boolean } = {},
  ): Observable<Municipio[]> {
    let params = new HttpParams();
    if (filtros.departamentoId) {
      params = params.set('departamentoId', filtros.departamentoId);
    }
    if (filtros.conPropiedades) {
      params = params.set('conPropiedades', 'true');
    }
    return this.http.get<MunicipioModelo[]>('/api/municipios', { params });
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>('/api/categorias');
  }

  caracteristicas(): Observable<Caracteristica[]> {
    return this.http.get<Caracteristica[]>('/api/caracteristicas');
  }

  // Propiedades ------------------------------------------------------------

  propiedades(filtros: { categoriaId?: number; municipioId?: number } = {}): Observable<
    PropiedadResumen[]
  > {
    let params = new HttpParams();
    if (filtros.categoriaId) {
      params = params.set('categoriaId', filtros.categoriaId);
    }
    if (filtros.municipioId) {
      params = params.set('municipioId', filtros.municipioId);
    }
    return this.http.get<PropiedadResumen[]>('/api/propiedades', { params });
  }

  propiedad(id: number): Observable<PropiedadDetalle> {
    return this.http.get<PropiedadDetalle>(`/api/propiedades/${id}`);
  }

  propiedadesDe(duenioId: number): Observable<PropiedadResumen[]> {
    return this.http.get<PropiedadResumen[]>(`/api/propiedades/duenio/${duenioId}`);
  }

  crearPropiedad(datos: unknown): Observable<PropiedadDetalle> {
    return this.http.post<PropiedadDetalle>('/api/propiedades', datos);
  }

  actualizarPropiedad(id: number, datos: unknown): Observable<PropiedadDetalle> {
    return this.http.put<PropiedadDetalle>(`/api/propiedades/${id}`, datos);
  }

  eliminarPropiedad(id: number): Observable<void> {
    return this.http.delete<void>(`/api/propiedades/${id}`);
  }

  /** Sube archivos reales a la galería de una propiedad ya creada. */
  subirImagenes(id: number, archivos: File[]): Observable<PropiedadDetalle> {
    const cuerpo = new FormData();
    archivos.forEach((archivo) => cuerpo.append('archivos', archivo));
    return this.http.post<PropiedadDetalle>(`/api/propiedades/${id}/imagenes`, cuerpo);
  }

  eliminarImagen(propiedadId: number, imagenId: number): Observable<void> {
    return this.http.delete<void>(`/api/propiedades/${propiedadId}/imagenes/${imagenId}`);
  }

  // Reservas ---------------------------------------------------------------

  crearReserva(datos: {
    propiedadId: number;
    entrada: string;
    salida: string;
    horaLlegada?: string;
  }): Observable<Reserva> {
    return this.http.post<Reserva>('/api/reservas', datos);
  }

  misReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>('/api/reservas/mias');
  }

  ocupantesDe(propiedadId: number): Observable<Ocupante[]> {
    return this.http.get<Ocupante[]>(`/api/reservas/propiedad/${propiedadId}`);
  }

  disponibilidad(propiedadId: number): Observable<RangoOcupado[]> {
    return this.http.get<RangoOcupado[]>(`/api/reservas/disponibilidad/${propiedadId}`);
  }

  /** Ids de propiedades ocupadas en el rango — el buscador las excluye. */
  ocupadasEntre(desde: string, hasta: string): Observable<number[]> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<number[]>('/api/reservas/ocupadas', { params });
  }

  cancelarReserva(id: number): Observable<void> {
    return this.http.delete<void>(`/api/reservas/${id}`);
  }

  // Reseñas ----------------------------------------------------------------

  crearResena(datos: {
    propiedadId: number;
    puntaje: number;
    comentario?: string;
  }): Observable<Resena> {
    return this.http.post<Resena>('/api/resenas', datos);
  }

  resenasDe(propiedadId: number): Observable<Resena[]> {
    return this.http.get<Resena[]>(`/api/resenas/propiedad/${propiedadId}`);
  }

  /** Promedios en lote: una sola llamada para todas las tarjetas del catálogo. */
  resumenResenas(propiedadIds: number[]): Observable<ResumenResenas[]> {
    const params = new HttpParams().set('propiedadIds', propiedadIds.join(','));
    return this.http.get<ResumenResenas[]>('/api/resenas/resumen', { params });
  }

  misResenas(): Observable<number[]> {
    return this.http.get<number[]>('/api/resenas/mias');
  }

  // Chat -------------------------------------------------------------------

  abrirChat(propiedadId: number): Observable<Conversacion> {
    return this.http.post<Conversacion>('/api/chats', { propiedadId });
  }

  conversaciones(): Observable<Conversacion[]> {
    return this.http.get<Conversacion[]>('/api/chats');
  }

  mensajes(conversacionId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`/api/chats/${conversacionId}/mensajes`);
  }

  enviarMensaje(conversacionId: number, cuerpo: string): Observable<Mensaje> {
    return this.http.post<Mensaje>(`/api/chats/${conversacionId}/mensajes`, { cuerpo });
  }

  marcarLeidos(conversacionId: number): Observable<void> {
    return this.http.post<void>(`/api/chats/${conversacionId}/leido`, {});
  }

  mensajesSinLeer(): Observable<{ sinLeer: number }> {
    return this.http.get<{ sinLeer: number }>('/api/chats/sin-leer');
  }

  // Administración (solo ADMIN; el backend responde 403 al resto) ----------
  // Borrar un alojamiento o cancelar una reserva usan eliminarPropiedad y
  // cancelarReserva: esos endpoints ya aceptan a un ADMIN.

  adminResumen(): Observable<AdminResumen> {
    return this.http.get<AdminResumen>('/api/admin/resumen');
  }

  adminUsuarios(): Observable<AdminUsuario[]> {
    return this.http.get<AdminUsuario[]>('/api/admin/usuarios');
  }

  adminCambiarUsuario(
    id: number,
    cambio: { rol?: 'USER' | 'ADMIN'; bloqueado?: boolean },
  ): Observable<AdminUsuario> {
    return this.http.patch<AdminUsuario>(`/api/admin/usuarios/${id}`, cambio);
  }

  adminPropiedades(): Observable<AdminPropiedad[]> {
    return this.http.get<AdminPropiedad[]>('/api/admin/propiedades');
  }

  adminReservas(): Observable<AdminReserva[]> {
    return this.http.get<AdminReserva[]>('/api/admin/reservas');
  }

  adminResenas(): Observable<AdminResena[]> {
    return this.http.get<AdminResena[]>('/api/admin/resenas');
  }

  adminEliminarResena(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/resenas/${id}`);
  }
}
