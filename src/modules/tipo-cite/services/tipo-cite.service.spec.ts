import { Test, TestingModule } from '@nestjs/testing';
import { TipoCiteService } from './tipo-cite.service';

describe('TipoCiteService', () => {
  let service: TipoCiteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipoCiteService],
    }).compile();

    service = module.get<TipoCiteService>(TipoCiteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
