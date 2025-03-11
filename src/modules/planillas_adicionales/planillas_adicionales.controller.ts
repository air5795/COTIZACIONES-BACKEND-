import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Body, Param, HttpException, HttpStatus, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PlanillasAdicionalesService } from './planillas_adicionales.service';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Planillas Adicionales')
@Controller('planillas_adicionales')
export class PlanillasAdicionalesController {
  constructor(private readonly planillasAdicionalesService: PlanillasAdicionalesService) {}

  // 1. Endpoint para subir un archivo Excel con la planilla adicional
  @Post('subir/:id_planilla_aportes')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
          return cb(new BadRequestException('Solo se permiten archivos Excel y CSV'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('id_planilla_aportes') id_planilla_aportes: number,
    @Body() body: { motivo_adicional: string },
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    if (!body.motivo_adicional || body.motivo_adicional.trim() === '') {
      throw new BadRequestException('El motivo adicional es obligatorio');
    }

    const data = this.planillasAdicionalesService.procesarExcel(file.path);
    return this.planillasAdicionalesService.guardarPlanillaAdicional(id_planilla_aportes, data, body.motivo_adicional);
  }
}