import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaginadorComponent } from '../../comun/paginador/paginador';
import { ApiService } from '../../nucleo/api';
import { PropiedadResumen } from '../../nucleo/modelos';
import { SesionService } from '../../nucleo/sesion';

const POR_PAGINA = 8;

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

@Component({
  selector: 'app-mis-propiedades',
  imports: [RouterLink, PaginadorComponent],
  templateUrl: './mis-propiedades.html',
  styleUrl: './mis-propiedades.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisPropiedadesComponent {
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly propiedades = signal<PropiedadResumen[]>([]);
  protected readonly eliminando = signal<number | null>(null);
  protected readonly pagina = signal(1);

  protected readonly POR_PAGINA = POR_PAGINA;

  protected readonly total = computed(() => this.propiedades().length);

  protected readonly vacio = computed(() => !this.cargando() && this.total() === 0);

  /** Se pagina en el cliente: un dueño no llega a tener tantas publicaciones. */
  protected readonly visibles = computed(() => {
    const desde = (this.pagina() - 1) * POR_PAGINA;
    return this.propiedades().slice(desde, desde + POR_PAGINA);
  });

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    const usuario = this.sesion.usuario();
    if (!usuario) {
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.api.propiedadesDe(usuario.id).subscribe({
      next: (lista) => {
        this.propiedades.set(lista);
        // Si se borró la última de la página actual, se retrocede para no quedar en blanco.
        const ultimaPagina = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
        if (this.pagina() > ultimaPagina) {
          this.pagina.set(ultimaPagina);
        }
        this.cargando.set(false);
      },
      error: (respuesta: HttpErrorResponse) => {
        this.error.set(mensajeDeError(respuesta));
        this.cargando.set(false);
      },
    });
  }

  protected cambiarPagina(destino: number): void {
    this.pagina.set(destino);
  }

  protected eliminar(propiedad: PropiedadResumen): void {
    const confirmado = confirm(
      `¿Eliminar "${propiedad.titulo}"? Se va a borrar junto con sus imágenes y no se puede deshacer.`,
    );
    if (!confirmado) {
      return;
    }

    this.eliminando.set(propiedad.id);
    this.error.set(null);

    this.api.eliminarPropiedad(propiedad.id).subscribe({
      next: () => {
        this.eliminando.set(null);
        this.cargar();
      },
      error: (respuesta: HttpErrorResponse) => {
        this.eliminando.set(null);
        this.error.set(mensajeDeError(respuesta));
      },
    });
  }
}
