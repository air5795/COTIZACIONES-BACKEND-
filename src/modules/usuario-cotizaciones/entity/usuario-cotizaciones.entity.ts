import { BaseEntity } from 'src/core/utility/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'usuario_cotizaciones' })
export class UsuarioCotizacionesEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id_usuario_cotizaciones' })
  idUsuarioCotizaciones: number;

  @Column({ type: 'integer', nullable: true, name: 'id_usuario' })
  idUsuario: number;

  @Column({ type: 'varchar', nullable: true, name: 'nom_usuario' })
  nomUsuario: string;

  @Column({ type: 'varchar', nullable: true, name: 'nom_completo' })
  nomCompleto: string;

  @Column({ type: 'varchar', nullable: true, name: 'regional' })
  regional: string;

  @Column({ type: 'varchar', nullable: true, name: 'emp_nom' })
  empNom: string;
}
