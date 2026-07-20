import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';
import { UsuarioAutenticado } from '../comun/jwt.guard';
import { PropiedadesService } from '../propiedades/propiedades.service';
import { ReservaDto } from './dto/reserva.dto';
import { Reserva } from './entidades/reserva.entity';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva) private readonly reservas: Repository<Reserva>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly propiedades: PropiedadesService,
  ) {}

  async crear(datos: ReservaDto, huesped: UsuarioAutenticado): Promise<Reserva> {
    if (datos.salida <= datos.entrada) {
      throw new BadRequestException('La fecha de salida debe ser posterior a la de entrada');
    }

    const propiedad = await this.propiedades.buscarPorId(datos.propiedadId);

    // No es a prueba de condiciones de carrera (dos reservas simultáneas para las mismas
    // fechas podrían pasar esta validación antes de que cualquiera confirme); cubre el
    // caso común. Un lock o una restricción de exclusión en base queda para cuando el
    // volumen de reservas concurrentes lo justifique.
    if (await this.haySolapamiento(propiedad.id, datos.entrada, datos.salida)) {
      throw new ConflictException('Esas fechas ya están reservadas para esta propiedad');
    }

    return this.reservas.save(
      this.reservas.create({
        propiedad,
        huesped: await this.usuarios.findOneByOrFail({ id: huesped.id }),
        entrada: datos.entrada,
        salida: datos.salida,
        horaLlegada: datos.horaLlegada ?? null,
      }),
    );
  }

  misReservas(huesped: UsuarioAutenticado): Promise<Reserva[]> {
    return this.reservas.find({
      where: { huesped: { id: huesped.id } },
      order: { entrada: 'DESC' },
    });
  }

  /** Ocupantes de un inmueble (con identidad del huésped): solo su dueño o un admin. */
  async porPropiedad(
    propiedadId: number,
    solicitante: UsuarioAutenticado,
  ): Promise<Reserva[]> {
    const propiedad = await this.propiedades.buscarPorId(propiedadId);
    const esDuenio = propiedad.duenio?.id === solicitante.id;
    if (!esDuenio && solicitante.rol !== 'ADMIN') {
      throw new ForbiddenException('Solo el dueño puede ver quién reservó esta propiedad');
    }
    return this.reservas.find({
      where: { propiedad: { id: propiedadId } },
      order: { entrada: 'ASC' },
    });
  }

  /** Fechas ocupadas de un inmueble, sin identidad — público, para el calendario. */
  async disponibilidad(
    propiedadId: number,
  ): Promise<{ entrada: string; salida: string }[]> {
    const reservas = await this.reservas.find({
      where: { propiedad: { id: propiedadId } },
      order: { entrada: 'ASC' },
    });
    return reservas.map(({ entrada, salida }) => ({ entrada, salida }));
  }

  /** Ids de inmuebles con alguna reserva solapada en el rango — para el buscador. */
  async ocupadasEntre(entrada: string, salida: string): Promise<number[]> {
    if (salida <= entrada) {
      throw new BadRequestException('La fecha final debe ser posterior a la inicial');
    }
    const filas = await this.reservas
      .createQueryBuilder('reserva')
      .select('DISTINCT reserva.propiedadId', 'id')
      .where('reserva.entrada < :salida AND reserva.salida > :entrada', {
        entrada,
        salida,
      })
      .getRawMany<{ id: number }>();
    return filas.map((fila) => Number(fila.id));
  }

  async cancelar(id: number, solicitante: UsuarioAutenticado): Promise<void> {
    const reserva = await this.reservas.findOneBy({ id });
    if (!reserva) {
      throw new NotFoundException(`No existe la reserva ${id}`);
    }
    const esHuesped = reserva.huesped.id === solicitante.id;
    if (!esHuesped && solicitante.rol !== 'ADMIN') {
      throw new ForbiddenException('Solo podés cancelar tus propias reservas');
    }
    await this.reservas.remove(reserva);
  }

  /** ¿El usuario ya se hospedó ahí y la estadía terminó? — condición para reseñar. */
  async tuvoEstadiaFinalizada(propiedadId: number, usuarioId: number): Promise<boolean> {
    const hoy = new Date().toISOString().slice(0, 10);
    return this.reservas.exists({
      where: {
        propiedad: { id: propiedadId },
        huesped: { id: usuarioId },
        salida: LessThanOrEqual(hoy),
      },
    });
  }

  private async haySolapamiento(
    propiedadId: number,
    entrada: string,
    salida: string,
  ): Promise<boolean> {
    // Rango semiabierto [entrada, salida): dos reservas se solapan si cada una empieza
    // antes de que termine la otra. Alguien puede entrar el día que otro se va.
    const solapadas = await this.reservas
      .createQueryBuilder('reserva')
      .where('reserva.propiedadId = :propiedadId', { propiedadId })
      .andWhere('reserva.entrada < :salida AND reserva.salida > :entrada', {
        entrada,
        salida,
      })
      .getCount();
    return solapadas > 0;
  }
}
