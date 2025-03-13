import { Injectable, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanillasAdicionale } from './entities/planillas_adicionale.entity';
import { PlanillaAdicionalDetalles } from './entities/planillas_adicionales_detalles.entity';
import { PlanillasAporte } from '../planillas_aportes/entities/planillas_aporte.entity'; // Asegúrate de que esta ruta sea correcta
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

    @InjectRepository(PlanillasAporte)
    private planillaAporteRepo: Repository<PlanillasAporte>,
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
  async guardarPlanillaAdicional(id_planilla_aportes: number, data: any[], motivo_adicional: string) {
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
      total_importe: totalImporte,
      total_trabaj: totalTrabaj, 
      estado: 0, 
      motivo_adicional,
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
  // 3 .- ACTUALIZAR DETALLES PLANILLA ADICIONAL  
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
          'planilla.motivo_adicional', // Campo específico de planillas adicionales
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
          'motivo_adicional', // Campo específico de planillas adicionales
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



}