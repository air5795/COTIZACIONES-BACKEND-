/* eslint-disable prettier/prettier */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmpresaEntity } from '../entity/empresa.entity';
import { Repository } from 'typeorm';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ExternalApiService } from 'src/modules/api-client/service/external-api.service';
import { ResponseUtil } from 'src/core/utility/response-util';
import { RegionalEntity } from 'src/modules/regional/entity/regional.entity';
import { PaginationQueryDto } from 'src/core/utility/pagination-query.dto';
import { transformaCamelCaseArrayObjeto } from 'src/core/utility/camel-case.util';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(EmpresaEntity)
    private empresaRepository: Repository<EmpresaEntity>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private _apiExternaService: ExternalApiService,
  ) {
    if (!this._apiExternaService.getApiToken()) {
      this._apiExternaService.loginToExternalApi();
    }
  }

  @CatchErrors()
  async findAll() {
    const empresas = await this.empresaRepository.find();
    if (empresas && empresas.length > 0) {
      return ResponseUtil.success(
        empresas,
        'Información de empresas recuperada con éxito.',
      );
    } else {
      return ResponseUtil.error('No hay información de empresas disponible.');
    }
  }

  @CatchErrors()
  async findOne(empNpatronal: string) {
    const empresa = await this.empresaRepository.findOne({
      where: { empNpatronal: empNpatronal },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }
    return ResponseUtil.success(empresa, 'Empresa encontrada');
  }

  /**
   * @param nroPatronal
   * @returns informacion de la empresa
   */
  @CatchErrors()
  async findEmpresaByNroPatronal(nroPatronal: string) {
    const ruta = 'EmpresaService/findEmpresaByNroPatronal';

    const aseguradosData =
      await this._apiExternaService.getEmpresaByNroPatronal(nroPatronal);

    // Asegurémonos de que aseguradosData es un array
    if (!Array.isArray(aseguradosData)) {
      return ResponseUtil.error(null, 'No se encontró la empresa');
    }
    const empleados = new EmpresaEntity();
    empleados.regionales = new RegionalEntity();
    if (aseguradosData.length === 1) {
      empleados.empNpatronal = aseguradosData[0].EMP_NPATRONAL;
      empleados.empCod = aseguradosData[0].EMP_COD;
      empleados.empReg = aseguradosData[0].EMP_REG;
      empleados.empNom = aseguradosData[0].EMP_NOM;
      empleados.empLegal = aseguradosData[0].EMP_LEGAL;
      empleados.empActiv = aseguradosData[0].EMP_ACTIV;
      empleados.empNtrab = aseguradosData[0].EMP_NTRAB;
      empleados.empCalle = aseguradosData[0].EMP_CALLE;
      empleados.empNum = aseguradosData[0].EMP_NUM;
      empleados.empTelf = aseguradosData[0].EMP_TELF;
      empleados.empZona = aseguradosData[0].EMP_ZONA;
      empleados.empLocalidad = aseguradosData[0].EMP_LOCALIDAD;
      empleados.empFiniAct = aseguradosData[0].EMP_FINI_ACT;
      empleados.empLug = aseguradosData[0].EMP_LUG;
      empleados.empFech = aseguradosData[0].EMP_FEC;
      empleados.empEstado = aseguradosData[0].EMP_ESTADO;
      empleados.empFecBaja = aseguradosData[0].EMP_FEC_BAJA;
      empleados.empObs = aseguradosData[0].EMP_OBS;
      empleados.tipo = aseguradosData[0].TIPO;
      empleados.empNomCorto = aseguradosData[0].EMP_NOM_CORTO;
      empleados.empNit = aseguradosData[0].EMP_NIT;
      empleados.empMatricula = aseguradosData[0].EMP_MATRICULA;
      empleados.regionales.idRegional = aseguradosData[0].EMP_REG;
      const existente = await this.empresaRepository.findOne({
        where: {
          empNpatronal: empleados.empNpatronal,
        },
      });
      // Validar si ya existe la empresa creada
      if (existente) {
        return ResponseUtil.error(
          'El Número Patronal ya existe en la base de datos.',
        );
      }
      const consulta = this.empresaRepository.create(empleados);
      const respuesta = await this.empresaRepository.save(consulta);
      return ResponseUtil.success(respuesta, 'Empresa creada exitosamente');
    }
    this.logger.info('No se encontro la empresa', { context: ruta });
    return ResponseUtil.error(
      'No se encontró la empresa en el sistema de afiliaciones',
    );
  }

  //Listar empresas por id de regional
  @CatchErrors()
  async findEmpresaByRegional(idRegional: number) {
    if (idRegional === 0) {
      return this.findAll();
    }
    const respuesta = await this.empresaRepository
      .createQueryBuilder('empresa')
      .innerJoin('empresa.regionales', 'regional')
      .where('regional.idRegional = :idRegional', { idRegional })
      .getMany();

    console.log(respuesta);
    return ResponseUtil.success(respuesta, 'Empresas encontradas');
  }

  //Listar empresas por numero patronal
  @CatchErrors()
  async findEmpresaByNumeroPatronal(empPatronal: string) {
    const respuesta = await this.empresaRepository.findOne({
      where: { empNpatronal: empPatronal },
    });
    if (!respuesta) {
      return ResponseUtil.error('No se encontró la empresa');
    }
    return ResponseUtil.success(respuesta, 'Empresa encontrada');
  }

  @CatchErrors()
  async findOneEmpresaByNroPatronal(empNpatronal: string) {
    const empresa = await this.empresaRepository.findOne({
      where: { empNpatronal: empNpatronal },
    });
    //console.log(empresa);
    if (!empresa) {
      return ResponseUtil.error('No se encontró la empresa');
    }
    return ResponseUtil.success(empresa, 'Empresa encontrada');
  }

  @CatchErrors()
  async findEmpleadoByEmpNpatronal(
    empNpatronal: string,
    { limit, offset }: PaginationQueryDto,
  ) {
    const exitEmpresa = await this.findEmpresaByNroPatronal(empNpatronal);
    if (exitEmpresa.data) {
      return ResponseUtil.error('No se encontró la empresa');
    }

    const query = `
      SELECT empleado.*
      FROM empleado
      INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
      WHERE empresa.emp_npatronal = $1
      AND empleado.validado_afilaciones = TRUE
      AND empleado.activo = true  -- Asumiendo que ase_estado es la columna que indica si un empleado está activo
      LIMIT $2 OFFSET $3;
    `;

    const empleados = await this.empresaRepository.query(query, [
      empNpatronal,
      limit,
      (offset - 1) * limit,
    ]);

    const countQuery = `
      SELECT COUNT(*)
      FROM empleado
      INNER JOIN empresa ON empresa.id_empresa = empleado.id_empresa
      WHERE empresa.emp_npatronal = $1
      AND empleado.validado_afilaciones = TRUE
      AND empleado.activo = true;
    `;

    const result = await this.empresaRepository.query(countQuery, [
      empNpatronal,
    ]);
    const total = result[0].count;

    // Inicializar un array vacío para almacenar la información de los empleados
    const empleadosInfo = [];

    // Iterar sobre los resultados y mapear la información de los empleados
    if (empleados && empleados.length > 0) {
      empleados.forEach((empleado) => {
        const empleadoInfo = {
          idEmpleado: empleado.id_empleado,
          nombresYapellidos:
            empleado.ase_nom +
            ' ' +
            empleado.ase_apat +
            ' ' +
            empleado.ase_amat,
          ci: empleado.ase_ci,
          cargo: empleado.ase_cargo,
          fechaIngreso: empleado.ase_fini_emp,
          fechaRetiro: '',
          diasTrabajados: 30,
          totalGanado: empleado.ase_haber,
          totalDescuento: 0,
          fecha: '',
          matricula: empleado.ase_mat,
          observaciones: '',
        };
        empleadosInfo.push(empleadoInfo);
      });
    }

    return {
      data: empleadosInfo,
      count: total,
      page: offset,
      pageSize: limit,
    };
  }

  //TODO:Listar nombre las empresas sin repeticiones
  @CatchErrors()
  async findAllNombreEmpresa() {
    const empresas = await this.empresaRepository
      .createQueryBuilder('e')
      .select('DISTINCT e.emp_nom', 'emp_nom')
      .where('e.activo = :activo', { activo: true })
      .getRawMany();

    return ResponseUtil.success(
      transformaCamelCaseArrayObjeto(empresas),
      'Listado exitoso',
    );
  }

  @CatchErrors()
  async findRegionalByEmpNpatronal(empNpatronalString: string): Promise<any> {
    const query = `
        SELECT e.emp_npatronal, r.nombre_regional 
        FROM (
            SELECT unnest(string_to_array($1, ', ')) AS emp_npatronal
        ) AS subquery
        INNER JOIN empresa e ON e.emp_npatronal = subquery.emp_npatronal
        INNER JOIN regional r ON e.id_regional = r.id_regional;
    `;

    const result = await this.empresaRepository.query(query, [
      empNpatronalString,
    ]);

    return ResponseUtil.success(
      transformaCamelCaseArrayObjeto(result),
      'Listado exitoso',
    );
  }

  @CatchErrors()
  async obtenerIdEmpresaByEmpNpatronal(empNpatronal: string) {
    const empresa = await this.empresaRepository.findOne({
      where: { empNpatronal: empNpatronal },
      select: ['idEmpresa'],
    });

    if (!empresa) {
      ResponseUtil.error(
        `No existe la empresa con el Número Patronal ${empNpatronal}`,
      );
    }

    return ResponseUtil.success(empresa, 'Id empresa');
  }
}
