import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ToUpperCaseDecorator } from 'src/core/decorators/to-upper-case.decorator';

export class CreateSalarioMinimoDTO {
  @IsOptional()
  @MaxLength(4)
  @ApiProperty({
    description: 'gestion en la que promulga el salario minimo',
    example: 2023,
    type: String,
    required: true,
  })
  gestion?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'valor de salario minimo',
    example: 11,
    type: Number,
    required: true,
  })
  monto?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Estado de vigencia del salario minimo',
    example: true,
    type: Boolean,
    required: true,
  })
  vigente?: boolean;

  @ToUpperCaseDecorator
  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'descripcion del decreto con el que se promulga el salario minimo',
    example: 2010,
    type: String,
    required: true,
  })
  @MaxLength(255)
  observaciones?: string;
}
