import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../auth/entidades/usuario.entity';
import { Caracteristica } from '../catalogo/entidades/caracteristica.entity';
import { Categoria } from '../catalogo/entidades/categoria.entity';
import { Departamento } from '../catalogo/entidades/departamento.entity';
import { Municipio } from '../catalogo/entidades/municipio.entity';
import { Imagen } from '../propiedades/entidades/imagen.entity';
import { Propiedad } from '../propiedades/entidades/propiedad.entity';
import {
  ANFITRION_DEMO,
  CARACTERISTICAS,
  CATEGORIAS,
  DESTINOS_TURISTICOS,
  NORMAS_POR_DEFECTO,
  PROPIEDADES,
  galeriaDe,
  serviciosDe,
} from './datos-demo';
import divipola from './datos/divipola.json';

interface MunicipioDivipola {
  codigo: string;
  nombre: string;
  tipo: string;
  latitud: number | null;
  longitud: number | null;
}

interface DepartamentoDivipola {
  codigo: string;
  nombre: string;
  municipios: MunicipioDivipola[];
}

/**
 * Prepara la base al arrancar. Son dos pasos independientes y ambos idempotentes:
 *
 *  1. Ubicaciones: los 33 departamentos y 1.122 municipios de Colombia (DIVIPOLA del
 *     DANE) más los destinos turísticos que no son municipios. Se cargan desde un
 *     archivo del repositorio y no desde una API externa: son datos que cambian cada
 *     varios años, y depender de un servicio ajeno significaría que nadie puede publicar
 *     una propiedad si ese servicio está caído.
 *  2. Catálogo de demostración: categorías, servicios, anfitrión y 28 propiedades.
 *
 * Que sean independientes importa: si mañana se agrega un destino nuevo, se puede
 * recargar solo el paso 1 sin tocar las propiedades ya publicadas por usuarios reales.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Departamento)
    private readonly departamentos: Repository<Departamento>,
    @InjectRepository(Municipio) private readonly municipios: Repository<Municipio>,
    @InjectRepository(Categoria) private readonly categorias: Repository<Categoria>,
    @InjectRepository(Caracteristica)
    private readonly caracteristicas: Repository<Caracteristica>,
    @InjectRepository(Propiedad) private readonly propiedades: Repository<Propiedad>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.sembrarUbicaciones();
    await this.sembrarCatalogo();
  }

  /** Departamentos y municipios de Colombia + destinos turísticos. */
  async sembrarUbicaciones(): Promise<void> {
    if ((await this.departamentos.count()) > 0) {
      return;
    }
    this.logger.log('Cargando la división territorial de Colombia...');

    const fuente = divipola as DepartamentoDivipola[];
    const departamentos = await this.departamentos.save(
      fuente.map((d) =>
        this.departamentos.create({ codigoDane: d.codigo, nombre: d.nombre }),
      ),
    );
    const porNombre = new Map(departamentos.map((d) => [d.nombre, d]));

    const municipios = fuente.flatMap((d) =>
      d.municipios.map((m) =>
        this.municipios.create({
          codigoDane: m.codigo,
          nombre: m.nombre,
          tipo: m.tipo,
          latitud: m.latitud,
          longitud: m.longitud,
          departamento: porNombre.get(d.nombre),
        }),
      ),
    );

    // Destinos turísticos (corregimientos): no están en DIVIPOLA pero son los nombres
    // por los que la gente busca alojamiento.
    municipios.push(
      ...DESTINOS_TURISTICOS.map((destino) =>
        this.municipios.create({
          codigoDane: null,
          nombre: destino.nombre,
          tipo: 'Destino',
          latitud: destino.latitud,
          longitud: destino.longitud,
          departamento: porNombre.get(destino.departamento),
        }),
      ),
    );

    await this.municipios.save(municipios, { chunk: 200 });
    this.logger.log(
      `Ubicaciones listas: ${departamentos.length} departamentos, ` +
        `${municipios.length} municipios y destinos.`,
    );
  }

  /** Catálogo de demostración: solo si todavía no hay propiedades publicadas. */
  async sembrarCatalogo(): Promise<void> {
    if ((await this.propiedades.count()) > 0) {
      this.logger.log('Ya hay propiedades publicadas: se omite el catálogo de demostración.');
      return;
    }

    this.logger.log('Sembrando el catálogo de demostración...');

    const categorias = await this.categorias.save(
      CATEGORIAS.map((c) => this.categorias.create(c)),
    );
    const caracteristicas = await this.caracteristicas.save(
      CARACTERISTICAS.map((c) => this.caracteristicas.create(c)),
    );

    const anfitrion = await this.usuarios.save(
      this.usuarios.create({
        ...ANFITRION_DEMO,
        password: await bcrypt.hash(this.passwordDelAnfitrion(), 10),
      }),
    );

    const buscarCategoria = (titulo: string): Categoria => {
      const encontrada = categorias.find((c) => c.titulo === titulo);
      if (!encontrada) {
        throw new Error(`Dato de demo inconsistente: no existe la categoría "${titulo}"`);
      }
      return encontrada;
    };

    const buscarCaracteristica = (nombre: string): Caracteristica => {
      const encontrada = caracteristicas.find((c) => c.nombre === nombre);
      if (!encontrada) {
        throw new Error(`Dato de demo inconsistente: no existe el servicio "${nombre}"`);
      }
      return encontrada;
    };

    const propiedades: Propiedad[] = [];
    for (const [indice, datos] of PROPIEDADES.entries()) {
      // El nombre solo es único dentro de su departamento (hay varios "San Diego" o
      // "Manaure" en el país), por eso la búsqueda usa los dos campos.
      const municipio = await this.municipios.findOne({
        where: {
          nombre: datos.municipio,
          departamento: { nombre: datos.departamento },
        },
      });
      if (!municipio) {
        throw new Error(
          `Dato de demo inconsistente: no existe "${datos.municipio}, ${datos.departamento}"`,
        );
      }

      const propiedad = this.propiedades.create({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        direccion: datos.direccion,
        habitaciones: datos.habitaciones,
        banos: datos.banos,
        ...NORMAS_POR_DEFECTO,
        duenio: anfitrion,
        categoria: buscarCategoria(datos.categoria),
        municipio,
        caracteristicas: serviciosDe(datos.categoria).map(buscarCaracteristica),
      });
      propiedad.imagenes = galeriaDe(indice).map((url) =>
        Object.assign(new Imagen(), { titulo: datos.titulo, urlExterna: url }),
      );
      propiedades.push(propiedad);
    }

    await this.propiedades.save(propiedades);

    this.logger.log(
      `Catálogo listo: ${categorias.length} categorías y ${propiedades.length} ` +
        `propiedades (anfitrión: ${anfitrion.email}).`,
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
