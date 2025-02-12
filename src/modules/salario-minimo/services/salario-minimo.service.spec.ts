import { Test, TestingModule } from '@nestjs/testing';
import { SalarioMinimoService } from './salario-minimo.service';

describe('SalarioMinimoService', () => {
  let service: SalarioMinimoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalarioMinimoService],
    }).compile();

    service = module.get<SalarioMinimoService>(SalarioMinimoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
