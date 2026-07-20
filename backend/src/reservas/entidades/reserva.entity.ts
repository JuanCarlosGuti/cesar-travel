import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../auth/entidades/usuario.entity';
import { Propiedad } from '../../propiedades/entidades/propiedad.entity';

/** Rango semiabierto [entrada, salida): alguien puede entrar el mismo día que otro se va. */
@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Propiedad, { eager: true, onDelete: 'CASCADE' })
  propiedad: Propiedad;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  huesped: Usuario;

  @Column({ type: 'date' })
  entrada: string;

  @Column({ type: 'date' })
  salida: string;

  @Column({ type: 'varchar', nullable: true })
  horaLlegada: string | null;
}
