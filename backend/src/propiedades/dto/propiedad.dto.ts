import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { Propiedad } from '../entidades/propiedad.entity';

export class PropiedadDto {
  @IsNotEmpty({ message: 'El título es obligatorio' })
  titulo: string;

  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion: string;

  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  direccion: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  habitaciones: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  banos: number;

  @Type(() => Number)
  @IsInt()
  categoriaId: number;

  @Type(() => Number)
  @IsInt()
  municipioId: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'Elegí al menos un servicio' })
  @Type(() => Number)
  @IsInt({ each: true })
  caracteristicaIds: number[];

  @IsOptional()
  normas?: string;

  @IsOptional()
  saludYSeguridad?: string;

  @IsOptional()
  politicaCancelacion?: string;
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
    municipio: propiedad.municipio,
    imagenPortada: propiedad.imagenes?.[0]?.url ?? propiedad.categoria?.imagenUrl ?? null,
    duenioId: propiedad.duenio?.id ?? null,
  };
}

export function aDetalle(propiedad: Propiedad) {
  return {
    ...aResumen(propiedad),
    descripcion: propiedad.descripcion,
    normas: propiedad.normas,
    saludYSeguridad: propiedad.saludYSeguridad,
    politicaCancelacion: propiedad.politicaCancelacion,
    imagenes: (propiedad.imagenes ?? []).map((imagen) => ({
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
