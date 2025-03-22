import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagoAporte } from './entities/pagos-aporte.entity';
import * as fs from 'fs';
import { join } from 'path';
import { PlanillasAportesService } from '../planillas_aportes/planillas_aportes.service';

@Injectable()
export class PagosAportesService {
  constructor(
    @InjectRepository(PagoAporte)
    private readonly pagoAporteRepository: Repository<PagoAporte>,
    private planillasAportesService: PlanillasAportesService,
  ) {}

  // 1.- CREAR EN BASE DE DATOS EL PAGO Y ACTUALIZAR FECHA_PAGO EN PLANILLAS_APORTES
  async createPago(pagoData: Partial<PagoAporte>, file?: Express.Multer.File): Promise<PagoAporte> {
    const queryRunner = this.pagoAporteRepository.manager.connection.createQueryRunner();

    await queryRunner.startTransaction();
    try {
      let nuevoPago: PagoAporte;

      if (file) {
        const filePath = join('pagos-imagenes', file.filename);
        pagoData.foto_comprobante = filePath;
        console.log('Archivo guardado en:', filePath);
      }

      // Crear y guardar el nuevo pago
      nuevoPago = this.pagoAporteRepository.create(pagoData);
      await queryRunner.manager.save(nuevoPago);

      // Actualizar la fecha_pago en planillas_aportes
      const idPlanilla = pagoData.id_planilla_aportes;
      if (idPlanilla) {
        const fechaPago = pagoData.fecha_pago ? new Date(pagoData.fecha_pago) : new Date();
        await this.planillasAportesService.actualizarFechaPago(idPlanilla, fechaPago);
        // Recalcular los aportes con la fecha_pago real
        await this.planillasAportesService.calcularAportes(idPlanilla);
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
  // 2.- LISTAR TODOS LOS PAGOS
  async findAll() {
    try {
      const pagos = await this.pagoAporteRepository.find();
      return pagos;
    } catch (error) {
      throw new BadRequestException('Error al listar los pagos: ' + error.message);
    }
  }
  // 3.- LISTAR PAGOS PARA VISTA DE EMPLEADOR (ESTADO_ENVIO = 0 , ESTADO_ENVIO = 1) 
  async findByIdPlanilla(id_planilla_aportes: number) {
    try {
      const pagos = await this.pagoAporteRepository.find({
        where: { id_planilla_aportes },
      });
      return pagos;
    } catch (error) {
      throw new BadRequestException('Error al buscar pagos por id_planilla_aportes: ' + error.message);
    }
  }

  // 4.- LISTAR PAGOS PARA VISTA ADMINISTRADOR (ESTADO_ENVIO = 1)

  async findByIdPlanillAdmin(id_planilla_aportes: number) {
    try {
      const pagos = await this.pagoAporteRepository.find({
        where: { 
          id_planilla_aportes, 
          estado_envio: 1
         },
      });
      return pagos;
    } catch (error) {
      throw new BadRequestException('Error al buscar pagos por id_planilla_aportes: ' + error.message);
    }
  }


}