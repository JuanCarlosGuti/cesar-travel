import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';
import { UsuarioAutenticado } from '../comun/jwt.guard';
import { PropiedadesService } from '../propiedades/propiedades.service';
import { Conversacion } from './entidades/conversacion.entity';
import { Mensaje } from './entidades/mensaje.entity';

/**
 * Chat interno huésped↔dueño: reemplaza el contacto por WhatsApp por privacidad —
 * no se expone ningún dato de contacto y la conversación queda en la plataforma.
 *
 * El frontend se actualiza por sondeo (el hilo cada pocos segundos, el contador del
 * header más espaciado). Es suficiente para coordinar una reserva; si el chat se
 * volviera intensivo, el paso natural es WebSocket sin cambiar este modelo.
 */
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversacion)
    private readonly conversaciones: Repository<Conversacion>,
    @InjectRepository(Mensaje) private readonly mensajes: Repository<Mensaje>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly propiedades: PropiedadesService,
  ) {}

  /** Abre la conversación con el dueño del inmueble, o devuelve la que ya existía. */
  async abrir(propiedadId: number, huesped: UsuarioAutenticado): Promise<Conversacion> {
    const propiedad = await this.propiedades.buscarPorId(propiedadId);
    if (!propiedad.duenio) {
      throw new BadRequestException('Esta propiedad no tiene dueño asignado');
    }
    // El dueño sale de la propiedad, nunca de lo que mande el cliente.
    if (propiedad.duenio.id === huesped.id) {
      throw new BadRequestException('No podés abrir un chat con vos mismo');
    }

    const existente = await this.conversaciones.findOne({
      where: { propiedad: { id: propiedad.id }, huesped: { id: huesped.id } },
    });
    if (existente) {
      return existente;
    }

    return this.conversaciones.save(
      this.conversaciones.create({
        propiedad,
        huesped: await this.usuarios.findOneByOrFail({ id: huesped.id }),
        duenio: propiedad.duenio,
      }),
    );
  }

  /** Bandeja: conversaciones donde el usuario participa, con último mensaje y no leídos. */
  async bandeja(usuario: UsuarioAutenticado) {
    const conversaciones = await this.conversaciones.find({
      where: [{ huesped: { id: usuario.id } }, { duenio: { id: usuario.id } }],
      order: { actualizadaEn: 'DESC' },
    });

    return Promise.all(
      conversaciones.map(async (conversacion) => {
        const ultimo = await this.mensajes.findOne({
          where: { conversacion: { id: conversacion.id } },
          order: { creadoEn: 'DESC' },
        });
        const sinLeer = await this.mensajes.count({
          where: {
            conversacion: { id: conversacion.id },
            leido: false,
            autor: { id: Not(usuario.id) },
          },
        });
        const otro =
          conversacion.huesped.id === usuario.id
            ? conversacion.duenio
            : conversacion.huesped;

        return {
          id: conversacion.id,
          propiedadId: conversacion.propiedad.id,
          propiedadTitulo: conversacion.propiedad.titulo,
          otroUsuario: `${otro.nombre} ${otro.apellido}`.trim(),
          ultimoMensaje: ultimo?.cuerpo ?? null,
          sinLeer,
        };
      }),
    );
  }

  async mensajesDe(conversacionId: number, usuario: UsuarioAutenticado) {
    const conversacion = await this.exigirParticipante(conversacionId, usuario);
    const mensajes = await this.mensajes.find({
      where: { conversacion: { id: conversacion.id } },
      order: { creadoEn: 'ASC' },
    });
    return mensajes.map((mensaje) => ({
      id: mensaje.id,
      autorId: mensaje.autor.id,
      cuerpo: mensaje.cuerpo,
      creadoEn: mensaje.creadoEn,
    }));
  }

  async enviar(conversacionId: number, cuerpo: string, autor: UsuarioAutenticado) {
    const conversacion = await this.exigirParticipante(conversacionId, autor);
    const texto = cuerpo?.trim();
    if (!texto) {
      throw new BadRequestException('El mensaje está vacío');
    }

    const mensaje = await this.mensajes.save(
      this.mensajes.create({
        conversacion,
        autor: await this.usuarios.findOneByOrFail({ id: autor.id }),
        cuerpo: texto.slice(0, 1000),
      }),
    );

    // Mueve la conversación al tope de la bandeja del otro participante.
    await this.conversaciones.update(conversacion.id, { actualizadaEn: new Date() });

    return {
      id: mensaje.id,
      autorId: autor.id,
      cuerpo: mensaje.cuerpo,
      creadoEn: mensaje.creadoEn,
    };
  }

  /** Marca como leídos los mensajes que recibió el usuario en esta conversación. */
  async marcarLeidos(conversacionId: number, usuario: UsuarioAutenticado): Promise<void> {
    await this.exigirParticipante(conversacionId, usuario);
    await this.mensajes
      .createQueryBuilder()
      .update(Mensaje)
      .set({ leido: true })
      .where('conversacionId = :conversacionId', { conversacionId })
      .andWhere('autorId != :usuarioId', { usuarioId: usuario.id })
      .andWhere('leido = false')
      .execute();
  }

  async sinLeer(usuario: UsuarioAutenticado): Promise<{ sinLeer: number }> {
    const sinLeer = await this.mensajes
      .createQueryBuilder('mensaje')
      .innerJoin('mensaje.conversacion', 'conversacion')
      .where('mensaje.leido = false')
      .andWhere('mensaje.autorId != :usuarioId', { usuarioId: usuario.id })
      .andWhere(
        '(conversacion.huespedId = :usuarioId OR conversacion.duenioId = :usuarioId)',
        { usuarioId: usuario.id },
      )
      .getCount();
    return { sinLeer };
  }

  private async exigirParticipante(
    conversacionId: number,
    usuario: UsuarioAutenticado,
  ): Promise<Conversacion> {
    const conversacion = await this.conversaciones.findOneBy({ id: conversacionId });
    if (!conversacion) {
      throw new NotFoundException(`No existe la conversación ${conversacionId}`);
    }
    const participa =
      conversacion.huesped.id === usuario.id || conversacion.duenio.id === usuario.id;
    if (!participa) {
      throw new ForbiddenException('No participás en esta conversación');
    }
    return conversacion;
  }
}
