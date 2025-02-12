import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegionalEntity } from '../entity/regional.entity';
import { Repository } from 'typeorm';
import { CreateRegionalDto } from '../dto/regional.dto';
import { CatchErrors } from '../../../core/decorators/catch.decorator';
import { ResponseUtil } from '../../../core/utility/response-util';
import { transformaCamelCaseArrayObjeto } from 'src/core/utility/camel-case.util';

@Injectable()
export class RegionalService {
  constructor(
    @InjectRepository(RegionalEntity)
    private regionalRepository: Repository<RegionalEntity>,
  ) {}

  /*
   * @Description: Servicio para registrar una regional
   */
  @CatchErrors()
  async create(createDto: CreateRegionalDto) {
    const existingRegional = await this.regionalRepository.findOne({
      where: {
        idRegional: createDto.idRegional,
      },
    });
    if (existingRegional) {
      throw new ConflictException('Un registro con este ID ya existe.');
    }
    const existingNombre = await this.regionalRepository.findOne({
      where: {
        nombreRegional: createDto.nombreRegional,
      },
    });
    if (existingNombre) {
      throw new ConflictException('Ya existe un nombre igual.');
    }
    const regional = this.regionalRepository.create(createDto);
    const respuesta = await this.regionalRepository.save(regional);
    return ResponseUtil.success(respuesta, 'Regional creado exitosamente');
  }

  @CatchErrors()
  async listAll() {
    const regionales = await this.regionalRepository.find();

    if (regionales && regionales.length > 0) {
      return ResponseUtil.success(
        regionales,
        'Lista de regionales recuperada con éxito.',
      );
    } else {
      return ResponseUtil.error('No hay regionales disponibles.');
    }
  }

  @CatchErrors()
  async findByRegionalId(idRegional: number) {
    // Busca la Regional usando el idRegional
    const regional = await this.regionalRepository.findOne({
      where: { idRegional: idRegional },
      relations: ['empresas'],
    });

    // Si no existe la Regional, arroja una excepción
    if (!regional) {
      ResponseUtil.error('Regional no encontrada');
    }

    // Si la regional no tiene empresas asociadas, arroja otra excepción
    if (!regional.empresas || regional.empresas.length === 0) {
      ResponseUtil.error(
        'No se encontraron empresas para el idRegional proporcionado',
      );
    }
    // Devuelve las empresas asociadas a la regional
    return ResponseUtil.success(
      regional,
      'Lista de empresas recuperada con éxito.',
    );
  }
  @CatchErrors()
  async findByNomEmpresa(nomEmpresa: string) {
    const result = await this.regionalRepository
      .createQueryBuilder('r')
      .select('DISTINCT r.nombre_regional', 'nombre_regional')
      .addSelect('r.id_regional', 'id_regional')
      .addSelect('e.emp_npatronal', 'emp_npatronal')
      .innerJoin('r.empresas', 'e') // Asumiendo que 'empresas' es el nombre de la relación en la entidad 'Regional'
      .where('e.emp_nom = :empNom', { empNom: nomEmpresa })
      .getRawMany();
    return ResponseUtil.success(
      transformaCamelCaseArrayObjeto(result),
      'Listado exitoso',
    );
  }
}
