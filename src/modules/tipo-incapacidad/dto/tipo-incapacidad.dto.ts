import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ToUpperCaseDecorator } from 'src/core/decorators/to-upper-case.decorator';

export class CreateTipoIncapacidadDto {
  @ToUpperCaseDecorator
  @IsString()
  @ApiProperty({
    description: 'nombre del tipo de incapacidad',
    example: 'Enfermedad Comun',
    type: String,
    required: true,
  })
  nombre: string;

  @ApiProperty({
    description: 'Porcentaje de la incapacidad',
    example: '75',
    type: Number,
    required: true,
  })
  porcentaje: number;

  @IsOptional()
  @ApiProperty()
  porcentajeDecimal: number;

  @ToUpperCaseDecorator
  @IsString()
  @ApiProperty({
    description: 'describir el decretado de la incapacidad',
    example: 'Decreto supremo etc..',
    type: String,
    required: true,
  })
  descripcion: string;

  @IsOptional()
  @ApiProperty()
  diasDiferencia: number;

  @IsOptional()
  @ApiProperty()
  diasCbes: number;
}
