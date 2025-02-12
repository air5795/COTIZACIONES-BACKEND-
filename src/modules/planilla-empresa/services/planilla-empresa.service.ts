import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanillaEmpresaEntity } from '../entity/planilla-empresa.entity';
import { Repository } from 'typeorm';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { ResponseUtil } from 'src/core/utility/response-util';
import { UpdatePlanillaEmpresaDto } from '../dto/planilla-empresa.dto';
import { transformaCamelCaseArrayObjeto } from 'src/core/utility/camel-case.util';
import { Console } from 'console';

@Injectable()
export class PlanillaEmpresaService {
  constructor(
    @InjectRepository(PlanillaEmpresaEntity)
    private readonly planillaEmpresaRepository: Repository<PlanillaEmpresaEntity>,
  ) {}
 //TODO:Lista los empleados por el numero patronal asignados en una planilla
 async getAllPlanillaEmpresa(
  estadoPlanilla: string,
) {
  const query = `
    SELECT 
      pe.*,
      emp.emp_nom,
      re.nombre_regional,
      cd.nombre_clasificador_detalle AS estado,
      to_char(pe.created_at,'DD/MM/YYYY') AS fecha_registro,
      to_char(pe.updated_at,'DD/MM/YYYY') AS fecha_modificacion
    FROM public.planilla_empresa pe
    INNER JOIN parametro.par_clasificador_detalle cd ON pe.estado_planilla = cd.identificador_clasificador_detalle
    INNER JOIN public.empresa emp ON pe.emp_npatronal = emp.emp_npatronal
    INNER JOIN public.regional re ON emp.emp_reg = re.id_regional
    WHERE pe.estado_planilla = $1
    ORDER BY pe.gestion, pe.periodo DESC
  `;

  const planillasAportes = await this.planillaEmpresaRepository.query(query, [
    estadoPlanilla
  ]);

  if (planillasAportes.length === 0) {
    return ResponseUtil.error(
      'No se encontraron empleados, no realizo el cargado masivo',
    );
  }
  
  const countQuery = `
    SELECT 
      COUNT(*)
    FROM public.planilla_empresa pe
    INNER JOIN parametro.par_clasificador_detalle cd ON pe.estado_planilla = cd.identificador_clasificador_detalle
    INNER JOIN public.empresa emp ON pe.emp_npatronal = emp.emp_npatronal
    INNER JOIN public.regional re ON emp.emp_reg = re.id_regional
    WHERE pe.estado_planilla = $1
  `;
  const result = await this.planillaEmpresaRepository.query(countQuery, [
    estadoPlanilla
  ]);
  const total = result[0].count;
  console.log(total);
  return ResponseUtil.success({
    data: transformaCamelCaseArrayObjeto(planillasAportes),
    count: total,
    page: 0,
    pageSize: 10,
  });
}
  @CatchErrors()
  async getPlanillaEmpresaByEmpNpatronal(empNpatronal: string): Promise<any> {
    //como en planilla igual almaceno el numero patronal puedo verificar si existe la primera creacion
    const empresasGestion = await this.planillaEmpresaRepository.find({
      where: { empNpatronal: empNpatronal },
      order: { periodo: 'DESC' },
    });
    if (!empresasGestion) {
      return ResponseUtil.error('No se encontraron planillas para la empresa');
    }
    return ResponseUtil.success(empresasGestion, 'Empresa encontrada');
  }
  @CatchErrors()
  async findPlanillaVerificada(
    mes: number,
    gestion: number,
    empNpatronal: string
  ): Promise<any> {
    //como en planilla igual almaceno el numero patronal puedo verificar si existe la primera creacion
    const empresasGestion = await this.planillaEmpresaRepository.find({
      where: { 
        periodo: mes,
        gestion: gestion,
        empNpatronal: empNpatronal,
        estadoValidacionAfiliacion: 'ESTADO_VERIFICADO'
      },
    });
    if (empresasGestion.length > 0) {
      return ResponseUtil.success(empresasGestion, '¡El periodo y gestión seleccionado ya cuenta con la validación realizada!');
    }else{
      return ResponseUtil.error('¡No se encontraron planillas para el periodo seleccionado!');  
    }
  }
  @CatchErrors()
  async createPlanillaEmpresa(
    empNpatronal: string,
    periodo: number,
    gestion: number,
  ) {
    const planillaEmpresa = new PlanillaEmpresaEntity();
    planillaEmpresa.periodo = periodo;
    planillaEmpresa.gestion = gestion;
    planillaEmpresa.empNpatronal = empNpatronal;
    planillaEmpresa.estadoPlanilla = 'ESTADO_INICIALIZADO';
    const respuesta = await this.planillaEmpresaRepository.save(
      planillaEmpresa,
    );
    if (!respuesta) {
      return ResponseUtil.error('No se pudo crear la planilla');
    }
    return ResponseUtil.success(respuesta.idPlanillaEmpresa, 'Planilla creada exitosamente');
  }
  //Metodo para un solo update de una planilla
  @CatchErrors()
  async updatePlanillaEmpresa(
    idPlanillaEmpresa: number,
    updatePlanillaEmpresaDto: UpdatePlanillaEmpresaDto,
  ): Promise<ResponseUtil> {
    const existingPlanillaEmpresa = await this.planillaEmpresaRepository.findOne({
      where: { idPlanillaEmpresa: idPlanillaEmpresa },
    });
    if (!existingPlanillaEmpresa) {
      ResponseUtil.error('No se registro la planilla del periodo y gestión solicitada');
    }
    const updatePlanillaEmpresa = this.planillaEmpresaRepository.merge(
      existingPlanillaEmpresa,
      updatePlanillaEmpresaDto,
    );
    const respuesta = await this.planillaEmpresaRepository.save(updatePlanillaEmpresa);
    return ResponseUtil.success(respuesta, '¡Estado de la planilla actualizado!');
  }
}
