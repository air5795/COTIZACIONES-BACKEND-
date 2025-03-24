import { Injectable, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanillasAdicionale } from './entities/planillas_adicionale.entity';
import { PlanillaAdicionalDetalles } from './entities/planillas_adicionales_detalles.entity';
import { PlanillasAporte } from '../planillas_aportes/entities/planillas_aporte.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as carbone from 'carbone';
import * as moment from 'moment-timezone';

@Injectable()
export class PlanillasAdicionalesService {
  constructor(
    @InjectRepository(PlanillasAdicionale)
    private planillaRepo: Repository<PlanillasAdicionale>,


    @InjectRepository(PlanillaAdicionalDetalles)
    private detalleRepo: Repository<PlanillaAdicionalDetalles>,

    @InjectRepository(PlanillasAporte)
    private planillaAporteRepo: Repository<PlanillasAporte>,
    private httpService: HttpService,
  ) {}

  // 1 .- PROCESAR EXCEL PLANILLAS ADICIONALES
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
  // 2 .- GUARDAR PLANILLA ADICIONAL
  async guardarPlanillaAdicional(id_planilla_aportes: number, data: any[], motivo_adicional: string , tipo_empresa: string) {
    // Usar planillaAporteRepo para buscar en la tabla planillas_aportes
    const planillaOriginal = await this.planillaAporteRepo.findOne({
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
      tipo_empresa,
      total_importe: totalImporte,
      total_trabaj: totalTrabaj, 
      estado: 0, 
      motivo_adicional,
      fecha_declarada: null,
    });

    const planillaAdicionalGuardada = await this.planillaRepo.save(nuevaPlanillaAdicional);

    // Guardar los detalles (Nota: Aquí hay un error, corregiremos en el siguiente paso)
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

    await this.detalleRepo.save(detalles); // Corrección aquí: usar detalleRepo, no planillaRepo

    return {
      mensaje: '✅ Planilla adicional guardada con éxito',
      id_planilla_adicional: planillaAdicionalGuardada.id_planilla_adicional,
    };
  }
  // 3 .- ACTUALIZAR DETALLES PLANILLA ADICIONAL  (pendiente)
  async actualizarDetallesPlanillaAdicional(id_planilla_adicional: number, data: any[]) {
    // Buscar la planilla adicional en planillas_adicionales
    const planilla = await this.planillaRepo.findOne({ where: { id_planilla_adicional } });
  
    if (!planilla) {
      throw new BadRequestException('❌ La planilla adicional no existe.');
    }
  
    // Validar que los datos tengan las columnas requeridas
    const datosValidos = data.filter(row => 
      row['Número documento de identidad'] && row['Nombres'] && row['Haber Básico']
    );
  
    if (datosValidos.length === 0) {
      throw new BadRequestException('❌ No se encontraron registros válidos en el archivo.');
    }
  
    // Eliminar los detalles existentes asociados a la planilla adicional
    await this.detalleRepo.delete({ id_planilla_adicional });
  
    // Calcular el total_importe
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
  
    // Crear los nuevos detalles
    const nuevosDetalles = datosValidos.map((row) => ({
      id_planilla_adicional,
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
  
    // Guardar los nuevos detalles en planilla_adicional_detalles
    await this.detalleRepo.save(nuevosDetalles);
  
    // Actualizar la planilla adicional con los nuevos totales
    planilla.total_importe = totalImporte;
    planilla.total_trabaj = totalTrabaj;
  
    await this.planillaRepo.save(planilla);
  
    return { 
      mensaje: '✅ Detalles de la planilla adicional actualizados con éxito',
      total_importe: totalImporte,
      total_trabajadores: totalTrabaj,
    };
  }
  // 4 .- OBTENER HISTORIAL DETALLADO DE TABLA PLANILLAS ADICIONALES
  async obtenerHistorialAdicional(
    id_planilla_aportes: number,
    pagina: number = 1,
    limite: number = 10,
    busqueda: string = '',
    mes?: string,
    anio?: string
  ) {
    try {
      const skip = (pagina - 1) * limite;
  
      const query = this.planillaRepo.createQueryBuilder('planilla')
        .where('planilla.id_planilla_aportes = :id_planilla_aportes', { id_planilla_aportes })
        .orderBy('planilla.fecha_creacion', 'DESC')
        .select([
          'planilla.id_planilla_adicional',
          'planilla.id_planilla_aportes',
          'planilla.total_importe',
          'planilla.total_trabaj',
          'planilla.estado',
          'planilla.fecha_creacion',
          'planilla.motivo_adicional',
          'planilla.fecha_declarada',
          'planilla.fecha_pago',
        ])
        .skip(skip)
        .take(limite);
  
      // Filtro por mes (extraer el mes de fecha_creacion)
      if (mes) {
        query.andWhere('EXTRACT(MONTH FROM planilla.fecha_creacion) = :mes', { mes });
      }
  
      // Filtro por año (extraer el año de fecha_creacion)
      if (anio) {
        query.andWhere('EXTRACT(YEAR FROM planilla.fecha_creacion) = :anio', { anio });
      }
  
      // Búsqueda en todos los campos
      if (busqueda) {
        query.andWhere(
          `(
            CAST(planilla.id_planilla_adicional AS TEXT) LIKE :busqueda OR
            CAST(planilla.id_planilla_aportes AS TEXT) LIKE :busqueda OR
            CAST(planilla.total_importe AS TEXT) LIKE :busqueda OR
            CAST(planilla.total_trabaj AS TEXT) LIKE :busqueda OR
            CAST(planilla.estado AS TEXT) LIKE :busqueda OR
            CAST(planilla.fecha_creacion AS TEXT) LIKE :busqueda OR
            planilla.motivo_adicional LIKE :busqueda
          )`,
          { busqueda: `%${busqueda}%` }
        );
      }
  
      const [planillas, total] = await query.getManyAndCount();
  
      if (!planillas.length) {
        return {
          mensaje: 'No hay planillas adicionales registradas para este id_planilla_aportes',
          planillas: [],
          total: 0,
          pagina,
          limite,
        };
      }
  
      return {
        mensaje: 'Historial de planillas adicionales obtenido con éxito',
        planillas,
        total,
        pagina,
        limite,
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener el historial de planillas adicionales');
    }
  }
 // 5.- OBTENER HISTORIAL DE TABLA PLANILLAS ADICIONALES CUANDO ESTADO = 1 (presentadas) --------------------------------------------------------------
  async obtenerTodoHistorialAdicional() {
    try {
      const planillas = await this.planillaRepo.find({
        where: { estado: 1 },
        order: { fecha_creacion: 'DESC' },
        select: [
          'id_planilla_adicional',
          'id_planilla_aportes',
          'total_importe',
          'total_trabaj',
          'estado',
          'fecha_creacion',
          'motivo_adicional',
        ],
      });
  
      if (!planillas.length) {
        return { mensaje: 'No hay planillas adicionales registradas', planillas: [] };
      }
  
      return {
        mensaje: 'Historial de planillas adicionales obtenido con éxito',
        planillas,
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener el historial de planillas adicionales');
    }
  }
  // 6.- OBTENER HISTORIAL TOTAL DE TABLA PLANILLAS ADICIONALES
  async obtenerTodoAdicional(pagina: number = 1, limite: number = 10, busqueda: string = '') {
    try {
      const skip = (pagina - 1) * limite;
  
      const query = this.planillaRepo.createQueryBuilder('planilla')
        .orderBy('planilla.fecha_creacion', 'DESC')
        .skip(skip)
        .take(limite);
  
      if (busqueda) {
        query.where(
          'planilla.motivo_adicional LIKE :busqueda OR CAST(planilla.id_planilla_aportes AS TEXT) LIKE :busqueda',
          { busqueda: `%${busqueda}%` }
        );
      }
  
      const [planillas, total] = await query.getManyAndCount();
  
      if (!planillas.length) {
        return { mensaje: 'No hay planillas adicionales registradas', planillas: [], total: 0 };
      }
  
      return {
        mensaje: 'Historial de planillas adicionales obtenido con éxito',
        planillas,
        total,
        pagina,
        limite,
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener el historial de planillas adicionales completo');
    }
  }
  // 7 .- OBTENER PLANILLA DE ADICIONAL POR ID (ASINCRONO SIN PAGINACION) -------------------------------------------------------------------------------------------------------
  async obtenerPlanillaAdicional(id_planilla_adicional: number) {
    const planilla = await this.planillaRepo.findOne({ where: { id_planilla_adicional } });
  
    if (!planilla) {
      throw new BadRequestException('La planilla adicional no existe');
    }
  
    return { mensaje: 'Planilla adicional obtenida con éxito', planilla };
  }
  // 8.- OBTENER DETALLES DE PLANILLAS ADICIONALES POR ID DE PLANILLA (TIENE PAGINACION Y BUSQUEDA)-------------------------------------------------------------------------------------------------------
  async obtenerDetallesAdicional(id_planilla_adicional: number, pagina: number = 1, limite: number = 10, busqueda: string = '') {
    try {
      const skip = limite > 0 ? (pagina - 1) * limite : 0; // Si limite es 0, no paginar
  
      const query = this.detalleRepo.createQueryBuilder('detalle')
        .where('detalle.id_planilla_adicional = :id_planilla_adicional', { id_planilla_adicional })
        .orderBy('detalle.nro', 'ASC')
        .select([
          'detalle.id_planilla_adicional_detalles',
          'detalle.id_planilla_adicional',
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
          'detalle.haber_basico',
          'detalle.bono_antiguedad',
          'detalle.monto_horas_extra',
          'detalle.monto_horas_extra_nocturnas',
          'detalle.otros_bonos_pagos',
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
          mensaje: 'No hay detalles registrados para esta planilla adicional', 
          detalles: [], 
          total: 0 
        };
      }
  
      return {
        mensaje: 'Detalles de la planilla adicional obtenidos con éxito',
        id_planilla_adicional,
        trabajadores: detalles,
        total,
        pagina,
        limite
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener los detalles de la planilla adicional');
    }
  }
  // 9.- OBTENER DETALLES DE PLANILLAS ADICIONALES  POR REGIONAL-------------------------------------------------------------------------------------------------------
  async obtenerDetallesPorRegionalAdicional(id_planilla_adicional: number, regional: string) {
    const detalles = await this.detalleRepo.find({
      where: { id_planilla_adicional, regional },
      order: { nro: 'ASC' },
      select: [
        'id_planilla_adicional_detalles',
        'id_planilla_adicional',
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
        'regional',
        'haber_basico',
        'bono_antiguedad',
        'monto_horas_extra',
        'monto_horas_extra_nocturnas',
        'otros_bonos_pagos',
      ],
    });
  
    if (!detalles.length) {
      return { mensaje: 'No hay detalles registrados para esta planilla adicional y regional', detalles: [] };
    }
  
    return {
      mensaje: 'Detalles de la planilla adicional obtenidos con éxito',
      id_planilla_adicional,
      regional,
      trabajadores: detalles,
    };
  }
  // 10.- OBTENER PLANILLAS ADICIONALES PENDIENTES O PRESENTADAS ESTADO = 1-------------------------------------------------------------------------------------------------------
  async obtenerPlanillasPendientesAdicional() {
    const planillas = await this.planillaRepo.find({
      where: { estado: 1 },
      order: { fecha_creacion: 'DESC' },
      select: [
        'id_planilla_adicional',
        'id_planilla_aportes',
        'total_importe',
        'total_trabaj',
        'estado',
        'fecha_creacion',
        'motivo_adicional',
      ],
    });
  
    return {
      mensaje: 'Planillas adicionales pendientes obtenidas con éxito',
      planillas,
    };
  }
  // 11 .- ACTUALIZAR EL ESTADO DE UNA PLANILLA A PRESENTADO O PENDIENTE = 1 -------------------------------------------------------------------------------------------------------
  async actualizarEstadoAPendienteAdicional(id_planilla_adicional: number) {
    const planilla = await this.planillaRepo.findOne({ where: { id_planilla_adicional } });
  
    if (!planilla) {
      throw new BadRequestException('La planilla adicional no existe');
    }
  
    planilla.estado = 1;
    planilla.fecha_declarada = new Date();
  
    await this.planillaRepo.save(planilla);
  
    return { mensaje: 'Estado de la planilla adicional actualizado a Pendiente correctamente' };
  }
  // 12 .- ACTUALIZAR PLANILLA PARA APROBAR U OBSERVAR LA PLANILLA (ESTADO 2 o 3)
  async actualizarEstadoPlanillaAdicional(id_planilla_adicional: number, estado: number, observaciones?: string) {
    const planilla = await this.planillaRepo.findOne({ where: { id_planilla_adicional } });
  
    if (!planilla) {
      throw new BadRequestException('La planilla adicional no existe');
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
  
    return { mensaje: 'Estado de la planilla adicional actualizado correctamente' };
  }
  // 13.-  ELIMINAR DETALLES DE UNA PLANILLA ADICIONAL -------------------------------------------------------------------------------------------------------
  async eliminarDetallesPlanillaAdicional(id_planilla_adicional: number) {
    const planilla = await this.planillaRepo.findOne({ where: { id_planilla_adicional } });
  
    if (!planilla) {
      throw new BadRequestException('La planilla adicional no existe.');
    }
  
    await this.detalleRepo.delete({ id_planilla_adicional });
  
    return { mensaje: '✅ Detalles de la planilla adicional eliminados con éxito' };
  }
  // 14 .- OBTENER PLANILLAS ADICIONALES OBSERVADAS (ESTADO = 3)
  async obtenerPlanillasAdicionalesObservadas(cod_patronal: string) {
    const planillas = await this.planillaRepo
      .createQueryBuilder('planillaAdicional')
      .innerJoin('PlanillasAporte', 'planillaAporte', 'planillaAdicional.id_planilla_aportes = planillaAporte.id_planilla_aportes')
      .where('planillaAporte.cod_patronal = :cod_patronal', { cod_patronal })
      .andWhere('planillaAdicional.estado = :estado', { estado: 3 })
      .orderBy('planillaAdicional.fecha_creacion', 'DESC')
      .select([
        'planillaAdicional.id_planilla_adicional',
        'planillaAdicional.id_planilla_aportes',
        'planillaAporte.cod_patronal',
        'planillaAdicional.total_importe',
        'planillaAdicional.total_trabaj',
        'planillaAdicional.estado',
        'planillaAdicional.observaciones',
        'planillaAdicional.fecha_creacion',
        'planillaAdicional.motivo_adicional',
      ])
      .getMany();

    if (!planillas.length) {
      return { mensaje: 'No hay planillas adicionales observadas para este código patronal', planillas: [] };
    }

    return {
      mensaje: 'Planillas adicionales observadas obtenidas con éxito',
      planillas,
    };
  }
  //15 .- MANDAR CORREGIDA PLANILLA DE APORTES OBSERVADA A ADMINSTRADOR CBES CUANDO (ESTADO = 3) ------------------------------------------------------------------------------------------------------
  async corregirPlanillaAdicional(id_planilla_adicional: number, data: any) {
  // Buscar la planilla adicional
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_adicional } });

  if (!planilla) {
    throw new BadRequestException('La planilla adicional no existe');
  }

  // Validar que la planilla esté en estado 3 (Observada)
  if (planilla.estado !== 3) {
    throw new BadRequestException('Solo se pueden corregir planillas adicionales observadas');
  }

  // Calcular el total de los salarios de los trabajadores corregidos
  const totalImporteCalculado = data.trabajadores.reduce((sum, row) => sum + parseFloat(row.salario || 0), 0);

  // Actualizar la planilla con el total calculado
  planilla.total_importe = totalImporteCalculado;
  planilla.total_trabaj = data.trabajadores.length; // Actualizar el total de trabajadores
  planilla.estado = 1; // Cambia a "Pendiente"
  planilla.observaciones = null; // Se eliminan las observaciones

  await this.planillaRepo.save(planilla);

  // Eliminar los registros antiguos de `planillas_adicionales_detalles`
  await this.detalleRepo.delete({ id_planilla_adicional });

  // Guardar los nuevos registros corregidos
  const nuevosDetalles = data.trabajadores.map((row) => ({
    id_planilla_adicional,
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
    haber_basico: parseFloat(row.haber_basico || 0),
    bono_antiguedad: parseFloat(row.bono_antiguedad || 0),
    monto_horas_extra: parseFloat(row.monto_horas_extra || 0),
    monto_horas_extra_nocturnas: parseFloat(row.monto_horas_extra_nocturnas || 0),
    otros_bonos_pagos: parseFloat(row.otros_bonos_pagos || 0),
    salario: parseFloat(row.salario || 0),
    regional: row.regional,
  }));

  await this.detalleRepo.save(nuevosDetalles);

  return { mensaje: 'Planilla adicional corregida y reenviada para validación', total_importe: totalImporteCalculado };
  }
  // 20 .- Metodo para obtener los datos de la planilla por regional (se usa en la parte de resumen de planilla para mostrar al empleador y administrador)
  async obtenerDatosPlanillaAdicionalPorRegional(id_planilla_adicional: number): Promise<any> {
    try {
      // Obtener la información de la planilla adicional y sus detalles
      const resultadoPlanilla = await this.obtenerPlanillaAdicional(id_planilla_adicional);
      // Usa limite: 0 para traer todos los registros sin paginación
      const detallesPlanilla = await this.obtenerDetallesAdicional(id_planilla_adicional, 1, 0);
      console.log('Total de trabajadores crudos:', detallesPlanilla.trabajadores.length);

      // Verifica cuántos trabajadores se obtienen inicialmente
      console.log('1. Total de trabajadores crudos:', detallesPlanilla.trabajadores.length);
      console.log('1.1. Primeros 5 trabajadores (muestra):', detallesPlanilla.trabajadores.slice(0, 5));

      if (!detallesPlanilla.trabajadores.length) {
        throw new Error('No se encontraron trabajadores para los datos de la planilla adicional.');
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
            porcentaje_10: 0,
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
        porcentaje_10: parseFloat((totalGanado * 0.10).toFixed(2)),
      };

      // Formato de números
      const formatNumber = (num: number) => new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);

      // Formatear los datos
      const formattedResumen = resumenArray.map((region) => ({
        regional: region.regional,
        cantidad: formatNumber(region.cantidad),
        total_ganado: formatNumber(region.total_ganado),
        porcentaje_10: formatNumber(region.porcentaje_10),
      }));

      const formattedTotales = {
        cantidad_total: formatNumber(totales.cantidad_total),
        total_ganado: formatNumber(totales.total_ganado),
        porcentaje_10: formatNumber(totales.porcentaje_10),
      };

      // Estructura final del JSON
      const data = {
        mensaje: 'Detalles obtenidos con éxito',
        planilla: planilla,
        resumen: formattedResumen,
        totales: formattedTotales,
      };

      // Verifica el resultado final
      console.log('5. Respuesta final:', data);

      return data;
    } catch (error) {
      throw new Error('Error en obtenerDatosPlanillaAdicionalPorRegional: ' + error.message);
    }
  }

  // 21 ACTUALIZAR FECHA PAGO EN PLANILLA APORTE --------------------------------------------------------------------------------------------------------------------------------------------------------------
  async actualizarFechaPagoAdicional(id_planilla_adicional: number, fechaPago?: Date) {
    const planilla = await this.planillaRepo.findOne({ where: { id_planilla_adicional: id_planilla_adicional } });

    if (!planilla) {
      throw new BadRequestException('La planilla no existe');
    }

    planilla.fecha_pago = fechaPago;
    await this.planillaRepo.save(planilla);

    return { mensaje: 'Fecha de pago de la planilla añadida correctamente' };
  }

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

  // 23 .- Función para calcular los aportes  -------------------------------------------------------------------------------------------------------
async calcularAportes(id_planilla_adicional: number): Promise<PlanillasAdicionale> {
  console.log(`Iniciando cálculo de aportes para la planilla con ID: ${id_planilla_adicional}`);

  // 1. Obtener la planilla
  const planilla = await this.planillaRepo.findOne({
    where: { id_planilla_adicional: id_planilla_adicional },
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

  const fechaPlanillaBolivia = new Date(planilla.fecha_planilla);
  const fechaDeclaradaBolivia = adjustToBoliviaTime(new Date(planilla.fecha_declarada));
  const fechaPagoBolivia = adjustToBoliviaTime(new Date(planilla.fecha_pago));

  // 3. Calcular la fecha límite (último día del mes SIGUIENTE a fecha_planilla)
  const getFechaLimite = (fechaPlanilla: Date): Date => {
    const baseDate = new Date(fechaPlanilla);
    baseDate.setUTCHours(0, 0, 0, 0); // Normalizar a medianoche UTC
    
    // Avanzar al mes siguiente y establecer el último día
    baseDate.setUTCMonth(baseDate.getUTCMonth() + 2, 0); // +2 para llegar al final del mes siguiente
    
    return adjustToBoliviaTime(baseDate); // Ajustar a UTC-4
  };

  const fechaLimite = getFechaLimite(fechaPlanillaBolivia);
  console.log('Fecha límite para declaración y pago:', fechaLimite);

  // 4. Calcular Aporte según el tipo de empresa
  if (planilla.tipo_empresa === 'AP') {
    planilla.aporte_porcentaje = planilla.total_importe * 0.10;
    console.log('Aporte 10% calculado para empresa AP:', planilla.aporte_porcentaje);
  } else if (planilla.tipo_empresa === 'AV') {
    planilla.aporte_porcentaje = planilla.total_importe * 0.03;
    console.log('Aporte 3% calculado para empresa AV:', planilla.aporte_porcentaje);
  } else {
    console.error('Tipo de empresa no válido');
    throw new BadRequestException('Tipo de empresa no válido');
  }

  // 5. Obtener UFV Día Oblig. Formal (usando fecha_declarada)
  const fechaDeclaradaForUfv = new Date(fechaDeclaradaBolivia);
  fechaDeclaradaForUfv.setHours(0, 0, 0, 0); // Normalizar a medianoche local
  planilla.ufv_dia_formal = await this.getUfvForDate(fechaDeclaradaForUfv);
  console.log('UFV Día Oblig. Formal obtenido:', planilla.ufv_dia_formal);

  // 6. Obtener UFV Día Presentación (usando fecha_pago directamente)
  const fechaPagoForUfv = new Date(fechaPagoBolivia);
  fechaPagoForUfv.setDate(fechaPagoForUfv.getDate() - 1); // Restar un día
  fechaPagoForUfv.setHours(0, 0, 0, 0); // Normalizar a medianoche local
  planilla.ufv_dia_presentacion = await this.getUfvForDate(fechaPagoForUfv);
  console.log('UFV Día Presentación obtenido:', planilla.ufv_dia_presentacion);

  // 7. Calcular Aporte Patronal Actualizado
  const calculoAporteActualizado = (planilla.aporte_porcentaje / planilla.ufv_dia_formal) * planilla.ufv_dia_presentacion;
  planilla.aporte_actualizado = calculoAporteActualizado < planilla.aporte_porcentaje ? planilla.aporte_porcentaje : calculoAporteActualizado;
  console.log('Aporte Patronal Actualizado calculado:', planilla.aporte_actualizado);

  // 8. Calcular Monto Actualizado
  const calculoMontoActualizado = planilla.aporte_actualizado - planilla.aporte_porcentaje;
  planilla.monto_actualizado = calculoMontoActualizado < 0 ? 0 : calculoMontoActualizado;
  console.log('Monto Actualizado calculado:', planilla.monto_actualizado);

  // 9. Calcular 1% Multa por la No Presentación Planilla (solo si aplica)
  const fechaDeclaradaNormalized = new Date(fechaDeclaradaBolivia);
  fechaDeclaradaNormalized.setHours(0, 0, 0, 0); // Normalizar a medianoche
  const fechaLimiteNormalized = new Date(fechaLimite);
  fechaLimiteNormalized.setHours(0, 0, 0, 0); // Normalizar a medianoche

  // Verificar si aplica la multa (si fecha declarada > fecha límite)
  if (fechaDeclaradaNormalized > fechaLimiteNormalized) {
    planilla.multa_no_presentacion = planilla.aporte_porcentaje * 0.01;
    console.log('Multa por No Presentación aplicada:', planilla.multa_no_presentacion);
  } else {
    planilla.multa_no_presentacion = 0;
    console.log('No se aplica multa por No Presentación.');
  }

  // 10. Calcular Días de Retraso
  const fechaPagoNormalized = new Date(fechaPagoBolivia);
  fechaPagoNormalized.setHours(0, 0, 0, 0);
  const fechaInicioRetraso = new Date(fechaLimite);
  fechaInicioRetraso.setHours(0, 0, 0, 0);

  // Si fecha_pago es menor o igual a fechaLimite, no hay retraso
  if (fechaPagoNormalized <= fechaInicioRetraso) {
    planilla.dias_retraso = 0;
    console.log('No hay retraso: fecha_pago está dentro del plazo.', {
      fecha_pago: fechaPagoNormalized,
      fecha_limite: fechaInicioRetraso,
    });
  } else {
    const diferenciaEnMilisegundos = fechaPagoNormalized.getTime() - fechaInicioRetraso.getTime();
    const diferenciaEnDias = Math.ceil(diferenciaEnMilisegundos / (1000 * 60 * 60 * 24));
    planilla.dias_retraso = diferenciaEnDias ;
    console.log('Días de Retraso calculados:', planilla.dias_retraso, {
      fecha_pago: fechaPagoNormalized,
      fecha_inicio_retraso: fechaInicioRetraso,
    });
  }

  // 11. Calcular Intereses
  planilla.intereses = (planilla.aporte_actualizado * 0.0999 / 360) * planilla.dias_retraso;
  console.log('Intereses calculados:', planilla.intereses);

  // 12. Calcular Multa s/Int. 10%
  planilla.multa_sobre_intereses = planilla.intereses * 0.1;
  console.log('Multa sobre Intereses calculada:', planilla.multa_sobre_intereses);

  // 13. Calcular Total a Cancelar parcial
  planilla.total_a_cancelar_parcial =
    planilla.aporte_porcentaje +
    planilla.monto_actualizado +
    planilla.multa_no_presentacion + // Siempre suma la multa si existe, sin importar si hay retraso
    planilla.intereses +
    planilla.multa_sobre_intereses;
  console.log('Total a Cancelar calculado:', planilla.total_a_cancelar_parcial);

  // 14. calcular total multas 
  planilla.total_multas = planilla.multa_no_presentacion + planilla.multa_sobre_intereses;
  // 15. Calcular total tasa de interes
  planilla.total_tasa_interes = planilla.intereses;
  // 16. Calcular total aportes asus
  planilla.total_aportes_asuss = planilla.aporte_porcentaje * 0.005;
  // 17. Calcular total aportes ministerio de salud
  planilla.total_aportes_min_salud = planilla.aporte_porcentaje * 0.05;
  // 18. Calcular total a cancelar
  planilla.total_a_cancelar = 
    planilla.total_a_cancelar_parcial + 5 - 
    planilla.total_aportes_asuss - planilla.total_aportes_min_salud;

  // 19. Guardar los cambios
  await this.planillaRepo.save(planilla);
  console.log('Planilla guardada con éxito');

  return planilla;
}

// 24 .- calcular aportes con fecha pago -------------------------------------------------------------------------------------------------------
async calcularAportesPreliminar(id_planilla_adicional: number, fechaPagoPropuesta: Date): Promise<any> {
  console.log(`Paso 0: Iniciando cálculo preliminar - ID: ${id_planilla_adicional}, Fecha Pago Propuesta: ${fechaPagoPropuesta}`);

  // 1. Obtener la planilla
  console.log('Paso 1: Buscando planilla con ID:', id_planilla_adicional);
  const planilla = await this.planillaRepo.findOne({
    where: { id_planilla_adicional: id_planilla_adicional },
  });

  if (!planilla) {
    console.error('Paso 1 - Error: Planilla no encontrada para ID:', id_planilla_adicional);
    throw new BadRequestException('Planilla no encontrada');
  }
  console.log('Paso 1 - Planilla encontrada:', planilla);

  // 2. Validar fecha_declarada
  if (!planilla.fecha_declarada) {
    console.error('Paso 2 - Error: fecha_declarada no está definida en la planilla:', planilla);
    throw new BadRequestException('fecha_declarada debe estar definida para calcular los aportes');
  }
  console.log('Paso 2 - fecha_declarada válida:', planilla.fecha_declarada);

  // 3. Ajustar fechas a la zona horaria de Bolivia (UTC-4)
  const adjustToBoliviaTime = (date: Date): Date => {
    const offsetBolivia = -4 * 60; // Bolivia es UTC-4 (en minutos)
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000));
    return new Date(utcDate.getTime() + (offsetBolivia * 60 * 1000));
  };

  console.log('Paso 3: Ajustando fechas a zona horaria de Bolivia');
  const fechaPlanillaBolivia = new Date(planilla.fecha_planilla);
  const fechaDeclaradaBolivia = adjustToBoliviaTime(new Date(planilla.fecha_declarada));
  const fechaPagoBolivia = adjustToBoliviaTime(new Date(fechaPagoPropuesta));
  console.log('Paso 3 - Fechas ajustadas:', {
    fechaPlanillaBolivia,
    fechaDeclaradaBolivia,
    fechaPagoBolivia,
  });

  // 4. Calcular la fecha límite (último día del mes SIGUIENTE a fecha_planilla)
  const getFechaLimite = (fechaPlanilla: Date): Date => {
    const baseDate = new Date(fechaPlanilla);
    baseDate.setUTCHours(0, 0, 0, 0); // Normalizar a medianoche UTC
    
    // Avanzar al mes siguiente y establecer el último día
    baseDate.setUTCMonth(baseDate.getUTCMonth() + 2, 0); // +2 para llegar al final del mes siguiente
    
    return adjustToBoliviaTime(baseDate); // Ajustar a UTC-4
  };

  console.log('Paso 4: Calculando fecha límite');
  const fechaLimite = getFechaLimite(fechaPlanillaBolivia);
  console.log('Paso 4 - Fecha límite para declaración y pago:', fechaLimite);

  // 5. Calcular Aporte según el tipo de empresa
  console.log('Paso 5: Calculando aporte según tipo de empresa:', planilla.tipo_empresa);
  let aportePorcentaje: number;
  if (planilla.tipo_empresa === 'AP') {
    aportePorcentaje = planilla.total_importe * 0.10;
    console.log('Paso 5 - Aporte 10% calculado para empresa AP:', aportePorcentaje);
  } else if (planilla.tipo_empresa === 'AV') {
    aportePorcentaje = planilla.total_importe * 0.03;
    console.log('Paso 5 - Aporte 3% calculado para empresa AV:', aportePorcentaje);
  } else {
    console.error('Paso 5 - Error: Tipo de empresa no válido:', planilla.tipo_empresa);
    throw new BadRequestException('Tipo de empresa no válido');
  }

  // 6. Obtener UFV Día Oblig. Formal (usando fecha_declarada)
  console.log('Paso 6: Obteniendo UFV para fecha_declarada');
  const fechaDeclaradaForUfv = new Date(fechaDeclaradaBolivia);
  fechaDeclaradaForUfv.setHours(0, 0, 0, 0);
  const ufvDiaFormal = await this.getUfvForDate(fechaDeclaradaForUfv);
  console.log('Paso 6 - UFV Día Oblig. Formal obtenido:', ufvDiaFormal);

  // 7. Obtener UFV Día Presentación (usando fecha_pago propuesta - 1 día)
  console.log('Paso 7: Obteniendo UFV para fecha_pago (día anterior)');
  const fechaPagoForUfv = new Date(fechaPagoBolivia);
  fechaPagoForUfv.setDate(fechaPagoForUfv.getDate() - 1);
  fechaPagoForUfv.setHours(0, 0, 0, 0);
  const ufvDiaPresentacion = await this.getUfvForDate(fechaPagoForUfv);
  console.log('Paso 7 - UFV Día Presentación obtenido:', ufvDiaPresentacion);

  // 8. Calcular Aporte Patronal Actualizado
  console.log('Paso 8: Calculando aporte patronal actualizado');
  const calculoAporteActualizado = (aportePorcentaje / ufvDiaFormal) * ufvDiaPresentacion;
  const aporteActualizado = calculoAporteActualizado < aportePorcentaje ? aportePorcentaje : calculoAporteActualizado;
  console.log('Paso 8 - Aporte Patronal Actualizado calculado:', aporteActualizado);

  // 9. Calcular Monto Actualizado
  console.log('Paso 9: Calculando monto actualizado');
  const calculoMontoActualizado = aporteActualizado - aportePorcentaje;
  const montoActualizado = calculoMontoActualizado < 0 ? 0 : calculoMontoActualizado;
  console.log('Paso 9 - Monto Actualizado calculado:', montoActualizado);

  // 10. Calcular 1% Multa por la No Presentación Planilla (solo si aplica)
  console.log('Paso 10: Calculando multa por no presentación');
  const fechaDeclaradaNormalized = new Date(fechaDeclaradaBolivia);
  fechaDeclaradaNormalized.setHours(0, 0, 0, 0);
  const fechaLimiteNormalized = new Date(fechaLimite);
  fechaLimiteNormalized.setHours(0, 0, 0, 0);
  const aplicaMultaNoPresentacion = fechaDeclaradaNormalized > fechaLimiteNormalized;
  const multaNoPresentacion = aplicaMultaNoPresentacion ? aportePorcentaje * 0.01 : 0;
  console.log('Paso 10 - Multa por No Presentación calculada:', multaNoPresentacion);

  // 11. Calcular Días de Retraso
  console.log('Paso 11: Calculando días de retraso');
  const fechaPagoNormalized = new Date(fechaPagoBolivia);
  fechaPagoNormalized.setHours(0, 0, 0, 0);
  const fechaInicioRetraso = new Date(fechaLimite); // Usar la fecha límite calculada
  fechaInicioRetraso.setHours(0, 0, 0, 0);
  
  let diasRetraso = 0;
  if (fechaPagoNormalized > fechaInicioRetraso) {
    const diferenciaEnMilisegundos = fechaPagoNormalized.getTime() - fechaInicioRetraso.getTime();
    diasRetraso = Math.ceil(diferenciaEnMilisegundos / (1000 * 60 * 60 * 24) -1 );
  }
  console.log('Paso 11 - Días de Retraso calculados:', diasRetraso);

  // 12. Calcular Intereses
  console.log('Paso 12: Calculando intereses');
  const intereses = (aporteActualizado * 0.0999 / 360) * diasRetraso;
  console.log('Paso 12 - Intereses calculados:', intereses);

  // 13. Calcular Multa s/Int. 10%
  console.log('Paso 13: Calculando multa sobre intereses');
  const multaSobreIntereses = intereses * 0.1;
  console.log('Paso 13 - Multa sobre Intereses calculada:', multaSobreIntereses);

  // 14. Calcular Total a Cancelar Parcial
  console.log('Paso 14: Calculando total a cancelar parcial');
  const totalACancelarParcial =
    aportePorcentaje +
    montoActualizado +
    multaNoPresentacion + // Siempre suma la multa si existe (no depende de dias_retraso)
    intereses +
    multaSobreIntereses;
  console.log('Paso 14 - Total a Cancelar Parcial calculado:', totalACancelarParcial);

  // 15. Calcular Total Multas
  console.log('Paso 15: Calculando total multas');
  const totalMultas = multaNoPresentacion + multaSobreIntereses;
  console.log('Paso 15 - Total Multas:', totalMultas);

  // 16. Calcular Total Tasa de Interés
  console.log('Paso 16: Calculando total tasa de interés');
  const totalTasaInteres = intereses;
  console.log('Paso 16 - Total Tasa de Interés:', totalTasaInteres);

  // 17. Calcular Total Aportes ASUSS
  console.log('Paso 17: Calculando total aportes ASUSS');
  const totalAportesAsuss = aportePorcentaje * 0.005;
  console.log('Paso 17 - Total Aportes ASUSS:', totalAportesAsuss);

  // 18. Calcular Total Aportes Ministerio de Salud
  console.log('Paso 18: Calculando total aportes Ministerio de Salud');
  const totalAportesMinSalud = aportePorcentaje * 0.05;
  console.log('Paso 18 - Total Aportes Ministerio de Salud:', totalAportesMinSalud);

  // 19. Calcular Total a Cancelar (sin duplicar multas e intereses)
  console.log('Paso 19: Calculando total a cancelar final');
  const totalACancelar =
    totalACancelarParcial + // Ya incluye todas las multas e intereses
    5 - // Form DS-08
    totalAportesAsuss -
    totalAportesMinSalud;
  console.log('Paso 19 - Total a Cancelar calculado (preliminar):', totalACancelar);

  // Devolver un objeto con todos los valores calculados
  return {
    total_importe: planilla.total_importe,
    aporte_porcentaje: aportePorcentaje,
    ufv_dia_formal: ufvDiaFormal,
    ufv_dia_presentacion: ufvDiaPresentacion,
    fecha_declarada: planilla.fecha_declarada,
    fecha_pago: fechaPagoPropuesta,
    aporte_actualizado: aporteActualizado,
    monto_actualizado: montoActualizado,
    multa_no_presentacion: multaNoPresentacion,
    dias_retraso: diasRetraso,
    intereses: intereses,
    multa_sobre_intereses: multaSobreIntereses,
    total_a_cancelar_parcial: totalACancelarParcial,
    total_multas: totalMultas,
    total_tasa_interes: totalTasaInteres,
    total_aportes_asuss: totalAportesAsuss,
    total_aportes_min_salud: totalAportesMinSalud,
    total_a_cancelar: totalACancelar,
  };
}

// 25 .- REPORTE DE APORTE DE PLANILLA ADICIONAL
async generarReportePlanillaAdicionalPorRegional(idPlanillaAdicional: number): Promise<StreamableFile> {
  try {
    // Obtener los datos ya procesados de obtenerDatosPlanillaAdicionalPorRegional
    const datosPlanilla = await this.obtenerDatosPlanillaAdicionalPorRegional(idPlanillaAdicional);

    if (!datosPlanilla || !datosPlanilla.planilla) {
      throw new Error('Planilla adicional no encontrada o sin datos');
    }

    // Obtener los datos de la planilla_aportes relacionada para obtener empresa y cod_patronal
    const planillaAporte = await this.planillaAporteRepo.findOne({
      where: { id_planilla_aportes: datosPlanilla.planilla.id_planilla_aportes },
    });

    if (!planillaAporte) {
      throw new Error('No se encontró la planilla de aportes relacionada para obtener empresa y código patronal');
    }

    // Configurar moment para español
    moment.locale('es');

    // Preparar los datos para el reporte
    const data = {
      planilla: {
        id_planilla_adicional: datosPlanilla.planilla.id_planilla_adicional,
        
        fecha_declarada: moment(datosPlanilla.planilla.fecha_declarada).format('DD/MM/YYYY'),
        fecha_pago: moment(datosPlanilla.planilla.fecha_pago).format('DD/MM/YYYY'),
        tipo_empresa: datosPlanilla.planilla.tipo_empresa,
        total_importe: datosPlanilla.planilla.total_importe,
        aporte_porce: datosPlanilla.planilla.aporte_porcentaje,
        // Obtenemos empresa y cod_patronal desde planillaAporte
        empresa: planillaAporte.empresa,
        total_trabaj: datosPlanilla.planilla.total_trabaj,
        com_nro: datosPlanilla.planilla.com_nro,
        patronal: planillaAporte.cod_patronal,
        mes: moment(planillaAporte.fecha_planilla).format('MMMM').toUpperCase(), // Ej: "ENERO"
        anio: moment(planillaAporte.fecha_planilla).format('YYYY'), // Ej: "2025"
      },
      resumen: datosPlanilla.resumen.map(region => ({
        regional: region.regional,
        cantidad: region.cantidad,
        total_ganado: region.total_ganado,
        porcentaje_10: region.porcentaje_10,
      })),
      totales: {
        cantidad_total: datosPlanilla.totales.cantidad_total,
        total_ganado: datosPlanilla.totales.total_ganado,
        porcentaje_10: datosPlanilla.totales.porcentaje_10,
      },
    };

    console.log('Datos para el reporte adicional por regional:', JSON.stringify(data, null, 2));

    // Ruta de la plantilla de Carbone
    const templatePath = path.resolve(
      'src/modules/planillas_adicionales/templates/resumen.docx',
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

          console.log('Reporte adicional por regional generado correctamente');

          if (typeof result === 'string') {
            result = Buffer.from(result, 'utf-8');
          }

          resolve(
            new StreamableFile(result, {
              type: 'application/pdf',
              disposition: `attachment; filename=reporte_planilla_adicional_regional_${idPlanillaAdicional}.pdf`,
            }),
          );
        },
      );
    });
  } catch (error) {
    throw new Error('Error en generarReportePlanillaAdicionalPorRegional: ' + error.message);
  }
}


}