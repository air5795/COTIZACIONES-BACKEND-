import { Test, TestingModule } from '@nestjs/testing';
import { RegionalService } from './regional.service';

describe('RegionalService', () => {
  let service: RegionalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegionalService],
    }).compile();

    service = module.get<RegionalService>(RegionalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
