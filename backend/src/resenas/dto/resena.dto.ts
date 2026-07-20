import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, MaxLength, Min } from 'class-validator';
import { Resena } from '../entidades/resena.entity';

export class ResenaDto {
  @Type(() => Number)
  @IsInt()
  propiedadId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'El puntaje va de 1 a 5' })
  @Max(5, { message: 'El puntaje va de 1 a 5' })
  puntaje: number;

  @IsOptional()
  @MaxLength(1000, { message: 'El comentario no puede superar los 1000 caracteres' })
  comentario?: string;
}

export interface ResumenResenas {
  propiedadId: number;
  promedio: number;
  cantidad: number;
}

export function aResenaResponse(resena: Resena) {
  return {
    id: resena.id,
    puntaje: resena.puntaje,
    comentario: resena.comentario,
    autor: `${resena.autor.nombre} ${resena.autor.apellido}`.trim(),
    creadaEn: resena.creadaEn,
  };
}
