import { Test, TestingModule } from '@nestjs/testing';
import { PlanillasAportesService } from './planillas_aportes.service';

describe('PlanillasAportesService', () => {
  let service: PlanillasAportesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanillasAportesService],
    }).compile();

    service = module.get<PlanillasAportesService>(PlanillasAportesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
