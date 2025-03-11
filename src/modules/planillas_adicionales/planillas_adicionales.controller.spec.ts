import { Test, TestingModule } from '@nestjs/testing';
import { PlanillasAdicionalesController } from './planillas_adicionales.controller';
import { PlanillasAdicionalesService } from './planillas_adicionales.service';

describe('PlanillasAdicionalesController', () => {
  let controller: PlanillasAdicionalesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanillasAdicionalesController],
      providers: [PlanillasAdicionalesService],
    }).compile();

    controller = module.get<PlanillasAdicionalesController>(PlanillasAdicionalesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
