import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ApiService } from '../../nucleo/api';
import { Municipio } from '../../nucleo/modelos';

/** Hoy en formato ISO corto — tope mínimo de los dos campos de fecha. */
function hoyIso(): string {
  const ahora = new Date();
  const desfase = ahora.getTimezoneOffset() * 60_000;
  return new Date(ahora.getTime() - desfase).toISOString().slice(0, 10);
}

/**
 * Buscador de la marca: municipio + rango de fechas opcional. Se usa en el hero
 * del inicio y arriba de los resultados, por eso acepta valores iniciales y
 * conserva el `categoriaId` vigente al re-navegar.
 */
@Component({
  selector: 'app-buscador',
  templateUrl: './buscador.html',
  styleUrl: './buscador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Valores iniciales (los resultados los toman de la URL). */
  readonly municipioInicial = input<number | null>(null);
  readonly desdeInicial = input<string | null>(null);
  readonly hastaInicial = input<string | null>(null);
  /** Categoría vigente: se preserva al volver a buscar desde los resultados. */
  readonly categoriaId = input<number | null>(null);
  /** Variante compacta para la cabecera de resultados. */
  readonly compacto = input(false);

  protected readonly municipios = signal<Municipio[]>([]);
  protected readonly municipioId = signal<number | null>(null);
  protected readonly desde = signal<string | null>(null);
  protected readonly hasta = signal<string | null>(null);

  protected readonly hoy = hoyIso();
  protected readonly minSalida = computed(() => this.desde() ?? this.hoy);

  constructor() {
    // Los inputs pueden llegar después (queryParams asíncronos): se sincronizan.
    effect(() => this.municipioId.set(this.municipioInicial()));
    effect(() => this.desde.set(this.desdeInicial()));
    effect(() => this.hasta.set(this.hastaInicial()));

    this.api
      .municipios()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => this.municipios.set(lista),
        error: () => this.municipios.set([]),
      });
  }

  protected elegirMunicipio(valor: string): void {
    this.municipioId.set(valor ? Number(valor) : null);
  }

  protected elegirDesde(valor: string): void {
    this.desde.set(valor || null);
    // Una salida anterior a la nueva entrada deja de tener sentido.
    if (this.hasta() && valor && this.hasta()! < valor) {
      this.hasta.set(null);
    }
  }

  protected elegirHasta(valor: string): void {
    this.hasta.set(valor || null);
  }

  protected buscar(): void {
    const parametros: Record<string, string | number> = {};
    if (this.municipioId()) {
      parametros['municipioId'] = this.municipioId()!;
    }
    if (this.categoriaId()) {
      parametros['categoriaId'] = this.categoriaId()!;
    }
    // El rango solo viaja completo: con una sola fecha no hay disponibilidad que calcular.
    if (this.desde() && this.hasta()) {
      parametros['desde'] = this.desde()!;
      parametros['hasta'] = this.hasta()!;
    }
    this.router.navigate(['/buscar'], { queryParams: parametros });
  }
}
