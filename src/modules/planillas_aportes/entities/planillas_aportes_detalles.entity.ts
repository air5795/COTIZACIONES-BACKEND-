import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { PlanillasAporte } from './planillas_aporte.entity';


@Entity({ schema: 'transversales', name: 'planilla_aportes_detalles' })
export class PlanillaAportesDetalles {
  @PrimaryGeneratedColumn()
  id_planilla_aportes_detalles: number;

  @Column()
  id_planilla_aportes: number;

  @Column()
  nro: number;

  @Column()
  ci: string;

  @Column()
  apellido_paterno: string;

  @Column()
  apellido_materno: string;

  @Column()
  nombres: string;

  @Column()
  sexo: string;

  @Column()
  cargo: string;

  @Column({ type: 'date' })
  fecha_nac: Date;

  @Column({ type: 'date' })
  fecha_ingreso: Date;

  @Column({ type: 'date', nullable: true })
  fecha_retiro: Date;

  @Column()
  dias_pagados: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  haber_basico: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  bono_antiguedad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto_horas_extra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto_horas_extra_nocturnas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  otros_bonos_pagos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salario: number;

  @Column()
  regional: string;

  

}
