import { Body, Controller, Get, Post } from '@nestjs/common';
import { TipoIncapacidadService } from '../services/tipo-incapacidad.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTipoIncapacidadDto } from '../dto/tipo-incapacidad.dto';

@ApiTags('Tipo-Incapacidad')
@Controller('tipo-incapacidad')
export class TipoIncapacidadController {
  constructor(private tipoIncapacidadService: TipoIncapacidadService) {}

  @Post('crear')
  @ApiOperation({
    summary: 'Crear un tipo de incapacidad',
  })
  async createTipoIncapacidad(
    @Body() tipoIncapacidad: CreateTipoIncapacidadDto,
  ) {
    return this.tipoIncapacidadService.createTipoIncapacidad(tipoIncapacidad);
  }

  @Get('listar')
  @ApiOperation({
    summary: 'Listar todos los tipos de incapacidad',
  })
  findAllTipoIncapacidad() {
    return this.tipoIncapacidadService.findAllTipoIncapacidad();
  }
}
