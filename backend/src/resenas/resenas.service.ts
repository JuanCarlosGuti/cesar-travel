import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';
import { UsuarioAutenticado } from '../comun/jwt.guard';
import { PropiedadesService } from '../propiedades/propiedades.service';
import { ReservasService } from '../reservas/reservas.service';
import { ResenaDto, ResumenResenas } from './dto/resena.dto';
import { Resena } from './entidades/resena.entity';

@Injectable()
export class ResenasService {
  constructor(
    @InjectRepository(Resena) private readonly resenas: Repository<Resena>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly propiedades: PropiedadesService,
    private readonly reservas: ReservasService,
  ) {}

  async crear(datos: ResenaDto, autor: UsuarioAutenticado): Promise<Resena> {
    const propiedad = await this.propiedades.buscarPorId(datos.propiedadId);

    // Solo reseña quien realmente se hospedó y ya terminó su estadía: evita reseñas
    // de gente que nunca estuvo y de estadías todavía en curso.
    if (!(await this.reservas.tuvoEstadiaFinalizada(propiedad.id, autor.id))) {
      throw new ForbiddenException(
        'Solo podés reseñar propiedades donde ya te hospedaste (con la estadía finalizada)',
      );
    }

    const yaResenada = await this.resenas.exists({
      where: { propiedad: { id: propiedad.id }, autor: { id: autor.id } },
    });
    if (yaResenada) {
      throw new ConflictException('Ya dejaste una reseña para esta propiedad');
    }

    return this.resenas.save(
      this.resenas.create({
        propiedad,
        autor: await this.usuarios.findOneByOrFail({ id: autor.id }),
        puntaje: datos.puntaje,
        comentario: datos.comentario?.trim() || null,
      }),
    );
  }

  porPropiedad(propiedadId: number): Promise<Resena[]> {
    return this.resenas.find({
      where: { propiedad: { id: propiedadId } },
      order: { creadaEn: 'DESC' },
    });
  }

  /**
   * Promedio y cantidad por propiedad en una sola consulta: las tarjetas del catálogo
   * piden todos los ids juntos, así que no hay una consulta por tarjeta (N+1).
   */
  async resumir(propiedadIds: number[]): Promise<ResumenResenas[]> {
    if (!propiedadIds.length) {
      return [];
    }
    const filas = await this.resenas
      .createQueryBuilder('resena')
      .select('resena.propiedadId', 'propiedadId')
      .addSelect('AVG(resena.puntaje)', 'promedio')
      .addSelect('COUNT(resena.id)', 'cantidad')
      .where('resena.propiedadId IN (:...propiedadIds)', { propiedadIds })
      .groupBy('resena.propiedadId')
      .getRawMany<{ propiedadId: number; promedio: string; cantidad: string }>();

    return filas.map((fila) => ({
      propiedadId: Number(fila.propiedadId),
      promedio: Number(Number(fila.promedio).toFixed(2)),
      cantidad: Number(fila.cantidad),
    }));
  }

  /** Ids que el usuario ya reseñó — el frontend oculta el botón en esas reservas. */
  async misPropiedadesResenadas(autor: UsuarioAutenticado): Promise<number[]> {
    const resenas = await this.resenas.find({
      where: { autor: { id: autor.id } },
      relations: { propiedad: true },
      select: { id: true, propiedad: { id: true } },
    });
    return resenas.map((resena) => resena.propiedad.id);
  }
}
