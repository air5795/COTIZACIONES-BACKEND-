import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalarioMinimoService } from '../services/salario-minimo.service';
import { CreateSalarioMinimoDTO } from '../dto/salario-minimo.dto';

@ApiTags('Salario-Minimo')
@Controller('salario-minimo')
export class SalarioMinimoController {
  constructor(private salarioMinimoService: SalarioMinimoService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Crear el registro del salario minimo',
  })
  async create(@Body() createDto: CreateSalarioMinimoDTO) {
    return this.salarioMinimoService.create(createDto);
  }

  @Get('salario-minimo-vigente')
  @ApiOperation({
    summary: 'Obtener el salario minimo vigente',
  })
  async getSalarioMinimoVigente() {
    return this.salarioMinimoService.getSalarioMinimoVigente();
  }
}
