import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioCotizacionesController } from './usuario-cotizaciones.controller';

describe('UsuarioCotizacionesController', () => {
  let controller: UsuarioCotizacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuarioCotizacionesController],
    }).compile();

    controller = module.get<UsuarioCotizacionesController>(UsuarioCotizacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
