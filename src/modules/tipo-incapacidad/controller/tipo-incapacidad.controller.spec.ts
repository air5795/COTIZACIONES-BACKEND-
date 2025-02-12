import { Test, TestingModule } from '@nestjs/testing';
import { TipoIncapacidadController } from './tipo-incapacidad.controller';

describe('TipoIncapacidadController', () => {
  let controller: TipoIncapacidadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoIncapacidadController],
    }).compile();

    controller = module.get<TipoIncapacidadController>(TipoIncapacidadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
