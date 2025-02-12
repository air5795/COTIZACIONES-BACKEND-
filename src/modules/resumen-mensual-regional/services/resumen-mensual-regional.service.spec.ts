import { Test, TestingModule } from '@nestjs/testing';
import { ResumenMensualRegionalService } from './resumen-mensual-regional.service';

describe('ResumenMensualRegionalService', () => {
  let service: ResumenMensualRegionalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResumenMensualRegionalService],
    }).compile();

    service = module.get<ResumenMensualRegionalService>(ResumenMensualRegionalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
