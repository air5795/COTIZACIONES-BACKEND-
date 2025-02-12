import { Test, TestingModule } from '@nestjs/testing';
import { TasaInteresAporteService } from './tasa-interes-aporte.service';

describe('TasaInteresAporteService', () => {
  let service: TasaInteresAporteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasaInteresAporteService],
    }).compile();

    service = module.get<TasaInteresAporteService>(TasaInteresAporteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
