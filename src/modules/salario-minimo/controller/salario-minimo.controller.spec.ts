import { Test, TestingModule } from '@nestjs/testing';
import { SalarioMinimoController } from './salario-minimo.controller';

describe('SalarioMinimoController', () => {
  let controller: SalarioMinimoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalarioMinimoController],
    }).compile();

    controller = module.get<SalarioMinimoController>(SalarioMinimoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
