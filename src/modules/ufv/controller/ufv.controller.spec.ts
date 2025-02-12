import { Test, TestingModule } from '@nestjs/testing';
import { UfvController } from './ufv.controller';

describe('UfvController', () => {
  let controller: UfvController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UfvController],
    }).compile();

    controller = module.get<UfvController>(UfvController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
