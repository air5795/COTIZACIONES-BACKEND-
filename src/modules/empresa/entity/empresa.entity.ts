import { BaseEntity } from 'src/core/utility/base.entity';
import {
  Entity,
  Column,
  OneToMany,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RegionalEntity } from '../../regional/entity/regional.entity';
import { EmpleadoEntity } from '../../empleado/entity/empleado.entity';

@Entity({ name: 'empresa' })
export class EmpresaEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_empresa' })
  idEmpresa: number;

  @Column({ type: 'varchar', name: 'emp_npatronal' })
  empNpatronal: string;

  // columnas de la base de afiliaciones
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emp_cod' })
  empCod: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emp_reg' })
  empReg: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_nom',
  })
  empNom: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'sub_emp_nom',
    default: null,
  })
  subEmpNom: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_legal',
  })
  empLegal: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_activ',
  })
  empActiv: string;

  @Column({
    type: 'numeric',
    nullable: true,
    name: 'emp_ntrab',
  })
  empNtrab: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_calle',
  })
  empCalle: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_num',
  })
  empNum: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_telf',
  })
  empTelf: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_zona',
  })
  empZona: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_localidad',
  })
  empLocalidad: string;

  @Column({
    type: 'date',
    nullable: true,
    name: 'emp_fini_act',
  })
  empFiniAct: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_lug',
  })
  empLug: string;

  @Column({
    type: 'date',
    nullable: true,
    name: 'emp_fech',
  })
  empFech: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_estado',
  })
  empEstado: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_fec_baja',
  })
  empFecBaja: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_obs',
  })
  empObs: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'tipo',
  })
  tipo: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_nom_corto',
  })
  empNomCorto: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'emp_nit' })
  empNit: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'emp_matricula',
  })
  empMatricula: string;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'vigente',
  })
  vigente: boolean;

  @ManyToOne(() => RegionalEntity, (regional) => regional.empresas)
  @JoinColumn({ name: 'id_regional' })
  regionales: RegionalEntity;

  @OneToMany(() => EmpleadoEntity, (empleado) => empleado.empresa)
  empleados: EmpleadoEntity[];
}
