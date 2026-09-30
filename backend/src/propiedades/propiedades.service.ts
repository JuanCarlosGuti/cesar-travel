import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import sharp from 'sharp';
import { UsuarioAutenticado } from '../comun/jwt.guard';
import { Usuario } from '../auth/entidades/usuario.entity';
import { Caracteristica } from '../catalogo/entidades/caracteristica.entity';
import { Categoria } from '../catalogo/entidades/categoria.entity';
import { Municipio } from '../catalogo/entidades/municipio.entity';
import { PropiedadDto } from './dto/propiedad.dto';
import { Imagen } from './entidades/imagen.entity';
import { Propiedad } from './entidades/propiedad.entity';

const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANIO_MAXIMO_BYTES = 8 * 1024 * 1024;

/**
 * Optimización de las imágenes que se suben. Una foto de celular ronda los 4-6 MB y no
 * aporta nada a esa resolución en una web: se reduce a 1600px de ancho y se recomprime
 * a WebP, con lo que queda en cientos de kilobytes. Importa por dos razones:
 * las imágenes viven en la base (ver Imagen) y el plan gratuito de Postgres da 0,5 GB,
 * y además la página carga mucho más rápido para quien la visita.
 */
const ANCHO_MAXIMO_PX = 1600;
const CALIDAD_WEBP = 82;

@Injectable()
export class PropiedadesService {
  constructor(
    @InjectRepository(Propiedad) private readonly propiedades: Repository<Propiedad>,
    @InjectRepository(Imagen) private readonly imagenes: Repository<Imagen>,
    @InjectRepository(Categoria) private readonly categorias: Repository<Categoria>,
    @InjectRepository(Municipio) private readonly municipios: Repository<Municipio>,
    @InjectRepository(Caracteristica)
    private readonly caracteristicas: Repository<Caracteristica>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  buscar(filtros: { categoriaId?: number; municipioId?: number }): Promise<Propiedad[]> {
    const where: Record<string, unknown> = {};
    if (filtros.categoriaId) {
      where.categoria = { id: filtros.categoriaId };
    }
    if (filtros.municipioId) {
      where.municipio = { id: filtros.municipioId };
    }
    return this.propiedades.find({ where, order: { id: 'ASC' } });
  }

  async buscarPorId(id: number): Promise<Propiedad> {
    const propiedad = await this.propiedades.findOneBy({ id });
    if (!propiedad) {
      throw new NotFoundException(`No existe la propiedad ${id}`);
    }
    return propiedad;
  }

  async buscarPorDuenio(
    duenioId: number,
    solicitante: UsuarioAutenticado,
  ): Promise<Propiedad[]> {
    if (duenioId !== solicitante.id && solicitante.rol !== 'ADMIN') {
      throw new ForbiddenException('Solo puedes ver tus propias propiedades');
    }
    return this.propiedades.find({
      where: { duenio: { id: duenioId } },
      order: { id: 'ASC' },
    });
  }

  async crear(datos: PropiedadDto, duenio: UsuarioAutenticado): Promise<Propiedad> {
    const propiedad = this.propiedades.create();
    await this.aplicar(propiedad, datos);
    // El dueño sale del token, nunca del body: nadie puede publicar a nombre de otro.
    propiedad.duenio = await this.usuarios.findOneByOrFail({ id: duenio.id });
    return this.propiedades.save(propiedad);
  }

  async actualizar(
    id: number,
    datos: PropiedadDto,
    solicitante: UsuarioAutenticado,
  ): Promise<Propiedad> {
    const propiedad = await this.buscarPorId(id);
    this.exigirDuenioOAdmin(propiedad, solicitante);
    await this.aplicar(propiedad, datos);
    // Ojo: no se tocan las imágenes — se administran por su propio endpoint, así que
    // editar una propiedad nunca borra su galería.
    return this.propiedades.save(propiedad);
  }

  async eliminar(id: number, solicitante: UsuarioAutenticado): Promise<void> {
    const propiedad = await this.buscarPorId(id);
    this.exigirDuenioOAdmin(propiedad, solicitante);
    await this.propiedades.remove(propiedad);
  }

  async agregarImagenes(
    id: number,
    archivos: Express.Multer.File[],
    solicitante: UsuarioAutenticado,
  ): Promise<Propiedad> {
    const propiedad = await this.buscarPorId(id);
    this.exigirDuenioOAdmin(propiedad, solicitante);

    if (!archivos?.length) {
      throw new BadRequestException('No se recibió ninguna imagen');
    }

    for (const archivo of archivos) {
      if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.mimetype)) {
        throw new BadRequestException(
          `Formato no soportado (${archivo.mimetype}): solo JPEG, PNG o WEBP`,
        );
      }
      if (archivo.size > TAMANIO_MAXIMO_BYTES) {
        throw new BadRequestException('Cada imagen debe pesar menos de 8 MB');
      }
    }

    const optimizadas = await Promise.all(
      archivos.map((archivo) => this.optimizar(archivo)),
    );

    await this.imagenes.save(
      optimizadas.map((imagen) =>
        this.imagenes.create({
          titulo: propiedad.titulo,
          tipoMime: imagen.tipoMime,
          datosBase64: imagen.datos.toString('base64'),
          propiedad,
        }),
      ),
    );

    return this.buscarPorId(id);
  }

  async eliminarImagen(
    propiedadId: number,
    imagenId: number,
    solicitante: UsuarioAutenticado,
  ): Promise<void> {
    const propiedad = await this.buscarPorId(propiedadId);
    this.exigirDuenioOAdmin(propiedad, solicitante);

    const imagen = propiedad.imagenes.find((item) => item.id === imagenId);
    if (!imagen) {
      throw new NotFoundException(`La propiedad ${propiedadId} no tiene la imagen ${imagenId}`);
    }
    await this.imagenes.remove(imagen);
  }

  /** Devuelve el archivo de una imagen subida (las externas no pasan por acá). */
  async archivoDeImagen(
    imagenId: number,
  ): Promise<{ buffer: Buffer; tipoMime: string }> {
    const imagen = await this.imagenes.findOne({
      where: { id: imagenId },
      select: { id: true, datosBase64: true, tipoMime: true },
    });
    if (!imagen?.datosBase64) {
      throw new NotFoundException(`No existe la imagen ${imagenId}`);
    }
    return {
      buffer: Buffer.from(imagen.datosBase64, 'base64'),
      tipoMime: imagen.tipoMime ?? 'application/octet-stream',
    };
  }

  /**
   * Reduce la imagen a un tamaño razonable para web y la convierte a WebP.
   * `withoutEnlargement` evita agrandar (y empeorar) una foto que ya sea pequeña, y
   * `rotate()` sin argumentos aplica la orientación EXIF: sin eso, las fotos tomadas
   * en vertical con el celular se guardarían acostadas.
   *
   * Si el archivo resulta ilegible para sharp, se rechaza con 400 en vez de guardar
   * algo que después no se va a poder mostrar.
   */
  private async optimizar(
    archivo: Express.Multer.File,
  ): Promise<{ datos: Buffer; tipoMime: string }> {
    try {
      const datos = await sharp(archivo.buffer)
        .rotate()
        .resize({ width: ANCHO_MAXIMO_PX, withoutEnlargement: true })
        .webp({ quality: CALIDAD_WEBP })
        .toBuffer();
      return { datos, tipoMime: 'image/webp' };
    } catch {
      throw new BadRequestException(
        `No se pudo procesar la imagen "${archivo.originalname}": puede estar dañada`,
      );
    }
  }

  private async aplicar(propiedad: Propiedad, datos: PropiedadDto): Promise<void> {
    const categoria = await this.categorias.findOneBy({ id: datos.categoriaId });
    if (!categoria) {
      throw new NotFoundException(`No existe la categoría ${datos.categoriaId}`);
    }
    const municipio = await this.municipios.findOneBy({ id: datos.municipioId });
    if (!municipio) {
      throw new NotFoundException(`No existe el municipio ${datos.municipioId}`);
    }
    const caracteristicas = await this.caracteristicas.findBy({
      id: In(datos.caracteristicaIds),
    });
    if (caracteristicas.length !== datos.caracteristicaIds.length) {
      throw new NotFoundException('Alguno de los servicios elegidos no existe');
    }

    propiedad.titulo = datos.titulo.trim();
    propiedad.descripcion = datos.descripcion.trim();
    propiedad.direccion = datos.direccion.trim();
    propiedad.habitaciones = datos.habitaciones;
    propiedad.banos = datos.banos;
    propiedad.normas = datos.normas?.trim() || null;
    propiedad.saludYSeguridad = datos.saludYSeguridad?.trim() || null;
    propiedad.politicaCancelacion = datos.politicaCancelacion?.trim() || null;
    propiedad.categoria = categoria;
    propiedad.municipio = municipio;
    propiedad.caracteristicas = caracteristicas;
  }

  private exigirDuenioOAdmin(
    propiedad: Propiedad,
    solicitante: UsuarioAutenticado,
  ): void {
    const esDuenio = propiedad.duenio?.id === solicitante.id;
    if (!esDuenio && solicitante.rol !== 'ADMIN') {
      throw new ForbiddenException('No eres el dueño de esta propiedad');
    }
  }
}
