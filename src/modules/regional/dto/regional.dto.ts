import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ToUpperCaseDecorator } from 'src/core/decorators/to-upper-case.decorator';

export class CreateRegionalDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'codigo que se toma de la base de datos de afiliaciones',
    example: 11,
    type: Number,
    required: true,
  })
  idRegional: number;

  @ToUpperCaseDecorator
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'nombre que debe tomarse de la base de datos afiliaciones',
    example: 'La Paz',
    type: String,
    required: true,
  })
  nombreRegional: string;
}
