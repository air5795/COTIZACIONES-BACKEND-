process.env.PATH = process.env.PATH + ':/usr/bin'; // Asegúrate de agregar '/usr/bin' al PATH

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanillaIncapacidadEntity } from '../entity/planilla-incapacidades.entity';
import { Repository } from 'typeorm';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { CreatePlanillaIncapacidadDto } from '../dto/planilla-incapacidad.dto';
import { ResponseUtil } from 'src/core/utility/response-util';
import { EmpleadoEntity } from 'src/modules/empleado/entity/empleado.entity';
import { TipoIncapacidadEntity } from 'src/modules/tipo-incapacidad/entity/tipo-incapacidad.entity';
import { PaginationQueryDto } from 'src/core/utility/pagination-query.dto';
import { transformaCamelCaseArrayObjeto } from 'src/core/utility/camel-case.util';
import * as carbone from 'carbone';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as libre from 'libreoffice-convert';
import { EmpresaService } from 'src/modules/empresa/services/empresa.service';

@Injectable()
export class PlanillaIncapacidadesService {
  constructor(
    @InjectRepository(PlanillaIncapacidadEntity)
    private readonly planillaIncapacidadesRepository: Repository<PlanillaIncapacidadEntity>,
    private readonly empresaService: EmpresaService,
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

  @CatchErrors()
  async createPlanillaIncapacidades(planillaDto: CreatePlanillaIncapacidadDto) {
    const createPlanilla =
      this.planillaIncapacidadesRepository.create(planillaDto);
    const respuesta = await this.planillaIncapacidadesRepository.save(
      createPlanilla,
    );
    if (!respuesta) {
      return ResponseUtil.error(
        'No se pudo crear la planilla de incapacidades',
      );
    }
    return ResponseUtil.success(respuesta, 'Registro creado exitosamente');
  }

  @CatchErrors()
  async findAllPlanillaIncapacidadesByEmpNpatronal(
    empNpatronal: string,
    idIncapacidad: number,
    fechaInicio: Date,
    fechaFin: Date,
    { limit, offset }: PaginationQueryDto, // Asegúrate de importar PaginationQueryDto
  ) {
    const query = `
    SELECT DISTINCT 
      pin.id_planilla_incapacidad,
      pin.matricula,
      pin.nombre_completo,
      TO_CHAR (pin.baja_medica_ini, 'DD/MM/YYYY') AS baja_medica_ini,
      TO_CHAR (pin.baja_medica_fin, 'DD/MM/YYYY') AS baja_medica_fin,
      pin.dias_incapacidad_inicial,
      pin.dia,
      pin.total_ganado_mensual,
      pin.total_dia,
      pin.total,
      pin.dia_cbes,
      pin.total_porcentaje_cubrir,
      TO_CHAR (pin.fecha_cotizacion_del, 'DD/MM/YYYY') AS fecha_cotizacion_del,
      TO_CHAR (pin.fecha_cotizacion_al, 'DD/MM/YYYY') AS fecha_cotizacion_al,
      pin.estado,
      e.ase_ci
    FROM planilla_incapacidad pin
    INNER JOIN empleado e ON pin.id_empleado = e.id_empleado 
    INNER JOIN empresa em ON e.id_empresa = em.id_empresa 
    INNER JOIN planilla_incapacidad pinca ON pin.id_tipo_incapacidad = pinca.id_tipo_incapacidad 
    WHERE e.emp_npatronal = $1 AND pinca.id_tipo_incapacidad = $2
    AND pin.fecha_cotizacion_del BETWEEN $3 AND $4
    LIMIT $5 OFFSET $6;`;
    const planillaIncapacidad =
      await this.planillaIncapacidadesRepository.query(query, [
        empNpatronal,
        idIncapacidad,
        fechaInicio,
        fechaFin,
        limit,
        (offset - 1) * limit,
      ]);

    const countQuery = `
      select count(DISTINCT pin.*)
      FROM planilla_incapacidad pin
      INNER JOIN empleado e ON pin.id_empleado = e.id_empleado 
      INNER JOIN empresa em ON e.id_empresa = e.id_empresa 
      inner join planilla_incapacidad pinca on pin.id_tipo_incapacidad = pinca.id_tipo_incapacidad 
      WHERE e.emp_npatronal = $1 and pinca.id_tipo_incapacidad = $2
      AND pin.fecha_cotizacion_del BETWEEN $3 AND $4;`;
    const result = await this.planillaIncapacidadesRepository.query(
      countQuery,
      [empNpatronal, idIncapacidad, fechaInicio, fechaFin],
    );
    const total = result[0].count;
    return ResponseUtil.success({
      data: transformaCamelCaseArrayObjeto(planillaIncapacidad),
      count: total,
      page: offset,
      pageSize: limit,
    });
  }

  @CatchErrors()
  async generatePdfFromOdtPlanillaIncapacidades(
    empNpatronal: string,
    idIncapacidad: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<Buffer> {
    const templatePath = path.resolve(
      'src/modules/planilla-incapacidades/services/planilla-incapacidades.odt', // Ruta de la plantilla
    );
    const tempPdfPath = path.resolve(
      'src/modules/planilla-incapacidades/services/tmp/planilla-incapacidades.pdf', // Ruta temporal del PDF
    );

    if (!fs.existsSync(path.dirname(tempPdfPath))) {
      fs.mkdirSync(path.dirname(tempPdfPath), { recursive: true });
    }

    try {
      const ResnPatronal: any =
        await this.empresaService.findEmpresaByNumeroPatronal(empNpatronal);

      if (!ResnPatronal.status || !ResnPatronal.data) {
        throw new Error('Empresa no encontrada o datos no disponibles');
      }

      const empresa = ResnPatronal.data.empNom; // Esto ahora es válido y sin errores

      //  datos de la base de datos
      const query = `
      SELECT DISTINCT 
      pin.id_planilla_incapacidad,
      pin.matricula,
      pin.nombre_completo,
      TO_CHAR(pin.baja_medica_ini, 'DD/MM/YYYY') AS baja_medica_ini,
      TO_CHAR(pin.baja_medica_fin, 'DD/MM/YYYY') AS baja_medica_fin,
      pin.dias_incapacidad_inicial,
      pin.dia,
      pin.total_ganado_mensual,
      pin.total_dia,
      pin.total,
      pin.dia_cbes,
      pin.total_porcentaje_cubrir,
      TO_CHAR(pin.fecha_cotizacion_del, 'DD/MM/YYYY') AS fecha_cotizacion_del,
      TO_CHAR(pin.fecha_cotizacion_al, 'DD/MM/YYYY') AS fecha_cotizacion_al,
      pin.estado,
      e.ase_ci,
      pinca.id_tipo_incapacidad
    FROM planilla_incapacidad pin
    INNER JOIN empleado e ON pin.id_empleado = e.id_empleado 
    INNER JOIN empresa em ON e.id_empresa = em.id_empresa 
    INNER JOIN planilla_incapacidad pinca ON pin.id_tipo_incapacidad = pinca.id_tipo_incapacidad 
    WHERE e.emp_npatronal = $1
    AND pin.fecha_cotizacion_del BETWEEN $2 AND $3;
      `;

      const planillaIncapacidad =
        await this.planillaIncapacidadesRepository.query(query, [
          empNpatronal,
          fechaInicio,
          fechaFin,
        ]);

      // Paso 2: Procesar los datos obtenidos
      const data = planillaIncapacidad.map((incapacidad) => ({
        id_planilla_incapacidad: incapacidad.id_planilla_incapacidad || '',
        matricula: incapacidad.matricula || '',
        nombre_completo: incapacidad.nombre_completo || '',
        baja_medica_ini: incapacidad.baja_medica_ini || '',
        baja_medica_fin: incapacidad.baja_medica_fin || '',
        dias_incapacidad_inicial: incapacidad.dias_incapacidad_inicial || '',
        dia: incapacidad.dia || '',
        total_ganado_mensual: incapacidad.total_ganado_mensual || '',
        total_dia: incapacidad.total_dia || '',
        total: incapacidad.total || '',
        dia_cbes: incapacidad.dia_cbes || '',
        total_porcentaje_cubrir: incapacidad.total_porcentaje_cubrir || '',
        fecha_cotizacion_del: incapacidad.fecha_cotizacion_del || '',
        fecha_cotizacion_al: incapacidad.fecha_cotizacion_al || '',
        estado: incapacidad.estado || '',
        ase_ci: incapacidad.ase_ci || '',
        emp_npatronal: empNpatronal || '',
        id_tipo_incapacidad: incapacidad.id_tipo_incapacidad || '',
      }));

      if (!data || data.length === 0) {
        throw new Error(
          'No se encontraron datos para la planilla de incapacidades',
        );
      }

      // Paso 3: Agrupar por id_tipo_incapacidad con nombres descriptivos
      const tipoIncapacidadMap = {
        1: 'ENFERMEDAD COMUN',
        2: 'MATERNIDAD',
        3: 'RIESGOS PROFESIONALES - ACCIDENTES DE TRABAJO',
        4: 'RIESGOS PROFESIONALES - ENFERMEDAD PROFESIONAL',
      };

      const groupedData: Record<string, any[]> = {};
      data.forEach((item) => {
        const grupoNombre =
          tipoIncapacidadMap[item.id_tipo_incapacidad] || 'OTRO';
        if (!groupedData[grupoNombre]) {
          groupedData[grupoNombre] = [];
        }
        groupedData[grupoNombre].push(item);
      });

      const empNpatronalGlobal = empNpatronal; // Valor único para todos los grupos

      // Procesar los datos agrupados y calcular la suma de total_porcentaje_cubrir de cada grupo
      const planillaData = Object.keys(groupedData).map((grupoNombre) => {
        const data = groupedData[grupoNombre].map((item, index) => ({
          index: index + 1, // Índice dentro del grupo
          ...item, // Mantener las propiedades originales
        }));

        // Calcular la suma de total_porcentaje_cubrir para este grupo
        const totalPorcentajeCubrir = data.reduce((sum, item) => {
          return sum + parseFloat(item.total_porcentaje_cubrir || '0');
        }, 0);

        return {
          grupo: grupoNombre, // Nombre descriptivo del grupo
          total_porcentaje_cubrir: totalPorcentajeCubrir.toFixed(2), // Suma total con 2 decimales
          data,
        };
      });

      // Calcular la suma total de total_porcentaje_cubrir para todos los grupos
      const totalPorcentajeCubrirGlobal = planillaData.reduce((sum, grupo) => {
        return sum + parseFloat(grupo.total_porcentaje_cubrir || '0');
      }, 0);

      // Construir el objeto final datosPlantilla
      const datosPlantilla = {
        empresa: empresa,
        emp_npatronal: empNpatronalGlobal,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        total_porcentaje_cubrir_global: totalPorcentajeCubrirGlobal.toFixed(2),
        planilla_data: planillaData,
      };

      // **Verificación de los datos en la consola incluyendo la suma global:**
      console.log(`EMP NPatronal Global: ${datosPlantilla.emp_npatronal}`);
      console.log(
        `Total Porcentaje Cubrir Global: ${datosPlantilla.total_porcentaje_cubrir_global}`,
      );
      datosPlantilla.planilla_data.forEach((grupo, index) => {
        console.log(`Grupo: ${grupo.grupo}`);
        console.log(
          `  Total Porcentaje Cubrir: ${grupo.total_porcentaje_cubrir}`,
        );
        grupo.data.forEach((registro, i) => {
          console.log(
            `    Registro ${i + 1}:`,
            JSON.stringify(registro, null, 2),
          );
        });
      });

      console.log(
        'DATOS QUE SE CARGAN EN LA PLANTILLA ==>',
        JSON.stringify(datosPlantilla, null, 2),
      );

      // Paso 4: Generar el PDF con Carbone
      const renderPromise = new Promise<Buffer>((resolve, reject) => {
        carbone.render(
          templatePath,
          datosPlantilla,
          { convertTo: 'pdf' },
          (err, result) => {
            if (err)
              return reject(`Error al generar el reporte con Carbone: ${err}`);

            if (typeof result === 'string') {
              result = Buffer.from(result, 'utf-8'); // Convierte el string a Buffer
            }

            resolve(result); // Ahora result es un Buffer
          },
        );
      });

      return await Promise.race([renderPromise, this.timeout(30000)]); // Timeout de 30 segundos
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      throw new Error(`Error en la generación del reporte: ${error.message}`);
    }
  }
}
