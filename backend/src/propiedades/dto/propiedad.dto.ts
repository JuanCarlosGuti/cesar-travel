import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Imagen } from '../entidades/imagen.entity';
import { Propiedad } from '../entidades/propiedad.entity';

// Los largos máximos siguen al formulario (título) o a la columna (descripción,
// varchar(1000)): sin ellos, un texto más largo llegaba a la base y respondía 500.
export class PropiedadDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(120, { message: 'El título admite hasta 120 caracteres' })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(1000, { message: 'La descripción admite hasta 1000 caracteres' })
  descripcion: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @MaxLength(200, { message: 'La dirección admite hasta 200 caracteres' })
  direccion: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  habitaciones: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  banos: number;

  @Type(() => Number)
  @IsInt()
  categoriaId: number;

  @Type(() => Number)
  @IsInt()
  municipioId: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'Elige al menos un servicio' })
  @ArrayMaxSize(50)
  @Type(() => Number)
  @IsInt({ each: true })
  caracteristicaIds: number[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  normas?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  saludYSeguridad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  politicaCancelacion?: string;
}

/**
 * El municipio se aplana: el departamento viaja como texto y no como objeto anidado,
 * que es lo único que muestran las vistas ("Palomino, La Guajira").
 */
function aUbicacion(municipio: Propiedad['municipio']) {
  return {
    id: municipio.id,
    nombre: municipio.nombre,
    departamento: municipio.departamento?.nombre ?? '',
    tipo: municipio.tipo,
    latitud: municipio.latitud,
    longitud: municipio.longitud,
  };
}

/** Tarjeta del catálogo: lo mínimo para listar sin arrastrar la galería completa. */
export function aResumen(propiedad: Propiedad) {
  return {
    id: propiedad.id,
    titulo: propiedad.titulo,
    direccion: propiedad.direccion,
    habitaciones: propiedad.habitaciones,
    banos: propiedad.banos,
    categoria: propiedad.categoria,
    municipio: aUbicacion(propiedad.municipio),
    imagenPortada: imagenesOrdenadas(propiedad)[0]?.url ?? propiedad.categoria?.imagenUrl ?? null,
    duenioId: propiedad.duenio?.id ?? null,
  };
}

/**
 * Las imágenes de la galería en el orden en que se cargaron (por id). La relación se
 * trae sin ORDER BY y Postgres no garantiza el orden de las filas: sin esto, la portada
 * (la primera) podía cambiar sola entre una consulta y otra.
 */
export function imagenesOrdenadas(propiedad: Propiedad): Imagen[] {
  return [...(propiedad.imagenes ?? [])].sort((a, b) => a.id - b.id);
}

export function aDetalle(propiedad: Propiedad) {
  return {
    ...aResumen(propiedad),
    descripcion: propiedad.descripcion,
    normas: propiedad.normas,
    saludYSeguridad: propiedad.saludYSeguridad,
    politicaCancelacion: propiedad.politicaCancelacion,
    imagenes: imagenesOrdenadas(propiedad).map((imagen) => ({
      id: imagen.id,
      titulo: imagen.titulo,
      url: imagen.url,
    })),
    caracteristicas: propiedad.caracteristicas ?? [],
    duenio: propiedad.duenio
      ? {
          id: propiedad.duenio.id,
          nombre: propiedad.duenio.nombre,
          apellido: propiedad.duenio.apellido,
        }
      : null,
  };
}
