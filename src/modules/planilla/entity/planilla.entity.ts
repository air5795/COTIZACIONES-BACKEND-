import { SalarioMinimoEntity } from 'src/modules/salario-minimo/entity/salario-minimo.entity';
import { TasaInteresAporteEntity } from 'src/modules/tasa-interes-aporte/entity/tasa-interes-aporte.entity';
import { TipoPlanillaEntity } from 'src/modules/tipo-planilla/entity/tipo-planilla.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { EmpleadoEntity } from 'src/modules/empleado/entity/empleado.entity';
import { BaseEntity } from 'src/core/utility/base.entity';

@Entity({ name: 'planilla' })
export class PlanillaEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_planilla' })
  idPlanilla: number;

  @Column({ name: 'id_planilla_empresa', type: 'int', nullable: true })
  idPlanillaEmpresa: number;

  @Column({ name: 'id_tipo_planilla', type: 'int', nullable: true })
  idTipoPlanilla: number;

  @Column({ name: 'ase_mat_tit', type: 'varchar', nullable: true })
  aseMatTit: string;

  @Column({ name: 'ase_ci', type: 'int', nullable: true })
  aseCi: number;

  @Column({ name: 'ase_apat', type: 'varchar', nullable: true })
  aseApat: string;

  @Column({ name: 'ase_amat', type: 'varchar', nullable: true })
  aseAmat: string;

  @Column({ name: 'ase_nom', type: 'varchar', nullable: true })
  aseNom: string;

  @Column({ name: 'ase_fec_nac', type: 'date', nullable: true })
  aseFecNac: Date;

  @Column({ name: 'dias_trabajados', type: 'int', nullable: true })
  diasTrabajados: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cargo' })
  cargo: string;

  @Column({ name: 'fecha_ingreso', type: 'date', nullable: true })
  fechaIngreso: Date;

  @Column({ name: 'fecha_retiro', type: 'date', nullable: true })
  fechaRetiro: Date;

  @Column({ name: 'total_ganado', type: 'numeric', nullable: true })
  totalGanado: number;

  @Column({
    name: 'total_descuento',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  totalDescuento: number;

  @Column({ name: 'fecha', type: 'date', nullable: true })
  fecha: Date;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string;

  @Column({
    name: 'aprobado',
    type: 'varchar',
    nullable: true,
    default: 'INICIALIZADO',
  })
  aprobado: string;

  @Column({ name: 'fecha_aprobacion', type: 'date', nullable: true })
  fechaAprobacion: Date;

  @Column({ name: 'aprobado_por', type: 'int', nullable: true })
  aprobadoPor: number;

  @Column({ name: 'gestion', type: 'int', nullable: true }) //Hacer referencia al año
  gestion: number;

  @Column({ name: 'periodo', type: 'int', nullable: true }) //hace referencia al mes
  periodo: number;

  @Column({ name: 'emp_npatronal', type: 'varchar', nullable: true })
  empNpatronal: string;

  @Column({ name: 'estado_registro', type: 'varchar', nullable: true })
  estadoRegistro: string;

  @Column({ name: 'updated_at', type: 'date', nullable: true })
  updatedAt: Date;

  
  @Column({ name: 'id_empleado', type: 'int', nullable: true }) //hace referencia al mes
  idEmpleado: number;

  @Column({ name: 'estado_afiliacion', type: 'varchar', nullable: true })
  estadoAfiliacion: string;

  // Relaciones
  @ManyToOne(
    () => TasaInteresAporteEntity,
    (tasaInteresAporte) => tasaInteresAporte.planillas,
  )
  @JoinColumn({ name: 'id_tasa' })
  tasaInteresAportes: TasaInteresAporteEntity;

  @ManyToOne(() => TipoPlanillaEntity, (tipoPlanilla) => tipoPlanilla.planillas) // Asegúrate de definir esta entidad
  @JoinColumn({ name: 'id_tipo_planilla' })
  tipoPlanillas: TipoPlanillaEntity;

  @ManyToOne(() => EmpleadoEntity, (empleado) => empleado.planillas)
  @JoinColumn({ name: 'id_empleado' })
  empleado: EmpleadoEntity;

  @ManyToOne(
    () => SalarioMinimoEntity,
    (salarioMinimo) => salarioMinimo.planilla,
  )
  @JoinColumn({ name: 'id_salario_minimo' })
  salarioMinimo: SalarioMinimoEntity;
}
