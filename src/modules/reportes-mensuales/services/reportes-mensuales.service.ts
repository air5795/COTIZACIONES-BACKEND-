import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportesMensualesEntity } from '../entity/reportes-mensuales.entity';
import { Repository } from 'typeorm';
import { CreateReporteMensualDto } from '../dto/reportes-mensuales.dto';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { ResponseUtil } from '../../../core/utility/response-util';
import * as path from 'path';
import * as carbone from 'carbone';
import { transformaCamelCaseArrayObjeto } from 'src/core/utility/camel-case.util';

@Injectable()
export class ReportesMensualesService {
  constructor(
    @InjectRepository(ReportesMensualesEntity)
    private reportesMensualesRepository: Repository<ReportesMensualesEntity>,
  ) {}

  //@CatchErrors()
  async create(createDto: CreateReporteMensualDto) {
    const reporteMensual = this.reportesMensualesRepository.create(createDto);
    console.log('create');
    console.log(reporteMensual);
    const respuesta = await this.reportesMensualesRepository.save(
      reporteMensual,
    );
    if (respuesta) {
      return ResponseUtil.success(
        respuesta,
        'Reporte mensual creado exitosamente',
      );
    }
    return ResponseUtil.error('Error en la generacion del reporte');
  }

  @CatchErrors()
  async generarInformacionReporte(
    empatronal: string,
    periodo: number,
    gestion: number,
  ) {
    //console.log('generando reporte');
    const dtoReporteMensual = new CreateReporteMensualDto();
    const query = `WITH DatosEmpleado AS (
        SELECT 
            empleado.id_empleado,
            empleado.ase_mat,
            empleado.ase_ci,
            planilla.cargo,
            empleado.ase_fec_afi,
            empleado.ase_fini_emp,
            planilla.fecha_retiro,
            planilla.id_planilla,
            planilla.dias_trabajados,
            planilla.total_ganado,
            planilla.total_descuento,
            planilla.observaciones,
            planilla.periodo,
            planilla.gestion,
            empresa.emp_nom,
            empresa.sub_emp_nom,
            empresa.emp_legal,
            empresa.emp_activ,
            empresa.emp_num,
            empresa.emp_telf,
            empresa.emp_zona,
            empresa.emp_localidad,
            empresa.emp_fini_act,
            empresa.emp_lug,
            empresa.emp_estado,
            empresa.tipo,
            empresa.emp_nom_corto,
            empresa.emp_npatronal,
            empresa.emp_nit
        FROM empleado
        INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
        INNER JOIN planilla ON planilla.id_empleado = empleado.id_empleado
        WHERE empresa.emp_npatronal = $1
        AND planilla.periodo = $2
        AND planilla.gestion = $3
    ),
    Agregados AS (
        SELECT 
            SUM(total_ganado) AS suma_total_ganado,
            SUM(total_descuento) AS suma_total_descuento,
            COUNT(DISTINCT id_empleado) AS cantidad_empleados
        FROM DatosEmpleado
    )
    SELECT 
        a.suma_total_ganado,--total salarios
        a.suma_total_descuento,
        a.cantidad_empleados,--numero de trabajadores
        e.emp_nom,--razon social
        e.sub_emp_nom,
        e.emp_legal,
        e.emp_activ,
        e.emp_num,
        e.emp_telf,--telefono
        e.emp_zona,--domicilio legal
        e.emp_localidad,--domicilio legal
        e.emp_fini_act,
        e.emp_lug,--domicilio legal
        e.emp_estado,
        e.tipo,
        e.emp_nom_corto,
        e.emp_npatronal,--emp-patronal
        e.emp_nit--emp nit
    FROM Agregados a, DatosEmpleado e
    LIMIT 1;
    `;

    const result = await this.reportesMensualesRepository.query(query, [
      empatronal,
      periodo,
      gestion,
    ]);

    if (result.length === 0) {
      return ResponseUtil.error('El estado del reporte no esta en APROBADO');
    }

    dtoReporteMensual.razonSocial = result[0].emp_nom;
    dtoReporteMensual.domicilioLegal = result[0].emp_zona; // completar con los demas campos de la tabla empresa
    dtoReporteMensual.telefono = result[0].emp_telf;
    dtoReporteMensual.numeroPatronal = result[0].emp_npatronal;
    dtoReporteMensual.nit = result[0].emp_nit;
    dtoReporteMensual.periodo = periodo;
    dtoReporteMensual.gestion = gestion;
    dtoReporteMensual.numeroTrabajadores = result[0].cantidad_empleados;
    dtoReporteMensual.totalSalarios = result[0].suma_total_ganado;
    dtoReporteMensual.cotizacion = result[0].suma_total_descuento;
    dtoReporteMensual.totalImporte = result[0].suma_total_ganado; //TODO:Hay que revisar las variables

    const crearReporteMensual = await this.create(dtoReporteMensual);

    if (crearReporteMensual.status === true) {
      return ResponseUtil.success(
        crearReporteMensual.data,
        'Reporte mensual creado exitosamente',
      );
    }
  }
  @CatchErrors()
  async buscarReporte(empatronal: string, periodo: number, gestion: number) {
    const reporte = await this.reportesMensualesRepository.findOne({
      where: { numeroPatronal: empatronal, periodo, gestion },
    });
    console.log('buscar reporte');
    console.log(reporte);
    if (reporte) {
      console.log('ingresa al generar reporte');
      return this.generatePDFWithCarbone(reporte);
    }
    const informacionReporte = await this.generarInformacionReporte(
      empatronal,
      periodo,
      gestion,
    );
    console.log('genera informacion reporte');
    console.log(informacionReporte);
    if (informacionReporte.status === false) {
      return ResponseUtil.error(
        'No se encontraron datos para generar el reporte',
      );
    }
    return this.generatePDFWithCarbone(informacionReporte.data);
  }

  private async generatePDFWithCarbone(data: any): Promise<Buffer | null> {
    const templatePath = path.join(
      __dirname,
      '../../../../assets/report-aportes-mensuales.odt',
    );

    return new Promise((resolve, reject) => {
      const options = {
        convertTo: 'pdf',
      };

      carbone.render(templatePath, data, options, (err, result) => {
        if (err) {
          reject(null);
        } else {
          resolve(result as Buffer);
        }
      });
    });
  }
}
