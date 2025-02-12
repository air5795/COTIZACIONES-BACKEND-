import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TasaInteresAporteEntity } from '../entity/tasa-interes-aporte.entity';
import { Repository } from 'typeorm';
import { CreateTasaInteresDTO } from '../dto/tasa-interes-aporte.dto';
import { ResponseUtil } from '../../../core/utility/response-util';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { ITasaInteresAporte } from '../interfaces/tasa-interes-aporte.interface';

@Injectable()
export class TasaInteresAporteService {
  constructor(
    @InjectRepository(TasaInteresAporteEntity)
    private tasaInteresAporteRepository: Repository<TasaInteresAporteEntity>,
  ) {}

  @CatchErrors()
  async create(createDto: CreateTasaInteresDTO) {
    createDto.porcentaje = createDto.valor / 100;
    const tasaInteresAporte =
      this.tasaInteresAporteRepository.create(createDto);
    const respuesta = await this.tasaInteresAporteRepository.save(
      tasaInteresAporte,
    );
    return ResponseUtil.success(respuesta, 'Registro creado exitosamente');
  }

  @CatchErrors()
  async findTazaInteresVigente() {
    const tasaInteres: ITasaInteresAporte =
      await this.tasaInteresAporteRepository.findOne({
        select: { idTasa: true, valor: true, porcentaje: true },
        where: { vigente: true },
      });
    if (tasaInteres) {
      return ResponseUtil.success(
        tasaInteres,
        'Tasa de interes vigente recuperada con éxito.',
      );
    }
    return ResponseUtil.error('No hay tasa de interes vigente.');
  }
}
