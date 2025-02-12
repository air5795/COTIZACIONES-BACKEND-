import { Test, TestingModule } from '@nestjs/testing';
import { PlanillaIncapacidadesController } from './planilla-incapacidades.controller';

describe('PlanillaIncapacidadesController', () => {
  let controller: PlanillaIncapacidadesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanillaIncapacidadesController],
    }).compile();

    controller = module.get<PlanillaIncapacidadesController>(PlanillaIncapacidadesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
