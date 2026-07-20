import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstrellasComponent } from '../estrellas/estrellas';
import { PropiedadResumen } from '../../nucleo/modelos';

@Component({
  selector: 'app-tarjeta-propiedad',
  imports: [RouterLink, EstrellasComponent],
  templateUrl: './tarjeta-propiedad.html',
  styleUrl: './tarjeta-propiedad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaPropiedadComponent {
  readonly propiedad = input.required<PropiedadResumen>();
  readonly promedio = input(0);
  readonly cantidadResenas = input(0);

  /** Si la propiedad no tiene portada se usa la imagen genérica de su categoría. */
  protected readonly imagen = computed(
    () => this.propiedad().imagenPortada ?? this.propiedad().categoria.imagenUrl,
  );

  protected readonly ubicacion = computed(() => {
    const { direccion, municipio } = this.propiedad();
    return [direccion, municipio.nombre, municipio.departamento].filter(Boolean).join(', ');
  });
}
