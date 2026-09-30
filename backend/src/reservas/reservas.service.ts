import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';
import { diasEntre, hoyEnColombia } from '../comun/fechas';
import { UsuarioAutenticado } from '../comun/jwt.guard';
import { PropiedadesService } from '../propiedades/propiedades.service';
import { ReservaDto } from './dto/reserva.dto';
import { Reserva } from './entidades/reserva.entity';

/*
 * Límites contra el abuso, no reglas comerciales. Sin ellos una sola cuenta podía
 * bloquear el calendario de cualquier propiedad hasta 2099, o reservar fechas pasadas
 * para "haberse hospedado" y dejar una reseña sin haber ido nunca.
 */
const MAX_NOCHES = 30;
const MAX_ANTICIPACION_DIAS = 365;
/** Reservas por venir de un mismo huésped en una misma propiedad. */
const MAX_FUTURAS_POR_PROPIEDAD = 2;

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva) private readonly reservas: Repository<Reserva>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly propiedades: PropiedadesService,
  ) {}

  async crear(datos: ReservaDto, huesped: UsuarioAutenticado): Promise<Reserva> {
    const hoy = hoyEnColombia();
    if (datos.salida <= datos.entrada) {
      throw new BadRequestException('La fecha de salida debe ser posterior a la de entrada');
    }
    if (datos.entrada < hoy) {
      throw new BadRequestException('La fecha de entrada no puede estar en el pasado');
    }
    if (diasEntre(hoy, datos.entrada) > MAX_ANTICIPACION_DIAS) {
      throw new BadRequestException('Solo se puede reservar con hasta un año de anticipación');
    }
    if (diasEntre(datos.entrada, datos.salida) > MAX_NOCHES) {
      throw new BadRequestException(`La estadía máxima es de ${MAX_NOCHES} noches`);
    }

    const propiedad = await this.propiedades.buscarPorId(datos.propiedadId);
    if (propiedad.duenio?.id === huesped.id) {
      throw new ForbiddenException('No puedes reservar tu propia propiedad');
    }

    const futuras = await this.reservas.count({
      where: {
        propiedad: { id: propiedad.id },
        huesped: { id: huesped.id },
        entrada: MoreThan(hoy),
      },
    });
    if (futuras >= MAX_FUTURAS_POR_PROPIEDAD) {
      throw new ConflictException(
        `Ya tienes ${futuras} reservas por venir en esta propiedad. Cancela una para hacer otra.`,
      );
    }

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
    const esAdmin = solicitante.rol === 'ADMIN';
    if (reserva.huesped.id !== solicitante.id && !esAdmin) {
      throw new ForbiddenException('Solo puedes cancelar tus propias reservas');
    }
    // Una estadía empezada o terminada ya no se cancela: borrarla deja sin respaldo la
    // reseña que habilitó y reescribe el historial del alojamiento. El admin sí puede,
    // para corregir datos.
    if (reserva.entrada <= hoyEnColombia() && !esAdmin) {
      throw new ConflictException(
        'Esta estadía ya empezó o terminó: no se puede cancelar desde aquí',
      );
    }
    await this.reservas.remove(reserva);
  }

  /** ¿El usuario ya se hospedó ahí y la estadía terminó? — condición para reseñar. */
  async tuvoEstadiaFinalizada(propiedadId: number, usuarioId: number): Promise<boolean> {
    const hoy = hoyEnColombia();
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
