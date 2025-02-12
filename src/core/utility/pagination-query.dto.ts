import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({ description: 'Número de página actual', default: 10 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  limit: number;

  @ApiProperty({ description: 'Cantidad de ítems por página', default: 1 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  offset: number;
}
