import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SalarioMinimoEntity } from '../entity/salario-minimo.entity';
import { Repository } from 'typeorm';
import { CreateSalarioMinimoDTO } from '../dto/salario-minimo.dto';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { ResponseUtil } from 'src/core/utility/response-util';
import { ISalarioMinimo } from '../interfaces/salario-minimo.inteface';

@Injectable()
export class SalarioMinimoService {
  constructor(
    @InjectRepository(SalarioMinimoEntity)
    private salarioMinimoRepository: Repository<SalarioMinimoEntity>,
  ) {}
  /*
   * @Description: Servicio para registrar un salario minimo
   */
  @CatchErrors()
  async create(createDto: CreateSalarioMinimoDTO) {
    const existingSalarioMinimo = await this.salarioMinimoRepository.findOne({
      where: {
        gestion: createDto.gestion,
      },
    });

    if (existingSalarioMinimo) {
      return ResponseUtil.error(
        'Ya existe un salario minimo para esta gestion',
      );
    }
    // Establecer la columna 'vigente' de todos los registros anteriores a 'false'
    await this.salarioMinimoRepository.update(
      {},
      { vigente: false, activo: false },
    );

    const salarioMinimo = this.salarioMinimoRepository.create(createDto);
    const respuesta = await this.salarioMinimoRepository.save(salarioMinimo);
    return ResponseUtil.success(
      respuesta,
      'Salario minimo creado exitosamente',
    );
  }

  /*
   * @Description: Servicio para retornar el salario minimo vigente
   */
  @CatchErrors()
  async getSalarioMinimoVigente() {
    const salarioMinimo: ISalarioMinimo =
      await this.salarioMinimoRepository.findOne({
        select: { idSalarioMinimo: true, monto: true, gestion: true },
        where: { activo: true, vigente: true },
      });
    if (salarioMinimo) {
      return ResponseUtil.success(
        salarioMinimo,
        'Salario minimo vigente recuperado con éxito.',
      );
    }
    return ResponseUtil.error('No hay salario minimo vigente.');
  }
}
