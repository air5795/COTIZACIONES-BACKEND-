import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsDate, IsString, IsNumber } from 'class-validator';

export class CreatePlanillaEmpresaDto {
 
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  periodo?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  gestion?: number;

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
    example: 'ESTADO_INICIALIZADO',
    type: String,
    required: false,
  })
  estadoPlanilla?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'registro del estado de afiliación del asegurado',
    example: 'ESTADO_NO_VERIFICADO, ESTADO_VERIFICADO, ESTADO_OBSERVADO',
    type: String,
    required: false,
  })
  estadoValidacionAfiliacion?: string;

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
export class UpdatePlanillaEmpresaDto extends PartialType(CreatePlanillaEmpresaDto) {}