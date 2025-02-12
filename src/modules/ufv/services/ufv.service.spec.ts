import { Test, TestingModule } from '@nestjs/testing';
import { UfvService } from './ufv.service';

describe('UfvService', () => {
  let service: UfvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UfvService],
    }).compile();

    service = module.get<UfvService>(UfvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
