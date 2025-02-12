import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioCotizacionesEntity } from '../entity/usuario-cotizaciones.entity';
import { Repository } from 'typeorm';
import { CatchErrors } from 'src/core/decorators/catch.decorator';
import { ResponseUtil } from 'src/core/utility/response-util';
import { CreateUsuarioCotizacionesDto } from '../dto/usuario-cotizaciones.dto';

@Injectable()
export class UsuarioCotizacionesService {
  constructor(
    @InjectRepository(UsuarioCotizacionesEntity)
    private usuarioCotizacionesRepository: Repository<UsuarioCotizacionesEntity>,
  ) {}

  @CatchErrors()
  async findUsuarioCotizaciones(idUsuario: number, nomUsuario: string) {
    const usuarioCotizaciones =
      await this.usuarioCotizacionesRepository.findOne({
        select: {
          idUsuarioCotizaciones: true,
          nomCompleto: true,
          regional: true,
          empNom: true,
        },
        where: { idUsuario: idUsuario, nomUsuario: nomUsuario },
      });
    if (usuarioCotizaciones) {
      return ResponseUtil.success(
        usuarioCotizaciones,
        'Se encuentra registrado',
      );
    }
    return ResponseUtil.error('No se encuentra registrado');
  }

  @CatchErrors()
  async createUsuarioCotizaciones(
    usuarioCotizacionesDto: CreateUsuarioCotizacionesDto,
  ) {
    const create = this.usuarioCotizacionesRepository.create(
      usuarioCotizacionesDto,
    );
    const usuarioCotizaciones = await this.usuarioCotizacionesRepository.save(
      create,
    );
    if (usuarioCotizaciones) {
      return ResponseUtil.success(
        usuarioCotizaciones,
        'Se registro correctamente',
      );
    }
    return ResponseUtil.error('No se pudo registrar');
  }

  @CatchErrors()
  async findRegionalesByUsuarioByEmpNom(
    usuario: string,
    empNom: string,
    idUsuario: number,
  ) {
    const regionales = await this.usuarioCotizacionesRepository.find({
      select: {
        regional: true,
      },
      where: {
        nomUsuario: usuario,
        empNom: empNom,
        idUsuario: idUsuario,
      },
    });
    if (regionales) {
      return ResponseUtil.success(regionales, 'Se encontraron regionales');
    }
    return ResponseUtil.error('No se encontraron regionales');
  }
}
