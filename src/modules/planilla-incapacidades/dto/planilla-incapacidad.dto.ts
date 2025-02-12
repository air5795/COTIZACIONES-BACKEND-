import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreatePlanillaIncapacidadDto {
  @ApiProperty({ description: 'Número de matrícula' })
  @IsString()
  matricula: string;

  @ApiProperty({ description: 'Nombre completo' })
  @IsString()
  nombreCompleto: string;

  @ApiProperty({
    description: 'Inicio de la baja médica',
    type: String,
    format: 'date',
  })
  @IsDateString()
  bajaMedicaIni: string;

  @ApiProperty({
    description: 'Fin de la baja médica',
    type: String,
    format: 'date',
  })
  @IsDateString()
  bajaMedicaFin: string;

  @ApiProperty({ description: 'Días de incapacidad inicial' })
  @IsNumber()
  diasIncapacidadInicial: number;

  @ApiProperty({ description: 'Día' })
  @IsNumber()
  dia: number;

  @ApiProperty({ description: 'Total ganado mensual' })
  @IsNumber()
  totalGanadoMensual: number;

  @ApiProperty({ description: 'Total por día', required: false })
  @IsOptional()
  @IsNumber()
  totalDia?: number;

  @ApiProperty({ description: 'Total' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Observaciones', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ description: 'ID del tipo de incapacidad', required: false })
  @IsOptional()
  @IsNumber()
  idTipoIncapacidad?: number;

  @ApiProperty({ description: 'ID del empleado', required: false })
  @IsOptional()
  @IsNumber()
  idEmpleado?: number;

  @ApiProperty({
    description: 'Fecha de cotización desde',
    type: String,
    format: 'date',
  })
  @IsDateString()
  fechaCotizacionDel: string;

  @ApiProperty({
    description: 'Fecha de cotización hasta',
    type: String,
    format: 'date',
  })
  @IsDateString()
  fechaCotizacionAl: string;

  @ApiProperty({ description: 'Día CBES' })
  @IsNumber()
  diaCbes: number;

  @ApiProperty({ description: 'Total porcentaje a cubrir' })
  @IsNumber()
  totalPorcentajeCubrir: number;

  @ApiProperty({ description: 'Numero patronal de la empresa asegurada', required: false })
  @IsOptional()
  @IsString()
  empNpatronal?: string;
}
