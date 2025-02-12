import { BaseEntity } from 'src/core/utility/base.entity';
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'ufv' })
export class UfvEntity extends BaseEntity {
  @PrimaryColumn({ type: 'date', name: 'fecha' })
  fecha: Date;

  @Column({ type: 'numeric', nullable: true, name: 'valor_ufv' })
  valorUfv: number;
}
