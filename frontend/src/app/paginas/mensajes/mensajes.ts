import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../nucleo/api';
import { Conversacion } from '../../nucleo/modelos';

/** Cada cuánto se refresca la bandeja mientras la pestaña está abierta. */
const REFRESCO_MS = 10_000;

@Component({
  selector: 'app-mensajes',
  imports: [RouterLink],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MensajesComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly conversaciones = signal<Conversacion[]>([]);

  protected readonly vacio = computed(
    () => !this.cargando() && this.conversaciones().length === 0,
  );

  constructor() {
    this.cargar();

    const temporizador = setInterval(() => this.cargar(), REFRESCO_MS);
    this.destroyRef.onDestroy(() => clearInterval(temporizador));
  }

  private cargar(): void {
    this.api.conversaciones().subscribe({
      next: (lista) => {
        this.conversaciones.set(lista);
        this.cargando.set(false);
        this.error.set(null);
      },
      error: (respuesta: HttpErrorResponse) => {
        this.cargando.set(false);
        // Un fallo del sondeo no debe borrar lo que ya se está mostrando.
        if (this.conversaciones().length === 0) {
          const mensaje = respuesta?.error?.message;
          this.error.set(
            Array.isArray(mensaje)
              ? mensaje.join('. ')
              : typeof mensaje === 'string' && mensaje.trim() !== ''
                ? mensaje
                : 'No pudimos cargar tus mensajes. Intentá de nuevo.',
          );
        }
      },
    });
  }

  protected inicial(nombre: string): string {
    return (nombre?.trim()?.[0] ?? '?').toUpperCase();
  }
}
