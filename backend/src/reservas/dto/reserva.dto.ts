import { IsInt, IsISO8601, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Reserva } from '../entidades/reserva.entity';

export class ReservaDto {
  @Type(() => Number)
  @IsInt()
  propiedadId: number;

  @IsISO8601({}, { message: 'La fecha de entrada debe ser una fecha válida (yyyy-MM-dd)' })
  entrada: string;

  @IsISO8601({}, { message: 'La fecha de salida debe ser una fecha válida (yyyy-MM-dd)' })
  salida: string;

  @IsOptional()
  horaLlegada?: string;
}

/** Vista de una reserva para el huésped ("mis reservas"). */
export function aReservaResponse(reserva: Reserva) {
  return {
    id: reserva.id,
    entrada: reserva.entrada,
    salida: reserva.salida,
    horaLlegada: reserva.horaLlegada,
    propiedad: {
      id: reserva.propiedad.id,
      titulo: reserva.propiedad.titulo,
      direccion: reserva.propiedad.direccion,
      categoria: reserva.propiedad.categoria?.titulo ?? '',
      municipio: {
        id: reserva.propiedad.municipio.id,
        nombre: reserva.propiedad.municipio.nombre,
        departamento: reserva.propiedad.municipio.departamento?.nombre ?? '',
      },
      imagenPortada:
        reserva.propiedad.imagenes?.[0]?.url ??
        reserva.propiedad.categoria?.imagenUrl ??
        null,
    },
  };
}

/** Vista para el dueño: quién reservó y cuándo. */
export function aOcupanteResponse(reserva: Reserva) {
  return {
    id: reserva.id,
    entrada: reserva.entrada,
    salida: reserva.salida,
    huesped: {
      id: reserva.huesped.id,
      nombre: reserva.huesped.nombre,
      apellido: reserva.huesped.apellido,
    },
  };
}
