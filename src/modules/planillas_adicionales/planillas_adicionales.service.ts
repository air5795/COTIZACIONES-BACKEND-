import { Injectable, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanillasAdicionale } from './entities/planillas_adicionale.entity';
import { PlanillaAdicionalDetalles } from './entities/planillas_adicionales_detalles.entity';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as carbone from 'carbone';

@Injectable()
export class PlanillasAdicionalesService {

    constructor(
      @InjectRepository(PlanillasAdicionale)
      private planillaRepo: Repository<PlanillasAdicionale>,
  
      @InjectRepository(PlanillaAdicionalDetalles)
      private detalleRepo: Repository<PlanillaAdicionalDetalles>,
    ) {}


// 1 .-  PROCESAR EXCEL PLANILLAS ADICIONALES -------------------------------------------------------------------------------------------------------
  procesarExcel(filePath: string) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];  
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!data.length) {
        throw new BadRequestException('El archivo Excel está vacío o tiene un formato incorrecto');
      }

      fs.unlinkSync(filePath);
      return data;
    } catch (error) {
      throw new BadRequestException('Error al procesar el archivo Excel');
    }
  }

// 2 .- GUARDAR PLANILLA ADICIONAL -------------------------------------------------------------------------------------------------------

async guardarPlanillaAdicional(id_planilla_aportes: number, data: any[], motivo_adicional: string) {
  const planillaOriginal = await this.planillaRepo.findOne({
    where: { id_planilla_aportes },
  });

  if (!planillaOriginal) {
    throw new BadRequestException('❌ La planilla original no existe.');
  }

  // Calcular el total_importe
  const totalImporte = data.reduce((sum, row) => {
    const sumaFila =
      parseFloat(row['Haber Básico'] || '0') +
      parseFloat(row['Bono de antigüedad'] || '0') +
      parseFloat(row['Monto horas extra'] || '0') +
      parseFloat(row['Monto horas extra nocturnas'] || '0') +
      parseFloat(row['Otros bonos y pagos'] || '0');
    return sum + sumaFila;
  }, 0);

  const totalTrabaj = data.length; 

  // Crear la planilla adicional
  const nuevaPlanillaAdicional = this.planillaRepo.create({
    id_planilla_aportes,
    total_importe: totalImporte,
    total_trabaj: totalTrabaj, 
    estado: 0, 
    motivo_adicional,
  });

  const planillaAdicionalGuardada = await this.planillaRepo.save(nuevaPlanillaAdicional);

  // Guardar los detalles
  const detalles = data.map((row) => ({
    id_planilla_adicional: planillaAdicionalGuardada.id_planilla_adicional,
    nro: row['Nro.'],
    ci: row['Número documento de identidad'],
    apellido_paterno: row['Apellido Paterno'],
    apellido_materno: row['Apellido Materno'],
    nombres: row['Nombres'],
    sexo: row['Sexo (M/F)'],
    cargo: row['Cargo'],
    fecha_nac: new Date(1900, 0, row['Fecha de nacimiento'] - 1),
    fecha_ingreso: new Date(1900, 0, row['Fecha de ingreso'] - 1),
    fecha_retiro: row['Fecha de retiro'] ? new Date(1900, 0, row['Fecha de retiro'] - 1) : null,
    dias_pagados: row['Días pagados'],
    haber_basico: parseFloat(row['Haber Básico'] || '0'),
    bono_antiguedad: parseFloat(row['Bono de antigüedad'] || '0'),
    monto_horas_extra: parseFloat(row['Monto horas extra'] || '0'),
    monto_horas_extra_nocturnas: parseFloat(row['Monto horas extra nocturnas'] || '0'),
    otros_bonos_pagos: parseFloat(row['Otros bonos y pagos'] || '0'),
    salario: (
      parseFloat(row['Haber Básico'] || '0') +
      parseFloat(row['Bono de antigüedad'] || '0') +
      parseFloat(row['Monto horas extra'] || '0') +
      parseFloat(row['Monto horas extra nocturnas'] || '0') +
      parseFloat(row['Otros bonos y pagos'] || '0')
    ) || 0,
    regional: row['regional'],
  }));

  await this.planillaRepo.save(detalles);

  return {
    mensaje: '✅ Planilla adicional guardada con éxito',
    id_planilla_adicional: planillaAdicionalGuardada.id_planilla_adicional,
  };
}



}
