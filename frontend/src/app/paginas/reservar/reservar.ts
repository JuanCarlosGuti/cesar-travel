import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../nucleo/api';
import { PropiedadDetalle, RangoOcupado, Reserva } from '../../nucleo/modelos';

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

function partes(iso: string): { d: number; m: number; a: number } {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { d, m, a };
}

function fechaLarga(iso: string): string {
  const { d, m, a } = partes(iso);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

/** `yyyy-MM-dd` en hora local (toISOString daría UTC y puede adelantar un día). */
function aIso(fecha: Date): string {
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0');
  const dia = `${fecha.getDate()}`.padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function sumarDias(iso: string, dias: number): string {
  const fecha = new Date(`${iso}T00:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  return aIso(fecha);
}

// Los mismos topes que valida el backend (reservas.service.ts): el calendario no
// ofrece fechas que después se rechazarían.
const MAX_ANTICIPACION_DIAS = 365;
const MAX_NOCHES = 30;

/** El backend (NestJS) manda `message` como texto o como lista de textos. */
function mensajeDelServidor(err: HttpErrorResponse): string | null {
  const mensaje = (err.error as { message?: string | string[] } | null)?.message;
  return Array.isArray(mensaje) ? mensaje.join(' ') : (mensaje ?? null);
}

@Component({
  selector: 'app-reservar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reservar.html',
  styleUrl: './reservar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservarComponent {
  private readonly api = inject(ApiService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly propiedad = signal<PropiedadDetalle | null>(null);
  readonly ocupados = signal<RangoOcupado[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);

  readonly entrada = signal('');
  readonly salida = signal('');
  readonly horaLlegada = signal('');

  readonly enviando = signal(false);
  readonly errorEnvio = signal<string | null>(null);
  readonly confirmada = signal<Reserva | null>(null);

  readonly hoy = aIso(new Date());
  readonly maxEntrada = sumarDias(this.hoy, MAX_ANTICIPACION_DIAS);

  /** Franjas de llegada ofrecidas al huésped. */
  readonly horas = Array.from({ length: 14 }, (_, i) => {
    const desde = `${`${i + 8}`.padStart(2, '0')}:00`;
    const hasta = `${`${i + 9}`.padStart(2, '0')}:00`;
    return `${desde} - ${hasta}`;
  });

  /** La salida nunca puede ser anterior o igual a la entrada. */
  readonly minSalida = computed(() => {
    const e = this.entrada();
    return e ? sumarDias(e, 1) : this.hoy;
  });

  readonly maxSalida = computed(() => {
    const e = this.entrada();
    return sumarDias(e || this.maxEntrada, MAX_NOCHES);
  });

  readonly noches = computed(() => {
    const e = this.entrada();
    const s = this.salida();
    if (!e || !s || s <= e) {
      return 0;
    }
    const ms = new Date(`${s}T00:00:00`).getTime() - new Date(`${e}T00:00:00`).getTime();
    return Math.round(ms / 86_400_000);
  });

  /** Aviso temprano en el cliente; la verdad la tiene el backend (409). */
  readonly solapa = computed(() => {
    const e = this.entrada();
    const s = this.salida();
    if (!e || !s || s <= e) {
      return false;
    }
    return this.ocupados().some((r) => e < r.salida && s > r.entrada);
  });

  readonly errorFechas = computed(() => {
    const e = this.entrada();
    const s = this.salida();
    if (!e || !s) {
      return null;
    }
    if (s <= e) {
      return 'La fecha de salida debe ser posterior a la de entrada.';
    }
    return null;
  });

  readonly formularioValido = computed(
    () => !!this.entrada() && !!this.salida() && !this.errorFechas() && !this.solapa(),
  );

  constructor() {
    this.ruta.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (Number.isFinite(id) && id > 0) {
        this.cargar(id);
      } else {
        this.cargando.set(false);
        this.errorCarga.set('La propiedad que buscas no existe.');
      }
    });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.api
      .propiedad(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.propiedad.set(p);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.errorCarga.set('No pudimos cargar esta propiedad.');
        },
      });

    this.api
      .disponibilidad(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.ocupados.set(r), error: () => this.ocupados.set([]) });
  }

  // Formulario -------------------------------------------------------------

  cambiarEntrada(valor: string): void {
    this.entrada.set(valor);
    // Si la salida quedó inválida al mover la entrada, se limpia.
    if (this.salida() && this.salida() <= valor) {
      this.salida.set('');
    }
    this.errorEnvio.set(null);
  }

  cambiarSalida(valor: string): void {
    this.salida.set(valor);
    this.errorEnvio.set(null);
  }

  cambiarHora(valor: string): void {
    this.horaLlegada.set(valor);
  }

  enviar(evento: Event): void {
    evento.preventDefault();
    const p = this.propiedad();
    if (!p || !this.formularioValido() || this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.errorEnvio.set(null);

    this.api
      .crearReserva({
        propiedadId: p.id,
        entrada: this.entrada(),
        salida: this.salida(),
        ...(this.horaLlegada() ? { horaLlegada: this.horaLlegada() } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reserva) => {
          this.enviando.set(false);
          this.confirmada.set(reserva);
        },
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          // 400, 403 y 409 traen el motivo exacto (fechas, estadía máxima, reservar lo
          // propio, fechas ocupadas): se muestra el del servidor.
          const motivo = [400, 403, 409].includes(err.status) ? mensajeDelServidor(err) : null;
          this.errorEnvio.set(motivo ?? 'No pudimos registrar la reserva. Intenta de nuevo.');
        },
      });
  }

  // Formato ----------------------------------------------------------------

  rangoLegible(rango: RangoOcupado): string {
    const e = partes(rango.entrada);
    const s = partes(rango.salida);
    if (e.a === s.a && e.m === s.m) {
      return `Del ${e.d} al ${s.d} de ${MESES[e.m - 1]} de ${e.a}`;
    }
    if (e.a === s.a) {
      return `Del ${e.d} de ${MESES[e.m - 1]} al ${s.d} de ${MESES[s.m - 1]} de ${e.a}`;
    }
    return `Del ${fechaLarga(rango.entrada)} al ${fechaLarga(rango.salida)}`;
  }

  fecha(iso: string): string {
    return fechaLarga(iso);
  }
}
