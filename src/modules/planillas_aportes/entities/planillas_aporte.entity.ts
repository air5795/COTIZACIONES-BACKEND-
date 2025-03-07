import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { PlanillaAportesDetalles } from './planillas_aportes_detalles.entity';
@Entity({ schema: 'transversales', name: 'planillas_aportes' })

export class PlanillasAporte {

    @PrimaryGeneratedColumn()
    id_planilla_aportes: number;

    @Column()
    com_nro: number;
  
    @Column()
    cod_patronal: string;
  
    @Column()
    mes: string;
    
    @Column()
    gestion: string;
    
    @Column()
    empresa: string;
    
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
    fecha_planilla: Date;

    


}
