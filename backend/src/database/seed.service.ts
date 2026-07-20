import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../auth/entidades/usuario.entity';
import { Caracteristica } from '../catalogo/entidades/caracteristica.entity';
import { Categoria } from '../catalogo/entidades/categoria.entity';
import { Municipio } from '../catalogo/entidades/municipio.entity';
import { Imagen } from '../propiedades/entidades/imagen.entity';
import { Propiedad } from '../propiedades/entidades/propiedad.entity';
import {
  ANFITRION_DEMO,
  CARACTERISTICAS,
  CATEGORIAS,
  MUNICIPIOS,
  NORMAS_POR_DEFECTO,
  PROPIEDADES,
  galeriaDe,
  serviciosDe,
} from './datos-demo';

/**
 * Siembra el catálogo de demostración al arrancar, solo si la base está vacía.
 *
 * Es idempotente a propósito: en producción (Postgres) los datos persisten entre
 * despliegues y el seed no vuelve a correr; en desarrollo basta con borrar el archivo
 * SQLite para regenerar todo desde cero.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Municipio) private readonly municipios: Repository<Municipio>,
    @InjectRepository(Categoria) private readonly categorias: Repository<Categoria>,
    @InjectRepository(Caracteristica)
    private readonly caracteristicas: Repository<Caracteristica>,
    @InjectRepository(Propiedad) private readonly propiedades: Repository<Propiedad>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.sembrar();
  }

  async sembrar(): Promise<void> {
    if ((await this.municipios.count()) > 0) {
      this.logger.log('La base ya tiene datos: se omite el seed.');
      return;
    }

    this.logger.log('Base vacía: sembrando el catálogo de demostración...');

    const municipios = await this.municipios.save(
      MUNICIPIOS.map((m) => this.municipios.create(m)),
    );
    const categorias = await this.categorias.save(
      CATEGORIAS.map((c) => this.categorias.create(c)),
    );
    const caracteristicas = await this.caracteristicas.save(
      CARACTERISTICAS.map((c) => this.caracteristicas.create(c)),
    );

    const passwordAnfitrion = this.passwordDelAnfitrion();
    const anfitrion = await this.usuarios.save(
      this.usuarios.create({
        ...ANFITRION_DEMO,
        password: await bcrypt.hash(passwordAnfitrion, 10),
      }),
    );

    const porNombre = <T extends { nombre?: string; titulo?: string }>(
      lista: T[],
      valor: string,
      campo: 'nombre' | 'titulo',
    ): T => {
      const encontrado = lista.find((item) => item[campo] === valor);
      if (!encontrado) {
        throw new Error(`Dato de demo inconsistente: no existe ${campo}="${valor}"`);
      }
      return encontrado;
    };

    const propiedades = PROPIEDADES.map((datos, indice) => {
      const propiedad = this.propiedades.create({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        direccion: datos.direccion,
        habitaciones: datos.habitaciones,
        banos: datos.banos,
        ...NORMAS_POR_DEFECTO,
        duenio: anfitrion,
        categoria: porNombre(categorias, datos.categoria, 'titulo'),
        municipio: porNombre(municipios, datos.municipio, 'nombre'),
        caracteristicas: serviciosDe(datos.categoria).map((servicio) =>
          porNombre(caracteristicas, servicio, 'nombre'),
        ),
      });
      propiedad.imagenes = galeriaDe(indice).map((url) =>
        Object.assign(new Imagen(), { titulo: datos.titulo, urlExterna: url }),
      );
      return propiedad;
    });

    await this.propiedades.save(propiedades);

    this.logger.log(
      `Seed listo: ${municipios.length} municipios, ${categorias.length} categorías, ` +
        `${propiedades.length} propiedades (anfitrión: ${anfitrion.email}).`,
    );
  }

  /**
   * Contraseña del anfitrión de demostración, nunca escrita en el código:
   *  - SEED_ADMIN_PASSWORD definida → esa (la vía recomendada en producción).
   *  - Producción sin definirla     → una aleatoria, mostrada una sola vez en los logs
   *                                   (la cuenta es ADMIN; no puede quedar con una
   *                                   contraseña conocida ni adivinable).
   *  - Desarrollo local             → una fija y cómoda, sin valor fuera de tu máquina.
   */
  private passwordDelAnfitrion(): string {
    const definida = process.env.SEED_ADMIN_PASSWORD?.trim();
    if (definida) {
      return definida;
    }
    if (process.env.DATABASE_URL) {
      const generada = randomBytes(12).toString('base64url');
      this.logger.warn(
        `SEED_ADMIN_PASSWORD no está definida: se generó una contraseña para ` +
          `${ANFITRION_DEMO.email} → ${generada} (anotala, no vuelve a mostrarse).`,
      );
      return generada;
    }
    return 'desarrollo-local';
  }
}
