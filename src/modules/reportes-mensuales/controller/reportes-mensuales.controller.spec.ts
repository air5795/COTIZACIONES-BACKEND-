import { Test, TestingModule } from '@nestjs/testing';
import { ReportesMensualesController } from './reportes-mensuales.controller';

describe('ReportesMensualesController', () => {
  let controller: ReportesMensualesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportesMensualesController],
    }).compile();

    controller = module.get<ReportesMensualesController>(ReportesMensualesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
