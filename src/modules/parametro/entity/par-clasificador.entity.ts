import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ParClasificadorDetalle } from './par-clasificador-detalle.entity';

//@Entity({ name: 'par_clasificador', schema: 'prueba_parametro' })
@Entity({ name: 'par_clasificador', schema: 'parametro' })
export class ParClasificador {
  @PrimaryGeneratedColumn({ name: 'id_clasificador' })
  idClasificador: number;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: false,
    name: 'identificador_clasificador',
  })
  @Index({ unique: true })
  identificadorClasificador: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: false,
    name: 'descripcion_clasificador',
  })
  descripcionClasificador: string;

  @Column({
    type: 'varchar',
    length: 25,
    nullable: false,
    name: 'usuario_registro',
    default: () => 'CURRENT_USER',
  })
  usuarioRegistro: string;

  @Exclude()
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_registro',
  })
  fechaRegistro: Date;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    name: 'ip_registro',
    default: () => 'inet_client_addr()',
  })
  ipRegistro: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'baja_logica_registro',
  })
  bajaLogicaRegistro: boolean;

  @Exclude()
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_modificacion',
  })
  fechaModificacion: Date;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'usuario_modificacion',
  })
  usuarioModificacion: string;

  /*@OneToMany(
    () => ParClasificadorDetalle,
    (parClasificadorDetalle) => parClasificadorDetalle.parClasificador,
  )
  parClasificadorDetalle: ParClasificadorDetalle[];*/
  /*@OneToOne(
    () => ParClasificadorDetalle,
    (parClasificadorDetalle) => parClasificadorDetalle.parClasificador,
  )
  parClasificadorDetalle: ParClasificadorDetalle;*/
}
