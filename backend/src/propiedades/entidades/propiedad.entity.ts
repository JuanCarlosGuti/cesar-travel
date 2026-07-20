import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Caracteristica } from '../../catalogo/entidades/caracteristica.entity';
import { Categoria } from '../../catalogo/entidades/categoria.entity';
import { Municipio } from '../../catalogo/entidades/municipio.entity';
import { Usuario } from '../../auth/entidades/usuario.entity';
import { Imagen } from './imagen.entity';

@Entity('propiedades')
export class Propiedad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ type: 'varchar', length: 1000 })
  descripcion: string;

  @Column()
  direccion: string;

  @Column()
  habitaciones: number;

  @Column()
  banos: number;

  /** Políticas: normas de la casa, salud y seguridad, cancelación. */
  @Column({ type: 'varchar', nullable: true })
  normas: string | null;

  @Column({ type: 'varchar', nullable: true })
  saludYSeguridad: string | null;

  @Column({ type: 'varchar', nullable: true })
  politicaCancelacion: string | null;

  /** Dueño del inmueble: quien la publicó (se toma del JWT, nunca del body). */
  @ManyToOne(() => Usuario, { eager: true, nullable: true, onDelete: 'SET NULL' })
  duenio: Usuario | null;

  @ManyToOne(() => Categoria, { eager: true })
  categoria: Categoria;

  @ManyToOne(() => Municipio, { eager: true })
  municipio: Municipio;

  @OneToMany(() => Imagen, (imagen) => imagen.propiedad, {
    eager: true,
    cascade: true,
  })
  imagenes: Imagen[];

  @ManyToMany(() => Caracteristica, { eager: true })
  @JoinTable({ name: 'propiedad_caracteristicas' })
  caracteristicas: Caracteristica[];
}
