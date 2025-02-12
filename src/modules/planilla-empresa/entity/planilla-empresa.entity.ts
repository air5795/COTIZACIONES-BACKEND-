import { BaseEntity } from 'src/core/utility/base.entity';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'planilla_empresa' })
export class PlanillaEmpresaEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_planilla_empresa' })
  idPlanillaEmpresa: number;

  @Column({ type: 'integer', name: 'periodo' }) // mes en numero
  periodo: number;

  @Column({ type: 'integer', name: 'gestion' }) // año en numero
  gestion: number;

  @Column({ type: 'varchar', length: 100, name: 'emp_npatronal' }) // tiene tres tipos de estados enviado, cancelado, aprobado
  empNpatronal: string;

  @Column({ type: 'varchar', length: 10, name: 'estado_planilla' }) // tiene tres tipos de estados enviado, cancelado, aprobado
  estadoPlanilla: string;

  @Column({ type: 'varchar', length: 10, name: 'estado_validacion_afiliacion' }) // tiene tres tipos de estados enviado, cancelado, aprobado
  estadoValidacionAfiliacion: string;
}
