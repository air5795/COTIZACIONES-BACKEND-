import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PlanillasAdicionale } from '../../planillas_adicionales/entities/planillas_adicionale.entity'; 

@Entity({ schema: 'transversales', name: 'pagos_planillas_adicionales' })
export class PagosAportesAdicionale {
      @PrimaryColumn()
      id_planilla_adicional: number;
    
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
      @ManyToOne(() => PlanillasAdicionale, (planilla) => planilla.id_planilla_adicional, {
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
      @JoinColumn({ name: 'id_planilla_adicional' })
      planilla: PlanillasAdicionale;
}
