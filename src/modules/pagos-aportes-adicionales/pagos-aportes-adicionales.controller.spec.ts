import { Test, TestingModule } from '@nestjs/testing';
import { PagosAportesAdicionalesController } from './pagos-aportes-adicionales.controller';
import { PagosAportesAdicionalesService } from './pagos-aportes-adicionales.service';

describe('PagosAportesAdicionalesController', () => {
  let controller: PagosAportesAdicionalesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagosAportesAdicionalesController],
      providers: [PagosAportesAdicionalesService],
    }).compile();

    controller = module.get<PagosAportesAdicionalesController>(PagosAportesAdicionalesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
