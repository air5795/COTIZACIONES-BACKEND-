import { Injectable, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagosAportesAdicionale } from './entities/pagos-aportes-adicionale.entity';
import * as fs from 'fs';
import { join } from 'path';
import { PlanillasAdicionalesService } from '../planillas_adicionales/planillas_adicionales.service';
import { PlanillasAportesService } from '../planillas_aportes/planillas_aportes.service';
import * as moment from 'moment-timezone';
import * as path from 'path';
import { resolve } from 'path';
import * as carbone from 'carbone';
import { NumeroALetras } from 'numero-a-letras';
@Injectable()
export class PagosAportesAdicionalesService {
  constructor(
    @InjectRepository(PagosAportesAdicionale)
    private readonly pagoAporteAdicionalRepository: Repository<PagosAportesAdicionale>,
    private PlanillasAdicionalesService: PlanillasAdicionalesService,
    private PlanillasAportesService: PlanillasAportesService,

  ) {}

  // 1.- CREAR EN BASE DE DATOS EL PAGO Y ACTUALIZAR FECHA_PAGO EN PLANILLAS_ADICIONALES
async createPago(pagoData: Partial<PagosAportesAdicionale>, file?: Express.Multer.File): Promise<PagosAportesAdicionale> {
    const queryRunner = this.pagoAporteAdicionalRepository.manager.connection.createQueryRunner();

    await queryRunner.startTransaction();
    try {
      let nuevoPago: PagosAportesAdicionale;

      if (file) {
        const filePath = join('pagos-adicionales-imagenes', file.filename);
        pagoData.foto_comprobante = filePath;
        console.log('Archivo guardado en:', filePath);
      }

      // Crear y guardar el nuevo pago
      nuevoPago = this.pagoAporteAdicionalRepository.create(pagoData);
      await queryRunner.manager.save(nuevoPago);

      // Actualizar la fecha_pago en planillas_aportes
      const idPlanilla = pagoData.id_planilla_adicional;
      if (idPlanilla) {
        const fechaPago = pagoData.fecha_pago ? new Date(pagoData.fecha_pago) : new Date();
        await this.PlanillasAdicionalesService.actualizarFechaPagoAdicional(idPlanilla, fechaPago);
        // Recalcular los aportes con la fecha_pago real
        await this.PlanillasAdicionalesService.calcularAportes(idPlanilla);
      } else {
        throw new BadRequestException('El id_planilla_aportes es requerido.');
      }

      await queryRunner.commitTransaction();
      return nuevoPago;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (file && file.filename) {
        const filePath = join(process.cwd(), 'pagos-aportes', 'pagos', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      throw new BadRequestException('Error al crear el pago: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

    // 3.- LISTAR PAGOS PARA VISTA DE EMPLEADOR (ESTADO_ENVIO = 0 , ESTADO_ENVIO = 1) 
    async findByIdPlanilla(id_planilla_adicional: number) {
      try {
        const pagos = await this.pagoAporteAdicionalRepository.find({
          where: { id_planilla_adicional },
        });
        return pagos;
      } catch (error) {
        throw new BadRequestException('Error al buscar pagos por id_planilla_adicional: ' + error.message);
      }
    }
  
    // 4.- LISTAR PAGOS PARA VISTA ADMINISTRADOR (ESTADO_ENVIO = 1)
    async findByIdPlanillAdmin(id_planilla_adicional: number) {
      try {
        const pagos = await this.pagoAporteAdicionalRepository.find({
          where: { 
            id_planilla_adicional,
           },
        });
        return pagos;
      } catch (error) {
        throw new BadRequestException('Error al buscar pagos por id_planilla_adicional: ' + error.message);
      }
    }

// Función manual para convertir números a letras
private numeroALetrasSimple(num: number | string): string {
  // Convertir a número si es un string, y manejar casos inválidos
  const numero = typeof num === 'string' ? parseFloat(num) : num;

  // Validar que sea un número válido
  if (isNaN(numero) || numero === null || numero === undefined) {
    return 'CERO BOLIVIANOS';
  }

  const unidades = ['CERO', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = ['ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const [entero, decimal] = numero.toFixed(2).split('.').map(Number);

  const convertirMenorAMil = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return unidades[n];
    if (n < 20) return n === 10 ? 'DIEZ' : especiales[n - 11];
    if (n < 100) {
      const decena = Math.floor(n / 10);
      const unidad = n % 10;
      return unidad === 0 ? decenas[decena - 1] : `${decenas[decena - 1]} Y ${unidades[unidad]}`;
    }
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    if (resto === 0) return centenas[centena - 1];
    if (n === 100) return 'CIEN';
    return `${centenas[centena - 1]} ${convertirMenorAMil(resto)}`;
  };

  const convertir = (n: number): string => {
    if (n === 0) return 'CERO';
    if (n < 1000) return convertirMenorAMil(n);
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const milesTexto = miles === 1 ? 'MIL' : `${convertirMenorAMil(miles)} MIL`;
    return resto === 0 ? milesTexto : `${milesTexto} ${convertirMenorAMil(resto)}`;
  };

  const enteroTexto = convertir(entero);
  const decimalTexto = decimal > 0 ? `CON ${decimal}/100` : 'EXACTOS';
  return `${enteroTexto} ${decimalTexto} BOLIVIANOS`;
}

async generarReportePagoAporteAdicional(idPlanillaAdicional: number): Promise<StreamableFile> {
  try {
    // Obtener el pago de la tabla pagos_aportes_adicionales
    const pago = await this.pagoAporteAdicionalRepository.findOne({
      where: { id_planilla_adicional: idPlanillaAdicional },
    });

    if (!pago) {
      throw new Error('Pago adicional no encontrado');
    }

    // Obtener los datos de la planilla_adicional para obtener el id_planilla_aportes
    const planillaAdicional = await this.PlanillasAdicionalesService.obtenerPlanillaAdicional(idPlanillaAdicional);
    if (!planillaAdicional || !planillaAdicional.planilla) {
      throw new Error('No se encontró la planilla adicional relacionada');
    }

    // Obtener los datos de la planilla_aportes para obtener la empresa
    const planillaAporte = await this.PlanillasAportesService.obtenerPlanilla(planillaAdicional.planilla.id_planilla_aportes);
    if (!planillaAporte || !planillaAporte.planilla) {
      throw new Error('No se encontró la planilla de aportes relacionada para obtener la empresa');
    }

    // Configurar moment para español
    moment.locale('es');

    // Asegurarnos de que monto_pagado sea un número
    const montoPagado = typeof pago.monto_pagado === 'string' ? parseFloat(pago.monto_pagado) : pago.monto_pagado;
    if (isNaN(montoPagado)) {
      throw new Error('El monto_pagado no es un valor numérico válido');
    }

    // Formatear el monto_pagado a literal usando la función manual
    const montoLiteral = this.numeroALetrasSimple(montoPagado);

    // Formatear los valores numéricos
    const formatNumber = (num: number) =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);

    // Preparar los datos para el reporte
    const data = {
      pago: {
        fecha_pago: moment(pago.fecha_pago).format('DD/MM/YYYY'),
        empresa: planillaAporte.planilla.empresa,
        monto_pagado: formatNumber(montoPagado),
        monto_pagado_literal: montoLiteral,
        observaciones: pago.observaciones || 'Sin observaciones',
      },
    };

    console.log('Datos para el reporte de pago adicional:', JSON.stringify(data, null, 2));

    // Ruta de la plantilla de Carbone
    const templatePath = path.resolve(
      'src/modules/pagos-aportes-adicionales/templates/recibo.docx',
    );

    // Verificar si la plantilla existe
    if (!fs.existsSync(templatePath)) {
      throw new Error(`La plantilla en ${templatePath} no existe`);
    }

    return new Promise<StreamableFile>((resolve, reject) => {
      carbone.render(
        templatePath,
        data,
        { convertTo: 'pdf' },
        (err, result) => {
          if (err) {
            console.error('Error en Carbone:', err);
            return reject(new Error(`Error al generar el reporte con Carbone: ${err}`));
          }

          console.log('Reporte de recibo de pago adicional generado correctamente');

          if (typeof result === 'string') {
            result = Buffer.from(result, 'utf-8');
          }

          resolve(
            new StreamableFile(result, {
              type: 'application/pdf',
              disposition: `attachment; filename=recibo_pago_adicional_${idPlanillaAdicional}.pdf`,
            }),
          );
        },
      );
    });
  } catch (error) {
    throw new Error('Error en generarReportePagoAporteAdicional: ' + error.message);
  }
}











}
