import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Municipio } from './municipio.entity';

/** División política de Colombia (fuente: DIVIPOLA del DANE). */
@Entity('departamentos')
export class Departamento {
  @PrimaryGeneratedColumn()
  id: number;

  /** Código oficial del DANE ("44" = La Guajira). Identifica sin depender del nombre. */
  @Column({ unique: true })
  codigoDane: string;

  @Column()
  nombre: string;

  @OneToMany(() => Municipio, (municipio) => municipio.departamento)
  municipios: Municipio[];
}
