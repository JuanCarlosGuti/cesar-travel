import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Ícono de marca de Del Valle al Mar — árbol de cañaguate estilizado. El árbol se
 * quedó como símbolo regional aunque ya no da nombre a la marca.
 *
 * No define tamaño propio: el host es inline-flex y el SVG lo llena, así que
 * el contenedor manda (`app-canaguate-mark { width: 40px }`, una clase, etc.).
 */
@Component({
  selector: 'app-canaguate-mark',
  templateUrl: './canaguate-mark.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class CanaguateMarkComponent {
  /** Texto accesible del ícono; se expone como aria-label del SVG. */
  readonly title = input('Del Valle al Mar');
}
