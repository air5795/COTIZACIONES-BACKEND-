import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsDate, IsString, IsNumber } from 'class-validator';

export class CreatePlanillaDto {
  @IsInt()
  @ApiProperty({
    description: 'Id que refiere de la tabla tipo planilla',
    example: '1',
    type: Number,
    required: true,
  })
  idTipoPlanilla: number; //TODO:Relacion con la Tabla TipoPlanilla

  @IsInt()
  @ApiProperty({
    description: 'Id que refiere a la planilla de la empresa',
    example: '1',
    type: Number,
    required: true,
  })
  idPlanillaEmpresa: number;

  @IsOptional()
  @ApiProperty({
    description: 'Material titular de asegurador',
    required: false,
  })
  aseMatTit?: string;

  @IsOptional()
  @ApiProperty({ description: 'CI de asegurador', required: false })
  aseCi?: number;

  @IsOptional()
  @ApiProperty({ description: 'Comentario CI de asegurador', required: false })
  aseCiCom?: string | null;

  @IsOptional()
  @ApiProperty({
    description: 'Apellido paterno de asegurador',
    required: false,
  })
  aseApat?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Apellido materno de asegurador',
    required: false,
  })
  aseAmat?: string;

  @IsOptional()
  @ApiProperty({ description: 'Nombre de asegurador', required: false })
  aseNom?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Fecha de nacimiento de asegurador',
    required: false,
  })
  aseFecNac?: Date;

  @IsInt()
  @ApiProperty({
    description: 'indicar el numero de dias trabajados', //TODO: preguntar si puede tener decimales
    example: '30',
    type: Number,
    required: true,
  })
  diasTrabajados: number;

  @IsString()
  @ApiProperty({
    description:
      'Se obtiene de la tabla empleado que migra de afiliaciones, no se puede editar',
    example: 'REPARTIDOR',
    type: String,
    required: true,
  })
  cargo: string;

  @IsDate()
  @ApiProperty({
    description: 'se obtiene de la tabla empleado que migra de afiliaciones',
    example: '12/06/2023',
    type: Date,
    required: true,
  })
  fechaIngreso: Date;

  @IsDate()
  @ApiProperty({
    description:
      'se obtiene de la tabla empleado que migra de afiliaciones no se puede editar',
    example: '12/06/2023',
    type: Date,
    required: true,
  })
  fechaRetiro?: Date;

  @IsNumber()
  @ApiProperty({
    description: 'total ganado no puede ser menor a un minimo nacional', //TODO: preguntar si puede tener decimales
    example: '5000',
    type: Number,
    required: true,
  })
  totalGanado?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @ApiProperty({
    description:
      'descuento del 10% oh como lo calcule la tabla taza interes de aporte', //TODO: preguntar si puede tener decimales
    example: '600',
    type: Number,
    required: true,
  })
  totalDescuento: number;

  @IsDate()
  @ApiProperty({
    description:
      'se obtiene de la tabla empleado que migra de afiliaciones no se puede editar',
    example: '12/06/2023',
    type: Date,
    required: true,
  })
  fecha: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'registro de alguna observacion que se tenga sobre la planilla',
    example: 'Observacion',
    type: String,
    required: false,
  })
  observaciones?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'por defecto es falso mientras el usuario de cotizaciones no autorice la planilla',
    example: 'INICIALIZADO',
    type: String,
    required: false,
  })
  aprobado?: string;

  @IsDate()
  @IsOptional()
  @ApiProperty({
    description:
      'fecha en la que el usuario de cotizaciones aprueba la planilla',
    example: '12/06/2023',
    type: Date,
    required: false,
  })
  fechaAprobacion?: Date;

  @IsInt()
  @IsOptional()
  aprobadoPor?: number;

  @IsInt()
  @IsOptional()
  idTasa?: number;

  @IsInt()
  @IsOptional()
  idSalarioMinimo?: number;

  @IsInt()
  @IsOptional()
  idEmpleado?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  gestion?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  periodo?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'registro de código de empleador',
    example: '97-130-001',
    type: String,
    required: false,
  })
  empNpatronal?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'registro del estado de validación del asegurado',
    example: 'ESTADO_NO_VERIFICADO',
    type: String,
    required: false,
  })
  estadoRegistro?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'registro del estado de afiliación del asegurado',
    example: 'VIGENTE, CESANTIA',
    type: String,
    required: false,
  })
  estadoAfiliacion?: string;

  @IsDate()
  @IsOptional()
  @ApiProperty({
    description:
      'fecha de modificación de los datos de la planilla',
    example: '12/06/2023',
    type: Date,
    required: false,
  })
  updatedAt?: Date;
}
export class UpdatePlanillaDto extends PartialType(CreatePlanillaDto) {}

export class UpdatePlanillaMasivaDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  idPlanilla: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idTipoPlanilla?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  diasTrabajados?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaIngreso?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaRetiro?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalGanado?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalDescuento?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  fecha?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  aprobado?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  fechaAprobacion?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  aprobadoPor?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  gestion?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  periodo?: number;
}
