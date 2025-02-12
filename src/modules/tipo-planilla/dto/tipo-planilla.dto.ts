import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ToUpperCaseDecorator } from 'src/core/decorators/to-upper-case.decorator';

export class CreateTipoPlanillaDto {
  @ToUpperCaseDecorator
  @IsString()
  @ApiProperty({
    description: 'Nombre de la Planilla',
    example: 'Sueldos Empleados',
    type: String,
    required: true,
  })
  nombre?: string;

  @ToUpperCaseDecorator
  @IsString()
  @ApiProperty({
    description: 'Planilla de sueldo de empleados',
    example: 'planilla de sueldos de los empleados de planta',
    type: String,
    required: true,
  })
  descripcion?: string;

  @IsBoolean()
  @IsOptional() // Puedes optar por hacerlo opcional y usar un valor predeterminado en el servicio
  activo?: boolean;

  @IsInt()
  @IsOptional()
  userId: number; // Asumiendo que es un campo que debes proporcionar siempre, ya que no es nullable y no tiene un valor predeterminado diferente de 0

  @IsInt()
  @IsOptional() // Puedes hacerlo opcional y usar un valor predeterminado en el servicio
  idUsuarioMod?: number;
}
