import { BaseEntity } from 'src/core/utility/base.entity';
import { EmpleadoEntity } from 'src/modules/empleado/entity/empleado.entity';
import { TipoIncapacidadEntity } from 'src/modules/tipo-incapacidad/entity/tipo-incapacidad.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'planilla_incapacidad' })
export class PlanillaIncapacidadEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_planilla_incapacidad' })
  idPlanillaIncapacidad: number;

  @Column({ name: 'matricula', type: 'varchar', nullable: false })
  matricula: string;

  @Column({ name: 'nombre_completo', type: 'varchar', nullable: false })
  nombreCompleto: string;

  @Column({ name: 'baja_medica_ini', type: 'date', nullable: false })
  bajaMedicaIni: Date;

  @Column({ name: 'baja_medica_fin', type: 'date', nullable: false })
  bajaMedicaFin: Date;

  @Column({
    name: 'dias_incapacidad_inicial',
    type: 'decimal',
    nullable: false,
    precision: 10,
    scale: 2,
  })
  diasIncapacidadInicial: number;

  @Column({ name: 'fecha_cotizacion_del', type: 'date', nullable: false })
  fechaCotizacionDel: Date;

  @Column({ name: 'fecha_cotizacion_al', type: 'date', nullable: false })
  fechaCotizacionAl: Date;

  @Column({
    name: 'dia',
    type: 'decimal',
    nullable: false,
    precision: 10,
    scale: 2,
  })
  dia: number;

  @Column({
    name: 'dia_cbes',
    type: 'decimal',
    nullable: false,
    precision: 10,
    scale: 2,
  })
  diaCbes: number;

  @Column({
    name: 'total_ganado_mensual',
    type: 'decimal',
    nullable: false,
    precision: 10,
    scale: 2,
  })
  totalGanadoMensual: number;

  @Column({
    name: 'total_dia',
    type: 'decimal',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  totalDia: number;

  @Column({
    name: 'total',
    type: 'decimal',
    nullable: false,
    precision: 10,
    scale: 2,
  })
  total: number;

  @Column({
    name: 'total_porcentaje_cubrir',
    type: 'decimal',
    nullable: false,
    precision: 10,
    scale: 2,
  })
  totalPorcentajeCubrir: number;

  @Column({
    name: 'estado',
    type: 'varchar',
    nullable: true,
    default: 'INICIALIZADO',
  })
  estado: string;

  @Column({
    name: 'emp_npatronal',
    type: 'varchar',
    nullable: true,
  })
  empNpatronal: string;

  @Column({ name: 'fecha_aprobacion', type: 'date', nullable: true })
  fechaAprobacion: Date;

  @Column({ name: 'aprobado_por', type: 'int', nullable: true })
  aprobadoPor: number;

  @Column({ name: 'observaciones', type: 'varchar', nullable: true })
  observaciones: string;

  @CreateDateColumn({
    name: 'fecha_generacion',
    type: 'timestamp',
    nullable: false,
  })
  fechaGeneracion: Date;

  @ManyToOne(
    () => TipoIncapacidadEntity,
    (tipoIncapacidad) => tipoIncapacidad.planillaIncapacidad,
  )
  @JoinColumn({ name: 'id_tipo_incapacidad' })
  tipoIncapacidad: TipoIncapacidadEntity;

  @ManyToOne(() => EmpleadoEntity, (empleado) => empleado.planillasIncapacidad)
  @JoinColumn({ name: 'id_empleado' })
  empleado: EmpleadoEntity;
}
