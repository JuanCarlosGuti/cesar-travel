import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Usuario } from '../../auth/entidades/usuario.entity';
import { Propiedad } from '../../propiedades/entidades/propiedad.entity';

/** Una reseña por usuario y propiedad, y solo con una estadía ya finalizada
 * (la regla se valida contra las reservas en ResenasService). */
@Entity('resenas')
@Unique(['propiedad', 'autor'])
@Index(['propiedad'])
export class Resena {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Propiedad, { onDelete: 'CASCADE' })
  propiedad: Propiedad;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  autor: Usuario;

  @Column('int')
  puntaje: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  comentario: string | null;

  @CreateDateColumn()
  creadaEn: Date;
}
