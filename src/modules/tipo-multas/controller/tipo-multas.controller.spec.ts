import { Test, TestingModule } from '@nestjs/testing';
import { TipoMultasController } from './tipo-multas.controller';

describe('TipoMultasController', () => {
  let controller: TipoMultasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoMultasController],
    }).compile();

    controller = module.get<TipoMultasController>(TipoMultasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
