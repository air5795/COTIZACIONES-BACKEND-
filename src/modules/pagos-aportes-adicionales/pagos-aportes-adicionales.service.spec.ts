import { Test, TestingModule } from '@nestjs/testing';
import { PagosAportesAdicionalesService } from './pagos-aportes-adicionales.service';

describe('PagosAportesAdicionalesService', () => {
  let service: PagosAportesAdicionalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PagosAportesAdicionalesService],
    }).compile();

    service = module.get<PagosAportesAdicionalesService>(PagosAportesAdicionalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
