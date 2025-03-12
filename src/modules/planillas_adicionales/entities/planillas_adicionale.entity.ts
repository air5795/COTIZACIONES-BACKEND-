import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'transversales', name: 'planillas_adicionales' })
export class PlanillasAdicionale {

    @PrimaryGeneratedColumn()
    id_planilla_adicional: number;

    @Column()
    id_planilla_aportes: number;
        
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_importe: number;

    @Column()
    total_trabaj: number;
  
    @Column({ default: 1 })
    estado: number;
  
    @Column({ default: () => 'CURRENT_USER' })
    usuario_creacion: string;
  
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_creacion: Date;

    @Column()
    observaciones: string;

    @Column()
    motivo_adicional: string;

    @Column()
    fecha_declarada: Date;

}
