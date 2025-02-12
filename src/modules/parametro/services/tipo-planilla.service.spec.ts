import { Test, TestingModule } from '@nestjs/testing';
import { TipoPlanillaService } from '../../tipo-planilla/services/tipo-planilla.service';

describe('TipoPlanillaService', () => {
  let service: TipoPlanillaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipoPlanillaService],
    }).compile();

    service = module.get<TipoPlanillaService>(TipoPlanillaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
