// cotizaciones-backend/pagos-aportes/pagos-aportes.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagoAporte } from './entities/pagos-aporte.entity';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class PagosAportesService {
  constructor(
    @InjectRepository(PagoAporte)
    private readonly pagoAporteRepository: Repository<PagoAporte>,
  ) {}

  // 1.- CREAR EN BASE DE DATOS EL PAGO Y TAMBIEN LA IMAGEN DEL COMPROBANTE ------------------------------------------
  async createPago(pagoData: any, file?: Express.Multer.File) {
    try {
      if (file) {
        const filePath = file.filename;
        pagoData.foto_comprobante = filePath; 
        console.log('Archivo guardado en:', filePath); 
      }

      const nuevoPago = this.pagoAporteRepository.create(pagoData);
      return await this.pagoAporteRepository.save(nuevoPago);
    } catch (error) {
      if (file && file.filename) {
        const filePath = join(process.cwd(), 'pagos-aportes', 'pagos', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Eliminar el archivo si existe
        }
      }
      throw new BadRequestException('Error al crear el pago: ' + error.message);
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

  // 3.- LISTAR PAGOS POR ID_PLANILLA_APORTES
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


}