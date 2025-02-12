import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUsuarioCotizacionesDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'id del usuario del sistema de seguridad',
    example: 11,
    type: Number,
    required: true,
  })
  idUsuario: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'nombre de usuario del sistema de seguridad',
    example: 'SORUCOGN2',
    type: String,
    required: true,
  })
  nomUsuario: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'nombre completo del sistema de seguridad ',
    example: 'NILO SORUCO GUERRERO',
    type: String,
    required: true,
  })
  nomCompleto: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'identificativo de la regional ',
    example: '11',
    type: String,
    required: false,
  })
  regional?: string | null;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'nombre de la emprea',
    example: '21-923-0002',
    type: String,
    required: false,
  })
  empNom?: string | null;
}
