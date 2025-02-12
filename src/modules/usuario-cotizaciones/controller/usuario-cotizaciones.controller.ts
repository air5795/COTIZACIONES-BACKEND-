import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsuarioCotizacionesService } from '../services/usuario-cotizaciones.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUsuarioCotizacionesDto } from '../dto/usuario-cotizaciones.dto';

@ApiTags('Usuario-Cotizaciones')
@Controller('usuario-cotizaciones')
export class UsuarioCotizacionesController {
  constructor(private usuarioCotizaciones: UsuarioCotizacionesService) {}

  @Get('buscar-usuario-cotizaciones/:idUsuario/:nomUsuario')
  @ApiOperation({
    summary: 'Insertar empresa por numero patronal - coneccion api externa ',
  })
  findUsuarioCotizaciones(
    @Param('idUsuario') idUsuario: number,
    @Param('nomUsuario') nomUsuario: string,
  ) {
    return this.usuarioCotizaciones.findUsuarioCotizaciones(
      idUsuario,
      nomUsuario,
    );
  }

  @Post('crear-usuario-cotizaciones')
  @ApiOperation({
    summary: 'Insertar usuario de cotizaciones',
  })
  createUsuarioCotizaciones(
    @Body() usuarioCotizacionesDto: CreateUsuarioCotizacionesDto,
  ) {
    return this.usuarioCotizaciones.createUsuarioCotizaciones(
      usuarioCotizacionesDto,
    );
  }
}
