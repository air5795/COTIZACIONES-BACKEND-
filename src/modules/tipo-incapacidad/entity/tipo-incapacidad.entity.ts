import { PlanillaIncapacidadEntity } from 'src/modules/planilla-incapacidades/entity/planilla-incapacidades.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tipo_incapacidad' })
export class TipoIncapacidadEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo_incapacidad' })
  idTipoIncapacidad: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'nombre' })
  nombre: string;

  @Column({ type: 'integer', nullable: true, name: 'porcentaje' })
  porcentaje: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'porcentaje_decimal',
  })
  porcentajeDecimal: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'descripcion' })
  descripcion: string;

  @Column({ type: 'integer', nullable: true, name: 'dias_diferencia' })
  diasDiferencia: number;

  @Column({ type: 'integer', nullable: true, name: 'dias_cbes' })
  diasCbes: number;

  @OneToMany(
    () => PlanillaIncapacidadEntity,
    (planillaIncapacidad) => planillaIncapacidad.tipoIncapacidad,
  )
  planillaIncapacidad: PlanillaIncapacidadEntity[];
}
