import { Injectable } from '@nestjs/common';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { CreateTipoIncapacidadDto } from '../dto/tipo-incapacidad.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TipoIncapacidadEntity } from '../entity/tipo-incapacidad.entity';
import { Repository } from 'typeorm';
import { ResponseUtil } from 'src/core/utility/response-util';

@Injectable()
export class TipoIncapacidadService {
  constructor(
    @InjectRepository(TipoIncapacidadEntity)
    private tipoIncapacidadRepository: Repository<TipoIncapacidadEntity>,
  ) {}

  @CatchErrors()
  async createTipoIncapacidad(tipoIncapacidadDto: CreateTipoIncapacidadDto) {
    const exists = await this.tipoIncapacidadRepository.findOne({
      where: { nombre: tipoIncapacidadDto.nombre },
    });
    if (exists) {
      return ResponseUtil.error(
        `Ya existe un registro con el nombre ${tipoIncapacidadDto.nombre}`,
      );
    }
    tipoIncapacidadDto.porcentajeDecimal = tipoIncapacidadDto.porcentaje / 100;
    const tipoIncapacidad =
      this.tipoIncapacidadRepository.create(tipoIncapacidadDto);
    const respuesta = await this.tipoIncapacidadRepository.save(
      tipoIncapacidad,
    );
    return ResponseUtil.success(respuesta, 'Registro creado exitosamente');
  }
  @CatchErrors()
  async findAllTipoIncapacidad() {
    const respuesta = await this.tipoIncapacidadRepository.find();
    if (respuesta.length === 0) {
      ResponseUtil.error('No hay registros');
    }
    return ResponseUtil.success(respuesta);
  }
}
