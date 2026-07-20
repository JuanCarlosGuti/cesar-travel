import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Puntaje en estrellas. Sirve tanto para mostrar el promedio de una propiedad
 * (modo lectura) como para elegir un puntaje en el formulario de reseñas
 * (`seleccionable`), evitando duplicar el dibujo del ícono en dos componentes.
 */
@Component({
  selector: 'app-estrellas',
  template: `
    <div class="estrellas" [class.interactivo]="seleccionable()">
      <div
        class="fila"
        [attr.role]="seleccionable() ? 'radiogroup' : 'img'"
        [attr.aria-label]="etiqueta()"
        (mouseleave)="sobre.set(0)"
      >
        @for (indice of INDICES; track indice) {
          <span
            class="estrella"
            [class.activa]="indice <= activas()"
            [attr.role]="seleccionable() ? 'button' : null"
            [attr.tabindex]="seleccionable() ? 0 : null"
            [attr.aria-label]="seleccionable() ? indice + ' de 5' : null"
            (click)="elegir(indice)"
            (keydown.enter)="elegir(indice)"
            (keydown.space)="elegir(indice)"
            (mouseenter)="sobre.set(seleccionable() ? indice : 0)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.4l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.42l-5.88 3.09 1.12-6.55L2.48 9.32l6.58-.96z"
              />
            </svg>
          </span>
        }
      </div>

      @if (cantidad() > 0) {
        <span class="cantidad">({{ cantidad() }})</span>
      } @else if (!seleccionable()) {
        <span class="sin-resenas">Sin reseñas aún</span>
      }
    </div>
  `,
  styleUrl: './estrellas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstrellasComponent {
  readonly valor = input<number>(0);
  readonly cantidad = input<number>(0);
  readonly seleccionable = input(false);

  readonly seleccion = output<number>();

  protected readonly INDICES = [1, 2, 3, 4, 5];

  /** Estrella sobrevolada en modo interactivo (0 = ninguna). */
  protected readonly sobre = signal(0);

  /** El hover manda mientras el mouse está encima; si no, manda el valor. */
  protected readonly activas = computed(() =>
    this.sobre() > 0 ? this.sobre() : Math.round(this.valor()),
  );

  protected readonly etiqueta = computed(() =>
    this.seleccionable()
      ? 'Elegí un puntaje de 1 a 5 estrellas'
      : `${Math.round(this.valor())} de 5 estrellas`,
  );

  protected elegir(indice: number): void {
    if (!this.seleccionable()) {
      return;
    }
    this.seleccion.emit(indice);
  }
}
