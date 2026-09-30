import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';
import { hoyEnColombia } from '../comun/fechas';
import { UsuarioAutenticado } from '../comun/jwt.guard';
import { aResumen } from '../propiedades/dto/propiedad.dto';
import { Propiedad } from '../propiedades/entidades/propiedad.entity';
import { Resena } from '../resenas/entidades/resena.entity';
import { Reserva } from '../reservas/entidades/reserva.entity';
import { CambioUsuarioDto } from './dto/admin.dto';

/** Datos de una persona que ve el administrador (nunca el hash de la contraseña). */
function aPersona(usuario: Usuario | null) {
  return usuario
    ? { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email }
    : null;
}

/**
 * Consultas del panel de administración. Las acciones que ya existían para el dueño
 * (editar o borrar un alojamiento, cancelar una reserva) no se duplican aquí: sus
 * endpoints ya aceptan a un ADMIN. Este servicio agrega lo que no tenía dueño:
 * ver todo, gestionar cuentas y moderar reseñas.
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Propiedad) private readonly propiedades: Repository<Propiedad>,
    @InjectRepository(Reserva) private readonly reservas: Repository<Reserva>,
    @InjectRepository(Resena) private readonly resenas: Repository<Resena>,
  ) {}

  async resumen() {
    const [usuarios, admins, bloqueados, propiedades, reservas, reservasPorVenir, resenas] =
      await Promise.all([
        this.usuarios.count(),
        this.usuarios.countBy({ rol: 'ADMIN' }),
        this.usuarios.countBy({ bloqueado: true }),
        this.propiedades.count(),
        this.reservas.count(),
        this.reservas.countBy({ entrada: MoreThan(hoyEnColombia()) }),
        this.resenas.count(),
      ]);
    return { usuarios, admins, bloqueados, propiedades, reservas, reservasPorVenir, resenas };
  }

  async listarUsuarios() {
    const [usuarios, propiedadesPor, reservasPor] = await Promise.all([
      this.usuarios.find({ order: { id: 'ASC' } }),
      this.contarPor(this.propiedades, 'duenioId'),
      this.contarPor(this.reservas, 'huespedId'),
    ]);
    return usuarios.map((u) => ({
      ...aPersona(u)!,
      rol: u.rol,
      bloqueado: u.bloqueado,
      propiedades: propiedadesPor.get(u.id) ?? 0,
      reservas: reservasPor.get(u.id) ?? 0,
    }));
  }

  async cambiarUsuario(id: number, cambio: CambioUsuarioDto, solicitante: UsuarioAutenticado) {
    const usuario = await this.usuarios.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`No existe el usuario ${id}`);
    }
    // Protecciones para no dejar el sitio sin quien lo administre.
    if (id === solicitante.id) {
      throw new ConflictException('No puedes cambiar tu propio rol ni bloquear tu cuenta');
    }
    const dejaDeSerAdminActivo =
      usuario.rol === 'ADMIN' &&
      !usuario.bloqueado &&
      (cambio.rol === 'USER' || cambio.bloqueado === true);
    if (dejaDeSerAdminActivo) {
      const adminsActivos = await this.usuarios.countBy({ rol: 'ADMIN', bloqueado: false });
      if (adminsActivos <= 1) {
        throw new ConflictException('Debe quedar al menos un administrador activo');
      }
    }
    if (cambio.rol) {
      usuario.rol = cambio.rol;
    }
    if (cambio.bloqueado !== undefined) {
      usuario.bloqueado = cambio.bloqueado;
    }
    const guardado = await this.usuarios.save(usuario);
    return { ...aPersona(guardado)!, rol: guardado.rol, bloqueado: guardado.bloqueado };
  }

  async listarPropiedades() {
    const [propiedades, reservasPor] = await Promise.all([
      this.propiedades.find({ order: { id: 'ASC' } }),
      this.contarPor(this.reservas, 'propiedadId'),
    ]);
    return propiedades.map((p) => ({
      ...aResumen(p),
      duenio: aPersona(p.duenio),
      reservas: reservasPor.get(p.id) ?? 0,
    }));
  }

  async listarReservas() {
    const reservas = await this.reservas.find({ order: { entrada: 'DESC', id: 'DESC' } });
    return reservas.map((r) => ({
      id: r.id,
      entrada: r.entrada,
      salida: r.salida,
      propiedad: { id: r.propiedad.id, titulo: r.propiedad.titulo },
      huesped: aPersona(r.huesped),
    }));
  }

  async listarResenas() {
    const resenas = await this.resenas.find({
      relations: { propiedad: true },
      order: { creadaEn: 'DESC' },
    });
    return resenas.map((r) => ({
      id: r.id,
      puntaje: r.puntaje,
      comentario: r.comentario,
      creadaEn: r.creadaEn,
      propiedad: { id: r.propiedad.id, titulo: r.propiedad.titulo },
      autor: aPersona(r.autor),
    }));
  }

  async eliminarResena(id: number): Promise<void> {
    const resena = await this.resenas.findOneBy({ id });
    if (!resena) {
      throw new NotFoundException(`No existe la reseña ${id}`);
    }
    await this.resenas.remove(resena);
  }

  /** Conteo agrupado por una columna de clave foránea: una consulta en vez de N. */
  private async contarPor(
    repositorio: Repository<Propiedad> | Repository<Reserva>,
    columna: string,
  ): Promise<Map<number, number>> {
    const filas = await repositorio
      .createQueryBuilder('t')
      .select(`t.${columna}`, 'clave')
      .addSelect('COUNT(*)', 'total')
      .where(`t.${columna} IS NOT NULL`)
      .groupBy(`t.${columna}`)
      .getRawMany<{ clave: number; total: string }>();
    return new Map(filas.map((f) => [Number(f.clave), Number(f.total)]));
  }
}
