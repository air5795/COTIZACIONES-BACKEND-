import { Test, TestingModule } from '@nestjs/testing';
import { PagosAportesController } from './pagos-aportes.controller';
import { PagosAportesService } from './pagos-aportes.service';

describe('PagosAportesController', () => {
  let controller: PagosAportesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagosAportesController],
      providers: [PagosAportesService],
    }).compile();

    controller = module.get<PagosAportesController>(PagosAportesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
