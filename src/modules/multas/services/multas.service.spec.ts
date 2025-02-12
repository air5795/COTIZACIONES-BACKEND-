import { Test, TestingModule } from '@nestjs/testing';
import { MultasService } from './multas.service';

describe('MultasService', () => {
  let service: MultasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MultasService],
    }).compile();

    service = module.get<MultasService>(MultasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
