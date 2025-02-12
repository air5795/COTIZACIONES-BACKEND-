import { Test, TestingModule } from '@nestjs/testing';
import { TipoCiteController } from './tipo-cite.controller';

describe('TipoCiteController', () => {
  let controller: TipoCiteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoCiteController],
    }).compile();

    controller = module.get<TipoCiteController>(TipoCiteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
