import { Test, TestingModule } from '@nestjs/testing';
import { ReportesMensualesService } from './reportes-mensuales.service';

describe('ReportesMensualesService', () => {
  let service: ReportesMensualesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportesMensualesService],
    }).compile();

    service = module.get<ReportesMensualesService>(ReportesMensualesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
