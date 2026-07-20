import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, map, of, switchMap, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BuscadorComponent } from '../../comun/buscador/buscador';
import { PaginadorComponent } from '../../comun/paginador/paginador';
import { TarjetaPropiedadComponent } from '../../comun/tarjeta-propiedad/tarjeta-propiedad';
import { ApiService } from '../../nucleo/api';
import {
  Categoria,
  Municipio,
  PropiedadResumen,
  ResumenResenas,
} from '../../nucleo/modelos';

const POR_PAGINA = 8;

interface Filtros {
  municipioId: number | null;
  categoriaId: number | null;
  desde: string | null;
  hasta: string | null;
}

/** Convierte un queryParam a número, descartando basura como `?municipioId=abc`. */
function numero(valor: string | null): number | null {
  const convertido = Number(valor);
  return valor && Number.isFinite(convertido) && convertido > 0 ? convertido : null;
}

/** `2026-07-19` → `19 de julio` (sin `Date`, que interpretaría UTC y correría un día). */
function fechaLegible(iso: string): string {
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  const [, mes, dia] = iso.split('-');
  const indice = Number(mes) - 1;
  return meses[indice] ? `${Number(dia)} de ${meses[indice]}` : iso;
}

@Component({
  selector: 'app-resultados',
  imports: [BuscadorComponent, PaginadorComponent, TarjetaPropiedadComponent],
  templateUrl: './resultados.html',
  styleUrl: './resultados.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultadosComponent {
  private readonly api = inject(ApiService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly filtros = signal<Filtros>({
    municipioId: null,
    categoriaId: null,
    desde: null,
    hasta: null,
  });
  protected readonly propiedades = signal<PropiedadResumen[]>([]);
  protected readonly resumenes = signal<Record<number, ResumenResenas>>({});
  protected readonly municipios = signal<Municipio[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly pagina = signal(1);

  protected readonly porPagina = POR_PAGINA;
  protected readonly total = computed(() => this.propiedades().length);

  protected readonly visibles = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.propiedades().slice(inicio, inicio + POR_PAGINA);
  });

  /** "Resultados en Palomino, La Guajira" / "Resultados de Cabañas" / "Todos los alojamientos". */
  protected readonly titulo = computed(() => {
    const { municipioId, categoriaId } = this.filtros();
    const municipio = this.municipios().find((item) => item.id === municipioId);
    if (municipio) {
      // Con 1.122 municipios hay nombres repetidos entre departamentos: se aclara cuál es.
      return `Resultados en ${municipio.nombre}, ${municipio.departamento}`;
    }
    const categoria = this.categorias().find((item) => item.id === categoriaId);
    if (categoria) {
      return `Resultados de ${categoria.titulo}`;
    }
    return 'Todos los alojamientos';
  });

  /** Sufijo con el rango de fechas, solo cuando la búsqueda es por disponibilidad. */
  protected readonly rango = computed(() => {
    const { desde, hasta } = this.filtros();
    return desde && hasta ? `disponibles del ${fechaLegible(desde)} al ${fechaLegible(hasta)}` : '';
  });

  constructor() {
    // Alcanza con los destinos que tienen alojamientos: es de donde puede venir el filtro.
    this.api
      .municipios({ conPropiedades: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (lista) => this.municipios.set(lista), error: () => undefined });

    this.api
      .categorias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (lista) => this.categorias.set(lista), error: () => undefined });

    // Las búsquedas encadenadas (cambiar municipio estando ya en /buscar) llegan como
    // un nuevo valor de queryParams sin recrear el componente: por eso se escucha el flujo.
    this.ruta.queryParamMap
      .pipe(
        map(
          (parametros): Filtros => ({
            municipioId: numero(parametros.get('municipioId')),
            categoriaId: numero(parametros.get('categoriaId')),
            desde: parametros.get('desde'),
            hasta: parametros.get('hasta'),
          }),
        ),
        tap((filtros) => {
          this.filtros.set(filtros);
          this.cargando.set(true);
          this.error.set(false);
          this.pagina.set(1);
        }),
        switchMap((filtros) =>
          forkJoin({
            propiedades: this.api
              .propiedades({
                categoriaId: filtros.categoriaId ?? undefined,
                municipioId: filtros.municipioId ?? undefined,
              })
              .pipe(catchError(() => of(null))),
            ocupadas:
              filtros.desde && filtros.hasta
                ? this.api
                    .ocupadasEntre(filtros.desde, filtros.hasta)
                    .pipe(catchError(() => of<number[]>([])))
                : of<number[]>([]),
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ propiedades, ocupadas }) => {
        this.cargando.set(false);
        if (!propiedades) {
          this.error.set(true);
          this.propiedades.set([]);
          return;
        }
        // Búsqueda por disponibilidad: fuera las que ya están reservadas en el rango.
        const bloqueadas = new Set(ocupadas);
        const disponibles = propiedades.filter(
          (propiedad) => !bloqueadas.has(propiedad.id),
        );
        this.propiedades.set(disponibles);
        this.cargarResumenes(disponibles.map((propiedad) => propiedad.id));
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
    document.getElementById('listado')?.scrollIntoView({ behavior: 'smooth' });
  }

  private cargarResumenes(ids: number[]): void {
    this.resumenes.set({});
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
        error: () => undefined,
      });
  }
}
