import { CreateDateColumn, Column } from 'typeorm';

export abstract class BaseEntity {
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    default: true,
  })
  activo: boolean;

  @Column({
    name: 'user_id',
    default: 0,
  })
  userId: number;

  @Column({
    name: 'id_usuario_mod',
    default: 0,
  })
  idUsuarioModificacion: number;
}
