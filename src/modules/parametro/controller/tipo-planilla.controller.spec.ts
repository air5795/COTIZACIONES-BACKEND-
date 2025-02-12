import { Test, TestingModule } from '@nestjs/testing';
import { TipoPlanillaController } from '../../tipo-planilla/controller/tipo-planilla.controller';

describe('TipoPlanillaController', () => {
  let controller: TipoPlanillaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoPlanillaController],
    }).compile();

    controller = module.get<TipoPlanillaController>(TipoPlanillaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
