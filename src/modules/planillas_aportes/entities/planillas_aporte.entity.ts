import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
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
}
