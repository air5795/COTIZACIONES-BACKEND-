import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PlanillasAporte } from '../../planillas_aportes/entities/planillas_aporte.entity'; 

@Entity({ schema: 'transversales', name: 'pagos_aportes_mensuales' })
export class PagoAporte {
  @PrimaryColumn()
  id_planilla_aportes: number;

  @Column({ type: 'timestamp' })
  fecha_pago: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto_pagado: number;

  @Column({ nullable: true })
  metodo_pago: string;

  @Column({ nullable: true })
  comprobante_pago: string;

  @Column({ nullable: true })
  foto_comprobante: string;

  @Column({ default: 1 })
  estado: number;

  @Column({ default: 1 })
  estado_envio: number;

  @Column({ default: () => 'CURRENT_USER' })
  usuario_creacion: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @Column({ nullable: true })
  usuario_modificacion: string;

  @Column({ type: 'timestamp', nullable: true })
  fecha_modificacion: Date;

  @Column({ nullable: true })
  observaciones: string;

  // Relación con la tabla planillas_aportes
  @ManyToOne(() => PlanillasAporte, (planilla) => planilla.id_planilla_aportes, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'id_planilla_aportes' })
  planilla: PlanillasAporte;
}