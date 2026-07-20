import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../auth/entidades/usuario.entity';
import { Conversacion } from './conversacion.entity';

@Entity('mensajes')
@Index(['conversacion'])
export class Mensaje {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conversacion, (conversacion) => conversacion.mensajes, {
    onDelete: 'CASCADE',
  })
  conversacion: Conversacion;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  autor: Usuario;

  @Column({ type: 'varchar', length: 1000 })
  cuerpo: string;

  /** Lo marca como leído quien recibe, al abrir el hilo (POST /api/chats/:id/leido). */
  @Column({ default: false })
  leido: boolean;

  @CreateDateColumn()
  creadoEn: Date;
}
