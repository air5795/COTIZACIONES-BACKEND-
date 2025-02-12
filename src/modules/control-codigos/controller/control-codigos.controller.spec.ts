import { Test, TestingModule } from '@nestjs/testing';
import { ControlCodigosController } from './control-codigos.controller';

describe('ControlCodigosController', () => {
  let controller: ControlCodigosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControlCodigosController],
    }).compile();

    controller = module.get<ControlCodigosController>(ControlCodigosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
