/**
 * Con esta tabla defino el tipo dde planilla
 * ejem. planila sueldo, planilla pasantes, planilla de aportes y las que surjan
 * para el calculo de aportes a la caja de salud
 */
import { BaseEntity } from 'src/core/utility/base.entity';
import { PlanillaEntity } from 'src/modules/planilla/entity/planilla.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'tipo_planilla' })
export class TipoPlanillaEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo_planilla' })
  idTipoPlanilla: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'nombre' })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'descripcion' })
  descripcion: string;

  @OneToMany(() => PlanillaEntity, (planilla) => planilla.tipoPlanillas)
  planillas: PlanillaEntity[];
}
