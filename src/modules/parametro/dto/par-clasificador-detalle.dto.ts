
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ToUpperCaseDecorator } from 'src/core/decorators/to-upper-case.decorator';

export class CreateParClasificadorDetalleDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  @ApiProperty({
    description: `campo obligatorio - identificador clasificador`,
  })
  identificadorClasificador: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  @ApiProperty({
    description: `campo obligatorio - identificador clasificador detalle`,
  })
  identificadorClasificadorDetalle: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  @ApiProperty({
    description: `campo obligatorio - nombre clasificador detalle`,
  })
  nombreClasificadorDetalle: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  @ApiProperty({
    description: `campo obligatorio - descripcion clasificador detalle`,
  })
  descripcionClasificadorDetalle: string;

  @IsNotEmpty()
  @IsPositive()
  @Type(() => Number)
  @Expose()
  @ApiProperty({ description: `campo obligatorio - orden` })
  orden: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'se asigna de manera automatica no agregar datos',
  })
  usuarioRegistro: string;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'se asigna de manera automatica no agregar datos',
  })
  fechaRegistro?: Date;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'se asigna de manera automatica no agregar datos',
  })
  ipRegistro: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'se asigna de manera automatica no agregar datos',
  })
  bajaLogicaRegistro: boolean;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'se asigna de manera automatica no agregar datos',
  })
  fechaModificacion: Date;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'se asigna de manera automatica no agregar datos',
  })
  usuarioModificacion: string;
}

export class UpdateParClasificadorDetalleDto extends PartialType(
  CreateParClasificadorDetalleDto,
) {}
