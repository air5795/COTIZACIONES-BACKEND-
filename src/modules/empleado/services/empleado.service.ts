import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ExternalApiService } from 'src/modules/api-client/service/external-api.service';
import { Logger } from 'winston';
import { EmpleadoEntity } from '../entity/empleado.entity';
import { Repository } from 'typeorm';
import { EmpresaService } from 'src/modules/empresa/services/empresa.service';
import { ResponseUtil } from 'src/core/utility/response-util';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import * as ExcelJS from 'exceljs';
import { convertirFechaExcelAFechaISO8601 } from 'src/core/utility/date-convert.utility';
import * as moment from 'moment';
import { EmpresaEntity } from 'src/modules/empresa/entity/empresa.entity';
import { PaginationQueryDto } from 'src/core/utility/pagination-query.dto';
import { transformaCamelCaseArrayObjeto } from 'src/core/utility/camel-case.util';
import {
  CreateEmpleadoNoVerificado,
  UpdateEmpleadoDto,
} from '../dto/empleado.dto';
import { Estado } from 'src/core/utility/estados-registro.util';
import { IPlanilla } from 'src/modules/planilla/interfaces/planilla.inteface';
import { trim } from 'lodash';

@Injectable()
export class EmpleadoService {
  constructor(
    @InjectRepository(EmpleadoEntity)
    private empleadoRepository: Repository<EmpleadoEntity>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private _apiExternaService: ExternalApiService,
    private empresaService: EmpresaService,
  ) {
    if (!this._apiExternaService.getApiToken()) {
      this._apiExternaService.loginToExternalApi();
    }
  }

  @CatchErrors()
  async migrarEmplados(file: Express.Multer.File, empPatronal: string) {
    const empresa = await this.empresaService.findOne(empPatronal);
    if (!empresa.status) {
      ResponseUtil.error(empresa.message);
    }
    //console.log(empPatronal);
    const aseguradosData =
      await this._apiExternaService.getAseguradosByNroPatronal(empPatronal);
    // Leer y validar el archivo Excel sin guardarlo
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.getWorksheet(1); //Lee la hoja 1 del archivo

    const safeToString = (value: any): string | null =>
      value !== null && value !== undefined && value !== ''
        ? value.toString()
        : null;

    const resultados = [];
    const noCoincidentes = [];
    worksheet.eachRow((row, rowNumber) => {
      // Saltar las filas anteriores a la 3
      if (rowNumber >= 3) {
        const criterios = {
          //ASE_MAT: safeToString(row.getCell(2).value), // Columna B
          ASE_CI: safeToString(row.getCell(2).value), // Columna C
          //ASE_APAT: safeToString(row.getCell(5).value), // Columna D
          //ASE_AMAT: safeToString(row.getCell(6).value), // Columna F verificar por que no compara bien
          //ASE_NOM: safeToString(row.getCell(7).value), // Columna G - verificar por que no compara bien
          ASE_FEC_NAC: safeToString(row.getCell(8).value), // Columna H //verificar porque no compara bien
        };
        // Obtiene el valor de aseHaber desde la columna I
        const aseHaberExcel = safeToString(row.getCell(9).value); // Columna I

        const coincidencias = this.buscarAseguradosData(
          criterios,
          aseguradosData,
        );
        if (coincidencias.length === 0) {
          //noCoincidentes.push(row.values);
          noCoincidentes.push({ rowNumber, rowValues: row.values });
        } else {
          coincidencias.forEach((coincidencia) => {
            coincidencia.aseHaberExcel = aseHaberExcel; // Asigna el valor de aseHaber
          });
        }
        resultados.push(...coincidencias);
      }
    });
    if (noCoincidentes.length > 0) {
      return ResponseUtil.error(
        'Se encontraron los siguientes datos no coincidentes',
        noCoincidentes,
      );
    }
    //console.log(aseguradosData);
    //return ResponseUtil.success(resultados, 'Datos coincidentes');
    const empleados = []; // Array para recolectar las entidades
    for (const aseguradosDataVerificados of resultados) {
      const empleado = new EmpleadoEntity();
      empleado.empresa = new EmpresaEntity();
      empleado.afiNro = +aseguradosDataVerificados.AFI_NRO;
      empleado.caNro = +aseguradosDataVerificados.CA_NRO;
      empleado.aseCod = +aseguradosDataVerificados.ASE_COD;
      empleado.aseMatTit = aseguradosDataVerificados.ASE_MAT_TIT;
      empleado.aseMat = aseguradosDataVerificados.ASE_MAT;
      empleado.aseCiTit = aseguradosDataVerificados.ASE_CI_TIT;
      empleado.tipoDocumentoTit = aseguradosDataVerificados.TIPO_DOCUMENTO_TIT;
      empleado.aseCi = +aseguradosDataVerificados.ASE_CI;
      empleado.aseCiCom = aseguradosDataVerificados.ASE_CI_COM;
      empleado.aseCiext = aseguradosDataVerificados.ASE_CIEXT;
      empleado.tipoDocumento = aseguradosDataVerificados.TIPO_DOCUMENTO;
      empleado.aseApat = aseguradosDataVerificados.ASE_APAT;
      empleado.aseAmat = aseguradosDataVerificados.ASE_AMAT;
      empleado.aseNom = aseguradosDataVerificados.ASE_NOM;
      empleado.aseLugNac = aseguradosDataVerificados.ASE_LUG_NAC;
      empleado.aseEdad = +aseguradosDataVerificados.ASE_EDAD;
      empleado.aseSexo = aseguradosDataVerificados.ASE_SEXO;
      empleado.aseEcivil = aseguradosDataVerificados.ASE_ECIVIL;
      empleado.aseCalle = aseguradosDataVerificados.ASE_CALLE;
      empleado.aseNum = aseguradosDataVerificados.ASE_NUM;
      empleado.aseZona = aseguradosDataVerificados.ASE_ZONA;
      empleado.aseLocalidad = aseguradosDataVerificados.ASE_LOCALIDAD;
      empleado.aseLocalidad = aseguradosDataVerificados.ASE_LOCALIDAD;
      empleado.aseTelf = aseguradosDataVerificados.ASE_TELF;
      empleado.aseProfesion = aseguradosDataVerificados.ASE_PROFESION;
      empleado.aseCargo = aseguradosDataVerificados.ASE_CARGO;
      //empleado.aseHaber = +aseguradosDataVerificados.ASE_HABER;
      empleado.aseHaber = aseguradosDataVerificados.aseHaberExcel
        ? parseFloat(aseguradosDataVerificados.aseHaberExcel)
        : null;
      empleado.empNpatronal = aseguradosDataVerificados.EMP_NPATRONAL;
      empleado.empNom = aseguradosDataVerificados.EMP_NOM;
      empleado.aseFiniEmp =
        aseguradosDataVerificados.ASE_FINI_EMP &&
        moment(aseguradosDataVerificados.ASE_FINI_EMP, 'YYYY-MM-DD').isValid()
          ? moment(aseguradosDataVerificados.ASE_FINI_EMP).toDate()
          : null;
      empleado.aseLugar = aseguradosDataVerificados.ASE_LUGAR;
      empleado.aseFecAfi =
        aseguradosDataVerificados.ASE_FEC_AFI &&
        moment(aseguradosDataVerificados.ASE_FEC_AFI, 'YYYY-MM-DD').isValid()
          ? moment(aseguradosDataVerificados.ASE_FEC_AFI).toDate()
          : null;
      empleado.aseTipo = aseguradosDataVerificados.ASE_TIPO;
      empleado.aseEstado = aseguradosDataVerificados.ASE_ESTADO;
      empleado.aseCondEst = aseguradosDataVerificados.ASE_COND_EST;
      empleado.aseTipoAsegurado = aseguradosDataVerificados.ASE_TIPO_ASEGURADO;
      empleado.aseObs = aseguradosDataVerificados.ASE_OBS;
      empleado.aseEstudio = aseguradosDataVerificados.ASE_ESTUDIO;
      empleado.aseDocu = aseguradosDataVerificados.ASE_DOCU;
      empleado.parCod = aseguradosDataVerificados.PAR_COD;
      empleado.parDesc = aseguradosDataVerificados.PAR_DESC;
      empleado.parOrden = +aseguradosDataVerificados.PAR_ORDEN;
      empleado.validadoAfiliaciones = true;
      empleado.empresa.idEmpresa = empresa.data.idEmpresa;
      empleado.aseFecNac =
        aseguradosDataVerificados.ASE_FEC_NAC &&
        moment(aseguradosDataVerificados.ASE_FEC_NAC, 'YYYY-MM-DD').isValid()
          ? moment(aseguradosDataVerificados.ASE_FEC_NAC).toDate()
          : null;
      empleado.validadoSegip = true;

      empleados.push(empleado);
    }
    const batchSize = 1000; // Define un tamaño de lote razonable
    for (let i = 0; i < empleados.length; i += batchSize) {
      const batch = empleados.slice(i, i + batchSize);
      await this.empleadoRepository
        .createQueryBuilder()
        .insert()
        .into(EmpleadoEntity)
        .values(batch)
        .execute();
    }
    // console.log('empleados', empleados);
    // const resp = await this.empleadoRepository.save(empleados);
    // if (!resp) {
    //   return ResponseUtil.error('No se pudo guardar los datos');
    // }

    return ResponseUtil.success('Se guardaron los datos exitosamente');
  }
  /*
  Buscar asegurados en el arreglo de aseguradosData
  */
  buscarAseguradosData(criterios, aseguradosData): any[] {
    return aseguradosData.filter((asegurados) => {
      // Realizar la conversión de fecha en aseguradosData
      asegurados.ASE_FEC_NAC = convertirFechaExcelAFechaISO8601(
        asegurados.ASE_FEC_NAC,
      );
      for (const key in criterios) {
        if (key === 'ASE_FEC_NAC') {
          const fechaExcel = criterios[key];
          const fechaExcelISO8601 =
            convertirFechaExcelAFechaISO8601(fechaExcel);
          if (fechaExcelISO8601 !== asegurados[key]) {
            return false; // Las fechas son diferentes
          }
        } else {
          if (String(asegurados[key]) !== String(criterios[key])) {
            return false; // Otros campos que no sean fecha
          }
        }
      }
      return true; // Todas las comparaciones fueron exitosas
    });
  }

  //Listar empleados por el numero Patronal con paginacion
  @CatchErrors()
  async findAllEmpleadosByEmpNpatronal(
    empNpatronal: string,
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
      to_char(empleado.ase_fec_nac,'DD/MM/YYYY') AS fecha_nac,
        empleado.*
      FROM empleado
      INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
      WHERE empresa.emp_npatronal = $1
      AND empleado.ase_estado = 'VIGENTE';
    `;

    const empleados = await this.empleadoRepository.query(query, [
      empNpatronal,
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
    WHERE empresa.emp_npatronal = $1
    AND empleado.ase_estado = 'VIGENTE';
  `;

    const result = await this.empleadoRepository.query(countQuery, [
      empNpatronal,
    ]);
    const total = result[0].count;
    return ResponseUtil.success({
      data: transformaCamelCaseArrayObjeto(empleados),
      count: total,
      page: offset,
      pageSize: limit,
    });
  }

  async listEmpleadosByEmpNpatronal(empNpatronal: string) {
    const exitEmpresa = await this.empresaService.findOneEmpresaByNroPatronal(
      empNpatronal,
    );
    if (!exitEmpresa.status) {
      return ResponseUtil.error('No se encontró la empresa');
    }

    const query = `
      SELECT 
      to_char(empleado.ase_fec_nac,'DD/MM/YYYY') AS fecha_nac,
        empleado.*
      FROM empleado
      INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
      WHERE empresa.emp_npatronal = $1
      AND empleado.ase_estado IN ('VIGENTE', 'CESANTIA');
    `;

    const empleados = await this.empleadoRepository.query(query, [
      empNpatronal,
    ]);

    if (empleados.length === 0) {
      return ResponseUtil.error(
        'No se encontraron empleados, no realizo el cargado masivo',
      );
    }
    return empleados;
  }
  //Buscador ilike por matricula o ci
  @CatchErrors()
  async findEmpleadosByCITitOrMatTitAndEmpNpatronal(
    empNpatronal: string,
    pagination: PaginationQueryDto,
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
  SELECT empleado.*
  FROM empleado
  INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
  WHERE empresa.emp_npatronal = $1
  AND empleado.ase_estado = 'VIGENTE' 
  AND (
    (CAST(empleado.ase_ci AS text) ILIKE $4 AND $5 = TRUE) 
    OR 
    (empleado.ase_mat_tit ILIKE $4 AND $5 = FALSE)
  )
  LIMIT $2 OFFSET $3;
`;

    const empleados = await this.empleadoRepository.query(query, [
      empNpatronal,
      pagination.limit,
      (pagination.offset - 1) * pagination.limit,
      `%${searchTerm}%`,
      isCITit,
    ]);

    const countQuery = `
  SELECT COUNT(*)
  FROM empleado
  INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
  WHERE empresa.emp_npatronal = $1
  AND empleado.ase_estado = 'VIGENTE' 
  AND (
    (CAST(empleado.ase_ci AS text) ILIKE $2 AND $3 = TRUE) 
    OR 
    (empleado.ase_mat_tit ILIKE $2 AND $3 = FALSE)
  );
`;

    const result = await this.empleadoRepository.query(countQuery, [
      empNpatronal,
      `%${searchTerm}%`,
      isCITit,
    ]);
    const total = result[0].count;
    return ResponseUtil.success({
      data: transformaCamelCaseArrayObjeto(empleados),
      count: total,
      page: pagination.offset,
      pageSize: pagination.limit,
    });
  }

  // Recupera la lista de empleados que tiene una empresa
  async findAllByNpatronal(empNpatronal: string) {
    const empleados = await this.empleadoRepository
      .createQueryBuilder('empleado')
      .innerJoin(
        'empleado.empresa',
        'empresa',
        'empresa.empNpatronal = :empNpatronal',
        { empNpatronal },
      )
      .where('empleado.ase_estado =:ase_estado', { ase_estado: Estado.VIGENTE })
      .getMany();
    return ResponseUtil.success(empleados, 'Listado exitoso');
  }

  //Eliminacion logica de un empleado
  @CatchErrors()
  async deleteLogico(
    idEmpleado: number,
    aseCi: string,
    fechaBaja: Date,
    observaciones: string,
  ) {
    const exits = await this.empleadoRepository.find({
      where: {
        idEmpleado: idEmpleado,
        aseCi: Number(aseCi),
      },
    });
    if (!exits.length) {
      return ResponseUtil.error('No se encontraron registros');
    }

    const updateResult = await this.empleadoRepository.update(
      {
        idEmpleado: idEmpleado,
        aseCi: Number(aseCi),
      },
      {
        aseEstado: Estado.CESANTIA,
        activo: false,
        fechaBaja: fechaBaja,
        observaciones: observaciones,
      },
    );
    if (updateResult.affected === 0) {
      return ResponseUtil.error(
        'Hubo un error al realizar la eliminacion logica',
      );
    }
    return ResponseUtil.success(null, 'Eliminacion realizada con exito');
  }

  //Eliminacion logica de un empleado
  @CatchErrors()
  async findEmpleadoByCarnet(carnet: number) {
    const exits = await this.empleadoRepository.find({
      where: {
        aseCi: carnet,
      },
    });
    if (!exits.length) {
      return ResponseUtil.error('No se encontraron registros');
    }
    return ResponseUtil.success(exits, 'Se encontraron');
  }

  @CatchErrors()
  async createEmpleadoNoVerificado(dto: CreateEmpleadoNoVerificado) {
    const empresa = await this.empresaService.obtenerIdEmpresaByEmpNpatronal(
      dto.empNpatronal,
    );
    if (!empresa.status) {
      ResponseUtil.error(empresa.message);
    }
    const verificarApiExterno =
      await this.verificarNoAfiliacionInformacionExterna(dto);

    if (verificarApiExterno.status) {
      return ResponseUtil.success(
        verificarApiExterno.data,
        verificarApiExterno.message,
      );
    }

    // const empleado = this.empleadoRepository.create(dto);
    // empleado.empresa = new EmpresaEntity();
    // empleado.empresa.idEmpresa = empresa.data.idEm
    const validarNumeroCarnet = await this.empleadoRepository.findOne({
      where: { aseCi: dto.aseCi },
    });

    if (validarNumeroCarnet) {
      return ResponseUtil.error(
        'El numero de carnet ya se encuentra registrado',
      );
    }
    const empleado = this.empleadoRepository.create(dto);
    empleado.empresa = new EmpresaEntity();
    empleado.empresa.idEmpresa = empresa.data.idEmpresa;
    empleado.validadoSegip = true;
    empleado.validadoAfiliaciones = false;
    empleado.aseEstado = Estado.VIGENTE;
    empleado.activo = true;

    const result = await this.empleadoRepository.save(empleado);
    return ResponseUtil.success(result, 'Empleado creado Exitosamente');
  }

  //Metodo para un solo update de una planilla
  @CatchErrors()
  async updateEmpleado(
    idEmpleado: number,
    updateEmpleadoDto: UpdateEmpleadoDto,
  ): Promise<ResponseUtil> {
    const existingEmpleado = await this.empleadoRepository.findOne({
      where: { idEmpleado: idEmpleado },
    });
    if (!existingEmpleado) {
      ResponseUtil.error('Empleado no encontrado');
    }
    const updatedDataEmpleado = this.empleadoRepository.merge(
      existingEmpleado,
      updateEmpleadoDto,
    );
    const respuesta = await this.empleadoRepository.save(updatedDataEmpleado);
    return ResponseUtil.success(
      respuesta,
      'Salario mensual actualizado correctamente',
    );
  }

  @CatchErrors()
  async verificarNoAfiliacionInformacionExterna(
    dto: CreateEmpleadoNoVerificado,
  ) {
    const empresa = await this.empresaService.findOne(dto.empNpatronal);
    if (!empresa.status) {
      ResponseUtil.error(empresa.message);
    }
    const aseguradosData =
      await this._apiExternaService.getAseguradosByNroPatronal(
        dto.empNpatronal,
      );

    const encontrado = aseguradosData.find(
      (asegurado) =>
        asegurado.ASE_CI === dto.aseCi &&
        new Date(asegurado.ASE_FEC_NAC).toISOString().split('T')[0] ===
          new Date(dto.aseFecNac).toISOString().split('T')[0],
    );
    if (encontrado) {
      const empleado = new EmpleadoEntity();
      empleado.empresa = new EmpresaEntity();
      empleado.afiNro = +encontrado.AFI_NRO;
      empleado.caNro = +encontrado.CA_NRO;
      empleado.aseCod = +encontrado.ASE_COD;
      empleado.aseMatTit = encontrado.ASE_MAT_TIT;
      empleado.aseMat = encontrado.ASE_MAT;
      empleado.aseCiTit = encontrado.ASE_CI_TIT;
      empleado.tipoDocumentoTit = encontrado.TIPO_DOCUMENTO_TIT;
      empleado.aseCi = +encontrado.ASE_CI;
      empleado.aseCiCom = encontrado.ASE_CI_COM;
      empleado.aseCiext = encontrado.ASE_CIEXT;
      empleado.tipoDocumento = encontrado.TIPO_DOCUMENTO;
      empleado.aseApat = encontrado.ASE_APAT;
      empleado.aseAmat = encontrado.ASE_AMAT;
      empleado.aseNom = encontrado.ASE_NOM;
      empleado.aseLugNac = encontrado.ASE_LUG_NAC;
      empleado.aseEdad = +encontrado.ASE_EDAD;
      empleado.aseSexo = encontrado.ASE_SEXO;
      empleado.aseEcivil = encontrado.ASE_ECIVIL;
      empleado.aseCalle = encontrado.ASE_CALLE;
      empleado.aseNum = encontrado.ASE_NUM;
      empleado.aseZona = encontrado.ASE_ZONA;
      empleado.aseLocalidad = encontrado.ASE_LOCALIDAD;
      empleado.aseLocalidad = encontrado.ASE_LOCALIDAD;
      empleado.aseTelf = encontrado.ASE_TELF;
      empleado.aseProfesion = encontrado.ASE_PROFESION;
      empleado.aseCargo = encontrado.ASE_CARGO;
      empleado.aseHaber = +dto.aseHaber;
      empleado.empNpatronal = encontrado.EMP_NPATRONAL;
      empleado.empNom = encontrado.EMP_NOM;
      empleado.aseFiniEmp =
        encontrado.ASE_FINI_EMP &&
        moment(encontrado.ASE_FINI_EMP, 'YYYY-MM-DD').isValid()
          ? moment(encontrado.ASE_FINI_EMP).toDate()
          : null;
      empleado.aseLugar = encontrado.ASE_LUGAR;
      empleado.aseFecAfi =
        encontrado.ASE_FEC_AFI &&
        moment(encontrado.ASE_FEC_AFI, 'YYYY-MM-DD').isValid()
          ? moment(encontrado.ASE_FEC_AFI).toDate()
          : null;
      empleado.aseTipo = encontrado.ASE_TIPO;
      empleado.aseEstado = encontrado.ASE_ESTADO;
      empleado.aseCondEst = encontrado.ASE_COND_EST;
      empleado.aseTipoAsegurado = encontrado.ASE_TIPO_ASEGURADO;
      empleado.aseObs = encontrado.ASE_OBS;
      empleado.aseEstudio = encontrado.ASE_ESTUDIO;
      empleado.aseDocu = encontrado.ASE_DOCU;
      empleado.parCod = encontrado.PAR_COD;
      empleado.parDesc = encontrado.PAR_DESC;
      empleado.parOrden = +encontrado.PAR_ORDEN;
      empleado.validadoAfiliaciones = true;
      empleado.empresa.idEmpresa = empresa.data.idEmpresa;
      empleado.aseFecNac =
        encontrado.ASE_FEC_NAC &&
        moment(encontrado.ASE_FEC_NAC, 'YYYY-MM-DD').isValid()
          ? moment(encontrado.ASE_FEC_NAC).toDate()
          : null;
      empleado.validadoSegip = true;

      const guardar = await this.empleadoRepository.save(empleado);
      if (guardar) {
        return ResponseUtil.success('Guardado exitosamente');
      } else {
        return ResponseUtil.error('Error al guardar');
      }
    } else {
      return ResponseUtil.error('Registro no encontrado');
    }
  }

  /**
   * Obtiene empleados en cesantia y vigentes pero este no estoy usando, es para pruebas
   * @param empPatronal
   * @returns empleados
   */
  @CatchErrors()
  async obtenerEmpleadosApiExternoByEmpNpatronal(empPatronal: string) {
    const empresa = await this.empresaService.findOne(empPatronal);
    if (!empresa.status) {
      ResponseUtil.error(empresa.message);
    }
    const aseguradosData =
      await this._apiExternaService.getAseguradosByNroPatronal(empPatronal);

    const conteoEstados = aseguradosData.reduce(
      (acumulador, asegurado) => {
        if (asegurado.ASE_ESTADO === Estado.CESANTIA) {
          acumulador.cesantia += 1;
        } else if (asegurado.ASE_ESTADO === Estado.VIGENTE) {
          acumulador.vigente += 1;
        }
        return acumulador;
      },
      { cesantia: 0, vigente: 0 },
    );

    console.log(
      `Cesantia: ${conteoEstados.cesantia}, Vigente: ${conteoEstados.vigente}`,
    );

    // Filtrar los asegurados que tienen estado "CESANTIA" o "VIGENTE"
    const aseguradosFiltrados = aseguradosData.filter(
      (asegurado: any) =>
        asegurado.ASE_ESTADO === 'CESANTIA' ||
        asegurado.ASE_ESTADO === 'VIGENTE',
    );
    const empleados = []; // Array para recolectar las entidades
    for (const aseguradosDataVerificados of aseguradosFiltrados) {
      const empleado = new EmpleadoEntity();
      empleado.empresa = new EmpresaEntity();
      empleado.afiNro = +aseguradosDataVerificados.AFI_NRO;
      empleado.caNro = +aseguradosDataVerificados.CA_NRO;
      empleado.aseCod = +aseguradosDataVerificados.ASE_COD;
      empleado.aseMatTit = aseguradosDataVerificados.ASE_MAT_TIT;
      empleado.aseMat = aseguradosDataVerificados.ASE_MAT;
      empleado.aseCiTit = aseguradosDataVerificados.ASE_CI_TIT;
      empleado.tipoDocumentoTit = aseguradosDataVerificados.TIPO_DOCUMENTO_TIT;
      empleado.aseCi = +aseguradosDataVerificados.ASE_CI;
      empleado.aseCiCom = aseguradosDataVerificados.ASE_CI_COM;
      empleado.aseCiext = aseguradosDataVerificados.ASE_CIEXT;
      empleado.tipoDocumento = aseguradosDataVerificados.TIPO_DOCUMENTO;
      empleado.aseApat = aseguradosDataVerificados.ASE_APAT;
      empleado.aseAmat = aseguradosDataVerificados.ASE_AMAT;
      empleado.aseNom = aseguradosDataVerificados.ASE_NOM;
      empleado.aseLugNac = aseguradosDataVerificados.ASE_LUG_NAC;
      empleado.aseEdad = +aseguradosDataVerificados.ASE_EDAD;
      empleado.aseSexo = aseguradosDataVerificados.ASE_SEXO;
      empleado.aseEcivil = aseguradosDataVerificados.ASE_ECIVIL;
      empleado.aseCalle = aseguradosDataVerificados.ASE_CALLE;
      empleado.aseNum = aseguradosDataVerificados.ASE_NUM;
      empleado.aseZona = aseguradosDataVerificados.ASE_ZONA;
      empleado.aseLocalidad = aseguradosDataVerificados.ASE_LOCALIDAD;
      empleado.aseLocalidad = aseguradosDataVerificados.ASE_LOCALIDAD;
      empleado.aseTelf = aseguradosDataVerificados.ASE_TELF;
      empleado.aseProfesion = aseguradosDataVerificados.ASE_PROFESION;
      empleado.aseCargo = aseguradosDataVerificados.ASE_CARGO;
      empleado.aseHaber = +aseguradosDataVerificados.ASE_HABER;
      empleado.empNpatronal = aseguradosDataVerificados.EMP_NPATRONAL;
      empleado.empNom = aseguradosDataVerificados.EMP_NOM;
      empleado.aseFiniEmp =
        aseguradosDataVerificados.ASE_FINI_EMP &&
        moment(aseguradosDataVerificados.ASE_FINI_EMP, 'YYYY-MM-DD').isValid()
          ? moment(aseguradosDataVerificados.ASE_FINI_EMP).toDate()
          : null;
      empleado.aseLugar = aseguradosDataVerificados.ASE_LUGAR;
      empleado.aseFecAfi =
        aseguradosDataVerificados.ASE_FEC_AFI &&
        moment(aseguradosDataVerificados.ASE_FEC_AFI, 'YYYY-MM-DD').isValid()
          ? moment(aseguradosDataVerificados.ASE_FEC_AFI).toDate()
          : null;
      empleado.aseTipo = aseguradosDataVerificados.ASE_TIPO;
      empleado.aseEstado = aseguradosDataVerificados.ASE_ESTADO;
      empleado.aseCondEst = aseguradosDataVerificados.ASE_COND_EST;
      empleado.aseTipoAsegurado = aseguradosDataVerificados.ASE_TIPO_ASEGURADO;
      empleado.aseObs = aseguradosDataVerificados.ASE_OBS;
      empleado.aseEstudio = aseguradosDataVerificados.ASE_ESTUDIO;
      empleado.aseDocu = aseguradosDataVerificados.ASE_DOCU;
      empleado.parCod = aseguradosDataVerificados.PAR_COD;
      empleado.parDesc = aseguradosDataVerificados.PAR_DESC;
      empleado.parOrden = +aseguradosDataVerificados.PAR_ORDEN;
      empleado.validadoAfiliaciones = true;
      empleado.empresa.idEmpresa = empresa.data.idEmpresa;
      empleado.aseFecNac =
        aseguradosDataVerificados.ASE_FEC_NAC &&
        moment(aseguradosDataVerificados.ASE_FEC_NAC, 'YYYY-MM-DD').isValid()
          ? moment(aseguradosDataVerificados.ASE_FEC_NAC).toDate()
          : null;
      empleado.validadoSegip = true;

      empleados.push(empleado);
    }
    //console.log('empleados', empleados);
    //const resp = await this.empleadoRepository.save(empleados);
    const batchSize = 1000; // Define un tamaño de lote razonable
    for (let i = 0; i < empleados.length; i += batchSize) {
      const batch = empleados.slice(i, i + batchSize);
      await this.empleadoRepository
        .createQueryBuilder()
        .insert()
        .into(EmpleadoEntity)
        .values(batch)
        .execute();
    }

    // if (!resp) {
    //   return ResponseUtil.error('No se pudo guardar los datos');
    // }
    return aseguradosFiltrados;
  }

  async verificarEmpleadosAfiliaciones(
    empPatronal: string,
    planilla: IPlanilla[],
  ) {
    const empresa = await this.empresaService.findOne(empPatronal);
    if (!empresa.status) {
      ResponseUtil.error(empresa.message);
    }

    const aseguradosData =
      await this._apiExternaService.getAseguradosByNroPatronal(empPatronal);

    const conteoEstados = aseguradosData.reduce(
      (acumulador, asegurado) => {
        if (asegurado.ASE_ESTADO === Estado.CESANTIA) {
          acumulador.cesantia += 1;
        } else if (asegurado.ASE_ESTADO === Estado.VIGENTE) {
          acumulador.vigente += 1;
        } else if (asegurado.ASE_ESTADO === Estado.BAJA) {
          acumulador.baja += 1;
        }
        return acumulador;
      },
      { cesantia: 0, vigente: 0, baja: 0 },
    );

    console.log(
      `Cesantia: ${conteoEstados.cesantia}, Vigente: ${conteoEstados.vigente}, Baja: ${conteoEstados.baja}`,
    );
    // Obtener un array de idEmpleado de la planilla
    const empleadosIds = planilla.map((p) => p.idEmpleado);

    // Consultar la tabla de empleados para cada id
    const empleados = [];
    for (const id of empleadosIds) {
      const empleado = await this.empleadoRepository.findOne({
        where: { idEmpleado: id },
      });
      if (empleado) {
        empleados.push(empleado);
      }
    }
    // Aquí 'empleados' es un arreglo de objetos de empleados
    console.log(aseguradosData.length);

    console.log(empleados.length);

    return empleados;
  }
}
