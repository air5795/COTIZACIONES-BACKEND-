import { Injectable, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanillasAporte } from './entities/planillas_aporte.entity';
import { PlanillaAportesDetalles } from './entities/planillas_aportes_detalles.entity';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as carbone from 'carbone';



@Injectable()
export class PlanillasAportesService {
  constructor(
    @InjectRepository(PlanillasAporte)
    private planillaRepo: Repository<PlanillasAporte>,

    @InjectRepository(PlanillaAportesDetalles)
    private detalleRepo: Repository<PlanillaAportesDetalles>,
  ) {}

    // Timeout manual (en milisegundos)
    private timeout(ms: number): Promise<never> {
      return new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'El tiempo de espera para procesar la solicitud ha expirado',
              ),
            ),
          ms,
        ),
      );
    }

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

  async guardarPlanilla(data: any[], cod_patronal: string, gestion: string , mes: string, empresa: string,) {
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
        gestion,
        mes,
        empresa,
        total_importe: totalImporte,
        total_trabaj: totalTrabaj,
        estado: 1, // Pendiente (1) 
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
        salario: parseFloat(row['Haber Básico'].toString()) || 0,
        regional: row['regional'],
    }));

    await this.detalleRepo.save(detalles);

    return { mensaje: '✅ Planilla guardada con éxito', id_planilla: planillaGuardada.id_planilla_aportes };
}

async actualizarDetallesPlanilla(id_planilla: number, data: any[]) {
  // Verificar si la planilla existe
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
      throw new BadRequestException('❌ La planilla no existe.');
  }

  // ⚠️ 🔥 SOLO MODIFICAMOS LOS DETALLES, NO LA TABLA PRINCIPAL 🔥 ⚠️

  // Filtrar datos vacíos en el backend
  const datosValidos = data.filter(row => 
      row['Número documento de identidad'] && row['Nombres'] && row['Haber Básico']
  );

  if (datosValidos.length === 0) {
      throw new BadRequestException('❌ No se encontraron registros válidos en el archivo.');
  }

  // Eliminar los detalles anteriores
  await this.detalleRepo.delete({ id_planilla_aportes: id_planilla });

  // Calcular el total del importe sumando los salarios
  const totalImporte = datosValidos.reduce((sum, row) => sum + parseFloat(row['Haber Básico'] || 0), 0);

  // Calcular el número total de trabajadores
  const totalTrabaj = datosValidos.length;

  // Guardar los nuevos detalles de la planilla
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
      fecha_retiro: row['Fecha Retiro'] ? new Date(1900, 0, row['Fecha Retiro'] - 1) : null,
      dias_pagados: row['Días pagados'] || 0,
      salario: row['Haber Básico'] ? parseFloat(row['Haber Básico'].toString()) || 0 : 0,
      regional: row['regional'] || '',
  }));

  await this.detalleRepo.save(nuevosDetalles);

  // 🔥 Solo actualizamos los campos necesarios en `planillas_aportes`, sin crear un nuevo registro
  planilla.total_importe = totalImporte;
  planilla.total_trabaj = totalTrabaj;

  await this.planillaRepo.save(planilla);

  return { 
      mensaje: '✅ Detalles de la planilla actualizados con éxito',
      total_importe: totalImporte,
      total_trabajadores: totalTrabaj
  };
}






async obtenerHistorial(cod_patronal: string) {
  const planillas = await this.planillaRepo.find({
    where: { cod_patronal },
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
        'fecha_creacion'
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

// Método para eliminar detalles de una planilla

async eliminarDetallesPlanilla(id_planilla: number) {
  // Verificar si la planilla existe
  const planilla = await this.planillaRepo.findOne({ where: { id_planilla_aportes: id_planilla } });

  if (!planilla) {
      throw new BadRequestException('La planilla no existe.');
  }

  // Eliminar los detalles de la planilla (pero no la cabecera)
  await this.detalleRepo.delete({ id_planilla_aportes: id_planilla });

  return { mensaje: '✅ Detalles de la planilla eliminados con éxito' };
}





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

// OBTENER  DETALLES DE PLANILLA POR MES Y GESTION

async obtenerDetallesDeMes(cod_patronal: string, mes: string, gestion: string) {
  const planilla = await this.planillaRepo.findOne({
    where: { cod_patronal, mes, gestion }
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
  // Comparar planillas con correcciOn de bajas repetidas

 /*  async compararPlanillas(cod_patronal: string, mesAnterior: string, gestion: string, mesActual: string) {
    // Obtener los detalles de las planillas de los dos meses
    const detallesMesAnterior = await this.obtenerDetallesDeMes(cod_patronal, mesAnterior, gestion);
    const detallesMesActual = await this.obtenerDetallesDeMes(cod_patronal, mesActual, gestion);
  
    const altas = [];
    const bajas = [];
  
    // Crear un mapa de los trabajadores del mes anterior basado en su CI
    const trabajadoresMesAnterior = new Map(
      detallesMesAnterior.map(trabajador => [trabajador.ci, trabajador])
    );
  
    // Crear un mapa de los trabajadores del mes actual basado en su CI
    const trabajadoresMesActual = new Map(
      detallesMesActual.map(trabajador => [trabajador.ci, trabajador])
    );
  
    // Detectar altas: trabajadores en el mes actual que no están en el mes anterior
    detallesMesActual.forEach(trabajadorActual => {
      if (!trabajadoresMesAnterior.has(trabajadorActual.ci)) {
        altas.push(trabajadorActual);
      }
    });
  
    // Detectar bajas: trabajadores en el mes anterior que no están en el mes actual
    detallesMesAnterior.forEach(trabajadorAnterior => {
      if (!trabajadoresMesActual.has(trabajadorAnterior.ci)) {
        bajas.push(trabajadorAnterior);
      }
    });

    console.log('Bajas detectadas:', bajas);
  
    return {
      altas,
      bajas,
      mensaje: 'Comparación de planillas completada con corrección de bajas repetidas',
    };
  } */

    async compararPlanillas(cod_patronal: string, mesAnterior: string, gestion: string, mesActual: string) {

      // Si el mes anterior es diciembre, restar un año a la gestión
      const gestionMesAnterior = mesAnterior === "DICIEMBRE" ? (parseInt(gestion) - 1).toString() : gestion;
    
      console.log(`Comparando planillas para:
        - Cod Patronal: ${cod_patronal}
        - Gestión Mes Anterior: ${gestionMesAnterior}
        - Mes Anterior: ${mesAnterior}
        - Gestión Mes Actual: ${gestion}
        - Mes Actual: ${mesActual}`);
    
      // Obtener los detalles de las planillas de los dos meses
      const detallesMesAnterior = await this.obtenerDetallesDeMes(cod_patronal, mesAnterior, gestionMesAnterior);
      const detallesMesActual = await this.obtenerDetallesDeMes(cod_patronal, mesActual, gestion);
    
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
      const bajas = [];
    
      // Crear un mapa de los trabajadores del mes anterior basado en su CI
      const trabajadoresMesAnterior = new Map(
        detallesMesAnterior.map(trabajador => [trabajador.ci, trabajador])
      );
    
      // Crear un mapa de los trabajadores del mes actual basado en su CI
      const trabajadoresMesActual = new Map(
        detallesMesActual.map(trabajador => [trabajador.ci, trabajador])
      );
    
      // Detectar altas: trabajadores en el mes actual que no están en el mes anterior
      detallesMesActual.forEach(trabajadorActual => {
        if (!trabajadoresMesAnterior.has(trabajadorActual.ci)) {
          altas.push(trabajadorActual);
        }
      });
    
      // Detectar bajas
      detallesMesAnterior.forEach(trabajadorAnterior => {
        const trabajadorActual = trabajadoresMesActual.get(trabajadorAnterior.ci);
    
        if (!trabajadorActual) {
          // Si el trabajador no está en el mes actual, es una baja
          bajas.push(trabajadorAnterior);
        } else if (trabajadorActual.fecha_retiro) {
          // Si el trabajador tiene fecha de retiro en el mes actual
          const fechaRetiroActual = new Date(trabajadorActual.fecha_retiro);
    
          // Verificar si la fecha de retiro es dentro del mes actual
          const mesActualInicio = new Date(`${gestion}-${mesActual}-01`);
          const mesActualFin = new Date(mesActualInicio);
          mesActualFin.setMonth(mesActualFin.getMonth() + 1);
    
          console.log('Fecha de retiro actual:', fechaRetiroActual);
          console.log('Mes actual inicio:', mesActualInicio);
          console.log('Mes actual fin:', mesActualFin);
    
          if (fechaRetiroActual >= mesActualInicio && fechaRetiroActual < mesActualFin) {
            // Si la fecha de retiro es dentro del mes actual, es una baja en el mes actual
            bajas.push(trabajadorActual);
          }
        }
      });
    
      console.log('Altas detectadas:', altas);
      console.log('Bajas detectadas:', bajas);
    
      return {
        altas,
        bajas,
        mensaje: 'Comparación de planillas completada con corrección de bajas repetidas',
      };
    }
    

// Método para generar el reporte de bajas con Carbone

async generarReporteBajas(
  id_planilla: number,
  cod_patronal: string,
  mesAnterior: string,
  mesActual: string,
  gestion: string
): Promise<StreamableFile> {
  try {
    // Obtener la información de la planilla
    const resultadoPlanilla = await this.obtenerPlanilla(id_planilla);
    const planilla = resultadoPlanilla.planilla;

    // Obtener las bajas para los meses comparados
    const { bajas } = await this.compararPlanillas(
      cod_patronal,
      mesAnterior,
      gestion,
      mesActual
    );

    // Verificar si hay bajas
    if (bajas.length === 0) {
      throw new Error('No se encontraron bajas para generar el reporte.');
    }

    // Agrupar las bajas por regional
    const bajasPorRegional = bajas.reduce((acc, baja) => {
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

    // Convertir a un array de regiones para el JSON final
    const data = {
      planilla: {
        com_nro: planilla.com_nro,
        cod_patronal: planilla.cod_patronal,
        empresa: planilla.empresa,
        mes: planilla.mes,
        gestion: planilla.gestion,
        total_trabaj: planilla.total_trabaj,
        total_importe: planilla.total_importe,
        estado: planilla.estado,
        fecha_creacion: planilla.fecha_creacion,
        usuario_creacion: planilla.usuario_creacion,
      },
      reporte: Object.values(bajasPorRegional), // Ahora "reporte" solo tiene las bajas agrupadas por regional
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
        data, // ✅ Enviar directamente el JSON
        { convertTo: 'pdf' },
        (err, result) => {
          if (err) {
            console.error('Error en Carbone:', err);
            return reject(new Error(`Error al generar el reporte con Carbone: ${err}`));
          }

          console.log('Reporte generado correctamente');

          if (typeof result === 'string') {
            result = Buffer.from(result, 'utf-8'); // Convierte el string a Buffer
          }

          // Devolver el archivo como un StreamableFile
          resolve(new StreamableFile(result, {
            type: 'application/pdf',
            disposition: `attachment; filename=reporte_bajas_${cod_patronal}_${mesAnterior}_${mesActual}_${gestion}.pdf`,
          }));
        }
      );
    });
  } catch (error) {
    // Capturar y manejar la excepción
    throw new Error('Error en generarReporteBajas: ' + error.message);
  }
}


async generarReportePlanillaPorRegional(
  id_planilla: number
): Promise<StreamableFile> {
  try {
    // Obtener la información de la planilla y sus detalles
    const resultadoPlanilla = await this.obtenerPlanilla(id_planilla);
    const detallesPlanilla = await this.obtenerDetalles(id_planilla);

    if (!detallesPlanilla.trabajadores.length) {
      throw new Error('No se encontraron trabajadores para generar el reporte.');
    }

    // Extraer la información de la planilla
    const planilla = resultadoPlanilla.planilla;

    // Variables para la sección "totales"
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
      cantidad: formatNumber(region.cantidad),  // Formato correcto
      total_ganado: formatNumber(region.total_ganado),  // Formato correcto
      porcentaje_10: formatNumber(region.porcentaje_10)  // Formato correcto
    }));

    const formattedTotales = {
      cantidad_total: formatNumber(totales.cantidad_total),  // Formato correcto
      total_ganado: formatNumber(totales.total_ganado),  // Formato correcto
      porcentaje_10: formatNumber(totales.porcentaje_10)  // Formato correcto
    };

    // Estructura final del JSON con los totales separados y formato correcto
    const data = {
      mensaje: 'Detalles obtenidos con éxito',
      planilla: planilla,
      resumen: formattedResumen,
      totales: formattedTotales
    };

    console.log('Datos para el reporte:', JSON.stringify(data, null, 2));

    // Ruta de la plantilla de reporte en ODT
    const templatePath = path.resolve(
      'src/modules/planillas_aportes/templates/resumen.docx',
    );

    // Generar el reporte con Carbone
    return new Promise<StreamableFile>((resolve, reject) => {
      carbone.render(
        templatePath,
        data, // ✅ JSON con la estructura correcta y valores formateados
        { convertTo: 'pdf' },
        (err, result) => {
          if (err) {
            console.error('Error en Carbone:', err);
            return reject(new Error(`Error al generar el reporte con Carbone: ${err}`));
          }

          console.log('Reporte generado correctamente');

          if (typeof result === 'string') {
            result = Buffer.from(result, 'utf-8'); // Convertir el string a Buffer
          }

          // Devolver el archivo como un StreamableFile con nombre basado en la planilla
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









}
