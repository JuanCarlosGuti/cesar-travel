import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EstrellasComponent } from '../../comun/estrellas/estrellas';
import { ApiService } from '../../nucleo/api';
import { Reserva } from '../../nucleo/modelos';

const MESES = [
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

/** El backend (NestJS) devuelve `message` como string o como array de strings. */
function mensajeDeError(respuesta: HttpErrorResponse): string {
  const mensaje = respuesta?.error?.message;
  if (Array.isArray(mensaje)) {
    return mensaje.join('. ');
  }
  if (typeof mensaje === 'string' && mensaje.trim() !== '') {
    return mensaje;
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
}

/**
 * Las fechas llegan como 'YYYY-MM-DD'. Se parten a mano en vez de usar `new Date(texto)`
 * porque ese constructor las interpreta en UTC y en Colombia (UTC-5) mostraría el día anterior.
 */
function partesDeFecha(fecha: string): { dia: number; mes: number; anio: number } {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
  return { dia, mes, anio };
}

function formatearEnEspanol(fecha: string): string {
  const { dia, mes, anio } = partesDeFecha(fecha);
  if (!dia || !mes || !anio) {
    return fecha;
  }
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

/** Hoy en 'YYYY-MM-DD' local, para comparar con las fechas del backend como texto. */
function hoyIso(): string {
  const ahora = new Date();
  const mes = `${ahora.getMonth() + 1}`.padStart(2, '0');
  const dia = `${ahora.getDate()}`.padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

@Component({
  selector: 'app-mis-reservas',
  imports: [RouterLink, ReactiveFormsModule, EstrellasComponent],
  templateUrl: './mis-reservas.html',
  styleUrl: './mis-reservas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisReservasComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly reservas = signal<Reserva[]>([]);

  /** Ids de propiedades que este usuario YA reseñó: no se les vuelve a ofrecer el formulario. */
  private readonly resenadas = signal<number[]>([]);

  /** Id de la reserva cuyo formulario de reseña está abierto (null = ninguno). */
  protected readonly resenando = signal<number | null>(null);
  protected readonly enviandoResena = signal(false);
  protected readonly errorResena = signal<string | null>(null);
  protected readonly gracias = signal<number | null>(null);
  protected readonly cancelando = signal<number | null>(null);

  protected readonly formularioResena = this.fb.nonNullable.group({
    puntaje: [0, [Validators.required, Validators.min(1)]],
    comentario: ['', [Validators.maxLength(1000)]],
  });

  protected readonly vacio = computed(
    () => !this.cargando() && this.reservas().length === 0,
  );

  /**
   * El valor del control no es un signal, así que un `computed` sobre él nunca se
   * recalcularía: se refleja en un signal escuchando `valueChanges`.
   */
  protected readonly restantes = signal(1000);

  constructor() {
    this.formularioResena.controls.comentario.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((valor) => this.restantes.set(1000 - (valor?.length ?? 0)));

    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    forkJoin({
      reservas: this.api.misReservas(),
      resenadas: this.api.misResenas(),
    }).subscribe({
      next: ({ reservas, resenadas }) => {
        this.reservas.set(reservas);
        this.resenadas.set(resenadas ?? []);
        this.cargando.set(false);
      },
      error: (respuesta: HttpErrorResponse) => {
        this.error.set(mensajeDeError(respuesta));
        this.cargando.set(false);
      },
    });
  }

  protected fecha(valor: string): string {
    return formatearEnEspanol(valor);
  }

  /** Solo se puede reseñar una estadía terminada y una única vez por propiedad. */
  protected puedeResenar(reserva: Reserva): boolean {
    return reserva.salida.slice(0, 10) < hoyIso() && !this.resenadas().includes(reserva.propiedad.id);
  }

  protected abrirResena(reserva: Reserva): void {
    this.resenando.set(reserva.id);
    this.errorResena.set(null);
    this.gracias.set(null);
    this.formularioResena.reset({ puntaje: 0, comentario: '' });
  }

  protected cerrarResena(): void {
    this.resenando.set(null);
    this.errorResena.set(null);
  }

  protected elegirPuntaje(valor: number): void {
    this.formularioResena.controls.puntaje.setValue(valor);
  }

  protected enviarResena(reserva: Reserva): void {
    if (this.formularioResena.invalid) {
      this.formularioResena.markAllAsTouched();
      return;
    }

    const { puntaje, comentario } = this.formularioResena.getRawValue();
    const limpio = comentario.trim();

    this.enviandoResena.set(true);
    this.errorResena.set(null);

    this.api
      .crearResena({
        propiedadId: reserva.propiedad.id,
        puntaje,
        // Sin comentario se omite el campo: el backend lo tiene como opcional.
        ...(limpio ? { comentario: limpio } : {}),
      })
      .subscribe({
        next: () => {
          this.enviandoResena.set(false);
          this.resenando.set(null);
          this.gracias.set(reserva.propiedad.id);
          this.cargar();
        },
        error: (respuesta: HttpErrorResponse) => {
          this.enviandoResena.set(false);
          this.errorResena.set(mensajeDeError(respuesta));
        },
      });
  }

  protected cancelar(reserva: Reserva): void {
    const confirmado = confirm(
      `¿Cancelar tu reserva en "${reserva.propiedad.titulo}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) {
      return;
    }

    this.cancelando.set(reserva.id);
    this.error.set(null);

    this.api.cancelarReserva(reserva.id).subscribe({
      next: () => {
        this.cancelando.set(null);
        this.reservas.update((lista) => lista.filter((item) => item.id !== reserva.id));
      },
      error: (respuesta: HttpErrorResponse) => {
        this.cancelando.set(null);
        this.error.set(mensajeDeError(respuesta));
      },
    });
  }
}
