import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PlanillaAportesDetalles } from './planillas_aportes_detalles.entity';
import { PagoAporte } from 'src/modules/pagos-aportes/entities/pagos-aporte.entity';
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

    @Column()
    fecha_declarada: Date;

    @OneToMany(() => PagoAporte, (pago) => pago.planilla)
    pagos: PagoAporte[];


}
