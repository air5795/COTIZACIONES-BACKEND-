import { Test, TestingModule } from '@nestjs/testing';
import { MultasController } from './multas.controller';

describe('MultasController', () => {
  let controller: MultasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultasController],
    }).compile();

    controller = module.get<MultasController>(MultasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
