import { Test, TestingModule } from '@nestjs/testing';
import { RegionalController } from './regional.controller';

describe('RegionalController', () => {
  let controller: RegionalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegionalController],
    }).compile();

    controller = module.get<RegionalController>(RegionalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
