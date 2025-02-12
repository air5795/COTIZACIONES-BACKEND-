import { Test, TestingModule } from '@nestjs/testing';
import { PlanillaEmpresaController } from './planilla-empresa.controller';

describe('PlanillaEmpresaController', () => {
  let controller: PlanillaEmpresaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanillaEmpresaController],
    }).compile();

    controller = module.get<PlanillaEmpresaController>(PlanillaEmpresaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
