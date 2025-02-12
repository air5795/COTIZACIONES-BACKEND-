import { BaseEntity } from 'src/core/utility/base.entity';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmpresaEntity } from '../../empresa/entity/empresa.entity';
import { PlanillaEntity } from 'src/modules/planilla/entity/planilla.entity';
import { PlanillaIncapacidadEntity } from 'src/modules/planilla-incapacidades/entity/planilla-incapacidades.entity';

@Entity({ name: 'empleado' })
export class EmpleadoEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_empleado' })
  idEmpleado: number;

  @Column({ name: 'afi_nro', type: 'int', nullable: true })
  afiNro: number;

  @Column({ name: 'ca_nro', type: 'int', nullable: true })
  caNro: number;

  @Column({ name: 'ase_cod', type: 'int', nullable: true })
  aseCod: number;

  @Column({ name: 'ase_mat_tit', type: 'varchar', nullable: true })
  aseMatTit: string;

  @Column({ name: 'ase_mat', type: 'varchar', nullable: true })
  aseMat: string;

  @Column({ name: 'ase_ci_tit', type: 'varchar', nullable: true })
  aseCiTit: string;

  @Column({ name: 'tipo_documento_tit', type: 'varchar', nullable: true })
  tipoDocumentoTit: string;

  @Column({ name: 'ase_ci', type: 'int', nullable: true })
  aseCi: number;

  @Column({ name: 'ase_ci_com', type: 'varchar', nullable: true })
  aseCiCom: string | null;

  @Column({ name: 'ase_ciext', type: 'varchar', nullable: true })
  aseCiext: string;

  @Column({ name: 'tipo_documento', type: 'varchar', nullable: true })
  tipoDocumento: string;

  @Column({ name: 'ase_apat', type: 'varchar', nullable: true })
  aseApat: string;

  @Column({ name: 'ase_amat', type: 'varchar', nullable: true })
  aseAmat: string;

  @Column({ name: 'ase_nom', type: 'varchar', nullable: true })
  aseNom: string;

  @Column({ name: 'ase_lug_nac', type: 'varchar', nullable: true })
  aseLugNac: string;

  @Column({ name: 'ase_fec_nac', type: 'date', nullable: true })
  aseFecNac: Date;

  @Column({ name: 'ase_edad', type: 'int', nullable: true })
  aseEdad: number;

  @Column({ name: 'ase_sexo', type: 'varchar', nullable: true })
  aseSexo: string;

  @Column({ name: 'ase_ecivil', type: 'varchar', nullable: true })
  aseEcivil: string;

  @Column({ name: 'ase_calle', type: 'varchar', nullable: true })
  aseCalle: string;

  @Column({ name: 'ase_num', type: 'varchar', nullable: true })
  aseNum: string;

  @Column({ name: 'ase_zona', type: 'varchar', nullable: true })
  aseZona: string;

  @Column({ name: 'ase_localidad', type: 'varchar', nullable: true })
  aseLocalidad: string;

  @Column({ name: 'ase_telf', type: 'varchar', nullable: true })
  aseTelf: string;

  @Column({ name: 'ase_profesion', type: 'varchar', nullable: true })
  aseProfesion: string;

  @Column({ name: 'ase_cargo', type: 'varchar', nullable: true })
  aseCargo: string;

  @Column({ name: 'ase_haber', type: 'numeric', nullable: true })
  aseHaber: number;

  @Column({ name: 'emp_npatronal', type: 'varchar', nullable: true })
  empNpatronal: string;

  @Column({ name: 'emp_nom', type: 'varchar', nullable: true })
  empNom: string;

  @Column({ name: 'ase_fini_emp', type: 'date', nullable: true })
  aseFiniEmp: Date;

  @Column({ name: 'ase_lugar', type: 'varchar', nullable: true })
  aseLugar: string;

  @Column({ name: 'ase_fec_afi', type: 'date', nullable: true })
  aseFecAfi: Date;

  @Column({ name: 'ase_tipo', type: 'varchar', nullable: true })
  aseTipo: string;

  @Column({ name: 'ase_estado', type: 'varchar', nullable: true })
  aseEstado: string;

  @Column({ name: 'ase_cond_est', type: 'varchar', nullable: true })
  aseCondEst: string;

  @Column({ name: 'ase_tipo_cod', type: 'int', nullable: true })
  aseTipoCod: number;

  @Column({ name: 'ase_tipo_asegurado', type: 'varchar', nullable: true })
  aseTipoAsegurado: string;

  @Column({ name: 'ase_obs', type: 'varchar', nullable: true })
  aseObs: string | null;

  @Column({ name: 'ase_estudio', type: 'varchar', nullable: true })
  aseEstudio: string | null;

  @Column({ name: 'ase_docu', type: 'varchar', nullable: true })
  aseDocu: string | null;

  @Column({ name: 'par_cod', type: 'int', nullable: true })
  parCod: number;

  @Column({ name: 'par_desc', type: 'varchar', nullable: true })
  parDesc: string;

  @Column({ name: 'par_orden', type: 'int', nullable: true })
  parOrden: number;

  @Column({ name: 'validado_afilaciones', nullable: true })
  validadoAfiliaciones: boolean;

  @Column({ name: 'validado_segip', nullable: true })
  validadoSegip: boolean;

  @Column({ name: 'fecha_baja', type: 'date', nullable: true })
  fechaBaja: Date;

  @Column({ name: 'observaciones', type: 'varchar', nullable: true })
  observaciones: string;

  @ManyToOne(() => EmpresaEntity, (empresa) => empresa.empleados)
  @JoinColumn({ name: 'id_empresa' })
  empresa: EmpresaEntity;

  @OneToMany(() => PlanillaEntity, (planilla) => planilla.empleado)
  planillas: PlanillaEntity[];

  @OneToMany(
    () => PlanillaIncapacidadEntity,
    (planillaIncapacidad) => planillaIncapacidad.empleado,
  )
  planillasIncapacidad: PlanillaIncapacidadEntity[];
}
