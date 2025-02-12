import { Test, TestingModule } from '@nestjs/testing';
import { PlanillaIncapacidadesService } from './planilla-incapacidades.service';

describe('PlanillaIncapacidadesService', () => {
  let service: PlanillaIncapacidadesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanillaIncapacidadesService],
    }).compile();

    service = module.get<PlanillaIncapacidadesService>(PlanillaIncapacidadesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
