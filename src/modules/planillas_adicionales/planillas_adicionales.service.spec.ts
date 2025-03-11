import { Test, TestingModule } from '@nestjs/testing';
import { PlanillasAdicionalesService } from './planillas_adicionales.service';

describe('PlanillasAdicionalesService', () => {
  let service: PlanillasAdicionalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanillasAdicionalesService],
    }).compile();

    service = module.get<PlanillasAdicionalesService>(PlanillasAdicionalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
