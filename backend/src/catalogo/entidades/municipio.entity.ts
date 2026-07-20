import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Departamento } from './departamento.entity';

/**
 * Un lugar donde puede haber alojamientos. La lista base son los 1.122 municipios de
 * DIVIPOLA (DANE), pero también admite **destinos turísticos que no son municipios**:
 * Palomino y Cabo de la Vela son corregimientos de Dibulla y Uribia, y sin embargo son
 * los nombres por los que la gente busca alojamiento en La Guajira. Un buscador de
 * hospedaje se organiza por destino, no por división política.
 *
 * Las coordenadas alimentan el mapa del detalle de la propiedad.
 */
@Entity('municipios')
@Index(['departamento'])
export class Municipio {
  @PrimaryGeneratedColumn()
  id: number;

  /** Código DANE del municipio ("44001"). Null en los destinos que no son municipios. */
  @Column({ type: 'varchar', nullable: true })
  codigoDane: string | null;

  @Column()
  nombre: string;

  /** "Municipio", "Isla", "Área no municipalizada" (DANE) o "Destino" (corregimientos). */
  @Column({ default: 'Municipio' })
  tipo: string;

  @Column({ type: 'float', nullable: true })
  latitud: number | null;

  @Column({ type: 'float', nullable: true })
  longitud: number | null;

  @ManyToOne(() => Departamento, (departamento) => departamento.municipios, {
    eager: true,
    onDelete: 'CASCADE',
  })
  departamento: Departamento;
}
