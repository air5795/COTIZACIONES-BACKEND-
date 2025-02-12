import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { PlanillasAporte } from './entities/planillas_aporte.entity';
import { PlanillaAportesDetalles } from './entities/planillas_aportes_detalles.entity';

@Injectable()
export class PlanillasAportesService {
  constructor(
    @InjectRepository(PlanillasAporte)
    private planillaRepo: Repository<PlanillasAporte>,

    @InjectRepository(PlanillaAportesDetalles)
    private detalleRepo: Repository<PlanillaAportesDetalles>,
  ) {}

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

  async guardarPlanilla(data: any[], cod_patronal: string, mes: string, gestion: string) {
    // Verificar si ya existe una planilla con el mismo cod_patronal, mes y gestión
    const existePlanilla = await this.planillaRepo.findOne({
        where: { cod_patronal, mes, gestion }
    });

    if (existePlanilla) {
        throw new BadRequestException('❌ Ya existe una planilla para este mes y gestión.');
    }

    // Calcular el total del importe sumando los salarios
    const totalImporte = data.reduce((sum, row) => sum + parseFloat(row['Haber Básico'] || 0), 0);

    // Calcular el número total de trabajadores (n_trabaj)
    const totalTrabaj = data.length;

    // Guardar la cabecera de la planilla
    const nuevaPlanilla = this.planillaRepo.create({
        cod_patronal,
        mes,
        gestion,
        total_importe: totalImporte,
        total_trabaj: totalTrabaj,
        estado: 1, // Pendiente
    });

    const planillaGuardada = await this.planillaRepo.save(nuevaPlanilla);

    // Guardar los detalles de cada trabajador
    const detalles = data.map((row) => ({
        id_planilla_aportes: planillaGuardada.id_planilla_aportes,
        nro: row['Nro.'],
        ci: row['Número documento de identidad'],
        apellido_paterno: row['Apellido Paterno'],
        apellido_materno: row['Apellido Materno'],
        nombres: row['Nombres'],
        sexo: row['Sexo (M/F)'],
        cargo: row['Cargo'],
        fecha_nac: new Date(1900, 0, row['Fecha de nacimiento'] - 1),
        fecha_ingreso: new Date(1900, 0, row['Fecha de ingreso'] - 1),
        fecha_retiro: row['Fecha Retiro'] ? new Date(1900, 0, row['Fecha Retiro'] - 1) : null,
        dias_pagados: row['Días pagados'],
        salario: row['Haber Básico'],
        regional: row['regional'],
    }));

    await this.detalleRepo.save(detalles);

    return { mensaje: '✅ Planilla guardada con éxito', id_planilla: planillaGuardada.id_planilla_aportes };
}


async obtenerHistorial(cod_patronal: string) {
  const planillas = await this.planillaRepo.find({
    where: { cod_patronal },
    order: { fecha_creacion: 'DESC' },
    select: [
      'id_planilla_aportes',
      'com_nro',
      'cod_patronal',
      'mes',
      'gestion',
      'total_importe',
      'total_trabaj',
      'estado',
      'fecha_creacion'
    ]
  });

  if (!planillas.length) {
    return { mensaje: 'No hay planillas registradas para este código patronal', planillas: [] };
  }

  return {
    mensaje: 'Historial obtenido con éxito',
    planillas
  };
}

async obtenerPlanilla(id_planilla: number) {
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
    throw new BadRequestException('La planilla no existe');
  }

  return { mensaje: 'Planilla obtenida con éxito', planilla };
}


async obtenerDetalles(id_planilla: number) {
  const detalles = await this.detalleRepo.find({
    where: { id_planilla_aportes: id_planilla },
    order: { nro: 'ASC' },
    select: [
      'id_planilla_aportes_detalles',
      'id_planilla_aportes',
      'nro',
      'ci',
      'apellido_paterno',
      'apellido_materno',
      'nombres',
      'sexo',
      'cargo',
      'fecha_nac',
      'fecha_ingreso',
      'fecha_retiro',
      'dias_pagados',
      'salario',
      'regional'
    ]
  });

  if (!detalles.length) {
    return { mensaje: 'No hay detalles registrados para esta planilla', detalles: [] };
  }

  return {
    mensaje: 'Detalles obtenidos con éxito',
    id_planilla,
    trabajadores: detalles
  };
}

async obtenerDetallesPorRegional(id_planilla: number, regional: string) {
  const detalles = await this.detalleRepo.find({
    where: { id_planilla_aportes: id_planilla, regional },
    order: { nro: 'ASC' },
    select: [
      'id_planilla_aportes_detalles',
      'id_planilla_aportes',
      'nro',
      'ci',
      'apellido_paterno',
      'apellido_materno',
      'nombres',
      'sexo',
      'cargo',
      'fecha_nac',
      'fecha_ingreso',
      'fecha_retiro',
      'dias_pagados',
      'salario',
      'regional'
    ]
  });

  if (!detalles.length) {
    return { mensaje: 'No hay detalles registrados para esta planilla y regional', detalles: [] };
  }

  return {
    mensaje: 'Detalles obtenidos con éxito',
    id_planilla,
    regional,
    trabajadores: detalles
  };
}

async obtenerPlanillasPendientes() {
  const planillas = await this.planillaRepo.find({
    where: { estado: 1 }, // Solo las pendientes
    order: { fecha_creacion: 'DESC' }
  });

  return {
    mensaje: 'Planillas pendientes obtenidas con éxito',
    planillas
  };
}


async actualizarEstadoPlanilla(id_planilla: number, estado: number, observaciones?: string) {
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
    throw new BadRequestException('La planilla no existe');
  }

  // Validar estado válido
  if (![2, 3].includes(estado)) {
    throw new BadRequestException('El estado debe ser 2 (Aprobado) o 3 (Observado)');
  }

  // Actualizar la planilla
  planilla.estado = estado;
  if (estado === 3 && observaciones) {
    planilla.observaciones = observaciones;
  }

  await this.planillaRepo.save(planilla);

  return { mensaje: 'Estado de la planilla actualizado correctamente' };
}


async obtenerPlanillasObservadas(cod_patronal: string) {
  const planillas = await this.planillaRepo.find({
    where: { cod_patronal, estado: 3 }, // Solo las observadas (rechazadas)
    order: { fecha_creacion: 'DESC' },
    select: [
      'id_planilla_aportes',
      'com_nro',
      'cod_patronal',
      'mes',
      'gestion',
      'total_importe',
      'total_trabaj',
      'estado',
      'observaciones',
      'fecha_creacion'
    ]
  });

  if (!planillas.length) {
    return { mensaje: 'No hay planillas observadas para este código patronal', planillas: [] };
  }

  return {
    mensaje: 'Planillas observadas obtenidas con éxito',
    planillas
  };
}


async corregirPlanilla(id_planilla: number, data: any) {
  // Buscar la planilla
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
    throw new BadRequestException('La planilla no existe');
  }

  // Validar que la planilla esté en estado 3 (Observada)
  if (planilla.estado !== 3) {
    throw new BadRequestException('Solo se pueden corregir planillas observadas');
  }

  // Calcular el total de los salarios de los trabajadores corregidos
  const totalImporteCalculado = data.trabajadores.reduce((sum, row) => sum + parseFloat(row.salario || 0), 0);

  // Actualizar la planilla con el total calculado
  planilla.total_importe = totalImporteCalculado;
  planilla.estado = 1; // Cambia a "Pendiente"
  planilla.observaciones = null; // Se eliminan las observaciones

  await this.planillaRepo.save(planilla);

  // Eliminar los registros antiguos de `planilla_aportes_detalles`
  await this.detalleRepo.delete({ id_planilla_aportes: id_planilla });

  // Guardar los nuevos registros corregidos
  const nuevosDetalles = data.trabajadores.map((row) => ({
    id_planilla_aportes: id_planilla,
    nro: row.nro,
    ci: row.ci,
    apellido_paterno: row.apellido_paterno,
    apellido_materno: row.apellido_materno,
    nombres: row.nombres,
    sexo: row.sexo,
    cargo: row.cargo,
    fecha_nac: row.fecha_nac,
    fecha_ingreso: row.fecha_ingreso,
    fecha_retiro: row.fecha_retiro,
    dias_pagados: row.dias_pagados,
    salario: row.salario,
    regional: row.regional,
  }));

  await this.detalleRepo.save(nuevosDetalles);

  return { mensaje: 'Planilla corregida y reenviada para validación', total_importe: totalImporteCalculado };
}








}
