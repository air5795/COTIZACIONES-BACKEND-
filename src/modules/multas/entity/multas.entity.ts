import { BaseEntity } from 'src/core/utility/base.entity';
import { TipoMultasEntity } from 'src/modules/tipo-multas/entity/tipo-multas.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'multas' })
export class MultasEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_multas' })
  idMultas: number;

  @Column({ type: 'varchar', name: 'descripcion', nullable: true })
  descripcion: string;

  @ManyToOne(() => TipoMultasEntity, (tipoMultas) => tipoMultas.multas)
  @JoinColumn({ name: 'id_tipo_multa' })
  tipoMultas: TipoMultasEntity;
}
