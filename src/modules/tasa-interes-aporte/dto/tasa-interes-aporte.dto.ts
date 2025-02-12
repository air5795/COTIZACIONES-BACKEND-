import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ToUpperCaseDecorator } from 'src/core/decorators/to-upper-case.decorator';

export class CreateTasaInteresDTO {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'valor en numero de entero para la tasa de interes de aporte',
    example: 11,
    type: Number,
    required: true,
  })
  valor: number;

  //valor del porcentaje para la tasa de interes de aporte no ingresar de forma manual se genera autumaticamente
  @IsNumber()
  @IsOptional()
  @ApiHideProperty()
  porcentaje?: number;

  //TODO:establece que el valor de la tasa de interes de aporte es vigente, se agrega automaticamente
  @IsOptional()
  @IsBoolean()
  @ApiHideProperty()
  vigente?: boolean;

  @ToUpperCaseDecorator
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @ApiProperty({
    description: 'nombre que debe tomarse de la base de datos afiliaciones',
    example: 'La Paz',
    type: String,
    required: true,
  })
  observaciones?: string;
}
