import { Test, TestingModule } from '@nestjs/testing';
import { TasaInteresAporteController } from './tasa-interes-aporte.controller';

describe('TasaInteresAporteController', () => {
  let controller: TasaInteresAporteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasaInteresAporteController],
    }).compile();

    controller = module.get<TasaInteresAporteController>(TasaInteresAporteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
