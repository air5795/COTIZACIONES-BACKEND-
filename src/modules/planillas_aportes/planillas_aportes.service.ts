import { Injectable, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanillasAporte } from './entities/planillas_aporte.entity';
import { PlanillaAportesDetalles } from './entities/planillas_aportes_detalles.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as carbone from 'carbone';
import * as moment from 'moment-timezone';



@Injectable()
export class PlanillasAportesService {
  constructor(
    @InjectRepository(PlanillasAporte)
    private planillaRepo: Repository<PlanillasAporte>,
    private readonly httpService: HttpService,

    @InjectRepository(PlanillaAportesDetalles)
    private detalleRepo: Repository<PlanillaAportesDetalles>,
  ) {}

// 1 .-  PROCESAR EXCEL DE APORTES-------------------------------------------------------------------------------------------------------
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
// 2 .- GUARDAR PLANILLA DE APORTES -------------------------------------------------------------------------------------------------------
async guardarPlanilla(data: any[], cod_patronal: string, gestion: string, mes: string, empresa: string) {
  const fechaPlanilla = new Date(`${gestion}-${mes.padStart(2, '0')}-01`);
  const existePlanilla = await this.planillaRepo.findOne({
    where: { cod_patronal, fecha_planilla: fechaPlanilla }
  });

  if (existePlanilla) {
    throw new BadRequestException('❌ Ya existe una planilla para este mes y gestión.');
  }

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

  const nuevaPlanilla = this.planillaRepo.create({
    cod_patronal,
    fecha_planilla: fechaPlanilla,
    empresa,
    total_importe: totalImporte,
    total_trabaj: totalTrabaj,
    estado: 0,
    fecha_declarada: null,
  });

  const planillaGuardada = await this.planillaRepo.save(nuevaPlanilla);

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

  await this.detalleRepo.save(detalles);

  return { mensaje: '✅ Planilla guardada con éxito', id_planilla: planillaGuardada.id_planilla_aportes };
}
// 3 .- ACTUALIZAR DETALLES DE PLANILLA DE APORTES -------------------------------------------------------------------------------------------------------
async actualizarDetallesPlanilla(id_planilla: number, data: any[]) {
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
    throw new BadRequestException('❌ La planilla no existe.');
  }

  const datosValidos = data.filter(row => 
    row['Número documento de identidad'] && row['Nombres'] && row['Haber Básico']
  );

  if (datosValidos.length === 0) {
    throw new BadRequestException('❌ No se encontraron registros válidos en el archivo.');
  }

  await this.detalleRepo.delete({ id_planilla_aportes: id_planilla });

  const totalImporte = datosValidos.reduce((sum, row) => {
    const sumaFila =
      parseFloat(row['Haber Básico'] || '0') +
      parseFloat(row['Bono de antigüedad'] || '0') +
      parseFloat(row['Monto horas extra'] || '0') +
      parseFloat(row['Monto horas extra nocturnas'] || '0') +
      parseFloat(row['Otros bonos y pagos'] || '0');
    return sum + sumaFila;
  }, 0);

  const totalTrabaj = datosValidos.length;

  const nuevosDetalles = datosValidos.map((row) => ({
    id_planilla_aportes: id_planilla,
    nro: row['Nro.'] || 0,
    ci: row['Número documento de identidad'] || '',
    apellido_paterno: row['Apellido Paterno'] || '',
    apellido_materno: row['Apellido Materno'] || '',
    nombres: row['Nombres'] || '',
    sexo: row['Sexo (M/F)'] || '',
    cargo: row['Cargo'] || '',
    fecha_nac: row['Fecha de nacimiento'] ? new Date(1900, 0, row['Fecha de nacimiento'] - 1) : new Date('1900-01-01'),
    fecha_ingreso: row['Fecha de ingreso'] ? new Date(1900, 0, row['Fecha de ingreso'] - 1) : new Date(),
    fecha_retiro: row['Fecha de retiro'] ? new Date(1900, 0, row['Fecha de retiro'] - 1) : null,
    dias_pagados: row['Días pagados'] || 0,
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
    regional: row['regional'] || '',
  }));

  await this.detalleRepo.save(nuevosDetalles);

  planilla.total_importe = totalImporte;
  planilla.total_trabaj = totalTrabaj;

  await this.planillaRepo.save(planilla);

  return { 
    mensaje: '✅ Detalles de la planilla actualizados con éxito',
    total_importe: totalImporte,
    total_trabajadores: totalTrabaj,
  };
}
// 4 .- OBTENER HISTORIAL DETALLADO PAGINACION Y BUSQUEDA DE TABLA PLANILLAS DE APORTES -------------------------------------------------------------------------------------------------------
async obtenerHistorial(
  cod_patronal: string,
  pagina: number = 1,
  limite: number = 10,
  busqueda: string = ''
  ,mes?: string, 
  anio?: string  
) {
  try {
    const skip = (pagina - 1) * limite;

    const query = this.planillaRepo.createQueryBuilder('planilla')
      .where('planilla.cod_patronal = :cod_patronal', { cod_patronal })
      .orderBy('planilla.fecha_creacion', 'DESC')
      .select([
        'planilla.id_planilla_aportes',
        'planilla.com_nro',
        'planilla.fecha_planilla',
        'planilla.cod_patronal',
        'planilla.empresa',
        'planilla.total_importe',
        'planilla.total_trabaj',
        'planilla.estado',
        'planilla.fecha_creacion',
        'planilla.fecha_declarada',
        'planilla.fecha_pago',
      ])
      .skip(skip)
      .take(limite);

    // Filtro por mes (extraer el mes de fecha_planilla)
    if (mes) {
      query.andWhere('EXTRACT(MONTH FROM planilla.fecha_planilla) = :mes', { mes });
    }

    // Filtro por año (extraer el año de fecha_planilla)
    if (anio) {
      query.andWhere('EXTRACT(YEAR FROM planilla.fecha_planilla) = :anio', { anio });
    }

    // Búsqueda en todos los campos (como ya tenías)
    if (busqueda) {
      query.andWhere(
        `(
          CAST(planilla.id_planilla_aportes AS TEXT) LIKE :busqueda OR
          CAST(planilla.com_nro AS TEXT) LIKE :busqueda OR
          CAST(planilla.fecha_planilla AS TEXT) LIKE :busqueda OR
          planilla.cod_patronal LIKE :busqueda OR
          planilla.empresa LIKE :busqueda OR
          CAST(planilla.total_importe AS TEXT) LIKE :busqueda OR
          CAST(planilla.total_trabaj AS TEXT) LIKE :busqueda OR
          CAST(planilla.estado AS TEXT) LIKE :busqueda OR
          CAST(planilla.fecha_creacion AS TEXT) LIKE :busqueda
        )`,
        { busqueda: `%${busqueda}%` }
      );
    }

    const [planillas, total] = await query.getManyAndCount();

    if (!planillas.length) {
      return {
        mensaje: 'No hay planillas registradas para este código patronal',
        planillas: [],
        total: 0,
        pagina,
        limite,
      };
    }

    return {
      mensaje: 'Historial obtenido con éxito',
      planillas,
      total,
      pagina,
      limite,
    };
  } catch (error) {
    throw new Error('Error al obtener el historial de planillas');
  }
}
// 4.1 .- OBTENER HISTORIAL DETALLADO PAGINACION Y BUSQUEDA DE TABLA PLANILLAS DE APORTES ADMINISTRADOR -------------------------------------------------------------------------------------------------------
async obtenerHistorialAdmin(
  pagina: number = 1,
  limite: number = 10,
  busqueda: string = '',
  mes?: string,
  anio?: string,
  estado?: number
) {
  try {
    console.log('Parámetros recibidos:', { pagina, limite, busqueda, mes, anio, estado });

    const skip = (pagina - 1) * limite;
    console.log('Skip calculado:', skip);

    const query = this.planillaRepo.createQueryBuilder('planilla')
      .where('planilla.estado IN (:...estados)', { estados: [1, 2] })
      .orderBy('planilla.fecha_planilla', 'DESC')
      .select([
        'planilla.id_planilla_aportes',
        'planilla.com_nro',
        'planilla.fecha_planilla',
        'planilla.cod_patronal',
        'planilla.empresa',
        'planilla.total_importe',
        'planilla.total_trabaj',
        'planilla.estado',
        'planilla.fecha_creacion',
        'planilla.fecha_declarada',
        'planilla.fecha_pago',
      ])
      .skip(skip)
      .take(limite);

    // Filtro por mes (extraer el mes de fecha_planilla)
    if (mes) {
      console.log('Aplicando filtro por mes:', mes);
      query.andWhere('EXTRACT(MONTH FROM planilla.fecha_planilla) = :mes', { mes });
    }

    // Filtro por año (extraer el año de fecha_planilla)
    if (anio) {
      console.log('Aplicando filtro por año:', anio);
      query.andWhere('EXTRACT(YEAR FROM planilla.fecha_planilla) = :anio', { anio });
    }

    if (estado !== undefined && estado !== null && !isNaN(estado)) {
      console.log('Filtrando por estado:', estado);
      query.andWhere('planilla.estado = :estado', { estado });
    }

    // Búsqueda en todos los campos (como ya tenías)
    if (busqueda) {
      console.log('Aplicando filtro por búsqueda:', busqueda);
      query.andWhere(
        `(
          CAST(planilla.id_planilla_aportes AS TEXT) LIKE :busqueda OR
          CAST(planilla.com_nro AS TEXT) LIKE :busqueda OR
          CAST(planilla.fecha_planilla AS TEXT) LIKE :busqueda OR
          planilla.cod_patronal LIKE :busqueda OR
          planilla.empresa LIKE :busqueda OR
          CAST(planilla.total_importe AS TEXT) LIKE :busqueda OR
          CAST(planilla.total_trabaj AS TEXT) LIKE :busqueda OR
          CAST(planilla.estado AS TEXT) LIKE :busqueda OR
          CAST(planilla.fecha_creacion AS TEXT) LIKE :busqueda
        )`,
        { busqueda: `%${busqueda}%` }
      );
    }

    const sql = query.getSql();
    console.log('Consulta SQL generada:', sql);

    const [planillas, total] = await query.getManyAndCount();
    console.log('Planillas obtenidas:', planillas);
    console.log('Total de planillas:', total);

    if (!planillas.length) {
      return {
        mensaje: 'No hay planillas registradas para este código patronal',
        planillas: [],
        total: 0,
        pagina,
        limite,
      };
    }

    return {
      mensaje: 'Historial obtenido con éxito',
      planillas,
      total,
      pagina,
      limite,
    };
  } catch (error) {
    console.error('Error en obtenerHistorialAdmin:', error);
    throw new Error('Error al obtener el historial de planillas');
  }
}
// 5 .- OBTENER HISTORIAL DE TABLA PLANILLAS DE APORTES CUANDO ESTADO = 1 (presentadas) -------------------------------------------------------------------------------------------------------
async obtenerTodoHistorial() {
  try {
    const planillas = await this.planillaRepo.find({
      where: { estado: 1 },
      order: { fecha_creacion: 'DESC' },
      select: [
        'id_planilla_aportes',
        'com_nro',
        'cod_patronal',
        'empresa',
        'mes',
        'gestion',
        'total_importe',
        'total_trabaj',
        'estado',
        'fecha_creacion',
        'fecha_declarada',
        'fecha_pago'
      ]
    });

    if (!planillas.length) {
      return { mensaje: 'No hay planillas registradas', planillas: [] };
    }

    return {
      mensaje: 'Historial obtenido con éxito',
      planillas
    };
  } catch (error) {
    throw new Error('Error al obtener el historial de planillas');
  }
}
// 6 .- OBTENER HISTORIAL TOTAL PLANILLA DE APORTES -------------------------------------------------------------------------------------------------------
async obtenerTodo(pagina: number = 1, limite: number = 10, busqueda: string = '') {
  try {
    const skip = (pagina - 1) * limite;

    const query = this.planillaRepo.createQueryBuilder('planilla')
      .orderBy('planilla.fecha_creacion', 'DESC')
      .skip(skip)
      .take(limite);

    if (busqueda) {
      query.where(
        'planilla.empresa LIKE :busqueda OR planilla.cod_patronal LIKE :busqueda OR planilla.mes LIKE :busqueda OR planilla.gestion LIKE :busqueda',
        { busqueda: `%${busqueda}%` }
      );
    }

    const [planillas, total] = await query.getManyAndCount();

    if (!planillas.length) {
      return { mensaje: 'No hay planillas registradas', planillas: [], total: 0 };
    }

    return {
      mensaje: 'Historial obtenido con éxito',
      planillas,
      total,
      pagina,
      limite
    };
  } catch (error) {
    throw new Error('Error al obtener el historial de planillas de aportes completo');
  }
}

// 7 .- OBTENER PLANILLA DE APORTES POR ID (ASINCRONO SIN PAGINACION) -------------------------------------------------------------------------------------------------------
async obtenerPlanilla(id_planilla: number) {
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
    throw new BadRequestException('La planilla no existe');
  }

  return { mensaje: 'Planilla obtenida con éxito', planilla };
}
// 8.- OBTENER DETALLES DE PLANILLA DE APORTES POR ID DE PLANILLA (TIENE PAGINACION Y BUSQUEDA)-------------------------------------------------------------------------------------------------------
async obtenerDetalles(id_planilla: number, pagina: number = 1, limite: number = 10, busqueda: string = '') {
  try {
    const skip = limite > 0 ? (pagina - 1) * limite : 0; // Si limite es 0, no paginar

    const query = this.detalleRepo.createQueryBuilder('detalle')
      .where('detalle.id_planilla_aportes = :id_planilla', { id_planilla })
      .orderBy('detalle.nro', 'ASC')
      .select([
        'detalle.id_planilla_aportes_detalles',
        'detalle.id_planilla_aportes',
        'detalle.nro',
        'detalle.ci',
        'detalle.apellido_paterno',
        'detalle.apellido_materno',
        'detalle.nombres',
        'detalle.sexo',
        'detalle.cargo',
        'detalle.fecha_nac',
        'detalle.fecha_ingreso',
        'detalle.fecha_retiro',
        'detalle.dias_pagados',
        'detalle.salario',
        'detalle.regional',
        'detalle.haber_basico'
      ]);

    if (limite > 0) { // Solo aplicar paginación si limite es positivo
      query.skip(skip).take(limite);
    }

    if (busqueda) {
      query.andWhere(
        '(detalle.ci LIKE :busqueda OR detalle.apellido_paterno LIKE :busqueda OR detalle.apellido_materno LIKE :busqueda OR detalle.nombres LIKE :busqueda OR detalle.cargo LIKE :busqueda)',
        { busqueda: `%${busqueda}%` }
      );
    }

    const [detalles, total] = await query.getManyAndCount();

    if (!detalles.length) {
      return { 
        mensaje: 'No hay detalles registrados para esta planilla', 
        detalles: [], 
        total: 0 
      };
    }

    return {
      mensaje: 'Detalles obtenidos con éxito',
      id_planilla,
      trabajadores: detalles,
      total,
      pagina,
      limite
    };
  } catch (error) {
    throw new Error('Error al obtener los detalles de la planilla');
  }
}
// 9.- OBSERVAR DETALLES DE PLANILLA DE APORTES POR REGIONAL -------------------------------------------------------------------------------------------------------
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
// 10.- OBTENER PLANILLAS PENDIENTES O PRESENTADAS ESTADO = 1  -------------------------------------------------------------------------------------------------------
async obtenerPlanillasPendientes() {
  const planillas = await this.planillaRepo.find({
    where: { estado: 1 },
    order: { fecha_creacion: 'DESC' }
  });

  return {
    mensaje: 'Planillas pendientes obtenidas con éxito',
    planillas
  };
}
// 11 .- ACTUALIZAR EL ESTADO DE UNA PLANILLA A PRESENTADO O PENDIENTE = 1 -------------------------------------------------------------------------------------------------------
async actualizarEstadoAPendiente(id_planilla: number) {
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
    throw new BadRequestException('La planilla no existe');
  }

  planilla.estado = 1;
  planilla.fecha_declarada = moment().tz('America/La_Paz').toDate();

  await this.planillaRepo.save(planilla);

  return { mensaje: 'Estado de la planilla actualizado a Pendiente correctamente' };
}

// 12 .- ACTUALIZAR METODO PARA APROBAR U OBSERVAR LA PLANILLA (ESTADO 2 o 3)- -------------------------------------------------------------------------------------------------------
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

// 13.-  ELIMINAR DETALLES DE UNA PLANILLA -  -------------------------------------------------------------------------------------------------------
async eliminarDetallesPlanilla(id_planilla: number) {
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
      throw new BadRequestException('La planilla no existe.');
  }
  await this.detalleRepo.delete({ id_planilla_aportes: id_planilla });

  return { mensaje: '✅ Detalles de la planilla eliminados con éxito' };
}
// 14 .- OBTENER PLANILLAS DE APORTES OBSERVADAS (ESTADO = 3) -------------------------------------------------------------------------------------------------------
async obtenerPlanillasObservadas(cod_patronal: string) {
  const planillas = await this.planillaRepo.find({
    where: { cod_patronal, estado: 3 }, // Solo las observadas (rechazadas)
    order: { fecha_creacion: 'DESC' },
    select: [
      'id_planilla_aportes',
      'com_nro',
      'cod_patronal',
      'empresa',
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
// 15 .- MANDAR CORREGIDA PLANILLA DE APORTES OBSERVADA A ADMINSTRADOR CBES CUANDO (ESTADO = 3) -------------------------------------------------------------------------------------------------------
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

// 16.- (METODO AYUDA) OBTENER DETALLES DE PLANILLA POR MES Y GESTION -------------------------------------------------------------------------------------------------------
async obtenerDetallesDeMes(cod_patronal: string, mes: string, gestion: string) {
  const fechaPlanilla = new Date(`${gestion}-${mes.padStart(2, '0')}-01`);
  const planilla = await this.planillaRepo.findOne({
    where: { cod_patronal, fecha_planilla: fechaPlanilla },
  });

  if (!planilla) {
    throw new BadRequestException('No existe planilla para el mes y gestión solicitados.');
  }

  const detalles = await this.detalleRepo.find({
    where: { id_planilla_aportes: planilla.id_planilla_aportes },
    order: { nro: 'ASC' },
  });

  return detalles;
}

// 17.- Método para comparar planillas de dos meses y detectar altas y bajas -------------------------------------------------------------------------------------------------------
async compararPlanillas(cod_patronal: string, mesAnterior: string, gestion: string, mesActual: string) {
  // Convertir los meses a números
  const mesAnteriorNum = parseInt(mesAnterior, 10);
  const mesActualNum = parseInt(mesActual, 10);

  // Validar que los meses sean válidos (entre 1 y 12)
  if (mesAnteriorNum < 1 || mesAnteriorNum > 12 || mesActualNum < 1 || mesActualNum > 12) {
      throw new BadRequestException('El mes debe ser un número entre 1 y 12.');
  }

  // Si el mes anterior es diciembre, restar un año a la gestión
  const gestionMesAnterior = mesAnteriorNum === 12 ? (parseInt(gestion) - 1).toString() : gestion;

  console.log(`Comparando planillas para:
      - Cod Patronal: ${cod_patronal}
      - Gestión Mes Anterior: ${gestionMesAnterior}
      - Mes Anterior: ${mesAnterior} (${mesAnteriorNum})
      - Gestión Mes Actual: ${gestion}
      - Mes Actual: ${mesActual} (${mesActualNum})`);

  // Convertir mes y gestión a fecha_planilla (primer día del mes)
  const fechaPlanillaMesAnterior = new Date(`${gestionMesAnterior}-${mesAnteriorNum.toString().padStart(2, '0')}-01`);
  const fechaPlanillaMesActual = new Date(`${gestion}-${mesActualNum.toString().padStart(2, '0')}-01`);

  // Validar que las fechas sean válidas
  if (isNaN(fechaPlanillaMesAnterior.getTime())) {
      throw new BadRequestException(`Fecha de planilla no válida para el mes anterior: ${gestionMesAnterior}-${mesAnteriorNum}`);
  }
  if (isNaN(fechaPlanillaMesActual.getTime())) {
      throw new BadRequestException(`Fecha de planilla no válida para el mes actual: ${gestion}-${mesActualNum}`);
  }

  // Obtener los detalles de las planillas de los dos meses
  const detallesMesAnterior = await this.obtenerDetallesDeMes(cod_patronal, mesAnteriorNum.toString(), gestionMesAnterior);
  const detallesMesActual = await this.obtenerDetallesDeMes(cod_patronal, mesActualNum.toString(), gestion);

  console.log('Detalles del mes anterior:', detallesMesAnterior);
  console.log('Detalles del mes actual:', detallesMesActual);

  // Validar si hay datos en ambos meses
  if (!detallesMesAnterior || detallesMesAnterior.length === 0) {
      throw new Error(`No se encontraron datos para el mes anterior (${mesAnterior}) en la gestión ${gestionMesAnterior}.`);
  }

  if (!detallesMesActual || detallesMesActual.length === 0) {
      throw new Error(`No se encontraron datos para el mes actual (${mesActual}) en la gestión ${gestion}.`);
  }

  const altas = [];
  const bajasNoEncontradas = []; // Bajas por trabajador no encontrado
  const bajasPorRetiro = []; // Bajas por fecha de retiro

  // Crear un mapa de los trabajadores del mes anterior basado en su CI
  const trabajadoresMesAnterior = new Map(
      detallesMesAnterior.map((trabajador) => [trabajador.ci, trabajador]),
  );

  // Crear un mapa de los trabajadores del mes actual basado en su CI
  const trabajadoresMesActual = new Map(
      detallesMesActual.map((trabajador) => [trabajador.ci, trabajador]),
  );

  // Detectar altas: trabajadores en el mes actual que no están en el mes anterior
  detallesMesActual.forEach((trabajadorActual) => {
      if (!trabajadoresMesAnterior.has(trabajadorActual.ci)) {
          altas.push(trabajadorActual);
      }
  });

  // Detectar bajas
  detallesMesAnterior.forEach((trabajadorAnterior) => {
      const trabajadorActual = trabajadoresMesActual.get(trabajadorAnterior.ci);

      if (!trabajadorActual) {
          // Si el trabajador no está en el mes actual, es una baja por no encontrado
          bajasNoEncontradas.push(trabajadorAnterior);
      } else if (trabajadorActual.fecha_retiro) {
          // Si el trabajador tiene fecha de retiro en el mes actual
          const fechaRetiroActual = new Date(trabajadorActual.fecha_retiro);

          // Verificar si la fecha de retiro es dentro del mes actual
          const mesActualInicio = new Date(`${gestion}-${mesActualNum.toString().padStart(2, '0')}-01`);
          const mesActualFin = new Date(mesActualInicio);
          mesActualFin.setMonth(mesActualFin.getMonth() + 1);

          console.log('Fecha de retiro actual:', fechaRetiroActual);
          console.log('Mes actual inicio:', mesActualInicio);
          console.log('Mes actual fin:', mesActualFin);

          if (fechaRetiroActual >= mesActualInicio && fechaRetiroActual < mesActualFin) {
              // Si la fecha de retiro es dentro del mes actual, es una baja por retiro
              bajasPorRetiro.push(trabajadorActual);
          }
      }
  });

  console.log('Altas detectadas:', altas);
  console.log('Bajas por trabajador no encontrado:', bajasNoEncontradas);
  console.log('Bajas por fecha de retiro:', bajasPorRetiro);

  return {
      altas,
      bajas: {
          noEncontradas: bajasNoEncontradas, // Bajas por trabajador no encontrado
          porRetiro: bajasPorRetiro, // Bajas por fecha de retiro
      },
      mensaje: 'Comparación de planillas completada con bajas agrupadas.',
  };
}
    
// 18.-  Método para generar el reporte de bajas con Carbone -------------------------------------------------------------------------------------------------------
async generarReporteBajas(id_planilla: number,cod_patronal: string): Promise<StreamableFile> {
  try {
    // Obtener la información de la planilla
    const resultadoPlanilla = await this.obtenerPlanilla(id_planilla);
    const planilla = resultadoPlanilla.planilla;

    // Extraer fecha_planilla y calcular mesActual, mesAnterior y gestion
    const fechaPlanilla = new Date(planilla.fecha_planilla); // Asumimos que planilla ahora tiene fecha_planilla
    const gestion = fechaPlanilla.getFullYear().toString(); // Ejemplo: "2024"
    const mesActual = String(fechaPlanilla.getMonth() + 1).padStart(2, '0'); // 1-based: "02" para febrero

    // Calcular mes anterior
    const fechaAnterior = new Date(fechaPlanilla);
    fechaAnterior.setMonth(fechaAnterior.getMonth() - 1);
    const mesAnterior = String(fechaAnterior.getMonth() + 1).padStart(2, '0'); // 1-based: "01" para enero
    const gestionAnterior = fechaAnterior.getFullYear().toString(); // Podría ser diferente si cruza el año

    // Obtener las bajas para los meses comparados
    const { bajas } = await this.compararPlanillas(
      cod_patronal,
      mesAnterior,
      gestionAnterior,
      mesActual
    );

    // Verificar si hay bajas
    if (bajas.noEncontradas.length === 0 && bajas.porRetiro.length === 0) {
      throw new Error('No se encontraron bajas para generar el reporte.');
    }

    // Agrupar las bajas por regional
    const bajasPorRegional = [...bajas.noEncontradas, ...bajas.porRetiro].reduce((acc, baja) => {
      const regional = baja.regional || 'Sin regional';
      if (!acc[regional]) {
        acc[regional] = {
          regional,
          bajas: [],
        };
      }
      acc[regional].bajas.push({
        nro: baja.nro,
        ci: baja.ci,
        nombreCompleto: `${baja.apellido_paterno} ${baja.apellido_materno} ${baja.nombres}`,
        cargo: baja.cargo,
        salario: baja.salario,
        fechaRetiro: baja.fecha_retiro ? new Date(baja.fecha_retiro).toLocaleDateString() : 'No especificada',
      });
      return acc;
    }, {});

    // Datos para el reporte
    const data = {
      planilla: {
        com_nro: planilla.com_nro,
        cod_patronal: planilla.cod_patronal,
        empresa: planilla.empresa,
        mes: mesActual, // Usamos el mes calculado
        gestion: gestion, // Usamos la gestión calculada
        total_trabaj: planilla.total_trabaj,
        total_importe: planilla.total_importe,
        estado: planilla.estado,
        fecha_creacion: planilla.fecha_creacion,
        usuario_creacion: planilla.usuario_creacion,
      },
      reporte: Object.values(bajasPorRegional),
    };

    console.log('Datos para el reporte:', JSON.stringify(data, null, 2));

    // Ruta de la plantilla de reporte
    const templatePath = path.resolve(
      'src/modules/planillas_aportes/templates/bajas.docx',
    );

    // Generar el reporte con Carbone
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

          console.log('Reporte generado correctamente');

          if (typeof result === 'string') {
            result = Buffer.from(result, 'utf-8');
          }

          resolve(new StreamableFile(result, {
            type: 'application/pdf',
            disposition: `attachment; filename=reporte_bajas_${cod_patronal}_${mesAnterior}_${mesActual}_${gestion}.pdf`,
          }));
        }
      );
    });
  } catch (error) {
    throw new Error('Error en generarReporteBajas: ' + error.message);
  }
}

// 19.- Método para generar REPORTE POR REGIONAL RESUMEN -------------------------------------------------------------------------------------------------------
async generarReportePlanillaPorRegional(id_planilla: number): Promise<StreamableFile> {
  try {
    // Obtener la información de la planilla y sus detalles
    const resultadoPlanilla = await this.obtenerPlanilla(id_planilla);
    const detallesPlanilla = await this.obtenerDetalles(id_planilla);

    if (!detallesPlanilla.trabajadores.length) {
      throw new Error('No se encontraron trabajadores para generar el reporte.');
    }

    const planilla = resultadoPlanilla.planilla;


    let totalCantidad = 0;
    let totalGanado = 0;

    // Agrupar los datos por regional
    const regionalesMap = new Map();

    detallesPlanilla.trabajadores.forEach(trabajador => {
      const { regional, salario } = trabajador;
      const salarioNum = parseFloat(salario.toString()); // Asegurar conversión a número

      if (!regionalesMap.has(regional)) {
        regionalesMap.set(regional, {
          regional,
          cantidad: 0,
          total_ganado: 0,
          porcentaje_10: 0
        });
      }

      const regionalData = regionalesMap.get(regional);
      regionalData.cantidad += 1;
      regionalData.total_ganado += salarioNum;
      regionalData.porcentaje_10 = parseFloat((regionalData.total_ganado * 0.10).toFixed(2)); // Redondeamos a 2 decimales

      totalCantidad += 1;
      totalGanado += salarioNum;
    });

    // Convertir el mapa a un array
    const resumenArray = Array.from(regionalesMap.values());

    // Crear la sección de totales separada
    const totales = {
      cantidad_total: totalCantidad,
      total_ganado: parseFloat(totalGanado.toFixed(2)),
      porcentaje_10: parseFloat((totalGanado * 0.10).toFixed(2))
    };

    // **Formato Correcto: Separar miles con coma y decimales con punto**
    const formatNumber = (num: number) => new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);

    // Aplicamos formato a todos los valores numéricos
    const formattedResumen = resumenArray.map(region => ({
      regional: region.regional,
      cantidad: formatNumber(region.cantidad),
      total_ganado: formatNumber(region.total_ganado),  
      porcentaje_10: formatNumber(region.porcentaje_10) 
    }));

    const formattedTotales = {
      cantidad_total: formatNumber(totales.cantidad_total),  
      total_ganado: formatNumber(totales.total_ganado),  
      porcentaje_10: formatNumber(totales.porcentaje_10)  
    };

    const data = {
      mensaje: 'Detalles obtenidos con éxito',
      planilla: planilla,
      resumen: formattedResumen,
      totales: formattedTotales
    };

    console.log('Datos para el reporte:', JSON.stringify(data, null, 2));

    const templatePath = path.resolve(
      'src/modules/planillas_aportes/templates/resumen.docx',
    );

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

          console.log('Reporte generado correctamente');

          if (typeof result === 'string') {
            result = Buffer.from(result, 'utf-8'); 
          }

          resolve(new StreamableFile(result, {
            type: 'application/pdf',
            disposition: `attachment; filename=reporte_planilla_${planilla.cod_patronal}_${planilla.mes}_${planilla.gestion}.pdf`,
          }));
        }
      );
    });
  } catch (error) {
    throw new Error('Error en generarReportePlanillaPorRegional: ' + error.message);
  }
}
 
// 20 .- Metodo para obtener los datos de la planilla por regional (se usa en la parte de resumen de planilla para mostrar al empleador y administrador) 
async obtenerDatosPlanillaPorRegional(id_planilla: number): Promise<any> {
  try {
    // Obtener la información de la planilla y sus detalles
    const resultadoPlanilla = await this.obtenerPlanilla(id_planilla);
    // Usa limite: 0 para traer todos los registros sin paginación
    const detallesPlanilla = await this.obtenerDetalles(id_planilla, 1, 0);
    console.log('Total de trabajadores crudos:', detallesPlanilla.trabajadores.length);

    // Verifica cuántos trabajadores se obtienen inicialmente
    console.log('1. Total de trabajadores crudos:', detallesPlanilla.trabajadores.length);
    console.log('1.1. Primeros 5 trabajadores (muestra):', detallesPlanilla.trabajadores.slice(0, 5));

    if (!detallesPlanilla.trabajadores.length) {
      throw new Error('No se encontraron trabajadores para los datos de la planilla.');
    }

    // Extraer la información de la planilla
    const planilla = resultadoPlanilla.planilla;

    // Variables para la sección "totales"
    let totalCantidad = 0;
    let totalGanado = 0;

    // Agrupar los datos por regional
    const regionalesMap = new Map();

    detallesPlanilla.trabajadores.forEach((trabajador, index) => {
      const { regional, salario } = trabajador;
      const salarioNum = parseFloat(salario.toString());

      // Muestra algunos trabajadores para verificar sus datos
      if (index < 5 || index >= detallesPlanilla.trabajadores.length - 5) {
        console.log(`2. Procesando trabajador #${index + 1}:`, { regional, salario });
      }

      if (!regionalesMap.has(regional)) {
        regionalesMap.set(regional, {
          regional,
          cantidad: 0,
          total_ganado: 0,
          porcentaje_10: 0
        });
      }

      const regionalData = regionalesMap.get(regional);
      regionalData.cantidad += 1;
      regionalData.total_ganado += salarioNum;
      regionalData.porcentaje_10 = parseFloat((regionalData.total_ganado * 0.10).toFixed(2));

      totalCantidad += 1;
      totalGanado += salarioNum;
    });

    // Verifica los resultados después de procesar
    console.log('3. Totales calculados:', { totalCantidad, totalGanado });
    console.log('3.1. Regionales procesadas (Map):', Array.from(regionalesMap.entries()));

    // Convertir el mapa a un array
    const resumenArray = Array.from(regionalesMap.values());

    // Verifica el resumen antes de formatear
    console.log('4. Resumen sin formatear:', resumenArray);

    // Crear la sección de totales separada
    const totales = {
      cantidad_total: totalCantidad,
      total_ganado: parseFloat(totalGanado.toFixed(2)),
      porcentaje_10: parseFloat((totalGanado * 0.10).toFixed(2))
    };

    // Formato de números
    const formatNumber = (num: number) => new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);

    // Formatear los datos
    const formattedResumen = resumenArray.map(region => ({
      regional: region.regional,
      cantidad: formatNumber(region.cantidad),
      total_ganado: formatNumber(region.total_ganado),
      porcentaje_10: formatNumber(region.porcentaje_10)
    }));

    const formattedTotales = {
      cantidad_total: formatNumber(totales.cantidad_total),
      total_ganado: formatNumber(totales.total_ganado),
      porcentaje_10: formatNumber(totales.porcentaje_10)
    };

    // Estructura final del JSON
    const data = {
      mensaje: 'Detalles obtenidos con éxito',
      planilla: planilla,
      resumen: formattedResumen,
      totales: formattedTotales
    };

    // Verifica el resultado final
    console.log('5. Respuesta final:', data);

    return data;

  } catch (error) {
    throw new Error('Error en obtenerDatosPlanillaPorRegional: ' + error.message);
  }
}
// 21 ACTUALIZAR FECHA PAGO EN PLANILLA APORTE --------------------------------------------------------------------------------------------------------------------------------------------------------------
async actualizarFechaPago(id_planilla: number, fechaPago?: Date) {
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
    throw new BadRequestException('La planilla no existe');
  }

  
  planilla.fecha_pago = fechaPago;

  await this.planillaRepo.save(planilla);

  return { mensaje: 'Fecha de pago de la planilla añadida correctamente' };
}

// 22.-  Función para consultar la API del Banco Central y obtener el UFV de una fecha específica -------------------------------------------------------------------------------------------------------
async getUfvForDate(fecha: Date): Promise<number> {
  // Normalizar la fecha para evitar problemas de zona horaria
  const year = fecha.getUTCFullYear();
  const month = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const day = String(fecha.getUTCDate()).padStart(2, '0');
  const formattedDate = `${year}/${month}/${day}`;

  console.log(`Consultando UFV para la fecha: ${formattedDate}`);

  try {
    const response = await firstValueFrom(
      this.httpService.get(
        `https://www.bcb.gob.bo/librerias/charts/ufv.php?cFecIni=${formattedDate}&cFecFin=${formattedDate}`,
      ),
    );

    const data = response.data;
    if (!Array.isArray(data) || data.length === 0) {
      throw new BadRequestException(`No se encontró UFV para la fecha ${formattedDate}`);
    }

    const ufv = parseFloat(data[0].val_ufv);
    if (isNaN(ufv)) {
      throw new BadRequestException(`El valor de UFV para la fecha ${formattedDate} no es válido`);
    }

    return ufv;
  } catch (error) {
    throw new BadRequestException(`Error al consultar el UFV para la fecha ${formattedDate}: ${error.message}`);
  }
}

// Función para calcular los aportes devengados -------------------------------------------------------------------------------------------------------
async calcularAportes(idPlanilla: number): Promise<PlanillasAporte> {
  console.log(`Iniciando cálculo de aportes para la planilla con ID: ${idPlanilla}`);

  // 1. Obtener la planilla
  const planilla = await this.planillaRepo.findOne({
    where: { id_planilla_aportes: idPlanilla },
  });

  console.log('Planilla obtenida:', planilla);

  if (!planilla) {
    console.error('Planilla no encontrada');
    throw new BadRequestException('Planilla no encontrada');
  }

  if (!planilla.fecha_declarada || !planilla.fecha_pago) {
    console.error('fecha_declarada y fecha_pago deben estar definidas para calcular los aportes');
    throw new BadRequestException('fecha_declarada y fecha_pago deben estar definidas para calcular los aportes');
  }

  // 2. Ajustar fechas a la zona horaria de Bolivia (UTC-4)
  const adjustToBoliviaTime = (date: Date): Date => {
    const offsetBolivia = -4 * 60; // Bolivia es UTC-4 (en minutos)
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000)); // Convertir a UTC
    return new Date(utcDate.getTime() + (offsetBolivia * 60 * 1000)); // Ajustar a UTC-4
  };

  const fechaPlanillaBolivia = adjustToBoliviaTime(new Date(planilla.fecha_planilla));
  const fechaDeclaradaBolivia = adjustToBoliviaTime(new Date(planilla.fecha_declarada));
  const fechaPagoBolivia = adjustToBoliviaTime(new Date(planilla.fecha_pago));

  // 3. Calcular la fecha límite (último día del mes siguiente a fecha_planilla)
  const getFechaLimite = (fechaPlanilla: Date): Date => {
    const baseDate = new Date(fechaPlanilla);
    baseDate.setUTCHours(0, 0, 0, 0); // Normalizar a medianoche UTC
    let year = baseDate.getUTCFullYear();
    let month = baseDate.getUTCMonth(); // 0-11

    // Avanzar al mes siguiente
    month += 1;
    if (month > 11) {
      month = 0; // Enero
      year += 1;
    }

    // Obtener el último día del mes siguiente
    const lastDayOfNextMonth = new Date(Date.UTC(year, month + 1, 0)); // Día 0 del mes siguiente = último día del mes actual
    lastDayOfNextMonth.setUTCHours(0, 0, 0, 0); // Asegurar medianoche UTC
    return adjustToBoliviaTime(lastDayOfNextMonth);
  };

  const fechaLimite = getFechaLimite(fechaPlanillaBolivia);
  console.log('Fecha límite para declaración y pago:', fechaLimite);

  // 4. Calcular Aporte 10% (total_importe es el Salario Cotizable)
  planilla.aporte_10 = planilla.total_importe * 0.10;
  console.log('Aporte 10% calculado:', planilla.aporte_10);

  // 5. Obtener UFV Día Oblig. Formal (usando fecha_declarada)
  const fechaDeclaradaForUfv = new Date(fechaDeclaradaBolivia);
  fechaDeclaradaForUfv.setHours(0, 0, 0, 0); // Normalizar a medianoche local
  planilla.ufv_dia_formal = await this.getUfvForDate(fechaDeclaradaForUfv);
  console.log('UFV Día Oblig. Formal obtenido:', planilla.ufv_dia_formal);

  // 6. Obtener UFV Día Presentación (usando fecha_pago directamente)
  const fechaPagoForUfv = new Date(fechaPagoBolivia);
  fechaPagoForUfv.setHours(0, 0, 0, 0); // Normalizar a medianoche local
  planilla.ufv_dia_presentacion = await this.getUfvForDate(fechaPagoForUfv);
  console.log('UFV Día Presentación obtenido:', planilla.ufv_dia_presentacion);

  // 7. Calcular Aporte Patronal Actualizado
  const calculoAporteActualizado = (planilla.aporte_10 / planilla.ufv_dia_formal) * planilla.ufv_dia_presentacion;
  planilla.aporte_actualizado = calculoAporteActualizado < planilla.aporte_10 ? planilla.aporte_10 : calculoAporteActualizado;
  console.log('Aporte Patronal Actualizado calculado:', planilla.aporte_actualizado);

  // 8. Calcular Monto Actualizado
  const calculoMontoActualizado = planilla.aporte_actualizado - planilla.aporte_10;
  planilla.monto_actualizado = calculoMontoActualizado < 0 ? 0 : calculoMontoActualizado;
  console.log('Monto Actualizado calculado:', planilla.monto_actualizado);

  // 9. Calcular 1% Multa por la No Presentación Planilla (solo si aplica)
  const fechaDeclaradaNormalized = new Date(fechaDeclaradaBolivia);
  fechaDeclaradaNormalized.setHours(0, 0, 0, 0); // Normalizar a medianoche local
  const fechaLimiteNormalized = new Date(fechaLimite);
  const aplicaMultaNoPresentacion = fechaDeclaradaNormalized > fechaLimiteNormalized;

  planilla.multa_no_presentacion = aplicaMultaNoPresentacion ? planilla.aporte_10 * 0.01 : 0;
  console.log('Multa por No Presentación calculada:', planilla.multa_no_presentacion);
  console.log('¿Aplica multa por no presentación?', aplicaMultaNoPresentacion);

  // 10. Calcular Días de Retraso (comparando con la fecha límite)
  const fechaPagoNormalized = new Date(fechaPagoBolivia);
  fechaPagoNormalized.setHours(0, 0, 0, 0); // Normalizar a medianoche local
  planilla.dias_retraso = Math.max(
    Math.floor(
      (fechaPagoNormalized.getTime() - fechaLimiteNormalized.getTime()) / (1000 * 60 * 60 * 24)
    ),
    0
  );
  console.log('Días de Retraso calculados:', planilla.dias_retraso);

  // 11. Calcular Intereses
  planilla.intereses = (planilla.aporte_actualizado * 0.0999 / 360) * planilla.dias_retraso;
  console.log('Intereses calculados:', planilla.intereses);

  // 12. Calcular Multa s/Int. 10%
  planilla.multa_sobre_intereses = planilla.intereses * 0.1;
  console.log('Multa sobre Intereses calculada:', planilla.multa_sobre_intereses);

  // 13. Calcular Total a Cancelar (incluye multa_no_presentacion solo si aplica)
  planilla.total_a_cancelar =
    planilla.aporte_10 +
    planilla.monto_actualizado +
    (aplicaMultaNoPresentacion ? planilla.multa_no_presentacion : 0) +
    planilla.intereses +
    planilla.multa_sobre_intereses;
  console.log('Total a Cancelar calculado:', planilla.total_a_cancelar);

  // 14. Guardar los cambios
  await this.planillaRepo.save(planilla);
  console.log('Planilla guardada con éxito');

  return planilla;
}



}
