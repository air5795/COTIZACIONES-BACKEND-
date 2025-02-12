import { Injectable } from '@nestjs/common';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { CreateParClasificadorDetalleDto } from '../dto/par-clasificador-detalle.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ParClasificadorDetalle } from '../entity/par-clasificador-detalle.entity';
import { Repository } from 'typeorm';
import { ResponseUtil } from 'src/core/utility/response-util';

@Injectable()
export class ParClasificadorDetalleService {
  constructor(
    @InjectRepository(ParClasificadorDetalle)
    private _parClasificadorDetalleRepository: Repository<ParClasificadorDetalle>,
  ) {}

  @CatchErrors()
  async create(createDto: CreateParClasificadorDetalleDto) {
    // Validación por Nombre (asumiendo que quieres mantener esta validación)
    const existingNombre = await this._parClasificadorDetalleRepository.findOne({
      where: {
        nombreClasificadorDetalle: createDto.nombreClasificadorDetalle,
      },
    });
    if (existingNombre) {
      return ResponseUtil.error('Ya existe un nombre igual.');
    }

    const tipoPlanilla = this._parClasificadorDetalleRepository.create(createDto);
    const respuesta = await this._parClasificadorDetalleRepository.save(tipoPlanilla);
    return ResponseUtil.success(
      respuesta,
      'Parametrica creada exitosamente',
    );
  }

  @CatchErrors()
  async update(idClasificadorDetalle: number, updateDto: CreateParClasificadorDetalleDto) {
    const existingParClasificadorDetalle = await this._parClasificadorDetalleRepository.findOne({
      where: {
        idClasificadorDetalle: idClasificadorDetalle,
      },
    });
    if (!existingParClasificadorDetalle) {
      return ResponseUtil.error(
        'El registro que intentas actualizar no existe.',
      );
    }

    const existingNombre = await this._parClasificadorDetalleRepository.findOne({
      where: {
        nombreClasificadorDetalle: updateDto.nombreClasificadorDetalle,
        idClasificadorDetalle: idClasificadorDetalle,
      },
    });
    if (existingNombre) {
      return ResponseUtil.error(
        'Ya existe un tipo de planilla con ese nombre.',
      );
    }
    const updatedTipoPlanilla = this._parClasificadorDetalleRepository.merge(
      existingParClasificadorDetalle,
      updateDto,
    );
    const respuesta = await this._parClasificadorDetalleRepository.save(
      updatedTipoPlanilla,
    );
    if (!respuesta) {
      ResponseUtil.error('No se pudo actualizar el tipo de planilla.');
    }
    return ResponseUtil.success(
      respuesta,
      'Tipo de planilla actualizado exitosamente',
    );
  }

  @CatchErrors()
  async findByIdentificador(identificadorClasificador: string,): Promise<any> {
    const clasificadorDetalle = await this._parClasificadorDetalleRepository.find({
      select: {
        idClasificadorDetalle: true,
        identificadorClasificadorDetalle: true,
        identificadorClasificador: true,
        nombreClasificadorDetalle: true,
        descripcionClasificadorDetalle: true,
        orden: true,
        fechaRegistro: true,
      },
      where: {
        identificadorClasificador: identificadorClasificador,
        bajaLogicaRegistro: false,
      },
      order: {
        orden: 'asc',
      },
    });

    if (!clasificadorDetalle || clasificadorDetalle.length === 0) {
      return ResponseUtil.error('No se encontraron parametricas para el clasificador solicitado.');
    }

    return ResponseUtil.success(
      clasificadorDetalle,
      'Recuperación exitosa de las paramétricas solicitadas.',
    );
  }
}
