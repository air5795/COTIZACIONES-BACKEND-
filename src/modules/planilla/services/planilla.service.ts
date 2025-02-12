import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanillaEntity } from '../entity/planilla.entity';
import { Repository } from 'typeorm';
import {
  CreatePlanillaDto,
  UpdatePlanillaMasivaDto,
  UpdatePlanillaDto,
} from '../dto/planilla.dto';
import { ResponseUtil } from 'src/core/utility/response-util';
import { TasaInteresAporteService } from 'src/modules/tasa-interes-aporte/services/tasa-interes-aporte.service';
import { EmpleadoService } from 'src/modules/empleado/services/empleado.service';
import { EmpleadoEntity } from 'src/modules/empleado/entity/empleado.entity';
import { UpdateEmpleadoDto } from '../../empleado/dto/empleado.dto';
import { SalarioMinimoService } from 'src/modules/salario-minimo/services/salario-minimo.service';
import { TipoPlanillaEntity } from 'src/modules/tipo-planilla/entity/tipo-planilla.entity';
import { TasaInteresAporteEntity } from 'src/modules/tasa-interes-aporte/entity/tasa-interes-aporte.entity';
import { SalarioMinimoEntity } from 'src/modules/salario-minimo/entity/salario-minimo.entity';
import { IApiResponse } from 'src/core/utility/response.interface';
import { ITasaInteresAporte } from 'src/modules/tasa-interes-aporte/interfaces/tasa-interes-aporte.interface';
import { PaginationQueryDto } from 'src/core/utility/pagination-query.dto';
import { EmpresaService } from 'src/modules/empresa/services/empresa.service';
import { transformaCamelCaseArrayObjeto } from 'src/core/utility/camel-case.util';
import { UpdatePlanillaEmpresaDto } from 'src/modules/planilla-empresa/dto/planilla-empresa.dto';
import { PlanillaEmpresaService } from 'src/modules/planilla-empresa/services/planilla-empresa.service';
import { ExternalApiService } from 'src/modules/api-client/service/external-api.service';

import { Workbook } from 'exceljs';

import * as path from 'path';
import * as carbone from 'carbone';
carbone.set({ lang: 'en-us' });
import * as fs from 'fs';
import { obtenerNombreMes } from 'src/core/utility/mes.util';
import { ISalarioMinimo } from 'src/modules/salario-minimo/interfaces/salario-minimo.inteface';
import { EstadosPlanillas } from 'src/core/utility/estados-planilla.enum';
import { Estado } from 'src/core/utility/estados-registro.util';
import { formatearFecha } from 'src/core/utility/date-convert.utility';
import { IEmpresa } from 'src/modules/empresa/interfaces/empresa.interface';
import { IPlanillaEmpresa } from 'src/modules/planilla-empresa/interface/planilla-empresa.interface';
import * as ExcelJS from 'exceljs';
import { now, round } from 'lodash';
import { parseISO } from 'date-fns';
import * as moment from 'moment';

@Injectable()
export class PlanillaService {
  private readonly context = 'PlanillaService';
  constructor(
    @InjectRepository(PlanillaEntity)
    private planillaRepository: Repository<PlanillaEntity>,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    //private _apiExternaService: ExternalApiService,
    private tasaInteresAporteService: TasaInteresAporteService,
    private empleadoService: EmpleadoService,
    private salarioMinimoService: SalarioMinimoService,
    private empresaService: EmpresaService,
    private planillaEmpresaServices: PlanillaEmpresaService,
    private _apiExternaService: ExternalApiService,
  ) {
    if (!this._apiExternaService.getApiToken()) {
      this._apiExternaService.loginToExternalApi();
    }
  }
  //Metodo para un solo update de una planilla
  @CatchErrors()
  async update(
    id: number,
    updatePlanillaDto: CreatePlanillaDto,
  ): Promise<ResponseUtil> {
    const existingPlanilla = await this.planillaRepository.findOne({
      where: { idPlanilla: id },
    });
    if (!existingPlanilla) {
      ResponseUtil.error('Planilla no encontrada');
    }

    const updatedPlanilla = this.planillaRepository.merge(
      existingPlanilla,
      updatePlanillaDto,
    );
    const respuesta = await this.planillaRepository.save(updatedPlanilla);
    return ResponseUtil.success(respuesta, 'Planilla actualizada exitosamente');
  }
  //Metodo para realizar una modificaciones masivas de planillas
  async updateMasivo(
    updatePlanillaDtos: UpdatePlanillaMasivaDto[],
  ): Promise<any> {
    const errors = [];

    for (const dto of updatePlanillaDtos) {
      const existingPlanilla = await this.planillaRepository.findOne({
        where: { idPlanilla: dto.idPlanilla },
      });
      if (!existingPlanilla) {
        errors.push(`Planilla con ID ${dto.idPlanilla} no encontrada`);
        //continue;
        return ResponseUtil.error(
          `Errores en la actualización masiva: ${errors.join(', ')}`,
        );
      }
    }

    for (const dtoSave of updatePlanillaDtos) {
      const existingPlanilla = await this.planillaRepository.findOne({
        where: { idPlanilla: dtoSave.idPlanilla },
      });
      const updatedPlanilla = this.planillaRepository.merge(
        existingPlanilla,
        dtoSave,
      );
      await this.planillaRepository.save(updatedPlanilla);
    }

    return ResponseUtil.success('Planilla actualizadas exitosamente');
  }
  //Generador de planilla de aportes
  @CatchErrors()
  async generadorDePlanilla(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const existEmpresa = await this.empresaService.findOneEmpresaByNroPatronal(
      empNpatronal,
    );
    if (!existEmpresa.status) {
      return ResponseUtil.error('No se encontró la empresa');
    }

    const existPlanillaEmpresa = +(await this.validarNoDuplicidadPlanilla(
      empNpatronal,
      periodo,
      gestion,
    ));

    if (existPlanillaEmpresa > 0) {
      return ResponseUtil.error(
        `Ya existe una planilla generada con los datos ingresados periodo ${obtenerNombreMes(
          periodo,
        )} y gestión ${gestion} `,
      );
    }

    //Busca la empresa por el numero patronal en mi tabla alternativa planillaEmpresa
    const generadorPlanilla =
      await this.planillaEmpresaServices.getPlanillaEmpresaByEmpNpatronal(
        empNpatronal,
      );
    const tamanioPlanilla = +(generadorPlanilla.data as any[]).length;
    if (tamanioPlanilla == 0) {
      const respuesta = await this.createFirstPlanilla(
        empNpatronal,
        periodo,
        gestion,
      );
      if (respuesta.status) {
        return ResponseUtil.success(respuesta.message);
      }
    }

    const valores = await this.createPlanilla(empNpatronal, periodo, gestion);
    if (valores.length === 0) {
      return ResponseUtil.error('La Planilla anterior no fue aprobada');
    }
    return ResponseUtil.error('Registro de planilla exitoso');
  }

  //TODO:Lista los empleados por el numero patronal asignados en una planilla
  async findAllPlanilaEmpleadosByEmpNpatronal(
    empNpatronal: string,
    periodo: number,
    gestion: number,
    { limit, offset }: PaginationQueryDto,
  ) {
    const exitEmpresa = await this.empresaService.findOneEmpresaByNroPatronal(
      empNpatronal,
    );
    if (!exitEmpresa.status) {
      return ResponseUtil.error('No se encontró la empresa');
    }

    const query = `
      SELECT 
        pe.*,
        pl.*,
        to_char(pl.fecha_ingreso,'DD/MM/YYYY') AS fecha_ingreso,
        to_char(pl.fecha_retiro,'DD/MM/YYYY') AS fecha_retiro
      FROM planilla_empresa pe
      INNER JOIN planilla pl ON pe.id_planilla_empresa = pl.id_planilla_empresa
      WHERE pe.emp_npatronal = $1
      AND pe.periodo = $2
      AND pe.gestion = $3
      ORDER BY pl.id_planilla ASC
    `;

    const empleados = await this.planillaRepository.query(query, [
      empNpatronal,
      periodo,
      gestion,
    ]);

    if (empleados.length === 0) {
      return ResponseUtil.error(
        'No se encontraron empleados, no realizo el cargado masivo',
      );
    }

    const countQuery = `
      SELECT COUNT(*)
      FROM empleado
      INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
      INNER JOIN planilla ON planilla.id_empleado = empleado.id_empleado
      WHERE empresa.emp_npatronal = $1 
      AND planilla.periodo = $2 
      AND planilla.gestion = $3 
    `;

    const result = await this.planillaRepository.query(countQuery, [
      empNpatronal,
      periodo,
      gestion,
    ]);
    const total = result[0].count;

    return ResponseUtil.success({
      data: transformaCamelCaseArrayObjeto(empleados),
      count: total,
      page: offset,
      pageSize: limit,
    });
  }
  //TODO:Crea los registros de una planilla de sueldos que nunca ha generado la planilla
  @CatchErrors()
  async createFirstPlanilla(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const tazaInteresAporte: IApiResponse<ITasaInteresAporte> =
      await (this.tasaInteresAporteService.findTazaInteresVigente() as Promise<
        IApiResponse<ITasaInteresAporte>
      >);
    const salarioMinimo: IApiResponse<ISalarioMinimo> =
      await (this.salarioMinimoService.getSalarioMinimoVigente() as Promise<
        IApiResponse<ISalarioMinimo>
      >);

    const { data } = await this.empleadoService.findAllByNpatronal(
      empNpatronal,
    );

    const planillas = data.map((empleado) => {
      // Mapea cada empleado a un nuevo objeto PlanillaEntity
      const planilla = new PlanillaEntity();
      planilla.empleado = new EmpleadoEntity();
      planilla.tipoPlanillas = new TipoPlanillaEntity();
      planilla.tasaInteresAportes = new TasaInteresAporteEntity();
      planilla.salarioMinimo = new SalarioMinimoEntity();
      planilla.tipoPlanillas.idTipoPlanilla = 1; //TODO:hay que recibir por parametro el tipo planilla
      planilla.diasTrabajados = 0;
      planilla.cargo = empleado.aseCargo;
      planilla.fechaIngreso = empleado.aseFecAfi;
      planilla.totalGanado = +empleado.aseHaber;
      planilla.totalDescuento =
        +empleado.aseHaber * tazaInteresAporte.data.porcentaje;
      planilla.fecha = new Date();
      planilla.observaciones = '';
      planilla.aprobado = EstadosPlanillas.INICIALIZADO;
      planilla.tasaInteresAportes.idTasa = +tazaInteresAporte.data.idTasa;
      planilla.salarioMinimo.idSalarioMinimo =
        +salarioMinimo.data.idSalarioMinimo;
      planilla.gestion = gestion;
      planilla.periodo = periodo;
      planilla.empleado.idEmpleado = empleado.idEmpleado;
      return planilla;
    });
    const create = this.planillaRepository.save(planillas);
    if (!create) {
      ResponseUtil.error('No se pudo crear la planilla');
    }
    await this.planillaEmpresaServices.createPlanillaEmpresa(
      empNpatronal,
      periodo,
      gestion,
    );
    return ResponseUtil.success('Planilla encontrada');
  }
  //TODO:Crear una planilla de aportes
  @CatchErrors()
  async createPlanilla(empNpatronal: string, periodo: number, gestion: number) {
    let exitPlanilla = null;
    let empleadosNuevos = [];
    if (periodo === 1) {
      const periodoResta = 12;
      const gestionResta = gestion - 1;
      exitPlanilla = await this.obtenerPlanilaAnterior(
        empNpatronal,
        periodoResta,
        gestionResta,
      );
      empleadosNuevos = await this.obtenerEmpleadosVigentesNoIncluidosPlanilla(
        empNpatronal,
        periodoResta,
        gestionResta,
      );
    } else {
      const periodoResta = periodo - 1;
      exitPlanilla = await this.obtenerPlanilaAnterior(
        empNpatronal,
        periodoResta,
        gestion,
      );
      empleadosNuevos = await this.obtenerEmpleadosVigentesNoIncluidosPlanilla(
        empNpatronal,
        periodoResta,
        gestion,
      );
    }

    if (exitPlanilla.length === 0) {
      return exitPlanilla;
    }
    const tazaInteresAporte: IApiResponse<ITasaInteresAporte> =
      await (this.tasaInteresAporteService.findTazaInteresVigente() as Promise<
        IApiResponse<ITasaInteresAporte>
      >);
    const salarioMinimo: IApiResponse<ISalarioMinimo> =
      await (this.salarioMinimoService.getSalarioMinimoVigente() as Promise<
        IApiResponse<ISalarioMinimo>
      >);
    let fusionEmpleados = [];
    if (empleadosNuevos.length !== 0) {
      fusionEmpleados = [...exitPlanilla, ...empleadosNuevos];
    } else {
      fusionEmpleados = exitPlanilla;
    }

    const verificacion =
      await this.empleadoService.verificarEmpleadosAfiliaciones(
        empNpatronal,
        fusionEmpleados,
      );

    return verificacion;

    const planillas = fusionEmpleados.map((empleado) => {
      const planilla = new PlanillaEntity();
      planilla.empleado = new EmpleadoEntity();
      planilla.tipoPlanillas = new TipoPlanillaEntity();
      planilla.tasaInteresAportes = new TasaInteresAporteEntity();
      planilla.salarioMinimo = new SalarioMinimoEntity();

      planilla.tipoPlanillas.idTipoPlanilla = 1; // TODO: Recibir por parámetro, si es necesario
      planilla.fecha = new Date(); // Fecha actual para la creación de la planilla
      planilla.aprobado = 'INICIALIZADO'; // Estado inicial de la planilla
      planilla.gestion = gestion; // Asumiendo que 'gestion' es una variable disponible
      planilla.periodo = periodo; // Asumiendo que 'periodo' es una variable disponible

      // Verificar si es un empleado de la planilla anterior o un empleado nuevo
      if (empleado.idPlanilla) {
        // Empleado de la planilla anterior
        planilla.diasTrabajados = empleado.diasTrabajados;
        planilla.cargo = empleado.cargo;
        planilla.fechaIngreso = empleado.fechaIngreso;
        planilla.totalGanado = +empleado.totalGanado;
        planilla.totalDescuento = +empleado.totalDescuento;
        planilla.observaciones = empleado.observaciones;
      } else {
        // Empleado nuevo
        // Asignar valores por defecto o calcular según sea necesario
        planilla.diasTrabajados = 0; // Define un valor por defecto
        planilla.cargo = empleado.aseCargo; // Asumiendo que 'aseCargo' es el campo de cargo para los nuevos empleados
        planilla.fechaIngreso = empleado.aseFiniEmp || new Date(); // Si no hay fecha de ingreso, usar fecha actual
        planilla.totalGanado = +empleado.aseHaber || 0; // Usa 'aseHaber' o un valor por defecto
        planilla.totalDescuento = 0; // Define un valor por defecto para totalDescuento // Observación por defecto para nuevos empleados
      }

      // Configuraciones adicionales comunes a todos los empleados
      planilla.empleado.idEmpleado = empleado.idEmpleado;
      planilla.tasaInteresAportes.idTasa = +tazaInteresAporte.data.idTasa; // Asumiendo que esto está disponible
      planilla.salarioMinimo.idSalarioMinimo =
        +salarioMinimo.data.idSalarioMinimo; // Asumiendo que esto está disponible

      return planilla;
    });
    const valor = this.planillaRepository.create(planillas);
    const create = await this.planillaRepository.save(valor);
    if (!create) {
      return false;
    }
    await this.planillaEmpresaServices.createPlanillaEmpresa(
      empNpatronal,
      periodo,
      gestion,
    );
    return create;
  }
  /*
  Migración masiva de planillas en base al formato del ROE
  */
  @CatchErrors()
  async migrarPlanillas(
    mes: number,
    gestion: number,
    empPatronal: string,
    file: Express.Multer.File,
  ) {
    try {
      /**Validamos si es que ya se realizo la validacion**/
      const planillaVerificada =
        await this.planillaEmpresaServices.findPlanillaVerificada(
          mes,
          gestion,
          empPatronal,
        );
      if (planillaVerificada.status) {
        return ResponseUtil.error(planillaVerificada.message);
      }
      const empresa = await this.empresaService.findOne(empPatronal);
      if (!empresa.status) {
        return ResponseUtil.error(empresa.message);
      }
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.getWorksheet(1); //Lee la hoja 1 del archivo

      const safeToString = (value: any): string | null =>
        value !== null && value !== undefined && value !== ''
          ? value.toString()
          : null;
      /**Validamos que el formato el archivo sea el correcto**/
      // Validar la cabecera
      if (
        worksheet.getCell('B2').value !== 'CARNET IDENTIDAD' ||
        worksheet.getCell('C2').value !== 'COMPLEMENTO' ||
        worksheet.getCell('D2').value !== 'AP. PATERNO' ||
        worksheet.getCell('E2').value !== 'AP. MATERNO' ||
        worksheet.getCell('F2').value !== 'NOMBRES' ||
        worksheet.getCell('G2').value !== 'CARGO' ||
        worksheet.getCell('H2').value !== 'FECHA DE NACIMIENTO' ||
        worksheet.getCell('I2').value !== 'FECHA DE INGRESO' ||
        worksheet.getCell('J2').value !== 'FECHA DE RETIRO' ||
        worksheet.getCell('K2').value !== 'DIAS TRABAJADOS' ||
        worksheet.getCell('L2').value !== 'TOTAL GANADO'
      ) {
        return ResponseUtil.error(
          '!La cabecera del archivo no esta acorde al formato!',
        );
      }
      const data = [];
      worksheet.eachRow((row, rowNumber) => {
        // Saltar las filas anteriores a la 3
        if (rowNumber >= 3) {
          // Obtiene el valor de aseHaber desde la columna I
          const numberValue = Number(row.getCell(12).value);
          let fechaNacimiento = null;
          let fechaIngreso = null;
          let fechaRetiro = null;
          if (
            row.getCell(8).value &&
            typeof row.getCell(8).value === 'object'
          ) {
            fechaNacimiento = new Date(
              safeToString(row.getCell(8).value),
            ).toISOString();
          }
          if (
            row.getCell(9).value &&
            typeof row.getCell(9).value === 'object'
          ) {
            fechaIngreso = new Date(
              safeToString(row.getCell(9).value),
            ).toISOString();
          }
          if (
            row.getCell(10).value &&
            typeof row.getCell(10).value === 'object'
          ) {
            fechaRetiro = new Date(
              safeToString(row.getCell(10).value),
            ).toISOString();
          }

          const rowData = {
            idTipoPlanilla: 1,
            aseCi: safeToString(row.getCell(2).value),
            aseCiCom: safeToString(row.getCell(3).value),
            aseApat: safeToString(row.getCell(4).value),
            aseAmat: safeToString(row.getCell(5).value),
            aseNom: safeToString(row.getCell(6).value),
            aseFecNac: fechaNacimiento,
            diasTrabajados: safeToString(row.getCell(11).value),
            cargo: safeToString(row.getCell(7).value),
            fechaIngreso: fechaIngreso,
            fechaRetiro: fechaRetiro,
            totalGanado: safeToString(row.getCell(12).value),
            totalDescuento: round(numberValue * 0.1, 2),
            tasaInteresAportes: 1,
            salarioMinimo: 1,
            estadoRegistro: 'ESTADO_NO_VERIFICADO',
            gestion: gestion,
            periodo: mes,
          };
          data.push(rowData);
        }
      });
      //Si los datos a migrar son mayores a cero, se procede a crear la cabecera de la planilla
      if (data.length > 0) {
        const respuesta =
          await this.planillaEmpresaServices.createPlanillaEmpresa(
            empPatronal,
            mes,
            gestion,
          );
        if (!respuesta) {
          return ResponseUtil.error(
            '¡No se pudo crear la Planilla de la Empresa!',
          );
        }
        for (const registro of data) {
          try {
            registro.idPlanillaEmpresa = respuesta.data;
            const valor = this.planillaRepository.create(registro);
            await this.planillaRepository.save(valor);
          } catch (error) {
            console.error(
              `Error al procesar el registro: ${JSON.stringify(
                registro,
              )}. Error: ${error.message}`,
            );
          }
        }
        return ResponseUtil.success(
          data,
          'Migración Masiva registrada exitosamente',
        );
      } else {
        return ResponseUtil.error(
          '¡No existen datos en la plantilla excel para migrar!',
        );
      }

      //return ResponseUtil.success('Se guardaron los datos exitosamente');
    } catch (error) {
      return ResponseUtil.error('No se pudo guardar los datos: ' + error);
    }
  }
  //TODO: metodo para verificar si existe una planilla anterior
  async obtenerPlanilaAnterior(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const query = `
      SELECT p.* 
      FROM planilla p
      INNER JOIN empleado e ON e.id_empleado = p.id_empleado 
      INNER JOIN empresa em ON em.id_empresa = e.id_empresa 
      and p.aprobado = $4
      WHERE em.emp_npatronal = $1 AND p.periodo = $2 AND p.gestion = $3 and e.ase_estado = $5
    `;

    const planillas = await this.planillaRepository.query(query, [
      empNpatronal,
      periodo,
      gestion,
      EstadosPlanillas.APROBADO,
      Estado.VIGENTE,
    ]);
    return transformaCamelCaseArrayObjeto(planillas);
  }
  //TODO:Validar que no se pueda duplicar una planilla
  @CatchErrors()
  async validarPlanillaAprobada(empNpatronal: string, periodo: number) {
    const result = await this.planillaRepository
      .createQueryBuilder('planilla')
      .innerJoin('planilla.empleado', 'empleado')
      .innerJoin('empleado.empresa', 'empresa')
      .where('empresa.empNpatronal = :empNpatronal', { empNpatronal })
      .andWhere('planilla.aprobado = :aprobado', {
        aprobado: EstadosPlanillas.INICIALIZADO,
      })
      .andWhere('planilla.periodo = :periodo', { periodo })
      .getOne(); // busca una entrada que no esté aprobada

    return ResponseUtil.success(!result, 'Planilla encontrada');
  }
  //TODO:Generar una planilla de excel para cargado masivo con carbone
  @CatchErrors()
  async generarPlanillaExcelCarbone(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const exitEmpresa = await this.empresaService.findOneEmpresaByNroPatronal(
      empNpatronal,
    );
    if (!exitEmpresa.status) {
      return ResponseUtil.error('No se encontró la empresa');
    }
    const query = `
    SELECT 
    empleado.ase_mat,
    empleado.ase_ci,
    concat(empleado.ase_nom,' ',empleado.ase_apat, ' ',empleado.ase_amat),
    planilla.cargo,
    empleado.ase_fec_afi,
    empleado.ase_fini_emp,
    planilla.fecha_retiro,
    planilla.id_planilla,
    planilla.dias_trabajados,
    planilla.total_ganado,
    planilla.total_descuento,
    planilla.observaciones
    --planilla.periodo,
    --planilla.gestion 
    FROM empleado
    INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
    INNER JOIN planilla ON planilla.id_empleado = empleado.id_empleado
    WHERE empresa.emp_npatronal = $1
    AND planilla.periodo = $2
    AND planilla.gestion = $3;`;
    const respuesta = await this.planillaRepository.query(query, [
      empNpatronal,
      periodo,
      gestion,
    ]);
    if (respuesta.length === 0) {
      return ResponseUtil.error('No se encontraron datos');
    }

    respuesta.forEach((item, index) => {
      item.numero = index + 1;
    });

    respuesta.forEach((item) => {
      item.ase_fec_afi = formatearFecha(item.ase_fec_afi);
      item.ase_fini_emp = formatearFecha(item.ase_fini_emp);
      item.fecha_retiro = formatearFecha(item.fecha_retiro);
    });

    const templatePath = path.join(
      __dirname,
      '../../../../assets/planilla-salarios.xlsx',
    );

    if (!fs.existsSync(templatePath)) {
      return 'plantilla no existe';
    }

    const empresa = await this.empresaService.findEmpresaByNumeroPatronal(
      empNpatronal,
    );
    const descuentos = await this.getTotalSueldosTotalDescuentos(
      empNpatronal,
      periodo,
      gestion,
    );

    const empresaPlanilla = empresa.data as IEmpresa;
    const data = {
      razonSocial: empresaPlanilla.empNom,
      empNpatronal: empresaPlanilla.empNpatronal,
      totalGanadoSueldo: descuentos[0].totalGanadoEmpresa,
      totalDescuentoSueldo: descuentos[0].totalDescuentoEmpresa,
      mes: obtenerNombreMes(periodo),
      anio: gestion,
      detalle: respuesta,
    };

    return new Promise<Buffer>((resolve, reject) => {
      carbone.render(templatePath, data, (error, result) => {
        if (error) {
          return reject(error);
        }
        if (typeof result === 'string') {
          resolve(Buffer.from(result));
        } else {
          resolve(result);
        }
      });
    });
  }
  //TODO:Generar Excel para carga masiva
  @CatchErrors()
  async generarExcelMasiva(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const salarioMin =
      await this.salarioMinimoService.getSalarioMinimoVigente();
    const monto: number = (salarioMin.data as any).monto;
    const minimoPorcentaje =
      await (this.tasaInteresAporteService.findTazaInteresVigente() as Promise<
        IApiResponse<ITasaInteresAporte>
      >);
    const porcentajeEstablecido: number = minimoPorcentaje.data.porcentaje;

    //en caso de no tener el aporte con el minimo nacional se aplica
    const minimoPorcentajeNacional = monto * porcentajeEstablecido;

    const exitEmpresa = await this.empresaService.findOneEmpresaByNroPatronal(
      empNpatronal,
    );
    if (!exitEmpresa.status) {
      return ResponseUtil.error('No se encontró la empresa');
    }
    const query = `
    SELECT 
    empleado.id_empleado,
    empleado.ase_mat,
    empleado.ase_ci,
    concat(empleado.ase_nom,' ',empleado.ase_apat, ' ',empleado.ase_amat),
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
    planilla.gestion 
    FROM empleado
    INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
    INNER JOIN planilla ON planilla.id_empleado = empleado.id_empleado
    WHERE empresa.emp_npatronal = $1
    and planilla.periodo = $2
    and planilla.gestion = $3
    and empleado.ase_estado = 'VIGENTE';
    `;
    const data = await this.planillaRepository.query(query, [
      empNpatronal,
      periodo,
      gestion,
    ]);
    if (data.length === 0) {
      return ResponseUtil.error('No se encontraron datos');
    }

    data.forEach((item, index) => {
      item.numero = index + 1;
    });

    const transformarFormatoDecimal = (numeroString) => {
      return numeroString.replace('.', ',');
    };

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('ReportePlanilla');

    // Combina las celdas de B2 a I3
    worksheet.mergeCells('B2', 'I3');

    // Accede a la celda combinada y establece el valor
    const mergedCell = worksheet.getCell('B2');
    mergedCell.value = 'Reporte de Planilla para Cargado Masivo de Aportes';

    // Establece el estilo como negrita
    mergedCell.font = {
      bold: true,
      size: 18,
    };

    // Centra el contenido horizontal y verticalmente
    mergedCell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    // Centrar el texto horizontal y verticalmente
    mergedCell.alignment = { vertical: 'middle', horizontal: 'center' };

    for (let i = 0; i < 2; i++) {
      worksheet.addRow([]);
    }

    // Define las columnas SIN los encabezados, pero con claves y ancho
    worksheet.columns = [
      { key: 'numero', width: 10 },
      { key: 'id_empleado', width: 20 },
      { key: 'ase_mat', width: 20 },
      { key: 'ase_ci', width: 15 },
      { key: 'concat', width: 45 },
      { key: 'cargo', width: 30 },
      { key: 'ase_fec_afi', width: 20 },
      { key: 'ase_fini_emp', width: 20 },
      { key: 'fecha_retiro', width: 15 },
      { key: 'id_planilla', width: 20 },
      { key: 'dias_trabajados', width: 15 },
      { key: 'total_ganado', width: 15 },
      { key: 'total_descuento', width: 15 },
      { key: 'observaciones', width: 30 },
    ];

    // Agrega manualmente los encabezados en la fila 6
    const headersRow = worksheet.addRow([
      'No.',
      'Identificativo',
      'Matricula',
      'Carnet Identidad',
      'Nombre y Apellidos',
      'Cargo',
      'Fecha Afiliacion',
      'Fecha Inicio Empresa',
      'Fecha Retiro',
      'Planilla',
      'Dias Trabajados',
      'Total Ganado',
      'Descuento',
      'Observaciones',
    ]);
    // Establecer el tamaño de la fuente y hacerla negrita
    headersRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 14, // Ajusta el tamaño según lo que necesites
      };

      // Añadir bordes a las celdas
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC1E0B4' }, // Puedes ajustar el valor ARGB según el tono exacto de verde claro que desees
      };
    });

    // Establecer un alto específico para la fila
    headersRow.height = 45; // Ajusta el alto según lo que necesites

    const startRow = 7; // Ajusta este valor según donde inician tus datos

    // Añade los datos
    data.forEach((item, index) => {
      const rowIndex = startRow + index; // Calcula el índice de la fila actual
      item.total_ganado = transformarFormatoDecimal(item.total_ganado);
      const row = worksheet.addRow(item);

      row.eachCell({ includeEmpty: true }, (cell) => {
        if (!cell.value) {
          cell.value = ' ';
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        // Centrar el contenido
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.alignment = { ...cell.alignment, wrapText: true };
      });

      // Formatear "Total Ganado" con dos decimales
      const totalGanadoCell = row.getCell('total_ganado');
      totalGanadoCell.dataValidation = {
        type: 'whole',
        operator: 'greaterThanOrEqual',
        //operator: 'greaterThanOrEqual',
        //formulae: [monto], // Usando el monto como el valor mínimo
        formulae: [0], // Usando el monto como el valor mínimo
        showErrorMessage: true,
        errorTitle: 'Entrada inválida',
        error: `El total ganado nmayor a cero.`,
      };

      const diasTrabajadosCell = row.getCell('dias_trabajados');
      // Agregar validación de datos a la celda
      diasTrabajadosCell.dataValidation = {
        type: 'whole',
        operator: 'between',
        formulae: [1, 30],
        showErrorMessage: true,
        errorTitle: 'Entrada inválida',
        error: 'Por favor, ingresa un número entre 1 y 30.',
      };

      const totalGanado = parseFloat(item.total_ganado || '0'); // Obtiene el valor total ganado de cada fila
      const totalDescuentoCalculado = totalGanado * porcentajeEstablecido; // Calcula el 20% del total ganado

      const totalDescuentoCell = row.getCell('total_descuento');
      // Aplica la validación de celda
      totalDescuentoCell.dataValidation = {
        type: 'whole',
        operator: 'greaterThanOrEqual',
        formulae: [minimoPorcentajeNacional],
        showErrorMessage: true,
        errorTitle: 'Valor inválido',
        error: `El valor no puede ser menor a ${minimoPorcentajeNacional}`,
      };

      // Establece el valor de total_descuento
      if (totalDescuentoCalculado < minimoPorcentajeNacional) {
        totalDescuentoCell.value = minimoPorcentajeNacional;
      } else {
        totalDescuentoCell.value = {
          formula: `L${row.number}*${porcentajeEstablecido}`, // Cambio rowIndex por row.number
          result: totalDescuentoCalculado,
        };
      }
      //totalDescuentoCell.numFmt = '0.00';

      // Validación personalizada para la celda de observaciones
      const observacionesCell = row.getCell('observaciones');
      observacionesCell.dataValidation = {
        type: 'custom',
        formulae: [
          `=IF(AND(L${row.number} < ${monto}, N${row.number} = ""), FALSE, TRUE)`,
        ],
        showErrorMessage: true,
        errorTitle: 'Entrada inválida',
        error:
          'Si el total ganado es inferior al monto, las observaciones son obligatorias.',
      };
    });

    // Desbloquear todas las celdas
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.protection = { locked: false };
      });
    });

    // Ahora bloqueamos solo la columna "No."
    data.forEach((item, index) => {
      const rowNumber = index + 6; // Ajusta el "+6" si tus datos no comienzan en la fila 6
      const noCell = worksheet.getCell(rowNumber, 1); // Asume que "No." es la primera columna
      noCell.protection = { locked: true };

      // Bloquear columna "ID Empleado" (asumiendo que es la segunda columna)
      const idEmpleadoCell = worksheet.getCell(rowNumber, 2);
      idEmpleadoCell.protection = { locked: true };

      // Bloquear columna "Matricula" (asumiendo que es la tercer columna)
      const aseMatCell = worksheet.getCell(rowNumber, 3);
      aseMatCell.protection = { locked: true };
    });

    // Proteger toda la hoja
    worksheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return buffer;
  }
  //TODO:Verifica que no se pueda duplicar una planilla
  async validarNoDuplicidadPlanilla(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const query = `
    SELECT 
    count(*)
    FROM empleado
    INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
    INNER JOIN planilla ON planilla.id_empleado = empleado.id_empleado
    WHERE empresa.emp_npatronal = $1
    and planilla.periodo = $2
    and planilla.gestion = $3`;
    const data = await this.planillaRepository.query(query, [
      empNpatronal,
      periodo,
      gestion,
    ]);
    return data[0].count;
  }
  //TODO:Buscador por CI o Matricula Titular
  async findAllPlanilaEmpleadosByCIorMatTitAndEmpNpatronal(
    empNpatronal: string,
    periodo: number,
    gestion: number,
    { limit, offset }: PaginationQueryDto,
    searchTerm: string,
    isCITit: boolean,
  ) {
    const exitEmpresa = await this.empresaService.findOneEmpresaByNroPatronal(
      empNpatronal,
    );
    if (!exitEmpresa.status) {
      return ResponseUtil.error('No se encontró la empresa');
    }

    const query = `
    SELECT empleado.*, planilla.*
    FROM empleado
    INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
    INNER JOIN planilla ON planilla.id_empleado = empleado.id_empleado
    WHERE empresa.emp_npatronal = $1
    AND planilla.periodo = $4
    AND planilla.gestion = $5
    AND (
        (CAST(empleado.ase_ci AS text) ILIKE $6 AND $7 = TRUE)
        OR 
        (empleado.ase_mat_tit ILIKE $6 AND $7 = FALSE)
    )
    LIMIT $2 OFFSET $3;`;

    const empleados = await this.planillaRepository.query(query, [
      empNpatronal,
      limit,
      (offset - 1) * limit,
      periodo,
      gestion,
      `%${searchTerm}%`,
      isCITit,
    ]);

    if (empleados.length === 0) {
      return ResponseUtil.error(
        `No Existen Registros para el perido ${obtenerNombreMes(
          periodo,
        )} y gestión ${gestion}  `,
      );
    }

    const countQuery = `
  SELECT COUNT(*)
  FROM empleado
  INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
  INNER JOIN planilla ON planilla.id_empleado = empleado.id_empleado
  WHERE empresa.emp_npatronal = $1 
  and planilla.periodo = $2 
  and planilla.gestion = $3  
  AND (
    (CAST(empleado.ase_ci AS text) ILIKE $4 AND $5 = TRUE) 
    OR 
    (empleado.ase_mat_tit ILIKE $4 AND $5 = FALSE)
  );
`;

    const result = await this.planillaRepository.query(countQuery, [
      empNpatronal,
      periodo,
      gestion,
      `%${searchTerm}%`,
      isCITit,
    ]);
    const total = result[0].count;

    return ResponseUtil.success({
      data: transformaCamelCaseArrayObjeto(empleados),
      count: total,
      page: offset,
      pageSize: limit,
    });
  }
  //TODO:Cambio de estado
  async cambiarEstadoPlanilla(
    empNpatronal: string,
    periodo: number,
    gestion: number,
    estado: string,
  ) {
    const query = `
    UPDATE planilla
    SET aprobado = $4
    FROM empleado
    INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
    WHERE 
        planilla.id_empleado = empleado.id_empleado
        AND empresa.emp_npatronal = $1
        AND planilla.periodo = $2
        AND planilla.gestion = $3
    `;
    const result = await this.planillaRepository.query(query, [
      empNpatronal,
      periodo,
      gestion,
      estado,
    ]);
    const filasAfectadas = result[1];
    if (typeof filasAfectadas === 'number' && filasAfectadas > 0) {
      return ResponseUtil.success('Se actualizo el estado de la planilla');
    }

    return ResponseUtil.error('No se pudo actualizar el estado de la planilla');
  }
  @CatchErrors()
  async obtenerEstadoDeUnaPlanilla(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const query = this.planillaRepository
      .createQueryBuilder('p')
      .select('DISTINCT(p.aprobado)', 'aprobado')
      .innerJoin('p.empleado', 'e')
      .innerJoin('e.empresa', 'emp')
      .where('emp.emp_npatronal = :empNpatronal', { empNpatronal })
      .andWhere('p.periodo = :periodo', { periodo })
      .andWhere('p.gestion = :gestion', { gestion });

    const respuesta = await query.getRawMany(); // Usamos getRawMany() para obtener solo los valores de 'aprobado'
    if (respuesta.length === 0) {
      return ResponseUtil.error('No Existe registro');
    }
    return ResponseUtil.success(respuesta[0], 'Busqueda exitosa');
  }
  @CatchErrors()
  async obtenerEmpleadosVigentesNoIncluidosPlanilla(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const query = `--obtener empleados vigentes que no esten en la planilla
    SELECT e.id_empleado, e.ase_cargo, e.ase_fini_emp, e.ase_haber 
    FROM empleado e
    INNER JOIN empresa emp ON e.id_empresa = emp.id_empresa 
    WHERE e.ase_estado = $5
    AND (e.id_empleado, e.ase_ci, e.ase_ci_com) NOT IN (
        SELECT e.id_empleado, e.ase_ci, e.ase_ci_com
        FROM planilla p
        INNER JOIN empleado e ON e.id_empleado = p.id_empleado 
        INNER JOIN empresa em ON em.id_empresa = e.id_empresa 
        WHERE em.emp_npatronal = $1 AND p.periodo =$2 AND p.gestion = $3 AND p.aprobado = $4
    );`;
    const result = await this.planillaRepository.query(query, [
      empNpatronal,
      periodo,
      gestion,
      EstadosPlanillas.APROBADO,
      Estado.VIGENTE,
    ]);
    return transformaCamelCaseArrayObjeto(result);
  }
  @CatchErrors()
  async getTotalSueldosTotalDescuentos(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const query = `SELECT 
    ROUND(SUM(planilla.total_ganado)::numeric, 4) AS total_ganado_empresa,
    ROUND(SUM(planilla.total_descuento)::numeric, 4) AS total_descuento_empresa
    FROM empleado
    INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
    INNER JOIN planilla ON planilla.id_empleado = empleado.id_empleado
    WHERE empresa.emp_npatronal = $1
    AND planilla.periodo = $2
    AND planilla.gestion = $3;`;
    const result = await this.planillaRepository.query(query, [
      empNpatronal,
      periodo,
      gestion,
    ]);
    return transformaCamelCaseArrayObjeto(result);
  }
  /*
  Validación de datos migrados con el Sistema de Afiliaciones
  */
  @CatchErrors()
  async validaAfiliaciones(mes: number, gestion: number, empPatronal: string) {
    try {
      console.log('Iniciando validación de afiliaciones', {
        mes,
        gestion,
        empPatronal,
      });

      /**Validamos si es que ya se realizó la validación**/
      const planillaVerificada =
        await this.planillaEmpresaServices.findPlanillaVerificada(
          mes,
          gestion,
          empPatronal,
        );
      console.log('Resultado de planillaVerificada:', planillaVerificada);

      if (planillaVerificada.status) {
        console.warn('Planilla ya validada:', planillaVerificada.message);
        return ResponseUtil.error(planillaVerificada.message);
      }

      const empresa = await this.empresaService.findOne(empPatronal);
      console.log('Resultado de empresa:', empresa);

      if (!empresa.status) {
        console.warn('Empresa no encontrada:', empresa.message);
        return ResponseUtil.error(empresa.message);
      }

      const query = `
        SELECT 
            pe.*,
            pl.*,
            to_char(pl.fecha_ingreso,'DD/MM/YYYY') AS fecha_ingreso,
            to_char(pl.fecha_retiro,'DD/MM/YYYY') AS fecha_retiro
        FROM planilla_empresa pe
        INNER JOIN planilla pl ON pe.id_planilla_empresa = pl.id_planilla_empresa
        WHERE pe.emp_npatronal = $1
        AND pe.periodo = $2
        AND pe.gestion = $3
        ORDER BY pl.id_planilla ASC
        `;
      const empleados = await this.planillaRepository.query(query, [
        empPatronal,
        mes,
        gestion,
      ]);
      console.log('Empleados encontrados en planilla:', empleados);

      const aseguradosData =
        await this.empleadoService.listEmpleadosByEmpNpatronal(empPatronal);
      console.log('Asegurados recuperados:', aseguradosData);

      if (empleados.length > 0) {
        console.log(`Procesando ${empleados.length} empleados en planilla...`);
        for (const planillaEmpleados of empleados) {
          console.log('Empleado en planilla actual:', planillaEmpleados);

          let cont = 0;
          for (const dataAfiliados of aseguradosData) {
            cont++;
            console.log(
              `Comparando CI: Planilla(${planillaEmpleados.ase_ci}) vs Asegurados(${dataAfiliados.ase_ci})`,
            );

            if (planillaEmpleados.ase_ci == dataAfiliados.ase_ci) {
              console.log('CI coincide, procesando empleado...');

              const existingEmpleadoPlanilla =
                await this.planillaRepository.findOne({
                  where: {
                    aseCi: planillaEmpleados.ase_ci,
                    periodo: mes,
                    gestion: gestion,
                  },
                });
              console.log(
                'Empleado encontrado en base de datos:',
                existingEmpleadoPlanilla,
              );

              if (!existingEmpleadoPlanilla) {
                console.error('Empleado no encontrado en base de datos.');
                return ResponseUtil.error('Empleado no encontrado');
              }

              const updateEmpleado = new UpdatePlanillaDto();
              updateEmpleado.idEmpleado = dataAfiliados.id_empleado;
              updateEmpleado.aseMatTit = dataAfiliados.ase_mat_tit;
              updateEmpleado.estadoRegistro = 'ESTADO_VERIFICADO';
              updateEmpleado.estadoAfiliacion = dataAfiliados.ase_estado;

              const updatedEmpleadoPlanilla = this.planillaRepository.merge(
                existingEmpleadoPlanilla,
                updateEmpleado,
              );
              console.log(
                'Datos del empleado actualizados:',
                updatedEmpleadoPlanilla,
              );

              const respuesta = await this.planillaRepository.save(
                updatedEmpleadoPlanilla,
              );
              console.log(
                'Respuesta al guardar planilla actualizada:',
                respuesta,
              );

              const updateDataEmpleado = new UpdateEmpleadoDto();
              updateDataEmpleado.aseHaber = planillaEmpleados.total_ganado;

              const empleadoSalarioUpdate =
                await this.empleadoService.updateEmpleado(
                  dataAfiliados.id_empleado,
                  updateDataEmpleado,
                );
              console.log(
                'Respuesta al actualizar salario del empleado:',
                empleadoSalarioUpdate,
              );

              if (!empleadoSalarioUpdate) {
                return ResponseUtil.error(
                  'Error en la actualización del salario del empleado',
                );
              }

              const updatePlanillaEmpresa = new UpdatePlanillaEmpresaDto();
              updatePlanillaEmpresa.estadoValidacionAfiliacion =
                'ESTADO_VERIFICADO';

              const updateEstadoPlanilla =
                await this.planillaEmpresaServices.updatePlanillaEmpresa(
                  planillaEmpleados.id_planilla_empresa,
                  updatePlanillaEmpresa,
                );
              console.log(
                'Estado de la planilla actualizado:',
                updateEstadoPlanilla,
              );

              if (!updateEstadoPlanilla) {
                return ResponseUtil.error(
                  'Error en la actualización del estado de la Planilla',
                );
              }

              if (!respuesta) {
                return ResponseUtil.error(
                  'Error en la verificación de datos de la planilla',
                );
              }

              console.log(
                'Planilla actualizada exitosamente para el empleado:',
                planillaEmpleados,
              );
              return ResponseUtil.success(
                respuesta,
                'Planilla actualizada exitosamente',
              );
            }
          }
        }
      } else {
        console.warn(
          'No se encontraron registros para el período y gestión proporcionados.',
        );
        return ResponseUtil.error(
          '¡El periodo y gestión que intenta validar no tiene registros!',
        );
      }
    } catch (error) {
      console.error('Error durante la validación de afiliaciones:', error);
      return ResponseUtil.error('No se pudo guardar los datos: ' + error);
    }
  }
}
