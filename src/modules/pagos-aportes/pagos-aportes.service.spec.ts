import { Test, TestingModule } from '@nestjs/testing';
import { PagosAportesService } from './pagos-aportes.service';

describe('PagosAportesService', () => {
  let service: PagosAportesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PagosAportesService],
    }).compile();

    service = module.get<PagosAportesService>(PagosAportesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
