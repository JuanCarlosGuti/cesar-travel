import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Separador visual cuando hay demasiadas páginas para listarlas todas. */
const PUNTOS = '…';

@Component({
  selector: 'app-paginador',
  template: `
    @if (totalPaginas() > 1) {
      <nav class="paginador" aria-label="Paginación de resultados">
        <button
          type="button"
          class="flecha"
          [disabled]="pagina() <= 1"
          aria-label="Página anterior"
          (click)="ir(pagina() - 1)"
        >
          ‹
        </button>

        @for (item of items(); track $index) {
          @if (item === PUNTOS) {
            <span class="puntos">{{ PUNTOS }}</span>
          } @else {
            <button
              type="button"
              class="numero"
              [class.activa]="item === pagina()"
              [attr.aria-current]="item === pagina() ? 'page' : null"
              (click)="ir($any(item))"
            >
              {{ item }}
            </button>
          }
        }

        <button
          type="button"
          class="flecha"
          [disabled]="pagina() >= totalPaginas()"
          aria-label="Página siguiente"
          (click)="ir(pagina() + 1)"
        >
          ›
        </button>
      </nav>
    }
  `,
  styleUrl: './paginador.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginadorComponent {
  readonly total = input.required<number>();
  readonly porPagina = input(8);
  readonly pagina = input.required<number>();

  readonly cambio = output<number>();

  protected readonly PUNTOS = PUNTOS;

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.porPagina())),
  );

  /**
   * Hasta 7 páginas se listan completas; con más se muestra una ventana
   * alrededor de la actual para que la barra no crezca sin control.
   */
  protected readonly items = computed<(number | string)[]>(() => {
    const ultima = this.totalPaginas();
    const actual = this.pagina();

    if (ultima <= 7) {
      return Array.from({ length: ultima }, (_, i) => i + 1);
    }

    const ventana = new Set<number>([1, ultima, actual, actual - 1, actual + 1]);
    const numeros = [...ventana].filter((n) => n >= 1 && n <= ultima).sort((a, b) => a - b);

    const resultado: (number | string)[] = [];
    numeros.forEach((numero, indice) => {
      if (indice > 0 && numero - numeros[indice - 1] > 1) {
        resultado.push(PUNTOS);
      }
      resultado.push(numero);
    });
    return resultado;
  });

  protected ir(destino: number): void {
    if (destino < 1 || destino > this.totalPaginas() || destino === this.pagina()) {
      return;
    }
    this.cambio.emit(destino);
  }
}
