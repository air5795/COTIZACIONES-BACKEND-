import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TasaInteresAporteService } from '../services/tasa-interes-aporte.service';
import { CreateTasaInteresDTO } from '../dto/tasa-interes-aporte.dto';

@ApiTags('Tasa-Interes-Aporte')
@Controller('tasa-interes-aporte')
export class TasaInteresAporteController {
  constructor(private tasaInteresAporteService: TasaInteresAporteService) {}

  @Get('tasa-interes-vigente')
  @ApiOperation({
    summary: 'Retorna la tasa de interes vigente',
  })
  async findTazaInteresVigente() {
    return this.tasaInteresAporteService.findTazaInteresVigente();
  }

  @Post('create')
  @ApiOperation({
    summary: 'Crear el registro de la tasa de interes de aporte',
  })
  async create(@Body() createDto: CreateTasaInteresDTO) {
    return this.tasaInteresAporteService.create(createDto);
  }
}
