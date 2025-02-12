import { BaseEntity } from 'src/core/utility/base.entity';
import { PlanillaEntity } from 'src/modules/planilla/entity/planilla.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'salario_minimo' })
export class SalarioMinimoEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_salario_minimo' })
  idSalarioMinimo: number;

  @Column({ type: 'varchar', nullable: true, name: 'gestion' })
  gestion: string;

  @Column({ type: 'numeric', nullable: true, name: 'monto' })
  monto: number;

  @Column({ type: 'boolean', nullable: true, name: 'vigente' })
  vigente: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'observaciones',
  })
  observaciones: string;

  @OneToMany(() => PlanillaEntity, (planilla) => planilla.salarioMinimo)
  planilla: PlanillaEntity;
}
