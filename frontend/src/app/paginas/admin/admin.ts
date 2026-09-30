import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { ApiService } from '../../nucleo/api';
import {
  AdminPropiedad,
  AdminResena,
  AdminReserva,
  AdminResumen,
  AdminUsuario,
} from '../../nucleo/modelos';
import { SesionService } from '../../nucleo/sesion';

type Pestana = 'propiedades' | 'reservas' | 'usuarios' | 'resenas';

/** El backend (NestJS) devuelve `message` como string o como array de strings. */
function mensajeDeError(respuesta: HttpErrorResponse): string {
  const mensaje = respuesta?.error?.message;
  if (Array.isArray(mensaje)) {
    return mensaje.join('. ');
  }
  if (typeof mensaje === 'string' && mensaje.trim() !== '') {
    return mensaje;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

/** `yyyy-MM-dd` de hoy en hora local, para decir si una reserva ya empezó. */
function hoyIso(): string {
  const ahora = new Date();
  const mes = `${ahora.getMonth() + 1}`.padStart(2, '0');
  const dia = `${ahora.getDate()}`.padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Panel de administración: ver todo el sitio y actuar sobre lo que no es propio.
 * Cada acción recarga su lista y el resumen, así los números de arriba no mienten.
 */
@Component({
  selector: 'app-admin',
  imports: [RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  private readonly api = inject(ApiService);
  protected readonly sesion = inject(SesionService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pestana = signal<Pestana>('propiedades');
  /** Clave de la fila con una acción en curso (p. ej. "usuario-5"), para deshabilitarla. */
  protected readonly ocupado = signal<string | null>(null);

  protected readonly resumen = signal<AdminResumen | null>(null);
  protected readonly propiedades = signal<AdminPropiedad[]>([]);
  protected readonly reservas = signal<AdminReserva[]>([]);
  protected readonly usuarios = signal<AdminUsuario[]>([]);
  protected readonly resenas = signal<AdminResena[]>([]);

  protected readonly hoy = hoyIso();
  protected readonly miId = computed(() => this.sesion.usuario()?.id ?? null);

  protected readonly pestanas = computed(() => [
    { id: 'propiedades' as const, nombre: 'Alojamientos', total: this.propiedades().length },
    { id: 'reservas' as const, nombre: 'Reservas', total: this.reservas().length },
    { id: 'usuarios' as const, nombre: 'Usuarios', total: this.usuarios().length },
    { id: 'resenas' as const, nombre: 'Reseñas', total: this.resenas().length },
  ]);

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    forkJoin({
      resumen: this.api.adminResumen(),
      propiedades: this.api.adminPropiedades(),
      reservas: this.api.adminReservas(),
      usuarios: this.api.adminUsuarios(),
      resenas: this.api.adminResenas(),
    }).subscribe({
      next: (datos) => {
        this.resumen.set(datos.resumen);
        this.propiedades.set(datos.propiedades);
        this.reservas.set(datos.reservas);
        this.usuarios.set(datos.usuarios);
        this.resenas.set(datos.resenas);
        this.cargando.set(false);
      },
      error: (respuesta: HttpErrorResponse) => {
        this.error.set(mensajeDeError(respuesta));
        this.cargando.set(false);
      },
    });
  }

  protected estadoReserva(reserva: AdminReserva): 'Por venir' | 'En curso' | 'Terminada' {
    if (reserva.entrada > this.hoy) {
      return 'Por venir';
    }
    return reserva.salida > this.hoy ? 'En curso' : 'Terminada';
  }

  protected fecha(iso: string): string {
    const [a, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${a}`;
  }

  protected estrellas(puntaje: number): string {
    return '★'.repeat(puntaje) + '☆'.repeat(Math.max(0, 5 - puntaje));
  }

  // Acciones -----------------------------------------------------------------

  protected eliminarPropiedad(p: AdminPropiedad): void {
    const reservas = p.reservas ? ` y sus ${p.reservas} reservas` : '';
    this.ejecutar(
      `propiedad-${p.id}`,
      `¿Eliminar "${p.titulo}"${reservas}? No se puede deshacer.`,
      this.api.eliminarPropiedad(p.id),
    );
  }

  protected cancelarReserva(r: AdminReserva): void {
    const quien = r.huesped ? `${r.huesped.nombre} ${r.huesped.apellido}` : 'el huésped';
    this.ejecutar(
      `reserva-${r.id}`,
      `¿Cancelar la reserva de ${quien} en "${r.propiedad.titulo}" (${this.fecha(r.entrada)} → ${this.fecha(r.salida)})?`,
      this.api.cancelarReserva(r.id),
    );
  }

  protected cambiarRol(u: AdminUsuario): void {
    const nuevo = u.rol === 'ADMIN' ? 'USER' : 'ADMIN';
    const texto =
      nuevo === 'ADMIN'
        ? `¿Hacer ADMIN a ${u.email}? Podrá editar y borrar todo el sitio y gestionar usuarios.`
        : `¿Quitarle el rol ADMIN a ${u.email}?`;
    this.ejecutar(`usuario-${u.id}`, texto, this.api.adminCambiarUsuario(u.id, { rol: nuevo }));
  }

  protected cambiarBloqueo(u: AdminUsuario): void {
    const texto = u.bloqueado
      ? `¿Desbloquear a ${u.email}? Podrá volver a iniciar sesión.`
      : `¿Bloquear a ${u.email}? Se le cierra la sesión y no podrá volver a entrar.`;
    this.ejecutar(
      `usuario-${u.id}`,
      texto,
      this.api.adminCambiarUsuario(u.id, { bloqueado: !u.bloqueado }),
    );
  }

  protected eliminarResena(r: AdminResena): void {
    const autor = r.autor ? `${r.autor.nombre} ${r.autor.apellido}` : 'un usuario';
    this.ejecutar(
      `resena-${r.id}`,
      `¿Eliminar la reseña de ${autor} sobre "${r.propiedad.titulo}"? No se puede deshacer.`,
      this.api.adminEliminarResena(r.id),
    );
  }

  /** Confirma, ejecuta y recarga todo: una acción puede mover varios contadores. */
  private ejecutar(clave: string, confirmacion: string, accion: Observable<unknown>): void {
    if (!confirm(confirmacion)) {
      return;
    }
    this.ocupado.set(clave);
    this.error.set(null);
    accion.subscribe({
      next: () => {
        this.ocupado.set(null);
        this.cargar();
      },
      error: (respuesta: HttpErrorResponse) => {
        this.ocupado.set(null);
        this.error.set(mensajeDeError(respuesta));
      },
    });
  }
}
