import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from '../../nucleo/api';
import { SesionService } from '../../nucleo/sesion';
import { Ocupante, PropiedadDetalle, RangoOcupado, Resena } from '../../nucleo/modelos';
import { EstrellasComponent } from '../../comun/estrellas/estrellas';

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

/** Parte un ISO `yyyy-MM-dd` a mano: `new Date(iso)` lo interpreta en UTC y corre un día. */
function partes(iso: string): { d: number; m: number; a: number } {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { d, m, a };
}

function fechaLarga(iso: string): string {
  const { d, m, a } = partes(iso);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [RouterLink, EstrellasComponent],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleComponent {
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ubicacion = inject(Location);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly propiedad = signal<PropiedadDetalle | null>(null);
  readonly ocupados = signal<RangoOcupado[]>([]);
  readonly resenas = signal<Resena[]>([]);
  readonly promedio = signal(0);
  readonly cantidadResenas = signal(0);
  readonly ocupantes = signal<Ocupante[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly copiado = signal(false);
  readonly abriendoChat = signal(false);

  /** Índice de la imagen abierta en el visor; `null` = visor cerrado. */
  readonly visor = signal<number | null>(null);

  readonly autenticado = this.sesion.autenticado;

  readonly esDuenio = computed(() => {
    const p = this.propiedad();
    const u = this.sesion.usuario();
    return !!p && !!u && u.id === p.duenioId;
  });

  readonly imagenPrincipal = computed(() => this.propiedad()?.imagenes?.[0] ?? null);
  readonly imagenesSecundarias = computed(() => this.propiedad()?.imagenes?.slice(1, 5) ?? []);
  readonly imagenes = computed(() => this.propiedad()?.imagenes ?? []);

  readonly tienePoliticas = computed(() => {
    const p = this.propiedad();
    return !!p && !!(p.normas || p.saludYSeguridad || p.politicaCancelacion);
  });

  /** El iframe de OSM necesita una URL saneada: Angular bloquea `[src]` crudo. */
  readonly mapaUrl = computed<SafeResourceUrl | null>(() => {
    const m = this.propiedad()?.municipio;
    if (!m || m.latitud == null || m.longitud == null) {
      return null;
    }
    const { latitud: lat, longitud: lon } = m;
    const bbox = `${lon - 0.05},${lat - 0.04},${lon + 0.05},${lat + 0.04}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`,
    );
  });

  readonly mapaEnlace = computed(() => {
    const m = this.propiedad()?.municipio;
    if (!m || m.latitud == null || m.longitud == null) {
      return null;
    }
    return `https://www.openstreetmap.org/?mlat=${m.latitud}&mlon=${m.longitud}#map=12/${m.latitud}/${m.longitud}`;
  });

  constructor() {
    this.ruta.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (Number.isFinite(id) && id > 0) {
        this.cargar(id);
      } else {
        this.cargando.set(false);
        this.error.set('La propiedad que buscás no existe.');
      }
    });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.ocupantes.set([]);

    this.api
      .propiedad(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.propiedad.set(p);
          this.cargando.set(false);
          this.cargarOcupantesSiEsDuenio(p);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('No pudimos cargar esta propiedad. Intentá de nuevo en un momento.');
        },
      });

    this.api
      .disponibilidad(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.ocupados.set(r), error: () => this.ocupados.set([]) });

    this.api
      .resenasDe(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.resenas.set(r), error: () => this.resenas.set([]) });

    this.api
      .resumenResenas([id])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([resumen]) => {
          this.promedio.set(resumen?.promedio ?? 0);
          this.cantidadResenas.set(resumen?.cantidad ?? 0);
        },
        error: () => {
          this.promedio.set(0);
          this.cantidadResenas.set(0);
        },
      });
  }

  /** Los ocupantes son privados: si la API responde 403 la sección simplemente no aparece. */
  private cargarOcupantesSiEsDuenio(p: PropiedadDetalle): void {
    const u = this.sesion.usuario();
    if (!u || u.id !== p.duenioId) {
      return;
    }
    this.api
      .ocupantesDe(p.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (o) => this.ocupantes.set(o), error: () => this.ocupantes.set([]) });
  }

  // Acciones ---------------------------------------------------------------

  volver(): void {
    this.ubicacion.back();
  }

  compartir(): void {
    const url = window.location.href;
    const titulo = this.propiedad()?.titulo ?? 'Cesar Travel';

    if (navigator.share) {
      navigator.share({ title: titulo, url }).catch(() => {
        /* el usuario canceló el diálogo: no es un error */
      });
      return;
    }

    navigator.clipboard?.writeText(url).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  escribirAlDuenio(): void {
    const p = this.propiedad();
    if (!p || this.abriendoChat()) {
      return;
    }
    this.abriendoChat.set(true);
    this.api
      .abrirChat(p.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (conversacion) => {
          this.abriendoChat.set(false);
          this.router.navigate(['/mensajes', conversacion.id]);
        },
        error: () => this.abriendoChat.set(false),
      });
  }

  reservar(): void {
    const p = this.propiedad();
    if (p) {
      this.router.navigate(['/propiedades', p.id, 'reservar']);
    }
  }

  // Visor de imágenes ------------------------------------------------------

  abrirVisor(indice: number): void {
    this.visor.set(indice);
  }

  cerrarVisor(): void {
    this.visor.set(null);
  }

  anterior(evento?: Event): void {
    evento?.stopPropagation();
    const i = this.visor();
    if (i === null) {
      return;
    }
    const total = this.imagenes().length;
    this.visor.set((i - 1 + total) % total);
  }

  siguiente(evento?: Event): void {
    evento?.stopPropagation();
    const i = this.visor();
    if (i === null) {
      return;
    }
    this.visor.set((i + 1) % this.imagenes().length);
  }

  @HostListener('document:keydown', ['$event'])
  manejarTecla(evento: KeyboardEvent): void {
    if (this.visor() === null) {
      return;
    }
    if (evento.key === 'Escape') {
      this.cerrarVisor();
    } else if (evento.key === 'ArrowLeft') {
      this.anterior();
    } else if (evento.key === 'ArrowRight') {
      this.siguiente();
    }
  }

  // Formato ----------------------------------------------------------------

  /** "Ocupado del 10 al 15 de septiembre de 2026", evitando repetir mes/año. */
  rangoLegible(rango: RangoOcupado): string {
    const e = partes(rango.entrada);
    const s = partes(rango.salida);
    if (e.a === s.a && e.m === s.m) {
      return `Ocupado del ${e.d} al ${s.d} de ${MESES[e.m - 1]} de ${e.a}`;
    }
    if (e.a === s.a) {
      return `Ocupado del ${e.d} de ${MESES[e.m - 1]} al ${s.d} de ${MESES[s.m - 1]} de ${e.a}`;
    }
    return `Ocupado del ${fechaLarga(rango.entrada)} al ${fechaLarga(rango.salida)}`;
  }

  fecha(iso: string): string {
    return fechaLarga(iso);
  }

  fechaCorta(iso: string): string {
    const { d, m } = partes(iso);
    return `${d} de ${MESES[m - 1]}`;
  }

  promedioTexto(): string {
    return this.promedio().toFixed(1).replace('.', ',');
  }
}
