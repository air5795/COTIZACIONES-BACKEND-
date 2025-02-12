import { Injectable } from '@nestjs/common';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { CreateTipoPlanillaDto } from '../dto/tipo-planilla.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TipoPlanillaEntity } from '../entity/tipo-planilla.entity';
import { Repository } from 'typeorm';
import { ResponseUtil } from 'src/core/utility/response-util';

@Injectable()
export class TipoPlanillaService {
  constructor(
    @InjectRepository(TipoPlanillaEntity)
    private tipoPlanillaRepository: Repository<TipoPlanillaEntity>,
  ) {}

  @CatchErrors()
  async create(createDto: CreateTipoPlanillaDto) {
    // Validación por Nombre (asumiendo que quieres mantener esta validación)
    const existingNombre = await this.tipoPlanillaRepository.findOne({
      where: {
        nombre: createDto.nombre,
      },
    });
    if (existingNombre) {
      return ResponseUtil.error('Ya existe un nombre igual.');
    }

    const tipoPlanilla = this.tipoPlanillaRepository.create(createDto);
    const respuesta = await this.tipoPlanillaRepository.save(tipoPlanilla);
    return ResponseUtil.success(
      respuesta,
      'Tipo de planilla creado exitosamente',
    );
  }

  @CatchErrors()
  async update(idTipoPlanilla: number, updateDto: CreateTipoPlanillaDto) {
    const existingTipoPlanilla = await this.tipoPlanillaRepository.findOne({
      where: {
        idTipoPlanilla: idTipoPlanilla,
      },
    });
    if (!existingTipoPlanilla) {
      return ResponseUtil.error(
        'El registro que intentas actualizar no existe.',
      );
    }

    const existingNombre = await this.tipoPlanillaRepository.findOne({
      where: {
        nombre: updateDto.nombre,
        idTipoPlanilla: idTipoPlanilla,
      },
    });
    if (existingNombre) {
      return ResponseUtil.error(
        'Ya existe un tipo de planilla con ese nombre.',
      );
    }
    const updatedTipoPlanilla = this.tipoPlanillaRepository.merge(
      existingTipoPlanilla,
      updateDto,
    );
    const respuesta = await this.tipoPlanillaRepository.save(
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
  async findAll(): Promise<any> {
    const tipoPlanillas = await this.tipoPlanillaRepository.find({
      select: { idTipoPlanilla: true, nombre: true },
    });

    if (!tipoPlanillas || tipoPlanillas.length === 0) {
      return ResponseUtil.error('No se encontraron tipos de planilla.');
    }

    return ResponseUtil.success(
      tipoPlanillas,
      'Recuperación exitosa de todos los tipos de planilla.',
    );
  }
}
