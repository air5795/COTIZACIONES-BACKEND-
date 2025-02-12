import { Test, TestingModule } from '@nestjs/testing';
import { ParteBajaAseguradoController } from './parte-baja-asegurado.controller';

describe('ParteBajaAseguradoController', () => {
  let controller: ParteBajaAseguradoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParteBajaAseguradoController],
    }).compile();

    controller = module.get<ParteBajaAseguradoController>(ParteBajaAseguradoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
