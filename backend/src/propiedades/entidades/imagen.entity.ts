import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Propiedad } from './propiedad.entity';

/**
 * Una imagen es de uno de dos tipos:
 *  - Externa: `urlExterna` apunta a un CDN (las del catálogo de demo).
 *  - Subida:  el archivo vive en `datosBase64` y se sirve por GET /api/imagenes/:id.
 *
 * Guardar el archivo en la base (y no en disco) es a propósito: el sistema de archivos
 * de los planes gratuitos de PaaS es efímero — una imagen subida por un usuario
 * desaparecería en el siguiente despliegue. En la base sobrevive.
 *
 * Se guarda como texto base64 y no como binario porque `bytea` (Postgres) y `blob`
 * (SQLite) no son intercambiables: texto funciona igual en los dos motores. El costo
 * es ~33% más de tamaño, asumible para el volumen de esta aplicación.
 *
 * `select: false` evita traer los archivos en cada consulta del catálogo; solo se
 * cargan cuando el endpoint de la imagen los pide explícitamente.
 */
@Entity('imagenes')
export class Imagen {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  titulo: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  urlExterna: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  datosBase64: string | null;

  @Column({ type: 'varchar', nullable: true })
  tipoMime: string | null;

  @ManyToOne(() => Propiedad, (propiedad) => propiedad.imagenes, {
    onDelete: 'CASCADE',
  })
  propiedad: Propiedad;

  /** URL que consume el frontend, venga de donde venga el archivo. */
  get url(): string {
    return this.urlExterna ?? `/api/imagenes/${this.id}`;
  }
}
