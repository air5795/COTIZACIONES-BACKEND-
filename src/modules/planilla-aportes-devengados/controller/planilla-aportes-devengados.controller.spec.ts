import { Test, TestingModule } from '@nestjs/testing';
import { PlanillaAportesDevengadosController } from './planilla-aportes-devengados.controller';

describe('PlanillaAportesDevengadosController', () => {
  let controller: PlanillaAportesDevengadosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanillaAportesDevengadosController],
    }).compile();

    controller = module.get<PlanillaAportesDevengadosController>(PlanillaAportesDevengadosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
