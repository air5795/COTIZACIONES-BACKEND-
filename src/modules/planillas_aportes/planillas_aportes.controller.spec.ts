import { Test, TestingModule } from '@nestjs/testing';
import { PlanillasAportesController } from './planillas_aportes.controller';
import { PlanillasAportesService } from './planillas_aportes.service';

describe('PlanillasAportesController', () => {
  let controller: PlanillasAportesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanillasAportesController],
      providers: [PlanillasAportesService],
    }).compile();

    controller = module.get<PlanillasAportesController>(PlanillasAportesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
