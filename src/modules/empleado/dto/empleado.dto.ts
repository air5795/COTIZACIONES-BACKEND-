import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ToUpperCaseDecorator } from '../../../core/decorators/to-upper-case.decorator';

export class CreateEmpleadoDto {
  @IsOptional()
  @ApiProperty({ description: 'Número de afiliado', required: false })
  afiNro?: number;

  @IsOptional()
  @ApiProperty({ description: 'Número de CA', required: false })
  caNro?: number;

  @IsOptional()
  @ApiProperty({ description: 'Código de asegurador', required: false })
  aseCod?: number;

  @IsOptional()
  @ApiProperty({
    description: 'Material titular de asegurador',
    required: false,
  })
  aseMatTit?: string;

  @IsOptional()
  @ApiProperty({ description: 'Material de asegurador', required: false })
  aseMat?: string;

  @IsOptional()
  @ApiProperty({ description: 'CI titular de asegurador', required: false })
  aseCiTit?: string;

  @IsOptional()
  @ApiProperty({ description: 'Tipo de documento titular', required: false })
  tipoDocumentoTit?: string;

  @IsOptional()
  @ApiProperty({ description: 'CI de asegurador', required: false })
  aseCi?: number;

  @IsOptional()
  @ApiProperty({ description: 'Comentario CI de asegurador', required: false })
  aseCiCom?: string | null;

  @IsOptional()
  @ApiProperty({ description: 'CI externo de asegurador', required: false })
  aseCiext?: string;

  @IsOptional()
  @ApiProperty({ description: 'Tipo de documento', required: false })
  tipoDocumento?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Apellido paterno de asegurador',
    required: false,
  })
  aseApat?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Apellido materno de asegurador',
    required: false,
  })
  aseAmat?: string;

  @IsOptional()
  @ApiProperty({ description: 'Nombre de asegurador', required: false })
  aseNom?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Lugar de nacimiento de asegurador',
    required: false,
  })
  aseLugNac?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Fecha de nacimiento de asegurador',
    required: false,
  })
  aseFecNac?: Date;

  @IsOptional()
  @ApiProperty({ description: 'Edad de asegurador', required: false })
  aseEdad?: number;

  @IsOptional()
  @ApiProperty({ description: 'Sexo de asegurador', required: false })
  aseSexo?: string;

  @IsOptional()
  @ApiProperty({ description: 'Estado civil de asegurador', required: false })
  aseEcivil?: string;

  @IsOptional()
  @ApiProperty({ description: 'Calle de asegurador', required: false })
  aseCalle?: string;

  @IsOptional()
  @ApiProperty({ description: 'Número de casa de asegurador', required: false })
  aseNum?: string;

  @IsOptional()
  @ApiProperty({ description: 'Zona de asegurador', required: false })
  aseZona?: string;

  @IsOptional()
  @ApiProperty({ description: 'Localidad de asegurador', required: false })
  aseLocalidad?: string;

  @IsOptional()
  @ApiProperty({ description: 'Teléfono de asegurador', required: false })
  aseTelf?: string;

  @IsOptional()
  @ApiProperty({ description: 'Profesión de asegurador', required: false })
  aseProfesion?: string;

  @IsOptional()
  @ApiProperty({ description: 'Cargo de asegurador', required: false })
  aseCargo?: string;

  @IsOptional()
  @ApiProperty({ description: 'Haber de asegurador', required: false })
  aseHaber?: number;

  @IsOptional()
  @ApiProperty({ description: 'Número patronal de empresa', required: false })
  empNpatronal?: string;

  @IsOptional()
  @ApiProperty({ description: 'Nombre de empresa', required: false })
  empNom?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Fecha de inicio en la empresa',
    required: false,
  })
  aseFiniEmp?: Date;

  @IsOptional()
  @ApiProperty({ description: 'Lugar de asegurador', required: false })
  aseLugar?: string;

  @IsOptional()
  @ApiProperty({ description: 'Fecha de afiliación', required: false })
  aseFecAfi?: Date;

  @IsOptional()
  @ApiProperty({ description: 'Tipo de asegurador', required: false })
  aseTipo?: string;

  @IsOptional()
  @ApiProperty({ description: 'Estado de asegurador', required: false })
  aseEstado?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Condición estatal de asegurador',
    required: false,
  })
  aseCondEst?: string;

  @IsOptional()
  @ApiProperty({ description: 'Código tipo de asegurador', required: false })
  aseTipoCod?: number;

  @IsOptional()
  @ApiProperty({ description: 'Tipo de asegurado', required: false })
  aseTipoAsegurado?: string;

  @IsOptional()
  @ApiProperty({ description: 'Observaciones de asegurador', required: false })
  aseObs?: string | null;

  @IsOptional()
  @ApiProperty({ description: 'Estudio de asegurador', required: false })
  aseEstudio?: string | null;

  @ApiProperty({ description: 'Documentación de asegurador', required: false })
  aseDocu?: string | null;

  @IsOptional()
  @ApiProperty({ description: 'Código de par', required: false })
  parCod?: number;

  @IsOptional()
  @ApiProperty({ description: 'Descripción de par', required: false })
  parDesc?: string;

  @IsOptional()
  @ApiProperty({ description: 'Orden de par', required: false })
  parOrden?: number;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Validación para afiliaciones', required: false })
  validadoAfiliaciones?: boolean;
}export class UpdateEmpleadoDto extends PartialType(CreateEmpleadoDto) {}

export class CreateEmpleadoNoVerificado {
  @IsOptional()
  @ApiProperty({ description: 'CI de asegurador', required: false })
  aseCi?: number;

  @IsOptional()
  @ApiProperty({ description: 'Nombre de asegurador', required: false })
  aseNom?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Apellido paterno de asegurador',
    required: false,
  })
  aseApat?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Apellido materno de asegurador',
    required: false,
  })
  aseAmat?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Fecha de nacimiento de asegurador',
    required: false,
  })
  aseFecNac?: Date;

  @IsOptional()
  @ApiProperty({
    description: 'Fecha de inicio en la empresa',
    required: false,
  })
  aseFiniEmp?: Date;

  @ToUpperCaseDecorator
  @IsOptional()
  @ApiProperty({ description: 'Cargo de asegurador', required: false })
  aseCargo?: string;

  @IsOptional()
  @ApiProperty({ description: 'Haber de asegurador', required: false })
  aseHaber?: number;

  @IsOptional()
  @ApiProperty({ description: 'Sexo de asegurador', required: false })
  aseSexo?: string;

  @IsOptional()
  @ApiProperty({ description: 'Complemento CI del asegurado', required: false })
  aseCiCom?: string | null;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Lugar de Expedicón del Carnet del Asegurado', required: false })
  aseCiext?: string | null;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Validación datos Segip', required: false })
  validadoSegip?: boolean;

  @IsOptional()
  @ApiProperty({ description: 'Numero patronal de la empresa', required: false })
  empNpatronal?: string;
}
