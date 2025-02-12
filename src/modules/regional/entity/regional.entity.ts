import { BaseEntity } from 'src/core/utility/base.entity';
import { EmpresaEntity } from 'src/modules/empresa/entity/empresa.entity';

import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';

@Entity({ name: 'regional' })
export class RegionalEntity extends BaseEntity {
  @PrimaryColumn({ name: 'id_regional' })
  idRegional: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'nombre_regional',
    unique: true,
  })
  nombreRegional: string;

  @OneToMany(() => EmpresaEntity, (empresa) => empresa.regionales)
  empresas: EmpresaEntity[];
}
