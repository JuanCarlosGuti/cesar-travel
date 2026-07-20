import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Municipio + departamento: el alcance de la plataforma es local/departamental
 * (Cesar y La Guajira), no internacional — por eso no hay campo país.
 * Las coordenadas son del municipio (no del inmueble) y alimentan el mapa del detalle.
 */
@Entity('municipios')
export class Municipio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  departamento: string;

  @Column({ type: 'float', nullable: true })
  latitud: number | null;

  @Column({ type: 'float', nullable: true })
  longitud: number | null;
}
