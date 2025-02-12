import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'reportes_mensuales' })
export class ReportesMensualesEntity {
  @PrimaryGeneratedColumn({ name: 'id_reportes_mensuales' })
  idReportesMensuales: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'razon_social',
  })
  razonSocial: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'domicilio_legal',
  })
  domicilioLegal: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'telefono',
  })
  telefono: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'numero_patronal',
  })
  numeroPatronal: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'nit',
  })
  nit: string;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'periodo',
  })
  periodo: number;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'gestion',
  })
  gestion: number;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'numero_trabajadores',
  })
  numeroTrabajadores: number;

  @Column({
    type: 'decimal',
    nullable: true,
    name: 'total_salarios',
    precision: 18,
    scale: 4,
  })
  totalSalarios: number;

  //porcentaje
  @Column({
    type: 'integer',
    nullable: true,
    name: 'tasa',
  })
  tasa: number;

  //id de la tabla tasa
  @Column({
    type: 'integer',
    nullable: true,
    name: 'id_tasa',
  })
  idTasa: number;

  @Column({
    type: 'decimal',
    nullable: true,
    name: 'cotizacion',
    precision: 18,
    scale: 4,
  })
  cotizacion: number;

  @Column({
    type: 'decimal',
    nullable: true,
    name: 'total_importe',
    precision: 18,
    scale: 4,
  })
  totalImporte: number;

  @Column({
    type: 'decimal',
    nullable: true,
    name: 'total_cancelar',
    precision: 18,
    scale: 4,
  })
  totalCancelar: number;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'forma_pago',
  })
  formaPago: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'liquidado_por',
  })
  liquidadoPor: string;
}
