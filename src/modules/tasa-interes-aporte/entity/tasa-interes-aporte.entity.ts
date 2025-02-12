import { BaseEntity } from 'src/core/utility/base.entity';
import { PlanillaEntity } from 'src/modules/planilla/entity/planilla.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'tasa_interes_aporte' })
export class TasaInteresAporteEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_tasa' })
  idTasa: number;

  @Column({ type: 'numeric', nullable: true, name: 'valor' })
  valor: number;

  @Column({ type: 'numeric', nullable: true, name: 'porcentaje' })
  porcentaje: number;

  @Column({ type: 'boolean', nullable: true, name: 'vigente', default: true })
  vigente: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'observaciones',
  })
  observaciones: string;
  @OneToMany(() => PlanillaEntity, (planilla) => planilla.tasaInteresAportes)
  planillas: PlanillaEntity[];
}
