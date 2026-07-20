import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { ApiService } from '../../nucleo/api';
import {
  Caracteristica,
  Categoria,
  Imagen,
  Municipio,
  PropiedadDetalle,
} from '../../nucleo/modelos';

/** Archivo elegido en el input + su URL de vista previa (hay que revocarla al soltarlo). */
interface ArchivoElegido {
  archivo: File;
  previa: string;
}

const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'];

/** El backend (NestJS) devuelve `message` como string o como array de strings. */
function mensajeDeError(respuesta: HttpErrorResponse): string {
  const mensaje = respuesta?.error?.message;
  if (Array.isArray(mensaje)) {
    return mensaje.join('. ');
  }
  if (typeof mensaje === 'string' && mensaje.trim() !== '') {
    return mensaje;
  }
  if (respuesta?.status === 0) {
    return 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
}

/** Al menos un servicio tildado (el backend rechaza el array vacío). */
function alMenosUna(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as number[] | null;
  return Array.isArray(valor) && valor.length > 0 ? null : { alMenosUna: true };
}

@Component({
  selector: 'app-publicar',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './publicar.html',
  styleUrl: './publicar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicarComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly municipios = signal<Municipio[]>([]);
  protected readonly caracteristicas = signal<Caracteristica[]>([]);

  /** Id de la propiedad en edición; null mientras se está creando una nueva. */
  protected readonly propiedadId = signal<number | null>(null);
  protected readonly imagenesExistentes = signal<Imagen[]>([]);
  protected readonly nuevosArchivos = signal<ArchivoElegido[]>([]);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly eliminandoImagen = signal<number | null>(null);

  protected readonly edicion = computed(() => this.propiedadId() !== null);

  protected readonly formulario = this.fb.group({
    titulo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    categoriaId: this.fb.control<number | null>(null, [Validators.required]),
    habitaciones: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    banos: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    direccion: this.fb.nonNullable.control('', [Validators.required]),
    municipioId: this.fb.control<number | null>(null, [Validators.required]),
    descripcion: this.fb.nonNullable.control('', [Validators.required]),
    caracteristicaIds: this.fb.nonNullable.control<number[]>([], [alMenosUna]),
    normas: this.fb.nonNullable.control(''),
    saludYSeguridad: this.fb.nonNullable.control(''),
    politicaCancelacion: this.fb.nonNullable.control(''),
  });

  constructor() {
    // Las vistas previas son object URLs: si no se revocan, quedan reteniendo memoria.
    this.destroyRef.onDestroy(() => {
      this.nuevosArchivos().forEach((item) => URL.revokeObjectURL(item.previa));
    });

    this.cargar();
  }

  private cargar(): void {
    const parametro = this.ruta.snapshot.paramMap.get('id');
    const id = parametro ? Number(parametro) : null;

    forkJoin({
      categorias: this.api.categorias(),
      municipios: this.api.municipios(),
      caracteristicas: this.api.caracteristicas(),
    })
      .pipe(
        switchMap((catalogos) =>
          forkJoin({
            catalogos: of(catalogos),
            propiedad: id ? this.api.propiedad(id) : of(null),
          }),
        ),
      )
      .subscribe({
        next: ({ catalogos, propiedad }) => {
          this.categorias.set(catalogos.categorias);
          this.municipios.set(catalogos.municipios);
          this.caracteristicas.set(catalogos.caracteristicas);

          if (propiedad) {
            this.propiedadId.set(propiedad.id);
            this.precargar(propiedad);
          }
          this.cargando.set(false);
        },
        error: (respuesta: HttpErrorResponse) => {
          this.error.set(mensajeDeError(respuesta));
          this.cargando.set(false);
        },
      });
  }

  private precargar(propiedad: PropiedadDetalle): void {
    this.formulario.patchValue({
      titulo: propiedad.titulo,
      categoriaId: propiedad.categoria?.id ?? null,
      habitaciones: propiedad.habitaciones,
      banos: propiedad.banos,
      direccion: propiedad.direccion,
      municipioId: propiedad.municipio?.id ?? null,
      descripcion: propiedad.descripcion,
      caracteristicaIds: (propiedad.caracteristicas ?? []).map((item) => item.id),
      normas: propiedad.normas ?? '',
      saludYSeguridad: propiedad.saludYSeguridad ?? '',
      politicaCancelacion: propiedad.politicaCancelacion ?? '',
    });
    this.imagenesExistentes.set(propiedad.imagenes ?? []);
  }

  // Características ----------------------------------------------------------

  protected tildada(id: number): boolean {
    return this.formulario.controls.caracteristicaIds.value.includes(id);
  }

  protected alternar(id: number): void {
    const control = this.formulario.controls.caracteristicaIds;
    const actuales = control.value;
    control.setValue(
      actuales.includes(id) ? actuales.filter((item) => item !== id) : [...actuales, id],
    );
    control.markAsTouched();
  }

  // Imágenes -----------------------------------------------------------------

  protected elegirArchivos(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const elegidos = Array.from(input.files ?? []).filter((archivo) =>
      TIPOS_ACEPTADOS.includes(archivo.type),
    );

    this.nuevosArchivos.update((lista) => [
      ...lista,
      ...elegidos.map((archivo) => ({ archivo, previa: URL.createObjectURL(archivo) })),
    ]);

    // Se limpia el input para poder volver a elegir el mismo archivo si se quitó.
    input.value = '';
  }

  protected quitarArchivo(indice: number): void {
    const item = this.nuevosArchivos()[indice];
    if (item) {
      URL.revokeObjectURL(item.previa);
    }
    this.nuevosArchivos.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected eliminarImagen(imagen: Imagen): void {
    const id = this.propiedadId();
    if (id === null) {
      return;
    }

    this.eliminandoImagen.set(imagen.id);
    this.api.eliminarImagen(id, imagen.id).subscribe({
      next: () => {
        this.eliminandoImagen.set(null);
        this.imagenesExistentes.update((lista) =>
          lista.filter((item) => item.id !== imagen.id),
        );
      },
      error: (respuesta: HttpErrorResponse) => {
        this.eliminandoImagen.set(null);
        this.error.set(mensajeDeError(respuesta));
      },
    });
  }

  // Guardado -----------------------------------------------------------------

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Revisá los campos marcados antes de guardar.');
      return;
    }

    const valores = this.formulario.getRawValue();
    // Solo los campos que el backend conoce: rechaza cualquier propiedad extra.
    const cuerpo = {
      titulo: valores.titulo.trim(),
      descripcion: valores.descripcion.trim(),
      direccion: valores.direccion.trim(),
      habitaciones: Number(valores.habitaciones),
      banos: Number(valores.banos),
      categoriaId: Number(valores.categoriaId),
      municipioId: Number(valores.municipioId),
      caracteristicaIds: valores.caracteristicaIds,
      normas: valores.normas.trim() || undefined,
      saludYSeguridad: valores.saludYSeguridad.trim() || undefined,
      politicaCancelacion: valores.politicaCancelacion.trim() || undefined,
    };

    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);

    const id = this.propiedadId();
    const peticion = id
      ? this.api.actualizarPropiedad(id, cuerpo)
      : this.api.crearPropiedad(cuerpo);

    peticion.subscribe({
      next: (guardada) => this.subirPendientes(guardada),
      error: (respuesta: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(respuesta));
      },
    });
  }

  /**
   * La propiedad ya quedó guardada: si la subida de imágenes falla no se pierde el
   * trabajo, se avisa y se deja el formulario en modo edición para reintentar.
   */
  private subirPendientes(guardada: PropiedadDetalle): void {
    const archivos = this.nuevosArchivos().map((item) => item.archivo);

    if (archivos.length === 0) {
      this.guardando.set(false);
      this.router.navigateByUrl('/mis-propiedades');
      return;
    }

    this.api.subirImagenes(guardada.id, archivos).subscribe({
      next: () => {
        this.guardando.set(false);
        this.nuevosArchivos().forEach((item) => URL.revokeObjectURL(item.previa));
        this.nuevosArchivos.set([]);
        this.router.navigateByUrl('/mis-propiedades');
      },
      error: (respuesta: HttpErrorResponse) => {
        this.guardando.set(false);
        this.propiedadId.set(guardada.id);
        this.imagenesExistentes.set(guardada.imagenes ?? []);
        this.aviso.set(
          `La propiedad se guardó correctamente, pero no pudimos subir las imágenes (${mensajeDeError(
            respuesta,
          )}). Podés reintentar desde acá sin volver a cargar los datos.`,
        );
      },
    });
  }
}
