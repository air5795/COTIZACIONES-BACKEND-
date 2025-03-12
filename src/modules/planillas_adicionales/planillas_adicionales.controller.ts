import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Body, Param, HttpException, HttpStatus, Res, Put, Get, Query, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PlanillasAdicionalesService } from './planillas_adicionales.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Planillas Adicionales')
@Controller('planillas_adicionales')
export class PlanillasAdicionalesController {
  constructor(
    private readonly planillasAdicionalesService: PlanillasAdicionalesService,
  ) {}

  // 1. Endpoint para subir un archivo Excel con la planilla adicional --------------------------------------------------------------
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
          return cb(
            new BadRequestException('Solo se permiten archivos Excel y CSV'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  // 2. Método para subir un archivo Excel con la planilla adicional -----------------------------------------------------------------
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
    return this.planillasAdicionalesService.guardarPlanillaAdicional(
      id_planilla_aportes,
      data,
      body.motivo_adicional,
    );
  }

  // 3. ACTUALIZAR DETALLES DE PLANILLA ADICIONAL -------------------------------------------------------------------------------------
  @Put('detalles/:id_planilla_adicional')
  async actualizarDetallesPlanillaAdicional(
    @Param('id_planilla_adicional') id_planilla_adicional: number,
    @Body() body,
  ) {
    try {
      return await this.planillasAdicionalesService.actualizarDetallesPlanillaAdicional(
        id_planilla_adicional,
        body.trabajadores,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 4.-  OBTENER HISTORIAL DE TABLA PLANILLAS ADICIONALES ----------------------------------------------------------------------------
  @Get('historial/:id_planilla_aportes')
  @ApiQuery({
    name: 'busqueda',
    required: false,
    type: String,
    description: 'Término de búsqueda (opcional)',
  })
  @ApiQuery({
    name: 'mes',
    required: false,
    type: String,
    description: 'Término de búsqueda (opcional)',
  })
  @ApiQuery({
    name: 'anio',
    required: false,
    type: String,
    description: 'Término de búsqueda (opcional)',
  })
  async obtenerHistorialAdicional(
    @Param('id_planilla_aportes') id_planilla_aportes: number,
    @Query('pagina') pagina: number = 1,
    @Query('limite') limite: number = 10,
    @Query('busqueda') busqueda: string = '',
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ) {
    try {
      return await this.planillasAdicionalesService.obtenerHistorialAdicional(
        id_planilla_aportes,
        pagina,
        limite,
        busqueda,
        mes,
        anio,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al obtener el historial de planillas adicionales',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

   // 5.- OBTENER HISTORIAL DE TABLA PLANILLAS ADICIONALES CUANDO ESTADO = 1 (presentadas)-------------------------------------------
  @Get('historial')
  async obtenerTodoHistorialAdicional() {
    try {
      return await this.planillasAdicionalesService.obtenerTodoHistorialAdicional();
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al obtener el historial de planillas adicionales',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 6.- OBTENER HISTORIAL TOTAL DE TABLA PLANILLAS ADICIONALES -----------------------------------------------------------------------------------
  @Get('historial-completo')
  @ApiQuery({
    name: 'busqueda',
    required: false,
    type: String,
    description: 'Término de búsqueda (opcional)',
  })
  async obtenerTodoAdicional(
    @Query('pagina') pagina: number = 1,
    @Query('limite') limite: number = 10,
    @Query('busqueda') busqueda: string = '',
  ) {
    try {
      return await this.planillasAdicionalesService.obtenerTodoAdicional(
        pagina,
        limite,
        busqueda,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al obtener el historial de planillas adicionales completo sin estados',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 7 .- OBTENER PLANILLA DE ADICIONAL POR ID (ASINCRONO SIN PAGINACION) ----------------------------------
  @Get(':id_planilla_adicional')
async obtenerPlanillaAdicional(@Param('id_planilla_adicional') id_planilla_adicional: number) {
  try {
    return await this.planillasAdicionalesService.obtenerPlanillaAdicional(id_planilla_adicional);
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: error.message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
// 8.- OBTENER DETALLES DE PLANILLAS ADICIONALES POR ID DE PLANILLA (TIENE PAGINACION Y BUSQUEDA)-------------------------------------------------------------------------------------------------------
@Get('detalles/:id_planilla_adicional')
@ApiQuery({
  name: 'busqueda',
  required: false,
  type: String,
  description: 'Término de búsqueda (opcional)',
})
async obtenerDetallesAdicional(
  @Param('id_planilla_adicional') id_planilla_adicional: number,
  @Query('pagina') pagina: number = 1,
  @Query('limite') limite: number = 10,
  @Query('busqueda') busqueda: string = '',
) {
  try {
    return await this.planillasAdicionalesService.obtenerDetallesAdicional(
      id_planilla_adicional,
      pagina,
      limite,
      busqueda,
    );
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al obtener los detalles de la planilla adicional',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// 9.- OBTENER DETALLES DE PLANILLAS ADICIONALES  POR REGIONAL-------------------------------------------------------------------------------------------------------
@Get('detalles/:id_planilla_adicional/:regional')
async obtenerDetallesPorRegionalAdicional(
  @Param('id_planilla_adicional') id_planilla_adicional: number,
  @Param('regional') regional: string,
) {
  try {
    return await this.planillasAdicionalesService.obtenerDetallesPorRegionalAdicional(
      id_planilla_adicional,
      regional,
    );
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al obtener los detalles de la planilla adicional por regional',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// 10.- OBTENER PLANILLAS ADICIONALES PENDIENTES O PRESENTADAS ESTADO = 1-------------------------------------------------------------------------------------------------------
@Get('pendientes')
async obtenerPlanillasPendientesAdicional() {
  try {
    return await this.planillasAdicionalesService.obtenerPlanillasPendientesAdicional();
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al obtener las planillas adicionales pendientes',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// 11 .- ACTUALIZAR EL ESTADO DE UNA PLANILLA ADICIONAL A PRESENTADO O PENDIENTE = 1 -------------------------------------------------------------------------------------------------------
@Put('estado/pendiente/:id_planilla_adicional')
async actualizarEstadoAPendienteAdicional(@Param('id_planilla_adicional') id_planilla_adicional: number) {
  try {
    return await this.planillasAdicionalesService.actualizarEstadoAPendienteAdicional(id_planilla_adicional);
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: error.message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

// 12 .- ACTUALIZAR PLANILLA PARA APROBAR U OBSERVAR LA PLANILLA (ESTADO 2 o 3) -------------------------------------------------------------------------------------------------------
@Put('estado/:id_planilla_adicional')
async actualizarEstadoPlanillaAdicional(
  @Param('id_planilla_adicional') id_planilla_adicional: number,
  @Body() body,
) {
  try {
    return await this.planillasAdicionalesService.actualizarEstadoPlanillaAdicional(
      id_planilla_adicional,
      body.estado,
      body.observaciones,
    );
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: error.message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

// 13.- ELIMINAR DETALLES DE UNA PLANILLA DE APORTES -------------------------------------------------------------------------------------------------------
@Delete('detalles/:id_planilla_adicional')
async eliminarDetallesPlanillaAdicional(@Param('id_planilla_adicional') id_planilla_adicional: number) {
  try {
    return await this.planillasAdicionalesService.eliminarDetallesPlanillaAdicional(
      id_planilla_adicional,
    );
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: error.message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

// 14 .- OBTENER PLANILLAS DE APORTES OBSERVADAS (ESTADO = 3) -------------------------------------------------------------------------------------------------------
@Get('observadas/:cod_patronal')
async obtenerPlanillasAdicionalesObservadas(
  @Param('cod_patronal') cod_patronal: string,
) {
  try {
    return await this.planillasAdicionalesService.obtenerPlanillasAdicionalesObservadas(
      cod_patronal,
    );
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: error.message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}












}