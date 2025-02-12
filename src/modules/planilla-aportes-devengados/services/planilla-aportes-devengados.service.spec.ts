import { Test, TestingModule } from '@nestjs/testing';
import { PlanillaAportesDevengadosService } from './planilla-aportes-devengados.service';

describe('PlanillaAportesDevengadosService', () => {
  let service: PlanillaAportesDevengadosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanillaAportesDevengadosService],
    }).compile();

    service = module.get<PlanillaAportesDevengadosService>(PlanillaAportesDevengadosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
