import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateReporteMensualDto {
  @ApiProperty()
  @IsNumber()
  idRegional: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  razonSocial: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  domicilioLegal: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  telefono: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  numeroPatronal: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nit: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  periodo: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  gestion: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  numeroTrabajadores: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalSalarios: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  tasa: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  idTasa: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  cotizacion: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalImporte: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalCancelar: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  formaPago: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  liquidadoPor: string;
}
