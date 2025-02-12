import { BaseEntity } from 'src/core/utility/base.entity';
import { MultasEntity } from 'src/modules/multas/entity/multas.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tipo_multas' })
export class TipoMultasEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo_multa' })
  idTipoMulta: number;

  @Column({ type: 'varchar', name: 'descripcion', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', name: 'detalles', nullable: true })
  detalles: string;

  @OneToMany(() => MultasEntity, (multas) => multas.tipoMultas)
  multas: MultasEntity[];
}
