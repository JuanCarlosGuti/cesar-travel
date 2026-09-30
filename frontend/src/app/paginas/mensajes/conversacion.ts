import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../nucleo/api';
import { Conversacion, Mensaje } from '../../nucleo/modelos';
import { SesionService } from '../../nucleo/sesion';

/** Sondeo del hilo: sin websockets, se relee cada pocos segundos. */
const SONDEO_MS = 4_000;

@Component({
  selector: 'app-conversacion',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './conversacion.html',
  styleUrl: './conversacion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversacionComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  private readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly hilo = viewChild<ElementRef<HTMLDivElement>>('hilo');

  protected readonly conversacionId = Number(this.ruta.snapshot.paramMap.get('id'));

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly conversacion = signal<Conversacion | null>(null);
  protected readonly enviando = signal(false);

  protected readonly miId = computed(() => this.sesion.usuario()?.id ?? -1);

  protected readonly formulario = this.fb.nonNullable.group({
    cuerpo: [''],
  });

  /** Último id conocido: sirve para detectar mensajes nuevos sin comparar todo el hilo. */
  private ultimoId = 0;

  constructor() {
    this.cargarConversacion();
    this.cargarMensajes(true);

    const temporizador = setInterval(() => this.cargarMensajes(false), SONDEO_MS);
    this.destroyRef.onDestroy(() => clearInterval(temporizador));
  }

  /** No hay endpoint de una sola conversación: se toma de la bandeja. */
  private cargarConversacion(): void {
    this.api.conversaciones().subscribe({
      next: (lista) => {
        this.conversacion.set(lista.find((item) => item.id === this.conversacionId) ?? null);
      },
      error: () => {
        // La cabecera es secundaria: si falla, el hilo se sigue mostrando igual.
      },
    });
  }

  private cargarMensajes(primeraVez: boolean): void {
    this.api.mensajes(this.conversacionId).subscribe({
      next: (lista) => {
        const ultimo = lista.length > 0 ? lista[lista.length - 1].id : 0;
        const hayNuevos = ultimo !== this.ultimoId;

        this.mensajes.set(lista);
        this.cargando.set(false);
        this.error.set(null);

        // Sin mensajes nuevos no se toca el scroll: el usuario puede estar leyendo arriba.
        if (hayNuevos || primeraVez) {
          this.ultimoId = ultimo;
          // setTimeout (no microtask): hay que esperar a que Angular pinte los mensajes
          // nuevos, si no `scrollHeight` todavía es el de antes y el scroll queda corto.
          setTimeout(() => this.irAlFinal());
          if (lista.length > 0) {
            this.api.marcarLeidos(this.conversacionId).subscribe({ error: () => {} });
          }
        }
      },
      error: (respuesta: HttpErrorResponse) => {
        this.cargando.set(false);
        if (this.mensajes().length === 0) {
          const mensaje = respuesta?.error?.message;
          this.error.set(
            Array.isArray(mensaje)
              ? mensaje.join('. ')
              : typeof mensaje === 'string' && mensaje.trim() !== ''
                ? mensaje
                : 'No pudimos cargar esta conversación.',
          );
        }
      },
    });
  }

  private irAlFinal(): void {
    const contenedor = this.hilo()?.nativeElement;
    if (contenedor) {
      contenedor.scrollTop = contenedor.scrollHeight;
    }
  }

  protected hora(creadoEn: string): string {
    const fecha = new Date(creadoEn);
    if (Number.isNaN(fecha.getTime())) {
      return '';
    }
    return `${`${fecha.getHours()}`.padStart(2, '0')}:${`${fecha.getMinutes()}`.padStart(2, '0')}`;
  }

  protected propio(mensaje: Mensaje): boolean {
    return mensaje.autorId === this.miId();
  }

  protected enviar(): void {
    const cuerpo = this.formulario.controls.cuerpo.value.trim();
    if (cuerpo === '' || this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.api.enviarMensaje(this.conversacionId, cuerpo).subscribe({
      next: (mensaje) => {
        this.enviando.set(false);
        this.formulario.reset({ cuerpo: '' });
        this.mensajes.update((lista) => [...lista, mensaje]);
        this.ultimoId = mensaje.id;
        setTimeout(() => this.irAlFinal());
      },
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        const mensaje = respuesta?.error?.message;
        this.error.set(
          Array.isArray(mensaje)
            ? mensaje.join('. ')
            : typeof mensaje === 'string' && mensaje.trim() !== ''
              ? mensaje
              : 'No pudimos enviar tu mensaje. Intenta de nuevo.',
        );
      },
    });
  }
}
