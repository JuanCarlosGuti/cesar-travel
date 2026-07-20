import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../auth/entidades/usuario.entity';
import { Propiedad } from '../../propiedades/entidades/propiedad.entity';
import { Mensaje } from './mensaje.entity';

/**
 * Chat interno huésped↔dueño sobre un inmueble — reemplaza el contacto por WhatsApp
 * por privacidad: no se expone ningún dato de contacto y la conversación queda en la
 * plataforma. Una conversación por par (propiedad, huésped).
 */
@Entity('conversaciones')
@Unique(['propiedad', 'huesped'])
@Index(['huesped'])
export class Conversacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Propiedad, { eager: true, onDelete: 'CASCADE' })
  propiedad: Propiedad;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  huesped: Usuario;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  duenio: Usuario;

  @OneToMany(() => Mensaje, (mensaje) => mensaje.conversacion)
  mensajes: Mensaje[];

  @CreateDateColumn()
  creadaEn: Date;

  @UpdateDateColumn()
  actualizadaEn: Date;
}
