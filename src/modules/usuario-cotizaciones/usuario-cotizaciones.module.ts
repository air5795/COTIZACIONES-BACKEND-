import { Module } from '@nestjs/common';
import { UsuarioCotizacionesService } from './services/usuario-cotizaciones.service';
import { UsuarioCotizacionesController } from './controller/usuario-cotizaciones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioCotizacionesEntity } from './entity/usuario-cotizaciones.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioCotizacionesEntity])],
  providers: [UsuarioCotizacionesService],
  controllers: [UsuarioCotizacionesController],
})
export class UsuarioCotizacionesModule {}
