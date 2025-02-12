import { Test, TestingModule } from '@nestjs/testing';
import { PlanillaEmpresaService } from './planilla-empresa.service';

describe('PlanillaEmpresaService', () => {
  let service: PlanillaEmpresaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanillaEmpresaService],
    }).compile();

    service = module.get<PlanillaEmpresaService>(PlanillaEmpresaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
