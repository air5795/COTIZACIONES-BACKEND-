import { Test, TestingModule } from '@nestjs/testing';
import { ResumenMensualRegionalController } from './resumen-mensual-regional.controller';

describe('ResumenMensualRegionalController', () => {
  let controller: ResumenMensualRegionalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResumenMensualRegionalController],
    }).compile();

    controller = module.get<ResumenMensualRegionalController>(ResumenMensualRegionalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
