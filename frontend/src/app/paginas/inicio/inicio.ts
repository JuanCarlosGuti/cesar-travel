import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BuscadorComponent } from '../../comun/buscador/buscador';
import { PaginadorComponent } from '../../comun/paginador/paginador';
import { TarjetaPropiedadComponent } from '../../comun/tarjeta-propiedad/tarjeta-propiedad';
import { ApiService } from '../../nucleo/api';
import { Categoria, PropiedadResumen, ResumenResenas } from '../../nucleo/modelos';

const POR_PAGINA = 8;

/** Fisher-Yates: mezcla estable en memoria, sin mutar el arreglo original. */
function mezclar<T>(elementos: T[]): T[] {
  const copia = [...elementos];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, BuscadorComponent, PaginadorComponent, TarjetaPropiedadComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categorias = signal<Categoria[]>([]);
  /** Ya vienen mezcladas: el orden se fija una sola vez, al cargar. */
  protected readonly propiedades = signal<PropiedadResumen[]>([]);
  protected readonly resumenes = signal<Record<number, ResumenResenas>>({});
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly pagina = signal(1);

  protected readonly total = computed(() => this.propiedades().length);
  protected readonly porPagina = POR_PAGINA;

  protected readonly visibles = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.propiedades().slice(inicio, inicio + POR_PAGINA);
  });

  constructor() {
    this.api
      .categorias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => this.categorias.set(lista),
        error: () => this.categorias.set([]),
      });

    this.api
      .propiedades()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.propiedades.set(mezclar(lista));
          this.cargando.set(false);
          this.cargarResumenes(lista.map((propiedad) => propiedad.id));
        },
        error: () => {
          this.cargando.set(false);
          this.error.set(true);
        },
      });
  }

  protected promedioDe(id: number): number {
    return this.resumenes()[id]?.promedio ?? 0;
  }

  protected cantidadDe(id: number): number {
    return this.resumenes()[id]?.cantidad ?? 0;
  }

  protected cambiarPagina(destino: number): void {
    this.pagina.set(destino);
    document.getElementById('recomendaciones')?.scrollIntoView({ behavior: 'smooth' });
  }

  /** Una sola llamada en lote para todas las tarjetas del catálogo. */
  private cargarResumenes(ids: number[]): void {
    if (!ids.length) {
      return;
    }
    this.api
      .resumenResenas(ids)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          const indice: Record<number, ResumenResenas> = {};
          lista.forEach((resumen) => (indice[resumen.propiedadId] = resumen));
          this.resumenes.set(indice);
        },
        // Sin reseñas la tarjeta igual se ve bien: no vale la pena molestar al usuario.
        error: () => undefined,
      });
  }
}
