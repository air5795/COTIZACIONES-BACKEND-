import { Controller, Post, Body, UploadedFile, UseInterceptors, BadRequestException, Get, Param } from '@nestjs/common';
import { PagosAportesService } from './pagos-aportes.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Pagos-aportes')
@Controller('pagos-aportes')
export class PagosAportesController {
  constructor(private readonly pagosAportesService: PagosAportesService) {}

  // 1.- CREAR EN BASE DE DATOS EL PAGO Y TAMBIEN LA IMAGEN DEL COMPROBANTE ------------------------------------------
  @Post('create')
  @UseInterceptors(FileInterceptor('foto_comprobante'))
  async createPago(
    @Body() pagoData: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      console.error('No se recibió ningún archivo');
      throw new BadRequestException('No se subió ningún archivo');
    }
    console.log('Archivo procesado:', file.filename);
    return await this.pagosAportesService.createPago(pagoData, file);
  }

  // 2.- LISTAR TODOS LOS PAGOS
  @Get()
  async findAll() {
    return await this.pagosAportesService.findAll();
  }

  // 3.- LISTAR PAGOS POR ID_PLANILLA_APORTES
  @Get('by-id/:id')
  async findByIdPlanilla(@Param('id') id: number) {
    return await this.pagosAportesService.findByIdPlanilla(id);
  }


}
