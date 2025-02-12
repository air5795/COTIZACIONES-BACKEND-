import { Test, TestingModule } from '@nestjs/testing';
import { PlanillaController } from './planilla.controller';

describe('PlanillaController', () => {
  let controller: PlanillaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanillaController],
    }).compile();

    controller = module.get<PlanillaController>(PlanillaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
